import * as usb from 'usb'
import { EventEmitter } from 'events'
import * as messages from './messages'


// USB Vendor ID for Yamaha
const YAMAHA = 1177
// USB device ID for the O1V96
const O1V96 = 20488
export const MAX_FADER_LEVEL = 1023
const USB_PACKET_SIZE = 64

const MESSAGE_PREAMBLE = [0xf0, 0x43, 0x10, 0x3e, 0x7f, 0x01]

let inEndpoint : usb.InEndpoint | undefined = undefined
let outEndpoint : usb.OutEndpoint | undefined = undefined
let mixer : usb.Device | undefined = undefined
let kernelDriverActive : boolean = false
let deviceInterface : usb.Interface | undefined = undefined


const FADER_MOVE = 'faderMove'
const eventEmitter = new EventEmitter()



function decode7Bit(msb: number, lsb:number) {
  return parseInt((msb << 7 | lsb).toString(2),2)
}


function encode7Bit(n: number) {
  const buffer = []
  do {
    let sevenBits = n & 0x7F  
    buffer.unshift(sevenBits)
    n = n >> 7  
  } while (n > 0)  
  return buffer
}

export function onFaderMove(handler) {
  eventEmitter.on(FADER_MOVE, handler)
}

function messageFromData(data: number[]) {
  // byte 9 indicates param type 
  // 1c is a fader change
  // 1a is channel on/off

  switch( data[9] ) {
    case 0x1C:
      return {
        'type': 'FADER',
        'channel': data[11],
        'level': decode7Bit(data[15], data[17])
      }
    case 0x1A:
      return {
        'type': 'CHANNEL_ENABLE',
        'channel': data[11],
        'enable': new Boolean(data[17])
      }
    default:
      return null
  }
}


function handleTransferResult(error : usb.LibUSBException | undefined) {
  if (error) {
    console.log("handleTransferResult", error)
  }
}


function clamp(n : number, min: number, max: number) {
  if( n < min) {
    return min
  } else if (n > max) {
    return max
  } else {
    return n
  }
}


/**
 * Creates a message to set the mixer's fader level
 * @param channel the 1-indexed channel number
 * @param level decimal value from 0-100 (level is clamped to this range)
 * @returns 
 */
export function createFaderLevelMessage(channel : number, level : number) {
  // kInputFader
  var messageBytes = 
    MESSAGE_PREAMBLE.concat([0x1c, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7])

  messageBytes[8] = channel - 1

  let scaledLevel = 
    clamp(Math.round(MAX_FADER_LEVEL * level / 100), 0, MAX_FADER_LEVEL)

  var levelBytes = encode7Bit(scaledLevel)
  if (levelBytes.length == 1) {
    levelBytes.unshift(0)
  }
  messageBytes[11] = levelBytes[0]
  messageBytes[12] = levelBytes[1]
  return messageBytes
}


function wrapSysexMessage(msg: Buffer) {
  const SYSEX_START_OR_CONTINUE = 0x04
  const SYSEX_END_ONE_BYTE = 0x05
  const SYSEX_END_TWO_BYTES = 0x06
  const SYSEX_END_THREE_BYTES = 0x07
  var wrapped = Buffer.alloc(USB_PACKET_SIZE, 0)
  var bytesRemaining = msg.length
  var sourceOffset = 0
  var destOffset = 0
  while (bytesRemaining >= 3) {
    wrapped.writeUint8(SYSEX_START_OR_CONTINUE, destOffset++)
    wrapped.writeUInt8(msg.readUInt8(sourceOffset++), destOffset++)
    wrapped.writeUInt8(msg.readUInt8(sourceOffset++), destOffset++)
    wrapped.writeUInt8(msg.readUInt8(sourceOffset++), destOffset++)
    bytesRemaining -= 3
  }
  switch (bytesRemaining) {
    case 3:
      wrapped.writeUint8(SYSEX_END_THREE_BYTES, destOffset++)
      wrapped.writeUInt8(msg.readUInt8(sourceOffset++), destOffset++)
      wrapped.writeUInt8(msg.readUInt8(sourceOffset++), destOffset++)
      wrapped.writeUInt8(msg.readUInt8(sourceOffset++), destOffset++)
      break
    case 2:
      wrapped.writeUint8(SYSEX_END_TWO_BYTES, destOffset++)
      wrapped.writeUInt8(msg.readUInt8(sourceOffset++), destOffset++)
      wrapped.writeUInt8(msg.readUInt8(sourceOffset++), destOffset++)
      break
    case 1:
      wrapped.writeUint8(SYSEX_END_ONE_BYTE, destOffset++)
      wrapped.writeUInt8(msg.readUInt8(sourceOffset++), destOffset++)
      break
  }
  return wrapped
}


export function send(msgBytes : number[]) {
  var usbMessage = wrapSysexMessage(Buffer.from(msgBytes))
  if (outEndpoint != undefined) {
    console.log('Sending', usbMessage)
    outEndpoint.transfer(usbMessage, handleTransferResult)
  } else {
    throw new Error("not connected")
  }
}


export function connect() {
  console.log('Connecting...')
  mixer = usb.findByIds(YAMAHA, O1V96)
  if (mixer == undefined) {
    console.log('Yamaha O1V96 not connected')
    return 0
  }
  mixer.open()
  console.log('Found Yamaha O1V96')
  console.log('interfaces', mixer.interfaces)
  if (mixer.interfaces == undefined) return 0

  deviceInterface = mixer.interfaces[0]
  // https://github.com/node-usb/node-usb/issues/174
  if (deviceInterface.isKernelDriverActive()) {
    kernelDriverActive = true
    deviceInterface.detachKernelDriver()
  }
  deviceInterface.claim()
  
  if (deviceInterface.endpoints[0] instanceof usb.OutEndpoint) {
    outEndpoint = deviceInterface.endpoints[0]
  }
  if (deviceInterface.endpoints[1] instanceof usb.InEndpoint) {
    inEndpoint = deviceInterface.endpoints[1]
    inEndpoint.on('data', (data) => {
      // console.log(data.slice(0, 30))
      const message = messageFromData(data)
      console.log(message)
      eventEmitter.emit(FADER_MOVE, message)
    })
    inEndpoint.startPoll(3, 64)
  }
  
  console.log('Connected')
  return 1
}


export function disconnect() {
  console.log('Disconnecting...')
  if (inEndpoint != undefined) {
    inEndpoint.stopPoll(() => {
      if (deviceInterface != undefined) {
        deviceInterface.release(true, (error) => {
          if (error) {console.log('error releasing', error)} 
          else {console.log('released interface')}
          if (kernelDriverActive && deviceInterface != undefined) {
            deviceInterface.detachKernelDriver()
            console.log('Detached kernel driver')
          }
          if (mixer != undefined) {
            mixer.close()
            console.log('Closed device')
          }          
          mixer = undefined
          inEndpoint = undefined
          outEndpoint = undefined
          eventEmitter.removeAllListeners(FADER_MOVE)
          console.log('Disconnected')
        })
      }
    })
  }
}


export function connected() {
  return mixer != undefined
}


export function syncFaders() {
  for(let channel = 1; channel++; channel <= 16) {
    send(messages.kInputFaderRequest( channel))
  }
}


function checkConnected() {
  if (mixer == undefined) {
    connect()
  }
}

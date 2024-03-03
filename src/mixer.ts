import * as usb from 'usb'
import { EventEmitter } from 'events'
import * as messages from './messages'
import { asHexArray } from './util'

// USB Vendor ID for Yamaha
const YAMAHA = 1177
// USB device ID for the O1V96
const O1V96 = 20488
export const MAX_FADER_LEVEL = 1023
const USB_PACKET_SIZE = 64
/** 
 * Controls how often queued USB messages are sent to the mixer. Sending them
 * too quickly (with no delay in between) seems to result in messages being
 * dropped by the mixer. Perhaps there's some element of USB flow control
 * I don't understand yet.
 */
const USB_MESSAGE_SEND_INTERVAL = 5

let inEndpoint : usb.InEndpoint | undefined = undefined
let outEndpoint : usb.OutEndpoint | undefined = undefined
let mixer : usb.Device | undefined = undefined
let kernelDriverActive : boolean = false
let deviceInterface : usb.Interface | undefined = undefined
let messageQueueTimeout : NodeJS.Timeout | undefined = undefined
let messageSendStart : number = 0
let currentMessage : Buffer = Buffer.from([])
const FADER_MOVE = 'faderMove'
const eventEmitter = new EventEmitter()

/**
 * Queues up outgoing USB messages bound for the mixer
 */
const messageQueue: number[][] = []

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

export function onFaderMove(handler: (message: object) => void) {
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
  // Right now I'm just logging if there's an error. Maybe this message is
  // something I can use to signal flow control.
  if (error) {
    console.log("handleTransferResult", error)
  }
  let messageSendDuration = Date.now() - messageSendStart
  console.log(`Sent [${asHexArray([...currentMessage].slice(0,16))}] in ${messageSendDuration}ms`)
  messageSendStart = 0
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
  messageQueue.push(msgBytes)
}


function sendQueuedMessage() {
  if(messageQueue.length > 0 && outEndpoint != undefined) {
    const msgBytes : number[]|undefined = messageQueue.shift()
    if (msgBytes != undefined) {
      const usbMessage = wrapSysexMessage(Buffer.from(msgBytes))
      currentMessage = usbMessage
      messageSendStart = Date.now()
      outEndpoint.transfer(usbMessage, handleTransferResult)
    }
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
    console.log({outEndpoint})
  }
  if (deviceInterface.endpoints[1] instanceof usb.InEndpoint) {
    inEndpoint = deviceInterface.endpoints[1]
    inEndpoint.on('data', (data) => {
      // console.log(data.slice(0, 30))
      const message = messageFromData(data)
      console.log(message)
      eventEmitter.emit(FADER_MOVE, message)
    })
    inEndpoint.startPoll(10, 64)
  }
  messageQueueTimeout = setInterval(sendQueuedMessage, USB_MESSAGE_SEND_INTERVAL)
  console.log('Connected')
  
  return 1
}


export function disconnect() {
  console.log('Disconnecting...')
  clearInterval(messageQueueTimeout)
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


export async function syncFaders() {
  console.log('syncFaders')
  for(let channel = 1; channel <= 16; channel++ ) {
    send(messages.kInputFaderRequest( channel))
  }
}


function checkConnected() {
  if (mixer == undefined) {
    connect()
  }
}

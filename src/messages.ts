const MAX_FADER_LEVEL = 1023

const DEFAULT_MIDI_CHANNEL = 1


enum MessageType {
  UNIVERSAL = 0x7F,
  O1V96 = 0x0D
}


enum DataType {
  EDIT = 0x01,
  PATCH = 0x02,
  SETUP = 0x03,
  BACKUP = 0x04
}


enum Elements {
  kInputChannelName = 0x04,
  kInputPair = 0x18,
  kInputChannelOn = 0x1A,
  kInputChannelPan = 0x1B,
  kInputFader = 0x1C,
  kStereoChannelOn = 0x4D,
  kStereoFader = 0x4F
}


abstract class GenericMessage {
  SYSEX_START = 0xF0
  SYSEX_END = 0xF7
  MANUFACTURER_ID = 0x43
  GROUP_ID = 0x3E
  messageType: MessageType
  midiChannel = DEFAULT_MIDI_CHANNEL - 1
  element: Elements
  _paramNumber = 0
  dataType: DataType
  _channel = 0


  constructor(messageType: MessageType, element: Elements, dataType: DataType = DataType.EDIT) {
    this.messageType = messageType
    this.element = element
    this.dataType = dataType
  }


  /**
   * Sets the input channel number for this message
   * @param channel the input channel number (1=32)
   * @returns this
   */
  channel(channel: number) {
    this._channel = channel - 1
    return this
  }


  /**
   * Sets the parameter number for this message. The parameter number is a sub-
   * parameter of the element number.
   * @param param
   * @returns 
   */
  param(param: number) {
    this._paramNumber = param
    return this
  }


  /**
   * Once you've supplied all the necessary data, this will get you the message
   * bytes to send to the mixer.
   */
  abstract bytes() : number[]


  asHexArray() {
    return this.bytes().map(b => b.toString(16).padStart(2, '0'))
  }
}


class ParamChangeMessage extends GenericMessage {

  _data = [0x00, 0x00, 0x00, 0x00]

  bytes() {
    return [
      this.SYSEX_START,
      this.MANUFACTURER_ID,
      0x10 + this.midiChannel,
      this.GROUP_ID,
      this.messageType,
      this.dataType,
      this.element,
      this._paramNumber,
      this._channel
    ].concat(this._data)
    .concat(this.SYSEX_END)
  }


  data(data: number) {
    var numberBytes = encode7Bit(data)
    if (numberBytes.length == 1) {
      numberBytes.unshift(0)
    }
    this._data[2] = numberBytes[0]
    this._data[3] = numberBytes[1]
    return this
  }


  private encode7Bit(number: number) {
    const buffer = []
    do {
      let sevenBits = number & 0x7F  
      buffer.unshift(sevenBits)
      number = number >> 7  
    } while (number > 0)  
    return buffer
  }
}


class ParamRequestMessage extends GenericMessage {
  bytes() {
    return [
      this.SYSEX_START,
      this.MANUFACTURER_ID,
      0x30 + this.midiChannel,
      this.GROUP_ID,
      this.messageType,
      this.dataType,
      this.element,
      this._paramNumber,
      this._channel
    ]
    .concat(this.SYSEX_END)
  }
}


export function kInputChannelNameChange(channel: number, shortName: String, longName: String) {
  let messages = []
  // message numbers 1 through 4 are the short name characters
  let shortNameIndex=0
  for(let i = 0; i < 4; i++) {
    let messageBytes = 
      new ParamChangeMessage(MessageType.O1V96, Elements.kInputChannelName, DataType.PATCH)
        .channel(channel)
        .param(i)
        .data(shortName.charCodeAt(shortNameIndex++))
        .bytes()
    messages.push(messageBytes)
  }
  // message numbers 5 through 20 are the long name characters 
  let longNameIndex = 0
  for(let i = 4; i < 20; i++) {
    let messageBytes = 
      new ParamChangeMessage(MessageType.O1V96, Elements.kInputChannelName, DataType.PATCH)
        .channel(channel)
        .param(i)
        .data(longName.charCodeAt(longNameIndex++))
        .bytes()
    messages.push(messageBytes)
  }
  return messages
}


export function kInputChannelNameRequest(channel: number) {
  let messages = []
  for(let i = 0; i < 20; i++) {
    let messageBytes = 
      new ParamRequestMessage(MessageType.O1V96, Elements.kInputChannelName, DataType.PATCH)
        .channel(channel)
        .param(i)
        .bytes()
    messages.push(messageBytes)
  }
  return messages
}


export function kInputChannelOnChange(channel: number, isOn: boolean ) {
  return new ParamChangeMessage(MessageType.UNIVERSAL, Elements.kInputChannelOn, DataType.PATCH)
    .channel(channel)
    .data(isOn ? 1 : 0)
    .bytes()
}


export function kInputChannelOnRequest(channel: number) {
  return new ParamRequestMessage(MessageType.UNIVERSAL, Elements.kInputChannelOn)
    .channel(channel)
    .bytes()
}


/**
 * @param channel 
 * @param pan from -63 to 63
 */
export function kInputChannelPanChange(channel: number, pan: number) {
  return new ParamChangeMessage(MessageType.UNIVERSAL, Elements.kInputChannelPan)
    .channel(channel)
    .data(pan)
    .bytes()
}


export function kInputChannelPanRequest(channel: number) {
  return new ParamRequestMessage(MessageType.UNIVERSAL, Elements.kInputChannelPan)
    .channel(channel)
    .bytes()
}


/**
 * Creates a message to set the input fader level, adjusting the volume of the
 * fader.
 * 
 * @param channel the input channel number (1-32)
 * @param level from 0 to MAX_FADER_LEVEL (outside values will be clamped)
 * @returns 
 */
export function kInputFaderChange(channel: number, level: number) {
  return new ParamChangeMessage(MessageType.UNIVERSAL, Elements.kInputFader)
    .channel(channel)
    .data(clamp(level, 0, MAX_FADER_LEVEL))
    .bytes()
}


/**
 * Creates a message to request the current fader level of an input channel.
 * 
 * @param channel the input channel number (1-32)
 * @returns 
 */
export function kInputFaderRequest(channel: number) {
  return new ParamRequestMessage(MessageType.UNIVERSAL, Elements.kInputFader)
    .channel(channel)
    .bytes()
}


export function kInputPairChange(channel: number, onOff: boolean) {
  return new ParamChangeMessage(MessageType.UNIVERSAL, Elements.kInputPair)
    .channel(channel)
    .data(onOff ? 1 : 0)
    .bytes()
}


export function kInputPairRequest(channel: number) {
  return new ParamRequestMessage(MessageType.UNIVERSAL, Elements.kInputPair)
    .channel(channel)
    .bytes()
}


export function kStereoChannelOnChange(channel: number, onOff: boolean) {
  return new ParamChangeMessage(MessageType.UNIVERSAL, Elements.kStereoChannelOn)
    .channel(channel)
    .data(onOff ? 1 : 0)
    .bytes()
}


export function kStereroChannelOnRequest(channel: number) {
  return new ParamRequestMessage(MessageType.UNIVERSAL, Elements.kStereoChannelOn)
    .channel(channel)
    .bytes()
}


export function kStereoFaderChange(channel: number, level: number) {
  return new ParamChangeMessage(MessageType.UNIVERSAL, Elements.kStereoFader)
    .channel(channel)
    .data(clamp(level, 0, MAX_FADER_LEVEL))
    .bytes()
}


export function kStereoFaderRequest(channel: number) {
  return new ParamRequestMessage(MessageType.UNIVERSAL, Elements.kStereoFader)
    .channel(channel)
    .bytes()
}


function clamp(n: number, min: number, max: number) {
  if( n < min) {
    return min
  } else if (n > max) {
    return max
  } else {
    return n
  }
}


function decode7Bit(msb: number, lsb: number) {
  return parseInt((msb << 7 | lsb).toString(2),2)
}


function encode7Bit(number: number) {
  const buffer = []
  do {
    let sevenBits = number & 0x7F  
    buffer.unshift(sevenBits)
    number = number >> 7  
  } while (number > 0)  
  return buffer
}
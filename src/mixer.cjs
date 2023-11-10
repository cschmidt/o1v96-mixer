const usb = require("usb");
const findByIds = usb.findByIds;

/*

Kinds of messages to receive:
Fader move
Channel on/off
Channel pairing state (really nice to have)
Channel name/title (nice to have)
Meter (nice to have)

See 
Universal Serial Bus Device Class Definition for MIDI Devices
https://www.usb.org/sites/default/files/midi10.pdf

01V96 V2 Parameter Change List
https://docs.google.com/spreadsheets/d/1DdAzpKm_WE4Ae82ODwg56ONcXBsNSqGdoqhvACSRLlc/edit?usp=sharing

Fader move messages (Fader 1)
 0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18
04 f0 43 10 04 3e 7f 01 04 1c 00 00 04 00 00 03 06 44 f7
04 f0 43 10 04 3e 7f 01 04 1c 00 00 04 00 00 03 06 41 f7
04 f0 43 10 04 3e 7f 01 04 1c 00 00 04 00 00 03 06 3f f7
04 f0 43 10 04 3e 7f 01 04 1c 00 00 04 00 00 03 06 43 f7
04 f0 43 10 04 3e 7f 01 04 1c 00 00 04 00 00 03 06 46 f7
 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  \- End of Exclusive
 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  \- LSB (7-bit)
 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  \- SysEx ends with following two bytes.
 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  \- MSB (7-bit)
 |  |  |  |  |  |  |  |  |  |  |  |  |  |  \- ?
 |  |  |  |  |  |  |  |  |  |  |  |  |  \- ?
 |  |  |  |  |  |  |  |  |  |  |  |  \- SysEx starts or continues
 |  |  |  |  |  |  |  |  |  |  |  \- Fader number
 |  |  |  |  |  |  |  |  |  |  \- kFader
 |  |  |  |  |  |  |  |  |  \- kInputFader
 |  |  |  |  |  |  |  |  \- SysEx starts or continues
 |  |  |  |  |  |  |  \- Edit buffer
 |  |  |  |  |  |  \- "Universal"
 |  |  |  |  |  \- MODEL ID (digital mixer)
 |  |  |  |  \- SysEx starts or continues
 |  |  |  \- 0001nnnn 1n n=0-15 (Device number=MIDI Channel)
 |  |  \- Manufacturer ID (Yamaha)
 |  \- Sysex
 \- SysEx starts or continues


Fader 1 at Min:
04 f0 43 10 04 3e 7f 01 04 1c 00 00 04 00 00 00 06 00 f7

Fader 1 at half:
04 f0 43 10 04 3e 7f 01 04 1c 00 00 04 00 00 04 06 4c f7

Fader 1 at Max:
04 f0 43 10 04 3e 7f 01 04 1c 00 00 04 00 00 07 06 7f f7

Fader 2 at Min:
04 f0 43 10 04 3e 7f 01 04 1c 00 01 04 00 00 00 06 00 f7

Fader 2 at Max:
04 f0 43 10 04 3e 7f 01 04 1c 00 01 04 00 00 07 06 7f f7

Master stereo at Min:
04 f0 43 10 04 3e 7f 01 04 4f 00 00 04 00 00 00 06 00 f7 00 04 f0 43 10 04 3e 7f 01 04 4f 00 01 04 00 00 00 06 00 f7 00
Master stereo at Max:
04 f0 43 10 04 3e 7f 01 04 4f 00 00 04 00 00 07 06 7f f7 00 04 f0 43 10 04 3e 7f 01 04 4f 00 01 04 00 00 07 06 7f f7 00
Master stereo on:
04 f0 43 10 04 3e 7f 01 04 4d 00 00 04 00 00 00 06 01 f7 00 04 f0 43 10 04 3e 7f 01 04 4d 00 01 04 00 00 00 06 01 f7 00
Master stereo off:
04 f0 43 10 04 3e 7f 01 04 4d 00 00 04 00 00 00 06 00 f7 00 04 f0 43 10 04 3e 7f 01 04 4d 00 01 04 00 00 00 06 00 f7 00

So, it looks like:
 - byte 11 is the fader number
 - bytes 15 and 17 are the high and low bytes of a 2 byte value (7-bit encoded)
 - byte 9 indicates param type 
 1c is a fader change
1a is channel on/off

1023 in binary is 0011 1111 1111
The last 7 digits as an 8-bit value would be 0111 1111, which is 0x7f
The first 7 digits would be 0000 0111 0x7


Channel 1 on
04 f0 43 10 04 3e 7f 01 04 1a 00 00 04 00 00 00 06 01 f7

Channel 1 off
04 f0 43 10 04 3e 7f 01 04 1a 00 00 04 00 00 00 06 00 f7



Messages to send:
Get/set fader level
Get/set channel on/off state
Get/set channel name/title (nice to have) kInputChannelName
Get/set stereo pairing
Start metering (nice to have)
Panning? (nice to have)
*/



/*

Kinds of messages to receive:
Fader move
Channel on/off
Channel pan
Channel solo
Meter
Channel name/title
*/

const YAMAHA = 1177;
const O1V96 = 20488;

const USB_PACKET_SIZE = 64;

const MESSAGE_PREAMBLE = [0xf0, 0x43, 0x10, 0x3e, 0x7f, 0x01];

let inEndpoint;
let outEndpoint;
let mixer;
let kernelDriverActive;
let deviceInterface;


// w00t! This one works!
const testMsg = Buffer.from([
  0x04, 0xf0, 0x43, 0x10, 0x04, 0x3e, 0x7f, 0x01, 0x04, 0x1c, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00, 0x06, 0x00, 0xf7,
  0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);


function getO1V96() {
  return findByIds(YAMAHA, O1V96);
}


function decode7Bit(msb, lsb) {
  return parseInt((msb << 7 | lsb).toString(2),2);
}


function encode7Bit(number) {
  const buffer = [];
  
  // Continue until there are no more data to encode
  do {
    // Extract 7 bits from the number
    let sevenBits = number & 0x7F;  
        
    // Add this 7-bit value to the buffer
    buffer.unshift(sevenBits);
    
    // Shift 7 bits to the right to get the next set of 7 bits
    number = number >> 7;  
  } while (number > 0);
  
  return buffer;
}


function messageFromData(data) {
  // byte 9 indicates param type 
  // 1c is a fader change
  // 1a is channel on/off

  switch( data[9] ) {
    case 0x1C:
      return {
        'type': 'FADER',
        'channel': data[11],
        'level': decode7Bit(data[15], data[17])
      };
    case 0x1A:
      return {
        'type': 'CHANNEL_ENABLE',
        'channel': data[11],
        'enable': new Boolean(data[17])
      };
    default:
      return null;
  }
}


function handleTransferResult(error) {
  console.log("handleTransferResult", error ? error : "success");
}


/**
 * Creates a message to set the mixer's fader level
 * @param channel the 1-indexed channel number
 * @param level value from 0-1023 (clamped if outside)
 * @returns 
 */
function createFaderLevelMessage(channel, level) {
  // kInputFader
  var messageBytes = 
    MESSAGE_PREAMBLE.concat([0x1c, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]);

  messageBytes[8] = channel - 1;

  var levelBytes = encode7Bit(level);
  if (levelBytes.length == 1) {
    levelBytes.unshift(0);
  }
  messageBytes[11] = levelBytes[0];
  messageBytes[12] = levelBytes[1];
  return Buffer.from(messageBytes);
}


function wrapSysexMessage(msg) {
  const SYSEX_START_OR_CONTINUE = 0x04;
  const SYSEX_END_ONE_BYTE = 0x05;
  const SYSEX_END_TWO_BYTES = 0x06;
  const SYSEX_END_THREE_BYTES = 0x07;
  var wrapped = Buffer.alloc(USB_PACKET_SIZE, 0);
  var bytesRemaining = msg.length;
  var sourceOffset = 0;
  var destOffset = 0;
  while (bytesRemaining >= 3) {
    wrapped.writeUint8(SYSEX_START_OR_CONTINUE, destOffset++);
    wrapped.writeUInt8(msg.readUInt8(sourceOffset++), destOffset++);
    wrapped.writeUInt8(msg.readUInt8(sourceOffset++), destOffset++);
    wrapped.writeUInt8(msg.readUInt8(sourceOffset++), destOffset++);
    bytesRemaining -= 3;
  }
  switch (bytesRemaining) {
    case 3:
      wrapped.writeUint8(SYSEX_END_THREE_BYTES, destOffset++);
      wrapped.writeUInt8(msg.readUInt8(sourceOffset++), destOffset++);
      wrapped.writeUInt8(msg.readUInt8(sourceOffset++), destOffset++);
      wrapped.writeUInt8(msg.readUInt8(sourceOffset++), destOffset++);
      break;
    case 2:
      wrapped.writeUint8(SYSEX_END_TWO_BYTES, destOffset++);
      wrapped.writeUInt8(msg.readUInt8(sourceOffset++), destOffset++);
      wrapped.writeUInt8(msg.readUInt8(sourceOffset++), destOffset++);
      break;
    case 1:
      wrapped.writeUint8(SYSEX_END_ONE_BYTE, destOffset++);
      wrapped.writeUInt8(msg.readUInt8(sourceOffset++), destOffset++);
      break;
  }
  return wrapped;
}


function send(msgBytes) {
  // checkConnected();
  // console.log('Sending', outEndpoint, msgBytes);
  var usbMessage = wrapSysexMessage(msgBytes);
  console.log('Sending', usbMessage);
  outEndpoint.transfer(usbMessage, handleTransferResult);
}


function connect() {
  console.log('Connecting...');
  mixer = getO1V96();
  mixer.open();
  console.log({mixer}, typeof mixer);
  console.log('interfaces', mixer.interfaces);
  deviceInterface = mixer.interfaces[0];
  outEndpoint = deviceInterface.endpoints[0];
  inEndpoint = deviceInterface.endpoints[1];
  // https://github.com/node-usb/node-usb/issues/174
  if (deviceInterface.isKernelDriverActive()) {
    kernelDriverActive = true;
    deviceInterface.detachKernelDriver();
  }
  deviceInterface.claim();
  inEndpoint.on('data', (data) => {
    console.log(data.slice(0, 30));
    console.log(messageFromData(data));
  });
  inEndpoint.startPoll(3, 64);
  console.log('Connected');
}


function disconnect() {
  console.log('Disconnecting...');
  inEndpoint.stopPoll(() => {
    console.log('Stopped polling');
    mixer.interfaces[0].release(true, (error) => {
      if (error) {console.log('error releasing', error)} 
      else {console.log('released interface')}
      if (kernelDriverActive) {
        console.log('Detached kernel driver');
        deviceInterface.detachKernelDriver();
      }
      mixer.close();
      console.log('Closed device');
      mixer = null;
      inEndpoint = null;
      outEndpoint = null;
    });
  });
  console.log('Disconnected');
}


function checkConnected() {
  if (mixer == null) {
    connect();
  }
}

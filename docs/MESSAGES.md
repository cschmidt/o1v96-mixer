Channel updates
{channel: 1, level: 342}

{channel: 1, isOn: true}
{channel: 1, shortName: 'VOC1'}
{channel: 1, longName: 'Lead Vocal'}
{channel: 1, meter: -76, compGR: -12, gateGR: -3}



/*

Kinds of messages to receive:
Fader move (channel level)
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

// w00t! This one works!
const testMsg = Buffer.from([
  0x04, 0xf0, 0x43, 0x10, 0x04, 0x3e, 0x7f, 0x01, 0x04, 0x1c, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00, 0x06, 0x00, 0xf7,
  0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00])
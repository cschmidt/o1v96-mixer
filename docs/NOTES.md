# Motivation
Existing solutions either a) don't work at all or b) run only on Mac or Windows.
I wanted a solution where I could employ a very cheap computer (i.e. Raspberry Pi)
as the interface between the mixer and the remote mixing client (tablet, phone,
PC).

Yamaha doesn't provide a version of their USB-MIDI driver for Linux:
https://usa.yamaha.com/products/contents/music_production/downloads/firmware_software/index.html?c=music_production&k=USB-MIDI

So this means I needed to interface at the raw USB level instead of using a 
MIDI api.

# Main UI
- works in portrait and landscape modes (but optimized for landscape?)
- channel and master faders (master fader scroll-locked on the right? make that
  an option?)
- channel on/off
- channels read the assigned labels and display them (short? long?)
  (kInputChannelName does both short 4 char and long 16 char labels)
- layer selection (the Yamaha 01V96 has buttons for 1-16, 17-32, MASTER and
  REMOTE, however, given we don't have the physical limitation of real faders,
  perhaps ours should be 1-32, MASTER and REMOTE? Maybe that's just annoying 
  given most folks won't have the additional 17-32 channels in use for much).
- 'FADER MODE' selection (Aux 1 through Aux 8)
- show/hide active channels (nice to have on a small display if you only have
  a couple active faders)
- ooh, could have a nice "paired mode" where you consolidate two faders into 
  one and show a nice combined label
- ooh, would be nice to have easing when the faders move due to layer or mode
  selection
- need the nice 01V96 graphic somewhere
- hmmm, do I need a load screen while the state is being loaded? maybe just
  disable controls?
- if I wanted to support individual monitor mixes, what would that look like?

## Colours from the O1V96
#5e718f - Button 1 (layer, solo) 
#a4bfdc - Button 2 (channel on/off)
#93c7ff - Button 3 (channel select)
#15201a - Button 4 (aux select, screen function and paging)
#fefefe - "Not-quite white"
#182d40 - Mixer body (well, it's actually speckled, )

## Audio Level Meter component
https://suterma.github.io/vue-audio-level-meter/

## Option Button Techniques
Many of the buttons on the mixer behave like HTML Option buttons. Maybe we can
just style option buttons uniquely to get the behaviour we want.
https://codepen.io/RRoberts/pen/ZOvwbM
https://codepen.io/nikkipantony/pen/wpPGZp
https://codepen.io/adamstuartclark/pen/pbYVYR
https://www.sliderrevolution.com/resources/styling-radio-buttons/

## Markings and Graphics
There are some slanted borders on the interface (for example, the Fader Mode and
Layer sections).
https://blog.logrocket.com/how-to-create-fancy-corners-in-css/


# Architecture
- do I need a store for state? https://pinia.vuejs.org/introduction.html or vuex?
- I guess I should have some tests https://vitest.dev/


# Dev Environment
Making a Full-Stack App with Vue, Vite and Express that supports Hot Reload
https://blog.codeminer42.com/making-a-full-stack-app-with-vue-vite-and-express-that-supports-hot-reload/

Except I used [Eta](https://eta.js.org/) instead of ejs
And maybe [Oak](https://oakserver.github.io/oak/) instead of Express
And maybe Deno instead of Node

Configuring nodemon with TypeScript
https://blog.logrocket.com/configuring-nodemon-with-typescript/


# Packaging and Installation
- use a manifest to allow installation as a shortcut and full-screen experience
  https://web.dev/fullscreen/
  https://whatpwacando.today/
- make it easy to install https://web.dev/customize-install/
- Wake lock! https://whatpwacando.today/wake-lock

- here's how I installed Node.js
  https://github.com/nodesource/distributions#installation-instructions
- provide recommendations on having your Pi advertise a friendly network name
  so you don't have to use an IP address to connect
- make sure it runs as a service
- make sure it serves up on port 80

- on Raspberry Pi, need to run 
sudo apt-get install build-essential libudev-dev
 


# References and Inspiration
There's a similar project here:
https://github.com/kryops/remote-mixer/blob/main/backend/src/devices/yamaha-01v96/protocol.ts


# USB Midi programming

## Controlling the faders

So, it's not clear to me exactly how to send a message to the O1V96 in order to
change a fader level. I tried just sending what I received back through to the
mixer, but that didn't do anything.

Did a little digging. 
 - It's possible that I might have to break up the SysEx messages into 4-byte
   packets
   https://groups.google.com/g/lufa-support/c/0kjpaPxNDUg?pli=1
   https://www.usb.org/sites/default/files/midi10.pdf

 - I could potentially try firing up the Yamaha Studio Manager software and
   do USB packet sniffing via Wireshark to see what's being sent. This might
   be a little tricky on the Mac, though.
   https://wiki.wireshark.org/CaptureSetup/USB
   https://developer.apple.com/forums/thread/124875

   I could either turn off System Integrity Protection on my Mac, OR, I could 
   maybe try this on an older Mac (I'd need a version prior to Catalina where
   this evidently stopped working, say Mojave 10.14.6? https://support.apple.com/en-ca/HT201260)

 - I could experiment with turning on control change messages on the O1V96 (I 
   think right now I have these turned off)

Here's what I *think* was sent from the computer to get the fader to move:



04 f0 43 30 04 3e 1a 21 04 00 00 00 07 00 10 f7

What was sent from the editor:
04 f0 43 30 04 3e 1a 21 04 00 00 00 07 00 10 f7
04 f0 43 30 04 3e 1a 21 04 00 00 20 07 00 10 f7
04 f0 43 30 04 3e 1a 21 04 00 05 00 07 00 10 f7
04 f0 43 30 04 3e 1a 21 04 00 05 20 07 00 10 f7


04 f0 43 30 04 3e 1a 21 04 00 00 00 07 00 10 f7


Let's try this again, here's what's sent from the o1v96i editor software

host -> 0.1.1
0000   01 01 28 00 40 00 00 00 00 00 00 00 00 00 00 00
0010   c7 00 00 00 00 00 00 00 00 00 10 00 01 01 01 02
0020   ff 00 ff 00 99 04 08 50

0.1.1 -> host
0000   01 01 28 01 40 00 00 00 00 00 00 00 00 00 00 00
0010   c7 00 00 00 00 00 00 00 00 00 10 00 01 01 01 02
0020   ff 00 ff 00 99 04 08 50 04 f0 43 30 04 3e 1a 21
0030   04 00 05 20 07 00 10 f7 00 00 00 00 00 00 00 00
0040   00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
0050   00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
0060   00 00 00 00 00 00 00 00


0000   01 01 28 01 40 00 00 00 00 00 00 00 00 00 00 00
0010   88 01 00 00 00 00 00 00 00 00 10 00 01 01 01 02
0020   ff 00 ff 00 99 04 08 50 04 f0 43 10 04 3e 7f 01
0030   04 1c 00 00 04 00 00 00 06 00 f7 00 00 00 00 00
0040   00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
0050   00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
0060   00 00 00 00 00 00 00 00


My attempt:
0000   01 01 28 01 13 00 00 00 00 00 00 00 00 00 00 00
0010   35 02 00 00 00 00 00 00 00 00 10 00 01 01 01 02
0020   ff 00 ff 00 99 04 08 50 04 f0 43 10 04 3e 7f 01
0030   04 1c 00 00 04 00 00 00 06 00 f7 

Looks like it ended up being that I needed to pad the USB packet with zeroes up
to 64 bytes.

## USB on RaspberryPi
https://stackoverflow.com/questions/37309311/how-to-solve-libusb-error-busy-on-raspberry-pi-debian-running-node-js
https://askubuntu.com/questions/978552/how-do-i-make-libusb-work-as-non-root
https://manpages.ubuntu.com/manpages/jammy/man3/Device::USB::FAQ.3pm.html


# Software License
- no commercial use, happy to chat with Yamaha if they want to license it ;-)


# Notes
## Deno
Tried installing Deno on Raspberry Pi, but it didn't seem very straightforward.
Wasn't in default apt repos. Tried via the instructions here:

https://snapcraft.io/install/deno/raspbian

But that just installed a binary for a different architecture.

Tried installing via cargo, got partway through the install and then 404'd on
one of the deps.

 cargo:rustc-link-lib=static=rusty_v8
  download lockfile: "/tmp/cargo-installYdFmR1/release/build/lib_download.fslock"
  static lib URL: https://github.com/denoland/rusty_v8/releases/download/v0.81.0/librusty_v8_release_armv7-unknown-linux-gnueabihf.a
  cargo:rustc-link-search=/tmp/cargo-installYdFmR1/release/gn_out/obj
  Downloading https://github.com/denoland/rusty_v8/releases/download/v0.81.0/librusty_v8_release_armv7-unknown-linux-gnueabihf.a
  Downloading https://github.com/denoland/rusty_v8/releases/download/v0.81.0/librusty_v8_release_armv7-unknown-linux-gnueabihf.a...
  HTTP Error 404: Not Found
  Python downloader failed, trying with curl.

  --- stderr
  Traceback (most recent call last):

# TODO

## UI
- fully responsive mixer layout with awesome tablet (and phone?) support

## Mixing functionality
- initialize fader levels when connecting
- support paired sliders
- support multiple touch events (ability to move multiple faders at once)
- support aux busses
- wire up master/stereo fader

## Packaging and deployment
- finish combining front end and back end server components?
- package the server up as a Linux service
- make it a PWA https://blog.logrocket.com/building-pwa-vue/
- figure out best way to grant USB permissions on Linux
- ooh, figure out the best package manager install setup for a Raspberry Pi and
  bundle it up that way
- Review this article about [packaging a Node app as a Deb package](https://piercejethro.medium.com/how-to-package-a-node-js-application-into-a-debian-package-52c4abcb98f5)

## Connectivity and robustness
- ensure websockets connection works on more than localhost
- need a nice loading/connecting screen
- client should reconnect after server restart or other disconnect
- consider rate limiting of messages (might not be necessary)
- allow mixer to be hot-plugged (right now the mixer must be plugged in when the
  service starts)
- make sure I'm using USB transfer modes correctly, see 
  https://www.beyondlogic.org/usbnutshell/usb4.shtml


## Tooling
- try out [Amazon CodeWhisperer](https://aws.amazon.com/codewhisperer/)
# DONE
- wire up websockets, make faders send basic channel updates to back end
- make faders work with touch events on a tablet
- make back end send basic channel updates to front end
- disconnect from mixer when service shuts down
- de-duplicating of fader level messages

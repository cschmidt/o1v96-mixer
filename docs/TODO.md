# TODO

## Mixing functionality
- make back end send basic channel updates to front end
- initialize fader levels when connecting
- support aux busses
- wire up master/stereo fader
- make faders work with touch events on a tablet
- fully responsive mixer layout with awesome tablet (and phone?) support

## Packaging and deployment
- finish combining front end and back end server components?
- package the server up as a Linux service
- make it a PWA https://blog.logrocket.com/building-pwa-vue/
- figure out best way to grant USB permissions on Linux
- ooh, figure out the best package manager install setup for a Raspberry Pi and
  bundle it up that way

## Connectivity and robustness
- ensure websockets connection works on more than localhost
- need a nice loading/connecting screen
- client should reconnect after server restart or other disconnect
- de-duplicating and rate limiting of messages
- disconnect from mixer when service shuts down
- allow mixer to be hot-plugged (right now the mixer must be plugged in when the
  service starts)

# DONE
- wire up websockets, make faders send basic channel updates to back end

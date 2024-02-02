# O1V96 Mixer (remote control)

A remote web interface for the Yamaha O1V96 digital mixer.

> [!NOTE] 
> Current status: heavy development in progress, not yet ready for general use.
> Working towards an 
> [initial functional release](https://github.com/cschmidt/o1v96-mixer/milestone/1)

While the Yamaha O1V96 mixer supports remote control via MIDI or USB, there is
no out-of-the-box support for wireless control from your tablet like there is 
with all the other cool new digital mixers. This project endeavours to fix that.

There are some existing efforts that strive to address this (see below), but for
various reasons they just don't quite work for me. The biggest issue is that the
other projects interface with the O1V96 via the Yamaha USB-MIDI driver, which is
only available on Windows and Mac. That means you can't use something cheap and
small like a Raspberry Pi. This project interfaces directly with the O1V96 over
USB, targetting the Raspberry Pi as the host environment.

While I'm primarily making this to serve my own needs, if there are other folks
out there who would find this useful 
[I'd love to hear about it](https://github.com/cschmidt/o1v96-mixer/discussions/19).

# Related Projects

## remote-mixer
https://github.com/kryops/remote-mixer

## O1v96 Remote (iPad app)
https://apps.apple.com/us/app/01v96-remote/id400947756
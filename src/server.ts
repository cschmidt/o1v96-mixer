import express from 'express'
import * as http from 'http'
import WebSocket, { WebSocketServer } from 'ws'
import * as mixer from './mixer'



function handleMessage(rawMessage: object) {
  let message = JSON.parse(rawMessage.toString())
  console.log('parsed message', message)
  let scaledLevel = Math.round(mixer.MAX_FADER_LEVEL * message.level / 100)
  let mixerMessage = mixer.createFaderLevelMessage(message.channel, scaledLevel)
  if (mixer.connected()) {
    mixer.send(mixerMessage)
  }
}

console.log(WebSocket)
const wss = new WebSocketServer({ noServer: true })
wss.on('connection', socket => {
  socket.on('message', message => handleMessage(message))
})

const app = express()
app.use(express.static('dist'))

function cleanup(signal: String) {
  console.info(`${signal} received.`)
  mixer.disconnect()
  process.exit(0)
}

['SIGTERM', 'SIGINT', 'SIGQUIT'].forEach(signal =>{
  process.on(signal, () => cleanup(signal))
} )

const server = app.listen(80)

server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, socket => {
    wss.emit('connection', socket, request)
  })
})

mixer.onFaderMove((message: object) => {
  wss.clients.forEach(function each(client) {
    console.info('broadcasting', message)
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message))
    }
  })
})
mixer.connect()
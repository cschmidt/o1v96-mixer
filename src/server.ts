import express from 'express'
import * as http from 'http'
import WebSocket, { WebSocketServer } from 'ws'
import * as mixer from './mixer.ts'



function handleMessage(rawMessage) {
  let message = JSON.parse(rawMessage.toString())
  console.log('parsed message', message)
  let mixerMessage = mixer.createFaderLevelMessage(message.channel, message.level)
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
app.get("/api/v1/hello", (_req, res) => {
  res.json({ message: "Hello, world!" })
})


function cleanup(signal: String) {
  console.info(`${signal} received.`)
  mixer.disconnect()
  process.exit(0)
}

['SIGTERM', 'SIGINT', 'SIGQUIT'].forEach(signal =>{
  process.on(signal, () => cleanup(signal))
} )

const server = app.listen(3000)

server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, socket => {
    wss.emit('connection', socket, request)
  })
})

mixer.onFaderMove((message) => {
  wss.clients.forEach(function each(client) {
    console.info('broadcasting', message)
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message))
    }
  })
})
mixer.connect()
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


process.on('SIGTERM', () => {
  console.info('SIGTERM signal received.')
  mixer.disconnect()
  process.exit(0)
})

process.on('SIGINT', () => {
  console.info('SIGINT signal received.')
  mixer.disconnect()
  process.exit(0)
})

process.on('SIGQUIT', () => {
  console.info('SIGQUIT signal received.')
  mixer.disconnect()
  process.exit(0)
})


const server = app.listen(3000)

server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, socket => {
    wss.emit('connection', socket, request)
  })
})

mixer.connect()
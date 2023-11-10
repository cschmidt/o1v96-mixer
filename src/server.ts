import express from 'express';
import * as http from 'http';
import WebSocket, { WebSocketServer } from 'ws';



console.log(WebSocket);
const wss = new WebSocketServer({ noServer: true });
wss.on('connection', socket => {
  socket.on('message', message => console.log(message.toString()));
});

const app = express();
const server = app.listen(3000);
server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, socket => {
    wss.emit('connection', socket, request);
  });
});

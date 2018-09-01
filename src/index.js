const http = require('http');
const express = require('express');
const fs = require('fs');
const socketio = require('socket.io');

const app = express();

app.all('/', (req, res, next) => {
  fs.readFile('chatLog.html', (err, result) => {
    res.writeHead(200, {'Content-Type' : 'text/html'});
    res.end(result);
  });
});

const server = http.createServer(app).listen(10009, () => {
  console.log('Server Started now..');
});

const io = socketio.listen(server);
io.sockets.on('connection', socket => {
  socket.on('join', result => {
    socket.leave(socket.room);
    socket.join(result);
    socket.room = result;
  });

  socket.on('message', (result) => {
    io.sockets.in(socket.room).emit('message', result);
  });

  socket.on('disconnect', () => {});
});

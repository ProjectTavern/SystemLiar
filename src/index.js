const app = require('express')();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const crossdomain = require('crossdomain');

app.all('/crossdomain.xml', function (req, res, next) {
  res.set('Content-Type', 'application/xml; charset=utf-8');
  res.send(crossdomain({ domain: '*' }), 200);
});

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index-room.html');
});

// namespace /chat에 접속한다.
const chat = io.of('/chat').on('connection', function(socket) {
  socket.on('chat message', function(data){
    console.log('message from client: ', data);

    const name = socket.name = data.name;
    const room = socket.room = data.room;

    socket.join(room);
    chat.to(room).emit('chat message', data.msg);
  });
});

server.listen(30500, function() {
  console.log('Socket IO server listening on port 30500');
});

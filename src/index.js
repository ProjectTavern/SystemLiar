const path = require('path');
const app = require('express')();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const crossdomain = require('crossdomain');
const redis = require('./redis');

app.use((request, response, next) => {
  request.redis = redis;
  next();
});

/* 크로스도메인 해제 : 나중에 서버 제대로 개설되면 제거 */
app.all('/crossdomain.xml', function (request, response, next) {
  response.set('Content-Type', 'application/xml; charset=utf-8');
  response.send(crossdomain({ domain: '*' }), 200);
});

/* 테스트를 위한 샘플 채팅 */
app.get('/', function(request, response) {
  response.sendFile(path.join(__dirname, '/templates/sample_chat.html'));
});


app.post('/profile', (request, response, next) => {
  request.accepts('application/json');
  const key = request.body.name;
  const value = JSON.stringify(request.body);
  console.log(request.redis);
  request.redis.set( key, value, (error, data) => {
    if (error) {
      console.log(error);
      response.send("REDIS ERROR: " + error);
      return;
    }
    request.redis.expire(key,10);
    response.json(value);
    console.log(value);
  });

});

app.get('/profile/:name', (request, response ,next) => {
  const key = request.params.name;
  console.log(request.redis);
  request.redis.get(key, (error, data) => {
    if (error) {
      console.log(error);
      response.send("REDIS ERROR: " + error);
      return;
    }
    const value = JSON.parse(data);
    response.json(value);
  });
});

app.use(function(request, response, next) {
  const error = new Error('HTTP Not Found Exception');
  error.status = 404;
  next(error);
});

/* namespace /chat에 접속한다. */
const chat = io.of('/chat').on('connection', function(socket) {
  socket.on('chat message', function(data){
    console.log('message from client: ', data);

    const name = socket.name = data.name;
    const room = socket.room = data.room;

    socket.join(room);
    chat.to(room).emit('chat message', data.msg);
  });
});

/* 서버 기동 포트: 30500 */
server.listen(30500, function() {
  console.log('Socket IO server listening on port 30500');
});

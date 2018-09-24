const path = require('path');
const app = require('express')();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const crossdomain = require('crossdomain');
const redis = require('./redis');
const bodyParser = require('body-parser');

/* 임시 해쉬코드 작성 */
String.prototype.hashCode = function() {
  var hash = 0, i, chr;
  if (this.length === 0) return hash;
  for (i = 0; i < this.length; i++) {
    chr   = this.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return hash;
};

/* 바디 파서 등록 */
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());

/* 응답객체에 레디스 등록 */
app.use((request, response, next) => {
  request.redis = redis;
  next();
});

/* 크로스도메인 해제 : 나중에 서버 제대로 개설되면 제거 */
app.all('/crossdomain.xml', function (request, response, next) {
  response.set('Content-Type', 'application/xml; charset=utf-8');
  response.send(crossdomain({ domain: '*' }), 200);
});

/* 테스트를 위한 샘플 페이지 */
app.get('/', function(request, response) {
  response.sendFile(path.join(__dirname, '/templates/index.html'));
});

/* 레디스 테스트 페이지 */
app.get('/redis', function(request, response) {
  response.sendFile(path.join(__dirname, '/templates/sample_redis.html'));
});

/* 채팅 테스트 페이지 */
app.get('/chat', function(request, response) {
  response.sendFile(path.join(__dirname, '/templates/sample_chat.html'));
});

/* 유저 상태 등록 */
app.post('/user/status', (request, response, next) => {
  request.accepts('application/json');
  request.on('data', (data) => console.log(data));

  const key = request.body.name;
  const value = JSON.stringify(request.body);

  request.redis.set(key, value, (error, data) => {
    if (error) {
      console.log(error);
      response.send("REDIS ERROR: " + error);
      return;
    }
    /* 성공 후처리 */
    // request.redis.expire(key,10);
    response.json(value);
  });
});

/* 유저 상태 불러오기 */
app.get('/user/status/:name', (request, response ,next) => {
  const key = request.params.name;
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

/* 에러 핸들러 */
app.use(function(request, response, next) {
  const error = new Error('Data Not Found Exception');
  error.status = 404;
  next(error);
});

/* socketio 채팅 */
const roomspace = io.of('/roomspace');
roomspace.on('connection', (socket) => {
  console.log('A user connected.');

  socket.on('joinRoom', (data) => {
    console.log(data);
    if(data.type === 'joinRoom') {
      socket.join(data.room);
      socket.emit('systemMessage', { message: '채팅방에 오신 것을 환영합니다.' });
      setNameTag(socket, data.name);
      socket.broadcast.to(data.room).emit('systemMessage', { message: socket.username + '님이 접속하셨습니다.' });
    }
  });

  socket.on('sendToMessage', (data) => {
    console.log(data);
    roomspace.to(data.room).emit('getUserMessage', data);
  });

  socket.on('leftRoom', (data) => {
    if (data.name) {
      console.log(`${data.name} is left this room.`);
    }
    roomspace.to(data.room).emit('systemMessage', { message: data.name + '님이 방에서 나가셨습니다.' });

  });

  function setNameTag(socket, name) {
    if (name) {
      socket.username = name;
    } else {
      const someones = ["A","B","C","D","E","F"]
      const random = Math.floor(Math.random() * 6);
      socket.username = someones[random];
    }
  }
});

/* 서버 기동 포트: 30500 */
server.listen(30500, function() {
  console.log('Socket IO server listening on port 30500');
});

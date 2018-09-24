const path = require('path');
const app = require('express')();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const crossdomain = require('crossdomain');
const redis = require('./redis');
const bodyParser = require('body-parser');

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

const roomspace = io.of('/roomspace');
/* socketio 채팅 로직 */
roomspace.on('connection', (socket) => {
  console.log('A user connected.');

  socket.on('')

  const roomId = 'testRoomId';
  socket.join(roomId);

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

/* 서버 기동 포트: 30500 */
server.listen(30500, function() {
  console.log('Socket IO server listening on port 30500');
});

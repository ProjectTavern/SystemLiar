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
      response.send("[ERROR] REDIS ERROR: " + error);
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
      response.send("[ERROR] REDIS ERROR: " + error);
      return;
    }
    const value = JSON.parse(data);
    response.json(value);
  });
});

/* socketio 채팅 */
const roomspace = io.of('/roomspace');
roomspace.on('connection', (socket) => {
  console.log('[LOG] An user connected.', socket.id);
  /**
   * 나중에 init함수로 유저에 대한 데이터를 정리하는 함수로 만들 것
   * 현재는 유저 방에 대한 정보만을 초기화 시키고 있음.
   * (연결이 유실되었다가 다시 들어오면 방이 초기화될 수 있는 문제가 있을 수도 있음)
   * */
  socket.userRooms = [];

  socket.on('join:room', (data) => {
    console.log("[LOG] join:room: ", data);
    try {
      initRoom(socket);
      if(data.type === 'joinRoom') {
        console.log("[LOG] data.type: joinRoom => valid entered.", data.type);
        socket.join(data.room);
        socket.userRooms.push(data.room);
        socket.emit('system:message', { message: '채팅방에 오신 것을 환영합니다.' });
        setNameTag(socket, data.name);
        socket.broadcast.to(data.room).emit('system:message', { message: socket.username + '님이 접속하셨습니다.' });
      }
    } catch (error) {
      console.log("[ERROR] join:room.", error);
    }
  });

  socket.on('send:message', (data) => {
    console.log("[LOG] send:message: ",data);
    try {
      roomspace.to(data.room).emit('user:message', data);
    } catch (error) {
      console.log("[ERROR] send:message.", error);
    }
  });

  socket.on('leave:room', (data) => {
    console.log('[LOG] leave:room: ', data);
    try {
      if (data.name) { console.log(`leave:room: ${data.name} is left this room.`); }
      socket.leave(data.room);
      roomspace.to(data.room).emit('system:message', { message: data.name + '님이 방에서 나가셨습니다.' });
    } catch (error) {
      console.log("[ERROR] leave:room.", error);
    }
  });

  function initRoom(socket) {
    const currentRooms = socket.userRooms;
    currentRooms.forEach((elem) => {
      socket.leave(elem);
    });
  }

  function setNameTag(socket, name) {
    if (name) {
      socket.username = name;
    } else {
      const someones = ["A", "B", "C", "D", "E", "F"];
      const random = Math.floor(Math.random() * 6);
      socket.username = someones[random];
    }
  }

  /**
   * EmitJson의 사용으로 불필요해짐
   * 유니티 모듈 변경이 필요해진 경우 다시 사용할 수도 있음
   * */
  function parseData(data) {
    try {
      data = typeof data === "string" ? JSON.parse(data) : data;
    } catch(e) {
      console.log("[ERROR] Can not parse to JSON from string object.");
    }
    return data;
  }
});

/* 서버 기동 포트: 30500 */
server.listen(30500, () => {
  console.log('[LOG] Socket IO server listening on port 30500');
});

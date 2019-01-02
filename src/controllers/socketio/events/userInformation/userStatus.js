const redis = require('../../../database/redis');

// TODO: 구글 유저 아이디값 암호화해서 저장하기
module.exports = function userStatus(requestData) {
  const { socket } = this;
  const usersession = socket.handshake.session;
  const userGhash = requestData.id;
  redis.hget(userGhash, "nickname", (error, value) => {
    if (value) {
      usersession.userinfo = { id: userGhash, nickname: value, socketId: socket.id };
      socket.emit("user:status", value);
    } else {
      socket.emit("user:status", false);
    }
  });
};

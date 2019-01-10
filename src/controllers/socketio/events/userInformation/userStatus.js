const redis = require('../../../database/redis');
const crypto = require('crypto');

module.exports = function userStatus(requestData) {
  const { socket } = this;
  const userSession = socket.handshake.session;
  const prefix = '라이어';
  const surfix = '시스템';
  const userID = `${prefix}${requestData.id}${surfix}`;
  const userGhash = crypto.createHash('sha512').update(userID).digest('base64');

  redis.hget(userGhash, "nickname", (error, value) => {
    if (value) {
      userSession.userinfo = { id: userGhash, nickname: value, socketId: socket.id };
      socket.emit("user:status", value);
    } else {
      socket.emit("user:status", false);
    }
  });
};

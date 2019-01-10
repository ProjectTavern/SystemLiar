const redis = require('../../../database/redis');
const crypto = require('crypto');

module.exports = function userCreateNickname(requestData) {
  const { socket } = this;
  const userSession = socket.handshake.session;
  const userNickname = requestData.nickname;
  const prefix = '라이어';
  const surfix = '시스템';
  const userID = `${prefix}${requestData.id}${surfix}`;
  const userGhash = crypto.createHash('sha512').update(userID).digest('base64');

  if (userNickname.split(' ').length > 1) {
    socket.emit("user:status", false);
    return false;
  }

  let userInformForRedisData = [];
  for (let userInformKey in requestData) {
    if (requestData.hasOwnProperty(userInformKey)) {
      userInformForRedisData.push(userInformKey);
      userInformForRedisData.push(requestData[userInformKey]);
    }
  }

  redis.smembers('user:nickname', (error, userNicknameLists) => {
    if (userNicknameLists.includes(userNickname)) {
      socket.emit("user:status", false);
    } else {
      redis.multi()
        .sadd('user:nickname', userNickname)
        .hset(userGhash, userInformForRedisData)
        .exec((error, result) => {
          if (error) {
            socket.emit('user:status', false);
            return false;
          }
          userSession.userinfo = { id: userGhash, nickname: userNickname, socketId: socket.id };
          socket.emit('user:status', userNickname);
        });
    }
  });
};

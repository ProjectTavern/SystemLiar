const redis = require('../../../database/redis');

module.exports = function userCreateNickname(responseData) {
  const socket = this;
  const usersession = socket.handshake.session;
  const userNickname = responseData.nickname;
  const userGhashId = responseData.id;

  if (userNickname.split(' ').length > 1) {
    socket.emit("user:status", false);
    return false;
  }

  let userInformForRedisData = [];
  for (let userInformKey in responseData) {
    if (responseData.hasOwnProperty(userInformKey)) {
      userInformForRedisData.push(userInformKey);
      userInformForRedisData.push(responseData[userInformKey]);
    }
  }

  redis.smembers('user:nickname', (error, userNicknameLists) => {
    if (userNicknameLists.includes(userNickname)) {
      socket.emit("user:status", false);
    } else {
      redis.multi()
        .sadd('user:nickname', userNickname)
        .hset(userGhashId, userInformForRedisData)
        .exec((error, result) => {
          if (error) {
            socket.emit('user:status', false);
          }
          usersession.userinfo = { id: userGhashId, nickname: userNickname, socketId: socket.id };
          socket.emit('user:status', userNickname);
        });
    }
  });
};

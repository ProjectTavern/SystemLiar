const redis = require('../../../database/redis');

let rooms = require('../../rooms');
module.exports = function getSubject() {
  const socket = this;
  redis.smembers('subject', (error, subjects) => {
    socket.emit('get:subject', subjects);
  });
};

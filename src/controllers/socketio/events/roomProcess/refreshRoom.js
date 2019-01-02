const filterRooms = require('../../modules/filterRooms');

let rooms = require('../../rooms');

module.exports = function refreshRoom() {
  const { socket } = this;
  socket.emit("rooms:info", filterRooms(rooms));
};

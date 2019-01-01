const getSelectedRoom = require('../../modules/getSelectedRoom');

const rooms = require('../../rooms');

module.exports = function() {
  const socket = this;
  const userSession = socket.handshake.session;
  const userInfo = userSession.userinfo;
  const roomId = userInfo.room;
  const userRoom = socket.userRooms[0];
  let selectedRoom = getSelectedRoom(rooms, userRoom);

  if (userInfo.ready) {
    userInfo.ready = false;
    selectedRoom.ready--;
    if (selectedRoom.readiedPlayer.indexOf(userInfo.nickname) > -1) {
      selectedRoom.readiedPlayer.splice(selectedRoom.readiedPlayer.indexOf(userInfo.nickname), 1);
    }


    socket.emit('ready:user', userInfo);
    socket.broadcast.to(roomId).emit('ready:user', userInfo);

    socket.emit('all:ready', false);
    socket.broadcast.to(roomId).emit('all:ready', false);
  } else {
    userInfo.ready = true;
    selectedRoom.readiedPlayer.push(userInfo.nickname);
    selectedRoom.ready++;

    socket.emit('ready:user', userInfo);
    socket.broadcast.to(roomId).emit('ready:user', userInfo);

    if (selectedRoom.ready >= 2 && selectedRoom.ready === selectedRoom.members.length) {
      socket.emit('all:ready', true);
      socket.broadcast.to(roomId).emit('all:ready', true);
    }
  }
};

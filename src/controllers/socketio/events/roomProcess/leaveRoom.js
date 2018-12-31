const getSelectedRoom = require('../../modules/getSelectedRoom');
const leaveAllRoom = require('../../modules/leaveAllRoom');

const rooms = require('../../rooms');

module.exports = function leaveRoom() {
  const socket = this;
  const userSession = socket.handshake.session;
  try {
    const userInfo = userSession.userinfo;
    const roomId = userInfo.room;
    const userNickname = userInfo.nickname;
    let selectedRoom = getSelectedRoom(rooms, roomId);
    selectedRoom.members.splice(selectedRoom.members.indexOf(userNickname), 1);
    leaveAllRoom(socket);

    socket.emit('user:exit', userNickname);
    socket.broadcast.to(roomId).emit('user:exit', userNickname);

    socket.emit("leave:room", true);

    if(selectedRoom.readiedPlayer.indexOf(userNickname) > -1) {
      selectedRoom.readiedPlayer.splice(selectedRoom.readiedPlayer.indexOf(userNickname), 1);
      selectedRoom.ready--;
    }

    selectedRoom.currentUsers.forEach((memberData, index) => {
      if (memberData.nickname === userNickname) {
        selectedRoom.currentUsers.splice(index, 1);
      }
    });

    if (selectedRoom.members.length === 0) {
      rooms.splice(rooms.indexOf(selectedRoom), 1);
    } else if (selectedRoom.host === userNickname) {
      selectedRoom.host = selectedRoom.members[0];

      socket.broadcast.to(roomId).emit('host:change', selectedRoom.host);
    }
  } catch (error) {
    socket.emit("leave:room", false);
  }
};

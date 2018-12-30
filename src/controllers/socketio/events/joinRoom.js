const setNameTag = require('../modules/setNameTag');
const leaveAllRoom = require('../modules/leaveAllRoom');
const getSelectedRoom = require('../modules/getSelectedRoom');

module.exports = function joinRoom(responseData) {
  const socket = this;
  const userSession = socket.handshake.session;

  try {

    leaveAllRoom(socket);
    const userId = responseData.id;
    let selectedRoom = getSelectedRoom(rooms, userId);
    let userInfo = userSession.userinfo || {};
    if (selectedRoom.hasOwnProperty("id") && isJoinPossible(selectedRoom, userSession.userinfo.nickname)) {
      const userNickname = userSession.userinfo.nickname;
      setNameTag(socket, userNickname);
      selectedRoom.members.push(userNickname);
      selectedRoom.currentUsers.push({ nickname: userNickname, socketId: socket.id, ready: false });
      userInfo.room = userId;
      socket.join(userId);
      socket.userRooms.push(userId);
      socket.broadcast.to(userId).emit('user:join', userNickname);
      socket.emit("join:room", selectedRoom);
    }

  } catch (error) {

  }

  function isJoinPossible(selectedRoom, nickname) {
    const isNotJoined = !((selectedRoom.members.filter(element => {
      return element === nickname
    })).length);
    return selectedRoom.status === "wait" && selectedRoom.members.length < selectedRoom.limit && isNotJoined;
  }
};

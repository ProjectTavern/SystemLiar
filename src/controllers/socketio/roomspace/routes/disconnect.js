module.exports = () => {
  console.log("[LOG][disconnect] 유저의 연결이 끊어졌습니다.");

  try {
    /* 유저가 들어간 방 찾기 */
    const roomId = usersession.userinfo.room;
    const userNickname = usersession.userinfo.nickname;
    console.log(roomId, userNickname);
    let selectedRoom = getSelectedRoom(rooms, roomId);
    console.log("[Log][disconnect] 선택된 방의 정보: ", selectedRoom);
    selectedRoom.members.splice(selectedRoom.members.indexOf(userNickname), 1);
    initRoom(socket);
    roomspace.to(roomId).emit("system:message", { message: userNickname + '님이 방에서 나가셨습니다.' });
    if (selectedRoom.members.length === 0) {
      console.log("[LOG][disconnect] 방에 아무도 없어 방을 삭제합니다.", selectedRoom);
      rooms.splice(rooms.indexOf(selectedRoom), 1);
    }
    console.log("[LOG][disconnect] 현재 방의 정보들", rooms);
  } catch (error) {
    console.log("[ERROR][disconnect] => ", error);
  }
};

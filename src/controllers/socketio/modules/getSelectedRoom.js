module.exports = function getSelectedRoom(rooms, id) {
  const checkRoom = rooms.filter(element => {
    return element.id + '' === id + '';
  });
  let selectedRoom = {};
  if (checkRoom.length > 0) {
    selectedRoom = checkRoom[0];
  }
  return selectedRoom;
};

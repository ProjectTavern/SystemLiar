module.exports = function getSelectedRoom(rooms, id) {
  const checkRoom = rooms.filter(element => {
    return element.id + '' === id + '';
  });
  let selectedRoom = {};
  if (checkRoom.length) {
    selectedRoom = checkRoom[0];
  }
  return selectedRoom;
};

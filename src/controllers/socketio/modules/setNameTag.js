module.exports = function setNameTag(socket, name) {
  if (name) {
    socket.username = name;
  } else {
    const someones = ["A", "B", "C", "D", "E", "F"];
    const random = Math.floor(Math.random() * 6);
    socket.username = someones[random];
  }
}

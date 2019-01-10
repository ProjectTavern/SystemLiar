class Users {
  constructor() {
    this.length = 0;
  }

  connected() {
    this.length++;
  }

  disconnected() {
    this.length--;
  }

  getLength() {
    return this.length;
  }
}

module.exports = new Users();

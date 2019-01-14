const redis = require('../database/redis');

const userSchema = {
  id: String,
  password: String
};


redis
userSchema.methods.comparePassword = function(inputPassword, cb) {
  if (inputPassword === this.password) {
    cb(null, true);
  } else {
    cb('error');
  }
};

module.exports = mongoose.model('users', userSchema, 'users');

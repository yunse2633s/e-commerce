var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//云信im创建失败角色
var UserSchema = new Schema({
  user_id: {type: String},
  err: {type: String},
  time_creation: {
    type: Date, default: function () {
      return new Date()
    }
  }
});

module.exports = mongoose.model('im_err_user', UserSchema);
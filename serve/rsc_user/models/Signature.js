var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var TipSchema = new Schema({
    user_id: {type: String},                  //表单发起者的用户ID。
    name: {type: String}                      //签名数据
});

module.exports = mongoose.model('signature', TipSchema);
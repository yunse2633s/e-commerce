/**
 * Created by Administrator on 2017\10\23 0023.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var BehalfSchema = new Schema({
    user_id: {type: String},     //运营人员
    behalf_user: {type: String},  //被注册上线的人
    status: {type: String, default: 'PROCESSING'},  //代注册的状态
    time_creation: {
        type: Date, default: function () {
            return new Date()
        }
    }
});
module.exports = mongoose.model('behalf_user', BehalfSchema);

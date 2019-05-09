/**
 * Created by Administrator on 2018/2/6/006.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var session_store = new Schema({
    user_id: {type: String},                     //发送者的id
    other_user_id: {type: String},               //接受者的id
    user_last:{type:String},                     //req.body中所有内容的JSON字符串
    time_last:{type:Date},                     //最后一次的聊天时间
    time_creation: {
        type: Date, default: function () {
            return new Date()
        }
    }   //创建时间
});

module.exports = mongoose.model('Session_store', session_store);
/**
 * Created by Administrator on 2017/3/14.
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var MSGSchema = new Schema({
    send_id: {type:String},                             // 短信由谁触发
    receive_id: {type:String},                          // 短信的接收者
    content: {type:String},                             // 内容列表
    read: {type:Boolean, default:false},                // 是否已读
    time_creation: {type:Date, default:function(){return new Date()}}                          // 建立时间
});

module.exports = mongoose.model('message', MSGSchema);
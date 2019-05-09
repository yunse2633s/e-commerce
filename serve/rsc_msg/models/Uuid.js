/**
 * Created by Administrator on 2017/4/18.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var MSGSchema = new Schema({
    user_id: {type: String},    // 短信由谁触发
    uuid: {type: String},       // 短信的接收者
    package_name: {type: String},       // 包名
    // time_creation: {type: Date, default: function () {return new Date()}}   // 建立时间
    time_creation: {type: Date, default: Date.now()},   // 建立时间
    time_modify: {type: Date, default: Date.now()}
});

module.exports = mongoose.model('uuid', MSGSchema);
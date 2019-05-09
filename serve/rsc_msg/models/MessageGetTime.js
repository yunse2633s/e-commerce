/**
 * Created by Administrator on 2017/3/14.
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var MSGSchema = new Schema({
    user_id: {type:String},                         // 人id
    get_time: {type:Date}                           // 获取时间
});

module.exports = mongoose.model('message_get_time', MSGSchema);
/**
 * 推送或短信消息
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var TrafficMsgLog = new Schema({
    user_id: {type: String}, //物流需求单id
    role: {type: String}, //物流需求单id TRAFFIC_ADMIN, TRAFFIC_DRIVER_PRIVATE,
    type: {type: String}, //,
    accept_user_id:{type: String},//接收人
    push_content: {type: String}, //推送内容
    time_creation: {type: Date, default: Date.now()}, //创建时间
    case_id: {type: String}, //关联单据id
});

module.exports = mongoose.model('TrafficMsgLog', TrafficMsgLog);
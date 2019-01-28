/**
 * 推送信息 20171219 智能推荐每天一条
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var TrafficPush = new Schema({
    user_id: {type: String}, //物流需求单id
    role: {type: String}, //物流需求单id TRAFFIC_ADMIN, TRAFFIC_DRIVER_PRIVATE,
    type: {type: String}, //物流需求单id ,traffic_demand, driver_demand, line, driver_line,
    accept_user_id:{type: String},//接收人
    push_content: {type: Array, default: []}, //物流需求单id
    time_creation: {type: Date}, //创建时间

});

module.exports = mongoose.model('TrafficPush', TrafficPush);
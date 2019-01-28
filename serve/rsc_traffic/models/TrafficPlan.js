/**
 * 被指派后，司机报名
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var TrafficPlan = new Schema({
    demand_id: {type: String}, //物流需求单id
    user_id: {type: String}, //用户id
    user_name: {type: String}, //用户id
    company_id: {type: String}, //公司id
    company_name: {type: String}, //公司name
    demand_user_id: {type: String},
    demand_company_id: {type: String},
    demand_company_name: {type: String},
    status: {type: String}, //状态
    time_creation: {type: Date}, //创建时间
    time_modify: {type: Date}, //修改时间
    source: {type: String}, //20171101来源
    admin_id: {type: String},   //为代操作管理员
    price: {type: Number, default: 0}, //价格
    line_id: {type: String},
    sorting:{type: Number, default: 1}, //排序字段
});

module.exports = mongoose.model('TrafficPlan', TrafficPlan);
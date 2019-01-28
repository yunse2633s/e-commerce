/**
 * 指派司机后，司机报名
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var TrafficDriverPlan = new Schema({
    demand_id: {type: String}, //司机需求单id
    user_id: {type: String},
    user_name: {type: String},
    status: {type:String},    //状态
    time_creation: {type:Date, default:function(){return new Date()}},  //创建时间
    time_modify: {type: Date}, //修改时间
    source: {type: String}, //20171101
    admin_id: {type: String},    //为代操作管理员
    demand_user_id: {type: String},
    demand_company_id: {type: String},
    demand_company_name: {type: String},
    price: {type: Number, default: 0}, //价格
    line_id: {type: String},
    sorting:{type: Number, default: 1}, //排序字段
});

module.exports = mongoose.model('TrafficDriverPlan', TrafficDriverPlan);
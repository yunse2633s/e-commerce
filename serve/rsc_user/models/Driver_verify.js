/**
 * Created by Administrator on 2016/2/24.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var DriverVerifySchema = new Schema({
    user_id: {type:String},         //司机id
    approve_id: {type:String},      //审批人id
    time_creation: {type:Date, default:function(){return new Date()}},
    // time_apply: {type:Date, default:function(){return new Date()}}, //申请时间(根据这个可以再次发送消息提醒)
    // status: {type:String},
    company_id: {type:String}
});

module.exports = mongoose.model('driver_verify', DriverVerifySchema);
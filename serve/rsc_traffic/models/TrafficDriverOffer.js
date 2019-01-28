/**
 * Created by Administrator on 2016/3/14.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var TrafficDriverOffer = new Schema({
    supply_user_id :{type:String},         //司机id
    demand_id: {type: String},      //物流需求单id
    order_id :{type:String},        //物流订单id
    status: {type: String},         //抢单状态
    modify_count: {type: Number},   //修改次数
    time_modify:{type: Date},       //修改时间
    time_creation: {type:Date, default:function(){return new Date()}},
    is_sms:{type:Boolean, default:false},
});

 module.exports = mongoose.model('TrafficDriverOffer', TrafficDriverOffer);
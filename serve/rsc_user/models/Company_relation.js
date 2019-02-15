/**
 * Created by Administrator on 2015/12/28.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var RelationSchema = new Schema({
    // apply_user_id: {type:String},   //申请人id(一定是self_user_id和other_user_id中一个)
    // approve_user_id: {type:String}, //审批人id(一定是self_user_id和other_user_id中一个)
    // self_user_id: {type:String},    //自己公司负责人id(买东西的人)----占时为刷库开启
    self_id: {type:String},         //自己公司id(买东西的公司)
    // other_user_id: {type:String},   //对方公司负责人id(卖东西的人)----占时为刷库开启
    other_id: {type:String},        //对方公司id(卖东西的公司)
    other_type: {type:String},      //对方公司类型
    // type: {type:String},            //关系类型(申请等待，同意)，
    // time_send_msg: {type:Date, default:function(){return new Date()}},     //发送通知时间
    // time_verify: {type:Date},       //认证时间
    time_creation: {type:Date, default:function(){return new Date()}}
});

module.exports = mongoose.model('company_relation', RelationSchema);
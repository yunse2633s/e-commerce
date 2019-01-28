/**
 * Created by Administrator on 2017/2/13.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
//上线用户优惠劵金额，消费，次数，时限，注册时间，启用时间，使用记录;
//一个红卡 可以多次给一个人吗
var RedCardOrder = new Schema({
    user_id: {type:String},             //接卡人
    user_phone: {type: String},         //接卡人手机号
    card_id: {type: String},            //卡id
    send_user_id: {type: String},     //发卡人
    money_remain: {type: Number},       //卡额度 number
    money: {type: Number},       //当前发放额度
    time_validity: {type: Date},        //卡有效期 date
    time_end: {type: Date},             //最后使用时间 date
    time_creation: {type: Date, default: Date.now}, //创建时间
    operate_num: {type: Number},        //使用次数 number
    max_step: {type: Number},   //步长，单次使用额度
    frequency: {type: Number},  //频率
    status: {type: String, default: 'effective'},     //状态
    card_name: {type: String}, //卡名
    send_company_id: {type: String},
    send_company_name: {type: String}
    //使用关联id array
});

module.exports = mongoose.model('RedCardOrder', RedCardOrder);
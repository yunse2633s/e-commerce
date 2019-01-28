/**
 * Created by Administrator on 2017/2/13.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
//创建人，创建公司，创建时间，优惠卷名字,使用范围，使用金额，使用期限，使用频率，使用额度，使用对象;
var RedCard = new Schema({
    user_id: {type:String},     //表单发起者的用户ID。
    company_id: {type:String},  //表单发起者的用户公司ID。
    company_name: {type: String}, //公司名字
    name: {type: String},       //优惠卷名称
    scope: {type: String},      //使用范围: 信息费，货运费
    money: {type: Number},      //红包金额
    time_validity: {type:Date}, //有效期
    time_creation: {type:Date, default: Date.now}, //创建时间
    time_modify: {type:Date, default: Date.now}, //创建时间
    status: {type: String},     //红包状态
    max_step: {type: Number, default: 1},   //步长，单次使用额度  若没有步长或频率 则表示不限制
    frequency: {type: Number, default: 10000},  //频率
    theme: {type:String},         //主题类型 邀请型, 待注册型，线下找车型
    allot: {type: String},      //分配类型：均分，随机，同面值
    flow: {type: Number, default: 0},      //发送累计
    flow_limited:{type: Number,default: 0}, //限量发售
    price_chart: {type: Array, default:[]}
});

module.exports = mongoose.model('RedCard', RedCard);
/**
 * 按分成比例计算物流人员信息费，{type:all}表示合计，{type:once}表示单笔订单的分配
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
//创建人，创建公司，创建时间，优惠卷名字,使用范围，使用金额，使用期限，使用频率，使用额度，使用对象;
var InfoPrice = new Schema({
    user_id: {type:String},     //表单发起者的用户ID。
    company_id: {type:String},  //表单发起者的用户公司ID。
    tip_price_id: {type:String}, //支付账单id
    order_index: {type:String},//司机订单id,
    after_tax: {type:Number, default: 0},//所得值
    before_tax: {type:Number, default: 0}, //总金额
    in_discount: {type:Number, default: 0}, //物流内部折扣
    out_discount: {type:Number, default: 0}, //平台折扣
    type: {type: String}, //单独还是合计
    price_total: {type: Number, default: 0}, //分成总计
    send_price: {type: Number, default: 0}, //已提取
    time_creation: {type: Date, default: Date.now()}
});

module.exports = mongoose.model('InfoPrice', InfoPrice);
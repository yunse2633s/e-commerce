/**
 * Created by Administrator on 2015/11/16 0016.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var TrafficOffer = new Schema({
    //基本信息
    supply_user_id: {type: String},                 //创建人
    demand_id: {type: String},              //所属物流需求单id
    order_id: {type: String},               //所属订单id(如果该抢单生成订单则有此字段)
    supply_company_id: {type: String},             //所属公司
    supply_company_name: {type: String}, //所属公司名
    price: {type: Number},                  //总价格（2.0.0以后是总价格）
    prices: {type: Array},                             //价格
    prices_replenish: {type: Array},                 //补货价格
    amount: {type:Number},                 //凑单数(最大)
    min: {type: Number},                    //凑单数(最小)
    //付款方式
    payment_choice: {type: String},          //现有支付选择(现金，银兑，商兑)
    payment_method: {type: String},          //现有支付方法(货到付款，款到付货，分期，信用)
    count_day_extension: {type: Number},    //延期天数
    ref_day_extension: {type: String},      //延期计算标准
    percentage_advance: {type: Number},     //预付款百分比
    percentage_remain: {type: Number},      //中款百分比    
    //汇款信息
    remit_name: {type: String},               //公司名称
    remit_bank: {type: String},               //开户银行
    remit_account: {type: String},           //公司账号
    //排名用字段
    order_payment_method: {type: Number},      //支付方式排名
    order_gross: {type: Number},                 //综合排名    
    time_creation: {type: Date},          //创建时间
    time_depart: {type: Date},            //提货时间
    time_arrival: {type: Date},           //交货时间
    time_modify: {type: Date},               //修改时间
    modify_count: {type: Number, default: 3},                 //修改次数
    source: {type: String},                  //来源
    status: {type: String, default: 'effective'},           //抢单状态
});

module.exports = mongoose.model('TrafficOffer', TrafficOffer);

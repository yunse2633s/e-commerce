/**
 * Created by Administrator on 2016/11/7.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var PayRechargeSchema = new Schema({
    app_id: {type: String, require: true},
    pay_id: {type: String, require: true},//人的id
    company_id:{type:String,default:''},    //公司id
    out_trade_no: {type: String, require: true},//订单id
    packageName: {type: String, require: true},//包名
    total_amount: {type: Number, require: true},//充值金额
    trade_status: {type: String, default: 'ineffective'},
    pay_method: {type: String, default: 'Alipay'},  //类型:支付宝，微信，wow联通  Alipay、WeChat、WowUnicom info
    pay_surplus: {type: String, default: 'recharge'}, //充值/提现  recharge/withdrawals
    subject: {type: String, default: '充值'}, //充值的项目
    timeout_express: {type: String, default: '90m'}, //订单有效期
    service_charge:{type: Number, default:0},//第三方支付平台收取的服务费
    callback_info: {type: [Schema.Types.Mixed], default: {}},  //回调参数
    time_creation: {
        type: Date, default: function () {
            return new Date()
        }
    }                            //订单创建时间
});
module.exports = mongoose.model('PayRecharge', PayRechargeSchema);
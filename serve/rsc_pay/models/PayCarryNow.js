/**
 * Created by Administrator on 2016/11/7.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var PayCarryNowSchema = new Schema({
    app_id: {type: String, require: true},
    carry_id: {type: String, require: true},//人的id
    company_id:{type:String,default:''},    //公司id
    out_biz_no: {type: String, require: true},//订单id
    amount: {type: Number, require: true}, //提现金额
    trade_status: {type: String, default: 'ineffective'},
    packageName: {type: String, require: true},//包名
    pay_method: {type: String, default: 'Alipay'},  //类型:支付宝，微信  Alipay、WeChat
    pay_surplus: {type: String, default: 'recharge'}, //充值/提现  recharge/withdrawals
    payer_show_name: {type: String, default: ''}, //付款方姓名
    payee_real_name: {type: String, default: ''}, //收款方真实姓名
    remark: {type: String, default: '商品'}, //转账备注
    service_charge:{type: Number, default:0},//第三方支付平台收取的服务费
    payee_account: {type: String, default: 'dev@stark.tm'}, //充值的项目
    callback_info: {type: [Schema.Types.Mixed], default: {}},  //回调参数
    time_creation: {
        type: Date, default: function () {
            return new Date()
        }
    },                             //订单创建时间
});
module.exports = mongoose.model('PayCarryNow', PayCarryNowSchema);



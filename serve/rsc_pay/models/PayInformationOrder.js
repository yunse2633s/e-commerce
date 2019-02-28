/**
 * Created by Administrator on 2016/11/7.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var PayInformationOrderSchema = new Schema({
    payer_id: {type: String, require: true},//付款方
    receivables_id: {type: String, require: true},//收款方
    receivables_company_id:{type:String,default:''},    //收款方公司id
    orderNo: {type: String, require: true},//商户订单号
    order_id: {type: String, require: true},//订单ID
    order_type: {type: String, require: true},//订单类型  trade/traffic/driver
    amount: {type: Number, require: true}, //价格
    pay_method: {type: String, default: 'Information'},  //类型:支付宝，微信，wow联通  Alipay、WeChat、WowUnicom、 Information
    payProducts: {type: String, default: ''}, //充值项目，，例：信息费支出、信息费收入,information_expenditure/information_income
    receivablesProducts: {type: String, default: ''}, //充值项目，，例：信息费支出、信息费收入、信息费退款,information_expenditure/information_income/information_refund
    trade_status: {type: String, default: 'ineffective'},  //订单状态，值为：ineffective effective，complete,cancelled
    packageName: {type: String, require: true},//包名
    time_update: {
        type: Date, default: function () {
            return new Date()
        }
    },  //更新时间
    time_creation: {
        type: Date, default: function () {
            return new Date()
        }
    },                             //订单创建时间
});
module.exports = mongoose.model('PayInformationOrder', PayInformationOrderSchema);



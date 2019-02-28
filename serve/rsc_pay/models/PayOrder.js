/**
 * Created by Administrator on 2016/11/7.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var PayOrderSchema = new Schema({
    payer_id: {type: String, require: true},//付款方
    receivables_id: {type: String, require: true},//收款方
    interfaceVersion: {type: String, require: true},
    tranType: {type: String, require: true},
    merNo: {type: String, require: true},
    goodsName: {type: String, require: true},
    orderDate: {type: String, require: true},
    orderNo: {type: String, require: true},//商户订单号
    amount: {type: Number, require: true}, //价格
    charSet: {type: String, require: true},
    payProducts: {type: String, default: ''},
    tradeMode: {type: String, require: true},
    reqTime: {type: String, require: true},
    respMode: {type: String, require: true},
    callbackUrl: {type: String, default: ''},
    signType: {type: String, default: 'RSA_SHA256'},
    serverCallUrl: {type: String, default: ''},
    trade_status: {type: String, default: 'ineffective'},
    pay_method: {type: String, default: 'WowUnicom'},  //类型:支付宝，微信，wow联通  Alipay、WeChat、WowUnicom
    pay_surplus: {type: String, default: 'order'}, //充值/提现/订单  recharge/withdrawals/informationorder
    time_creation: {
        type: Date, default: function () {
            return new Date()
        }
    },                             //订单创建时间
});
module.exports = mongoose.model('PayOrder', PayOrderSchema);



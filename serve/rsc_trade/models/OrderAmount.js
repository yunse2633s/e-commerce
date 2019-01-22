/**
 * Created by Administrator on 2018\3\29 0029.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//推送数量
var OrderAmountSchema = new Schema({
    company_id: {type: String, required: true}, // 公司id
    amount: {type: Number, default: 0},         // 销售订单总吨数
    constant: {type: Number, default: 500},     // 销售订单设置的常量
    open: {type: Boolean, default: true},     // 销售订单设置是否推送
    time_creation: {                            // 时间
        type: Date, required: true, default: function () {
            return new Date();
        }
    }
});

module.exports = mongoose.model('OrderAmount', OrderAmountSchema);
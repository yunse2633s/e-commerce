/**
 * Created by Administrator on 2016/11/7.
 * (1) 提现表
 *（2）充值表
 *（3）订单表
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var PayAggregateSchema = new Schema({
    PID: {type: String, require: true},
    type: {type: String, default: 'all'},                                                //
    user_id: {type: String, default: ''},
    company_id: {type: String, default: ''},
    orderNo: {type: String, require: true},                           //商户订单号
    source: {type: String, default: ''},                              //来源
    time_creation: {
        type: Date, default: function () {
            return new Date()
        }
    }, //订单创建时间
});
module.exports = mongoose.model('PayAggregate', PayAggregateSchema);



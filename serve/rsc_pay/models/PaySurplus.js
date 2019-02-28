/**
 * Created by Administrator on 2016/11/7.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var PaySurplusSchema = new Schema({
    pay_id: {type: String, default: ''},//人的id
    role: {type: String, default: ''},//角色
    pay_surplus_amount: {type: Number, require: true}, //余额
    time_update: {
        type: Date, default: function () {
            return new Date()
        }
    },//更新时间
    time_creation: {
        type: Date, default: function () {
            return new Date()
        }
    },                             //订单创建时间
});
module.exports = mongoose.model('PaySurplus', PaySurplusSchema);



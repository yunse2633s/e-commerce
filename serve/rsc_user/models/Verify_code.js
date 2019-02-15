/**
 * Created by Administrator on 2015/11/6 0006.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var VerifyCodeSchema = new Schema({
    code: {type: String},
    phone: {type: String},
    companyType: {type: String},
    type: {type: String},             //注册端的类型
    time_creation: {
        type: Date, default: function () {
            return new Date()
        }
    }
});

module.exports = mongoose.model('VerifyCode', VerifyCodeSchema);
/**
 * Created by Administrator on 2015/12/28.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var CompanyListSchema = new Schema({
    company_id: {type:String},     //公司id
    time_creation: {type:Date, default:function(){return new Date()}},
    type: {type:String}             //类型
});

module.exports = mongoose.model('company_list', CompanyListSchema);
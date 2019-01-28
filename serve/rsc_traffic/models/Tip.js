/**
 * Created by Administrator on 2017/2/13.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var TipSchema = new Schema({
    user_id: {type:String},                 //表单发起者的用户ID。
    company_id: {type:String},              //表单发起者的用户公司ID。
    other_company_id: {type:String},        //获取对方公司id
    update_time: {type:Date},               //获取时间
    type: {type:String}                     //类型
});

module.exports = mongoose.model('Tip', TipSchema);
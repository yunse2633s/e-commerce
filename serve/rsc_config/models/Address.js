/**
 * Created by Administrator on 2016/11/7.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var AddressSchema = new Schema({
    user_id: {type:String},              //个人id
    company_id: {type:String},          //公司id
    province: {type:String},            //省
    city: {type:String},                //市
    district: {type:String},           //区县
    addr: {type:String},                //详细
    status: {type:String, default:'effective'},                //状态
    time_creation: {type:Date, default:function(){return new Date()}},
    // detailed_address:String,
    differentiate:String,
    prin_name: {type:String},       //仓库联系人姓名
    prin_phone: {type:String},     //仓库联系人电话
    is_default: {type:Boolean, default:true}             //是否设为默认
    // zone_num:{type: String, default:'+86'} // 区域号
});

module.exports = mongoose.model('Address', AddressSchema);
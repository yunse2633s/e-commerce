/**
 * Created by Administrator on 2015/11/6 0006.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var CompanySchema = new Schema({
    nick_name: {type: String, default: ''},     //正经公司名
    currency: {type: Number, default: 0},
    full_name: {type: String},  //公司全名
    verify_phase: {type: String, default: 'NO'},//认证状态
    url_yingyezhizhao: {type: String},
    url_logo: {type: String},
    url_company_bg_img: {type: String},      //企业背景图
    url_honor: {type: Array, default: []},   //荣誉图
    province: {type: String},           //省
    city: {type: String},               //市
    district: {type: String},           //区县
    addr: {type: String},               //详细
    location: {type: [Number]},         //经纬度
    person_count: {type: String},       //公司人数
    des: {type: String, default: ''},           //公司描述
    phone_creator: {type: String},              //公司创建人电话（第一个）
    time_creation: {
        type: Date, default: function () {
            return new Date()
        }
    }
});

module.exports = mongoose.model('company', CompanySchema);
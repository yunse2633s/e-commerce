/**
 * 用于线路报价排序、回城价，去程价的
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var trafficLinePrice = new Schema({
    user_id: {type:String},         //人id
    company_id: {type: String}, //公司id
    line_id: {type: String},    //线路id
    price: {type:Number, default:0},        //线路价格
    type:{type: String, default: 'goTo'}, //线路类型

    start_province: {type:String},  //省
    start_city: {type:String},      //市
    start_district: {type:String},   //区县

    end_province: {type:String},    //省
    end_city: {type:String},        //市
    end_district: {type:String},    //区县
    order_count: {type: Number, default:0},
    cargo: {type: Array, default: []},         //货物清单
});

module.exports = mongoose.model('trafficLinePrice', trafficLinePrice);
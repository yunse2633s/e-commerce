/**
 * Created by Administrator on 2015/11/23.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var TruckSchema = new Schema({
    number: {type:String},   //车牌号
    type: {type:String},     //类型
    long: {type:String},    //车长
    weight: {type:String},  //载重
    brand: {type:String},  //品牌 --- 暂时没有
    time_creation: {type:Date, default:function(){return new Date()}},
    xing_shi_zheng_url: {type:String},  //行驶证照片
    yun_ying_zheng_url: {type:String},  //运营证照片
    che_tou_zhao_url: {type:String},    //车头照
    create_user_id: {type:String},          //创建者用户id(司机创建)
    create_company_id: {type:String},          //创建者公司id(物流管理创建)
    user_id: {type:Array},                   //所属用户
    source: {type: String}, //备注 remark，主动创建 active，被动邀请 passive
    is_default: {type:Boolean, default:false},       //是否设为默认车辆

    trailer_licence:{type: String}   //挂车拍照

    // replenishment:{type:Array},     //补货
    // compile_status: {type:Boolean, default:true},
    //line_id: {type:Array}                    //所属线路
});

module.exports = mongoose.model('truck', TruckSchema);

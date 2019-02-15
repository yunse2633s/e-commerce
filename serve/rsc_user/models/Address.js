/**
 * Created by Administrator on 2016/11/7.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var AddressSchema = new Schema({
    user_id: {type: String},             //个人id
    company_id: {type: String},          //公司id
    province: {type: String},            //省
    city: {type: String},                //市
    district: {type: String},            //区县
    addr: {type: String},                //详细
    status: {type: String, default: 'effective'},     //状态
    time_creation: {
        type: Date, default: function () {
            return new Date()
        }
    },
    location: {type: [Number]},         //经纬度
    differentiate:  {type: String},     //提货交货地址
    prin_name: {type:String},           //仓库联系人姓名
    prin_phone: {type:String},          //仓库联系人电话
    type: {type:String},                //地址类型，仓库还是个人地址------仓库新增,地址没有此字段，仓库有此字段
    area: {type:Number},                //仓库面积------仓库新增
    user_ids: {type:Array},             //仓库绑定人------仓库新增
    name: {type:String},                //仓库名称------仓库新增
    is_default: {type:Boolean, default:false}       //是否设为个人默认
    // zone_num:{type: String, default:'+86'}       //区域号
});

module.exports = mongoose.model('Address', AddressSchema);

//关于地理位置创建查询链接
//http://www.cnblogs.com/Jarvin/p/5706554.html
//http://blog.csdn.net/yonggang7/article/details/28109463
//http://blog.csdn.net/wmzy1067111110/article/details/50483295
//http://cnodejs.org/topic/5683879559ec59521f2f1740
//https://docs.mongodb.com/manual/reference/operator/query/minDistance/
//https://stackoverflow.com/questions/24297556/mongoose-aggregation-with-geonear
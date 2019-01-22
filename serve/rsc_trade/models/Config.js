/**
 * Created by Administrator on 17/9/29.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//属性，产品名称，单位
var configSchema = new Schema({
    name: {type: String, required: true},                        // 名称
    unit: {type: String, default: ''},                           // 单位
    status: {type: String, required: true},                      // 类型
    number: {type: Number, required: true},                      // 排序用
    numbering: {type: String},                                   // 属性编号
    PID: {type: Array, required: true},                          // 父节点
    vary: {type: String, default: ''},                           // 增长值
    calculate: {type: Boolean, default: false},                   // 增长值
    double:{type: Boolean, default: true}                          //是否是两个值
});

module.exports = mongoose.model('config', configSchema);

// config表包括属性，产品名称，单位，理计
// status:	属性	attribute			没有PID,number
// 产品名称	product_name	        有PID,number无numbering,keyboard
// 单位	unit				        没有PID,number（理计算单位有name）
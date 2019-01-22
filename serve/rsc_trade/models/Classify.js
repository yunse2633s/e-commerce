/**
 * Created by Administrator on 17/9/29.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//产品分类
var ProductClassifySchema = new Schema({
    PID: {type: String, required: true},                         // 父节点
    chn: {type: String, required: true},                         // 中文
    eng: {type: String, required: true},                         // 英文
    lev: {type: Number, default: 0},                             // 层级数
    line: {type: Number},                                        // 属于配置表行数
    attribute: {type: String, default: ''},                      // 属性
    price_type: {type: String, default: ''},                     // 价格类型
    unit_product: {type: String, default: ''},                   // 产品单位
    unit_pass: {type: String, default: ''},                      // 运输单位
    unit_metering: {type: String, default: ''},                  // 计量单位 有计量单位即可设置理记
    path_loss: {type: Boolean},                                  // 是否有路耗
    file: {type: String}
});

module.exports = mongoose.model('classify', ProductClassifySchema);


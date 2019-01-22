/**
 * Created by Administrator on 17/9/18.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//报价产品分类下的产品名称
var ModelSchema = new Schema({
    name: {type: String, default: ''},                 // 产品名称
    amount: {type: Number, default: 0},                // 总吨数
    amount_unit: {type: Number, default: 0},           // 理记吨数
    number: {type: Number, default: 0},                // 件数
    price_remember: {type: Number},                    // 理记价
    price_weight: {type: Number},                      // 过磅价
    price_remember_inclusive: {type: Number},          // 理记价(含税)
    price_weight_inclusive: {type: Number},            // 过磅价(含税)
    price_update: {type: Number, default: 0},          // 上次调价额度
    price_preferential: {type: Schema.Types.Mixed, default: []},    // 上次调价额度
    product_price: {type: Schema.Types.Mixed, default: []},// 价格类型
    price_remember_min: {type: Number},                 // 理记价
    price_weight_min: {type: Number},                   // 过磅价
    price_remember_max: {type: Number},                 // 理记价
    price_weight_max: {type: Number},                   // 过磅价
    image: {type: Array, default: []},                  // 质检图片
    measure_unit: {type: Schema.Types.Mixed, default: {}},// 计量单位
    attribute: {type: Schema.Types.Mixed, default: []}, // 属性
    short_id: {type: String}                            //短id
});

module.exports = mongoose.model('ProductName', ModelSchema);
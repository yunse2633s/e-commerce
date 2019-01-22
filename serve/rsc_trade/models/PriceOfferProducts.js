/**
 * Created by Administrator on 17/6/15.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//报价产品分类
var PriceOfferProducesSchema = new Schema({
    user_id: {type: String, required: true},                     // 表单发起者的用户ID。
    company_id: {type: String, default: ""},                     // 表单发起者所属公司的ID。

    PID: {type: Array, required: true},                          // 上级id
    product_name: {type: Array, required: true},                 // 产品名称id数组

    unit: {type: String, required: true},                        // 单位
    pass_unit: {type: String, required: true},                   // 运输单位

    layer: {type: Schema.Types.Mixed, required: true},           // 产品类别

    replenish: {type: Boolean, default: false},                  // 是否允许补货
    path_loss: {type: Boolean, default: false},                  // 是够计算路耗
    display_path_loss:{type:Boolean,default:false},              // 是否有合理路耗
    modify_amount: {type: Boolean, default: false}               // 指派物流时是否允许修改吨数
});

module.exports = mongoose.model('PriceOfferProduces', PriceOfferProducesSchema);
/**
 * Created by Administrator on 2016/5/18 0018.
 * 物流模板
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//运费模板
var PriceOfferSchema = new Schema({
    name: {type: String, default: ""},                                          // 自定义运费模板名称。
    user_id: {type: String, required: true},                                    // 表单发起者的用户ID。
    company_id: {type: String, default: ""},                                    // 表单发起者所属公司的ID。

    //其他参数
    location_storage: {type: String, default: ""},                              // 提货地址/交货地址
    warehouse_name:{type: String, default: ""},                                 // 仓库名称
    type: {type: String, default: ""},                                          // 运输类型
    pass_type:{type: String, default: ""},                                      // 运费模板类型
    role: {type: String, default: ""},                                          // 发单人角色
    appendix: {type: String, default: ""},                                      // 备注

    //time_goods: {type: Number, default: ""},                                  // 发货时间
    time_creation: {
        type: Date, required: true, default: function () {
            return new Date();
        }
    }
});

module.exports = mongoose.model('PassPrice', PriceOfferSchema);
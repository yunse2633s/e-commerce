/**
 * Created by Administrator on 17/5/15.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//竞价出价
var OfferAgainSchema = new Schema({
    offer_id: {type: String, required: true},                                   // 报价id
    order_id: {type: String, default: ''},                                      // 已生成订单的id
    admin_id: {type: String, default: ""},                                      // 指挥中心带操作人的id

    user_demand_id: {type: String, required: true},                             // 买方user_id
    user_supply_id: {type: String, required: true},                             // 报价方用户id
    company_demand_id: {type: String, default: ""},                             // 买方公司id
    company_demand_name: {type: String, default: ""},                           // 买方公司名称
    company_supply_name: {type: String, default: ""},                           // 报价方公司名称
    company_supply_id: {type: String, default: ""},                             // 报价方公司id

    payment_style: {type: String, required: true},                              // 报价类型

    product_categories: {type: Schema.Types.Mixed, required: true},             // 产品分类

    att_quality: {type: String, required: true},                                // 质检归属
    att_payment: {type: String, required: true},                                // 支付选择（现金，银行兑票，商业兑票）
    att_traffic: {type: String, required: true},                                // 物流细则
    att_settlement: {type: String, required: true},                             // 结算方式
    path_loss: {type: Schema.Types.Mixed, default: {}},                         // 路耗

    price: {type: Number, default: 0},                                          // 单价
    amount: {type: Number, default: 0},                                         // 重量

    location_storage: {type: String, default: ""},                              // 提货地址
    location_depart: {type: String, default: ''},                               // 到货地址
    price_type: {type: String, default: ''},                                    // 价格类型
    quality_img: String,                                                        // 质检报告
    role: {type: String, default: ""},                                          // 发单人角色
    type: {type: String, default: ''},                                          // 区间竞价还是固定竞价
    appendix: {type: String, default: ""},                                      // 备注
    replenish: [Schema.Types.Mixed],                                            // 可补货内容
    change_remain: {type: Number, default: 1},                                  // 剩余的能够修改次数

    delay_day: {type: Number, default: 0},                                      // 最终支付可延期天数
    delay_type: {type: String, default: ""},                                    // 延期计算标准（确认订单时、货到后）
    percent_advance: {type: Number, default: 0},                                 // 分期付款时首款百分比

    time_validity: Date,                                                        // 失效时间
    time_creation: {
        type: Date, required: true, default: function () {
            return new Date();
        }
    }                                                                           // 单据发布时间

});

module.exports = mongoose.model('OfferAgain', OfferAgainSchema);
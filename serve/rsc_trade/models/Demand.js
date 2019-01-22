/**
 * Created by Administrator on 2015/11/16 0016.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var DemandSchema = new Schema({
    ownType: {type: String, default: 'demand'},                                 // 自己。

    user_id: {type: String, required: true},                                    // 表单发起者的用户ID。
    company_id: {type: String, default: ""},                                    // 表单发起者所属公司的ID。
    company_name: {type: String, default: ""},                                  // 发起公司的名称
    admin_id: {type: String, default: ""},                                      // 指挥中心带操作人的id

    payment_style: {type: String, default: ''},                                 // 报价方式 -- 出厂价或到岸价

    product_categories: {type: Schema.Types.Mixed, required: true},             // 产品分类
    price_routes: {type: Schema.Types.Mixed, required: true},                   // 区域优惠，目前没有

    att_quality: {type: String, required: true},                                // 质检归属
    att_payment: {type: String, required: true},                                // 付款类型（现金，银行兑票，商业兑票）
    att_traffic: {type: String, required: true},                                // 物流细则
    att_settlement: {type: String, required: true},                             // 结算方式
    path_loss: {type: Schema.Types.Mixed, default: {}},                         // 路耗

    amount: {type: Number, default: 0},                                         // 采购数量
    amount_remain: {type: Number, default: 0},                                  // 在生成订单的过程中，该采购单已下单多少的可采购量

    status: {type: String, default: 'published'},                               // 是否有效，即是否可抢单
    type: String,                                                               // 区间竞价，定价竞价
    appendix: {type: String, default: ""},                                      // 备注

    location_depart: {type: String, default: ''},                               // 到货地址
    location_storage_unit_id: {type: String, default: ''},                      // 到货地址区域
    list_offer: {type: Array, default: []},                                     // 已抢单表单，抢单人id
    count_offer: {type: Number, default: 0},                                    // 已抢单个数
    browse_offer: {type: Array, default: []},                                   // 浏览用户id数组
    role: {type: String, default: ""},                                          // 发单人角色
    has_order: {type: Array, default: []},                                      // 已下单用户

    delay_day: {type: Number, default: 0},                                      // 最终支付可延期天数
    delay_type: {type: String, default: ""},                                    // 延期计算标准（确认订单时、货到后）
    percent_advance: {type: Number, default: 0},                                // 分期付款时首款百分比

    time_creation: {
        type: Date, required: true, default: function () {
            return new Date();
        }
    },                                                                          // 单据发布时间
    time_validity: Date                                                         // 有效期
});

module.exports = mongoose.model('Demand', DemandSchema);
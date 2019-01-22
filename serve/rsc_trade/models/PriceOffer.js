/**
 * Created by Administrator on 2016/5/18 0018.
 * 主动报价单
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//报价
var PriceOfferSchema = new Schema({
    ownType: {type: String, default: 'offer'},                                  // 自己。

    admin_id: {type: String},                                                   // 指挥中心带操作人的id
    user_id: {type: String, required: true},                                    // 表单发起者的用户ID。
    company_id: {type: String, default: ""},                                    // 表单发起者所属公司的ID。
    company_name: {type: String, default: ""},                                  // 发起公司的名称

    att_quality: {type: String, required: true},                                // 质检归属
    att_payment: {type: String, required: true},                                // 付款类型（现金，银行兑票，商业兑票）
    att_traffic: {type: String, required: true},                                // 物流细则
    att_settlement: {type: String, required: true},                             // 结算方式
    path_loss: {type: Schema.Types.Mixed, default: {}},                         // 路耗

    //金额区间
    // FOB: {type: Schema.Types.Mixed, default: {}},                               // FOB区间
    // CIF: {type: Schema.Types.Mixed, default: {}},                               // CIF区间
    amount: {type: Number, default: 0},                                         // 竞价吨数
    amount_remain: {type: Number, default: 0},                                  // 下单了多少吨

    //其他参数
    location_storage: {type: String, default: ""},                              // 提货地址
    location_storage_unit_id: {type: String, default: ""},                      // 提货地址区域
    passPrice_id: {type: String, default: ""},                                  // 运费模板
    status: {type: String, default: "expired"},                                 // 状态
    type: {type: String, default: ""},                                          // 定价或者竞价分类
    role: {type: String, default: ""},                                          // 发单人角色
    appendix: {type: String, default: ""},                                      // 备注
    warehouse_name: {type: String, default: ""},                                // 仓库名称
    lock: {type: Boolean, default: true},                                       // 报价锁
    list_offer: {type: Array, default: []},                                     // 已抢单表单
    count_offer: {type: Number, default: 0},                                    // 已抢单个数
    browse_offer: {type: Array, default: []},                                   // 浏览用户id数组
    has_order: {type: Array, default: []},                                      // 已下单用户
    timeout_price: {type: Number, default: 0},                                  // 未按时提货扣款
    not_count_price: {type: Number, default: 0},                                // 提货完成百分比不计扣款
    price_history: {type: Schema.Types.Mixed, default: []},                    // 历史价格
    starting_count: {type: Number},                                             // 起订吨数/件数
    isDelivery:{type:Boolean,default:false},                                    //是否包邮
    //结算方式对应
    delay_day: {type: Number, default: 0},                                      // 最终支付可延期天数
    delay_type: {type: String, default: ""},                                    // 延期计算标准（确认订单时、货到后）
    percent_advance: {type: Number, default: 0},                                // 分期付款时首款百分比

    background_urls: {type: Array, default: []},                                // 报价背景图

    //时间相关
    time_goods: {type: String},                                                 //发货时间
    time_validity: Date,                                                        // 失效时间

    date_type:{type: String},                                                   //截止日期(cut)或提货其实时间(start)
    cut_date:{type: Number},                                                    //截止日期 0-24
    cut_type:{type: String},                                                    //截止日期 当日today、次日morrow
    start_date:{type: Number},                                                  //提货起始时间 0-999999

    lock_date:{type: Date},                                                     //报价关闭盘时间
    time_creation: {
        type: Date, required: true, default: function () {
            return new Date();
        }
    },                                                                         // 单据发布时间
    time_update: {
        type: Date, required: true, default: function () {
            return new Date();
        }
    },                                                                         // 单据修改时间
    time_update_quality_img: {
        type: Date, required: true, default: function () {
            return new Date();
        }
    },                                                                         // 质检图片更新时间
    cut_time: {type: Date},                                                    // 提货截止日期
    time_update_price: {type: Date},                                           // 调价时间  调过价才有
    time_preferential: {type: Date},                                           // 优惠价格  同上
    sum_number:{type:Number,default:0}                                         // 竞价总件数
});

module.exports = mongoose.model('PriceOffer', PriceOfferSchema);
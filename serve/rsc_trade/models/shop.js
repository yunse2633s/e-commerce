/**
 * Created by Administrator on 2016/12/13.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//计划
var shopSchema = new Schema({
    order_id: {type: String, default: ''},                                      // 生成的订单
    offer_id: {type: String, required: true},                                   // 主动报价单ID
    user_demand_id: {type: String, required: true},                             // 买方user_id
    user_supply_id: {type: String, required: true},                             // 报价方用户id
    company_demand_id: {type: String, default: ""},                             // 买方公司id
    company_demand_name: {type: String, default: ""},                           // 买方公司名称
    company_supply_name: {type: String, default: ""},                           // 报价方公司名称
    company_supply_id: {type: String, default: ""},                             // 报价方公司id

    payment_style: {type: String, required: true},                              // 报价类型

    product_categories: {type: Schema.Types.Mixed, required: true},             // 产品相关

    att_quality: {type: String, required: true},                                // 质检归属
    att_payment: {type: String, required: true},                                // 付款类型（现金，银行兑票，商业兑票）
    att_traffic: {type: String, required: true},                                // 物流细则
    att_settlement: {type: String, required: true},                             // 结算方式
    path_loss: {type: Schema.Types.Mixed, default: {}},                         // 路耗

    type: {type: String, required: true},                                       // 价格类型 过磅or理记
    price: {type: Number, required: true},                                      // 价格
    price_pass: {type: Number, default: 0},                                     // 运费价格
    amount: {type: Number, required: true},                                     // 吨数
    starting_count: {type: Number},                                             // 起订吨数/件数

    location_storage: {type: String, required: true},                           // 地址
    location_storage_unit_id: {type: String},                                   // 地址区域
    location_depart: {type: String},                                            // 交货地址
    location_depart_unit_id: {type: String},                                    // 交货地址区域
    address_Obj: {type: Schema.Types.Mixed, default: {}},                       // 交货地址详细
    warehouse_name: {type: String, default: ""},                                 // 仓库名称

    delay_day: {type: Number, default: 0},                                      // 最终支付可延期天数
    delay_type: {type: String, default: ""},                                    // 延期计算标准（确认订单时、货到后）
    percent_advance: {type: Number, default: 0},                                // 分期付款时首款百分比

    changePrice: {type: Schema.Types.Mixed},                                    // 父级报价改变之后，究竟是涨价还是下调

    status: {type: Boolean, default: false},                                    // 如果父级报价有变，则变为true

    date_type:{type: String},                                                   //截止日期(cut)或提货其实时间(start)
    cut_date:{type: Number},                                                    //截止日期 0-24
    cut_type:{type: String},                                                    //截止日期 当日today、次日morrow
    start_date:{type: Number},                                                  //提货起始时间 0-999999

    timeout_price: {type: Number, default: 0},                                  // 未按时提货扣款
    not_count_price: {type: Number, default: 0},                                // 提货完成百分比不计扣款

    time_creation: {
        type: Date, default: function () {
            return new Date();
        }
    }                                                                           // 单据发布时间
});

module.exports = mongoose.model('shop', shopSchema);
/**
 * Created by Administrator on 2015/11/25.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var TrafficDriverOrder = new Schema({
    index: {type:String, unique: true},                                                   //随机生成订单号
    demand_id: {type:String},                                                            //本次所属司机需求单id
    offer_id: {type:String},                                                             //抢单id  
    order_id: {type:String},                                                             //物流订单id
    demand_user_id: {type:String},                                                       //需求发布方用户_id
    demand_company_id: {type:String},                                                    //需求发布方公司_id
    demand_user_name: {type: String},       //物管名字
    demand_company_name: {type: String},       //物管公司名字
    supply_user_id: {type:String},                                                       //接单人id
    supply_user_name: {type: String},       //司机名字
    supply_user_phone: {type: String},      //司机电话
    truck_num: {type: String},       //车辆拍照
    // truck_id: {type:String},                                                            //所属卡车id
    truck_weight: {type: String},                                                       //车辆载重
    role: {type:String},                                                                //司机角色（挂靠，自有）
    //货源信息
    material: {type:String},                //行业类别
    material_chn: {type: String},
    category: {type:String},                //商品类型
    category_chn: {type:String},                //商品类型
    amount: {type:Number, default:0},                                                   //分配吨数
    price: {type: Number, default: 0},              //单价
    price_total: {type: Number, default: 0},        //总价
    product_categories: {type:Array, default: []},                                                             //产品
    products_remain: {type:Array, default: []},                  //剩余产品
    products_replenish: {type:Array, default: []},                                                   //补货产品目录
    price_type: {type:String},              //价格类型
    //付款方式 和发票信息
    //支付字段
    payment_choice: {type:String},          //现有支付选择(现金，银兑，商兑)
    payment_method: {type:String},          //现有支付方法(货到付款，款到付货，分期，信用)
    count_day_extension: {type:Number, default: 0},    //延期天数
    time_day_extension: {type:Date},       //实际还款天数
    ref_day_extension: {type:String},      //延期计算标准
    percentage_advance: {type:Number, default: 0},     //预付款百分比
    percentage_remain: {type:Number, default: 0},      //中款百分比
    //细则
    weigh_settlement_style: {type:String},  //重量结算方式
    time_settlement_style: {type:String},   //时间结算方式
    att_traffic: {type:Schema.Types.Mixed}, //物流细则
    appendix: {type:String},                 //备注
    quality_origin: {type: String}, //质检方
    //汇款信息
    remit_name: {type:String},               //公司名称
    remit_bank: {type:String},               //开户银行
    remit_account: {type:String},           //公司账号
    //发票信息
    invoice_name: {type:String},               //发票公司名
    invoice_addr: {type:String},               //单位地址
    invoice_number: {type:String},             //税号
    invoice_phone: {type:String},              //公司电话
    invoice_bank: {type:String},               //开户银行
    invoice_account: {type:String},           //公司账号
    //地址信息
    send_address_id: {type:String}, //地址id
    send_name: {type:String},                  //发送方名字
    send_phone: {type:String},                 //发送方电话
    send_province: {type:String},             //省
    send_city: {type:String},                  //市
    send_district: {type:String},             //区
    send_addr: {type:String},                 //详细
    send_loc: {type: Array, default: []},   //经纬度
    receive_address_id: {type:String}, //地址id
    receive_name: {type:String},             //接收方名字
    receive_phone: {type:String},            //接收方电话
    receive_province: {type:String},        //省
    receive_city: {type:String},             //市
    receive_district: {type:String},        //区
    receive_addr: {type:String},             //详细
    receive_loc: {type: Array, default: []},   //经纬度
    //订单辅助信息
    time_depart: {type:Date},                                                              //提货时间 time_depart get_time
    time_arrival: {type:Date},                                                             //交货时间 time_arrival time
    time_creation: {type:Date},                                                          //指派时间/接单时间 traffic_time
    time_update_step: {type:Date},                                                      //流程状态时间（所有步骤都更新）
    step: {type: Number, default: 0.5},   //步骤 1,2,3,4,5,
    status: {type:String, default: 'ineffective'},              //本次物流状态 ,not_arrival
    source: {type:String},                                                          //来源同需求单

    //临时出现的字段
    replenish: {type:Schema.Types.Mixed},                                               //补充信息
    amount_send_start: {type: Number},          //过磅提货入库
    amount_send_end: {type: Number},            //过磅提货出库
    amount_send_sub: {type: Number},            //过磅提货差值
    amount_receive_start: {type: Number},       //过磅交货入库
    amount_receive_end: {type: Number},         //过磅交货出库
    amount_receive_sub: {type: Number},         //过磅交货差值
    //20170901
    time_sort: {type: String}, //月份排序字段
    
    lading_code: {type: String},     //提交货码
    catalogue: {type: Array, default: []}, //产品目录
    amount_remain: {type: Number, default: 0}, //剩余吨数
    section: {type: Array, default: []},  //区间
    end_section: {type: Array, default: []},  //区间
    tip_price: {type: Number, default: 0}, //信息费
    send_nickname: {type:String},   //提货仓库昵称
    receive_nickname: {type:String},   //交货仓库昵称
    time_tip_price: {type: Number}, //信息费付款时间 20180226
    tip_prices: {type: Number}, //信息费之和 20180226
    tip_price_id: {type: String}, //付费id
    libra_id: {type: String, default: ''}, //天平秤的编号
    libra_amount: {type: Number, default: 0}, //净重
    index_trade: {type: String},                    //交易订单
    demand_trade_user_id: {type: String},           //发布物流需求的交易人员
    payment_payer: {type: String},                          //付费人 收货方，发货发，物流方
    category_penult: {type: String}, //倒数第二个名字
    category_penult_chn: {type: String}, //倒数第二个名字
    time_depart_start: {type: Date}, //提货开始
    time_depart_end: {type: Date}, //提货结束
    payment_payee:{type: String}, //运费收款方
    freight_voucher: {type: Schema.Types.Mixed}, //货运凭证
    plan_id:{type: String}, //接单记录
    time_cost:{type: Schema.Types.Mixed},//时间扣款
    find_category: {type: String}, //查询产品匹配,存放产品链式目录?
});

module.exports = mongoose.model('TrafficDriverOrder', TrafficDriverOrder);
/**
 step:
 1	指派完
 1.5	提货申请
 2	提货第一次过磅
 2.5	提货第二次过磅
 
 3	交货申请
 3.5	交货第一次过磅
 5	交货第二次过磅
 replenish{
    timely_price: 依据产品已完成吨数计算时时价格
    order_loading: 提货详情
    order_unloading:交货详情
    price_actual: 依据产品详情计算时时价格
    products_replenish：补货详情
    price_send_sub: 提货价格
    price_receive_sub: 交货价格
    replenish_price: 补货价格
    replenish_count: 补货数量
 }
 **/
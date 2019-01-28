/**
 * Created by Administrator on 2015/11/25.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var TrafficOrder = new Schema({
    //id索引
    index: {type:String, unique: true},         //随机生成订单号
    demand_user_id: {type:String},              //发需求单人id（就是买卖双方的一方）
    demand_user_name: {type:String},              //发需求单人id（就是买卖双方的一方）
    demand_company_id: {type:String},           //发需求单公司id（就是买卖双方的一方）
    demand_company_name: {type:String},          //交易公司名
    supply_user_id: {type:String},             //物流方接单人
    supply_user_name: {type:String},             //物流方接单人
    supply_company_id: {type:String},          //物流所属公司
    supply_company_name: {type:String},        //物流公司名
    company_sell_id: {type:String},             //卖方所属公司 (用于里记)
    company_buy_id: {type:String},              //买方所属公司 (用于里记)
    //来源
    offer_id: {type:String},                 //抢单id 20170427物管抢单记录
    demand_id: {type:String},                //挂单id 20170427交易需求记录
    index_trade: {type:String},                //交易订单号
    //基本信息
    material: {type:String},                //行业类别
    category: {type:String},                //商品类型
    category_chn: {type:String},           //商品中文名
    product_categories: {type:Array, default: []},                  //产品
    products_replenish: {type:Array},                  //补货产品目录;
    products_remain: {type:Array},                  //产品剩余
    
    price_total: {type:Number, default: 0},              //总价格
    amount: {type:Number, default: 0},        //吨数
    amount_remain: {type:Number, default: 0},  //剩余吨数
    //付款方式
    payment_choice: {type:String},          //现有支付选择(现金，银兑，商兑)
    payment_method: {type:String},          //现有支付方法(货到付款，款到付货，分期，信用)
    count_day_extension: {type:Number, default: 0},    //延期天数
    time_day_extension: {type:Date},       //实际还款天数
    ref_day_extension: {type:String},      //延期计算标准
    percentage_advance: {type:Number, default: 0},     //预付款百分比
    percentage_remain: {type:Number, default: 0},      //中款百分比
    //细则
    att_traffic: {type:Schema.Types.Mixed},        //物流细则
    weigh_settlement_style: {type:String},		  //重量结算方式
    time_settlement_style: {type:String},		  //时间结算方式
    //运输地
    send_address_id: {type:String}, //地址id
    send_company_name: {type:String},        //发送方公司名字
    send_name: {type:String},        //发送方名字
    send_phone: {type:String},       //发送方电话
    send_province: {type:String},   //发送方省
    send_city: {type:String},        //发送方市
    send_district: {type:String},   //发送方区
    send_addr: {type:String},       //发送方详细
    send_loc: {type: Array, default: []},   //经纬度
    receive_address_id: {type:String}, //地址id
    receive_company_name: {type:String},    //接收方公司名字
    receive_name: {type:String},    //接收方名字
    receive_phone: {type:String},   //接收方电话
    receive_province: {type:String},//接收方省
    receive_city: {type:String},     //接收方市
    receive_district: {type:String},//接收方区
    receive_addr: {type:String},      //接收方详细
    receive_loc: {type: Array, default: []},   //经纬度
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
    //时间
    time_arrival: {type:Date},              //交货时间
    time_depart: {type:Date},               //提货时间

    time_creation: {type:Date, default:function(){return new Date()}},              //创建时间
    time_update_step: {type: Date},     //修改时间
    //辅助
    quality_origin: {type: String}, //质检方
    appendix: {type:String},                 //备注
    source: {type:String},                    //订单来源---询价下单，报价下单，需求单单下单
    step: {type:Number, default: 1},                      //流程状态
    status: {type:String},                    //订单状态
    //临时出现的字段
    replenish: {type:Schema.Types.Mixed},                                               //补充信息
    time_sort: {type: String}, //月份排序字段
    catalogue: {type: Array, default: []}, //产品目录
    //仓库标号
    send_area: {type:Number},
    send_unit_name: {type:String},
    receive_area: {type:Number},
    receive_unit_name: {type:String},
    section: {type: Array, default: []},  //区间
    end_section: {type: Array, default: []},  //区间
    send_nickname: {type:String},   //提货仓库昵称
    receive_nickname: {type:String},   //交货仓库昵称
    payment_payer: {type: String},                          //付费人 收货方，发货发，物流方
    time_depart_start: {type: Date}, //提货开始
    time_depart_end: {type: Date}, //提货结束
    category_penult: {type: String}, //倒数第二个名字
    category_penult_chn: {type: String}, //倒数第二个名字
    payment_payee:{type: String}, //运费收款方
    freight_voucher: {type: Schema.Types.Mixed}, //货运凭证
    plan_id:{type: String}, //接单记录
    time_cost:{type: Schema.Types.Mixed},//时间扣款                                                   //修改时间
    driver_money: {type: Number, default: 0}, //车辆运费
    find_category: {type: String}, //查询产品匹配,存放产品链式目录?

});

module.exports = mongoose.model('TrafficOrder', TrafficOrder);
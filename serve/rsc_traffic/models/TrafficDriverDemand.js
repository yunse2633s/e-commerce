/**
 * Created by Administrator on 2016/5/17.
 */
/**
 * Created by Administrator on 2015/11/25.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var TrafficDriverDemand = new Schema({
    //id索引
    index: {type:String, unique: true},       //随机生成订单号    
    order_id: {type:String},                  //物流订单单id
    demand_user_id: {type:String},            //发需求单人id（就是买卖双方的一方）
    demand_user_name: {type:String},            //发需求单人id（就是买卖双方的一方）
    demand_company_id: {type:String},        //发需求单公司id（就是买卖双方的一方）
    demand_company_name: {type:String},    //物流公司名
    //基本信息
    material: {type:String},                 //行业类别
    material_chn: {type:String},                 //行业类别
    category: {type:String},
    category_chn: {type:String},           //商品中文名
    product_categories: {type:Array, default: []},                  //产品
    products_remain: {type:Array, default: []},                  //剩余产品
    products_replenish: {type:Array, default: []},        //补货产品

    amount: {type:Number, default: 0},            //运输吨数
    amount_remain: {type:Number, default: 0},           //剩余吨数
    price_type: {type:String},              //价格类型
    price: {type:Number, default: 0},                     //司机拉货的每吨价格 或平均数
    //支付方式
    payment_choice: {type:String},           //现有支付选择(现金，银兑，商兑)
    payment_method: {type:String},           //现有支付方法(货到付款，款到付货，分期，信用)    
    count_day_extension: {type:Number, default: 0},     //延期天数
    time_day_extension: {type:Date},        //实际还款天数
    ref_day_extension: {type:String},       //延期计算标准
    percentage_advance: {type:Number, default: 0},      //预付款百分比
    percentage_remain: {type:Number, default: 0},       //中款百分比
    //细则
    quality_origin: {type: String}, //质检方
    att_traffic: {type:Schema.Types.Mixed}, //物流细则
    weigh_settlement_style: {type:String},  //重量结算方式
    time_settlement_style: {type:String},   //时间结算方式
    appendix: {type:String},                 //备注
    //两方物流新增字段
    send_address_id: {type:String}, //地址id
    send_name: {type:String},        //发送方名字
    send_phone: {type:String},       //发送方电话
    send_province: {type:String},   //发送方省
    send_city: {type:String},        //发送方市
    send_district: {type:String},   //发送方区
    send_addr: {type:String},       //发送方详细
    send_loc: {type: Array, default: []},   //经纬度
    receive_address_id: {type:String}, //地址id
    receive_name: {type:String},    //接收方名字
    receive_phone: {type:String},   //接收方电话
    receive_province: {type:String},//接收方省
    receive_city: {type:String},     //接收方市
    receive_district: {type:String}, //接收方区
    receive_addr: {type:String},      //接收方详细
    receive_loc: {type: Array, default: []},   //经纬度
    //发票
    invoice_name: {type:String},               //发票公司名
    invoice_addr: {type:String},               //单位地址
    invoice_number: {type:String},             //税号
    invoice_phone: {type:String},              //公司电话
    invoice_bank: {type:String},               //开户银行
    invoice_account: {type:String},           //公司账号
    //认证
    unoffer_list: {type:Array, default:[]},         //形成过司机订单的司机id
    verify_driver: {type:Array, default:[]},       //认证的司机id
    offer_count: {type:Number, default:0},          //抢单人数
    order_count: {type:Number,default: 0}, //司机订单数
    order_complete: {type: Array, default: []}, //司机订单完成数
    //时间
    time_validity: {type:Date},            //有效期
    time_arrival: {type:Date},             //提货时间
    time_depart: {type:Date},              //交货时间
    time_creation: {type:Date, default:function(){return new Date()}},           //创建时间
    time_modify: {type:Date},               //修改时间
    
    source: {type:String},                  //需求单创建来源
    status: {type:String, default: 'effective'},                  //状态
    assign_count: {type:Number,default: 0}, //指派数
    platform_driver: {type:Array, default:[]},       //非认证的司机id
    tip_price: {type: Number, default: 0}, //信息费
    admin_id: {type: String},     //为代操作管理员
    section: {type: Array, default: []},  //区间
    end_section: {type: Array, default: []},  //区间
    send_nickname: {type:String},   //提货仓库昵称
    receive_nickname: {type:String},   //交货仓库昵称
    line_id: {type: String}, //线路id
    view_id: {type: Array, default: []}, //浏览者id
    payment_payer: {type: String}, //付费人 收货方，发货发，物流方
    category_penult: {type: String}, //倒数第二个名字
    category_penult_chn: {type: String}, //倒数第二个名字
    time_depart_start: {type: Date}, //提货开始
    time_depart_end: {type: Date}, //提货结束
    payment_payee:{type: String}, //运费收款方
    freight_voucher: {type: Schema.Types.Mixed}, //货运凭证
    sorting:{type: Number, default: 1}, //排序字段
    time_cost: {type: Schema.Types.Mixed},//时间扣款
    plan_driver:{type: Array, default:[]}, //抢单记录
    supply_user_id: {type:String},            //物流订单交易方
    supply_company_id: {type:String},        //物流订单交易方公司id（就是买卖双方的一方）
    supply_company_name: {type:String},    //物流订单交易方公司名
    find_category: {type: String}, //查询产品匹配,存放产品链式目录?
});

module.exports = mongoose.model('TrafficDriverDemand', TrafficDriverDemand);
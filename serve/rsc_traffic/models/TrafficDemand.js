/**
 * Created by Administrator on 2015/11/16 0016.
 * �ɹ���
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var TrafficDemand = new Schema({
    //基本索引
    index: {type:String, unique: true},      //需求单号
    index_trade: {type:String},              //交易订单号
    demand_user_id: {type:String},           //创建者id
    demand_user_name: {type:String},           //创建者id
    demand_company_id: {type:String},        //创建者公司id
    demand_company_name: {type:String},     //创建者公司名
    //基本信息
    company_sell_id: {type:String},         //买家公司id
    company_buy_id: {type:String},          //卖家公司id
    product_categories: {type:Array, default: []},                  //产品
    products_remain: {type:Array, default: []},                  //产品剩余
    products_replenish: {type:Array, default: []},      //补货产品
    material: {type:String},                //行业类别
    category: {type:String},                //商品类型
    category_chn: {type:String},           //商品中文名
    
    price_total: {type:Number, default: 0},                   //总价
    price_max: {type:Number, default: 0},                   //每吨最高价格
    price_min: {type:Number, default: 0},                   //每吨最低价格
    
    amount: {type:Number, default: 0},                  //数量
    amount_remain: {type:Number, default: 0},          //剩余数量
    price_type: {type:String},             //价格类型
    //支付字段
    payment_choice: {type:String},          //现有支付选择(现金，银兑，商兑)
    payment_method: {type:String},          //现有支付方法(货到付款，款到付货，分期，信用)
    count_day_extension: {type:Number, default: 0},    //延期天数
    ref_day_extension: {type:String},      //延期计算标准
    percentage_advance: {type:Number, default: 0},     //预付款百分比
    percentage_remain: {type:Number, default: 0},      //中款百分比
    //两方需求单新增字段
    send_address_id: {type:String}, //地址id
    send_company_name: {type:String},        //发送方公司名字
    send_name: {type:String},                  //发送方名字
    send_phone: {type:String},                 //发送方电话
    send_province: {type:String},             //省
    send_city: {type:String},                  //市
    send_district: {type:String},             //区
    send_addr: {type:String},                 //详细
    send_loc: {type: Array, default: []},   //经纬度

    receive_address_id: {type:String}, //地址id
    receive_company_name: {type:String},    //接收方公司名字
    receive_name: {type:String},             //接收方名字
    receive_phone: {type:String},            //接收方电话
    receive_province: {type:String},        //省
    receive_city: {type:String},             //市
    receive_district: {type:String},        //区
    receive_addr: {type:String},             //详细
    receive_loc: {type: Array, default: []}, //经纬度
    //结算字段
    att_traffic: {type:Schema.Types.Mixed},        //物流细则
    weigh_settlement_style: {type:String},		  //重量结算方式
    time_settlement_style: {type:String},		  //时间结算方式
    //发票信息
    invoice_name: {type:String},               //发票公司名
    invoice_addr: {type:String},               //单位地址
    invoice_number: {type:String},             //税号
    invoice_phone: {type:String},              //公司电话
    invoice_bank: {type:String},               //开户银行
    invoice_account: {type:String},            //公司账号
    //统计抢单
    unoffer_list: {type:Array, default:[]},         //未抢单列表-----公司id : 形成订单id
    //抢单权限
    verify_company: {type:Array, default:[]},       //认证的公司-----公司id : 指派公司id
    //时间
    time_arrival: {type:Date},              //交货时间
    time_depart: {type:Date},               //提货时间
    time_validity: {type:Date},             //有效期
    time_creation: {type:Date},             //创建时间
    time_modify: {type: Date},      //修改时间;
    //    辅助
    quality_origin: {type: String},             //质检方
    appendix: {type:String},                        //备注
    source: {type:String},                          //需求单来源
    status: {type:String, default: 'effective'},    //需求单状态
    extension: {type: Schema.Types.Mixed},          //临时性存放的内容
    offer_count: {type:Number, default:0},          //抢单人数
    order_count: {type:Number, default:0},          //订单人数
    assign_count: {type: Number, default: 0},   //指派数量
    platform_company: {type:Array, default:[]},       //非认证的公司-----公司id : 指派公司id
    tip_price: {type: Number, default: 0},
    admin_id: {type: String},     //为代操作管理员
    section: {type: Array, default: []},  //区间
    end_section: {type: Array, default: []},  //区间
    send_nickname: {type:String},   //提货仓库昵称
    receive_nickname: {type:String},   //交货仓库昵称
    line_id: {type: String}, //线路id
    view_id: {type: Array, default: []}, //浏览者id
    payment_payer: {type: String},                          //付费人 收货方，发货发，物流方
    time_depart_start: {type: Date}, //提货开始
    time_depart_end: {type: Date}, //提货结束
    category_penult: {type: String}, //倒数第二个名字
    category_penult_chn: {type: String}, //倒数第二个名字
    payment_payee:{type: String}, //运费收款方
    freight_voucher: {type: Schema.Types.Mixed}, //货运凭证
    sorting:{type: Number, default: 1}, //排序字段
    time_cost: {type: Schema.Types.Mixed},//时间扣款
    plan_company: {type: Array, default: []}, //非指派的抢单记录
    find_category: {type: String}, //查询产品匹配,存放产品链式目录?
});

module.exports = mongoose.model('TrafficDemand', TrafficDemand);
/**
 * Created by Administrator on 2015/11/16 0016.
 */
var _ = require('underscore');
var decimal = require('decimal');
var configCity = require('./config_city');
var configProvince = require('./config_province');
var configDistrict = require('./config_district');
var util = require('../lib/util');

module.exports = {
    entry_per_page:10,                      //采购单每页给十个
    driver_per_page:5, //司机端
    token_server_timeout: 10,    //服务器通知其他服务器秘钥时间
    demand_appendix_length: 2000,    //需求单备注长度
    //plan_long: 2,    //物流计划时长（3个月,算本月加未来两个月）
    // select_offer_time: 3*24*60*60*1000,    //选择抢单时间
    // demand_time_validity_min: 3*60*60*1000, //需求单有效时间最少
    // demand_time_validity_max: 7*24*60*60*1000, //需求单有效时间最多
    // demand_arrival_time_max: 120*24*60*60*1000,//增加需求单到货时间最大未来120天内
    // add_traffic_time: 24*60*60*1000,    //物流派车可提前时间

    // price_ask_number: 10,    //询价发布个数
    // price_ask_offer_number: 200,    //询价对应报价个数
    // price_ask_push_count: 2,                   //需求单主动推送次数
    // demand_lately_number: 3,    //最近有效需求单数量（名片，公司主页中使用）
    payment_style:{
        CIF: 'CIF', //到岸价
        FOB: 'FOB', //出厂价
    },
    find_role: {
        company: 'company', 
        user: 'user',
        selfComp: 'selfComp',
        selfUser: 'selfUser'
    },
    //报价类型
    price_type:{
        fix: 'fix',        //固定|定价
        flexible: 'flexible' //撮合|竞价
    },
    //20170812 废弃
    // traffic_stat: {
    //     add_week_demand_amount: 'add_week_demand_amount',   //每周新增
    //     demand_total: 'demand_total',                          //总需求吨数
    //     driver_demand_total: 'driver_demand_total',          //司机需求单总吨数
    //     driver_doing_amount: 'driver_doing_amount',          //司机运输中总吨数
    //     driver_finish_amount: 'driver_finish_amount',        //司机运输完成总吨数
    //     remain_offer_count: 'remain_offer_count',            //剩余吨数(等待运送吨数)对应的抢单数
    //     demand_day_add_amount: 'demand_day_add_amount',     //每天新增数量
    //     remain_demand_amount: 'remain_demand_amount'        //剩余吨数(待运送吨数)
    // },

	weigh_settlement_style: {
		fact: 'fact',           //到货吨数*单价
        get: 'get',             //提货吨数*单价
		theory: 'theory'       //耗损, 提货货吨数*价格-扣款
	},
    trade_att_traffic: {
        pick_up: 'fact',                       // 提货
        arrival: 'get',                       // 到货
        path_loss: 'theory'
    },
	
	time_settlement_style: {
		day: 'day',//按天扣款
		not_used: 'not_used'//忽略天数扣款
	},
    //记录各表访问时间 20170512
    tip_type: {
        pass_demand: 'pass_demand', //物流需求单
        pass_offer: 'pass_offer', //物流需求单
        pass_plan: 'pass_plan', //物流需求单
        pass_order: 'pass_order', //物流需求单
        // pass_line: 'pass_line', //司机需求单        
        driver_demand: 'driver_demand', //司机需求单
        driver_offer: 'driver_offer', //司机需求单
        driver_plan: 'driver_plan', //物流需求单
        driver_order: 'driver_order', //司机需求单
        // driver_line: 'driver_line', //司机需求单        
        trade_demand: 'trade_demand', //物流需求单
        pass_friend: 'pass_friend' , //物流生意圈
        line_price: 'line_price', //线路报价
        red_card_order: 'red_card_order',//红包
    },

    secret_keys: {
        credit:'credit',
        user:'user',
        invite:'invite',
        traffic:'traffic',
        trade:'trade',
        admin:'admin',
        dynamic: 'dynamic',
        store: 'store',
        statistical: 'statistical',
        pay: 'pay'
    },

    demand_status: {
        'ineffective':'ineffective',    //chn:'未生效',
        'effective':'effective',        //chn:'已生效',
        'complete':'complete',          //chn:'完成'},
        'cancelled':'cancelled'         //chn:'取消'}
    },
    demand_status_sort: {
        'ineffective':2,    //chn:'未生效',
        'effective':1,        //chn:'已生效',
        'complete':3,          //chn:'完成'},
        'cancelled':4         //chn:'取消'}
    },
    quality_origin: {
        'demand':'demand', //需求方
        'supply':'supply', //销售方
        'other':'other',  //第三方,
        'pass': 'pass', // 物流方
    },
    //线路类型
    line_type: {
        start_end: 'start_end',
        start_only: 'start_only',
        end_only: 'end_only'
    },

    //物流需求单来源 有2：订单来源、原生需求
    demand_source: {
        price_offer: 'real_time_pricing',  //交易主动报价 20170422 'price_offer'
        trade_price: 'trade_price',     //?
        trade_ask: 'trade_ask',         //？交易询价
        trade_demand: 'trade_demand',   //交易需求
        traffic_demand: 'traffic_demand', //双方物流
        traffic_line_demand: 'traffic_line_demand', //双方物流
        trade_assign: 'trade_assign', //指派物流公司
        platform_assign: 'platform_assign', //平台推荐
        loot_demand: 'loot_demand', //抢单
        driver_assign: 'driver_assign', //指派司机
        driver_demand: 'driver_demand', //双方司机需求
        line_demand: 'line_demand', //线路需求
        traffic_temp: 'remark', //线下找物流
        driver_temp: 'remark', //线下找车
    },

    material:{
        coal: '煤炭',
        steel: '钢材',
        alloy: '合金金属',
        slag: '矿粉',
        farming: '农业',
        meijiao: '煤焦',
        gangtie: '钢铁',
        kuangshi: '矿石',
        zaishengziyuan: '再生资源',
        buxianzhi: '不限制'
    },
    address_type: {
        putong: 'PU_TONG',
        hengwen: 'HENG_WEN',
    },
    // goods: {
    //     'coal_donglimei':{
    //         eng:'coal_donglimei',
    //         chn:'动力煤'
    //     },
    //     'coal_wuyanmei':{
    //         eng:'coal_wuyanmei',
    //         chn:'无烟煤'
    //     },
    //     'coal_penchuimei': {
    //         eng: 'coal_penchuimei',
    //         chn: '喷吹煤'
    //     },
    //     'coal_lianjiaomei': {
    //         eng:'coal_lianjiaomei',
    //         chn:'炼焦煤'
    //     },
    //     'steel_gaoxian': {
    //         'eng':'steel_gaoxian',
    //         'chn':'高线'
    //     },
    //     'steel_panluo': {
    //         'eng':'steel_panluo',
    //         'chn':'盘螺'
    //     },
    //     'steel_puxian': {
    //         'eng':'steel_puxian',
    //         'chn':'普线'
    //     },
    //     'alloy_tie': {
    //         'eng':'alloy_tie',
    //         'chn':'铁合金'
    //     }
    // },

    // att_traffic: {
    //     one: '货物安全项：运输至目的地， ＋/－# 吨为正常损耗，不涉及违约，如超过正常损耗，每增加 # 吨，扣款 # 元',
    //     two: '运输时效：除不可抗因素外，延期运送至目的地，每延期 # 天，扣款 # 元。'
    // },
    //推送时对应的前端路由
    push_url:{
        traffic_demand: 'rsc.goods_detail', //20180113 'pass.goods_detail',  //物流需求
        traffic_order: 'rsc.goods_order_goods_detail', //20180113 'pass.goods_order_goods_detail', //物流订单
        driver_demand: 'rsc.trans_assign_detail', //20180113 'pass.trans_assign_detail', //司机需求
        driver_order: 'rsc.order_trans_detail', //20180113 'pass.order_trans_detail', //司机订单
        transport_detail: 'transport_detail', //
        driver_order_detail: 'order_detail', //
        storage_driver_order_detail: 'storage_driver_order_detail', //
        trade_order_detail: 'rsc.order_supply', //'trade.order_orderdetail' //交易看物流订单20180113
        trade_traffic_demand: 'rsc.assign', //20180113 交易看物流需求
        finance_index: 'rsc.finance_index',// 20180320 物流订单管理首页
    },

    //订单类型
    // part_type: {
    //     TWO: 'TWO',         //两方
    //     THREE: 'THREE'     //三方
        //DIRECT: 'DIRECT'    //直接下单(目前先不用，只用TWO，客户端显示根据这个字段判断)
    // },

    payment_choice: {
        //url:'url',                      //chn:'使用凭证'},----------------------失效
        //credit:'credit',                //,chn:'使用信用额'}----------------------失效
        //both:'both',                    //----------------------失效
        cash: 'cash',                 //现金
        bill_bank: 'bill_bank',     //银兑
        bill_com: 'bill_com',        //商兑
        transfer: 'transfer', //银行转账
        offline: 'offline', //线下付款
    },

    payment_method: {
        all_cash: 'all_cash',   //款到付货
        all_goods: 'all_goods', //货到付款
        partition: 'partition', //分期
        credit: 'credit',        //信用        
    },

    ref_day_extension: {
        order: 'order', //下订单时
        goods: 'goods'  //货到时
    },

    payment_type: {
        ADVANCED: 'ADVANCED',   //预付款
        FINAL: 'FINAL'           //尾款
    },

    verification_phase: {
        'NO':'NO',
        'PROCESSING':'PROCESSING',
        'SUCCESS':'SUCCESS',
        'FAILED':'FAILED'
    },

    // tad,tpu,tsa,tst,pad,pdp,pdp  (t:trade, ad:admin, pu:publick,sa:sale,st:store,p: pass, dp:driver_publish, dp: driver_priver)
    user_roles : {
        'TRADE_ADMIN':'TRADE_ADMIN',
        'TRADE_PURCHASE':'TRADE_PURCHASE',
        'TRADE_SALE':'TRADE_SALE',
        'TRADE_MANUFACTURE':'TRADE_MANUFACTURE',
        'TRADE_FINANCE':'TRADE_FINANCE',
        'TRADE_STORAGE':'TRADE_STORAGE',
        'TRAFFIC_ADMIN':'TRAFFIC_ADMIN',
        'TRAFFIC_EMPLOYEE': 'TRAFFIC_EMPLOYEE',     //物流--员工
        'TRAFFIC_CAPTAIN': 'TRAFFIC_CAPTAIN',       //物流--队长
        'TRAFFIC_DRIVER_PUBLISH':'TRAFFIC_DRIVER_PUBLISH',  //公有司机（公司所属）
        'TRAFFIC_DRIVER_PRIVATE':'TRAFFIC_DRIVER_PRIVATE'   //私人司机（挂靠司机）
    },

    index_collection :
        ['a','b','c','d','e','f','g','h','i','j','k','m','n','p','q','r','s','t','u','v','w','x','y','z',
            '2','3','4','5','6','7','8','9'],

    index_number:['0','1','2','3','4','5','6','7','8','9'],

    file_type: {
        advanced: 'advanced',   //预付款
        remain: 'remain',       //中款
        final: 'final'           //尾款
    },

    client_show_type:{
        processing: 'processing',   //进行中
        no_paid: 'no_paid'          //未支付
    },

    company_category: {
        'TRADE':'TRADE',
        'TRAFFIC':'TRAFFIC'
    },

    payment_method_value: {
        'all_cash':10000,
        'all_goods':2000,
        'partition':10,
        'credit':0
    },

    relation_type: {
        ACCEPT: 'ACCEPT',
        WAIT: 'WAIT'
    },

    offer_sort_type:{
        date: 'date',       //时间排序
        update: 'update',       //时间排序
        gross: 'gross',     //综合
        price: 'price',     //价格
        myOffer: 'myOffer',//我的排序
        payment: 'payment',     //支付方式
        depart_time: 'depart_time',     //提货时间
        arrival_time: 'arrival_time'    //到货时间
    },

    driver_roles_chn:{
        'TRAFFIC_DRIVER_PUBLISH':'自有',
        'TRAFFIC_DRIVER_PRIVATE':'挂靠'
    },

    typeCode: {
        company_des: 'company_des',                          //编辑公司简介
        traffic_line: 'traffic_line',                       //物流线路报价
        traffic_demand: 'traffic_demand',                  //物流需求单
        traffic_driver_demand: 'traffic_driver_demand',  //司机需求单
        traffic_order_confirm: 'traffic_order_confirm', //物流确认接单
        trade_order_confirm_sale: 'trade_order_confirm_sale',     //销售确认交易订单
        trade_order_confirm_purchase: 'trade_order_confirm_purchase',     //采购确认交易订单
        trade_pricing: 'trade_pricing',                   //交易报价
        trade_demand: 'trade_demand',                      //交易需求单
        traffic_assign: 'traffic_assign',                  //物流指派
        driver_assign:'driver_assign'                  //司机指派
    },
    statistical:{
        company_assign: 'company_assign',//交易指派物流公司数量
        company_assign_order: 'company_assign_order',//交易指派物流生成订单
        company_line: 'company_line',//线路
        company_line_order: 'company_line_order',//线路订单
        driver_assign: 'driver_assign',//物流指派司机
        driver_assign_order: 'driver_assign_order',//物流指派司机生成订单
        assign: 'assign',//指派数量
        assign_order: 'assign_order', //指派生成的订单
        driver_assign_timeOut: 'driver_assign_timeOut' //指派司机超时数

    },
    //访问规则
    accessRule: {
        trade: ['TRADE_ADMIN', 'TRADE_PURCHASE', 'TRADE_SALE'],
        pass: ['TRAFFIC_ADMIN', 'TRAFFIC_EMPLOYEE', 'TRAFFIC_CAPTAIN'],
        driver: ['TRAFFIC_DRIVER_PUBLISH', 'TRAFFIC_DRIVER_PRIVATE'],
        trade_pass: ['TRADE_ADMIN', 'TRADE_PURCHASE', 'TRADE_SALE', 'TRAFFIC_ADMIN'],
        pass_driver: ['TRAFFIC_ADMIN', 'TRAFFIC_DRIVER_PUBLISH', 'TRAFFIC_DRIVER_PRIVATE']
    },

    checkFileType:function(type) {
        return !!(this.file_type[type]);
    },

	checkWeighSettlement:function(type) {
        return !!(this.weigh_settlement_style[type]);
    },
	
	checkTimeSettlement:function(type) {
        return !!(this.time_settlement_style[type]);
    },

    checkMonth:function(num){
        return !(!num || !_.isNumber(num) || num <= 0 || num > 12 || (num%1 != 0));
    },

    checkNumberBiggerZero:function(num) {
        return !(!num || !_.isNumber(num) || num <= 0);
    },

    checkNumberBiggerEqualZero:function(num) {
        return !((num != 0 && !num) || !_.isNumber(num) || num < 0);
    },

    checkNumberBiggerOne:function(num) {
        return !(!num || !_.isNumber(num) || num < 1);
    },

    checkMaxNumber:function(num) {
        return !(!num || !_.isNumber(num) || num > 999999.99);
    },

    checkPhone:function(input) {
        // var reg = /(^13[0-9]{9}$)|(^15[0-9]{9}$)|(^17[0-9]{9}$)|(^18[012356789][0-9]{8}$)/;
        var reg = /^1[0-9]{10}$/;
        return reg.test(input);
    },

    checkTelephone:function(input) {
        var reg = /(^[0-9\-]{9,20}$)/;
        return reg.test(input) || this.checkPhone(input);
    },

    checkAttTraffic:function(att) {
        if(_.size(att) > _.size(this.att_traffic)){
            return false;
        }
        for(var key in att){
            if(!_.isArray(att[key]) || att[key].length > 5){
                return false;
            }
        }
        return true;
    },

    checkTrafficCompanyByRole:function(role) {
        return role.indexOf(this.company_category.TRAFFIC) >= 0;
    },

    checkPaymentType:function(type){
        return !!this.payment_type[type];
    },

    checkRefDayExtension:function(type){
        return !!this.ref_day_extension[type];
    },

    checkDriver:function(role) {
        return role.indexOf('DRIVER') >= 0;
    },

    checkPaymentChoice:function(num){
        return !!(this.payment_choice[num]);
    },

    checkPaymentMethod:function(num){
        return !!(this.payment_method[num]);
    },

    checkPaymentStyle:function(num) {
        return (num && _.isNumber(num) && num > 0 &&num < 100);
    },

    checkPercentageAdvanceRemain:function(advance, remain) {
        return (this.checkPaymentStyle(advance) && this.checkPaymentStyle(remain) && ((advance + remain) < 100));
    },

    checkProvince:function(data) {
        return !!(configProvince[data]);
    },

    checkCity:function(pro, city) {
        return !!(configCity[pro][city]);
    },

    checkDistrict:function(city, dis) {
        if(dis){
            return !!(configDistrict[city][dis]);
        }else{
            return true;
        }
    },

    checkDistrictStrict:function(city, dis) {
        if(configDistrict[city]){
            return !!(configDistrict[city][dis]);
        }else{
            return true;
        }
    },

    checkCommonString:function(input) {
        var reg = /^[\s\S]{2,40}$/;
        return reg.test(input);
    },

    checkTime:function(time) {
        var now = new Date();
        return !(!time || ((new Date(time)).getTime() < (new Date(now.getFullYear(), now.getMonth(), now.getDate())).getTime()));
    },

    //排序方式
    getSortDemandCondition:function(order, direction){
        var obj = {};
        direction = direction == 'true';
        if(order == 'date'){
            obj.time_creation = direction ? 1 : -1;
        }else if(order == 'amount'){
            obj.amount = direction ? 1 : -1;
        }else if(order == 'price'){
            obj.price = direction ? 1 : -1;
        }else if(order == 'validity'){
            obj.time_validity = direction ? -1 : 1;
        }
        return obj;
    },

    //number转string
    dateNumberToString: function(num) {
        var str = '';
        if(num < 10) {
            str = '0' + num.toString();
        } else {
            str = num.toString();
        }
        return str;
    },
    /**
     * 生成index
     * @param my_type
     * @returns {string}
     */
    getTradeOrderIndex: function () {
        var index = 'cg-';
        var today = new Date();
        var year = today.getFullYear().toString().substr(2);
        var month = this.dateNumberToString(today.getMonth() + 1);
        var date = this.dateNumberToString(today.getDate());
        var random = '';
        for (var i = 0; i < 5; i++) {
            var s_index = Math.floor(Math.random() * this.index_number.length);
            random += this.index_number[s_index];
        }
        index += year + month + date + random;
        return index;
    },
    getOrderIndex:function () {
        var index = 'wl-';
        var today = new Date();
        var year = today.getFullYear().toString().substr(2);
        var month = this.dateNumberToString(today.getMonth() + 1);
        var date = this.dateNumberToString(today.getDate());
        //var hour = this.dateNumberToString(today.getHours());
        //var minute = this.dateNumberToString(today.getMinutes());
        //var second = this.dateNumberToString(today.getSeconds());
        var random = '';
        for(var i = 0; i< 5; i++) {
            var s_index = Math.floor(Math.random() * this.index_number.length);
            random += this.index_number[s_index];
        }
        index += year+month+date+random;
        return index;
    },

    getDriverOfferDemandIndex:function () {
        var index = 'wlsjxq-'; //wlsjxq
        var today = new Date();
        var year = today.getFullYear().toString().substr(2);
        var month = this.dateNumberToString(today.getMonth() + 1);
        var date = this.dateNumberToString(today.getDate());
        //var hour = this.dateNumberToString(today.getHours());
        //var minute = this.dateNumberToString(today.getMinutes());
        //var second = this.dateNumberToString(today.getSeconds());
        var random = '';
        for(var i = 0; i< 5; i++) {
            var s_index = Math.floor(Math.random() * this.index_number.length);
            random += this.index_number[s_index];
        }
        index += year+month+date+random;
        return index;
    },

    getDemandIndex:function () {
        var index = 'wlxq-';
        var today = new Date();
        var year = today.getFullYear().toString().substr(2);
        var month = this.dateNumberToString(today.getMonth() + 1);
        var date = this.dateNumberToString(today.getDate());
        //var hour = this.dateNumberToString(today.getHours());
        //var minute = this.dateNumberToString(today.getMinutes());
        //var second = this.dateNumberToString(today.getSeconds());
        var random = '';
        for(var i = 0; i< 5; i++) {
            var s_index = Math.floor(Math.random() * this.index_number.length);
            random += this.index_number[s_index];
        }
        index += year+month+date+random;
        return index;
    },

    //司机订单
    getDriverOrderIndex:function () {
        var index = 'sj-';
        var today = new Date();
        var year = today.getFullYear().toString().substr(2);
        var month = this.dateNumberToString(today.getMonth() + 1);
        var date = this.dateNumberToString(today.getDate());
        var random = '';
        for(var i = 0; i< 5; i++) {
            var s_index = Math.floor(Math.random() * this.index_number.length);
            random += this.index_number[s_index];
        }
        index += year+month+date+random;
        return index;
    },
    // 自定义 加减乘除,add,sub,mul,div
    rscDecimal: function(type, a, b, point){
        var c = 0, p = point || 3;

        switch (type){
            case 'add':
                a = !!a ? a.toString(): 0, b = !!b ? b.toString() : 0;
                c =  decimal(a.toString()).add(b.toString()).toNumber();
                break;
            case 'sub':
                a = !!a ? a.toString(): 0, b = !!b ? b.toString() : 0;
                c = decimal(a.toString()).sub(b.toString()).toNumber() || 0;
                break;
            case 'mul':
                if(a==0 || b==0){
                    c = 0
                }else{
                    a = !!a ? a.toString(): 1, b = !!b ? b.toString() : 1;
                    c =  decimal(a.toString()).mul(b.toString()).toNumber();
                }

                break;
            case "div":
                // a = !!a ? a.toString(): 1, b = !!b ? b.toString() : 1;
                //20180523
                if(a==0 || b==0){
                    c = 0
                }else{
                    a = !!a ? a.toString(): 1, b = !!b ? b.toString() : 1;
                    c =  decimal(a.toString()).div(b.toString()).toNumber();
                }
                break;
            default:
                return c;
        }
        var zero = Math.pow(10,p); //保留小数位，去除多余的0
        return point == 0 ? c :  !c ? '0' : Math.round(c*zero)/zero;//c.toFixed(p);//parseFloat(c.toFixed(p));
    }
    ,
    //获取理论吨数
    getAmountTheory: function(param){
        var amount = 0;
        var  dec = this.rscDecimal;
        if(!param) {return amount;}
        _.each(param, function(a){
            if(a.pass_amount){
                amount = dec('add', amount, a.pass_amount);
            }
        });
        return amount;
    },
    validityFormat: function(param){
        var now = new Date();
        if(parseInt(param)){
            return new Date(now.getTime() + (parseInt(param)*60*1000));
        }else{
            return new Date();
        }

    },
    //用户输入产品，返回非零的产品 20170807
    eraser_zero : function (obj, second) {
        var valid_fields = second || 'number'; //product_name中需要判断的不为空字段
        if(!_.isArray(obj) || obj.length==0){
            return [];
        }
        for(var kx=0; kx<obj.length; kx++){
            if(!obj[kx].pass_amount){
                obj.splice(kx,1);
                kx--;
                continue;
            }
            for(var ky = 0; ky < obj[kx]['product_name'].length; ky++){
                obj[kx]['product_name'][ky] = JSON.parse(JSON.stringify(obj[kx]['product_name'][ky]));
                if(!obj[kx]['product_name'][ky][valid_fields]){
                    obj[kx]['product_name'].splice(ky,1);
                    ky--;
                    continue;
                }
            }
            if(obj[kx]['product_name'].length == 0){
                obj.splice(kx,1);
                kx--;
                continue;
            }
            
        }
        return obj;
    },
    //依据指定的吨数, 产品，产品目录，推算指定吨数的产品。 20170808
    passListToAssignProduct : function (amount ,product, list) {
        var sign_amount = Number(amount);
        var self = this;
        var pass_list = JSON.parse(JSON.stringify(list));
        var pass_product = JSON.parse(JSON.stringify(product));
        _.each(pass_list, function (a) {
            a.amount = self.rscDecimal('mul', a.count, a.amount_unit);
            if(sign_amount>0){
                var count_div = Math.floor(self.rscDecimal('div', sign_amount, a.amount_unit));//Math.ceil 向上取整; floor向下取整
                a.count = count_div > a.count ? a.count : count_div;
                sign_amount = self.rscDecimal('sub', sign_amount, a.amount);
            }else{
                a.count = 0;
            }
        });
        //清除为0的
        for(var i=0; i<pass_list.length; i++){
            if(pass_list[i].count<=0){
                pass_list.splice(i, 1);
                i--;
            }
        }
        //转换结构
        var pass_list_obj = _.object(_.pluck(pass_list, 'key'), _.pluck(pass_list, 'count'));
        //计算产品详情;
        _.each(pass_product, function (a) {
            a.pass_amount = 0;
            _.each(a.product_name, function (b) {
                // b.number_old=b.number;
                b.number = 0;
                var key = a.layer_1 ;
                for(var i=2; i < 6; i++){
                    if(a['layer_'+i]){
                        key = key +';'+ a['layer_'+i];
                    }
                }
                key = key + ';'+b.randomNum;
                // if(b.name){
                //     key = key + ';'+b.name;
                // }
                if(pass_list_obj[key]){
                    b.number = pass_list_obj[key];
                }
                b.amount = self.rscDecimal('mul', b.number , b.amount_unit);
                a.pass_amount = self.rscDecimal('add', a.pass_amount, b.amount);
            })
        });
        return pass_product;
    },
    //通过count重新计算products中的amount; 20170807 20171115 scene='number'是发布需求, scene='number_remain' 是退货
    recompute_products : function (product, scene) {
        var self = this;
        var productStr = JSON.parse(JSON.stringify(product));
        _.each(productStr, function (a) {
            a.pass_amount = 0;
            _.each(a.product_name, function (b) {
                // b.amount = self.rscDecimal('mul', b[scene], b.amount_unit);
                if(!b.amount_unit){
                    b.amount_unit = b['measure_unit'].length > 0 ? b['measure_unit'][0]['value'] : 1;
                }
                // console.log('amount_remain', scene, b[scene], b.amount_unit)
                b.amount_remain = self.rscDecimal('mul', b[scene], b.amount_unit);
                b.amount = scene == 'number' ? b.amount_remain : b.amount;
                b.number_remain = b[scene];//Number(b[scene]);
                // console.log('pass_amount', a.pass_amount, b.amount_remain)
                a.pass_amount = self.rscDecimal('add', a.pass_amount, b.amount_remain);

            })
        });

        self.eraser_zero(productStr);
        return productStr;
    },
    //剩余产品(product_remain)相减; 20170807
    subProduceRemain: function(old, source){
        var self = this;
        var newData=source, oldData=old;    
        //对原有oldData数据进行 清零处理;
        for(var a=0; a<newData.length; a++){
            for(var b=0; b<oldData.length; b++){
                if(newData[a].key == oldData[b].key){
                    // oldData[b].count = oldData[b].count - newData[a].count;
                    oldData[b].count = self.rscDecimal('sub', oldData[b].count , newData[a].count)//;
                    if(oldData[b].count==0){
                        oldData.splice(b,1);
                        b--;
                    }
                }
            }
        }    
        return oldData;
    },
    //依据产品目录,重新计算产品详情，改变 20170807
    produceRemainToProduce: function (product, products_remain) {
        var product_list = _.object(_.pluck(products_remain, 'key'), _.pluck(products_remain, 'count'));
        var productStr = JSON.parse(JSON.stringify(product));
        var self = this;
        _.each(productStr, function (a) {
            a.pass_amount = 0;
           _.each(a.product_name, function (b) {
               var key = a.layer_1;
               for(var i = 2 ; i < 6; i++){
                   if( a['layer_' + i] ){
                       key = key + ';' + a['layer_'+i];
                   }else{
                       break;
                   }
               }
               key = key + ';' + b.randomNum;
               // if(b.name){
               //     key = key + ';'+b.name;
               // }
               if(product_list[key]){
                   b.number_remain = self.rscDecimal('sub', b.number_remain, product_list[key], 0);
                   // b.amount = self.rscDecimal('mul', b.number_remain, b.amount_unit);
                   b.amount_remain = self.rscDecimal('mul', b.number_remain, b.amount_unit); //剩余吨数
               }
               a.pass_amount = self.rscDecimal('add', a.pass_amount, b.amount_remain);
           })
        });

        // self.eraser_zero(productStr);//将吨数为0的数据移除;
        return productStr;
    },
    //依据产品目录计算吨数和价格 (20170807)
    products_catelog : function (obj) {
        var amount = 0, price_total = 0, price_arr=[], self = this;
        if( !(_.isArray(obj))|| obj.length==0){return {amount:amount, price_total: price_total, price_arr:price_arr};}
        _.each(obj, function (a) {
            amount = self.rscDecimal('add', amount , a.pass_amount);
            price_total = self.rscDecimal('add', price_total, self.rscDecimal('mul', a.pass_amount, a.pass_price), 2);
            price_arr.push(a.pass_price);
        });
        return {amount:amount, price_total: price_total, price_arr:price_arr};
    },
    //将产品详情 转成 产品目录; (20170807)
    products_remain_construct: function (obj, filed, name) {
        var remain = [];
        _.each(obj, function (a) {
            _.each(a.product_name, function (b) {
                var key = a.layer_1;
                for(var i = 2 ; i < 6; i++){
                    if( a['layer_' + i] ){
                        key = key + ';' + a['layer_'+i];
                    }else{
                        break;
                    }
                }
                if(name=='trade'){
                    var obj = {key: key + ';' + b.short_id};//{key: key};
                }else{
                    var obj = {key: key + ';' + b.randomNum};//{key: key};
                }

                // if(b.name){
                //     key = key + ';'+b.name;
                //     obj['key'] = key;
                // }
                // obj['name_id'] = b['_id'].toString(); 若name不是唯一，则去name的id
                obj['count'] = b[filed];//Number(b[filed]);
                obj['amount_unit'] = b['amount_unit'];//Number(b['amount_unit']);
                obj['pass_price'] = a.pass_price;
                remain.push(obj);
            })
        });
        return remain;
    },
    //在产品详情中增加 remain剩余数量; (20170807)
    // amount_remain 剩余吨数 amount_actual 实际运输 amount_actual_remain 实际运输剩余 amount_actual_remian 实际件数吨数
    product_categories_construct: function (obj) {
        var self = this;
        var productStr = JSON.parse(JSON.stringify(obj));
        _.each(productStr, function (a) {
            a.pass_amount = 0;
            a.pass_number=0;//20180417 增加总件数
            a.pass_amount_allot=0;
            a.pass_amount_remain=0;
            // a.pass_count=0;
            a.pass_number_allot=0;
            a.pass_number_remain=0;
            _.each(a.product_name, function (b) {
                b.number = Number(b.number);
                b.number_remain = b.number;
                b.amount_remain = b.amount; //理论剩余
                b.amount_unit = b.amount_unit || 1;
                a.pass_amount_remain = a.pass_amount = self.rscDecimal('add', a.pass_amount, self.rscDecimal('mul', b.number, b.amount_unit));
                a.pass_number_remain = a.pass_number = self.rscDecimal('add', a.pass_number, b.number,0);
                //属性中增加大小值
                _.each(b.attribute, function (c) {
                    if(c.value && c.value_max){
                        c.value = c.value + '~' + c.value_max;
                    }
                    if(!c.value && c.value_max){
                        c.value = c.value_max;
                    }
                })
            });
        });
        return productStr;
    },
    //获取年月
    getYearMonth: function(time, bone){
        var time = !!time ? new Date(time) : new Date(), monthArr = [],
            year = time.getFullYear(),
            month = time.getMonth() + 1,
            parseDay = time.getDate(),
            startDay = 1,
            endDay = (new Date((new Date((month===12? year-1 : year)+'-'+(month===12 ? 1: month+1)+'-1')).getTime() - 43200)).getDate()
            day = !time ? endDay : (new Date()).getDate();//如果time 存在 则为 time 的，否则为当前时间
        // var quotient = Math.floor(day / 5);
        if(!bone){
            monthArr.push(month + '-' + 1);//monthArr.push(year + '-' + month + '-' + 1);
            for(var i = startDay + 1; i <= endDay; i++){  //i <= day
                monthArr.push(month + '-' + i);
                // if(day<=5){
                //     monthArr.push(year + '-' + month + '-' + i);
                // }else{
                //     if(quotient>=1 && i % 5 ==0){
                //         monthArr.push(year + '-' + month + '-' + i);
                //         quotient--;
                //     }
                //     if(quotient<=0){
                //         monthArr.push(year + '-' + month + '-' + day);
                //         i = day+1;
                //     }
                // }
            }
        }
            dayStr = month + '-' + parseDay, //year + '-' + month + '-' + parseDay,
            monthStr = year + '-' + month;
        return {
            ymd: year + '-' + month + '-' + parseDay,
            monthStr : monthStr,
            dayStr : dayStr,
            monthArr : monthArr
        }
    },
    //字段模板
    product_categories: ['pass_price','product_name'], //检查对象中的某些字段是否存在 'layer_1',
    
    //参数检测 ,req 应改为直接检查的对象 sample;
    checkField: function(req, base, cb){
        //检查字符串、数字、数组、对象, 关联关系的检查 relate; 如果发生错误，则退出
        //关联性检查
        //若为数组或对象,客户传的是字符串
        var flag = true;
        for(var key in base) {
            if( !this.checkFieldType(req.body, base[key]) ){
                flag = false;
                cb(base[key]['field']);
                break;
            }
        }
        if(flag){
            cb();
        }
    },
    //假设参数obj为数组, 元素为对象,
    checkFieldModel: function(base, obj){
        //检查是否有模板
        if(!this[base]){
            return false;
        }
        //检查是数组还是对象; 若是数组，则元素必须为对象否则退出; 若为对象则检查模板字段;
        for( var x in obj){
            for( var y in this[base]){
                //如果不存在某值，则返回字段
                if(!obj[x][ this[base][y] ]){
                    return y;
                }
            }
        }
    },
    checkFieldType: function(param, e){
        switch (e.type){
            case 'string':

                return !!param[e.field];
                break;
            case 'number':
                param[e.field] = Number(param[e.field]);
                return !!( param[e.field] && param[e.field] > 0 );
                break;
            case 'array':
                if(!!param[e.field]){
                    param[e.field] =  _.isObject(param[e.field]) ? param[e.field] : JSON.parse(param[e.field]);
                    return _.isArray(param[e.field]);
                }else{
                    return false;
                }
                break;
            case 'date':
                return !!( param[e.field] && (new Date(param[e.field])) );//>= new Date() 
                break;
            case 'object':
                if(!!param[e.field]){
                    param[e.field] = _.isObject(param[e.field]) ? param[e.field] : JSON.parse(param[e.field]);
                    return !this.checkFieldModel(e.field, param[e.field]);
                }else{
                    return false;
                }
                // param[e.field] = _.isObject(param[e.field]) ? param[e.field] : JSON.parse(param[e.field]);
                // return !!( (param[e.field]) && !this.checkFieldModel(e.field, param[e.field]) );
                break;
            case 'enum':
                return !!( (param[e.field]) && this[e.field][param[e.field]] );
                break;
            default :
                return false;
                break;
        }
    },
    //用x来判断随机数取值范围
    getVerifyCode:function (x,y) {
        var codebase = [0,1,2,3,4,5,6,7,8,9];
            // ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z',0,1,2,3,4,5,6,7,8,9];
        var loopx = y || 4;
        var random = '';
        for(var i = 0; i< loopx; i++) {
            var s_index = Math.floor(Math.random() * codebase.length);
            random += codebase[s_index];
        }
        return random;
    },
    //catalogue
    getCatalogue: function(product, loop, chn){
        var catalogue = [];
        _.each(product, function(a){
            var category='';
            for(var x=1; x < loop; x++){
                if(a['layer_' + x + chn]){
                    category = !category ? a['layer_' + x + chn] : category + ';' + a['layer_' + x + chn];
                }else{
                    break;
                }
            }
            _.each(a.product_name, function(b){
                if(b.name){
                    // category = category + ';' + b.name;
                    catalogue.push(category + ';' + b.name);
                }else{
                    catalogue.push(category);
                }

            })
        });
        return catalogue;
    },
    //计算 遗留: 补货 和 原单产品未合并;amount 更改 amount_final
    getPriceActual: function (order, product, type) {
        var price = 0;
        var self = this;
        _.each(product, function(a, ka){
            _.each(a.product_name, function(b, kb){
                if(!!b.amount_final){
                    b.amount_final = b.amount_final>=b.amount? b.amount : b.amount_final;
                }
                if(type=='driver'){
                    //司机
                    price = !!(b.amount_final && order.price) ? self.rscDecimal('add', price, self.rscDecimal('mul', b.amount_final, order.price)) : 0;
                }else if(type == 'pass'){
                    //物流
                    price = !!(b.amount_final && a.pass_price) ? self.rscDecimal('add', price, self.rscDecimal('mul', b.amount_final, a.pass_price)) : 0;
                }else{
                    //交易
                    price = !!(b.amount_final && b.price) ? self.rscDecimal('add', price, self.rscDecimal('mul', b.amount_final, b.price)) : 0;
                }

            })
        });
        return price;
    },
    //所有保存金额的地方处理一下;
    converNumberLength: function(number, length){
        var num = Number(number) || 0, len = length || 0;
        return parseFloat(num.toFixed(len));
    },
    storeProductTodriverDemand: function(product, product1){
        // product :仓库添加的产品；  product1:司机需求单的产品 
        _.each(product, function(a){
            _.each(a.product_name, function(b){
                var key_a = a.layer_1 + a.layer_2 + (a.layer_3 || "")  + (a.layer_4 || "")  + (a.layer_5 || "") +  (b.randomNum || "") ;//(b.name || "") ;
                _.each(product1, function(a1){
                    _.each(a1.product_name, function(b1){
                        var key_a1 = a1.layer_1 + a1.layer_2 + (a1.layer_3 || "") + (a1.layer_4 || "") + (a1.layer_5 || "")+ (b1.randomNum || "");//(b1.name || "");
                        if(key_a == key_a1 && !!b.amount_final && !!b.number_final){
                            b1.amount_actual = b1.amount - b.amount_final;
                            b1.number_actual = b1.number - b.number_final;
                        }
                    })
                })
            })
        });
        return product1;
    },
    updateNumber: function (data) {
        if(data.amount){
           data.amount = data.amount.toFixed(3)
        }
        if(data.price_total){
            data.price_total = data.price_total.toFixed(2);
        }
        if(data.price){
            data.price = data.price.toFixed(2);
        }
        return data;
    },
    getAveragePrice: function (obj, str) {
        var length = 0;
        var sum = 0;
        if(obj.length ==0) return sum;
        _.each(obj, function (a) {
            length++;
            if(!!Number(a[str])){
                sum += Number(a[str])
            }
        });
        return (sum/length).toFixed(2);
    },
    //包含
    areaCollect: function(province, city, district){
        var section = [];
        
        if(district && district.length > 0 &&  district[0] && city.length == 1){
            _.each(district, function (a) {
                if(province[0] == city[0]){
                    section.push(province[0] + a)
                }else{
                    // section.push(province[0] + city[0]);// 可增加被包含的区间
                    section.push(province[0] + city[0] + a)
                }
            })
        }else{
            if(city && city.length > 0){
                _.each(city, function (b) {
                    if(province[0] == b){
                        section.push(province[0])
                    }else{
                        // section.push(province[0]);
                        section.push(province[0] + b)
                    }

                })
            }else{
                section.push(province[0]);
            }
        }
        section = _.uniq(section);
        return section;
    },
    //被包含
    unAreaCollect: function(province, city, district){
        var section = [];
        if(district && district.length>0){
            if(province[0] == city[0]){
                section.push(province[0]);
            }else{
                section.push(province[0] + city[0]);
            }
        }
        if(city && city.length>0){
            section.push(province[0]);
        }
        section.push(province[0]);
        
        section = _.uniq(section);
        return section;
    },
    //关联
    relevanceArea: function(province, city, district){
        var section = [], unsection=[], obj={};
        if(district && district.length>0){
            console.log('district')
            //若district的长度大于0则city,province都未1个元素; ≤县，市，省
            _.each(district, function (d) {
                if(province[0] == city[0]){
                    section.push(province[0]+d);
                }else{
                    section.push(province[0]+city[0]);
                    section.push(province[0]+city[0]+d);
                }
            });
            section.push(province[0]);
            section=_.uniq(section);
        }else if(city && city.length>0){
            console.log('city')
            // ≤市，省 && ≥市
            _.each(city, function (c) {
                if(province[0] != c){
                    section.push(province[0]+c)
                    unsection.push(province[0]+c);
                }else{
                    unsection.push(c)
                }
                
            });
            section.push(province[0]);
            section=_.uniq(section);
            unsection=_.uniq(unsection);
        }else{
            unsection=section=[province[0]];            
        }
        if(section.length>0){
            obj['section']=section;
        }
        if(unsection.length>0){
            obj['unsection']=unsection;
        }
        return obj;
    },
    //需求单中的地址域
    demandAreaCollect: function(province, city, district){
        var section = [];

        if(province){
            section.push(province);
        }
        if(province && city){
            if(city==province){
                section.push(province);
            }else{
                section.push(province+city);
            }
            if(district){
                if(city==province){
                    section.push(province+district);
                }else{
                    section.push(province+city+district);
                }
            }
        }
        return _.uniq(section);
    },
    
    addStoreFields: function (produce) {
        if(produce.length>0){
            _.each(produce, function (a) {
                _.each(a.product_name, function (b) {
                    if(!b.number){
                        b.number = Number(b.count)
                    }
                    b.loading_number_remain = b.unloading_number_remain = Number(b.number);
                    b.loading_amount_remain = b.unloading_amount_remain = b.amount;
                })
            });
        }
        return produce;
    },
    //提交货结算
    storeRemainProduct: function(produce, storeProduct, type){
        var self = this;
        if(produce.length > 0 && storeProduct.length > 0){
            var ab_key, xy_key;
            _.each(produce, function (a) {
                ab_key = a.layer_1 + ';' + a.layer_2;
                _.each(a.product_name, function (b) {
                    ab_key = ab_key + ';' + b.randomNum;//b.name;
                    _.each(storeProduct, function(x){
                        xy_key = x.layer_1 + ';' + x.layer_2;
                        _.each(x.product_name, function(y){
                            xy_key = xy_key + ';' + y.randomNum; //y.name;
                            if(xy_key == ab_key && !!y[type + '_number']){

                                b[type + '_number_remain'] = self.rscDecimal('sub', b[type + '_number_remain'], y[type + '_number'],0);
                                b[type + '_amount_remain'] = self.rscDecimal('sub', b[type + '_amount_remain'], y[type + '_amount']);
                            }
                        })
                    })
                })
            });
            return produce;
        }else{
            return produce;
        }

    },
    storeRemainReplenish: function(produce, storeProduct, type){
        var self = this;
        if(produce.length>0 && storeProduct.length>0){
            _.each(produce, function (a) {
                _.each(a.product_name, function (b) {
                    _.each(storeProduct, function(x){
                        _.each(x.product_name, function(y){
                            b[type + '_number_remain'] = self.rscDecimal('sub', b[type + '_number_remain'], y[type + '_number'],0);
                            b[type + '_amount_remain'] = self.rscDecimal('sub', b[type + '_amount_remain'], y[type + '_amount']);
                        })
                    })
                })
            });
            return produce;
        }else{
            return produce;
        }

    },
    nodePushUrl: {
        person: '/html/personHome.html?',
        company: '/html/personHome.html?'
    },
    getProductTotal: function (obj, param, point) {
        var total = 0, self = this;
        _.each(obj, function (a) {
            _.each(a.product_name, function (b) {
                total = self.rscDecimal('add', total, b[param], point)
            })
        });
        return total;
    },
    randomProductId: function (obj) {
        var self = this;
        _.each(obj, function (a) {
          a['randomNum'] = self.getVerifyCode([], 8);// 便于回溯
            _.each(a.product_name, function (b) {
                b['randomNum'] = self.getVerifyCode([], 6)
            });
        });
        return obj;
    },
    // 合并产品详情
    mergeCategoris: function (argument2, argument1) {
        //将1中不相同的合并到2中
        if(argument1.length==0){
            return argument2
        }
        if(argument2.length==0){
            return argument1
        }
        /*
        _.each(argument1,function(data1){
            _.each(argument2, function(data2){
                if(data1.material==data2.material &&
                    data1.layer_1==data2.layer_1 &&
                    data1.layer_2==data2.layer_2 &&
                    data1.layer_3==data2.layer_3 &&
                    data1.layer_4==data2.layer_4){

                    _.each(data1.product_name, function(data3){
                        _.each(data2.product_name, function(data4){

                            if(data3.name==data4.name){
                                data3.number+=data4.number;
                            }else {
                                data1.product_name.push(data4);
                            }
                        })

                    })
                }else{
                    argument1.push(data2);
                }
            })
        })
        */
        _.each(argument1,function(data1){
            var flag_a = true;
            _.each(argument2, function(data2){

                if(data1.material==data2.material &&
                    data1.layer_1==data2.layer_1 &&
                    data1.layer_2==data2.layer_2 &&
                    data1.layer_3==data2.layer_3 &&
                    data1.layer_4==data2.layer_4){
                    flag_a = false;
                    _.each(data1.product_name, function(data3){
                        var flag_b = true;
                        _.each(data2.product_name, function(data4){

                            if(data3.name==data4.name){
                                data4.number+=data3.number;//data3.number+=data4.number;
                                flag_b = false;
                            }
                        });
                        if(flag_b){
                            data2.product_name.push(data3);// data1.product_name.push(data4);
                        }
                    })
                }
            });
            if(flag_a){
                argument2.push(data1);// argument1.push(data2);
            }
        });
        return argument2;
    },
    /*
    * @param start [A,B] end [A,B]
    * @return %
    *  起点相似度，终点相似度，线路相似度=起点相似*终点相似
    *  start的起点与end的终点相似或相符，
    *   河北廊坊-河北廊坊  线路(["河北邯郸", "河北石家庄", "河北保定", "河北张家口", "河北承德", "河北唐山", "河北廊坊", "河北沧州", "河北衡水", "河北邢台"],
    *   ["河北邯郸", "河北石家庄", "河北保定", "河北张家口", "河北承德", "河北唐山", "河北廊坊", "河北沧州", "河北衡水", "河北邢台"])
    *   结果是2
    * */
    similarProbability:function (a,b) {
        if(_.isArray(a) && _.isArray(b)){
            //并集
            abu = (_.union(a,b));
            //交集
            abi = (_.intersection(a,b));
            if((a.length==1&&a[0].length==2 || b.length==1&&b[0].length==2 )&& a[0].substring(0,2) ==  b[0].substring(0,2) ){
                //若是全省呢，则是a,b只有一个2汉字字符串，
                //取a b 中前2个字符串比较，若相同则return 1;
                return 1;//匹配了省
                //匹配市 最好是省市县有分隔符？ 省相同1 市相同1 县相同1 (1+1+1)/3, (1+1+0)/3, (1+0+0)/3,
            }else if(abu.length == a.length || abu.length == b.length){
                // [a,b,c]
                //并集 数量若与比较值想到，则为包含，
                return 1
            }else{
                return abi.length/abu.length;
            }
        }else{
            return 0
        }
    },
    lineSimilarProbability : function(a, b){
        //a,b是2个元素的数组
        if(_.isArray(a) && _.isArray(b) && a.length>0 && b.length>0){
            ab_start_p = this.similarProbability(a[0], b[0]);
            ab_end_p = this.similarProbability(a[1], b[1]);
            ba_start_p = this.similarProbability(a[0], b[1]);
            ba_end_p = this.similarProbability(a[1], b[0]);
            return ab_start_p*ab_end_p + ba_start_p*ba_end_p;
        }else{
            return;
        }

    },
    /*
        用途：在产品详情中增加总件数，总吨数，已分配件数，已分配allot吨数，未分配remain件数，未分配吨数
        场景：在指派订单（物流，司机）使用。
     */
    product_categories_20180417: function (obj) {
        var self = this;
        var productStr = JSON.parse(JSON.stringify(obj));
        _.each(productStr, function (a) {
            a.pass_amount_allot=0;
            a.pass_amount_remain=0;
            a.pass_number_allot=0;
            a.pass_number_remain=0;

            _.each(a.product_name, function (b) {
                a.pass_count_allot=self.rscDecimal('add', a.pass_count_allot, self.rscDecimal('sub', b.amount, b.amount_remain));//?有问题
                a.pass_amount_remain=self.rscDecimal('add', a.pass_amount_remain, b.amount_remain);

                a.pass_number_allot=self.rscDecimal('add', a.pass_number_allot, self.rscDecimal('sub', b.number, b.number_remain));
                a.pass_number_remain=self.rscDecimal('add', a.pass_number_remain, b.number_remain,0);

            });
        });
        return productStr;
    },
    judgeDirection: function(obj,condition){
        var str = '';
        _.each(obj, function (a) {
            if(a){
                str += a;
            }
        });
        return condition.indexOf(str) != -1;        
    },
    penultCategory: function (obj) {
        var c=[];
        if(obj && obj[0] && obj[0]['layer_1']){
            _.each([1,2,3,4,5,6,7],function(a){
                if(obj[0]['layer_'+a]){
                    c.push(obj[0]['layer_'+a])
                }
            });
            return c[c.length-2]
        }else{
            return '';
        }
        
    },
    penultCategoryChn: function (obj) {
        var c=[];
        if(obj && obj[0] && obj[0]['layer_1_chn']){
            _.each([1,2,3,4,5,6,7],function(a){
                if(obj[0]['layer_'+a+'_chn']){
                    c.push(obj[0]['layer_'+a+'_chn'])
                }
            });
            return c[c.length-2];
        }else{
            return ''; //obj && obj[0] ? obj[0]['material_chn']
        }
    },
    categoryNumber:function(product_categories){
        var num=0;
        var self=this;
        if(product_categories && product_categories[0]['product_name']){
            _.each(product_categories, function (a) {
                _.each(a.product_name, function (b) {
                    num =self.rscDecimal('add', num, b.number,0);
                });
            });
            return num;
        }else{
            return num;
        }

    },
    ispush:{
        driver: false
    },
    stringArr:function (cab) {
        if(typeof(cab) === 'string'){
            //去掉开头和结尾再分隔
            return cab.substring(0, cab.length-1).substring(1,cab.length).split(',')
        }else{
            return cab;
        }
    },
    //线路搜索, 返回一个或
    lineSearch: function(req, flag){
        var
            section=[], end_section=[], 
            area_cond=[], obj={}, obj2={},  tmp1={}, tmp2={};
        if(req.body.start_province && !req.body.end_province){
            obj= this.relevanceArea(req.body.start_province, req.body.start_city, req.body.start_district);
            if(obj.unsection){
                area_cond=[{'section': {$in: obj.section}}, {'unsection': {$in: obj.unsection}}];
            }else{
                area_cond=[{'section': {$in: obj.section}}];
            }
          //增加反向点
          // if(obj.unsection){
          //   area_cond.push({'end_section': {$in: obj.section}});
          //   area_cond.push({'end_unsection': {$in: obj.unsection}})
          // }else{
          //   area_cond=[{'end_section': {$in: obj.section}}];
          // }
        }
        if(req.body.end_province&& !req.body.start_province){
            obj2=this.relevanceArea(req.body.end_province, req.body.end_city, req.body.end_district);
            if(obj2.unsection){
                area_cond=[{'end_section': {$in: obj2.section}}, {'end_unsection': {$in: obj2.unsection}}];
            }else{
                area_cond=[{'end_section': {$in: obj2.section}}];
            }
          //增加反向点
          // if(obj2.unsection){
          //   area_cond.push({'section': {$in: obj2.section}});
          //   area_cond.push({'unsection': {$in: obj2.unsection}})
          // }else{
          //   area_cond=[{'section': {$in: obj2.section}}];
          // }
        }
        if(req.body.start_province && req.body.end_province){
            obj= this.relevanceArea(req.body.start_province, req.body.start_city, req.body.start_district);
            if(obj.unsection){
                tmp1=[{'section': {$in: obj.section}}, {'unsection': {$in: obj.unsection}}];
            }else{
                tmp1=[{'section': {$in: obj.section}}];
            }
            obj2=this.relevanceArea(req.body.end_province, req.body.end_city, req.body.end_district);
            if(obj2.unsection){
                tmp2=[{'end_section': {$in: obj2.section}}, {'end_unsection': {$in: obj2.unsection}}];
            }else{
                tmp2=[{'end_section': {$in: obj2.section}}];
            }
            _.each(tmp1, function(a){
                _.each(tmp2, function (b) {
                    area_cond.push(_.extend({}, a,b))
                })
            });
        }
      if(!flag){
        var un_area_cond=[],
            reverse={
              'section': 'end_section',//开始变结束
              'end_section': 'section',//结束变开始
              'unsection': 'end_unsection',
              'end_unsection': 'unsection'
            };
        _.each(area_cond, function(a){
          var c={};
          _.each(a, function(b,key){
            c[reverse[key]] = b;
          });
          un_area_cond.push(c)
        });
      }
      
      //四个字段组合  {包含}开始-结束，{被包含}开始-结束，
        return flag ? area_cond: area_cond.concat(un_area_cond);
    },
    getWeekStart:function () {
        var t=new Date();
        t_year=t.getFullYear(), t_month=t.getMonth()+1, t_date=t.getDate(), t_week=t.getDay(), mod=[6,0,1,2,3,4,5];
        w_start=new Date(t_year+'/'+t_month+'/'+(t_date - mod[t_week]));
        return w_start;  
    },
    getFindCategory:function (product) {
        var c_arr = ['material_chn','layer_1_chn', 'layer_2_chn', 'layer_3_chn', 'layer_4_chn', 'layer_5_chn', 'layer_6_chn', 'layer_7_chn'];
        var c_arr_eng = ['material','layer_1', 'layer_2', 'layer_3', 'layer_4', 'layer_5', 'layer_6', 'layer_7']
        var arr=[];
        _.each(product, function(x){
            var mulu='';
            _.each(c_arr, function (c) {
                if(x[c]){
                    mulu +=x[c];
                    // arr.push(x[c]);
                    // arr.push(mulu);
                }
            });
            if(x['product_name']){
                _.each(x['product_name'], function (p) {
                    if(p.name){
                        arr.push(mulu+p.name);
                    }else{
                        arr.push(mulu);
                    }
                })
            }
        });
        return _.uniq(arr).join(',');
    },
    sendData:function(req, data, next) {
        req.result = data;
        next('success');
    }
};
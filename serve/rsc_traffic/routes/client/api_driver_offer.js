/**
 * sj 20170424.
 */
//外部工具引用
var async = require('async');
var _ = require('underscore');
var express = require('express');
var decimal = require('decimal');
//内部工具引用
var http = require('../../lib/http');
var util = require('../../lib/util');

//配置文件引用
var config_api_url = require('../../configs/config_api_url');
// var config_server = require('../../configs/config_server');
var config_msg_template = require('../../configs/config_msg_template');
var config_common = require('../../configs/config_common');
//内部数据操作引用
// var demoSV = require('../../lib/lib_demo');
var driverDemandSV = require('../../lib/lib_traffic_driver_demand');
var driverOfferSV = require('../../lib/lib_traffic_driver_offer');
var driverOrderSV = require('../../lib/lib_traffic_driver_order');
var trafficOrderSV = require('../../lib/lib_traffic_order');
var extServer = require('../../lib/lib_ext_server');
var driverPlanSV = require('../../lib/lib_traffic_driver_plan');
var lib_msg = require('../../lib/lib_msg');
var trafficLineSV=require('../../lib/lib_traffic_line');


module.exports = function() {
    var api = express.Router();

    //token 解析判断
    api.use(require('../../middlewares/mid_verify_user')());

    //特殊操作
    /**
     * 司机抢单 ，形成订单 20170516
     * param : scene:'driver_assign',demand_id:'需求单id',truck_id:'车辆id', products:'分配的产品'
     * 20170704 司机不被允许直接接单;
     */
    api.post('/price_can_order', function(req, res, next){
         //场景判断
        //执行操作
        var sms_order, company_sell_id, userInfo, driverOrder, driverDemand, products, plan_id=false, lading_code=[], only_code, plandInfo, trafficOrder={};

        async.waterfall([
            function (cb) {
                //角色判断
                if(config_common.accessRule.pass.indexOf(req.decoded.role)==-1){
                    return cb({dev: '仅限物流方', pro: '000002'}); //not_allow
                }
                //参数判断
                var checkout_fields =[
                    {field: 'demand_id', type:'string'},
                    {field: 'user_supply_id', type:'string'},
                    {field: 'amount', type:'number'},
                    {field: 'product_categories', type:'object'}
                ];
                config_common.checkField(req, checkout_fields, function (err) {
                    if(err){
                        return cb({dev: err, pro: '000003'});//'000003'
                    }
                    req.body.product_categories = _.isString(req.body.product_categories) ? JSON.parse(req.body.product_categories) : req.body.product_categories;
                    if(!req.body.amount){
                       return cb({dev: '已没有货物'});
                    }else{
                        cb();
                    }
                })
            },
            function (cb) {
                driverDemandSV.getOne({
                    find: {
                        _id: req.body.demand_id,
                        status: config_common.demand_status.effective
                    }
                },cb)
            },
            function (demand,cb) {
                if(!demand){
                    return cb({dev: '司机需求单没找到', pro: '000004'}); //('demand_not_found');
                }
                //若没有足够吨数，或指派吨数超过剩余吨数
                if(demand.amount_remain<=0 || req.body.amount > demand.amount_remain){
                    return cb({dev: '没有剩余货物',pro: '000006'});
                }
                driverDemand = demand;
                //关闭司机计划中的单据
                driverPlanSV.getOne({
                    find: {user_id: req.body.user_supply_id, demand_id: demand._id.toString()}
                }, function (err, plan) {
                    if(plan){
                        plan_id = true;
                        plandInfo = plan;
                        plandInfo.status = config_common.demand_status.complete;
                        plandInfo.sorting=config_common.demand_status_sort[plandInfo.status];
                        //若计划中有价格则依据计划价为主;
                        // if(plan.price>0){
                            driverDemand.price = plan.price || 0;
                        // }
                        plandInfo.save(function () {})
                    }
                });
                products = config_common.recompute_products(req.body.product_categories, 'number');
                //增加提交货剩余字段
                products = config_common.addStoreFields(products);
                //向user服务器进行检查车人归属(20170526 后期移到检验层)
                driverDemandSV.getUserTruck(req, {user_id: req.body.user_supply_id}, cb);
            },
            function(user, cb){
                if(!user || !user.truck_id){
                    return cb({dev: '车辆信息没找到', pro: '000004'}); //'not_truck'
                }
                userInfo = user;
                //生成提货码, 且规定发生10变化;
                for(var i = 0; i < 10; i++){
                    var tmp_code = config_common.getVerifyCode();
                    lading_code.push(tmp_code);
                }
                driverOrderSV.onlyList({
                    find: {
                        $or: [
                            {send_address_id: {$in: [driverDemand.send_address_id, driverDemand.receive_address_id]},
                            receive_address_id: {$in: [driverDemand.send_address_id, driverDemand.receive_address_id]}}
                        ]
                    },
                    select: 'lading_code'
                }, function (err, list) {
                    if(err){
                        return cb({dev: '操作错误', pro: '000004'});
                    }
                    var code = _.pluck(list, 'lading_code');
                    only_code = _.difference(lading_code, code);
                    only_code = only_code.length==0 ? lading_code : only_code;
                    cb();
                })
            },
            function (cb) {
              trafficOrderSV.getOne({find: {_id: driverDemand.order_id}}, cb)
            },
            function(passOrder,cb){
                if(passOrder){
                    trafficOrder = passOrder;
                }
                driverOrder = {
                    index: config_common.getDriverOrderIndex(),
                    demand_id: req.body.demand_id,
                    order_id: driverDemand.order_id||'',
                    demand_user_id: driverDemand.demand_user_id,
                    demand_company_id: driverDemand.demand_company_id,
                    supply_user_id: req.body.user_supply_id, //req.decoded.id,
                    // truck_id: userInfo.truck_id,
                    truck_weight:userInfo.truck_weight,
                    role: req.decoded.role,
                    material: driverDemand.material,
                    material_chn: config_common.material[driverDemand.material],
                    price: driverDemand.price,
                    product_categories: products,
                    products_replenish: driverDemand.products_replenish,//[], 补货信息
                    //支付方式
                    payment_choice: driverDemand.payment_choice,          //现有支付选择(现金，银兑，商兑)
                    payment_method: driverDemand.payment_method,          //现有支付方法(货到付款，款到付货，分期，信用)
                    count_day_extension: driverDemand.count_day_extension,    //延期天数
                    time_day_extension: driverDemand.time_day_extension,       //实际还款天数
                    ref_day_extension: driverDemand.ref_day_extension,      //延期计算标准
                    percentage_advance: driverDemand.percentage_advance,     //预付款百分比
                    percentage_remain: driverDemand.percentage_remain,      //中款百分比

                    weigh_settlement_style: driverDemand.weigh_settlement_style,  //重量结算方式
                    // time_settlement_style: driverDemand.time_settlement_style,   //时间结算方式
                    att_traffic: driverDemand.att_traffic, //物流细则
                    appendix: driverDemand.appendix,                 //备注
                    quality_origin: driverDemand.quality_origin, //质检方
                    //汇款信息
                    remit_name: driverDemand.remit_name,               //公司名称
                    remit_bank: driverDemand.remit_bank,               //开户银行
                    remit_account: driverDemand.remit_account,           //公司账号
                    //发票信息
                    invoice_name: driverDemand.invoice_name,               //发票公司名
                    invoice_addr: driverDemand.invoice_addr,               //单位地址
                    invoice_number: driverDemand.invoice_number,             //税号
                    invoice_phone: driverDemand.invoice_phone,              //公司电话
                    invoice_bank: driverDemand.invoice_bank,               //开户银行
                    invoice_account: driverDemand.invoice_account,           //公司账号
                    //出发地 ，到达地
                    send_address_id: driverDemand.send_address_id,
                    send_name: driverDemand.send_name,
                    send_phone: driverDemand.send_phone,
                    send_province: driverDemand.send_province,
                    send_city: driverDemand.send_city,
                    send_district: driverDemand.send_district,
                    send_addr: driverDemand.send_addr,
                    send_loc: driverDemand.send_loc,
                    receive_address_id: driverDemand.receive_address_id,
                    receive_name: driverDemand.receive_name,
                    receive_phone: driverDemand.receive_phone,
                    receive_province: driverDemand.receive_province,
                    receive_city: driverDemand.receive_city,
                    receive_district: driverDemand.receive_district,
                    receive_addr: driverDemand.receive_addr,
                    receive_loc: driverDemand.receive_loc,
                    //时间
                    time_depart: driverDemand.time_depart,
                    
                    time_creation: new Date(),
                    time_update_step: new Date(),
                    status: config_common.demand_status.effective,
                    //source: driverDemand.verify_driver.indexOf(req.decoded.id) != -1 ? driverDemand.source: config_common.demand_source.platform_assign,
                    source: plandInfo ? plandInfo.source : driverDemand.verify_driver.indexOf(req.body.user_supply_id)==-1 ? config_common.demand_source.platform_assign : driverDemand.source,
                    replenish:{
                        products_replenish:   [], 
                        order_loading:    [], 
                        order_unloading:  [], 
                        price_send_sub: '0', 
                        price_receive_sub:  '0',                        
                        replenish_price:    '0',
                        replenish_count:    '0',
                        replenish_amount:   '0',
                        pay_tip_to_buy: false, //是否支付给物流信息费
                    },
                    time_sort: config_common.getYearMonth(new Date()).monthStr,
                    demand_user_name: req.decoded.user_name,
                    demand_company_name: req.decoded.company_name,
                    supply_user_name: userInfo.real_name,
                    truck_num: userInfo.truck_num,
                    lading_code: only_code[0],
                    catalogue: config_common.getCatalogue(products, 5, ''),
                    section: driverDemand.section,  //区间
                    end_section: driverDemand.end_section,  //区间
                    tip_price: driverDemand.tip_price, //信息费
                    send_nickname: driverDemand.send_nickname,
                    receive_nickname: driverDemand.receive_nickname,

                    tip_prices : !req.body.tip_prices ? 0 : req.body.tip_prices,
                    // step: req.body.tip_prices && req.body.tip_prices > 0 ? 0.5 : 1, //20180417 0元也需要支付
                    category_penult: driverDemand.category_penult,
                    category_penult_chn: driverDemand.category_penult_chn,
                    supply_user_phone: userInfo.phone,
                    time_cost: driverDemand.time_cost
                };
                driverOrder.time_tip_price = plan_id ? (new Date()).getTime() + 6 * 60 * 60 *1000 : 0; //20180418 由30分钟转6小时

                if(driverDemand.time_arrival){
                    driverOrder.time_arrival = driverDemand.time_arrival;
                }
                if(driverDemand.time_depart){
                    driverOrder.time_depart = driverDemand.time_depart;
                }
                if(driverDemand.time_depart_start){
                    driverOrder.time_depart_start = driverDemand.time_depart_start;
                }
                if(driverDemand.time_depart_end){
                    driverOrder.time_depart_end = driverDemand.time_depart_end;
                }
                if(driverDemand.payment_payee){
                    driverOrder.payment_payee = driverDemand.payment_payee;
                }
                if(driverDemand.freight_voucher){
                    driverOrder.freight_voucher = driverDemand.freight_voucher;
                }
                driverOrder.category = (_.uniq(_.pluck(products, 'layer_1'))).join(',');
                driverOrder.category_chn = (_.uniq(_.pluck(products, 'layer_1_chn'))).join(',');
                driverOrder.amount = driverOrder.amount_remain = config_common.getAmountTheory(products); //获取理论吨数
                if(driverOrder.amount > driverDemand.amount_remain){
                    return cb({dev: '没有可派资源', pro: '000006'}); //'not_enough_goods'
                }
                driverOrder.products_remain = config_common.products_remain_construct(products, 'number');
                driverOrder.price_total = config_common.rscDecimal('mul', driverOrder.amount, driverDemand.price, 2);//获取订单理论价格
                // driverOrder.price_total = config_common.converNumberLength(driverOrder.price_total, 2);
                // 对需求单进行 "减法处理"
                driverDemand.products_remain = driverOfferSV.subProduce(driverDemand.products_remain, driverOrder.products_remain);
                driverDemand.product_categories = config_common.produceRemainToProduce(driverDemand.product_categories, driverOrder.products_remain);//改变剩余数量
              if(trafficOrder && trafficOrder.product_categories){
                trafficOrder.product_categories = config_common.produceRemainToProduce(trafficOrder.product_categories, driverOrder.products_remain);//改变剩余数量
                trafficOrder.save(function (x,y) {
                  console.log('修改物流订单成功',x)
                })
              }
                driverDemand.amount_remain = config_common.rscDecimal('sub', driverDemand.amount_remain , driverOrder.amount);
                //若指定司机没有接单，则将司机推送到接单序列中，并从未接单列表中移除;
                if(driverDemand.unoffer_list.indexOf(req.body.user_supply_id) == -1){
                    driverDemand.unoffer_list.unshift(req.body.user_supply_id);
                    if(driverDemand.verify_driver.indexOf(req.body.user_supply_id)!= -1){
                        driverDemand.verify_driver.splice(driverDemand.verify_driver.indexOf(req.body.user_supply_id), 1);
                    }
                    if(driverDemand.platform_driver.indexOf(req.body.user_supply_id)!= -1){
                        driverDemand.platform_driver.splice(driverDemand.platform_driver.indexOf(req.body.user_supply_id), 1);
                    }
                }
                if(!plan_id){
                    //代替接单 offeer_count 累加
                    driverDemand.offer_count++;
                }else{
                    driverOrder.plan_id=plandInfo._id;
                }
                driverDemand.order_count++;
                driverDemand.time_modify = new Date();
                //增加交易订单 index 和发布物流订单的用户id;
                driverOrder.index_trade = trafficOrder.index_trade ? trafficOrder.index_trade: '';
                driverOrder.demand_trade_user_id = trafficOrder.demand_user_id ? trafficOrder.demand_user_id : '';
                driverOrder.payment_payer = driverDemand.payment_payer;
                //20180619 产品搜索
                driverOrder.find_category=config_common.getFindCategory(driverOrder.product_categories);
                
                driverOrderSV.add(driverOrder, function(err, order){
                    if(err){
                        return cb({dev: '司机订单创建失败', pro: '000005'}); //'order_create_failed'
                    }
                    driverDemand.markModified('product_categories');
                    driverDemand.markModified('products_remain');
                    if(Number(driverDemand.amount_remain)>1 || !!driverDemand.amount_remain){
                        driverDemand.status = config_common.demand_status.effective;
                    }else{
                        driverDemand.status =config_common.demand_status.complete;
                        driverDemand.sorting =config_common.demand_status_sort[driverDemand.status];
                        //关闭计划
                        driverPlanSV.updateList({
                            find: {
                                status: config_common.demand_status.effective,
                                demand_id: driverDemand._id.toString()
                            },
                            set: {status: config_common.demand_status.ineffective, time_modify: new Date()}
                        }, function () {

                        })
                    }
                    driverDemand.status = Number(driverDemand.amount_remain)>1 || !!driverDemand.amount_remain ? config_common.demand_status.effective : config_common.demand_status.complete;
                    driverDemand.save(function(){});
                    if(trafficOrder && trafficOrder.index){
                        //物流订单增加
                        trafficOrder.driver_money=config_common.rscDecimal('add', trafficOrder.driver_money, order.price_total);
                        trafficOrder.save(function () {

                        })
                    }

                    //修改线路订单数
                    if(driverDemand.line_id){
                        trafficLineSV.updateList({find: {_id: driverDemand.line_id}, set:{
                            $inc: {order_count: 1}
                        }}, function () {})
                    }
                    driverOrderSV.getOrderUserComp(req, order, cb);
                });
            }
        ],function(err, result){
            if(err){
                return next(err);
            }
            var redcard='',category_info='';
            async.waterfall([
                function (push) {
                    //红包检查
                    extServer.redcardtip(req, {
                        company_id: driverDemand.demand_company_id,
                        user_id: userInfo.user_id
                    }, push)
                },
                function (redcardR, push) {
                    var ispush_driver=false;
                    if(redcardR && redcardR.uuid && ((new Date()).getTime())>((new Date(redcardR.uuid.time_creation)).getTime() + 7*24*60*60*1000) ){
                        ispush_driver=true;
                    }
                    if((!!redcardR.card || !!redcardR.cardOrder) && !redcardR.uuid){
                        redcard +='，立即领取'+redcardR.card.money+'元现金红包，vehicles.e-wto.com';
                    }else{
                        redcard +='，vehicles.e-wto.com';
                    }

                     var category_penult_chn = config_common.penultCategoryChn(driverOrder.product_categories);
                     var category_count =config_common.categoryNumber(driverOrder.product_categories);
                     if(driverOrder.product_categories[0]['pass_unit']==driverOrder.product_categories[0]['unit']){
                        category_info += category_penult_chn;
                     }else{
                        category_info += category_count+driverOrder.product_categories[0]['unit']+category_penult_chn;
                     }
                    if(ispush_driver){
                        var msgObj = {
                            title: '订单确认提醒',
                            content: config_msg_template.encodeContent('driver_order_red', [
                                driverOrder['demand_company_name'] ? driverOrder['demand_company_name'] : '',
                                driverOrder['send_city']?driverOrder['send_city']:'',
                                driverOrder['receive_city']?driverOrder['receive_city']:'',
                                category_info,
                                driverOrder['amount'],
                                driverOrder['price'],
                                driverOrder['demand_company_name'] ? driverOrder['demand_company_name'] : '',
                                driverOrder['demand_user_name'],
                                req.decoded.phone,
                                redcard
                            ]),
                            user_ids: [driverOrder.supply_user_id]
                        };
                        extServer.push(req, msgObj, {}, '', {
                            params: {id: result._id.toString(), type: config_common.push_url.driver_order_detail},
                            url: config_common.push_url.driver_order_detail
                        }, push);

                    }else{
                        //%s给您指派%s—%s%s运输，理计重量%s吨，运费%s元/吨。需立即前往%s现场确认运输信息，联系人：%s，电话%s，或登录在线支付信息费%s
                        extServer.driverMsg(req, {
                            phone: [driverOrder.supply_user_phone],
                            params: [
                                driverOrder['demand_company_name'] ? driverOrder['demand_company_name'] : '',
                                driverOrder['send_city']?driverOrder['send_city']:'',
                                driverOrder['receive_city']?driverOrder['receive_city']:'',
                                category_info,
                                driverOrder['amount'],
                                driverOrder['price'],
                                driverOrder['demand_company_name'] ? driverOrder['demand_company_name'] : '',
                                driverOrder['demand_user_name'],
                                req.decoded.phone,
                                redcard
                            ],
                            templateid: '3932684'
                        }, push);
                    }
                }
            ], function () {});
            config_common.sendData(req, result, next);
        });
    });

    /**
     * 线下找车临时订单
     *       assign: [{
                        company_name: '测试物流', //物流公司名称
                        user_name: '测试物流管理员',
                        user_phone: '测试物流管理员电话',
                        driver: [{
                        user_name: '测试司机', //姓名，
                        user_phone: '测试电话', //手机号，，
                        truck_num:'车牌号',//车牌号
                        truck_weight:'载重量',//载重量
                        truck_long:'车辆长度', //车辆长度，
                        truck_type:'车辆类型', //车辆类型，
                        product_categories: []
                    }]
     */
    api.post('/trade_driver_order', function(req, res, next){
        //物流公司名，司机id,交易订单id ,
        var tradeOrder;
        async.waterfall([
            function (cb) {
                if(req.decoded && config_common.accessRule.trade.indexOf(req.decoded.role) == -1){
                    return cb({dev: '仅限交易', pro: '000002'}); //not_allow
                }
                if(!req.body.index_trade || !req.body.assign || !req.body.assign[0]['driver'] || !req.body.assign[0]['driver'][0]['product_categories']){
                    return cb({dev: '缺少参数'})
                }else{
                    cb();
                }
            },
            function (cb) {
                extServer.generalFun(req, {
                    source: 'trade',
                    db:'DemandOrder',
                    method:'getOne',
                    query:{
                        find: {
                            index: req.body.index_trade
                        }
                    }}, cb);
            },
            function (order, cb) {
                if(!order){
                    return cb({dev: '交易订单未找到'});
                }
                tradeOrder = order;
                async.eachSeries(req.body.assign, function (obj, cb1) {
                    //生成物流订单
                    if(obj.company_name){
                        //提取driver中product_categories，形成新的product_categories
                        //创建公司 公司负责人 司机
                        async.waterfall([
                            function (cb20) {
                                //创建公司
                                extServer.generalFun(req, {
                                    source: 'user',
                                    db:'Company_traffic',
                                    method:'add',
                                    query:{
                                        user_id: req.decoded.id, //创建人id
                                        phone_creator: req.decoded.phone,//创建人电话
                                        nick_name: obj.company_name,
                                        type: config_common.company_category.TRAFFIC,
                                        transport: tradeOrder.product_categories[0]['material'],
                                        source: 'remark'
                                    }}, cb20);
                            },
                            function (company, cb20) {
                                obj.companyInfo = company;
                                //创建公司负责人
                                extServer.generalFun(req, {
                                    source: 'user',
                                    db:'User_traffic',
                                    method:'add',
                                    query:{
                                        phone: obj.user_phone,
                                        real_name: obj.user_name,
                                        company_id: [obj.companyInfo._id],
                                        role: {$in: config_common.accessRule.pass},
                                        source: 'remark'
                                    }}, cb20);
                            },
                            function (user, cb20) {
                                obj.userInfo = user;
                                if(obj.driver && obj.driver.length>0){
                                    obj.product_categories = [];//config_common.mergeCategoris(obj.driver);
                                    _.each(obj.driver, function (a) {
                                        if(a.product_categories){
                                            a.price = obj.pass_price || req.body.pass_price || config_common.rscDecimal('div',tradeOrder.price, tradeOrder.amount, 2);
                                            _.each(a.product_categories, function (b) {
                                                b['pass_price'] = a.price;
                                            });
                                            //增加提交货剩余字段
                                            a.product_categories = config_common.recompute_products(a.product_categories, 'number');
                                            a.product_categories = config_common.addStoreFields(a.product_categories);
                                            // obj.product_categories = _.union(obj.product_categories, a.product_categories);
                                        }
                                    });
                                    _.each(obj.driver, function (a) {
                                        if(a.product_categories){
                                            obj.product_categories = config_common.mergeCategoris(obj.product_categories, a.product_categories);
                                        }
                                    })

                                }
                                // return cb({dev: obj})
                                trafficOrderSV.offlineAdd(req, tradeOrder, obj, function (err, order) {
                                    if(order){
                                        async.eachSeries(obj.driver, function (truck, cb10) {
                                            async.waterfall([
                                                function (cb100) {
                                                    //创建司机
                                                    extServer.generalFun(req, {
                                                        source: 'user',
                                                        db:'User_traffic',
                                                        method:'add',
                                                        query:{
                                                            phone: truck.user_phone,
                                                            real_name: truck.user_name,
                                                            company_id: [obj.companyInfo._id],
                                                            role: config_common.user_roles.TRAFFIC_DRIVER_PRIVATE,
                                                            source: 'remark'
                                                        }}, cb100);
                                                },
                                                function (user, cb100) {
                                                    truck.userInfo = user;
                                                    //创建司机
                                                    extServer.generalFun(req, {
                                                        source: 'user',
                                                        db:'Truck',
                                                        method:'add',
                                                        query:{
                                                            number: truck.truck_num,
                                                            long: truck.truck_long,
                                                            weight: truck.truck_weight,
                                                            type: truck.truck_type,
                                                            user_id: truck.userInfo._id,
                                                            source: 'remark'
                                                        }}, cb100);
                                                },
                                                function (car, cb100) {
                                                    truck.truckInfo = car;
                                                    //生成司机订单
                                                    if(truck.product_categories){
                                                        truck.product_categories = config_common.randomProductId(truck.product_categories);
                                                        driverOrderSV.offlineAdd(req, truck, order, cb100);
                                                    }else{
                                                        cb100();
                                                    }
                                                }
                                            ], cb10);


                                        }, cb20);
                                    }else{
                                        cb20();
                                    }
                                });
                            }
                        ], cb1)

                    }else{
                        cb1()
                    }
                }, cb);
            }
        ], function (err, result) {
            if(err){
                return next(err);
            }
            config_common.sendData(req, true, next);
        });
    });
    /**
     * 仓库 添加合同库
     *  company_name, user_phone, user_name, payment_style, receive_id, send_id amount
     */
    api.post('/store_trade_driver_order', function(req, res, next){
            //物流公司名，司机id,交易订单id ,
        // req.body = {
        //     type: 'demand', //交易类型: demand:交易方, supply:销售方
        //     company_name: '共享经济', //交易公司
        //     user_phone:'11111111', //交易公司联系方式
        //     user_name:'同乡会', //交易公司联系人
        //     payment_style:'FOB', //配送方式
        //     receive_id:'5a5577a3c589a31b388a7f0e', //交货仓库地址 5a2f32b24c34911a4a2a10b7
        //     send_id:'5a388b15bfdbc8beb57f1a0a', //提货仓库地址
        //     amount:'20', //总重量
        //     area: 50, //占用面积
        //     area_name: "A", //占用区域
        //     axis_x: 1, //占用区间x
        //     axis_y: 100, //占用区间y
        //     //占用面积 占用区域 x,y
        //     product_categories: [
        //     {"_id":"5a3873db23e9af0e30529a5b","PID":"0","chn":"钢铁","file":"http://rsc-jishuzhichi.oss-cn-beijing.aliyuncs.com/products/steel.png","eng":"gangtie","__v":0,"unit_metering":"","unit_pass":"","unit_product":"","price_type":"","attribute":"","lev":0,"class":"active","layer_1":"tudulei","layer_1_chn":"涂镀类","layer_2":"youhuaduxinjuan","layer_2_chn":"有花镀锌卷","layer_3":"SGCC","layer_3_chn":"SGCC","layer_4":"1250","layer_4_chn":"1250","product_name":[{"name":"阿斯蒂芬","attribute":[{"_id":"5a3873c69569bb0718314355","numbering":"407","name":"厚度","vary":"","unit":"mm","value":"3"}],"measure_unit":[],"isSelect":true}]}
        // ], //产品详情
        //     assign: [{
        //         company_name: '测试物流', //物流公司名称
        //         user_name: '测试物流管理员',
        //         user_phone: '测试物流管理员电话',
        //         driver: [{
        //             user_name: '测试司机', //姓名，
        //             user_phone: '测试电话', //手机号，，
        //             truck_num:'车牌号',//车牌号
        //             truck_weight:'载重量',//载重量
        //             truck_long:'车辆长度', //车辆长度，
        //             truck_type:'车辆类型', //车辆类型，
        //             product_categories: []
        //         }]}]
        // };
        var tradeOrder={} , tradeCompany={}, tradeUser={};
        async.waterfall([
            function (cb) {
                if(req.decoded && config_common.user_roles.TRADE_STORAGE != req.decoded.role){
                    return cb({dev: '仅限仓库', pro: '000002'}); //not_allow
                }
                if(!req.body.assign || !req.body.assign[0]['driver'] || !req.body.assign[0]['driver'][0]['product_categories']){
                    return cb({dev: '缺少参数'})
                }else if(req.body.receive_id == req.body.send_id){
                    return cb({dev: '提交货地址不能相同'})
                }else{

                    cb();
                }
            },
            function (cb) {
                //创建公司
                extServer.generalFun(req, {
                    source: 'user',
                    db:'Company_trade',
                    method:'add',
                    query:{
                        user_id: req.decoded.id, //创建人id
                        phone_creator: req.decoded.phone,//创建人电话
                        nick_name: req.body.company_name,
                        type: config_common.company_category.TRADE,
                        source: 'remark'
                    }}, cb);
            },
            function (company, cb) {
                if(!company){
                    return cb({dev: '创建交易公司失败'})
                }
                tradeCompany = company;
                //创建公司负责人
                extServer.generalFun(req, {
                    source: 'user',
                    db:'User_trade',
                    method:'add',
                    query:{
                        phone: req.body.user_phone,
                        real_name: req.body.user_name,
                        company_id: tradeCompany._id,
                        role: config_common.user_roles.TRADE_ADMIN,
                        source: 'remark'
                    }}, cb);
            }, function(user, cb){
                if(!user){
                    return cb({dev: '创建交易负责人失败'})
                }else{
                    tradeUser = user;
                    if('demand' == req.body.type){
                        tradeOrder.user_demand_id = tradeUser._id ,
                        tradeOrder.company_demand_id = tradeCompany._id,
                        tradeOrder.company_demand_name = tradeCompany.nick_name;
                        tradeOrder.user_supply_id = req.decoded.id,
                        tradeOrder.company_supply_id = req.decoded.company_id
                        tradeOrder.company_supply_name = req.decoded.company_name;
                    }else{
                        tradeOrder.user_demand_id = req.decoded.id,
                        tradeOrder.company_demand_id = req.decoded.company_id,
                        tradeOrder.company_demand_name = req.decoded.company_name;
                        tradeOrder.user_supply_id = tradeUser._id,
                        tradeOrder.company_supply_id = tradeCompany._id,
                        tradeOrder.company_supply_name = tradeCompany.nick_name;
                    }
                    //提交货地址
                    extServer.judgeStore({
                        _id: req.body.receive_id
                    }, cb);
                }

            }, function(address, cb){
                if(!address){
                    return cb({dev: '收货地址查询失败'})
                }
                if(address){
                    tradeOrder.receive_address_id = address && address.type ? address._id.toString() : '';
                    tradeOrder.receive_province = address.province;               //省
                    tradeOrder.receive_city = address.city;               //市
                    tradeOrder.receive_district = address.district;               //区
                    tradeOrder.receive_addr = address.addr;
                    tradeOrder.receive_name = address.prin_name;    //接收方名字
                    tradeOrder.receive_phone = address.prin_phone;   //接收方电话
                    tradeOrder.receive_location = [address.location[0], address.location[1]]; //loc[1];
                    tradeOrder.receive_add_name = address.name || '';
                }
                extServer.judgeStore({
                    _id: req.body.send_id
                }, cb);
            }, function (address, cb) {
                if(!address){
                    return cb({dev: '交货地址查询失败'})
                }
                if (address) {
                    tradeOrder.send_address_id = address && address.type ? address._id.toString() : '';
                    tradeOrder.send_province = address.province;               //省
                    tradeOrder.send_city = address.city;               //市
                    tradeOrder.send_district = address.district;               //区
                    tradeOrder.send_addr = address.addr;
                    tradeOrder.send_name = address.prin_name;    //接收方名字
                    tradeOrder.send_phone = address.prin_phone;   //接收方电话
                    tradeOrder.send_location = [address.location[0], address.location[1]]; //loc[1];
                    tradeOrder.send_add_name = address.name || '';
                }
                //创建交易订单, 生成合同库
                tradeOrder = _.extend(tradeOrder, {
                    // offer_id: '',
                    // admin_id: '',
                    index: config_common.getTradeOrderIndex('order'),
                    payment_style: req.body.payment_style, //FOB ,CIF
                    step: 1,
                    status: 'effective',
                    order_origin: 'remark',
                    amount: req.body.amount,

                    // user_confirm_id: '',
                    product_categories: req.body.product_categories,
                    // warehouse_name: '',
                    att_quality: ["demand"],
                    att_payment: ["cash"],
                    att_traffic: ["pick_up"],
                    att_settlement: ["all_cash"],
                    // path_loss: '',

                    price: 0,
                    // preferential: '',
                    // delay_day: '',
                    // delay_type: '',
                    // percent_advance: '',
                    // time_depart_end: '',
                    // price_type: '',
                    // replenish: '',
                    // appendix: ''
                });
                extServer.generalFun(req, {
                    source: 'trade',
                    db:'DemandOrder',
                    method:'add',
                    query:tradeOrder
                }, cb);
            },
            function (order, cb) {
                tradeOrder = order;
                //添加实物库
                extServer.storeServerOrderTradeAdd({
                    order_id: tradeOrder._id.toString(),
                    send_address_id: tradeOrder.send_address_id,
                    receive_address_id: tradeOrder.receive_address_id,
                    amount: tradeOrder.amount,
                    send_user_id: tradeOrder.user_supply_id,
                    receive_user_id: tradeOrder.user_demand_id,
                    send_company_id: tradeOrder.company_supply_id,
                    receive_company_id: tradeOrder.company_demand_id
                }, function () {
                    if(tradeOrder.send_address_id){
                        extServer.storeClientSetStoreRegion(req, {
                            area: Number(req.body.area),
                            area_name: req.body.area_name,
                            axis_x: Number(req.body.axis_x),
                            axis_y: Number(req.body.axis_y),
                            order_id: tradeOrder._id,
                            store_id: tradeOrder.send_address_id
                        });
                    }
                    
                    if(tradeOrder.receive_address_id){
                        extServer.storeClientSetStoreRegion(req, {
                            area: Number(req.body.area),
                            area_name: req.body.area_name,
                            axis_x: Number(req.body.axis_x),
                            axis_y: Number(req.body.axis_y),
                            order_id: tradeOrder._id,
                            store_id: tradeOrder.receive_address_id
                        });
                    }
                    
                });
                    //添加区域


                    //添加模拟交易订单完成,会删除 合同库中的数据
                    // extServer.storeServerOrderTradeComplete({
                    //     order_id: tradeOrder._id.toString(),
                    //     product_categories: tradeOrder.product_categories
                    // }, function (x, y) {
                    //     console.log('storeServerOrderTradeComplete', x, y)
                    // });
                // 交易订单结束
                async.eachSeries(req.body.assign, function (obj, cb1) {

                    //生成物流订单
                    if(obj.company_name){
                        //提取driver中product_categories，形成新的product_categories
                        //创建公司 公司负责人 司机
                        async.waterfall([
                            function (cb20) {
                                //创建公司
                                extServer.generalFun(req, {
                                    source: 'user',
                                    db:'Company_traffic',
                                    method:'add',
                                    query:{
                                        user_id: req.decoded.id, //创建人id
                                        phone_creator: req.decoded.phone,//创建人电话
                                        nick_name: obj.company_name,
                                        type: config_common.company_category.TRAFFIC,
                                        // transport: tradeOrder.product_categories[0]['material'],
                                        source: 'remark'
                                    }}, cb20);
                            },
                            function (company, cb20) {
                                obj.companyInfo = company;
                                //创建公司负责人
                                extServer.generalFun(req, {
                                    source: 'user',
                                    db:'User_traffic',
                                    method:'add',
                                    query:{
                                        phone: obj.user_phone,
                                        real_name: obj.user_name,
                                        company_id: [obj.companyInfo._id],
                                        role: {$in: config_common.accessRule.pass},
                                        source: 'remark'
                                    }}, cb20);
                            },
                            function (user, cb20) {
                                obj.userInfo = user;
                                if(obj.driver && obj.driver.length>0){
                                    obj.product_categories = [];//config_common.mergeCategoris(obj.driver);
                                    _.each(obj.driver, function (a) {
                                        if(a.product_categories){
                                            a.price = 1;
                                            // _.each(a.product_categories, function (b) {
                                            //     b['pass_price'] = a.price;
                                            // });
                                            //增加提交货剩余字段
                                            a.product_categories = config_common.recompute_products(a.product_categories, 'number');
                                            a.product_categories = config_common.addStoreFields(a.product_categories);
                                            obj.product_categories = config_common.mergeCategoris(obj.product_categories, a.product_categories);
                                        }
                                    });
                                }
                                obj.product_categories = config_common.recompute_products(obj.product_categories, 'number');
                                obj.product_categories = config_common.addStoreFields(obj.product_categories);
                                // cb({dev: obj})
                                trafficOrderSV.offlineAdd(req, tradeOrder, obj, function (err, order) {
                                    if(order){
                                        async.eachSeries(obj.driver, function (truck, cb10) {
                                            if(truck.user_name){
                                            async.waterfall([
                                                function (cb100) {
                                                    //创建司机
                                                    extServer.generalFun(req, {
                                                        source: 'user',
                                                        db:'User_traffic',
                                                        method:'add',
                                                        query:{
                                                            phone: truck.user_phone,
                                                            real_name: truck.user_name,
                                                            company_id: [obj.companyInfo._id],
                                                            role: config_common.user_roles.TRAFFIC_DRIVER_PRIVATE,
                                                            source: 'remark'
                                                        }}, cb100);
                                                },
                                                function (user, cb100) {
                                                    truck.userInfo = user;
                                                    //创建司机
                                                    extServer.generalFun(req, {
                                                        source: 'user',
                                                        db:'Truck',
                                                        method:'add',
                                                        query:{
                                                            number: truck.truck_num,
                                                            long: truck.truck_long,
                                                            weight: truck.truck_weight,
                                                            type: _.isString(truck.truck_type) ? truck.truck_type : truck.truck_type.eng,
                                                            user_id: truck.userInfo._id,
                                                            source: 'remark'
                                                        }}, cb100);
                                                },
                                                function (car, cb100) {
                                                    truck.truckInfo = car;
                                                    //生成司机订单
                                                    if(truck.product_categories){
                                                        // truck.product_categories = config_common.randomProductId(truck.product_categories);
                                                        driverOrderSV.offlineAdd(req, truck, order, cb100);
                                                    }else{
                                                        cb100();
                                                    }
                                                }
                                            ], cb10);
                                            }else{
                                                cb10();
                                            }

                                        }, cb20);
                                    }else{
                                        cb20();
                                    }
                                });
                            }
                        ], cb1)

                    }else{
                        cb1()
                    }
                }, function () {
                    cb();
                });
            }
        ], function (err, result) {
            if(err){
                return next(err);
            }
            config_common.sendData(req, true, next);
        });
    });

    return api;
};


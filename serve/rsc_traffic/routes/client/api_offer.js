/**
 * Created by Administrator on 2015/11/25.
 */
var _ = require('underscore');
var async = require('async');
var express = require('express');

var config_common = require('../../configs/config_common');
var config_msg_template = require('../../configs/config_msg_template');

var trafficDemandSV = require('../../lib/lib_traffic_demand');
var trafficOrderSV = require('../../lib/lib_traffic_order');
var extServer = require('../../lib/lib_ext_server');
var trafficPlanSV = require('../../lib/lib_traffic_plan');
var lib_msg = require('../../lib/lib_msg');
var http = require('../../lib/http');
var trafficLineSV=require('../../lib/lib_traffic_line');

module.exports = function(){
    var api = express.Router();
    api.use(require('../../middlewares/mid_verify_user')());

    /**
     * 指派物流公司实际货物清单 (司机模式: 产品详情分配，物流模式：产品目录分配)
     */
    api.post('/assign_order', function (req, res, next) {
        /**
         * 需求单id, 客户端提供指派内容(前提结构正确); 判断产品分配的剩余结构
         *  转换产品为剩余格式，检查是否满足剩余;
         *  计算剩余产品，修改需求单;
         */
        if(req.decoded.role != config_common.user_roles.TRADE_ADMIN
            && req.decoded.role != config_common.user_roles.TRADE_PURCHASE
            && req.decoded.role != config_common.user_roles.TRADE_SALE){
            return next({dev: '仅限交易方', pro: '000002'});
        }
        var products_remain, products, trafficDemand, category, category_chn, planInfo, order;
        
        async.waterfall([
            function (cb) {
                var flag = true;
                //参数判断 物流需求单，指派内容, 参与者用户id和公司id(来自plan_id) 'user_traffic_id','company_traffic_id', 'company_traffic_name',
                var judge_field = ['demand_id','product_categories', 'plan_id'];
                _.each(judge_field, function (x) {
                    if(!req.body[x]){
                        flag = false;
                        return cb({dev: x, pro: '000003'});
                    }
                });
                req.body.product_categories = _.isString(req.body.product_categories) ? JSON.parse(req.body.product_categories) : req.body.product_categories;
                if(req.body.product_categories.length == 0){
                    return cb({dev: '没有指派货物', pro: '000002'})
                }
                if(flag){
                    cb();
                }
            }, function (cb) {
                trafficPlanSV.getOne({
                    find: {_id: req.body.plan_id, demand_id: req.body.demand_id}
                }, function (err, plan) {
                    if(err || !plan){
                        return cb({dev: '接单计划没找到', pro: '000004'});
                    }
                    planInfo = plan;
                    //有接单有价，则以接单价为主 ? 物流订单中的物流价格存在多个，若使用参与价，则会单一;
                    // if(planInfo.price>0){
                        _.each(req.body.product_categories,function (a) {
                            a.pass_price = planInfo.price;
                        });
                    // }
                    req.body.user_traffic_id = plan.user_id;
                    req.body.user_traffic_name = plan.user_name;
                    req.body.company_traffic_id = plan.company_id;
                    req.body.company_traffic_name = plan.company_name;
                    plan.status=config_common.demand_status.complete;
                    plan.sorting=config_common.demand_status_sort[plan.status];
                    plan.save(function () {
                        cb();
                    });
                });
            }, function (cb) {
                //需求单未过期，且有剩余的吨数
                trafficDemandSV.getOne({
                    find: {_id: req.body.demand_id, amount_remain: {$gt: 0}, status: config_common.demand_status.effective}
                }, cb);
            }, function (demand, cb) {
                if(!demand){
                    return cb({dev: '物流需求单没找到', pro: '000004'});
                }
                // if(demand.unoffer_list.indexOf(req.body.company_traffic_id) == -1){
                if(demand.unoffer_list.indexOf(req.body.user_traffic_id) == -1){
                    return cb({dev: '没有被指派', pro: '000004'}); //可以移到查询条件中;
                }
                trafficDemand = demand;
                
                //缺少判断用户所传产品详情 与 需求单产品详情是否相符;
                products = config_common.recompute_products(req.body.product_categories, 'number');    //重新计算吨数
                if(products.length == 0){
                    return cb({dev: '指派的货物为空', pro: '000002'})
                }
                products_remain = config_common.products_remain_construct(products, 'number');        //提取产品目录
                category = (_.uniq(_.pluck(products, 'layer_1'))).join(',');
                category_chn = (_.uniq(_.pluck(products, 'layer_1_chn'))).join(',');
                //判断剩余吨数是否符合
                var loop = products_remain.length;
                _.each(products_remain, function (a) {
                    var flag = true;
                    for(var i=0; i< demand.products_remain.length; i++){
                        if(a['key'] == demand.products_remain[i]['key']){
                            if(a['count'] > demand.products_remain[i]['count']){
                                return cb({dev: '超出剩余量' , pro: '000006'});
                            }
                            flag = false;
                            break;
                        }
                    }
                    if(flag){
                        return cb({dev: '没有可指派的产品', pro: '000006'});
                    }
                    loop--;
                });
                if(loop<=0){
                    cb();
                }
            }, function(cb){
                //形成物流订单;
                var order = {
                    index: config_common.getOrderIndex(),
                    index_trade: trafficDemand.index_trade,
                    demand_user_id: trafficDemand.demand_user_id,
                    demand_user_name: trafficDemand.demand_user_name,
                    demand_company_id: trafficDemand.demand_company_id,
                    demand_company_name: trafficDemand.demand_company_name,
                    supply_user_id: req.body.user_traffic_id,
                    supply_user_name: req.body.user_traffic_name,
                    supply_company_id: req.body.company_traffic_id,
                    supply_company_name: req.body.company_traffic_name,
                    company_sell_id: trafficDemand.company_sell_id,
                    company_buy_id: trafficDemand.company_buy_id,
                    //产品详情
                    material: trafficDemand.material,
                    category: category,
                    category_chn: category_chn,
                    product_categories: products,
                    products_remain: products_remain,
                    products_replenish: trafficDemand.products_replenish,
                    //付款方式
                    payment_choice: trafficDemand.payment_choice,  //现有支付选择(现金，银兑，商兑)
                    payment_method: trafficDemand.payment_method,  //现有支付方法(货到付款，款到付货，分期，信用)
                    count_day_extension: trafficDemand.count_day_extension,     //延期天数
                    ref_day_extension: trafficDemand.ref_day_extension,       //延期计算标准
                    percentage_advance: trafficDemand.percentage_advance,      //预付款百分比
                    percentage_remain: trafficDemand.percentage_remain,      //预付款百分比
                    //细则
                    att_traffic: trafficDemand.att_traffic,
                    weigh_settlement_style: trafficDemand.weigh_settlement_style,		  //重量结算方式
                    // time_settlement_style: trafficDemand.time_settlement_style,		  //时间结算方式
                    //两方物流新增字段
                    // location_arrival: trafficDemand.location_arrival,
                    // location_depart: trafficDemand.location_depart,
                    send_address_id: trafficDemand.send_address_id,
                    send_company_name: trafficDemand.send_company_name,                  //发送方名字
                    send_name: trafficDemand.send_name,                  //发送方名字
                    send_phone: trafficDemand.send_phone,                  //发送方电话
                    send_province: trafficDemand.send_province,               //省
                    send_city: trafficDemand.send_city,               //市
                    send_district: trafficDemand.send_district,               //区
                    send_addr: trafficDemand.send_addr,               //详细
                    send_loc: trafficDemand.send_loc,    //20170531
                    receive_address_id: trafficDemand.receive_address_id,
                    receive_loc: trafficDemand.receive_loc,   //20170531
                    receive_company_name: trafficDemand.receive_company_name,                  //接收方名字
                    receive_name: trafficDemand.receive_name,                  //接收方名字
                    receive_phone: trafficDemand.receive_phone,                  //接收方电话
                    receive_province: trafficDemand.receive_province,               //省
                    receive_city: trafficDemand.receive_city,               //市
                    receive_district: trafficDemand.receive_district,               //区
                    receive_addr: trafficDemand.receive_addr,               //详细
                    //发票信息
                    remit_name: '',               //公司名称
                    remit_bank: '',               //开户银行
                    remit_account: '',           //公司账号
                    invoice_name: trafficDemand.invoice_name,               //发票公司名
                    invoice_addr: trafficDemand.invoice_addr,               //单位地址
                    invoice_number: trafficDemand.invoice_number,               //税号
                    invoice_phone: trafficDemand.invoice_phone,               //公司电话
                    invoice_bank: trafficDemand.invoice_bank,               //开户银行
                    invoice_account: trafficDemand.invoice_account,               //公司账号
                    //时间
                    
                    time_depart: trafficDemand.time_depart,
                    time_creation: new Date(),
                    time_update_step: new Date(),
                    //辅助
                    quality_origin: trafficDemand.quality_origin, //质检方
                    appendix: trafficDemand.appendix,
                    source: planInfo.source, //20171101
                    status: config_common.demand_status.effective,
                    step: 3,
                    offer_id: '',
                    section: trafficDemand.section,  //区间
                    end_section: trafficDemand.end_section,  //区间
                    demand_id: trafficDemand._id,
                    replenish:{
                        products_replenish:	[],
                        replenish_price:	'0',
                        replenish_count:	'0',
                        replenish_amount:	'0'
                    },
                    time_sort: config_common.getYearMonth(new Date()).monthStr,
                    catalogue: config_common.getCatalogue(products, 5, ''),
                    send_nickname: trafficDemand.send_nickname,
                    receive_nickname: trafficDemand.receive_nickname,
                    payment_payer: trafficDemand.payment_payer || 'demand',
                    time_depart_start: trafficDemand.time_depart_start, //提货开始
                    time_depart_end:  trafficDemand.time_depart_end, //提货结束
                    category_penult: trafficDemand.category_penult,
                    category_penult_chn: trafficDemand.category_penult_chn,
                    plan_id: planInfo._id,
                    time_cost: trafficDemand.time_cost
                };
                if(trafficDemand.time_arrival){
                    order.time_arrival = trafficDemand.time_arrival;
                }
                //
                if(trafficDemand.time_depart_start){
                    order.time_depart_start = trafficDemand.time_depart_start;
                }
                if(trafficDemand.time_depart_end){
                    order.time_depart_end = trafficDemand.time_depart_end;
                }
                if(trafficDemand.payment_payee){
                    order.payment_payee = trafficDemand.payment_payee;
                }
                if(trafficDemand.freight_voucher){
                    order.freight_voucher = trafficDemand.freight_voucher;
                }
                
                var convertProduce = config_common.products_catelog(order.product_categories);                
                order.amount = order.amount_remain = convertProduce.amount;
                order.price_total = config_common.converNumberLength(convertProduce.price_total, 2);

                if(order.payment_method == config_common.payment_method.credit &&
                    order.ref_day_extension == config_common.ref_day_extension.order){
                    order.time_day_extension = new Date(Date.now()+(order.count_day_extension || 0)*24*60*60*1000);
                }
                if(order.amount<1){
                    return cb({dev: '产品重量不足'})
                }
                //20180619 产品搜索
                order.find_category=config_common.getFindCategory(order.product_categories);
                trafficOrderSV.onlyAdd(order, cb);
            },
            function(order, count, cb){
                //修改线路
                if(trafficDemand.line_id){
                    trafficLineSV.updateList({find: {_id: trafficDemand.line_id}, set:{
                        $inc: {order_count: 1}
                    }}, function () {})
                }
                //修改需求单
                trafficDemand.amount_remain = config_common.rscDecimal('sub', trafficDemand.amount_remain, order.amount);//计算产品剩余
                //总数不变，剩余数随时调整;
                trafficDemand.products_remain = config_common.subProduceRemain(trafficDemand.products_remain, order.products_remain); //变更产品目录
                trafficDemand.product_categories = config_common.produceRemainToProduce(trafficDemand.product_categories, order.products_remain);//变更产品详情
                // return cb(trafficDemand)
                trafficDemand.markModified('product_categories');
                trafficDemand.markModified('products_remain');
                trafficDemand.order_count++;
                trafficDemand.time_modify = new Date();
                if(Number(trafficDemand.amount_remain)>1 || !!trafficDemand.amount_remain){
                    trafficDemand.status =  config_common.demand_status.effective;
                }else{
                    trafficDemand.status = config_common.demand_status.complete;
                    trafficDemand.sorting = config_common.demand_status_sort[trafficDemand.status];
                    //关闭计划
                    trafficPlanSV.updateList({
                        find: {
                            status: config_common.demand_status.effective,
                            demand_id: trafficDemand._id.toString()
                        },
                        set: {status: config_common.demand_status.ineffective, time_modify: new Date()}
                    }, function(x, y){
                    });
                }
                trafficDemand.save(function(err){
                    if(err){
                        //删除刚生成的订单;
                        trafficOrderSV.delete({_id: order._id.toString()}, function () {
                            return cb(err);
                        });
                    }
                    cb(null, order);
                });

            }, function (order, cb) {
                order = order.toObject();
                extServer.storeServerOrderTrafficAdd({
                    order_id: order._id.toString(),
                    send_address_id: order.send_address_id,
                    receive_address_id: order.receive_address_id,
                    index_trade: order.index_trade,
                    amount: order.amount,
                    user_id: order.supply_user_id,
                    company_id: order.supply_company_id
                });
                extServer.userFind({user_id: order.supply_user_id}, function (err, userInfo) {
                    if(userInfo){
                        order['user_traffic_info'] = userInfo;
                    }
                    cb(null, order);
                })
            }
        ], function (err, result) {
            if(err){
                return next(err);
            }
            async.waterfall([
                function (cb1) {
                //     http.getShortUrl(req, result['demand_user_id'], 'trade', cb1);
                // }, function (url, cb1) {
                    var msgObj = {
                        title: '物流下单',
                        //尊敬的xx总，恭喜您，xx集团给您指派太原—长治3200吨螺纹钢运输，请立即登录接单
                        content: config_msg_template.encodeContent('traffic_order',
                            [result['user_traffic_info']['user_name'],
                                result['demand_company_name'] ? result['demand_company_name'] : '',
                                result['send_city'],
                                result['receive_city'],
                                result['amount'],
                                result['product_categories'][0]['pass_unit'],
                                result['category_chn'],
                                'url'
                            ]
                            // [trafficDemand.send_city, trafficDemand.receive_city, category_chn ]
                        ),
                        user_ids: [req.body.user_traffic_id]
                    };
                    var routerUrl = {params: {order_id: result._id}, url: config_common.push_url.traffic_order};
                    extServer.push(req, msgObj, {}, '', routerUrl, cb1);
                }
            ], function () {});
            //消息推送;

            //
            config_common.sendData(req, result, next);
        });


    });

    /**
     * 发短信
     */
    api.post('/send_sms', function (req, res, next) {
        if (!req.body.phone_list ||
            !req.body.id) {
            return next({dev: '参数有误', pro: '000003'})
        }
        async.waterfall([
            function (cb) {
                trafficDemandSV.getOne({
                    find: {_id: req.body.id}
                }, cb);
            },
            function (result, cb) {
                if (!result) return cb({dev: '物流需求单没找到', pro: '000004'});
                var sms = [req.decoded.company_name || '', req.decoded['user_name'],result.amount,
                    _.compact(_.first(_.uniq(_.pluck(_.flatten(_.pluck(result, 'product_categories')), 'layer_1_chn')), 2)).join('、'), 'driver.e-wto.com'];
                lib_msg.send_sms(sms, 'traffic_assigned_company', req.body.phone_list || [], cb);
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, result, next);
        });
    });
    return api;
};

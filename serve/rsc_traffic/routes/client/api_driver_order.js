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
var config_server = require('../../configs/config_server');
var config_api_url = require('../../configs/config_api_url');
var config_msg_template = require('../../configs/config_msg_template');
var config_common = require('../../configs/config_common');
//内部数据操作引用
var driverOrderSV = require('../../lib/lib_traffic_driver_order');
var driverOfferSV = require('../../lib/lib_traffic_driver_offer');
var lib_msg = require('../../lib/lib_msg');

var driverDemandSV = require('../../lib/lib_traffic_driver_demand');
var trafficOrderSV = require('../../lib/lib_traffic_order');
var extServer = require('../../lib/lib_ext_server');
var tipSV = require('../../lib/lib_tip');
var redCardOrderSV=require('../../lib/lib_red_card_order');

module.exports = function () {
    var api = express.Router();

    //token 解析判断
    api.use(require('../../middlewares/mid_verify_user')());

    /**
     *  获取认证公司发布的司机订单
     */
    api.post('/get_list', function (req, res, next) {
        //角色判断
        if (req.decoded.role != config_common.user_roles.TRAFFIC_DRIVER_PRIVATE
            && req.decoded.role != config_common.user_roles.TRAFFIC_DRIVER_PRIVATE
            && config_common.accessRule.pass.indexOf(req.decoded.role)==-1) {
            return next({dev: '仅限物流和司机', pro: '000002'}); //'not_allow'
        }
        //参数判断
        if (!req.body.status || !config_common.demand_status[req.body.status]) {
            return next({dev: 'status参数有误', pro: '000003'}); //'invalid_format'
        }
        //场景判断
        var cond = {}, tipCond = {};
        req.body.page = parseInt(req.body.page) || 1;
        req.body.is_refresh = true; //['true', true, 1, '1'].indexOf(req.body.is_refresh) != -1; //若存在下列刷新，则修改个人查阅时间;

        if (req.decoded.role == config_common.user_roles.TRAFFIC_DRIVER_PRIVATE) {
            cond.supply_user_id = req.decoded.id;
            cond.status = req.body.status || config_common.demand_status.effective;
            tipCond = {
                user_id: req.decoded.id
            };
            if (req.body.search_company) {
                cond.demand_company_id = req.body.search_company;
            }
        }
        if (config_common.accessRule.pass.indexOf(req.decoded.role)>-1) {
            cond.demand_user_id = req.decoded.id;
            cond.status = req.body.status || config_common.demand_status.effective;
            tipCond = {
                user_id: req.decoded.id,
                company_id: req.decoded.company_id[0],
                other_company_id: req.decoded.company_id[0]
            };
            if (req.body.search_company) {
                cond.supply_user_id = req.body.search_company;
            }
        }
        //增加提交货单据查询
        if (req.body.step === 'send') {
            // cond['$or'] = [
            //     {step: 1, send_address_id: {$nin: ['']}},
            //     {$and: [{step: {$gt: 1}}, {step: {$lt: 2.5}}]}
            // ];
            cond.step = {$lt: 2.5};
        }
        if (req.body.step === 'receive') {
            // cond['$or'] = [
            //     {step:1, send_address_id: '', receive_address_id: {$nin: ['']}},
            //     {step:1, send_address_id: '', receive_address_id: ''},
            //     {$and: [{step: {$gte: 2.5}}, {step: {$lt: 5}}]}
            // ];
            cond.step = {$gte: 2.5, $lt: 5};
        }

        //执行操作
        var orderTmp = {};
        async.waterfall([
            function (cb) {
                extServer.tipDriverOrder(tipCond, req.body.is_refresh, cond.status, req.decoded.role, cb)
            }, function (tipTime, cb) {
                if (tipTime) {
                    cond.time_update_step = {$lt: tipTime.update_time};
                    orderTmp['new_count'] = tipTime.count;
                }
                driverOrderSV.getList({
                    find: cond,
                    sort: {time_creation: -1},
                    skip: (req.body.page - 1) * config_common.entry_per_page,
                    limit: config_common.entry_per_page,
                    // select: 'order_id',
                    page: req.body.page
                }, cb)
            }, function (orderRes, cb) {
                orderTmp['count'] = orderRes.count;
                orderTmp['exist'] = orderRes.exist;
                orderTmp['orders'] = [];
                async.eachSeries(orderRes.orders, function (order, cb1) {
                    //如果是管理员，查司机；如果是司机则查管理员
                    driverOrderSV.getOrderUserComp(req, order, function (err, orderOne) {
                        if (err) return cb1(err);
                        orderTmp['orders'].push(orderOne);
                        cb1();
                    })
                }, cb);

            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, orderTmp, next);
        });
    });
    /**
     * 获取单个记录 20170421
     * param
     */
    api.post('/get_one', function (req, res, next) {
        //角色判断 物管，交管，采购
        //场景判断
        //条件判断

        var cond = {}, store_arr = [];

        //执行操作
        async.waterfall([
            function (cb) {
                if (config_common.accessRule.pass.indexOf(req.decoded.role)>-1 ||
                    req.decoded.role === config_common.user_roles.TRAFFIC_DRIVER_PRIVATE ||
                    req.decoded.role === config_common.user_roles.TRAFFIC_DRIVER_PUBLISH
                ) {
                    if (!req.body.order_id) {
                        return cb({dev: 'order_id参数有误', pro: '000003'}); //'invalid_format'
                    }
                    if (req.body.order_id) {
                        cond._id = req.body.order_id;
                    }
                    cb();
                } else if (req.decoded.role === config_common.user_roles.TRADE_STORAGE) {
                    if (req.body.order_id) {
                        cond._id = req.body.order_id;
                        cb();
                    } else {
                        if (!req.body.code) {
                            return cb({dev: 'code参数有误', pro: '000003'});
                        }
                        //获取仓库id
                        extServer.generalFun(req, {
                            source: 'user',
                            db: 'Address',
                            method: 'getList',
                            query: {find: {user_ids: {$in: [req.decoded.id]}, type: {$exists: true}}}
                        }, function (err, address) {
                            if (err) {
                                return cb({dev: err, pro: '000005'});
                            }
                            store_arr = _.pluck(address, '_id');

                            cond = {
                                lading_code: req.body.code,
                                status: config_common.demand_status.effective,
                                $or: [
                                    {send_address_id: {$in: store_arr}},
                                    {receive_address_id: {$in: store_arr}}
                                ]
                            };
                            cb();
                        });
                    }
                } else {
                    return cb({dev: '仅限物管，仓管和司机', pro: '000002'}); //'not_allow'
                }
            },
            function (cb) {
                driverOrderSV.getOne({
                    find: cond
                }, cb);
            },
            function (demandRes, cb) {
                if (!demandRes) {
                    return cb({dev: '司机订单没找到', pro: '000004'});
                }
                // 存放用户名称和公司名称及公司状态 ;
                driverOrderSV.getOrderUserComp(req, demandRes, cb);
            },
            function (driverOrder, cb) {
                if (req.decoded.role === config_common.user_roles.TRADE_STORAGE) {
                    extServer.generalFun(req, {
                        source: 'user',
                        db: 'Address',
                        method: 'getList',
                        query: {find: {user_ids: req.decoded.id}, select: '_id'}
                    }, function (err, stores) {
                        if (err) {
                            return cb(err);
                        }
                        var store_ids = _.pluck(stores, '_id');
                        //driverOrder.step<2.5 && store_ids.indexOf(driverOrder.send_address_id) >= 0 ? true: false;//
                        driverOrder.pick_up =  store_ids.indexOf(driverOrder.send_address_id) >= 0;
                        cb(null, driverOrder);
                    });
                } else {
                    cb(null, driverOrder);
                }
            },
            // function (driverOrder, cb) {
            //     if(driverOrder.step === 1){
            //         if(!!driverOrder.send_address_id){
            //             //提货地址是仓库
            //             driverOrder.display_status = 'supply_loading';      //申请提货
            //         }else if(!!driverOrder.receive_address_id){
            //             //交货地址是仓库
            //             driverOrder.display_status = 'supply_unloading';    //申请交货
            //         }else{
            //             driverOrder.display_status = 'finish';//运完了
            //         }
            //     }else if(driverOrder.step === 2.5){
            //         if(!!driverOrder.receive_address_id){
            //             //交货地址是仓库
            //             driverOrder.display_status = 'supply_unloading';    //申请交货
            //         }else{
            //             driverOrder.display_status = 'finish';//运完了
            //         }
            //     }
            //     cb(null, driverOrder);
            // }
        ], function (err, result) {
            if (err) return next(err);
            result.system_time = (new Date()).getTime()
            config_common.sendData(req, result, next);
        });
    });

    //仓管获取物流订单的司机订单
    api.post('/storage_get_list', function (req, res, next) {
        //场景判断
        var driverOrderList = [];
        //执行操作
        async.waterfall([
            function (cb) {
                //角色判断
                if (req.decoded.role !== config_common.user_roles.TRADE_STORAGE) {
                    return cb({dev: '仅限仓管', pro: '000002'});
                }
                //参数判断
                if (!req.body.order_id) {
                    return cb({dev: 'order_id参数有误', pro: '000003'});
                }
                cb();
            },
            function (cb) {
                //通过交易订单查询物流订单
                driverOrderSV.onlyList({
                    find: {order_id: req.body.order_id},
                    select: 'supply_user_id step amount_send_sub amount_receive_sub'
                }, cb);
            },
            function (driverList, cb) {
                async.eachSeries(driverList, function (driver, callback) {
                    var driverOrderOne = driver.toObject();
                    //查询司机和车辆信息
                    driverDemandSV.getUserTruck(req, {user_id: driver.supply_user_id}, function (err, user) {
                        if (err) {
                            return cb(err);
                        }
                        driverOrderOne = _.extend(driverOrderOne, user);
                        driverOrderList.push(driverOrderOne);
                        callback();
                    });
                }, cb);
            }
        ], function (err) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, driverOrderList, next);
        });
    });

    //获取数量
    api.post('/get_count', function (req, res, next) {

        async.waterfall([
            function (cb) {
                driverOrderSV.specialCount(req, cb);
            }
        ], function (err, result) {
            if (err) return next(err);
            config_common.sendData(req, result, next);
        });
        
    });
    /**
     *  关闭司机订单，触发回退机制; 修改司机需求单，物流订单 ;
     */
    api.post('/close', function (req, res, next) {
        //角色判断
        if (config_common.accessRule.pass.indexOf(req.decoded.role)==-1 && req.decoded.role != config_common.user_roles.TRAFFIC_DRIVER_PRIVATE) {
            return next({dev: '仅限物流和司机', pro: '000002'}); //'not_allow'
        }
        //参数判断
        if (!req.body.order_id) {
            return next({dev: 'order_id参数有误', pro: '000003'});
        }
        //场景判断
        //执行操作
        var order = {}, demand = {}, offer = {};
        async.waterfall([
            function (cb) {
                driverOrderSV.getById({
                    find: req.body.order_id
                }, cb);
            }, function (orderRes, cb) {
                if (!orderRes) {
                    return cb({dev: '司机订单没找到', pro: '000004'}); //'order_not_found'
                }
                //与该订单无关的人不能操作
                if (req.decoded.id != orderRes.user_demand_id && req.decoded.id != orderRes.user_supply_id) {
                    return cb({dev: '私人单据,无权查看', pro: '000002'}); //'not_allow'
                }
                order = orderRes;
                order.status = config_common.demand_status.cancelled;
                driverDemandSV.getById({
                    find: order.demand_id,
                    status: config_common.demand_status.effective
                }, cb);
            }, function (demandRes, cb) {
                if (!demand) {
                    return cb({dev: '司机需求单没找到', pro: '000004'}); //'demand_not_found'
                }
                //若取消订单，则需求单中订单计数-1; order_count;
                demand = demandRes;
                demand.order_count--;
                demand.amount_remain = config_common.rscDecimal('add', demand.amount_remain, order.amount);
                demand.products_remain = driverOfferSV.addProduce(demand.products_remain, order.products_remain, cb);
                //产品products_category
                demand.markModified('products_remain');
                demand.save(function (err) {
                    if (err) {
                        return cb({dev: '司机需求单修改失败', pro: '000005'}); //'close_failed'
                    }
                    order.save(cb)
                });
            }
        ], function (err) {
            if (err) return next(err);
            config_common.sendData(req, true, next);
        });
    });

    //特殊操作


    /**
     * 司机点击完成 [20170824通过物流订单查询交易订单中的买卖双方id]
     */
    api.post('/order_complete', function (req, res, next) {
        //角色判断
        // if (req.decoded.role != config_common.user_roles.TRAFFIC_DRIVER_PRIVATE) {
        //     return next({dev: '仅限司机', pro: '000002'});
        // }
        //参数判断
        if (!req.body.order_id) {
            return next({dev: 'order_id参数有误', pro: '000003'});
        }
        var cond = {
            // step: {$gte: 3.5}
        };
        cond._id = req.body.order_id;
        // cond.supply_user_id = req.decoded.id;
        cond.status = config_common.demand_status.effective;
        //场景判断
        //执行操作
        var driverOrder, driverUser, driverDemand, trafficOrder, isconsume = false;
        async.waterfall([
            function (cb) {
                //获取司机订单
                driverOrderSV.getOne({
                    find: cond
                }, cb);
            },
            function (order, cb) {
                //修过订单步骤和状态
                if (!order) {
                    return cb({dev: '司机订单没找到', pro: '000004'}); //'order_not_fount'
                }
                driverOrder = order;
                driverOrder.time_update_step = new Date();
                driverOrder.step = 5;
                driverOrder.status = config_common.demand_status.complete;
                driverOrder.save(cb);
            }
        ], function (err) {
            if (err) return next(err);
            async.waterfall([
                function (cb) {
                    //推送，统计
                    async.waterfall([
                        function (cb1) {
                            //向统计服务器发送完成时间 ；[物流管理员]
                            extServer.statisticalSV({
                                data: {
                                    order_id: driverOrder._id.toString()
                                    , type: 'driverOrder'
                                    , user_id: driverOrder.supply_user_id
                                    , company_demand_id: driverOrder.demand_company_id
                                    , time_final_payment: driverOrder.time_update_step
                                }
                            }, 'order');
                            //向统计服务器发送吨数和钱数 [司机]
                            extServer.statisticalSV({
                                userObj: [{
                                    type: config_common.statistical.driver_assign_order,
                                    id: req.decoded.id,
                                    amount: driverOrder.amount,
                                    price: driverOrder.price
                                }]
                            }, 'driver');
                            //向统计服务器发送吨数和钱数 [物流管理公司]
                            extServer.statisticalSV({
                                companyObj: [{
                                    type: config_common.statistical.driver_assign_order,
                                    id: driverOrder.demand_company_id,
                                    amount: driverOrder.amount,
                                    price: driverOrder.price
                                }]
                            }, 'trade');
                            //获取司机车牌号;
                            driverDemandSV.getUserTruck(req, {user_id: driverOrder.supply_user_id}, cb1); //{user_id: req.decoded.id}
                        },
                        function (user, cb1) {
                            if (user) {
                                driverUser = user;
                            }
                            if (!!driverOrder.order_id) {
                                trafficOrderSV.getOne({find: {_id: driverOrder.order_id}}, cb1);
                            } else {
                                cb(null, null);
                            }
                        },
                        function (order, cb1) {
                            if (order) {
                                trafficOrder = order;
                            }
                            //司机订单完成的推送
                            async.waterfall([
                                function (push) {
                                    var msgObj = {
                                        title: '司机订单完成',
                                        content: config_msg_template.encodeContent('driver_order_complete', [
                                            driverOrder['send_city'],
                                            driverOrder['receive_city'],
                                            driverOrder['amount'],
                                            driverOrder['product_categories'][0]['pass_unit'],
                                            driverOrder['category_chn'],
                                            'url'
                                        ]),
                                        user_ids: [driverOrder.demand_user_id]
                                    };
                                    extServer.push(req, msgObj, {}, '', {
                                        params: {id: driverOrder._id.toString()}, //type: config_common.push_url.driver_order_detail},
                                        url: config_common.push_url.driver_order
                                    }, function () {
                                        push()
                                    });
                                }, function (push) {
                                    var msgObj = {
                                        title: '司机订单完成',
                                        content: config_msg_template.encodeContent('driver_order_complete', [
                                            driverOrder['send_city'],
                                            driverOrder['receive_city'],
                                            driverOrder['amount'],
                                            driverOrder['product_categories'][0]['pass_unit'],
                                            driverOrder['category_chn'],
                                            'url'
                                        ]),
                                        user_ids: [driverOrder.supply_user_id]
                                    };
                                    extServer.push(req, msgObj, {}, '', {
                                        params: {id: driverOrder._id.toString(), type: config_common.push_url.driver_order_detail},
                                        url: config_common.push_url.driver_order_detail
                                    }, push);
                                }
                            ], function () {
                                cb1();
                            });
                        }
                    ], cb);
                },
                function (cb) {
                    //① 查询司机需求单下的司机订单，若全部完成，则需求单完成; ②查询物流订单下的司机订单, 若全部完成，则物流订单完成;
                    async.waterfall([
                        function (cb1) {
                            //获取相同司机需求单的订单数
                            driverOrderSV.getCount({
                                demand_id: driverOrder.demand_id,
                                status: {$in: [config_common.demand_status.effective]}
                            }, cb1);
                        },
                        function (count, cb1) {
                            //修改司机需求单
                            driverDemandSV.getOne({find: {_id: driverOrder.demand_id}}, function (err, demand) {
                                if (err) return cb1(null, null, null);//cb({dev: '关联司机需求单没找到', pro: '000004'}); //'demand_not_fount'
                                demand.time_modify = new Date();
                                //20170831.删除已完成司机需要移除 20180113 孙文轩[bug,3460]要求保留
                                if (demand.unoffer_list.indexOf(driverOrder.supply_user_id) != -1) {
                                    demand.unoffer_list.splice(demand.unoffer_list.indexOf(driverOrder.supply_user_id), 1);
                                    demand.order_complete.push(_.extend({},driverUser, {order_id: driverOrder._id, source: driverOrder.source, status: driverOrder.status} ));
                                }
                                // 如果没有同源司机订单且司机需求单剩余小于1, 则关闭司机需求单;
                                if (count == 0 && demand.amount_remain < 1) {
                                    demand.status = config_common.demand_status.complete;
                                    demand.sorting = config_common.demand_status_sort[demand.status];
                                }
                                demand.save(cb1);
                            });
                        },
                        function (demand, count, cb1) {
                            // 查询 相同物流订单的司机需求单数量
                            driverDemandSV.getCount({
                                order_id: driverOrder.order_id,
                                status: {$in: [config_common.demand_status.effective]}
                            }, cb1);
                        }, function (count, cb1) {
                            if (!!trafficOrder) {
                                // 修改物流订单; ①一个物流订单对应多个司机需求，一个司机需求，对应多个司机订单;②没有司机需求，且物流订单没有剩余吨数则可完成;
                                trafficOrder['replenish']['amount_send_sub'] = !!trafficOrder['replenish']['amount_send_sub'] ? config_common.rscDecimal('add', trafficOrder['replenish']['amount_send_sub'], driverOrder.amount_send_sub) : driverOrder.amount_send_sub;
                                trafficOrder['replenish']['amount_receive_sub'] = !!trafficOrder.replenish['amount_receive_sub'] ? config_common.rscDecimal('add', trafficOrder.replenish['amount_receive_sub'], driverOrder.amount_receive_sub) : driverOrder.amount_receive_sub;
                                //20171109　废弃　price_send_sub, price_receive_sub　
                                trafficOrder['replenish']['price_send_sub'] = config_common.rscDecimal('mul', trafficOrder['replenish']['amount_send_sub'], trafficOrder['product_categories'][0]['pass_price'], 2);
                                trafficOrder['replenish']['price_receive_sub'] = config_common.rscDecimal('mul', trafficOrder.replenish['amount_receive_sub'], trafficOrder['product_categories'][0]['pass_price'], 2);
                                if (count == 0 && trafficOrder.amount_remain < 1) {
                                    trafficOrder.step = 5;
                                    trafficOrder.status = config_common.demand_status.complete;
                                    if (isconsume) {
                                        trafficOrder['replenish']['price_actual'] = driverOrder.consumePrice(trafficOrder['replenish']['amount_send_sub'], trafficOrder['replenish']['amount_receive_sub'], trafficOrder['replenish']['price_actual'], trafficOrder['weigh_settlement_style']['two'][0], trafficOrder['weigh_settlement_style']['two'][1])
                                    }
                                    //动态
                                    extServer.addDynamicServer({
                                        company_id: trafficOrder.demand_company_id,
                                        user_id: trafficOrder.demand_user_id,
                                        type: config_common.typeCode.traffic_order_confirm,
                                        data: JSON.stringify(trafficOrder)
                                    }, function () {
                                    });
                                    extServer.addDynamicServer({
                                        company_id: trafficOrder.supply_company_id,
                                        user_id: trafficOrder.supply_user_id,
                                        type: config_common.typeCode.traffic_order_confirm,
                                        data: JSON.stringify(trafficOrder)
                                    }, function () {
                                    });
                                    extServer.storeServerOrderTrafficComplete({
                                        order_id: trafficOrder._id.toString(),
                                        product_categories: trafficOrder.product_categories,
                                        company_id: trafficOrder.supply_company_id
                                    }, function () {
                                    });
                                    // 向统计服务器发送吨数和钱数
                                    extServer.statisticalSV({
                                        companyObj: [{
                                            type: config_common.statistical.company_assign_order,
                                            id: trafficOrder.supply_company_id,
                                            amount: trafficOrder.amount,
                                            price: trafficOrder.price
                                        }]
                                    }, 'traffic');
                                    extServer.statisticalSV({
                                        companyObj: [{
                                            type: config_common.statistical.assign_order,
                                            id: trafficOrder.demand_company_id,
                                            amount: trafficOrder.amount,
                                            price: trafficOrder.price
                                        }]
                                    }, 'trade');
                                    //向信用中心发送完成请求
                                    http.sendCreditServer({
                                        order_id: trafficOrder._id,
                                        company_supply_id: trafficOrder.supply_company_id,
                                        company_demand_id: trafficOrder.demand_company_id,
                                        type: 'TRAFFIC',
                                        att_payment: trafficOrder.payment_choice,
                                        order_over_time: trafficOrder.time_update_step
                                    }, '/api/server/order/add', function (err, data) {
                                    });
                                    //物流订单完成的推送
                                    async.waterfall([
                                        function (push) {
                                            //物流订单完成
                                            var msgObj = {
                                                title: '订单完成',
                                                //恭喜您，山东=河北的200吨煤炭运输完成,请及时查看
                                                content: config_msg_template.encodeContent('traffic_order_complete', [
                                                    trafficOrder['send_city'],
                                                    trafficOrder['receive_city'],
                                                    trafficOrder['amount'],
                                                    trafficOrder['product_categories'][0]['pass_unit'],
                                                    trafficOrder['category_chn'],
                                                    'url'
                                                ]),
                                                user_ids: [trafficOrder.demand_user_id]
                                            };
                                            extServer.push(req, msgObj, {}, '', {
                                                params: {id: trafficOrder._id.toString()}, //type: config_common.push_url.driver_order_detail},
                                                url: config_common.push_url.trade_order_detail
                                            }, push);
                                        },
                                        function (push) {
                                            //物流订单完成
                                            var msgObj = {
                                                title: '订单完成',
                                                content: config_msg_template.encodeContent('traffic_order_complete', [
                                                    trafficOrder['send_city'],
                                                    trafficOrder['receive_city'],
                                                    trafficOrder['amount'],
                                                    trafficOrder['product_categories'][0]['pass_unit'],
                                                    trafficOrder['category_chn'],
                                                    'url'
                                                ]),
                                                user_ids: [trafficOrder.supply_user_id]
                                            };
                                            extServer.push(req, msgObj, {}, '', {
                                                params: {id: trafficOrder._id.toString()}, //type: config_common.push_url.driver_order_detail},
                                                url: config_common.push_url.traffic_order
                                            }, push);
                                        }
                                    ], function () {
                                    });
                                }

                                trafficOrder.markModified('replenish');
                                trafficOrder.time_update_step = new Date();
                                trafficOrder.save(function () {
                                    cb1();
                                    //到货结算，路耗结算  若无提货过程 则为提货吨数为0 若无交货过程则交货吨数也为0, 若有提货和交货且采用路耗则新计算路耗
                                    if (!isconsume && !!trafficOrder.index_trade) {
                                        http.sendTradeServerNew(req, {
                                            'index': trafficOrder.index_trade,
                                            // amount_pick_up_weight: trafficOrder.replenish['amount_send_sub'] || 0,
                                            // amount_arrival_weight: trafficOrder.replenish['amount_receive_sub'] || 0
                                            amount_pick_up_weight: driverOrder.send_address_id ? driverOrder.amount_send_sub : 0,
                                            amount_arrival_weight: driverOrder.receive_address_id ? driverOrder.amount_receive_sub : 0
                                        }, config_api_url.trade_order_update, function (err) {
                                            console.log('物流订单结束,提交货吨数回传交易订单', err);
                                        });
                                    }
                                });
                            }
                            cb1();
                        }
                    ], cb);
                }
            ], function () {});
            config_common.sendData(req, true, next);
        });

    });
    /**
     *  物流管理员替换车辆
     *  param user_supply_id:'司机id', order_id:'司机订单id' ，
     *     若司机id 不在需求单的id中怎么办，是追加吗，还是...
     *     20180306 提货司机，订单步骤更为0.5，若付支付信息费，则退费
     *     20180313 提货时间过期，信息费不退回
     */
    api.post('/replace_driver', function (req, res, next) {

        //执行操作
        var order = {}, user = {}, demand = {}, supply_user_id_old='';
        async.waterfall([
            function (cb) {
                //角色判断
                if (config_common.accessRule.pass.indexOf(req.decoded.role)==-1) {
                    return cb({dev: '仅限物流方', pro: '000002'}); //'not_allow'
                }
                //参数判断
                var checkout_fields = [
                    {field: 'user_supply_id', type: 'string'},
                    {field: 'order_id', type: 'string'}
                ];
                config_common.checkField(req, checkout_fields, function (err) {
                    if (err) {
                        return cb({dev: err, pro: '000003'});
                    } else {
                        cb();
                    }
                })
            },
            function (cb) {
                driverOrderSV.getOne({
                    find: {
                        _id: req.body.order_id,
                        // status: config_common.demand_status.effective
                    }
                }, cb);
            }, 
            function (orderRes, cb) {
                if (!orderRes) return cb({dev: '司机订单没找到', pro: '000004'}); //'order_not_fount'
                if(orderRes.supply_user_id == req.body.user_supply_id){
                    return cb({dev: '请指定其余司机'})
                }
                order = orderRes;
                supply_user_id_old=order.supply_user_id;
                driverDemandSV.getUserTruck(req, {user_id: req.body.user_supply_id}, function (err, user) {
                    if (err || !user.truck_id) {
                        return cb({dev: '指定司机的车辆信息没找到', pro: '000004'});
                    } else {
                        cb(null, user);
                    }
                })
            }, 
            function (userRes, cb) {
                user = userRes;
                driverDemandSV.getOne({
                    find: {_id: order.demand_id} //, status: config_common.demand_status.effective
                }, cb);
            }, 
            function (demandRes, cb) {
                if (!demandRes) {
                    return cb({dev: '司机需求单没找到', pro: '000004'}); //'not_replace'
                }
                demand = demandRes;

                // 向邀请列表中 插入 被替换的车辆, 从邀请列表中 删除 待替换的车辆;
                //被替换者若不在verify_driver中，则存入verify_driver
                if (demand.verify_driver.indexOf(order.supply_user_id) == -1) {
                    demand.verify_driver.push(order.supply_user_id);
                }
                //替换者若在verify_driver中，则剔除
                if (demand.verify_driver.indexOf(req.body.user_supply_id) != -1) {
                    demand.verify_driver.splice(demand.verify_driver.indexOf(req.body.user_supply_id), 1);
                }
                // 向已接单列表中 删除 被替换的车辆, 从已接单列表中 增加 待替换的车辆;
                if (demand.unoffer_list.indexOf(order.supply_user_id) != -1) {
                    demand.unoffer_list.splice(demand.unoffer_list.indexOf(order.supply_user_id), 1);
                }
                if (demand.unoffer_list.indexOf(req.body.user_supply_id) == -1) {
                    demand.unoffer_list.push(req.body.user_supply_id);
                }

                demand.save(cb);
            }, 
            function (demandRes, count, cb) {
                if (!demandRes) {
                    return cb({dev: '替换司机失败', pro: '000005'});
                }

                order.supply_user_id = req.body.user_supply_id;
                order.truck_weight = user.truck_weight;
                order.supply_user_name = user.real_name;
                order.truck_num = user.truck_num;
                order.step = 0.5;//order.tip_prices > 0 ? 0.5 : 1; //必须支付
                order.status = config_common.demand_status.effective;
                order.time_tip_price = 0;//(new Date()).getTime() + 30 * 60 *1000; //代接单或替换 付费时间都未0
                var orderNo = order.tip_price_id;
                order.tip_price_id = '';
                order.save(function (err, result) {
                    //若司机已支付信息费，且未到提货期被替换，则费用退回司机
                    if(!!orderNo && (new Date(result.time_depart)).getTime() > (new Date()).getTime() ){
                        http.sendPayServerNew(req, {
                            orderNo : orderNo,
                            // order_id: order._id.toString(),
                            receivablesProducts: 'information_refund', // 'information_income',//'information_expenditure',
                            role: {$in: config_common.accessRule.pass},
                        }, config_api_url.pay_information_refund, function () {});
                        //预计有退费通知
                    }
                    cb(err, result);
                });
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            if(result && 1==1){
                //替换成功后，发短信
                //  给被替换车辆发短信：“X物流已将您的车辆替换，.......，更多货源请关注X物流
                var msgObj = {
                    user_ids: [supply_user_id_old]
                };
                msgObj['title'] = '替换车辆';
                msgObj['content'] =  config_msg_template.encodeContent('replace_truck',
                    [result.demand_company_name, result.demand_company_name]);

                extServer.push(req, msgObj, {}, '', {
                    params: {
                        id: result._id,
                        type: config_common.push_url.driver_order_detail
                    }
                    // , url: config_common.push_url.driver_order_detail
                }, function(){});
                // lib_msg.send_sms(sms, sms_type, phone_list, function(err, result){});

            }
            config_common.sendData(req, result, next);
        });
    });

    /**
     * 依据物流订单号 ，获取司机订单号
     * param status: 进行中  或 已完成
     */
    api.post('/get_demand_order', function (req, res, next) {
        //角色判断
        if (config_common.accessRule.pass.indexOf(req.decoded.role)==-1) {
            return next({dev: '仅限物流方', pro: '000002'});
        }
        //参数判断
        if (!req.body.status || !config_common.demand_status[req.body.status]) {
            return next({dev: 'status参数有误', pro: '000003'});
        }
        var cond = {supply_user_id: req.decoded.id};
        req.body.is_refresh = true; //['true', true, 1, '1'].indexOf(req.body.is_refresh) != -1; //若存在下列刷新，则修改个人查阅时间;
        req.body.page = parseInt(req.body.page) || 1;
        //场景判断
        req.body.status = req.body.status || config_common.demand_status.effective;

        //执行操作
        var demandTmp = {count: 0}, demandList = [];
        async.waterfall([
            function (cb) {
                if (req.body.status == config_common.demand_status.effective || req.body.status == config_common.demand_status.complete) {
                    cond.status = {$in: [config_common.demand_status.effective, config_common.demand_status.complete]}
                } else {
                    cond.status = {$nin: [config_common.demand_status.effective, config_common.demand_status.complete]}
                }
                trafficOrderSV.getList({
                    find: cond,
                    select: 'index send_city send_district receive_city receive_district'
                }, cb);
            },
            function (demandRes, cb) {
                if (!demandRes) {
                    return cb({dev: '物流订单没找到', pro: '000004'});
                }
                async.eachSeries(demandRes.orders, function (demandOne, cb1) {
                    demandOne = demandOne.toObject();
                    var orderTmp = [];
                    async.waterfall([
                        function (cb10) {
                            extServer.tipDriverOrder({
                                user_id: req.decoded.id,
                                company_id: req.decoded.company_id[0],
                                other_company_id: req.decoded.company_id[0]
                            }, req.body.is_refresh, cond.status, req.decoded.role, cb10)
                        },
                        function (tipTime, cb10) {
                            var orderCond = {
                                order_id: demandOne._id.toString(),
                                status: req.body.status//{$in: [config_common.demand_status.effective, config_common.demand_status.complete]}
                            };
                            if (tipTime) {
                                orderCond.time_update_step = {$lte: tipTime.update_time};
                                demandTmp['new_count'] = demandTmp['new_count'] || 0 + tipTime.count;
                            }
                            //    获取司机订单
                            driverOrderSV.getList({
                                find: orderCond,
                                select: 'amount price price_total index supply_user_id payment_method',
                                skip: (req.body.page - 1) * config_common.entry_per_page,
                                limit: config_common.entry_per_page,
                                sort: {time_creation: -1},
                                page: req.body.page
                            }, cb10);
                        },
                        function (orderRes, cb10) {
                            if (orderRes.orders.length === 0) {
                                cb1(); // return cb1();  退出本循环，不用return
                            }
                            demandTmp['count'] += orderRes.count;
                            // demandTmp['exist'] = orderRes.exist;
                            // 获取司机姓名
                            async.eachSeries(orderRes.orders, function (order, cb100) {
                                var orderOne = order.toObject();
                                driverDemandSV.getUserTruck(req, {user_id: orderOne.supply_user_id}, function (err, user) {
                                    if (user) {
                                        orderOne = _.extend(orderOne, {
                                            send_city: demandOne.send_city,
                                            send_district: demandOne.send_district,
                                            receive_city: demandOne.receive_city,
                                            receive_district: demandOne.receive_district,
                                            user_logo: user.user_logo,
                                            real_name: user.real_name,
                                            exist: orderRes.exist
                                        });
                                        orderTmp.push(orderOne);
                                    }
                                    cb100();
                                })
                            }, function (err) {
                                if (err) return cb10(err);
                                demandOne['order_list'] = orderTmp;
                                demandList.push(demandOne);
                                cb10();
                            });
                        }
                    ], cb1);
                }, cb);
            }
        ], function (err) {
            if (err) return next(err);
            demandTmp['demand'] = demandList;
            config_common.sendData(req, demandTmp, next);
        });

    });

    /**
     *  依据司机订单，对司机进行补货
     */
    api.post('/driver_replenish', function (req, res, next) {
        //角色判断; 交易公司可以补货
        if (req.decoded.role != config_common.user_roles.TRADE_ADMIN &&
            req.decoded.role != config_common.user_roles.TRADE_PURCHASE &&
            req.decoded.role != config_common.user_roles.TRADE_SALE &&
            config_common.accessRule.pass.indexOf(req.decoded.role)==-1) {
            return next({dev: '仅限交易方', pro: '000002'});
        }
        //参数判断;
        //场景判断

        //执行操作; 司机补货后，影响物流订单和交易订单;
        var driverOrder, trafficOrder, tradeOrder;
        async.waterfall([
            function (cb) {
                var flag = true;
                var judgeParam = ['order_id', 'products_replenish'];
                var judage_replenish = ['count', 'amount'];
                _.each(judgeParam, function (x) {
                    if (!req.body[x]) {
                        flag = false;
                        return cb({dev: x + '_invalid_format'});
                    }
                });
                _.each(req.body.products_replenish, function (x) {
                    if (!x['layer'] || !x['pass_price']) {
                        flag = false;
                        return cb({dev: 'products_remain_construct'});
                    }
                    _.each(x.product_name, function (y) {
                        _.each(judage_replenish, function (a) {
                            y[a] = Number(y[a]);
                            if (!y[a] || !_.isNumber(y[a])) {
                                flag = false;
                                return cb({dev: 'products_remain_' + a + '_construct'});
                            }
                        })

                    })
                });
                if (flag) {
                    cb();
                }
            },
            function (cb) {
                //车辆为出库之前都可以补货;
                driverOrderSV.getOne({
                    find: {_id: req.body.order_id, status: config_common.demand_status.effective, step: {$lt: 2.5}}
                }, cb);
            }, function (driverRes, cb) {
                if (!driverRes) {
                    return cb({dev: '司机订单没找到或不允许操作', pro: '000004'}); //'driverOrder_not_found'
                }
                driverOrder = driverRes;
                //增加提交货剩余字段
                req.body.products_replenish = config_common.addStoreFields(req.body.products_replenish);
                driverOrder['replenish']['products_replenish'].push(req.body.products_replenish[0]);
                driverOrder.markModified('replenish');
                driverOrder.time_update_step = new Date();
                if(!driverOrder.send_address_id && !driverOrder.receive_address_id){
                    //没有仓库地址时补货计算
                    driverOrderSV.replenishCalculate(driverOrder._id, req.body.products_replenish, '', function () {})
                }
                driverOrder.save(cb);
            }
        ], function (err) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, true, next);
        });
    });

    /**
     * 发短信
     */
    api.post('/send_sms', function (req, res, next) {
        if (!req.body.phone_list || !req.body.id) {
            return next({dev: 'phone_list,id参数有误', pro: '000003'}); //'invalid_format'
        }
        async.waterfall([
            function (cb) {
                driverDemandSV.getOne({
                    find: {_id: req.body.id}
                }, cb);
            },
            function (result, cb) {
                if (!result) return cb({dev: '司机需求单没找到', pro: '000004'});
                var sms = [req.decoded.company_name || '', req.decoded['user_name'], result.send_city, result.receive_city, result.amount
                    , _.compact(_.first(_.uniq(_.pluck(_.flatten(_.pluck(result, 'product_categories')), 'layer_1_chn')), 2)).join('、'), 'driver.e-wto.com'];
                lib_msg.send_sms(sms, 'driver_add_offer', req.body.phone_list || [], cb);
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, result, next);
        });
    });
    /**
     * 统计当前用户的累计合作企业及订单数
     */
    api.post('/get_company_count', function (req, res, next) {
        var match = {}, group = {}, otherRole, cond = {}, orderArr, statis_company = [];
        async.waterfall([
            function (cb) {
                //存在没有买卖双方公司信息
                if (req.decoded.role == config_common.user_roles.TRAFFIC_DRIVER_PUBLISH ||
                    req.decoded.role == config_common.user_roles.TRAFFIC_DRIVER_PRIVATE) {
                    //司机方，查看物流公司信息 
                    match = {supply_user_id: req.decoded.id, demand_company_id: {$nin: ['', null]}};
                    otherRole = 'driver';
                    group = {_id: '$demand_company_id', sum: {$sum: 1}};
                } else {
                    //物流方，查看司机信息
                    otherRole = 'traffic';
                    match = {demand_user_id: req.decoded.id, supply_user_id: {$nin: ['', null]}};
                    group = {_id: '$supply_user_id', sum: {$sum: 1}};
                }
                cb();
            }, function (cb) {
                driverOrderSV.getAggregate({
                    match: match,
                    group: group
                }, cb);
            }, function (statisOrder, cb) {
                if (!statisOrder) {
                    cb();
                }
                orderArr = statisOrder;
                //查询公司名称
                async.eachSeries(orderArr, function (order, cb1) {
                    if (otherRole == 'driver') {
                        cond.demand_company_id = order._id;
                    } else {
                        cond.supply_user_id = order._id;
                    }

                    driverOrderSV.getOne({find: cond}, function (err, driver) {
                        if (err) {
                            cb1();
                        }
                        order.name = otherRole == 'driver' ? driver.demand_company_name : driver.supply_user_name;
                        statis_company.push(order);
                        cb1();
                    });
                }, cb);
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, statis_company, next);
        });
    });
    /**
     * 获取当前公司订单总额
     * 20170906 废弃
     */
    api.post('/get_order_money', function (req, res, next) {
        var match = {}, group = {}, orderArr, cond = {}, statis_company = [];
        async.waterfall([
            function (cb) {
                if (config_common.accessRule.pass.indexOf(req.decoded.role)>-1) {
                    req.body.position = 'demand';
                }
                if (req.body.position == config_common.quality_origin.demand) {
                    match.demand_user_id = req.decoded.id;
                    group = {_id: '$demand_user_id', sum: {$sum: '$price_total'}};
                } else {
                    match.supply_user_id = req.decoded.id;
                    group = {_id: '$supply_user_id', sum: {$sum: '$price_total'}};//'$price_total'
                }
                driverOrderSV.getAggregate({
                    match: match,
                    group: group
                }, cb)
            }, function (statisOrder, cb) {
                orderArr = statisOrder;
                //查询公司名称
                async.eachSeries(orderArr, function (order, cb1) {
                    if (req.body.position == config_common.quality_origin.demand) {
                        cond.demand_user_id = order._id;
                    } else {
                        cond.supply_user_id = order._id;
                    }
                    driverOrderSV.getOne({find: cond}, function (err, driver) {
                        if (err) {
                            cb1();
                        }
                        order.name = req.body.position == config_common.quality_origin.demand ? driver.demand_user_name : driver.supply_user_name;
                        statis_company.push(order);
                        cb1();
                    });
                }, cb);
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, statis_company, next);
        });

    });

    /**
     * 仓管通过提货码查阅订单
     */
    api.post('/store_get_driver_order', function (req, res, next) {
        var store_arr = [];
        async.waterfall([
            function (cb) {
                //角色条件判断
                if (req.decoded.role != config_common.user_roles.TRADE_STORAGE) {
                    return cb({dev: '仅限仓管', pro: '000002'});
                }
                if (!req.body.code) {
                    return cb({dev: 'code参数有误', pro: '000003'});
                }
            },
            function (cb) {
                //获取仓库id
                extServer.generalFun(req, {
                    source: 'user',
                    db: 'Address',
                    method: 'getList',
                    query: {find: {user_ids: {$in: [req.decoded.id]}, type: {$exists: true}}}
                }, function (err, address) {
                    if (err) {
                        return cb({dev: err, pro: '000005'});
                    }
                    store_arr = _.pluck(address, '_id');
                    cb();
                });
            },
            function (cb) {
                driverOrderSV.getList({
                    find: {
                        code: req.body.code,
                        status: config_common.demand_status.effective,
                        $or: [
                            {send_address_id: {$in: store_arr}},
                            {receive_address_id: {$in: store_arr}}
                        ]
                    }
                }, cb)
            },
            function (cb) {

            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, result, next)
        });
    });


    /**
     * 司机申请【提货】
     */
    api.post('/order_supply_loading', function (req, res, next) {
        if (!req.body.driver_order_id) {
            return next({dev: 'driver_order_id参数有误', pro: '000003'});
        }
        if (req.decoded.role !== config_common.user_roles.TRAFFIC_DRIVER_PRIVATE) {
            return next({dev: '挂靠司机才允许', pro: '000002'});
        }
        var user_ids;
        async.waterfall([
            function (cb) {
                //!!req.body.repeat ? {$gt: 3} :
                driverOrderSV.getOne({
                    find: {
                        _id: req.body.driver_order_id,
                        supply_user_id: req.decoded.id,
                        step: {$lt: 2}
                    },
                }, cb);
            },
            function (order, cb) {
                if (!order) {
                    return cb({dev: '司机订单没找到', pro: '000004'});
                }
                if (order.amount_remain < 1) {
                    return cb({dev: '剩余吨数不足'});
                }                
                order.step = order.send_address_id && order.order_id ? 2 : 2.5; //1.5; 20171120
                order.time_update_step = new Date();
                //付费一次，多次提货, 剩余吨数改变 ?
                if(order.tip_price_id && !order['replenish']['pay_tip_to_buy']){
                    driverOrderSV.payTipToBuy(req, order._id, function () {}); //信息费转账给物流
                }
                //没有提交货地址时，将剩余吨数置0
                if(!order.send_address_id && !order.receive_address_id){
                    order.amount_remain = 0;
                }
                order.save(cb);

            }
        ], function (err, order) {
            if (err) {
                return next(err);
            }
            //-- 有提货仓库时发送提货信息-------
            if (!!order.send_address_id) {
                async.waterfall([
                    function (cb1) {
                        extServer.generalFun(req, {
                            source: 'user',
                            db: 'Address',
                            method: 'getOne',
                            query: {find: {_id: order.send_address_id}, select: 'user_ids'}
                        }, cb1);
                    },
                    function (store, cb1) {
                        if (store) {
                            user_ids = store.user_ids;
                            extServer.push(req, {
                                title: '司机申请提货',
                                content: config_msg_template.encodeContent('driver_supply_loading', [order.send_city, order.receive_city, req.decoded.user_name, order.truck_num]),
                                user_ids: user_ids
                            }, {}, '', {
                                params: {
                                    id: order._id.toString(),
                                    source: 'buy_transit'
                                },
                                url: config_common.push_url.storage_driver_order_detail
                            }, cb1);
                        } else {

                            cb1();
                        }

                    }
                ], function () {
                });
            }
            config_common.sendData(req, {}, next);
        });
    });

    /**
     * 司机申请【继续提货】
     */
    api.post('/repeat_supply_loading', function (req, res, next) {
        if (!req.body.driver_order_id) {
            return next({dev: 'driver_order_id参数有误', pro: '000003'});
        }
        if (req.decoded.role !== config_common.user_roles.TRAFFIC_DRIVER_PRIVATE) {
            return next({dev: '挂靠司机才允许', pro: '000002'});
        }
        var user_ids;
        async.waterfall([
            function (cb) {
                //!!req.body.repeat ? {$gt: 3} :
                driverOrderSV.getOne({
                    find: {
                        _id: req.body.driver_order_id,
                        supply_user_id: req.decoded.id,
                        step: {$gt: 3, $lte: 4}
                    }
                }, cb);
            },
            function (order, cb) {
                if (!order) {
                    return cb({dev: '司机订单没找到', pro: '000004'});
                }
                if (order.amount_remain < 1) {
                    return cb({dev: '剩余吨数不足'});
                }
                order.step = order.send_address_id && order.order_id ? 2 : 2.5; //1.5; 20171120
                order.time_update_step = new Date();
                order.save(cb);
            }
        ], function (err, order) {
            if (err) {
                return next(err);
            }
            if (!!order.send_address_id) {
                async.waterfall([
                    function (cb1) {
                        extServer.generalFun(req, {
                            source: 'user',
                            db: 'Address',
                            method: 'getOne',
                            query: {find: {_id: order.send_address_id}, select: 'user_ids'}
                        }, cb1);
                    },
                    function (store, cb1) {
                        if (store) {
                            user_ids = store.user_ids;
                            extServer.push(req, {
                                title: '司机申请提货',
                                content: config_msg_template.encodeContent('driver_supply_loading', [order.send_city, order.receive_city, req.decoded.user_name, order.truck_num]),
                                user_ids: user_ids
                            }, {}, '', {
                                params: {
                                    id: order._id.toString(),
                                    source: 'buy_transit'
                                },
                                url: config_common.push_url.storage_driver_order_detail
                            }, cb1);
                        } else {
                            cb1();
                        }

                    }
                ], function () {
                });
            }
            config_common.sendData(req, {}, next);
        });
    });

    /**
     * 仓管提货
     *  @param amount
     *  @param products_replenish
     *  @param product_categories
     *  @param amount_send_start
     *  @param amount_send_end
     *  @return
     */

    api.post('/order_loading', function (req, res, next) {
        if (req.decoded.role !== config_common.user_roles.TRADE_STORAGE) {
            return next({dev: '仓管才允许', pro: '000002'});
        }
        var driverOrder;
        async.waterfall([
            function (cb) {
                //清0
                // if(req.body.products_replenish){
                //     req.body.products_replenish = config_common.eraser_zero(req.body.products_replenish);
                // }
                // if(req.body.product_categories){
                //     req.body.product_categories = config_common.eraser_zero(req.body.product_categories, 'loading_number');
                // }

                //查询订单
                driverOrderSV.getOne({
                    find: {
                        _id: req.body.driver_order_id,
                        step: {$lt: 2.5},
                        send_address_id: {$nin: ['', null]}
                    }
                }, cb);
            },
            function (order, cb) {
                if (!order) {
                    return cb({dev: '司机订单没找到', pro: '000004'});
                }
                driverOrder = order;
                driverOrder.time_update_step = new Date();
                //多次补货
                driverOrder.amount_send_sub = !!driverOrder.amount_send_sub ? config_common.rscDecimal('add', driverOrder.amount_send_sub, req.body.amount) : req.body.amount;//Number(req.body.amount);//amount 和 product_categories中的吨数不符

                // 修改 product_categories 中的提交货剩余数
                driverOrder['product_categories'] = config_common.storeRemainProduct(driverOrder['product_categories'], req.body.product_categories, 'loading');
                driverOrder.markModified('product_categories');

                driverOrder['replenish']['order_loading'].push({
                    products_replenish:  req.body.products_replenish|| [],
                    product_categories: req.body.product_categories|| [],
                    amount_send_start: !!req.body.amount_send_start ? req.body.amount_send_start.toFixed(3) : 0,
                    amount_send_end: !!req.body.amount_send_end ? req.body.amount_send_end.toFixed(3) : 0,
                    amount: !!req.body.amount ? req.body.amount.toFixed(3) : 0,
                    amount_remain: config_common.rscDecimal('sub', driverOrder.amount, driverOrder.amount_send_sub),
                    loading_time: new Date()
                });
                // driverOrder['replenish']['products_replenish'] = driverOrder.send_address_id && !driverOrder.receive_address_id ? [] : req.body.products_replenish;

                if(driverOrder.send_address_id && !driverOrder.receive_address_id){
                    driverOrder['replenish']['products_replenish'] = []; //提货存在，交货不存在
                }else{
                    //提货&交货存在
                    driverOrder['replenish']['products_replenish'] = config_common.storeRemainReplenish(driverOrder['replenish']['products_replenish'], req.body.products_replenish, 'loading');
                }
                driverOrder['replenish']['price_send_sub'] = config_common.rscDecimal('add', driverOrder['replenish']['price_send_sub'], config_common.rscDecimal('mul', driverOrder.price, req.body.amount), 2);
                // 过磅记录,依据过磅情况计算订单实际费用
                driverOrderSV.weightSettlementStyle(driverOrder, req.body.product_categories, 'driver', ['get', 'theory']);
                driverOrder.step = 2.5;
                
                // return cb({dev: driverOrder['replenish']})
                driverOrder.save(function (err, driverOrder) {
                    //若是提货出现补货 ,路耗，则计算提货价格
                    if (_.isArray(req.body.products_replenish) && req.body.products_replenish.length>0 &&
                        ((driverOrder.send_address_id && !driverOrder.receive_address_id) || driverOrder.weigh_settlement_style != config_common.weigh_settlement_style.fact )) {
                        driverOrderSV.replenishCalculate(driverOrder._id, req.body.products_replenish, 'loading_', function () {}, req.body.amount);
                    }

                    //关联交易订单，物流订单，司机需求单
                    driverOrderSV.storeTouchList(req, {
                        order_id : driverOrder.order_id,
                        demand_id : driverOrder.demand_id,
                        product_categories : req.body.product_categories,
                        passRule : ['get', 'theory'],
                        tradeRule : ['pick_up', 'path_loss']
                    }, function () {});
                    cb();
                });
            }
        ], function (err) {
            if (err) {
                return next(err);
            }
            if(driverOrder.source == config_common.demand_source.driver_temp && !driverOrder.receive_address_id){
                // traffic_server_driver_order_complete
                http.sendTrafficServer(req, {order_id: driverOrder._id.toString()}, config_api_url.traffic_server_driver_order_complete, function () {                        })
            }
            config_common.sendData(req, {}, next);
        });
    });

    /**
     * 司机申请【交货】
     */
    api.post('/order_supply_unloading', function (req, res, next) {
        if (!req.body.driver_order_id) {
            return next({dev: 'driver_order_id参数有误', pro: '000003'});
        }
        if (req.decoded.role !== config_common.user_roles.TRAFFIC_DRIVER_PRIVATE) {
            return next({dev: '挂靠司机才允许', pro: '000002'});
        }
        var user_ids;
        async.waterfall([
            function (cb) {
                driverOrderSV.getOne({
                    find: {
                        _id: req.body.driver_order_id,
                        supply_user_id: req.decoded.id,
                        step: {$lt: 3}
                    }
                }, cb);
            },
            function (order, cb) {
                if (!order) {
                    return cb({dev: '司机订单没找到', pro: '000004'});
                }
                if (!order.receive_address_id && !order.send_address_id) {
                    order.amount_remain = 0;
                }
                order.step = order.receive_address_id && order.order_id ? 3 : 3.5; //3;20171120
                order.time_update_step = new Date();
                order.save(cb);
            }
        ], function (err, order) {
            if (err) {
                return next(err);
            }
            if (!!order.receive_address_id) {
                async.waterfall([
                    function (cb1) {
                        extServer.generalFun(req, {
                            source: 'user',
                            db: 'Address',
                            method: 'getOne',
                            query: {find: {_id: order.receive_address_id}, select: 'user_ids'}
                        }, cb1);
                    }, function (store, cb1) {
                        if (store) {
                            user_ids = store.user_ids;
                            extServer.push(req, {
                                title: '司机申请交货',
                                content: config_msg_template.encodeContent('driver_supply_unloading', [order.send_city, order.receive_city, req.decoded.user_name, order.truck_num]),
                                user_ids: user_ids
                            }, {}, '', {
                                params: {
                                    id: order._id.toString(),
                                    source: 'buy_transit'
                                },
                                url: config_common.push_url.storage_driver_order_detail
                            }, cb1);
                        } else {
                            cb1();
                        }

                    }
                ], function () {
                })
            }
            config_common.sendData(req, {}, next);
        });
    });
    //仓管交货
    api.post('/order_unloading', function (req, res, next) {
        //
        // if (!req.body.driver_order_id || !req.body.amount ||
        //     !_.isNumber(Number(req.body.amount)) || !req.body.product_categories) {
        //     return next({dev: '参数有误', pro: '000003'});
        // }
        if (req.decoded.role !== config_common.user_roles.TRADE_STORAGE) {
            return next({dev: '仓管才允许', pro: '000002'});
        }
        async.waterfall([
            function (cb) {
                //清0
                // if(req.body.products_replenish){
                //     req.body.products_replenish = config_common.eraser_zero(req.body.products_replenish);
                // }
                // if(req.body.product_categories){
                //     req.body.product_categories = config_common.eraser_zero(req.body.product_categories, 'unloading_number');
                // }
                //查询订单
                driverOrderSV.getOne({
                    find: {
                        _id: req.body.driver_order_id,
                        $or: [
                            {
                                send_address_id: {$nin: ['', null]},
                                receive_address_id: {$nin: ['', null]},
                                step: {$gte: 2.5, $lt: 3.5}
                            },
                            {
                                send_address_id: {$in: ['', null]},
                                receive_address_id: {$nin: ['', null]},
                                step: {$lt: 3.5}
                            }
                        ]
                    }
                }, cb);
            },
            function (order, cb) {
                if (!order) {
                    return cb({dev: '司机订单没找到', pro: '000004'});
                }
                order.amount_receive_sub = !!order.amount_receive_sub ? config_common.rscDecimal('add', order.amount_receive_sub, req.body.amount) : req.body.amount//req.body.amount;

                // 修改 product_categories 中的交货剩余数
                order['product_categories'] = config_common.storeRemainProduct(order['product_categories'], req.body.product_categories, 'unloading');
                order.markModified('product_categories');
                order['replenish']['products_replenish'] = [];
                order['replenish']['price_receive_sub'] = config_common.rscDecimal('add', order['replenish']['price_receive_sub'], config_common.rscDecimal('mul', order.price||1, req.body.amount), 2);
                order['replenish']['order_unloading'].push({
                    products_replenish: req.body.products_replenish || [],
                    product_categories: req.body.product_categories|| [],
                    amount_send_start: !!req.body.amount_send_start ? req.body.amount_send_start.toFixed(3) : 0, //parseFloat(c.toFixed(p))
                    amount_send_end: !!req.body.amount_send_end ? req.body.amount_send_end.toFixed(3) : 0,
                    amount: !!req.body.amount ? req.body.amount.toFixed(3) : 0,
                    amount_remain: config_common.rscDecimal('sub', order.amount, order.amount_receive_sub),
                    loading_time: new Date()
                });
                driverOrderSV.weightSettlementStyle(order, req.body.product_categories, 'pass', ['fact']);
                order.step = 3.5; //20171120

                order.save(function (err, order) {
                    // [没有提货仓库，只有交货仓库] [结算方式按交货计算]
                    if ( _.isArray(req.body.products_replenish) && req.body.products_replenish.length > 0 &&
                        ((!order.send_address_id && order.receive_address_id) || order.weigh_settlement_style == config_common.weigh_settlement_style.fact)) {
                        driverOrderSV.replenishCalculate(order._id, req.body.products_replenish, 'unloading_', function () {}, req.body.amount)
                    }
                    //关联交易订单，物流订单，司机需求单
                    driverOrderSV.storeTouchList(req, {
                        order_id : order.order_id,
                        demand_id : order.demand_id,
                        product_categories : req.body.product_categories,
                        passRule : ['arrival'],
                        tradeRule : ['fact']
                    }, function () {});
                    if(order.source == config_common.demand_source.driver_temp){
                        // traffic_server_driver_order_complete
                        http.sendTrafficServer(req, {order_id: order._id.toString()}, config_api_url.traffic_server_driver_order_complete, function () {                        })
                    }
                    cb()
                });
            }
        ], function (err) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, {}, next);
        });
    });

    /**
     *司机付款
     * payment: redcard 红包 balance 余额
     */

    api.post('/order_tip_pay', function(req, res, next){
        //收单信息费免费，若有现金红包则扣除红包金额
        if(req.decoded.role != config_common.user_roles.TRAFFIC_DRIVER_PRIVATE){
            return next({dev: '限司机'});
        }
        var driverOrder={}, //司机订单
            red_card_order={},//司机的优惠卷
            waitPrice=0,//待付费
            use_card=0; //使用优惠的费用
       async.waterfall([
           function (cb) {
             if(!req.body.order_id || !req.body.payment){
                 return cb({dev: '参数有误'})
             }else{
                 cb()
             }
           },
           function (cb) {
               //获取订单信息
               driverOrderSV.getOne({
                   find: {_id: req.body.order_id, status: config_common.demand_status.effective}
               }, cb);
           }, function (order, cb) {
               if (!order) {
                   return cb({dev: '单据未找到'})
               }
               if (order.step > 0.5) {
                   return cb({dev: '已支付信息费'})
               }
               driverOrder = order;
               waitPrice=driverOrder.tip_prices;
               //使用优惠卷支付
               if(req.body.payment=='balance'){
                   cb(null, null);
               }else{
                   redCardOrderSV.getOne({
                       find: {
                            user_id: req.decoded.id,
                            send_company_id: driverOrder.demand_company_id,
                            time_validity: {$gt: new Date()},
                            status:config_common.demand_status.effective,
                            money_remain: {$gt:0}
                       },
                   }, cb);
               }
           },function(redcard,cb){
               //查看红包，扣除对应红包
               if(redcard){
                   if(redcard.money_remain > waitPrice){
                       redcard.money_remain=config_common.rscDecimal('sub', redcard.money_remain, waitPrice);
                       
                       use_card=waitPrice;
                       waitPrice=0;
                   }else{
                       use_card=redcard.money_remain;
                       waitPrice=Math.abs(config_common.rscDecimal('sub', redcard.money_remain, waitPrice));
                       redcard.money_remain=0;
                   }
                   redcard.frequency=redcard.money_remain;
                   redcard.save(function () {})
               }
               //付款
               http.sendPayServerNew(req, {
                   payer_id: driverOrder.supply_user_id,
                   receivables_id: driverOrder.demand_user_id,
                   order_id: driverOrder._id.toString(),
                   amount: waitPrice,//order.tip_prices || order.tip_price, //钱数需要-减优惠券
                   receivables_company_id: driverOrder.demand_company_id,
                   order_type: 'driver',
                   payProducts: 'information_expenditure',//'information_income', //支出
                   role: req.decoded.role,
                   pay_method: 'Information'
               }, config_api_url.pay_information_debit, function (err, result) {
                   if(err && waitPrice>0){
                       return cb({dev: err});
                   }else{
                       driverOrder.tip_price_id = result ? result.orderNo : '';
                       driverOrder.step = 1;
                       //没有存储实际付费，和红包付费的情况
                       driverOrder.replenish['waitPrice']= waitPrice; //实际支付额
                       driverOrder.replenish['red_card']= config_common.rscDecimal('sub', driverOrder.tip_prices, waitPrice); //红包抵用额
                       driverOrder.markModified('replenish');
                       driverOrder.time_update_step=new Date();
                       driverOrder.save();
                       cb(null, true);
                   }
               })
           }
       ], function (err, result) {
           if (err) {
               return next(err);
           }
           //付费成功，推送给物流, 20180327给司机发送提货信息;
           if(result){
               //推送物流信息
               extServer.push(req, {
                   title: '支付信息费',
                   content: config_msg_template.encodeContent('driver_tip_price', [req.decoded.user_name, driverOrder.truck_num, driverOrder.tip_prices]),
                   user_ids: [driverOrder.demand_user_id]
               }, {}, '', {
                   params: {
                       order_id: driverOrder._id.toString(),
                       source: 'true'
                   },
                   // url: config_common.push_url.storage_driver_order_detail
                   url: config_common.push_url.driver_order
               }, function () {});
               //20180522 一周之后司机也收到推送
               //【鑫汇云】派车单：请您驾驶 冀U88393 于3月19日去鑫汇钢铁提货：Q235，25件，50吨。现场协调请联系陈源15399008899，详情查看 driver.e-wto.com 退订回T
               var redcard = '', sendAddress='', category_info='';
               if(driverOrder && driverOrder['product_categories'][0] && driverOrder['product_categories'][0]['product_name'][0]){
                   //【司机中心】(3932683)鑫汇物流恭喜您已通过（现金红包支付信息费100元/用余额支付信息费100元）成功，请驾驶 冀U88393 前往河北邯郸鑫汇成品库装取16件高线，理计重量34吨，联系人：（驻厂业务员），电话（18888888823），凭此短信开取派车单；请实时关注司机中心的货源信息，登录在线查看vehicles.e-wto.com
                   //%s恭喜您已通过%s成功，请驾驶%s前往%s装取%s，理计重量%s吨，联系人：（%s），电话（%s），凭此短信开取派车单；请实时关注司机中心的货源信息，登录在线查看%s
                   var category_penult_chn = config_common.penultCategoryChn(driverOrder.product_categories);
                   var category_count =config_common.categoryNumber(driverOrder.product_categories);
                   if(driverOrder.product_categories[0]['pass_unit']==driverOrder.product_categories[0]['unit']){
                       category_info += category_penult_chn;
                   }else{
                       category_info += category_count+driverOrder.product_categories[0]['unit']+category_penult_chn;
                   }
                   if(use_card>0){
                       redcard += '现金红包支付信息费'+use_card+'元';
                   }else{
                       redcard +='用余额支付信息费'+waitPrice+'元';
                   }
                   if(driverOrder['send_province']){
                       sendAddress+=driverOrder['send_province'];
                   }
                   if(driverOrder['send_city'] && driverOrder['send_city']!=driverOrder['send_province']){
                       sendAddress+=driverOrder['send_city'];
                   }
                   if(driverOrder['send_district']){
                       sendAddress+=driverOrder['send_district'];
                   }
                   if(driverOrder['send_addr']){
                       sendAddress+=driverOrder['send_addr'];
                   }
                   async.waterfall([
                       function (push) {
                           //红包检查
                           extServer.redcardtip(req, {
                               company_id: driverOrder.demand_company_id,
                               user_id: driverOrder.supply_user_id
                           }, push)
                       },
                       function (redcardR, push) {
                           var ispush_driver=false;
                           if(redcardR && redcardR.uuid && ((new Date()).getTime())>((new Date(redcardR.uuid.time_creation)).getTime() + 7*24*60*60*1000) ){
                               ispush_driver=true;
                           }
                           if(ispush_driver){
                               extServer.push(req, {
                                   title: '支付信息费',
                                   content: config_msg_template.encodeContent('driver_tip_price_red', [
                                       driverOrder['demand_company_name'] ? driverOrder['demand_company_name'] : '',
                                       redcard,
                                       driverOrder['truck_num'],
                                       sendAddress,
                                       category_info,
                                       driverOrder['amount'],
                                       driverOrder['send_name'],
                                       driverOrder['send_phone'],
                                       'vehicles.e-wto.com'
                                   ]),
                                   user_ids: [driverOrder.supply_user_id]
                               }, {}, '', {
                                   params: {
                                       order_id: driverOrder._id.toString(),
                                       source: 'true'
                                   },
                                   // url: config_common.push_url.storage_driver_order_detail
                                   url: config_common.push_url.driver_order
                               }, push);
                           }else{
                               extServer.driverMsg(req, {
                                   phone: [driverOrder.supply_user_phone],
                                   params: [
                                       driverOrder['demand_company_name'] ? driverOrder['demand_company_name'] : '',
                                       redcard,
                                       driverOrder['truck_num'],
                                       sendAddress,
                                       category_info,
                                       driverOrder['amount'],
                                       driverOrder['send_name'],
                                       driverOrder['send_phone'],
                                       'vehicles.e-wto.com'
                                   ],
                                   templateid: '3932683'
                               }, push)
                           }
                       }
                   ], function(){})

               }
           }
           config_common.sendData(req, result, next);
       })
    });

    //仓库过磅 1
    api.post('/start_weigh',function (req, res, next) {
        var storeList = [];
        async.waterfall([
            function (cb) {
                var flag = true;
                if(!req.body.role == config_common.user_roles.TRADE_STORAGE){
                    flag = false;
                    return cb({dev: '仅限仓库管理'})
                }
                if(!req.body.order_id || !req.body.amount){
                    flag = false;
                    return cb({dev: '参数不全'});
                }
                if(flag){
                    cb()
                }
            }
            ,function (cb) {
                //获取当前仓库地址
                extServer.generalFun(req, {
                        source: 'user',
                        db: 'Address',
                        method: 'getList',
                        query: {find: {user_ids: {$in: [req.decoded.id]}, type: {$exists: true}}}
                    }, cb)
            }
            , function(address, cb){
                if(!address || address.length==0){
                    return cb({dev: '没有单据'});
                }
                storeList = _.pluck(JSON.parse(JSON.stringify(address)), '_id');
                driverOrderSV.getOne({
                    find: {
                        _id: req.body.order_id
                    }
                }, cb)
            }
            ,function (order, cb) {
                if(!order){
                    return cb({dev: '单据未找到'});
                }
                if(storeList.indexOf(order.send_address_id) == -1 && storeList.indexOf(order.receive_address_id) == -1){
                    return cb({dev: '无权操作'})
                }
                //如何判断交易方还是提货房
                if(order.step < 2.5 && order.send_address_id && storeList.indexOf(order.send_address_id) > -1){

                    if(order.step <= 2 && !order.libra_id){
                        order.amount_send_start = req.body.amount;
                        order.libra_id = req.body.libra_id;
                        order.step = 2.1;
                        order.save(cb);
                        return ;
                    }
                    if(order.step == 2.1 && !order.amount_send_end){
                        order.amount_send_end = req.body.amount;
                        order.libra_amount = config_common.rscDecimal('sub', order.amount_send_end, order.amount_send_start);
                    //     order.step = 2.2;
                    //     order.save(cb);
                    //     return ;
                    // }
                    //
                    // // 如何确定差值是提交货的，何时将提交货吨数清空;
                    // if(order.step == 2.2){
                    //     //保存提货信息，并清理提货临时值
                        driverOrderSV.libraLoading(req, order._id, order.amount_send_start, order.amount_send_end, order.libra_amount, cb)
                    }
                }
                if( (order.step >= 2.5 && order.receive_address_id || !order.send_address_id) && storeList.indexOf(order.receive_address_id) > -1){
                    if(order.step < 3 && !order.libra_id){
                        order.amount_send_start = req.body.amount;
                        order.libra_id = req.body.libra_id;
                        order.step = 3.1;
                        order.save(cb);
                        return;
                    }
                    if(order.step == 3.1 && !order.amount_send_end){
                        order.amount_send_end = req.body.amount;
                        order.libra_amount = config_common.rscDecimal('sub', order.amount_send_start, order.amount_send_end);
                    //     order.step = 3.2;
                    //     order.save(cb);
                    //     return;
                    // }
                    // if(order.step == 3.2){
                        //保存提货信息，并清理提货临时值
                        driverOrderSV.libraUnLoading(req, order._id, order.amount_send_start, order.amount_send_end, order.libra_amount, cb)
                    }
                }
                return cb(null,true);
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, result, next);
        })
    });
    //仓库过磅 2

    //司机申请运费垫付
    //物流确认付款
    //司机确认收款
    return api;
};


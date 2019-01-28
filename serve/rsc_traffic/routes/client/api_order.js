/**
 * Created by Administrator on 2015/11/25.
 */
var async = require('async');
var _ = require('underscore');
var express = require('express');
var config_common = require('../../configs/config_common');
var trafficDemandSV = require('../../lib/lib_traffic_demand');
var trafficOrderSV = require('../../lib/lib_traffic_order');
var driverDemandSV = require('../../lib/lib_traffic_driver_demand');
var driverOrderSV = require('../../lib/lib_traffic_driver_order');
var extServer = require('../../lib/lib_ext_server');


module.exports = function() {
    var api = express.Router();
    
    //获取单个订单信息 20170425 20180109 便于分享
    api.post('/get_one', function(req, res, next){
        // if(req.decoded.role !== config_common.user_roles.TRADE_ADMIN &&
        //     req.decoded.role !== config_common.user_roles.TRADE_SALE &&
        //     req.decoded.role !== config_common.user_roles.TRADE_PURCHASE &&
        //     req.decoded.role !== config_common.user_roles.TRADE_FINANCE &&
        //     req.decoded.role !== config_common.user_roles.TRAFFIC_ADMIN &&
        //     req.decoded.role !== config_common.user_roles.TRAFFIC_DRIVER_PRIVATE &&
        //     req.decoded.role !== config_common.user_roles.TRAFFIC_DRIVER_PUBLISH &&
        //     req.decoded.role !== config_common.user_roles.TRADE_STORAGE){
        //     return next({dev:'仅限交易和物流', pro:'000002'});
        // }
        
        if(!req.body.order_id){
            return next({dev: 'order_id参数有误', pro: '000003'});
        }
        var trafficOrderOne={}, driverDemandList=[], driverOrderList=[];
        async.waterfall([
            function(cb){
                trafficOrderSV.getById({find: req.body.order_id}, cb);
            }, function (orderRes, cb) {
                if(!orderRes) return cb({dev: '物流订单没找到', pro: '000004'});
                //增加公司和个人信息
                trafficOrderSV.getOrderUserComp(req, orderRes, cb);
            }, function(order, cb){
                if(!order) return cb({dev: '物流订单没找到', pro: '000004'});
                if(req.decoded && req.decoded.role === config_common.user_roles.TRADE_STORAGE){
                    //仓库加提货状态显示
                    extServer.generalFun(req, {
                        source: 'user',
                        db: 'Address',
                        method: 'getList',
                        query: {find: {user_ids: req.decoded.id}, select:'_id'}
                    }, function (err, stores) {
                        if(err){
                            return cb(err);
                        }
                        var store_ids = _.pluck(stores, '_id');
                        order.pick_up = store_ids.indexOf(order.send_address_id) >= 0;
                        cb(null, order);
                    });
                }else{
                    cb(null, order);
                }
            }, function(order, cb){
                trafficOrderOne = order;
                trafficOrderOne['driver_status'] = {effective: 0, complete: 0};
                //统计运行中和已完成的车辆数
                driverOrderSV.getAggregate({
                    match: {order_id: trafficOrderOne._id.toString()},
                    group: {_id: '$status', num: { $sum: 1 }}
                }, cb);

            }, function(statisRes, cb){
                if(!statisRes) return cb({dev: '统计失败', pro: '000004'});
                _.each(statisRes, function(status){
                    trafficOrderOne['driver_status'][status._id] = status.num;
                });
                //依据物流订单查询司机订单
                trafficOrderSV.trafficTodriverOrder(req, {order_id: trafficOrderOne._id.toString()}, function(err, demandListRes){
                    if(err) return cb(err);
                    driverDemandList = driverDemandList.concat(demandListRes);
                    cb();
                });
            },
            function (cb) {
                driverOrderSV.getCount({order_id: req.body.order_id}, function (err, count) {
                    if(err){
                        return cb(err);
                    }
                    trafficOrderOne['truck_count'] = count;
                    cb();
                });
            }
        ], function(err){
            if(err){
                return next(err);
            }
            trafficOrderOne['driverDemand'] = driverDemandList;
            config_common.sendData(req, trafficOrderOne, next);
        });
    });

    api.use(require('../../middlewares/mid_verify_user')());
    /*
     获取新订单 20170420
     param: find_role,page,status
     */
    api.post('/get_list', function(req, res, next){
        //参数，角色判断
        if(req.decoded.role !== config_common.user_roles.TRADE_ADMIN &&
            req.decoded.role !== config_common.user_roles.TRADE_SALE &&
            req.decoded.role !== config_common.user_roles.TRADE_STORAGE &&
            config_common.accessRule.pass.indexOf(req.decoded.role)==-1 &&
            req.decoded.role !== config_common.user_roles.TRADE_PURCHASE){
            return next({dev: '仅限交易和物流', pro: '000002'});
        }
        if(!req.body.find_role || !config_common.find_role[req.body.find_role] || !req.body.status){
            return next({dev: '缺少参数', pro: '000003'});
        }
        //条件判断
        req.body.page = parseInt(req.body.page) || 1;
        req.body.is_refresh = true; //['true', true, 1, '1'].indexOf(req.body.is_refresh) !== -1; //若存在下列刷新，则修改个人查阅时间;
        var orderRes = {}, orderTmp = [], new_count=0, cond = {}, tipCond={};
        //通过角色和查询条件
        if(config_common.accessRule.pass.indexOf(req.decoded.role)>-1){
            if(req.body.find_role === 'company'){
                cond.supply_company_id = req.decoded.company_id[0];
            }else{
                cond.supply_user_id = req.decoded.id;
            }
            if(req.body.search_company){
                cond.demand_company_id = req.body.search_company;
            }
            tipCond = {
                user_id: req.decoded.id,
                company_id: req.decoded.company_id[0],
                other_company_id: req.decoded.company_id[0]
            };
        }
        if(req.decoded.role === config_common.user_roles.TRADE_ADMIN ||
            req.decoded.role === config_common.user_roles.TRADE_PURCHASE ||
            req.decoded.role === config_common.user_roles.TRADE_SALE){
            // if(req.body.find_role === 'company' ){
            if(req.decoded.role == config_common.user_roles.TRADE_ADMIN){
                cond.demand_company_id = req.decoded.company_id;
            }
            // }else{
            if(req.decoded.role != config_common.user_roles.TRADE_ADMIN){
                cond.demand_user_id = req.decoded.id;
            }                
            // }
            if(req.body.search_company){
                cond.supply_company_id = req.body.search_company;
            }
            tipCond = {
                user_id: req.decoded.id,
                company_id: req.decoded.company_id,
                other_company_id: req.decoded.company_id
            };
        }
        if(req.decoded.role === config_common.user_roles.TRADE_STORAGE){
            tipCond = {
                user_id: req.decoded.id,
                company_id: req.decoded.company_id,
                other_company_id: req.decoded.company_id
            };
        }
        //执行操作
        if(req.body.scene === 'assign'){
            cond.step = {$gte:3, $lt: 4} ; //待指派
        }
        var store_ids;
        async.waterfall([
            function (cb) {
                if(req.decoded.role === config_common.user_roles.TRADE_STORAGE){
                    extServer.generalFun(req, {
                        source: 'user',
                        db: 'Address',
                        method: 'getList',
                        query: {find: {user_ids: req.decoded.id}, select:'_id'}
                    }, function (err, stores) {
                        if(err){
                            return cb(err);
                        }
                        store_ids = _.pluck(stores, '_id');
                        if(req.body.store_id){
                            store_ids = [req.body.store_id];
                        }
                        if(req.body.company_id){
                            cond.supply_company_id = req.body.company_id;
                        }
                        if(req.body.status != config_common.demand_status.complete){
                            cond.step = {$in:[3.5, 4]};
                        }
                        cond['$or'] = [
                            {send_address_id: {$in: store_ids}},
                            {receive_address_id: {$in: store_ids}}
                        ];
                        cb();
                    });
                }else{
                    cb();
                }
            },
            function (cb) {
                cond.status = config_common.demand_status[req.body.status] || config_common.demand_status.ineffective;
                if(req.decoded.role === config_common.user_roles.TRADE_STORAGE){
                    //仓管暂时不做提示
                    return cb(null, null);
                }
                extServer.tipPassOrder(tipCond, req.body.is_refresh, cond.status, req.decoded.role, cb);
            },
            function(condRes, cb){
                if(condRes){
                    cond.time_update_step = {$lte: condRes.update_time};
                    new_count = condRes.count;
                }
                trafficOrderSV.getList({
                    find: cond,
                    // select: 'index demand_user_id demand_company_id supply_user_id supply_company_id material amount price_total send_city send_district receive_city receive_district',
                    skip: (req.body.page-1)*config_common.entry_per_page,
                    limit: config_common.entry_per_page,
                    sort: {time_creation: -1},
                    page: req.body.page
                }, cb);
            },
            function(orderList, cb){
                orderRes['count'] = orderList.count;
                orderRes['exist'] = orderList.exist;
                orderRes['new_count'] = new_count;
                async.eachSeries(orderList.orders, function(order, cb1){
                    async.waterfall([
                        function (cb2) {
                            trafficOrderSV.getOrderUserComp(req, order, function(err, orderData){
                                // if(err) return next('stride_server_failed');
                                orderTmp.push(orderData);
                                cb2(null, orderData);
                            });
                        },
                        function (orderData, cb2) {
                            if(req.decoded.role === config_common.user_roles.TRADE_STORAGE && orderData){
                                driverOrderSV.getCount({order_id: orderData._id.toString()}, function (err, count) {
                                    if(err){
                                        return cb2(err);
                                    }
                                    orderData.truck_count = count;
                                    orderData.pick_up = store_ids.indexOf(order.send_address_id) >= 0;
                                    cb2();
                                });
                            }else{
                                cb2();
                            }
                        }
                    ], cb1);
                }, cb);
            }
        ], function(err){
            if(err){
                return next(err);
            }
            orderRes['orders'] = orderTmp;
            config_common.sendData(req, orderRes, next);
        });

    });

    /*
     * 获取订单数量 20170421
     * param : status:'', scene:'',find_role:''
     * result: { ineffective: 0, effective: 0, complete: 0, cancelled:0, money:0}
     */

    api.post('/get_count', function(req, res, next){
        async.waterfall([
            function (cb) {
                trafficOrderSV.specialCount(req, cb);
            }
        ], function (err, result) {
            if(err) return next(err);
            config_common.sendData(req, result, next);
        });

    });

    //通过物流订单号查询司机订单
    /**
     * 20170706 通过交易订单查询物流订单，通过物流订单查询司机订单；
     * 20180125 通过物流需求单，查询交易订单再查司机订单;
     */
    api.post('/trade_order_driver', function(req, res, next){

        //场景判断
        var trafficDemandList = [], assign_company_info = [];
        //执行操作
        async.waterfall([
            function (cb) {
                //角色判断
                if(req.decoded.role != config_common.user_roles.TRADE_ADMIN &&
                    req.decoded.role != config_common.user_roles.TRADE_PURCHASE &&
                    req.decoded.role != config_common.user_roles.TRADE_SALE){
                    return cb({dev: '仅限交易', pro: '000002'});
                }
                //参数判断
                if(!req.body.index_trade){
                    return cb({dev: 'index_trade参数有误', pro: '000003'})
                }
                cb();
            },
            function (cb) {
              trafficDemandSV.onlyList({
                  find: {
                      index_trade: req.body.index_trade
                  },
                  // select: 'amount time_creation unoffer_list verify_company platform_company receive_address_id'
              }, cb)
            },
            function (lists, cb) {
                if(!lists || lists.length==0){
                    cb(null, [])
                }else{

                //查询需求单关联的物流订单
                async.eachSeries(JSON.parse(JSON.stringify(lists)), function (list, cb9) {
                        var trafficOrderList=[];
                    //20180328 增加指派公司信息
                        async.waterfall([
                            function (cb8) {
                                //{$in: reqObj.verify_company}
                                var assign_company = _.union(list.unoffer_list, list.verify_company, list.platform_company);

                              //获取物流公司名字
                              //   extServer.companyUserLogo('traffic',{_id: {$in: assign_company}}, {role: {$in: config_common.accessRule.pass}}, cb8);
                                extServer.generalFun(req, {
                                    source: 'user',
                                    db:'Company_traffic',
                                    method:'getList',
                                    query:{
                                        find: {
                                            _id: {$in: assign_company}
                                        },
                                        select: 'nick_name url_logo verify_phase phone_creator'
                                    }}, cb8);
                            },
                            function (assign_company, cb8) {
                                assign_company_info = assign_company;
                                //通过交易订单查询物流订单
                                var cond = {status: {$nin: [config_common.demand_status.ineffective, config_common.demand_status.cancelled]}};
                                if(list._id){
                                    cond.demand_id = list._id;
                                }else{
                                    cond.index_trade = req.body.index_trade;
                                }
                                trafficOrderSV.onlyList({
                                    find: cond,
                                    select: 'supply_company_name amount amount_remain price_total product_categories replenish.replenish_price'
                                }, cb8);
                            },
                            function (orderList, cb8) {
                                //查询物流订单关联的司机订单
                                if(orderList || orderList.length>0){
                                    async.eachSeries(orderList, function(OrderOne, cb1){
                                        var passOrder = OrderOne.toObject();
                                        passOrder['driver_amount']  = 0;
                                        //通过物流订单获取司机订单
                                        async.waterfall([
                                            function (cb10) {
                                                driverOrderSV.onlyList({
                                                    find: {order_id: OrderOne._id.toString()},
                                                    select: 'amount supply_user_id status'
                                                }, cb10);
                                            },
                                            function (driverList, cb10) {
                                                var driverOrderList=[];
                                                async.eachSeries(driverList, function (driver, cb100) {
                                                    var driverOrderOne = driver.toObject();
                                                    //查询司机和车辆信息
                                                    driverDemandSV.getUserTruck(req, {user_id: driver.supply_user_id}, function (err, user) {
                                                        if(user){
                                                            driverOrderOne = _.extend(driverOrderOne, user);
                                                            passOrder['driver_amount'] = config_common.rscDecimal('add',passOrder['driver_amount'], driverOrderOne.amount)
                                                            driverOrderList.push(driverOrderOne);
                                                        }
                                                        cb100();
                                                    });
                                                }, function () {
                                                    passOrder['driverOrder'] = driverOrderList;
                                                    cb10();
                                                });
                                            }
                                        ], function () {
                                            trafficOrderList.push(passOrder);
                                            cb1();
                                        });
                                    }, cb8);
                                }else{
                                    cb8();
                                }
                            }
                        ], function () {
                            trafficDemandList.push( _.extend(list, {
                                orderList: trafficOrderList,
                                assign_company_info: assign_company_info
                            }) );
                            cb9();
                        })
                    }, cb);

                }
            }

        ], function (err) {
            if(err) return next(err);
            config_common.sendData(req, trafficDemandList, next);
        });
    });
    /**
     *  通过交易订单查询司机订单的状态数量
     */
    api.post('/trade_driver_status', function (req, res, next) {

        var orderstatus={effective: 0, complete: 0} , cond={};
        async.waterfall([
            function (cb) {
                //角色判断
                if(req.decoded.role != config_common.user_roles.TRADE_ADMIN &&
                    req.decoded.role != config_common.user_roles.TRADE_PURCHASE &&
                    req.decoded.role != config_common.user_roles.TRADE_SALE){
                    return cb({dev: '仅限交易', pro: '000002'});
                }
                //参数判断
                if(!req.body.index_trade){
                    return cb({dev: 'index_trade参数不服', pro: '000003'});
                }
                cb();
            },
            function (cb) {
                trafficOrderSV.onlyList({find:{index_trade: req.body.index_trade}}, cb);
            },
            function(order, cb){
                var order_arr = [];
                _.each(order, function (x) {
                    if(x){
                        order_arr.push(x._id.toString())
                    }
                });
                cond.order_id = {$in: order_arr};
                driverOrderSV.getAggregate({
                    match: cond,
                    group: {_id: '$status', num: { $sum: 1 }}
                }, cb);
            }, function(statisRes, cb){
                _.each(statisRes, function(status){
                    orderstatus[status._id] = status.num;
                });
                cb(null, orderstatus);

            }], function(err,result){
            if(err) return next(err);
            config_common.sendData(req, result, next);
        });
    });

    /**
     * 统计当前用户的累计合作企业及订单数
     */
    api.post('/get_company_count', function (req, res, next) {
        var match={}, group={}, otherRole, statis_company=[];
        async.waterfall([
            function (cb) {
                if(req.decoded.role == config_common.user_roles.TRADE_ADMIN || req.decoded.role == config_common.user_roles.TRADE_PURCHASE ||
                    req.decoded.role == config_common.user_roles.TRADE_SALE){
                    match = {demand_user_id: req.decoded.id};
                    otherRole = 'traffic';
                    group = {_id: '$supply_company_id', sum: {$sum: 1}};
                }else{
                    otherRole = 'trade';
                    match = {supply_user_id: req.decoded.id};
                    group = {_id: '$demand_company_id', sum: {$sum: 1}};
                }
                cb();
            }, function (cb) {
                trafficOrderSV.getAggregate({
                    match: match,
                    group: group
                }, cb);
            }, function (statisOrder, cb) {
                if(!statisOrder){cb();}
                orderArr = statisOrder;
                //查询公司名称
                async.eachSeries(orderArr, function (order, cb1) {
                    extServer.generalFun(req, {
                        source: 'user',
                        db:'Company_'+otherRole,
                        method:'getOne',
                        query:{
                            find: {
                                _id: order._id
                            },
                            select: 'nick_name'
                        }}, function(err, company){
                        if(company){
                            order.company_name = company.nick_name||'';
                            statis_company.push(order);
                        }
                        cb1();
                    });
                }, cb);
            }
        ], function (err, result) {
            if(err){
                return next(err);
            }
            config_common.sendData(req, statis_company, next);
        });
    });
    /**
     * 获取当前公司订单总额
     *  默认情况，查询自己订单的成交总额;
     *  若传了company_id ，则查询自己与对方公司达成订单的总额
     *  20170906 废弃
     */
    api.post('/get_order_money', function(req, res, next){
        var match = {}, group = {};
        async.waterfall([
            function (cb) {
                if(config_common.accessRule.pass.indexOf(req.decoded.role)>-1){
                    req.body.position = 'supply';
                }
                if(req.body.position==config_common.quality_origin.demand){

                    match.demand_user_id = req.decoded.id;
                    if(req.body.company_id){
                        match.supply_company_id = req.body.company_id;
                    }
                    group = {_id: '$demand_user_id', sum: {$sum: '$price_total'}};
                }else{
                    match.supply_user_id = req.decoded.id;
                    if(req.body.company_id){
                        match.demand_company_id = req.body.company_id;
                    }
                    group = {_id: '$supply_user_id', sum: {$sum: '$price_total'}};
                }

                match.status = config_common.demand_status.complete;
                trafficOrderSV.getAggregate({
                    match: match,
                    group: group
                }, cb)
            }
        ], function (err, result) {
            if(err){ return next(err);}
            config_common.sendData(req, result, next);
        });
        
    });

    /*
    *  若发布多个司机需求，且司机相同，则出现相同车辆不同状态
    *  @return
    *  {
     总吨数,amount_total
     进行中吨数:amount_effective
     已完成吨数,amount_complete
     已运输（进行中和已完成）amount_effective + amount_complete
     未完成吨数:amount_remain=amount_total-amount_complete


     待接单司机: demand_driver
     待派货司机: plan_driver (待派货)
     进行中司机: order_effective
     已完成司机: order_complete
     逾期未接单司机: overdue_driver(需求单完成)
     }
    * */
    api.post('/pass_driver_status', function(req, res, next){
        var passOrderStatus={
            amount_total: 0,
            amount_effective: 0,
            amount_complete: 0,
            amount_remain: 0,
            amount_assign_percent: 0, //已运输百分比
            assign_driver_num: 0,
            demand_driver: [],
            plan_driver: [],
            order_effective: [],
            order_complete: [],
            overdue_driver: []
        },
            driverOrder={};
        async.waterfall([
            function(cb){
                //物流，传order_id
                var flag=true;
                if(!req.body.order_id || config_common.accessRule.pass.indexOf(req.decoded.role)==-1){
                    flag=false;
                }
                if(flag){
                    cb();
                }else{
                    return cb({dev:'参数不足'})
                }
            },
            function(cb){
                trafficOrderSV.getOne({find: {
                    _id: req.body.order_id

                    // ,supply_company_id: {$in: req.decoded.company_id}
                }}, cb);
            },
            function(order, cb) {
                if (!order) {
                    return cb({dev: '查询有误'})
                }
                trafficOrder = order;
                passOrderStatus.amount_total = trafficOrder.amount;
                async.parallel({
                    orderComplete: function (cb1) {
                        //获取完成的车辆和吨数
                        driverOrderSV.onlyList({
                            find: {
                                order_id: trafficOrder._id,
                                status: config_common.demand_status.complete
                            }
                        }, function (x, y) {
                            _.each(y, function (a) {
                                passOrderStatus.amount_complete = config_common.rscDecimal('add', passOrderStatus.amount_complete, a.amount);
                                passOrderStatus.order_complete.push({
                                    user_id: a.supply_user_id,
                                    user_name: a.supply_user_name,
                                    truck_num: a.truck_num,
                                    amount: a.amount,
                                    order_id: a._id,
                                    demand_id: a.demand_id
                                });
                                if(driverOrder[a.demand_id]){
                                    driverOrder[a.demand_id].push(a.supply_user_id);
                                }else{
                                    driverOrder[a.demand_id]=[a.supply_user_id];
                                }
                            });
                            cb1(x, y);
                        });
                    },
                    orderEffective: function (cb1) {
                        //获取进行中的车辆和吨数
                        driverOrderSV.onlyList({
                            find: {
                                order_id: trafficOrder._id
                                ,status: config_common.demand_status.effective
                            }
                        }, function (x, y) {
                            _.each(y, function (a) {
                                passOrderStatus.amount_effective = config_common.rscDecimal('add', passOrderStatus.amount_complete, a.amount);
                                passOrderStatus.order_complete.push({
                                    user_id: a.supply_user_id,
                                    user_name: a.supply_user_name,
                                    truck_num: a.truck_num,
                                    amount: a.amount,
                                    order_id: a._id,
                                    demand_id: a.demand_id
                                });
                                if(driverOrder[a.demand_id]){
                                    driverOrder[a.demand_id].push(a.supply_user_id);
                                }else{
                                    driverOrder[a.demand_id]=[a.supply_user_id];
                                }
                            });
                            cb1(x, y);
                        });
                    }
                }, cb);
            }, function(driver, cb){
                // passOrderStatus['driver']=driver
                async.parallel({
                    demandEffective: function (cb1) {
                    //获取待接单和待派货的车辆 ,不含形成订单的
                        async.waterfall([
                            function(cb2){
                                driverDemandSV.onlyList({find:{
                                    order_id: trafficOrder._id,
                                    status: config_common.demand_status.effective
                                }}, cb2);
                            }, function (lists, cb2) {
                                async.eachSeries(lists, function(list,cb3){
                                    var noTruck=list.unoffer_list, //待派货和进行中的车辆
                                        truck=driverOrder[list._id.toString()] ? driverOrder[list._id.toString()] : [], //进行中的车辆
                                        checkTruck=_.difference(noTruck, truck), //待派货
                                        waitPlan=_.union(list.verify_driver, list.platform_driver); //
                                    async.waterfall([
                                        function (cb30) {
                                            async.eachSeries(checkTruck, function(t,cb4){
                                                extServer.driverUser({user_id: t}, function(x,y){
                                                    if(y){
                                                        passOrderStatus.plan_driver.push({
                                                            user_id: t,
                                                            user_name: y.user_name,
                                                            truck_num: y.truck_num,
                                                            demand_id: list._id
                                                        })
                                                        cb4()
                                                    }else{
                                                        cb4()
                                                    }

                                                })
                                            },cb30)
                                        },
                                        function (cb30) {
                                            async.eachSeries(waitPlan, function(t, cb5){
                                                extServer.driverUser({user_id: t}, function(x,y){
                                                    if(y) {
                                                        passOrderStatus.demand_driver.push({
                                                            user_id: t,
                                                            user_name: y.user_name,
                                                            truck_num: y.truck_num,
                                                            demand_id: list._id
                                                        });
                                                        cb5();
                                                    }else{
                                                        cb5();
                                                    }

                                                });
                                            }, cb30);
                                        }
                                    ], cb3);

                                }, cb2)
                            }
                        ], cb1);

                    },
                    demandComplete: function (cb1) {
                        //获取逾期未接单的车辆
                        async.waterfall([
                            function(cb2){
                                driverDemandSV.onlyList({find:{
                                    order_id: trafficOrder._id,
                                    status: config_common.demand_status.complete
                                }}, cb2);
                            }, function (lists, cb2) {
                                async.eachSeries(lists, function(list,cb3){
                                    var waitPlan=_.union(list.verify_driver, list.platform_driver); //
                                    async.eachSeries(waitPlan, function(t, cb4){
                                        extServer.driverUser({user_id: t}, function(x,y){
                                            if(y) {
                                                passOrderStatus.demand_driver.push({
                                                    user_id: t,
                                                    user_name: y.user_name,
                                                    truck_num: y.truck_num,
                                                    demand_id: list._id
                                                });
                                            }
                                            cb4();
                                        });
                                    }, cb3);

                                }, cb2)
                            }
                        ], cb1);
                    }
                }, cb)
            }
        ], function(err, result){
            if(err){
                return next(err);
            }
            passOrderStatus['amount_assign_percent']=config_common.rscDecimal('div', config_common.rscDecimal('mul',100,
                config_common.rscDecimal('add', passOrderStatus['amount_effective'], passOrderStatus['amount_complete'])), passOrderStatus['amount_total'],0) + '%'
            passOrderStatus['assign_driver_num']=passOrderStatus['demand_driver']['length']
                +passOrderStatus['plan_driver']['length']
                +passOrderStatus['order_effective']['length']
                +passOrderStatus['order_complete']['length']
                +passOrderStatus['overdue_driver']['length'];
            config_common.sendData(req, passOrderStatus, next);
        })
    });

  /*
  * 通过物流订单查询司机订单，统计已运输件数，已运输吨数，剩余吨数，剩余件数
  * */
  api.post('/product_pass_driver', function (req, res, next) {
    // 查询物流订单，
    //查询司机订单
    var pass_product=[];
    async.waterfall([
      function (cb) {
        trafficOrderSV.getOne({find: {_id: req.body.order_id}}, cb)
      },function (order, cb) {
        if(order){
          pass_product=order.product_categories;
        }
        driverOrderSV.onlyList({
          find: {
            order_id: req.body.order_id,
            status: {$nin: [config_common.demand_status.cancelled]}
          }
        }, cb)
      }, function (driverList, cb) {
        async.eachSeries(driverList, function (driver, cb1) {
          //查询dirver中产品详情的分配情况
          
        }, cb)
      }
    ], function(err, result){

    })
  });
  api.post('/product_trade_driver', function (req, res, next) {
    // 查询交易订单，
    //查询司机订单
  });
    return api;
};

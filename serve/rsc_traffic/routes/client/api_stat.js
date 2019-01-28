/**
 * sj 20170419.
 */
var async = require('async');
var _ = require('underscore');
var express = require('express');
var http = require('../../lib/http');

// var TrafficUserStat = require('../../models/TrafficUserStat');
// var config_server = require('../../configs/config_server');
var config_common = require('../../configs/config_common');
var config_api_url = require('../../configs/config_api_url');
var setup_demand = require('../../setup/setup_demand');

var trafficDemandSV = require('../../lib/lib_traffic_demand');
var trafficOfferSV = require('../../lib/lib_traffic_offer');
var trafficOrderSV = require('../../lib/lib_traffic_order');
var trafficPlanSV = require('../../lib/lib_traffic_plan');

var driverDemandSV = require('../../lib/lib_traffic_driver_demand');
var driverOrderSV = require('../../lib/lib_traffic_driver_order');
var driverPlanSV = require('../../lib/lib_traffic_driver_plan');

var trafficLineSV = require('../../lib/lib_traffic_line');//trafficLineSV,lineSV
var extServer = require('../../lib/lib_ext_server');
var redCardOrderSV=require('../../lib/lib_red_card_order');
var infoPriceSV = require('../../lib/lib_info_price');


module.exports = function () {
    var api = express.Router();
    /**
     *   服务端配置：服务器时间
     */
    api.post('/server_config', function (req, res, next) {
        var timeObj = new Date();
        var year = timeObj.getUTCFullYear(), month = timeObj.getMonth() + 1, data = timeObj.getDate();
        var time_stamp = timeObj.getTime();
        config_common.sendData(req, {timeStamp: time_stamp, data: year + '-' + month + '-' + data}, next);
    });
    //获取用户名片
    api.post('/user_card', function (req, res, next) {
        //角色判断
        //参数判断
        if (!req.body.scene && !req.body.user_id) {
            return next({dev: 'scene,user_id参数有误', pro: '000003'});
        }
        //场景判断
        //执行操作
        var user_Arr, userTmp, userOne = {};
        async.waterfall([
            function (cb) {
                //    获取用户和车辆信息
                driverDemandSV.getUserTruck(req, {user_id: req.body.user_id}, function (err, user) {
                    if (err) {
                        return cb({dev: '用户没找到', pro: '000004'})
                    }
                    userOne = _.extend(userOne, user);
                    trafficLineSV.getCount({
                        user_id: userOne.user_id,
                        status: config_common.demand_status.effective
                    }, cb);
                });

            }, function (count, cb) {
                userOne['line_count'] = count || 0;
                if (userOne.role == config_common.user_roles.TRAFFIC_DRIVER_PRIVATE) {
                    driverOrderSV.getCount({
                        supply_user_id: userOne.user_id,
                        // truck_id: userOne.truck_id,
                        status: config_common.demand_status.complete
                    }, cb);
                } else {
                    //20170809 offer 不存在
                    trafficOfferSV.getCount({
                        user_id: userOne.user_id,
                        status: config_common.demand_status.complete
                    }, function (err, count) {
                        userOne['offer_count'] = count || 0;
                        trafficOrderSV.getCount({
                            demand_user_id: userOne.user_id,
                            status: config_common.demand_status.complete
                        }, cb);
                    })

                }

            }, function (count, cb) {
                userOne['order_count'] = count || 0;
                //根据场景 ，获取当前运输订单情况
                if (req.body.scene == 'driver_order') {

                    driverOrderSV.getOne({
                        find: {_id: req.body.order_id},//{user_supply_id: userOne.user_id, truck_id: userOne.truck_id},
                        // select: 'index order_id demand_id amount price product_categories products_replenish replenish price_total step'
                    }, function (err, order) {
                        if (err || !order) {
                            return cb({dev: '没找到数据', pro: '000004'});
                        }else{
                            userOne['order'] = order;
                            cb();
                        }
                    });
                } else {
                    cb();
                }
            },
        ], function (err) {
            if (err) return next(err);
            config_common.sendData(req, userOne, next);
        });
    });

    api.use(require('../../middlewares/mid_verify_user')());

    //物流管理员 的supply transport relation finance manage 数量
    api.post('/supply_statis', function (req, res, next) {
        //角色判断

        if (config_common.accessRule.pass.indexOf(req.decoded.role)==-1) {
            return next({dev: '仅限物流', pro: '000002'});
        }
        //条件检出
        //数据操作
        var supplyStatis = {
            pass_demand: 0, // 货源量
            pass_plan: 0,   // 计划量
            pass_order: 0,  // 订单量
            pass_order_wait: 0,
            pass_demand_info: [],
            driver_demand: 0, //司机需求单
            driver_plan: 0, //司机计划量
            driver_order: 0 //司机总量
        }, tipCond = {};
        // config_common.sendData(req, supplyStatis, next);

        async.waterfall([
            function (cb) {
                //货源量
                async.waterfall([
                    function (cb1) {
                        //    获取公司关系
                        http.sendUserServerNoToken(req, {
                            page: -1,
                            subType: 'PURCHASE'
                        }, config_api_url.user_server_get_company_verify, function (x,y) {
                            if(x){
                                return cb({dev: '账号信息查询失败'})
                            }else{
                                cb1(null, y)
                            }
                        });
                    },
                    function (companyRes, cb1) {
                        async.eachSeries(companyRes.company, function (company, cb10) {
                            extServer.tipPassDemand({
                                user_id: req.decoded.id,
                                company_id: req.decoded.company_id[0],
                                other_company_id: company._id.toString(),
                            }, false, null, req.decoded.role, function (err, countRes) {
                                if(countRes){
                                    supplyStatis.pass_demand_info.push(countRes);
                                    supplyStatis.pass_demand += countRes.count;
                                }
                                cb10();
                            });
                        }, cb1);
                    }
                ], cb);
            },
            function (cb) {
                //计划量
                tipCond = _.extend(tipCond, {
                    user_id: req.decoded.id,
                    company_id: req.decoded.company_id[0],
                    other_company_id: req.decoded.company_id[0]
                });
                extServer.tipPassPlan(tipCond, false, null, cb);
            },
            function (plan_count, cb) {
                supplyStatis.pass_plan = plan_count.count;
                //订单量
                extServer.tipPassOrder(tipCond, false, null, req.decoded.role, cb);

            }, function (order_count, cb) {
                if (order_count) {
                    supplyStatis.pass_order = order_count.count;
                }
                cb();
            }, function (cb) {
                //待指派的订单量
                extServer.tipPassOrder(tipCond, false, null, req.decoded.role, cb, 'special');

            }, function (order_count, cb) {
                if (order_count) {
                    supplyStatis.pass_order_wait = order_count.count;
                }
                //货源量
                extServer.tipDriverDemand(tipCond, false, null, req.decoded.role, cb);
            },
            function (plan, cb) {
                supplyStatis.driver_demand = plan.count || 0;
                //订单量
                extServer.tipDriverOrder(tipCond, false, null, req.decoded.role, cb)
            }
        ], function (err, driver) {
            if (err) return next(err);
            if (driver) {
                supplyStatis.driver_order = driver.count || 0;
            }
            //将total值相加，作为物流企业的角标总数量
            config_common.sendData(req, supplyStatis, next);
        });
    });
    /**
     * 司机首界面的最新数据统计
     */
    api.post('/driver_statis', function (req, res, next) {
        //角色判断
        if (req.decoded.role != config_common.user_roles.TRAFFIC_DRIVER_PRIVATE) {
            return next({dev: '仅限司机', pro: '000002'});
        }
        //条件检出
        //数据操作
        var driverStatis = {
            driver_demand: 0,
            driver_plan: 0,
            driver_order: 0,
            // driver_demand_info: []
        }, tipCond = {};
        async.waterfall([
            function (cb) {
                //货源量
                async.waterfall([
                    function (cb1) {
                        //    获取公司关系
                        extServer.generalFun(req, {
                            source: 'user',
                            db: 'Driver_verify',
                            method: 'getList',
                            query: {
                                find: {
                                    user_id: req.decoded.id //需求方
                                },
                                select: 'company_id'
                            }
                        }, cb1);
                    },
                    function (companyRes, cb1) {
                        if (companyRes && companyRes.length > 0) {
                            async.eachSeries(companyRes, function (company, cb10) {
                                extServer.tipDriverDemand({
                                    user_id: req.decoded.id,
                                    other_company_id: company.company_id
                                }, false, null, req.decoded.role, function (err, countRes) {
                                    if(countRes){
                                        // driverStatis.driver_demand_info.push(countRes);
                                        driverStatis.driver_demand += countRes.count;
                                    }
                                    cb10();
                                });
                            }, cb1);
                        }else{
                            cb1();
                        }
                        //each ,eachService  顺序;
                    }
                ], cb);
            },
            function (cb) {
                //抢单量
                tipCond = _.extend(tipCond, {
                    user_id: req.decoded.id
                });
                extServer.tipDriverPlan(tipCond, false, null, cb)
            },
            function (plan, cb) {
                driverStatis.driver_plan = plan.count || 0;
                //订单量
                extServer.tipDriverOrder(tipCond, false, null, req.decoded.role, cb)
            }
        ], function (err, order) {
            if (err) return next(err);
            driverStatis.driver_order = order.count || 0;
            driverStatis.driver_total = driverStatis.driver_order + driverStatis.driver_plan + driverStatis.driver_demand;
            config_common.sendData(req, driverStatis, next);
        });
    });
    /**
     * 司机挂靠公司的统计
     */
    api.post('/driver_verify_statis', function (req, res, next) {
        //角色判断
        if (req.decoded.role != config_common.user_roles.TRAFFIC_DRIVER_PRIVATE) {
            return next({dev: '仅限司机', pro: '000002'});
        }
        req.body.page = req.body.page || 1;
        //条件检出
        //数据操作
        var driverStatis = {
            // driver_demand: 0,
            // driver_plan: 0,
            // driver_order: 0,
            // driver_demand_info: []
            count: 0,
            exist: false,
            lists: []
        }, tipCond = {};
        async.waterfall([
            function (cb) {
                //货源量
                async.waterfall([
                    function (cb1) {
                        extServer.generalFun(req, {
                            source: 'user',
                            db: 'Driver_verify',
                            method: 'getCount',
                            query: {
                                    user_id: req.decoded.id //需求方
                            }
                        }, cb1);
                    },
                    function (count, cb1) {
                        driverStatis.count = count;
                        driverStatis.exist = count > req.body.page * config_common.entry_per_page;
                        //    获取公司关系
                        extServer.generalFun(req, {
                            source: 'user',
                            db: 'Driver_verify',
                            method: 'getList',
                            query: {
                                find: {
                                    user_id: req.decoded.id //需求方
                                },
                                select: 'company_id'
                                ,skip: (req.body.page-1)*config_common.entry_per_page,
                                limit: config_common.entry_per_page,
                                page: req.body.page
                            }
                        }, cb1);
                    },
                    function (companyRes, cb1) {
                        if (companyRes && companyRes.length > 0) {
                            var uniqCompany=[];
                            async.eachSeries(companyRes, function (company, cb10) {
                                if(uniqCompany.indexOf(company.company_id)==-1){
                                    uniqCompany.push(company.company_id)
                                    async.waterfall([
                                        function (cb100) {
                                            extServer.tipDriverDemand({
                                                user_id: req.decoded.id,
                                                other_company_id: company.company_id
                                            }, false, null, req.decoded.role, cb100);
                                        }, function (countRes, cb100) {
                                            extServer.generalFun(req, {
                                                source: 'user',
                                                db:'Company_traffic',
                                                method:'getOne',
                                                query:{
                                                    find: {
                                                        _id: company.company_id
                                                    },
                                                    select: 'nick_name url_logo verify_phase phone_creator'
                                                }}, function (err, companyInfo) {
                                                if(countRes && companyInfo){
                                                    driverStatis.lists.push(_.extend({}, countRes, companyInfo));
                                                }
                                                cb100();
                                            });
                                        }
                                    ], cb10);
                                }else{
                                    cb10()
                                }
                            }, cb1);
                        }else{
                            cb1();
                        }
                    }
                ], cb);
            }            
        ], function (err, order) {
            if (err) return next(err);
            config_common.sendData(req, driverStatis, next);
        });
    });

    /**
     * 物流查看司机运输，司机需求，司机订单 20170922 作废
     */
    api.post('/2pass_driver_statis', function (req, res, next) {
        //角色判断
        if (config_common.accessRule.pass.indexOf(req.decoded.role)==-1) {
            return next('role_not_allow');
        }
        //条件检出
        //数据操作
        var driverStatis = {
                driver_demand: 0,
                driver_order: 0
            },
            tipCond = {
                user_id: req.decoded.id,
                company_id: req.decoded.company_id[0],
                other_company_id: req.decoded.company_id[0]
            };
        async.waterfall([
            function (cb) {
                //货源量
                extServer.tipDriverDemand(tipCond, false, null, req.decoded.role, cb);
            },
            function (plan, cb) {
                driverStatis.driver_demand = plan.count || 0;
                //订单量
                extServer.tipDriverOrder(tipCond, false, null, req.decoded.role, cb)
            }
        ], function (err, order) {
            if (err) return next(err);
            driverStatis.driver_order = order.count || 0;
            driverStatis.driver_total = driverStatis.driver_order + driverStatis.driver_demand;
            config_common.sendData(req, driverStatis, next);
        });
    });
    /**
     * 交易看运的统计 物流的线路，物流的订单，自己发布货源
     *
     */
    api.post('/trade_pass_statis', function (req, res, next) {
        //角色判断
        if (req.decoded.role != config_common.user_roles.TRADE_ADMIN &&
            req.decoded.role != config_common.user_roles.TRADE_PURCHASE &&
            req.decoded.role != config_common.user_roles.TRADE_SALE) {
            return next({dev: '仅限交易', pro: '000002'});
        }
        //条件检出
        //数据操作
        var tradeStatis = {
            pass_order: 0,    //订单量
            pass_demand: 0    //需求量
        }, tipCond = {
            user_id: req.decoded.id,
            company_id: req.decoded.company_id,
            other_company_id: req.decoded.company_id
        };
        /**
         * 获取 3种单据的更新时间, 然后再统计更新前和更新后的数据;
         */
        async.waterfall([
            function (cb) {
                //需求量
                extServer.tipPassDemand(tipCond, false, config_common.demand_status.effective, req.decoded.role, cb);
            },
            function (tipDemand, cb) {
                if (tipDemand) {
                    tradeStatis.pass_demand = tipDemand.count;
                }
                //订单量
                extServer.tipPassOrder(tipCond, false, config_common.demand_status.effective, req.decoded.role, cb);
            }
        ], function (err, tipOrder) {
            if (err) return next(err);
            if (tipOrder) {
                tradeStatis.pass_order = tipOrder.count;
                tradeStatis.pass_total = tradeStatis.pass_order + tradeStatis.pass_demand;
            }
            config_common.sendData(req, tradeStatis, next);
        });
    });


    //获取指派车辆
    api.post('/assign_driver_list', function (req, res, next) {
        //角色判断
        // req.body.demand_id='59717594f77f882a684eadb6'
        //参数判断 || !req.body.demand_id
        if (!req.body.page || !req.body.scene) {
            return next({dev: 'page,scene参数有误', pro: '000003'});
        }
        //场景判断
        req.body.page = parseInt(req.body.page) || 1;
        //执行操作
        var user_arr, userTmp = [], assign_user;
        async.waterfall([
            function (cb) {
                http.sendUserServerNew(req, {
                    group_id: req.body.group_id,
                    company_id: req.decoded.company_id,
                    page: req.body.page
                }, config_api_url.user_get_trucks_users, cb);
            }, function (users, cb) {
                if (!users) {
                    return cb({dev: '没找到车辆信息', pro: '000004'});
                }
                if (req.body.demand_id) {
                    //获取正在进行中的司机id,进行排除;
                    driverOrderSV.onlyList({
                        find: {
                            demand_id: req.body.demand_id,
                            status: {$nin: [config_common.demand_status.complete]}
                        },
                        select: 'supply_user_id'
                    }, function (err, list) {
                        assign_user = _.pluck(list, 'supply_user_id');
                        cb(null, users);
                    });
                } else {
                    cb(null, users);
                }
            }, function (users, cb) {
                user_arr = users;
                async.eachSeries(users.list, function (user, cb1) {
                    // if(!user.truck || assign_user.indexOf(user.user._id)>-1){
                    if (!user.truck || (req.body.demand_id && assign_user.indexOf(user.user._id) > -1 )) {
                        cb1();
                    } else {
                        var userOne = {
                            user_id: user.user._id,
                            user_logo: user.user.photo_url,
                            real_name: user.user.real_name,
                            role: user.user.role,
                            truck_id: user.truck._id,
                            truck_num: user.truck.number,
                            truck_type: user.truck.type,
                            truck_weight: user.truck.weight,
                            truck_logo: user.truck.che_tou_zhao_url,
                            truck_long: user.truck.long
                        };
                        async.waterfall([
                            function (cb10) {
                                //    获取已运输的单数
                                driverOrderSV.getCount({
                                    supply_user_id: userOne.user_id,
                                    // truck_id: userOne.truck_id,
                                    status: config_common.demand_status.complete
                                }, cb10);

                            }, function (count, cb10) {
                                userOne['tip'] = '已运输货物' + count + '单';
                                //获取未完成且有效的司机订单
                                driverOrderSV.getOne({
                                    find: {
                                        supply_user_id: userOne.user_id,
                                        // truck_id: userOne.truck_id,
                                        status: config_common.demand_status.effective
                                    },
                                    select: 'send_city send_district receive_city receive_district',
                                    sort: {time_creation: -1}
                                }, cb10);
                            }, function (orderRes, cb10) {
                                if (orderRes) {
                                    userOne['tip'] = '忙碌中: ' + orderRes.send_city + orderRes.send_district + '->' + orderRes.receive_city + orderRes.receive_district;
                                }
                                cb10();
                            }
                        ], function (err) {
                            if (err) return next(err);
                            userTmp.push(userOne);
                            cb1();
                        });
                    }
                }, cb);
            }
        ], function (err) {
            user_arr.list = userTmp;
            if (err) {
                return next(err);
            }
            config_common.sendData(req, user_arr, next);
        });

    });


    //获取公司名片 20170922 废弃
    api.post('/2company_card', function (req, res, next) {
        //角色判断
        if (req.decoded.role != config_common.user_roles.TRAFFIC_DRIVER_PRIVATE) {
            return next('not_allow');
        }
        //参数判断
        if (!req.body.scene && !req.body.company_id) {
            return next('invalid_format');
        }
        //场景判断
        //执行操作
        var company_Arr, companyTmp, companyOne = {}, cond = {};
        async.waterfall([
            function (cb) {
                //    公司信息
                cond._id = req.body.company_id;

                http.sendUserServerNew(req, {
                    cond: {find: cond},
                    model: 'Company_traffic',
                    method: 'getOne'
                }, config_api_url.user_server_common, cb);
            }, function (companyRes, cb) {
                if (!companyRes) return cb('company_not_found');
                companyOne = companyRes;
                //线路
                trafficLineSV.getCount({company_id: req.body.company_id}, cb)
            }, function (count, cb) {
                companyOne['line_count'] = count || 0;
                //抢单
                trafficOfferSV.getCount(cond, cb);
            }, function (count, cb) {
                companyOne['offer_count'] = count || 0;
                //订单
                trafficOrderSV.getCount({supply_company_id: req.body.company_id}, cb);
            }, function (count, cb) {
                companyOne['order_count'] = count || 0;
                cb();
            }
        ], function (err) {
            if (err) return next(err);
            config_common.sendData(req, companyOne, next);
        });
    });

    /**
     * 名片下的货源信息查询
     */
    api.post('/card_demand_list', function (req, res, next) {
        var cond = {status: config_common.demand_status.effective, time_validity: {$gt: new Date()}}; //, amount_remain:{$gt:0}
        if (req.body.user_id) {
            cond.demand_user_id = req.body.user_id;
        }
        if (req.body.company_id) {
            cond.demand_company_id = req.body.company_id;
        }
        req.body.page = req.body.page || 1;
        async.waterfall([
            function (cb) {
                trafficDemandSV.getList({
                    find: cond,
                    select: 'demand_user_id demand_company_id send_city send_district send_loc receive_loc receive_city receive_district price_type price can_join amount material time_validity unoffer_list',
                    skip: (req.body.page - 1) * config_common.entry_per_page,
                    limit: req.body.limit || config_common.entry_per_page,
                    sort: config_common.getSortDemandCondition(req.body.sort, req.body.direction),
                    page: req.body.page
                }, cb);
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, result, next);
        });

    });

    /**
     * 个人金融首页
     */
    api.post('/user_credit', function (req, res, next) {
       async.waterfall([
           function (cb) {
               async.parallel({
                   pass: function (cb1) {
                       trafficOrderSV.onlyList({
                           find: {supply_user_id: req.decoded.id},
                           select: 'price_total payment_method status time_update_step'
                       }, cb1)
                   },
                   driver: function (cb1) {
                       driverOrderSV.onlyList({
                           find: {demand_user_id: req.decoded.id},
                           select: 'price_total payment_method status time_update_step tip_prices replenish'
                       }, cb1)
                   },
                   infoprice: function (cb1) {
                       var tmpPrice={}
                       infoPriceSV.getOne({
                           find: {
                               user_id: {$in: req.decoded.id},
                               type: 'all'
                           }
                       }, function (x,y) {
                           tmpPrice.price_total = y && y.price_total ? y.price_total : 0;
                           tmpPrice.send_price=y && y.send_price ? y.send_price : 0;
                           extServer.generalFun(req, {
                               source: 'user',
                               db:'Percentage_cash',
                               method:'getOne',
                               query:{
                                   find: {
                                       company_id: {$in: req.decoded.company_id}
                                   }
                               }
                           }, function (x,y1) {
                               tmpPrice.in_discount = y1 && y1[(req.decoded.role).toLowerCase()] ? y1[(req.decoded.role).toLowerCase()] : 100;
                               tmpPrice.in_discount = '信息费提成比'+tmpPrice.in_discount+'%'
                               cb1(null, tmpPrice);
                           })
                       }
                       )
                   }
               }, cb)

           },
           function (lists, cb) {
               // [{price_total: 33 payment_method:'all_cash'}]
               var pass_price = {all_cash: 0, all_goods: 0, partition: 0, credit: 0, total: 0},
                   pass_count = {ineffective: 0, effective: 0, complete: 0, cancelled: 0},
                   driver_price = {all_cash: 0, all_goods: 0, partition: 0, credit: 0, total: 0, tip_prices:0, red_card: 0},
                   driver_count = {ineffective: 0, effective: 0, complete: 0, cancelled: 0},
                   pass_chart = {}, driver_chart = {}, tip_chart={};
               _.each(lists.pass, function (a) {
                   pass_price[a.payment_method] = config_common.rscDecimal('add', pass_price[a.payment_method],a.price_total, 2);
                   pass_price['total'] = config_common.rscDecimal('add', pass_price['total'],a.price_total, 2);
                   pass_count[a.status] = pass_count[a.status] + 1;
               });
               _.each(lists.driver, function (b) {
                   driver_price[b.payment_method] = config_common.rscDecimal('add', driver_price[b.payment_method],b.price_total, 2);
                   driver_price['total'] = config_common.rscDecimal('add', driver_price['total'], b.price_total, 2);
                   driver_price['tip_prices']=config_common.rscDecimal('add', driver_price['tip_prices'], b.tip_prices, 2);
                   console.log('red_card',b['replenish']['red_card'])
                   if(b['replenish'] && b['replenish']['red_card']){

                       driver_price['red_card']= config_common.rscDecimal('add',driver_price['red_card'], b['replenish']['red_card'], 2)
                   }
                   driver_count[b.status] = driver_count[b.status] + 1;
               });
               var yearMonth = config_common.getYearMonth(req.body.time_chart);
               _.each(yearMonth.monthArr , function (a) {
                   pass_chart[a] = 0;
                   _.each(lists.pass, function (b) {
                       var list_time = config_common.getYearMonth(b.time_update_step).dayStr;
                       if(a == list_time){
                           pass_chart[a] =  config_common.rscDecimal('add', pass_chart[a] , b.price_total, 2)
                       }
                   })
               });
               _.each(yearMonth.monthArr , function (a) {
                   driver_chart[a] = 0;
                   tip_chart[a]=0;
                   _.each(lists.driver, function (b) {
                       var list_time = config_common.getYearMonth(b.time_update_step).dayStr;
                       if(a == list_time){
                           driver_chart[a] =  config_common.rscDecimal('add', driver_chart[a] , b.price_total, 2);
                           tip_chart[a]=config_common.rscDecimal('add', tip_chart[a] , b.tip_prices, 2);
                       }
                   })
               });

               cb(null, {
                   pass_price: pass_price,
                   pass_count: pass_count,
                   driver_price: driver_price,
                   driver_count: driver_count,
                   pass_chart : pass_chart,
                   driver_chart : driver_chart,
                   tip_chart: tip_chart,
                   infoprice:lists.infoprice
               })
           }

       ], function (err, result) {
           if(err){
               return next(err);
           }
           config_common.sendData(req, result, next);
       });
    });
    api.post('/driver_credit', function (req, res, next) {
        var driver_price = {all_cash: '0', all_goods: '0', partition: '0', credit: '0', total: '0', tip_prices: '0'},
            driver_count = {ineffective: 0, effective: 0, complete: 0, cancelled: 0, send: 0, receive: 0}, driver_chart_obj = {}, driver_chart=[];
        async.waterfall([
            function (cb) {
                driverOrderSV.onlyList({
                    find: {supply_user_id: req.decoded.id},
                    select: 'price_total payment_method status time_update_step step tip_prices'
                }, cb)
            },
            function (lists, cb) {
                _.each(lists, function (b) {
                    if(b.status != config_common.demand_status.cancelled){
                        driver_price[b.payment_method] = config_common.rscDecimal('add', driver_price[b.payment_method],b.price_total, 2);
                        driver_price['tip_prices'] = config_common.rscDecimal('add', driver_price['tip_prices'], b.tip_prices, 2);
                        driver_price['total'] = config_common.rscDecimal('add', driver_price['total'], b.price_total, 2);
                    }
                    driver_count[b.status] = driver_count[b.status] + 1;
                    if(b.step < 2.5 && b.status != config_common.demand_status.cancelled){
                        driver_count['send'] = driver_count['send'] + 1;
                    }
                    if(b.step>=2.5 && b.step < 5 && b.status != config_common.demand_status.cancelled){
                        driver_count['receive'] = driver_count['receive'] + 1;
                    }
                });
               var yearMonth = config_common.getYearMonth(req.body.time_chart);
                _.each(yearMonth.monthArr , function (a) {
                    driver_chart_obj[a] = '0';
                    _.each(lists, function (b) {
                        var list_time = config_common.getYearMonth(b.time_update_step).dayStr;
                        if(a == list_time && b.status != config_common.demand_status.cancelled){
                            driver_chart_obj[a] =  config_common.rscDecimal('add', driver_chart_obj[a] , b.price_total, 2)
                        }
                    })
                });
                _.each(driver_chart_obj,function (value, key) {
                    driver_chart.push({
                        date: key,
                        sum: value
                    })
                });
                
                driver_price['all_cash'] = config_common.rscDecimal('mul', config_common.rscDecimal('div',driver_price['all_cash'], driver_price['total']), 100, 1);
                driver_price['all_goods'] = config_common.rscDecimal('mul', config_common.rscDecimal('div',driver_price['all_goods'], driver_price['total']), 100, 1);
                driver_price['partition'] = config_common.rscDecimal('mul', config_common.rscDecimal('div',driver_price['partition'], driver_price['total']), 100, 1);
                driver_price['credit'] = config_common.rscDecimal('mul', config_common.rscDecimal('div',driver_price['credit'], driver_price['total']), 100, 1);
                cb(null, { 
                    driver_price:  driver_price, 
                    driver_count:  driver_count,
                    driver_chart: driver_chart //driver_chart_obj
                })
            }

        ], function (err, result) {
            if(err){
                return next(err);
            }
            config_common.sendData(req, result, next);
        });
    });
    /**
     * 返回页面中的数字
     */
    api.post('/notice_count', function (req, res, next) {
       async.waterfall([
           function(cb9){
               async.parallel({
                   get_assign_list: function (cb1) {
                       var assign_result = {};
                       async.waterfall([
                           function (cb) {
                               //货源量
                               var demand_count_cond = {status: config_common.demand_status.effective, time_validity: {$gt: new Date()},
                                   unoffer_list : {$nin: req.decoded.company_id}};//已接单的需要排除};
                               async.waterfall([
                                   function (cb1) {
                                       demand_count_cond.$or = [];
                                       http.sendUserServerNew(req, {
                                           user_id: req.decoded.id,
                                           type: 'SALE'
                                       }, config_api_url.user_get_trade_circle,function(err, user){
                                           extServer.generalFun(req, {
                                               source: 'user',
                                               db:'Company_relation',
                                               method:'getList',
                                               query:{
                                                   find: {
                                                       other_id: {$in: req.decoded.company_id}, //req.decoded.company_id[0],
                                                       other_type:'TRAFFIC'
                                                   },
                                                   select: 'self_id'
                                               }}, function(err, company){
                                               if(company && user){
                                                   demand_count_cond.$or = [{demand_company_id: {$in: _.pluck(company, 'self_id')}}, {demand_user_id: {$in: user}}]
                                               } if(!company && user){
                                                   demand_count_cond.$or = [{demand_user_id: {$in: user}}]; //cond.demand_user_id = {$in: user};
                                               }else if(company && !user){
                                                   demand_count_cond.$or = [{demand_company_id: {$in: _.pluck(company, 'self_id')}}]; // cond.demand_company_id = {$in: _.pluck(company, 'self_id')};
                                               }
                                               demand_count_cond.$or.push({platform_company: { $in: req.decoded.company_id}});
                                               cb1();
                                           });
                                       });
                                   },
                                   function (cb1) {
                                       trafficDemandSV.getCount(demand_count_cond, cb1);
                                   }
                               ], cb);
                           },
                           function (count, cb) {
                               assign_result['demand_count'] = count || 0;
                               //参与量
                               trafficPlanSV.getCount({
                                   user_id: req.decoded.id,
                                   status: config_common.demand_status.effective
                               }, cb);
                           },
                           function (count, cb) {
                               assign_result['plan_count'] =  count || 0;
                               cb(null, assign_result)
                           }
                       ], cb1);
                   },
                   pass_list_truck: function (cb1) {
                       var truckInfo={};
                    async.waterfall([
                        function (cb) {
                            //订单数
                            trafficOrderSV.getCount({
                                supply_company_id: req.decoded.company_id[0],
                                status: config_common.demand_status.effective,
                                step: {$gte:3, $lt: 4}
                            }, cb);
                        },
                        function (count, cb) {
                            truckInfo['order_count'] = count || 0;
                            //司机参与数
                            driverDemandSV.onlyList({
                                find: {
                                    demand_user_id: req.decoded.id,
                                    status: config_common.demand_status.effective,
                                    time_validity : {$gte: new Date()}
                                },
                                select: 'demand_user_id unoffer_list'
                            },cb);
                        },
                        function(list, cb){
                            if(list){
                                driverDemand_id = _.pluck(JSON.parse(JSON.stringify(list)), '_id');
                            }else{
                                driverDemand_id = [];
                            }
                            truckInfo['demand_count'] = driverDemand_id.length;
                            driverPlanSV.getCount({
                                demand_user_id: req.decoded.id,
                                demand_id: {$in: driverDemand_id},
                                status: config_common.demand_status.ineffective
                            }, cb);
                        },
                        function (count, cb) {
                            truckInfo['assign_count'] = count || 0;
                            cb(null, truckInfo);
                        }
                    ], cb1)
                   }
               }, cb9);
           }
       ], function(x, y){

        config_common.sendData(req, y || 0, next);
       })
    });
    /*
    * 司机挂靠界面参数不同查询结果不同,商业智能, 挂靠物流, 物流公司
    * */
    api.post('/driver_guide', function (req, res, next) {
        var sv,
            cond={
                status: config_common.demand_status.effective
            },
            demand_cond={
                unoffer_list:{$nin: [req.decoded.id]},//没参与的
                status: config_common.demand_status.effective,
                time_validity: {$gt: new Date()}
            },
            relation_company,
            plan_cond={status: config_common.demand_status.ineffective, user_id: req.decoded.id},
            order_cond={supply_user_id: req.decoded.id},
            demandDynamic=[],
            dynamicCond={
                unoffer_list:{$nin: [req.decoded.id]}   //
                ,verify_driver:{$nin: [req.decoded.id]}
                ,time_validity: {$gte: new Date()},
                status: 'effective'
            };

        req.body.page = parseInt(req.body.page) || 1;
        // if(req.body.sv =='recommend_demand'){
        //     demand_cond.platform_driver = {$in: [req.decoded.id]};
        // }else{
        //     demand_cond.verify_driver= {$in: [req.decoded.id]};
        // }
        if(req.decoded.role != config_common.user_roles.TRAFFIC_DRIVER_PRIVATE){
            return next({dev:'限司机'});
        }
        if(req.body.line_id){
            req.body.line_id=_.isArray(req.body.line_id)? req.body.line_id: req.body.line_id.split(',')
        }
        async.waterfall([
            function (cb) {
                var flag = true;
                if(!req.body.sv){
                    flag = false;
                   return cb({dev: '缺少参数'});
                }
                if(flag){
                    cb();
                }
            },
            function(cb){
                if(!req.body.search_company){
                    //获取司机挂靠的公司
                    extServer.generalFun(req, {
                        source: 'user',
                        db:'Driver_verify',
                        method:'getList',
                        query: {
                            find: {
                                user_id: req.decoded.id
                            },
                            select: 'company_id'
                        }
                    },cb);
                }else{
                    cb(null, null);
                }
            },
            function(list, cb) {
                relation_company=  _.pluck(JSON.parse(JSON.stringify(list)), 'company_id');
                if (list) {
                    cond.demand_company_id=
                        demand_cond.demand_company_id=
                            plan_cond.demand_company_id=
                                order_cond.demand_company_id=
                                    dynamicCond.demand_company_id={$in: relation_company};
                }else{
                    cond.demand_company_id=
                        demand_cond.demand_company_id=
                            plan_cond.demand_company_id=
                                order_cond.demand_company_id=
                                    dynamicCond.demand_company_id=req.body.search_company;
                }
                // if (req.body.search_company) {
                //     demand_cond.demand_company_id=
                //         plan_cond.demand_company_id=
                //             order_cond.demand_company_id= req.body.search_company;
                //     cond.demand_company_id = req.body.search_company;
                // }
                switch (req.body.sv) {
                    // case 'recommend_demand':
                    //     sv = driverDemandSV;
                    //     cond.platform_driver = {$in: [req.decoded.id]};
                    //     cb();
                    //     break;
                    case 'driver_demand':
                        sv = driverDemandSV;
                        if (req.body.search_company) {
                            cond.demand_company_id= req.body.search_company;
                        }
                        // cond.$or = [{verify_driver: {$in: [req.decoded.id]}}, {unoffer_list: {$in: [req.decoded.id]}}];
                        cond.verify_driver = {$in: [req.decoded.id]};
                        cond.time_validity = {$gte: new Date()};

                        if(req.body.line_id && _.isArray(req.body.line_id)){
                            trafficLineSV.lineArrDemand(req.body.line_id, function (x,y) {
                                if(y){
                                    cond.$or = y;
                                    demand_cond.$or=y;
                                    dynamicCond.$or=y;
                                    cb();
                                }else{
                                    cb();
                                }
                            }, req)
                        }else{
                            cb();
                        }
                        
                        break;

                    case 'driver_plan':
                        sv = driverPlanSV;
                        if (req.body.search_company) {
                            cond.demand_company_id = req.body.search_company;
                        }
                        cond.user_id = req.decoded.id;
                        cond.status = config_common.demand_status.ineffective;
                        cb();
                        break;
                    case 'order_tip':
                        sv = driverOrderSV;
                        cond.supply_user_id = req.decoded.id;
                        cond.step=0.5;
                        cb();
                        break;
                    case 'order_send':
                        sv = driverOrderSV;
                        cond.supply_user_id = req.decoded.id;
                        cond.step={$gte: 1, $lt: 2.5};
                        cb();
                        break;
                    case 'order_receive':
                        sv = driverOrderSV;
                        cond.supply_user_id = req.decoded.id;
                        cond.step={$gte: 2.5, $lt: 5};
                        cb();
                        break;
                    case 'order_complete':
                        sv = driverOrderSV;
                        cond.supply_user_id = req.decoded.id;
                        cond.status = config_common.demand_status.complete;
                        cb();
                        break;
                    default:
                        return cb({dev:'sv超出范围'})
                }
            },
            function (cb) {
                if(req.body.sv=='driver_demand'){
                    // verify_driver, 接单列表中都不存在的人, verify_driver, platform_driver，unoffer_list都不存在自己
                    if(req.body.search_company){
                        relation_company= [req.body.search_company]
                    }
                    sv.specialList({
                        find: dynamicCond,
                        // {
                        //     unoffer_list:{$nin: [req.decoded.id]}
                        //     ,verify_driver:{$nin: [req.decoded.id]}
                        //     ,demand_company_id: {$in: relation_company}
                        //     ,time_validity: {$gte: new Date()},
                        //     status: 'effective'
                        // },
                        sort: {time_creation: -1},
                        skip: (req.body.page - 1) * config_common.driver_per_page,
                        limit: config_common.driver_per_page,
                        page: req.body.page
                        // ,select: 'index unoffer_list verify_driver'
                    }, cb, req)
                }else{
                    cb(null, null);
                }
            },
            function(dynamic, cb){
                demandDynamic=dynamic? dynamic:[];
                async.parallel({
                    getList: function(cb1){
                        sv.specialList({
                            find: cond,
                            sort: {time_creation: -1},
                            skip: (req.body.page - 1) * config_common.driver_per_page,
                            limit: config_common.driver_per_page,//config_common.driver_per_page,
                            page: req.body.page
                            // ,select: 'index'
                        }, cb1, req)
                    }
                    ,
                    statis: function (cb1) {
                        async.parallel({
                            driver_demand: function(cb2){
                                driverDemandSV.getCount(demand_cond, cb2);
                            },
                            driver_plan: function(cb2){
                                driverPlanSV.getCount(plan_cond, cb2);
                            },
                            order_tip: function(cb2){
                                order_cond.step=0.5;
                                order_cond.status=config_common.demand_status.effective;
                                driverOrderSV.getCount(order_cond, cb2);
                            },
                            order_send: function(cb2){
                                order_cond.step={$gte:1, $lt: 2.5};
                                order_cond.status=config_common.demand_status.effective;
                                driverOrderSV.getCount(order_cond, cb2);
                            },
                            order_receive: function(cb2){
                                order_cond.step={$gte: 2.5, $lt: 4};
                                order_cond.status=config_common.demand_status.effective;
                                driverOrderSV.getCount(order_cond, cb2);
                            },
                            order_complete: function(cb2){
                                delete order_cond.step;
                                order_cond.status=config_common.demand_status.complete;
                                driverOrderSV.getCount(order_cond, cb2);
                            },
                            red_card_order: function(cb2){
                                redCardOrderSV.tipGetOne(req, {
                                    user_id: req.decoded.id,
                                    send_company_id: req.body.search_company ? req.body.search_company : {$in: relation_company},
                                    status: config_common.demand_status.effective
                                }, true, cb2);
                            }
                        }, cb1);
                    }
                }, cb)

            }
        ], function (err, result) {
            if(err){
                return next(err);
            }
            config_common.sendData(req, _.extend({}, result.statis, result.getList, {demandDynamic: demandDynamic}), next);
        })
    });
    api.post('/driver_count', function(req, res, next){
        var cond={
            status: config_common.demand_status.effective,
            // verify_driver:{$in: [req.decoded.id]}
            unoffer_list:{$nin: [req.decoded.id]},
            time_validity: {$gt: new Date()}
        },
        plan_cond={status: config_common.demand_status.ineffective, user_id: req.decoded.id},
        order_cond={supply_user_id: req.decoded.id},
            relation_company=[];

        if(req.decoded.role != config_common.user_roles.TRAFFIC_DRIVER_PRIVATE){
            return next({dev:'限司机'});
        }
        if(req.body.line_id) {
            req.body.line_id = _.isArray(req.body.line_id) ? req.body.line_id : req.body.line_id.split(',')
        }

        async.waterfall([
            function (cb) {
                if(!req.body.search_company){
                    //获取司机挂靠的公司
                    extServer.generalFun(req, {
                        source: 'user',
                        db:'Driver_verify',
                        method:'getList',
                        query: {
                            find: {
                                user_id: req.decoded.id
                            },
                            select: 'company_id'
                        }
                    },cb);
                }else{
                    cb(null, null);
                }
            },
            function (list, cb) {

                if (list) {
                    relation_company = _.pluck(JSON.parse(JSON.stringify(list)), 'company_id');
                    cond.demand_company_id = plan_cond.demand_company_id = order_cond.demand_company_id = {$in: relation_company};
                }
                if (req.body.search_company) {
                    cond.demand_company_id = plan_cond.demand_company_id = order_cond.demand_company_id = req.body.search_company;
                }
                if (req.body.line_id && _.isArray(req.body.line_id)) {
                    trafficLineSV.lineArrDemand(req.body.line_id, function (x, y) {
                        if (y) {
                            cond.$or = y;
                            cb();
                        } else {
                            cb();
                        }
                    }, req)
                } else {
                    cb();
                }
            },
            function(cb){
                async.parallel({
                    driver_demand: function(cb1){
                        cond.time_validity={$gt: new Date()};
                        driverDemandSV.getCount(cond, cb1);
                    },
                    driver_plan: function(cb1){
                        driverPlanSV.getCount(plan_cond, cb1);
                    },
                    order_tip: function(cb1){
                        order_cond.step=0.5;
                        order_cond.status=config_common.demand_status.effective;
                        driverOrderSV.getCount(order_cond, cb1);
                    },
                    order_send: function(cb1){
                        order_cond.step={$gte:1, $lt: 2.5};
                        order_cond.status=config_common.demand_status.effective;
                        driverOrderSV.getCount(order_cond, cb1);
                    },
                    order_receive: function(cb1){
                        order_cond.step={$gte: 2.5, $lt: 4};
                        order_cond.status=config_common.demand_status.effective;
                        driverOrderSV.getCount(order_cond, cb1);
                    },
                    order_complete: function(cb1){
                        delete order_cond.step;
                        order_cond.status=config_common.demand_status.complete;
                        driverOrderSV.getCount(order_cond, cb1);
                    },
                    red_card_order: function(cb1){
                        redCardOrderSV.tipGetOne(req, {
                            user_id: req.decoded.id,
                            send_company_id: req.body.search_company ? req.body.search_company : {$in: relation_company},
                            status: config_common.demand_status.effective
                        }, true, cb1);
                    }
                }, cb);
            }
        ], function (x,y) {
            if(x){
                return next(x)
            }
            config_common.sendData(req, y, next);
        })

    });
    /*
     * 物流界面参数不同查询结果不同 认证和好友，认证公司
     * */
    api.post('/pass_guide', function (req, res, next) {
        if(config_common.accessRule.pass.indexOf(req.decoded.role)==-1){
            return next({dev:'限物流'});
        }
        var cond={},demand_cond={
            // unoffer_list:{$nin: req.decoded.company_id},//verify_company : {$in: req.decoded.company_id},
            unoffer_list:{$nin: [req.decoded.id]},//verify_company : {$in: req.decoded.company_id},
            status: {$nin: [config_common.demand_status.cancelled, config_common.demand_status.complete]},
            time_validity: {$gt: new Date()}
        },plan_cond={},order_cond={},order=[],sv, dynamicCond={
            // unoffer_list:{$nin: req.decoded.company_id},//没参与的
            unoffer_list:{$nin: [req.decoded.id]},//没参与的人
            verify_company : {$nin: req.decoded.company_id},
            status: config_common.demand_status.effective,
            time_validity: {$gt: new Date()}
        }, demandDynamic=[];
        req.body.page = parseInt(req.body.page) || 1;
        if(req.body.line_id){
            req.body.line_id=_.isArray(req.body.line_id)? req.body.line_id: JSON.parse(req.body.line_id)
        }
        if(req.body.search_time){
            cond.time_creation = dynamicCond.time_creation=demand_cond.time_creation = {$lt: new Date(req.body.search_time)};
        }
        async.waterfall([
            function (cb) {
                var flag = true;
                if(!req.body.step){
                    flag = false;
                    return cb({dev: '缺少参数'});
                }
                if(req.body.verify){
                    req.body.verify=_.isArray(req.body.verify)?req.body.verify: JSON.parse(req.body.verify)
                }
                if(flag){
                    cb();
                }
            },
            function(cb){
                //货源圈id获取
                
                if(!req.body.verify || req.body.verify.length==0){
                    async.parallel({
                        user: function(cb2){
                            http.sendUserServerNew(req, {
                                    user_id: req.decoded.id,
                                    type: 'SALE'
                                }, config_api_url.user_get_trade_circle,cb2);
                        },
                        company: function (cb2) {
                            extServer.generalFun(req, {
                                source: 'user',
                                db:'Company_relation',
                                method:'getList',
                                query:{
                                    find: {
                                        other_id: {$in: req.decoded.company_id}, //req.decoded.company_id[0],
                                        other_type:'TRAFFIC'
                                    },
                                    select: 'self_id'
                                }}, cb2);
                        }
                    },cb);
                }else{
                    cond.demand_company_id=
                        demand_cond.demand_company_id=
                            plan_cond.demand_company_id=
                                order_cond.demand_company_id=
                                    dynamicCond.demand_company_id={$in:req.body.verify};
                    cb(null, null);
                }
            },
            function(verify, cb){
                //构造需求、接单、订单的条件
                    plan_cond.user_id=req.decoded.id,
                        order_cond.supply_user_id=req.decoded.id;
                if(verify){
                    if(verify.company){
                        cond.demand_company_id=
                            demand_cond.demand_company_id=
                                plan_cond.demand_company_id=
                                    order_cond.demand_company_id=
                                        dynamicCond.demand_company_id = {$in: _.pluck(verify.company, 'self_id')};
                    }
                }
                switch (req.body.step){
                    case 'traffic_demand':
                        sv = trafficDemandSV;
                        cond.verify_company={$in: req.decoded.company_id};
                        cond.unoffer_list={$nin: [req.decoded.id]};
                        cond.time_validity = {$gt: new Date()};
                        cond.status= {$nin: [config_common.demand_status.cancelled]};
                        //20180602 取消小红点
                        if(req.body.verify && req.body.verify.length>0){
                            extServer.tipPassDemand({
                                user_id: req.decoded.id,
                                company_id: req.decoded.company_id[0],
                                other_company_id: {$in: req.body.verify},
                            }, false, null, req.decoded.role, function () {})
                        }
                        async.waterfall([
                            function(cb1){
                                //20180516 按线路、产品分类查询需求单记录，且更改统计
                                if(req.body.line_id && _.isArray(req.body.line_id) && req.body.line_id[0]){
                                    trafficLineSV.lineArrDemand(req.body.line_id, function (x,y) {
                                        if(y){
                                            cond.$or=[], demand_cond.$or=[], dynamicCond.$or=[];
                                            _.each(y, function (a) {
                                                demand_cond.$or.push(a);
                                                cond.$or.push(a);
                                                dynamicCond.$or.push(a)
                                            });
                                            cb1();
                                        }else{
                                            cb1();
                                        }
                                    }, req)
                                }else{
                                    cb1();
                                }
                            }
                            ,function (cb1) {
                                if(req.body.find_category){
                                    // cond.find_category={$in: [req.body.find_category]}
                                    cond.find_category={$regex: req.body.find_category};
                                }else{
                                    cb1()
                                }
                            }
                        ], cb)

                        break;
                    case 'traffic_plan':
                        sv = trafficPlanSV;
                        cond.user_id = req.decoded.id;
                        cb();
                        break;
                    case 'order_3':
                        sv = trafficOrderSV;
                        cond.status=config_common.demand_status.effective;
                        cond.supply_user_id = req.decoded.id;
                        cond.step=3;
                        cb();
                        break;
                    case 'order_effective':
                        sv = trafficOrderSV;
                        cond.status=config_common.demand_status.effective;
                        cond.supply_user_id = req.decoded.id;
                        // cond.step = 3;
                        cb();
                        break;
                    case 'order_complete':
                        sv = trafficOrderSV;
                        cond.status=config_common.demand_status.complete;
                        cond.supply_user_id = req.decoded.id;
                        // cond.step = 3.5;
                        cb();
                        break;
                    default:
                        return cb({dev: 'sv参数超出范围'});

                }
            },
            function(cb){
                if(req.body.step=='traffic_demand'){
                    // if(req.body.search_company){
                    //     relation_company= [req.body.search_company]
                    // }
                    sv.specialList({
                        find: dynamicCond,
                        sort: {time_creation: -1},
                        skip: (req.body.page - 1) * config_common.driver_per_page,
                        limit: config_common.driver_per_page,
                        page: req.body.page
                    }, cb, req)
                }else{
                    cb(null, null);
                }
            },
            function(dynamic, cb){
                demandDynamic=dynamic? dynamic:[];
                async.parallel({
                    getList: function (cb2) {
                        sv.specialList({
                            find: cond,
                            sort: {time_creation: -1},
                            skip: (req.body.page - 1) * config_common.entry_per_page,
                            limit: config_common.entry_per_page,
                            page: req.body.page
                        }, cb2, req)
                    },
                    statis: function (cb2) {
                        async.parallel({
                            traffic_demand:function(cb3){
                                trafficDemandSV.getCount(demand_cond,cb3);
                            },
                            traffic_plan:function(cb3){
                                trafficPlanSV.getCount(plan_cond, cb3);
                            },
                            order_3:function(cb3){
                                order_cond.status=config_common.demand_status.effective;
                                order_cond.step=3;
                                trafficOrderSV.getCount(order_cond, cb3);
                            },
                            order_effective:function(cb3){
                                delete order_cond.step;
                                order_cond.status=config_common.demand_status.effective;
                                trafficOrderSV.getCount(order_cond, cb3);
                            },
                            order_complete:function(cb3){
                                delete order_cond.step;
                                order_cond.status=config_common.demand_status.complete;
                                trafficOrderSV.getCount(order_cond, cb3);
                            },
                        }, cb2)
                    }
                }, cb);
            },
        ], function (err, result) {
            if(err){
                return next(err);
            }
            config_common.sendData(req, (_.extend({}, result.getList, result.statis, {demandDynamic:demandDynamic})), next);
        })
    });

    /*
    * 物流-车辆引导页
    * */
    api.post('/pass_driver_guide', function (req, res, next) {
        if(config_common.accessRule.pass.indexOf(req.decoded.role)==-1){
            return next({dev:'限物流'});
        }
        var
            cond={
                // status: config_common.demand_status.effective
            },
            line_cond={status: config_common.demand_status.effective, role: config_common.user_roles.TRAFFIC_DRIVER_PRIVATE},
            demand_cond={status: {$in:[config_common.demand_status.effective, config_common.demand_status.complete]}},
            order_cond={status: config_common.demand_status.effective},
            order=[],relation_list=[],
            sv;
        req.body.page = parseInt(req.body.page) || 1;
        
        async.waterfall([
            function (cb) {
                var flag = true;
                if (!req.body.step) {
                    flag = flase;
                    return cb({dev: 'step参数缺少'});
                }
                if (req.body.user_id && _.isObject(req.body.user_id)) {
                    req.body.user_id = _.isArray(req.body.user_id) ? req.body.user_id : JSON.parse(req.body.user_id);
                }
                demand_cond.demand_user_id=order_cond.demand_user_id=req.decoded.id;

                if(flag){
                    cb();
                }
            },
            function(cb){
                if(req.body.group_id){
                    extServer.generalFun(req, {
                        source: 'user',
                        db:'Relation_group_user',
                        method:'getList',
                        query:{
                            find: {
                                group_id: req.body.group_id,
                                member_id: {$exists: true},
                                company_id: req.decoded.company_id[0]
                            },
                            select: 'member_id'
                        }}, cb);
                }else{
                    extServer.generalFun(req, {
                        source: 'user',
                        db:'Driver_verify',
                        method:'getList',
                        query:{
                            // find: {company_id : {$in: req.decoded.company_id}}
                            find: {approve_id: req.decoded.id}
                        }}, cb);
                }

            },
            function(list,cb){
                if(req.body.group_id){
                    relation_list=_.pluck(list||[], 'member_id');
                }else{
                    relation_list=_.pluck(list||[], 'user_id');
                }
                line_cond.user_id={$in: relation_list};
                demand_cond.$or=[{verify_driver: {$in : relation_list}}, {unoffer_list: {$in : relation_list}}];//verify_driver={$in: relation_list};
                order_cond.supply_user_id={$in: relation_list};

                switch (req.body.step){
                    case 'demand_effective':
                        sv = driverDemandSV;
                        cond.demand_user_id = req.decoded.id;
                        cond.$or=[{verify_driver: {$in : relation_list}}, {unoffer_list: {$in : relation_list}}];
                        cond.status= {$in:[config_common.demand_status.effective, config_common.demand_status.complete]};
                        cb();
                        break;
                    case 'order_effective':
                        sv = driverOrderSV;
                        cond.status=config_common.demand_status.effective;
                        cond.demand_user_id = req.decoded.id;
                        cond.supply_user_id = {$in : relation_list};
                        cb();
                        break;
                    case 'order_complete':
                        sv = driverOrderSV;
                        cond.status=config_common.demand_status.complete;
                        cond.demand_user_id = req.decoded.id;
                        cond.supply_user_id = {$in : relation_list};
                        cb();
                        break;
                    case 'line_effective':
                        sv = trafficLineSV;
                        cond.status = config_common.demand_status.effective;
                        cond.role = config_common.user_roles.TRAFFIC_DRIVER_PRIVATE;
                        cond.user_id = {$in : relation_list};
                        if(req.body.start_province && req.body.start_province.length>0 || req.body.end_province && req.body.end_province.length>0){
                            cond.$or=config_common.lineSearch(req);
                            line_cond.$or=config_common.lineSearch(req);
                        }
                        cb();
                        break;
                    default:
                        return cb({dev: 'sv参数超出范围'});
                }

            },
            function(cb){
                async.parallel({
                    getList: function(cb1){
                        sv.specialList({
                            find: cond,
                            sort: {time_creation: -1},
                            skip: (req.body.page - 1) * config_common.entry_per_page,
                            limit: config_common.entry_per_page,
                            page: req.body.page
                        }, cb1, req)
                    },
                    statis: function (cb1) {
                        async.parallel({
                            line_effective:function(cb2){
                                //获取与物流线路相似的司机线路数量
                                trafficLineSV.specialCount({find:line_cond}, cb2, req);
                            },
                            demand_effective: function (cb2) {
                                driverDemandSV.getCount(demand_cond, cb2);
                            },
                            order_effective:function (cb2) {
                                order_cond.status=config_common.demand_status.effective;
                                driverOrderSV.getCount(order_cond, cb2);
                            },
                            order_complete:function (cb2) {
                                order_cond.status=config_common.demand_status.complete;
                                driverOrderSV.getCount(order_cond, cb2);
                            },
                        }, cb1)
                    },
                    driver: function (cb1) {
                        if(req.body.step=='line_effective'){
                            trafficLineSV.getCount({
                                user_id: {$in: relation_list},
                                status: config_common.demand_status.effective
                            }, function (x,y) {
                                cb1(null, {truck_count: relation_list.length, truck_line_count: y ? y: 0})
                            })
                        }else{
                            cb1();
                        }
                    }
                }, cb)
            },

        ], function (err, result) {
            if(err){
                return next(err);
            }
            config_common.sendData(req, _.extend({}, result.getList, result.statis, result.driver), next);
            // config_common.sendData(req, result, next);
        });
    });
    /*
    * 物流-车辆引导页的count
    * */
    api.post('/pass_driver_count', function (req, res, next) {
        if(config_common.accessRule.pass.indexOf(req.decoded.role)==-1){
            return next({dev:'限物流'});
        }
        var line_cond={status: config_common.demand_status.effective, role: config_common.user_roles.TRAFFIC_DRIVER_PRIVATE},
            demand_cond={},
            order_cond={},relation_list=[];
        req.body.page = parseInt(req.body.page) || 1;

        async.waterfall([
            function (cb) {
                var flag = true;
                if (!req.body.step) {
                    flag = flase;
                    return cb({dev: 'step参数缺少'});
                }
                if (req.body.user_id && _.isObject(req.body.user_id)) {
                    req.body.user_id = _.isArray(req.body.user_id) ? req.body.user_id : JSON.parse(req.body.user_id);
                }
                demand_cond.demand_user_id=order_cond.demand_user_id=req.decoded.id;

                if(flag){
                    cb();
                }
            },
            function(cb){
                if(req.body.group_id){
                    extServer.generalFun(req, {
                        source: 'user',
                        db:'Relation_group_user',
                        method:'getList',
                        query:{
                            find: {
                                group_id: req.body.group_id,
                                member_id: {$exists: true},
                                company_id: req.decoded.company_id[0]
                            },
                            select: 'member_id'
                        }}, cb);
                }else{
                    extServer.generalFun(req, {
                        source: 'user',
                        db:'Driver_verify',
                        method:'getList',
                        query:{
                            // find: {company_id : {$in: req.decoded.company_id}} //20180602 挂靠关系人
                            find: {approve_id: req.decoded.id}
                        }}, cb);
                }

            },
            function(list,cb){
                if(req.body.group_id){
                    relation_list=_.pluck(list||[], 'member_id');
                }else{
                    relation_list=_.pluck(list||[], 'user_id');
                }
                line_cond.user_id={$in: relation_list};
                // demand_cond.verify_driver={$in: relation_list};
                demand_cond.$or=[{verify_driver:{$in: relation_list}}, {unoffer_list:{$in: relation_list}}];
                order_cond.supply_user_id={$in: relation_list};
                async.parallel({
                    line_effective:function(cb2){
                        trafficLineSV.specialCount({find:line_cond}, cb2,req);
                    },
                    demand_effective: function (cb2) {
                        driverDemandSV.getCount(demand_cond, cb2);
                    },
                    order_effective:function (cb2) {
                        order_cond.status=config_common.demand_status.effective;
                        driverOrderSV.getCount(order_cond, cb2);
                    },
                    order_complete:function (cb2) {
                        order_cond.status=config_common.demand_status.complete;
                        driverOrderSV.getCount(order_cond, cb2);
                    },
                }, cb)
            },

        ], function (err, result) {
            if(err){
                return next(err);
            }
            config_common.sendData(req, result, next);
            // config_common.sendData(req, {cond:cond, demand_cond: demand_cond, line_cond: line_cond, order_cond:order_cond, result: result}, next);
        });
    });

    /*
    * 交易-物流引导页 list
    * */
    api.post('/trade_pass_guide', function (req, res, next) {
        if(req.decoded.role != config_common.user_roles.TRADE_ADMIN && req.decoded.role != config_common.user_roles.TRADE_PURCHASE && req.decoded.role != config_common.user_roles.TRADE_SALE){
            return next({dev:'限交易'});
        }
        var
            cond={
                // status: config_common.demand_status.effective
            },
            line_cond={status: config_common.demand_status.effective, role: {$in: config_common.accessRule.pass}},
            demand_cond={},//{status: config_common.demand_status.effective},
            order_cond={status: config_common.demand_status.effective},
            order=[],relation_list=[],
            sv;
        req.body.page = parseInt(req.body.page) || 1;

        async.waterfall([
            function (cb) {
                var flag = true;
                if (!req.body.step) {
                    flag = false;
                    return cb({dev: 'step参数缺少'});
                }
                demand_cond.demand_user_id=req.decoded.id;
                order_cond.demand_user_id=req.decoded.id;
                if(flag){
                    cb();
                }
            },
            function(cb){
                if(req.body.company_id){
                    cb(null, null)
                }else{
                    //查询合作企业
                    extServer.generalFun(req, {
                        source: 'user',
                        db:'Company_relation',
                        method:'getList',
                        query:{
                            find: {
                                self_id: req.decoded.company_id,
                                other_type:'TRAFFIC'
                            },
                            select: 'other_id'
                        }}, cb);
                }
            },
            function(list,cb){
                if(list){
                    if(req.body.step!='recommend_line'){
                        line_cond.company_id={$in: _.pluck(list, 'other_id')};
                        demand_cond.$or=[{verify_company:{$in: _.pluck(list, 'other_id')}}, {unoffer_list:{$in: _.pluck(list, 'other_id')}}];
                        order_cond.supply_company_id={$in: _.pluck(list, 'other_id')};
                    }else{
                        line_cond.company_id={$nin: _.pluck(list, 'other_id')};
                        //物流需求单存在平台推荐
                        demand_cond.$or=[{platform_company:{$nin: _.pluck(list, 'other_id')}}, {unoffer_list:{$nin: _.pluck(list, 'other_id')}}];
                        order_cond.supply_company_id={$nin: _.pluck(list, 'other_id')};
                    }
                }else{
                    line_cond.company_id=req.body.company_id;
                    // demand_cond.verify_company={$in: [req.body.company_id]};
                    demand_cond.$or=[{verify_company: {$in: [req.body.company_id]}}, {unoffer_list: {$in: [req.body.company_id]}}];
                    order_cond.supply_company_id=req.body.company_id;
                }
                switch (req.body.step){
                    case 'recommend_line':
                        sv = trafficLineSV;
                        cond.status=config_common.demand_status.effective;
                        cond.company_id={$nin: _.pluck(list, 'other_id')};
                        cb();
                        break;
                    case 'line':
                        sv = trafficLineSV;
                        cond.status=config_common.demand_status.effective;
                        if(req.body.company_id){
                            cond.company_id=req.body.company_id;
                        }else{
                            cond.company_id={$in: _.pluck(list, 'other_id')};
                        }
                        //增加对销售区域，采购区域，产品的筛选
                        if(req.body.pass_type || req.body.passPrice_id){
                            trafficLineSV.trade_recommend_line(req, function(x,y){
                                cond=_.extend(cond, trafficLineSV.pathLink(y).mix);
                                // return cb({dev: cond})
                                line_cond=_.extend(line_cond, trafficLineSV.pathLink(y).mix);
                                cb()
                            });
                        }else if(req.body.start_province && req.body.start_province.length>0 || req.body.end_province&&req.body.end_province.length>0){
                            cond.$or=config_common.lineSearch(req);
                            line_cond.$or=cond.$or
                            cb();
                        }else{
                            cb();
                        }
                        break;
                    case 'traffic_demand':
                        sv = trafficDemandSV;
                        cond.demand_user_id=req.decoded.id;
                        if(req.body.company_id){
                            // cond.verify_company={$in: [req.body.company_id]};
                            cond.$or=[{verify_company: {$in: [req.body.company_id]}}, {unoffer_list: {$in: [req.body.company_id]}}];
                        }else{
                            cond.$or=[{verify_company:{$in: _.pluck(list, 'other_id')}}, {unoffer_list:{$in: _.pluck(list, 'other_id')}}];
                            // cond.verify_company={$in: _.pluck(list, 'other_id')};
                        }
                        cb();
                        break;
                    case 'order_effective':
                        sv = trafficOrderSV;
                        cond.demand_user_id=req.decoded.id;
                        cond.status=config_common.demand_status.effective;
                        if(req.body.company_id){
                            cond.supply_company_id=req.body.company_id;
                        }else{
                            cond.supply_company_id={$in: _.pluck(list, 'other_id')};
                        }
                        cb();
                        break;
                    case 'order_complete':
                        sv = trafficOrderSV;
                        cond.demand_user_id=req.decoded.id;
                        cond.status=config_common.demand_status.complete;
                        if(req.body.company_id){
                            cond.supply_company_id=req.body.company_id;
                        }else{
                            cond.supply_company_id={$in: _.pluck(list, 'other_id')};
                        }
                        cb();
                        break;
                    default:
                        return cb({dev: 'sv参数超出范围'});
                }

            },
            function(cb){
                async.parallel({
                    getList: function(cb1){
                        sv.specialList({
                            find: cond,
                            sort: {time_creation: -1},
                            skip: (req.body.page - 1) * config_common.entry_per_page,
                            limit: config_common.entry_per_page,
                            page: req.body.page
                        }, function (x,y) {
                            cb1(x,y)
                        }, req)
                    },
                    statis: function (cb1) {
                        async.parallel({
                            line:function(cd2){
                               trafficLineSV.getCount(line_cond, cd2);
                            },
                            traffic_demand: function(cd2){
                                trafficDemandSV.getCount(demand_cond, cd2);
                            },
                            order_effective:function (cb2) {
                                order_cond.status=config_common.demand_status.effective;
                                trafficOrderSV.getCount(order_cond, cb2);
                            },
                            order_complete:function (cb2) {
                                order_cond.status=config_common.demand_status.complete;
                                trafficOrderSV.getCount(order_cond, cb2);
                            },
                        }, cb1)
                    }
                }, cb)
            },

        ], function (err, result) {
            if(err){
                return next(err);
            }
            config_common.sendData(req, _.extend({}, result.getList, result.statis, {cond: cond}), next);
            // config_common.sendData(req, result, next);
        });
    });
    /*
     * 交易-物流引导页 count
     * */
    api.post('/trade_pass_count', function (req, res, next) {
        if(req.decoded.role != config_common.user_roles.TRADE_ADMIN && req.decoded.role != config_common.user_roles.TRADE_PURCHASE && req.decoded.role != config_common.user_roles.TRADE_SALE){
            return next({dev:'限交易'});
        }
        var
            cond={
                // status: config_common.demand_status.effective
            },
            line_cond={status: config_common.demand_status.effective, role: {$in: config_common.accessRule.pass}},
            demand_cond={},//{status: config_common.demand_status.effective},
            order_cond={status: config_common.demand_status.effective},
            order=[],relation_list=[],
            sv;
        req.body.page = parseInt(req.body.page) || 1;

        async.waterfall([
            function (cb) {
                var flag = true;
                if (!req.body.step) {
                    flag = false;
                    return cb({dev: 'step参数缺少'});
                }

                demand_cond.demand_user_id = order_cond.demand_user_id=req.decoded.id;

                if(flag){
                    cb();
                }
            },
            function(cb){
                if(req.body.company_id){
                    cb(null, null)
                }else{
                    extServer.generalFun(req, {
                        source: 'user',
                        db:'Company_relation',
                        method:'getList',
                        query:{
                            find: {
                                self_id: req.decoded.company_id,
                                other_type:'TRAFFIC'
                            },
                            select: 'other_id'
                        }}, cb);
                }
            },
            function(list,cb){
                if(list){
                    line_cond.company_id={$in: _.pluck(list, 'other_id')};
                    // demand_cond.verify_company={$in: _.pluck(list, 'other_id')};
                    demand_cond.$or=[{verify_company:{$in: _.pluck(list, 'other_id')}}, {unoffer_list:{$in: _.pluck(list, 'other_id')}}];
                    order_cond.supply_company_id={$in: _.pluck(list, 'other_id')};
                }else{
                    line_cond.company_id=req.body.company_id;
                    // demand_cond.verify_company={$in: [req.body.company_id]};
                    demand_cond.$or=[{verify_company:{$in: [req.body.company_id]}}, {unoffer_list:{$in: [req.body.company_id]}}];
                    order_cond.supply_company_id=req.body.company_id;
                }
                async.parallel({
                    line:function(cd2){
                        trafficLineSV.getCount(line_cond, cd2);
                    },
                    traffic_demand: function(cd2){
                        trafficDemandSV.getCount(demand_cond, cd2);
                    },
                    order_effective:function (cb2) {
                        order_cond.status=config_common.demand_status.effective;
                        trafficOrderSV.getCount(order_cond, cb2);
                    },
                    order_complete:function (cb2) {
                        order_cond.status=config_common.demand_status.complete;
                        trafficOrderSV.getCount(order_cond, cb2);
                    },
                }, cb)
            },

        ], function (err, result) {
            if(err){
                return next(err);
            }
            var trade = [{name: 'line', count:0}, {name: 'traffic_demand', count:0},{name: 'order_effective', count:0}, {name: 'order_complete', count:0}]
            _.each(trade, function (a) {
                a.count = result[a.name]
            })
            config_common.sendData(req, trade, next);
        });
    });
    api.post('/driver_red_card', function(req, res, next){
        // config_common.sendData(req, [], next);
        redCardOrderSV.tipGetOne(req, {
            user_id: req.decoded.id,
            status: config_common.demand_status.effective
        }, true, function (x,y) {
            if(x){
                return next(x);
            }
            config_common.sendData(req, y, next);
        });
    })
    api.post('/pay_price_carry', function(req, res, next){
        // config_common.sendData(req, [], next);
            async.waterfall([
                function (cb) {
                    // req.body={
                    //     amount:1,
                    //     packageName:"com.rsc.business",
                    //     pay_method:"Alipay",
                    //     pay_surplus:"withdeawals",
                    //     payee_account:"对方的身份",
                    //     payee_real_name:"而非"
                    // }
                    if(!req.body.amount || !req.body.packageName || !req.body.pay_method || !req.body.pay_surplus || !req.body.payee_account ||!req.body.payee_real_name){
                        return cb({dev: '参数不足'})
                    }
                    infoPriceSV.getOne({
                        find: {user_id: req.decoded.id, type: 'all'}
                    }, cb)
                }, function (info_price, cb) {
                    if(!info_price){
                        return cb({dev: '暂无资金'})
                    }
                    var waitPrice = config_common.rscDecimal('sub', info_price.price_total, info_price.send_price, 1);
                    if(waitPrice > 0){
                        http.sendPayClientNew(req, req.body, config_api_url.pay_price_carry, function (x,y) {
                            if(y){
                                info_price.send_price=config_common.rscDecimal('add', info_price.send_price, req.body.amount);
                                info_price.save(cb)
                            }else{
                                return cb({dev: x})
                            }
                        })
                    }else{
                        return cb({dev: '可提现资金不足'})
                    }

                }
            ], function (x,y) {
                if(x){
                    return next(x);
                }
                config_common.sendData(req, y, next);
            })
    })

    return api;
};
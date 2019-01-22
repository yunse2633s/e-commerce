/**
 * Created by Administrator on 17/4/15.
 */
var async = require('async');
var _ = require('underscore');

var config_common = global.config_common;

var lib_shop = global.lib_shop;
var lib_count = global.lib_count;

module.exports = function (app, express) {

    var api = express.Router();

    /**
     * 获取推送的条数
     * other_type  采购或者销售
     */
    api.post('/shua_lock', function (req, res, next) {
        global.lib_PriceOffer.update({
            find: {},
            set: {lock: true}
        }, function (err, data) {
            config_common.sendData(req, data, next);
        })
    });

    // 拦截非授权请求
    api.use(require('../../middlewares/mid_verify_user')());

    /**
     * 获取推送的条数
     * other_type  采购或者销售
     */
    api.post('/get', function (req, res, next) {
        async.waterfall([
            function (cb) {
                global.lib_User.getWorkRelationListAll(req, cb);
            }
        ], function (err, result) {
            if (err) return next(err);
            config_common.sendData(req, result.length, next);
        });
    });

    /**
     * 获取计划和竞价的个数
     */
    api.post('/get_offerAgain', function (req, res, next) {
        lib_count.get_offerAgain(req.decoded, function (err, result) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, result, next);
        });
    });

    /**
     * 获取单人据上次刷新前添加的条数
     */
    api.post('/get_plan_count', function (req, res, next) {
        lib_count.get_planCount(req, function (err, result) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, eval(_.values(result).join('+')), next);
        });
    });

    /**
     * app角标
     */
    api.post('/get_trade_count', function (req, res, next) {
        async.parallel({
            offerAgain: function (cb) {
                lib_count.get_planCount(req, cb);
            },
            offer: function (cb) {
                lib_count.getOfferRemind(req, cb);
            },
            demand: function (cb) {
                lib_count.getDemandRemind(req, cb);
            },
            order: function (cb) {
                lib_count.getOrderRemind(req.decoded, 'demand', cb);
            },
            supply: function (cb) {
                lib_count.getOrderRemind(req.decoded, 'supply', cb);
            }
        }, function (err, result) {
            if (err) return next(err);
            result = _.reduce(_.values(result), function (num, resultObj) {
                num += eval(_.values(resultObj).join('+'));
                return num;
            }, 0);
            config_common.sendData(req, {all_total: result}, next);
        });
    });

    /**
     * 交易角标
     */
    api.post('/get_deal_count', function (req, res, next) {
        async.parallel({
            offerAgain: function (cb) {
                lib_count.get_planCount(req, cb);
            },
            offer: function (cb) {
                lib_count.getOfferRemind(req, cb);
            },
            demand: function (cb) {
                lib_count.getDemandRemind(req, cb);
            }
        }, function (err, result) {
            if (err) return next(err);
            result = _.reduce(_.values(result), function (num, resultObj) {
                num += eval(_.values(resultObj).join('+'));
                return num;
            }, 0);
            config_common.sendData(req, result, next);
        });
    });

    /**
     * 简报
     */
    api.post('/get_count', function (req, res, next) {
        var result = {offerDJ: {}, offerJJ: {}, demand: {}};
        var arr = [];
        if (req.body.type == "sell") {
            async.waterfall([
                function (cb) {
                    global.lib_PriceOffer.getList({
                        find: {
                            user_id: req.decoded.id,
                            type: global.config_model.offer_type.DJ
                        },
                        select: "browse_offer"
                    }, cb);
                },
                function (data, cb) {
                    //    data  报价已浏览的id数组
                    result.offerDJ.browse_offer = _.flatten(_.pluck(data, 'browse_offer')).length;
                    global.lib_DemandOrder.getCount({
                        offer_id: {
                            $in: _.pluck(data, '_id')
                        },
                        status: global.config_model.order_status.ineffective
                    }, cb);
                },
                function (count, cb) {
                    //报价待确认数
                    result.offerDJ.ineffective = count;
                    global.lib_PriceOffer.getList({
                        find: {
                            user_id: req.decoded.id,
                            type: {$ne: global.config_model.offer_type.DJ},
                            status: global.config_model.offer_status.published
                        },
                        select: "browse_offer"
                    }, cb);
                },
                function (data, cb) {
                    result.offerJJ.browse_offer = _.flatten(_.pluck(data, 'browse_offer')).length;
                    global.lib_PriceOffer.getList({
                        find: {
                            user_id: req.decoded.id,
                            type: {$ne: global.config_model.offer_type.DJ},
                            status: global.config_model.offer_status.published
                        },
                        select: "list_offer"
                    }, cb);
                },
                function (data, cb) {
                    async.eachSeries(data, function (one_dara, callback) {
                        async.waterfall([
                            function (cbk) {
                                global.lib_OfferAgain.getOne({find: {offer_id: one_dara._id.toString()}}, cbk);
                            },
                            function (offer_data, cbk) {
                                if (offer_data) {
                                    global.lib_DemandOrder.getOne({find: {offerAgain_id: offer_data._id.toString()}}, cbk);
                                } else {
                                    cbk(null, null);
                                }
                            },
                            function (orderdata, cbk) {
                                if (!orderdata) {
                                    arr.push(one_dara);
                                }
                                cbk();
                            }
                        ], callback)
                    }, cb);
                },
                function (cb) {
                    result.offerJJ.list_offer = _.flatten(_.pluck(arr, 'list_offer')).length;
                    global.lib_Demand.getCount({
                        list_offer: {$in: [req.decoded.id]},
                        has_order: {$nin: [req.decoded.id]},
                        status: "published"
                    }, cb);
                },
                function (count, cb) {
                    result.demand.count = count;
                    global.lib_Demand.getCount({
                        has_order: {$nin: [req.decoded.id]},
                        list_offer: {$in: [req.decoded.id]},
                        status: "expired"
                    }, cb);
                },
                function (count, cb) {
                    result.demand.expired = count;
                    global.lib_PriceOffer.getCount({
                        user_id: req.decoded.id,
                        type: global.config_model.offer_type.DJ,
                        status: global.config_model.offer_status.expired
                    }, cb);
                },
                function (count, cb) {
                    result.offerDJ.expired = count;
                    global.lib_PriceOffer.getCount({
                        user_id: req.decoded.id,
                        type: {$ne: global.config_model.offer_type.DJ},
                        status: global.config_model.offer_status.expired
                    }, cb);
                }
            ], function (err, count) {
                if (err) return next(err);
                result.offerJJ.expired = count;
                // result.demand.count = count;
                config_common.sendData(req, result, next);
            })
        } else if (req.body.type == "purchase") {
            async.waterfall([
                function (cb) {
                    global.lib_Demand.getList({
                        find: {
                            user_id: req.decoded.id,
                            status: "published"
                        }
                    }, cb);
                },
                function (data, cb) {
                    result.demand.browse_offer = _.flatten(_.pluck(data, 'browse_offer')).length;
                    async.eachSeries(data, function (one_dara, callback) {
                        async.waterfall([
                            function (cbk) {
                                global.lib_DemandOffer.getOne({find: {demand_id: one_dara._id.toString()}}, cbk);
                            },
                            function (offer_data, cbk) {
                                if (offer_data) {
                                    global.lib_DemandOrder.getOne({find: {demandOffer_id: offer_data._id.toString()}}, cbk);
                                } else {
                                    cbk(null, null);
                                }
                            },
                            function (orderdata, cbk) {
                                if (!orderdata) {
                                    arr.push(one_dara);
                                }
                                cbk();
                            }
                        ], callback)
                    }, cb);
                },
                function (cb) {
                    result.demand.list_offer = _.flatten(_.pluck(arr, 'list_offer')).length;
                    global.lib_shop.getCount({user_demand_id: req.decoded.id}, cb);
                },
                function (count, cb) {
                    result.offerDJ.count = count;
                    global.lib_PriceOffer.getCount({
                        list_offer: {$in: [req.decoded.id]},
                        has_order: {$nin: [req.decoded.id]},
                        status: "published"
                    }, cb);
                },
                function (count, cb) {
                    result.offerJJ.count = count;
                    global.lib_PriceOffer.getCount({
                        status: 'expired',
                        user_id: req.decoded.id,
                        type: {'$in': ['JJ', 'DjJJ']},
                    }, cb);
                },
                function (count, cb) {
                    result.offerJJ.expired = count;

                    global.lib_Demand.getCount({
                        user_id: req.decoded.id,
                        status: "expired"
                    }, cb);
                }
            ], function (err, count) {
                if (err) return next(err);
                //result.offerJJ.count = count;

                result.offerDJ.ineffective = 0;

                result.demand.expired = count
                config_common.sendData(req, result, next);
            })
        } else {
            return next('invalid_format');
        }
    });

    api.post('/get_goods_count', function (req, res, next) {
        var obj = {
            user_server_common: '/api/server/common/get', // 自定义查询物流
        };
        //var result = {supply: {}, demand: {}};
        var result = [];
        async.waterfall([
            function (cb) {
                var cond = {
                    user_supply_id: req.decoded.id,
                    step: {$in: [2, 3]},
                    is_assign: true,
                    payment_style: "CIF"
                }
                if (req.body.company_id) {
                    cond.company_demand_id = req.body.company_id;
                }
                global.lib_DemandOrder.getCount(cond, cb);
            },
            function (count, cb) {
                result.push({
                    name: 'supply',
                    count: count
                });
                //result.supply = count;
                var cond = {
                    user_demand_id: req.decoded.id,
                    step: {$in: [2, 3]},
                    is_assign: true,
                    payment_style: "FOB"
                }
                if (req.body.company_id) {
                    cond.company_supply_id = req.body.company_id;
                }
                global.lib_DemandOrder.getCount(cond, cb);
            }
        ], function (err, count) {
            if (err) return next(err);
            result.push({
                name: 'demand',
                count: count
            });
            //result.demand = count;
            config_common.sendData(req, result, next);
        })
    });

    /**
     * 管理页面 公司订单数据
     */
    api.post('/get_count_order', function (req, res, next) {
        var result = {SALE: {}, PURCHASE: {}, TRAFFIC: {}};
        var obj = {
            user_server_common: '/api/server/common/get', // 自定义查询物流
        };
        var userData;
        //现在的时间
        var start = new Date(new Date(new Date().toLocaleDateString()).getTime());
        //今日0点
        var end = new Date(new Date(new Date().toLocaleDateString()).getTime() + 24 * 60 * 60 * 1000 - 1);
        async.waterfall([
            function (cb) {
                global.lib_User.getUserOne({find: {_id: req.decoded.id}}, cb);
            },
            function (user, cb) {
                userData = user;
                global.lib_DemandOrder.getCount(_.extend((userData.role == 'TRADE_ADMIN' && userData.company_id ) ? {company_supply_id: userData.company_id} : {user_supply_id: userData._id}, {status: 'ineffective'}), cb);
                //global.lib_DemandOrder.getCount({user_supply_id: req.decoded.id, status: 'ineffective'}, cb);
            },
            function (count, cb) {
                result.SALE.ineffective = count;
                global.lib_DemandOrder.getCount(_.extend((userData.role == 'TRADE_ADMIN' && userData.company_id) ? {company_supply_id: userData.company_id} : {user_supply_id: userData._id}, {status: 'effective'}), cb);

                // global.lib_DemandOrder.getCount({user_supply_id: req.decoded.id, status: 'effective'}, cb);
            },
            function (count, cb) {
                result.SALE.effective = count;
                global.lib_DemandOrder.getCount(_.extend(userData.role == 'TRADE_ADMIN' ? {company_supply_id: userData.company_id} : {user_supply_id: userData._id}, {status: 'complete'}), cb);
                //global.lib_DemandOrder.getCount({user_supply_id: req.decoded.id, status: 'complete'}, cb);
            },
            function (count, cb) {
                result.SALE.complete = count;
                global.lib_DemandOrder.getCount(_.extend(userData.role == 'TRADE_ADMIN' ? {company_demand_id: userData.company_id} : {user_demand_id: userData._id}, {status: 'ineffective'}), cb);
                //global.lib_DemandOrder.getCount({user_demand_id: req.decoded.id, status: 'ineffective'}, cb);
            },
            function (count, cb) {
                result.PURCHASE.ineffective = count;
                global.lib_DemandOrder.getCount(_.extend(userData.role == 'TRADE_ADMIN' ? {company_demand_id: userData.company_id} : {user_demand_id: userData._id}, {status: 'effective'}), cb);
                // global.lib_DemandOrder.getCount({user_demand_id: req.decoded.id, status: 'effective'}, cb);
            },
            function (count, cb) {
                result.PURCHASE.effective = count;
                global.lib_DemandOrder.getCount(_.extend(userData.role == 'TRADE_ADMIN' ? {company_demand_id: userData.company_id} : {user_demand_id: userData._id}, {status: 'complete'}), cb);
                // global.lib_DemandOrder.getCount({user_demand_id: req.decoded.id, status: 'complete'}, cb);
            },
            function (count, cb) {
                result.PURCHASE.complete = count;
                if (req.decoded.role == 'TRADE_ADMIN') {
                    var cond = {
                        demand_company_id: userData.company_id, status: 'effective'
                    }
                } else {
                    var cond = {
                        demand_user_id: userData._id, status: 'effective'
                    }
                }
                global.http.sendTrafficServer({
                    method: 'getCount',
                    cond: cond,
                    model: 'TrafficOrder'
                }, obj.user_server_common, cb);
            },
            function (count, cb) {
                result.TRAFFIC.effective = count;
                if (userData.role == 'TRADE_ADMIN') {
                    var cond = {demand_company_id: userData.company_id, status: 'complete'}
                } else {
                    var cond = {demand_user_id: userData._id, status: 'complete'}
                }
                global.http.sendTrafficServer({
                    method: 'getCount',
                    cond: cond,//{demand_user_id: userData._id, status: 'complete'},
                    model: 'TrafficOrder'
                }, obj.user_server_common, cb);
            },
            function (count, cb) {
                result.TRAFFIC.complete = count;
                //查询今日发车数
                // (1)查询到自己今日的采购订单和今日的报价订单，
                // (2)然后根据订单id查询自己相关的发车书
                global.lib_DemandOrder.getList({find: _.extend((userData.role == 'TRADE_ADMIN' && userData.company_id) ? {company_supply_id: userData.company_id} : {user_supply_id: userData._id}, {status: 'effective'})}, cb);
            },
            function (list, cb) {
                global.http.sendTrafficServer({
                    method: 'getCount',
                    cond: {
                        index_trade: {$in: _.pluck(list, 'index')},
                        time_creation: {
                            $gte: start,
                            $lte: end
                        }
                    },
                    model: 'TrafficDriverOrder'
                }, obj.user_server_common, cb);
            },
            function (count, cb) {
                result.SALE.driver = count;
                global.lib_DemandOrder.getList({find: _.extend(userData.role == 'TRADE_ADMIN' ? {company_demand_id: userData.company_id} : {user_demand_id: userData._id}, {status: 'effective'})}, cb);
            },
            function (list, cb) {
                global.http.sendTrafficServer({
                    method: 'getCount',
                    cond: {
                        index_trade: {$in: _.pluck(list, 'index')},
                        time_creation: {
                            $gte: start,
                            $lte: end
                        }
                    },
                    model: 'TrafficDriverOrder'
                }, obj.user_server_common, cb);
            },
            function (count, cb) {
                result.PURCHASE.driver = count;
                cb();
            }
        ], function (err) {
            if (err) return next(err);
            config_common.sendData(req, result, next);
        })
    });

    /**
     * 功能：设置推送提醒数量的吨数
     * 参数：constant:数字
     */
    api.post('/set_push_count', function (req, res, next) {
        if (!_.isBoolean(req.body.open)) {
            return next('invalid_format');
        }
        if (!req.body.constant || !_.isNumber(req.body.constant)) {
            return next('invalid_format');
        }
        if (req.decoded.role !== 'TRADE_ADMIN') {
            return next('invalid_role');
        }
        async.waterfall([
            function (cb) {
                global.lib_orderAmount.getOne({find: {company_id: req.decoded.company_id}}, cb);
            },
            function (data, cb) {
                if (data) {
                    data.constant = req.body.constant;
                    data.open = req.body.open;
                    data.save(cb);
                } else {
                    global.lib_orderAmount.add({
                        company_id: req.decoded.company_id,
                        open: req.body.open,
                        constant: req.body.constant
                    }, cb);
                }
            }
        ], function (err, content, count) {
            if (err) return next(err);
            config_common.sendData(req, content, next);
        });
    });

    /**
     * 功能：得到设置的推送提醒数量的吨数
     * 参数：
     */
    api.post('/get_push_count', function (req, res, next) {
        async.waterfall([
            function (cb) {
                global.lib_orderAmount.getOne({find: {company_id: req.decoded.company_id}}, cb);
            }
        ], function (err, content) {
            if (err) return next(err);
            if (!content) {
                content = {constant: 500, open: true};
            }
            config_common.sendData(req, content, next);
        });
    });

    return api;

};


/**
 * Created by Administrator on 2018\4\12 0012.
 */
var async = require('async');
var _ = require('underscore');

var config_common = global.config_common;
var lib_DemandOrder = global.lib_DemandOrder;
var mw = require('./middleware');
var config_model = global.config_model;
var lib_priceOfferCity = require('../libs/lib_priceOfferCity');
var config_error = global.config_error;
/**
 * 功能:根据参数得到相关的查询条件
 * 参数：(1)req
 */

//报价行情
exports.getCount_dj = function (req, time, callback) {
    if (req.body.company_id === "business") {
        req.body.company_id = "";
    }
    var cond = {type: 'DJ', status: {$ne: 'expired'}};
    var company_info;
    var arr = [];
    async.waterfall([
        //1，收集报价行情id
        function (cb) {
            if (req.decoded.company_id) {
                global.lib_User.getCompanyOne({find: {_id: req.decoded.company_id}}, cb);
            } else {
                global.lib_User.getUserOne({find: {_id: req.decoded.id}}, cb);
            }
        },
        function (company, cb) {
            company_info = company;
            if (req.body.company_id) {
                //查询到所有的好友的id
                getWorkSale(req.decoded.id, req.body.company_id, 'SALE', cb);
            } else {
                getFriend(req.decoded.id, {type: 'SALE'}, cb);
            }
        },
        function (arr, cb) {
            cond.user_id = {$in: arr, $ne: req.decoded.id};
            if (company_info) {
                getProduces(arr, "", company_info.buy, cb);
            } else {
                getProduces(arr, "", ["gangtie", "kuangshi", "zaishengziyuan", "meijiao"], cb);
            }
        },
        function (ids, cb) {
            if (time != '') {
                cond.time_creation = {$gt: time}
            }
            cond._id = {$in: ids};
            cond.company_id = {$ne: req.decoded.company_id};
            global.lib_PriceOffer.getCount(cond, cb);
        },
        function (count, cb) {
            arr.push({
                chn: '新报价',
                eng: 'dj',
                count: count,
                lev: 1
            });
            cb();
        },
        function (cb) {
            if (req.body.company_id) {
                var query = {
                    user_demand_id: req.decoded.id,
                    order_id: '',
                    company_supply_id: req.body.company_id
                };
            } else {
                var query = {
                    user_demand_id: req.decoded.id,
                    order_id: ''
                };
            }
            if (time != '') {
                query.time_creation = {$gt: time}
            }
            global.lib_shop.getCount(query, cb);
        },
        function (count, cb) {
            arr.push({
                chn: '购物车',
                eng: 'shop',
                count: count,
                lev: 2
            });
            cb();
        },
        function (cb) {
            var query = lib_DemandOrder.getQueryByType('PURCHASE', req.decoded.id);
            if (req.body.company_id) query = _.extend(global.middleware.getOtherCompanyQueryByType(req.body.type, req.body.company_id), query);
            var user_server_common = '/api/server/common/get';
            async.eachSeries([{$in: ['ineffective', 'cancelled']}, 'effective', 'complete'], function (data, cbk) {
                query.status = data;
                async.waterfall([
                    function (cbk2) {
                        global.http.sendUserServer({
                            method: 'getOne',
                            cond: {find: {_id: query.user_demand_id}},
                            model: 'User_trade'
                        }, user_server_common, cbk2);
                    },
                    function (userInfo, cbk2) {
                        if (userInfo && userInfo.role == 'TRADE_ADMIN' && userInfo.company_id) {
                            global.http.sendUserServer({
                                method: 'getList',
                                cond: {find: {company_id: userInfo.company_id}},
                                model: 'User_trade'
                            }, user_server_common, cbk2);
                        } else {
                            cbk2(null, null);
                        }
                    },
                    function (users, cbk2) {
                        if (users) {
                            query.user_demand_id = {
                                $in: _.map(_.pluck(users, '_id'), function (num) {
                                    return num.toString()
                                })
                            };
                            query.company_demand_id = users[0].company_id;
                        }
                        cbk2();
                    },
                    function (cbk2) {
                        query.order_origin = 'DJ';
                        if (time != '') {
                            query.time_creation = {$gt: time}
                        }
                        lib_DemandOrder.getCount(query, cbk2);
                    },
                    function (count, cbk2) {
                        var obj = {
                            ineffective: ['待确认', 3],
                            effective: ['进行中', 4],
                            complete: ['已完成', 5],
                        };
                        if (_.isObject(data)) {
                            arr.push({
                                chn: obj['ineffective'][0],
                                eng: 'ineffective',
                                count: count,
                                lev: obj['ineffective'][1]
                            });
                        } else {
                            arr.push({
                                chn: obj[data][0],
                                eng: data,
                                count: count,
                                lev: obj[data][1]
                            });
                        }
                        cbk2();
                    }
                ], cbk)
            }, cb);
        },
        function (cb) {
            cb(null, arr);
        }
    ], callback)
};
//竞价行情   
exports.getCount_jj = function (req, time, callback) {
    if (req.body.company_id === "business") {
        req.body.company_id = "";
    }
    var cond = {type: {$in: ['DjJJ', 'JJ']}, status: {$ne: 'expired'}};
    var company_info;
    var arr = [];
    async.waterfall([
        function (cb) {
            if (req.decoded.company_id) {
                global.lib_User.getCompanyOne({find: {_id: req.decoded.company_id}}, cb);
            } else {
                global.lib_User.getUserOne({find: {_id: req.decoded.id}}, cb);
            }
        },
        function (company, cb) {
            company_info = company;
            if (req.body.company_id) {
                //查询到所有合作公司
                getWorkSale(req.decoded.id, req.body.company_id, 'SALE', cb);
            } else {
                //查到所有好友
                getFriend(req.decoded.id, {type: 'SALE'}, cb);
            }
        },
        function (arr, cb) {
            cond.user_id = {$in: arr, $ne: req.decoded.id};
            if (company_info) {
                getProduces(arr, "", company_info.buy, cb);
            } else {
                getProduces(arr, "", ["gangtie", "kuangshi", "zaishengziyuan", "meijiao"], cb);
            }
        },
        function (ids, cb) {
            cond._id = {$in: ids};
            cond.list_offer = {$ne: [req.decoded.id]};
            cond.company_id = {$ne: req.decoded.company_id};
            if (time != '') {
                cond.time_creation = {$gt: time}
            }
            global.lib_PriceOffer.getCount(cond, cb);
        },
        function (count, cb) {
            arr.push({
                chn: '新竞价',
                eng: 'jj',
                count: count,
                lev: 1
            });
            cb();
        },
        function (cb) {
            if (req.body.company_id) {
                global.lib_OfferAgain.getList({
                    find: {user_demand_id: req.decoded.id, company_supply_id: req.body.company_id}
                }, cb);
            } else {
                global.lib_OfferAgain.getList({
                    find: {user_demand_id: req.decoded.id}
                }, cb);
            }
        },
        function (data, cb) {
            var ids = _.pluck(data, 'offer_id');
            if (time != '') {
                global.lib_PriceOffer.getCount({
                    _id: {$in: ids},
                    status: {$in: ['published', 'expired']},
                    time_creation: {$gt: time}
                }, cb);
            } else {
                global.lib_PriceOffer.getCount({_id: {$in: ids}, status: {$in: ['published', 'expired']}}, cb);
            }
        },
        function (count, cb) {
            arr.push({
                chn: '已参与',
                eng: 'cy',
                count: count,
                lev: 2
            });
            cb();
        },
        function (cb) {
            var query = lib_DemandOrder.getQueryByType('PURCHASE', req.decoded.id);
            if (req.body.company_id) query = _.extend(global.middleware.getOtherCompanyQueryByType(req.body.type, req.body.company_id), query);
            var user_server_common = '/api/server/common/get';
            async.eachSeries([{$in: ['cancelled', 'ineffective']}, 'effective', 'complete'], function (data, cbk) {
                query.status = data;
                async.waterfall([
                    function (cbk2) {
                        global.http.sendUserServer({
                            method: 'getOne',
                            cond: {find: {_id: query.user_demand_id}},
                            model: 'User_trade'
                        }, user_server_common, cbk2);
                    },
                    function (userInfo, cbk2) {
                        if (userInfo && userInfo.role == 'TRADE_ADMIN' && userInfo.company_id) {
                            global.http.sendUserServer({
                                method: 'getList',
                                cond: {find: {company_id: userInfo.company_id}},
                                model: 'User_trade'
                            }, user_server_common, cbk2);
                        } else {
                            cbk2(null, null);
                        }
                    },
                    function (users, cbk2) {
                        if (users) {
                            query.user_demand_id = {
                                $in: _.map(_.pluck(users, '_id'), function (num) {
                                    return num.toString()
                                })
                            };
                            query.company_demand_id = users[0].company_id;
                        }
                        cbk2();
                    },
                    function (cbk2) {
                        query.order_origin = 'JJ';
                        if (time != '') {
                            query.time_creation = {$gt: time}
                        }
                        lib_DemandOrder.getCount(query, cbk2);
                    },
                    function (count, cbk2) {
                        var obj = {
                            ineffective: ['待确认', 3],
                            effective: ['进行中', 4],
                            complete: ['已完成', 5]
                        };
                        if (_.isObject(data)) {
                            arr.push({
                                chn: obj['ineffective'][0],
                                eng: 'ineffective',
                                count: count,
                                lev: obj['ineffective'][1]
                            });
                        } else {
                            arr.push({
                                chn: obj[data][0],
                                eng: data,
                                count: count,
                                lev: obj[data][1]
                            });
                        }
                        cbk2();
                    }
                ], cbk)
            }, cb);
        },
        function (cb) {
            cb(null, arr);
        }
    ], callback)
};
//采购行情
exports.getCount_demand = function (req, time, callback) {
    if (req.body.company_id === "business") {
        req.body.company_id = "";
    }
    var cond;
    var company_info;
    var arr = [];
    var query;
    async.waterfall([
        //1，收集采购行情id
        function (cb) {
            if (req.decoded.company_id) {
                global.lib_User.getCompanyOne({find: {_id: req.decoded.company_id}}, cb);
            } else {
                global.lib_User.getUserOne({find: {_id: req.decoded.id}}, cb);
            }
        },
        function (company, cb) {
            company_info = company;
            if (req.body.company_id) {
                //查询到所有的好友的id
                getWorkSale(req.decoded.id, req.body.company_id, 'PURCHASE', cb);
            } else {
                getFriend(req.decoded.id, {type: 'PURCHASE'}, cb);
            }
        },
        function (arr, cb) {
            if (company_info) {
                if (_.indexOf(company_info.sell, 'buxianzhi') != -1) {
                    cond = {
                        status: {$ne: 'expired'},
                        "product_categories.0.layer.material": {$in: ['buxianzhi', "gangtie", "zaishengziyuan", "meijiao", "kuangshi"]}
                    };
                }else {
                    cond = {
                        status: {$ne: 'expired'},
                        "product_categories.0.layer.material": {$in: company_info.sell}
                    };
                }
                cond.company_id = {$ne: req.decoded.company_id};
                cond.user_id = {$in: arr, $ne: req.decoded.id};
                cond.list_offer = {$ne: [req.decoded.id]}
            } else {
                cond = {
                    status: {$ne: 'expired'},
                    "product_categories.0.layer.material": {$in: ["gangtie", "kuangshi", "zaishengziyuan", "meijiao"]}
                };
                cond.company_id = {$ne: req.decoded.company_id};
                cond.user_id = {$in: arr, $ne: req.decoded.id};
                cond.list_offer = {$ne: [req.decoded.id]}
            }
            if (time != '') {
                cond.time_creation = {$gt: time}
            }
            global.lib_Demand.getCount(cond, cb);
        },
        function (count, cb) {
            arr.push({
                chn: '新采购',
                eng: 'demand',
                count: count,
                lev: 1
            });
            cb();
        },
        function (cb) {
            if (req.body.company_id) {
                query = {
                    user_supply_id: req.decoded.id,
                    company_demand_id: req.body.company_id
                }
            } else {
                query = {
                    user_supply_id: req.decoded.id
                }
            }
            if (time != '') {
                query.time_creation = {$gt: time}
            }
            global.lib_DemandOffer.getCount(query, cb);
        },
        function (count, cb) {
            arr.push({
                chn: '已参与',
                eng: 'cy',
                count: count,
                lev: 2
            });
            cb();
        },
        function (cb) {
            var query = lib_DemandOrder.getQueryByType('SALE', req.decoded.id);
            if (req.body.company_id) query = _.extend(global.middleware.getOtherCompanyQueryByType(req.body.type, req.body.company_id), query);
            var user_server_common = '/api/server/common/get';

            async.eachSeries([{$in: ['cancelled', 'ineffective']}, 'effective', 'complete'], function (data, cbk) {
                query.status = data;
                async.waterfall([
                    //function (cbk2) {
                    //    global.http.sendUserServer({
                    //        method: 'getOne',
                    //        cond: {find: {_id: query.user_demand_id}},
                    //        model: 'User_trade'
                    //    }, user_server_common, cbk2);
                    //},
                    //function (userInfo, cbk2) {
                    //    if (userInfo && userInfo.role == 'TRADE_ADMIN' && userInfo.company_id) {
                    //        global.http.sendUserServer({
                    //            method: 'getList',
                    //            cond: {find: {company_id: userInfo.company_id}},
                    //            model: 'User_trade'
                    //        }, user_server_common, cbk2);
                    //    } else {
                    //        cbk2(null, null);
                    //    }
                    //},
                    //function (users, cbk2) {
                    //    if (users) {
                    //        query.user_demand_id = {
                    //            $in: _.map(_.pluck(users, '_id'), function (num) {
                    //                return num.toString()
                    //            })
                    //        };
                    //        query.company_demand_id = users[0].company_id;
                    //    }
                    //    cbk2();
                    //},
                    function (cbk2) {
                        query.order_origin = 'demand';
                        if (time != '') {
                            query.time_creation = {$gt: time}
                        }
                        lib_DemandOrder.getCount(query, cbk2);
                    },
                    function (count, cbk2) {
                        var obj = {
                            ineffective: ['待确认', 3],
                            effective: ['进行中', 4],
                            complete: ['已完成', 5]
                        };
                        if (_.isObject(data)) {
                            arr.push({
                                chn: obj['ineffective'][0],
                                eng: 'ineffective',
                                count: count,
                                lev: obj['ineffective'][1]
                            });
                        } else {
                            arr.push({
                                chn: obj[data][0],
                                eng: data,
                                count: count,
                                lev: obj[data][1]
                            });
                        }
                        cbk2();
                    }
                ], cbk)
            }, cb);
        },
        function (cb) {
            cb(null, arr);
        }
    ], callback)
};
//自己发布报价的信息
exports.getCount_dj_self = function (req, time, callback) {
    if (req.body.company_id === "business") {
        req.body.company_id = "";
    }
    var cond = {type: 'DJ', status: {$ne: 'expired'}, user_id: req.decoded.id};
    //var query = {user_id: req.decoded.id};
    //query.status = req.body.status ||  global.config_model.demand_status.published;
    var arr = [];
    async.waterfall([
        function (cb) {
            lib_priceOfferCity.getList({
                find: mw.getCityQuery(req.body, {user_id: req.body.user_id || req.decoded.id})
            }, cb);
        },
        function (result, cb) {
            if (result) {
                cond._id = _.flatten(_.pluck(result, 'PID'));
            }
            if (cond) {
                global.lib_PriceOfferProducts.getList({
                    find: mw.getLayerQuery(req.body, {PID: {$in: _.flatten(_.pluck(result, 'PID'))}})
                }, cb, {});

            } else {
                if (cond.company_id) {
                    global.lib_PriceOfferProducts.getList({
                        find: mw.getLayerQuery(req.body, {
                            company_id: cond.company_id
                        })
                    }, cb, {});
                } else {
                    global.lib_PriceOfferProducts.getList({
                        find: mw.getLayerQuery(req.body, {
                            user_id: cond.user_id
                        })
                    }, cb, {});
                }
            }
        },
        function (result, cb) {
            if (cond._id) {
                cond._id = {$in: _.uniq(_.intersection(cond._id, _.flatten(_.pluck(result, 'PID'))))};
            } else {
                cond._id = {$in: _.flatten(_.pluck(result, 'PID'))}
            }
            if (time != '') {
                cond.time_update = {$gt: time}
            }
            lib_PriceOffer.getCount(cond, cb);
        },
        function (count, cb) {
            arr.push({
                chn: '已发布',
                eng: 'dj',
                count: count,
                lev: 1
            });
            cb();
        },
        function (cb) {
            var query = {user_supply_id: req.decoded.id};
            async.eachSeries([{$in: ['cancelled', 'ineffective']}, 'effective', 'complete'], function (data, cbk) {
                query.status = data;
                async.waterfall([
                    function (cbk2) {
                        query.order_origin = 'DJ';
                        lib_DemandOrder.getCount(query, cbk2);
                    },
                    function (count, cbk2) {
                        var obj = {
                            ineffective: ['待确认', 2],
                            effective: ['进行中', 3],
                            complete: ['已完成', 4]
                        };
                        if (_.isObject(data)) {
                            arr.push({
                                chn: obj['ineffective'][0],
                                eng: 'ineffective',
                                count: count,
                                lev: obj['ineffective'][1]
                            });
                        } else {
                            arr.push({
                                chn: obj[data][0],
                                eng: data,
                                count: count,
                                lev: obj[data][1]
                            });
                        }
                        cbk2();
                    }
                ], cbk)
            }, cb);
        },
        function (cb) {
            cb(null, arr);
        }
    ], callback)
};
//自己发布采购的信息
exports.getCount_demand_self = function (req, time, callback) {
    if (req.body.company_id === "business") {
        req.body.company_id = "";
    }
    var query = {user_id: req.decoded.id};
    if (time != '') {
        query.time_update = {$gt: time}
    }
    var arr = [];
    async.waterfall([
        function (cb) {
            global.lib_Demand.getCount(query, cb);
        },
        function (count, cb) {
            arr.push({
                chn: '已发布',
                eng: 'published',
                count: count,
                lev: 1
            });
            cb();
        },
        function (cb) {
            var query = {user_demand_id: req.decoded.id};
            async.eachSeries([{$in: ['cancelled', 'ineffective']}, 'effective', 'complete'], function (data, cbk) {
                query.status = data;
                async.waterfall([
                    function (cbk2) {
                        query.order_origin = 'demand';
                        lib_DemandOrder.getCount(query, cbk2);
                    },
                    function (count, cbk2) {
                        var obj = {
                            ineffective: ['待确认', 2],
                            effective: ['进行中', 3],
                            complete: ['已完成', 4]
                        };
                        if (_.isObject(data)) {
                            arr.push({
                                chn: obj['ineffective'][0],
                                eng: 'ineffective',
                                count: count,
                                lev: obj['ineffective'][1]
                            });
                        } else {
                            arr.push({
                                chn: obj[data][0],
                                eng: data,
                                count: count,
                                lev: obj[data][1]
                            });
                        }
                        cbk2();
                    }
                ], cbk)
            }, cb);
        },
        function (cb) {
            cb(null, arr);
        }
    ], callback)
};
//自己发布的竞价信息
exports.getCount_jj_self = function (req, time, callback) {
    var arr = [];
    var cond = {
        user_id: req.decoded.id,
        status: {$ne: 'history'},
        type: {'$in': ['JJ', 'DjJJ']}
    };
    if (time != '') {
        cond.time_update = {$gt: time}
    }
    async.waterfall([
        function (cb) {
            lib_PriceOffer.getCount(cond, cb);
        },
        function (count, cb) {
            arr.push({
                chn: '已发布',
                eng: 'published',
                count: count,
                lev: 1
            });
            cb();
        },
        function (cb) {
            var query = {user_supply_id: req.decoded.id};
            async.eachSeries([{$in: ['cancelled', 'ineffective']}, 'effective', 'complete'], function (data, cbk) {
                query.status = data;
                async.waterfall([
                    function (cbk2) {
                        query.order_origin = 'JJ';
                        lib_DemandOrder.getCount(query, cbk2);
                    },
                    function (count, cbk2) {
                        var obj = {
                            ineffective: ['待确认', 2],
                            effective: ['进行中', 3],
                            complete: ['已完成', 4]
                        };
                        if (_.isObject(data)) {
                            arr.push({
                                chn: obj['ineffective'][0],
                                eng: 'ineffective',
                                count: count,
                                lev: obj['ineffective'][1]
                            });
                        } else {
                            arr.push({
                                chn: obj[data][0],
                                eng: data,
                                count: count,
                                lev: obj[data][1]
                            });
                        }
                        cbk2();
                    }
                ], cbk)
            }, cb);
        },
        function (cb) {
            cb(null, arr);
        }
    ], callback)
};
/**
 * 功能:根据参数得到相关的查询条件
 * 参数：(1)req
 */
exports.getList_dj = function (req, callback) {
    if (req.body.company_id === "business") {
        req.body.company_id = "";
    }
    var result = {};
    var cond = {type: 'DJ', status: {$ne: 'expired'}};
    var company_info;
    async.waterfall([
        function (cb) {
            if (req.body.company_id) {
                get_update_time(req, 'dj', cb)
            } else {
                cb(null, null, null);
            }
        },
        function (count, data, cb) {
            if (req.decoded.company_id) {
                global.lib_User.getCompanyOne({find: {_id: req.decoded.company_id}}, cb);
            } else {
                global.lib_User.getUserOne({find: {_id: req.decoded.id}}, cb);
                //cb(null,null);
            }
        },
        function (company, cb) {
            company_info = company;
            if (req.body.company_id) {
                //查询到所有的合作公司
                getWorkSale(req.decoded.id, req.body.company_id, 'SALE', cb);
            } else {
                //查询到所有的好友的id
                getFriend(req.decoded.id, {type: 'SALE'}, cb);
            }
        },
        function (arr, cb) {
            cond.user_id = {$in: arr, $ne: req.decoded.id};
            if (company_info) {
                getProduces(arr, "", company_info.buy, cb);
            } else {
                getProduces(arr, "", ["gangtie", "kuangshi", "zaishengziyuan", "meijiao"], cb);
            }
        },
        function (ids, cb) {
            cond._id = {$in: ids};
            cond.company_id = {$ne: req.decoded.company_id};
            global.lib_PriceOffer.getCount(cond, cb);
        },
        function (count, cb) {
            result.count = count;
            result.exist = count > req.body.page * global.config_common.list_per_page;
            global.lib_PriceOffer.onlyList({
                find: cond,
                sort: {time_creation: -1},
                limit: global.config_common.list_per_page,
                skip: global.config_common.list_per_page * (req.body.page - 1)
            }, cb);
        },
        function (data, cb) {
            data = JSON.parse(JSON.stringify(data));
            addUserAndCompany(data, cb);
        },
        function (data, cb) {
            result.list = data;
            cb(null, result);
        }
    ], callback)
};
exports.getList_jj = function (req, callback) {
    if (req.body.company_id === "business") {
        req.body.company_id = "";
    }
    var result = {};
    var cond = {type: {$in: ['DjJJ', 'JJ']}, status: {$ne: 'expired'}};
    var company_info;
    async.waterfall([
        function (cb) {
            if (req.body.company_id) {
                get_update_time(req, 'jj', cb)
            } else {
                cb(null, null, null);
            }
        },
        function (data, count, cb) {
            if (req.decoded.company_id) {
                global.lib_User.getCompanyOne({find: {_id: req.decoded.company_id}}, cb);
            } else {
                global.lib_User.getUserOne({find: {_id: req.decoded.id}}, cb);
            }
        },
        function (company, cb) {
            company_info = company;
            if (req.body.company_id) {
                //查询到所有的好友的id
                getWorkSale(req.decoded.id, req.body.company_id, 'SALE', cb);
            } else {
                //获得所有好友和所有合作企业的
                getFriend(req.decoded.id, {type: 'SALE'}, cb);
            }
        },
        function (arr, cb) {
            cond.user_id = {$in: arr, $ne: req.decoded.id};
            if (company_info) {
                getProduces(arr, "", company_info.buy, cb);
            } else {
                getProduces(arr, "", ["gangtie", "kuangshi", "zaishengziyuan", "meijiao"], cb);
            }
        },
        function (ids, cb) {
            cond._id = {$in: ids};
            cond.list_offer = {$ne: [req.decoded.id]};
            cond.company_id = {$ne: req.decoded.company_id};
            global.lib_PriceOffer.getCount(cond, cb);
        },
        function (count, cb) {
            result.count = count;
            result.exist = count > req.body.page * global.config_common.list_per_page;
            global.lib_PriceOffer.onlyList({
                find: cond,
                sort: {time_creation: -1},
                limit: global.config_common.list_per_page,
                skip: global.config_common.list_per_page * (req.body.page - 1)
            }, cb);
        },
        function (data, cb) {
            data = JSON.parse(JSON.stringify(data));
            addUserAndCompany(data, cb);
        },
        function (data, cb) {
            result.list = data;
            cb(null, result);
        }
    ], callback)
};
exports.getList_demand = function (req, callback) {
    if (req.body.company_id === "business") {
        req.body.company_id = "";
    }
    var result = {};
    var company_info;
    var cond;
    async.waterfall([
        function (cb) {
            if (req.body.company_id) {
                get_update_time(req, 'demand', cb)
            } else {
                cb(null, null, null);
            }
        },
        function (count, data, cb) {
            if (req.decoded.company_id) {
                global.lib_User.getCompanyOne({find: {_id: req.decoded.company_id}}, cb);
            } else {
                global.lib_User.getUserOne({find: {_id: req.decoded.id}}, cb);
            }
        },
        function (company, cb) {
            company_info = company;
            if (req.body.company_id) {
                //查询到所有的好友的id
                getWorkSale(req.decoded.id, req.body.company_id, 'PURCHASE', cb);
            } else {

                getFriend(req.decoded.id, 'PURCHASE', cb);
            }
        },
        function (arr, cb) {
            if (company_info) {
                if (_.indexOf(company_info.sell, 'buxianzhi') != -1) {
                    cond = {
                        status: {$ne: 'expired'},
                        "product_categories.0.layer.material": {$in: ['buxianzhi', "gangtie", "zaishengziyuan", "meijiao", "kuangshi"]}
                    };
                }else {
                    cond = {
                        status: {$ne: 'expired'},
                        "product_categories.0.layer.material": {$in: company_info.sell}
                    };
                }
                cond.company_id = {$ne: req.decoded.company_id};
                cond.user_id = {$in: arr, $ne: req.decoded.id};
                cond.list_offer = {$ne: [req.decoded.id]}
            } else {
                cond = {
                    status: {$ne: 'expired'},
                    "product_categories.0.layer.material": {$in: ["gangtie", "kuangshi", "zaishengziyuan", "meijiao",'buxianzhi']}
                };
                cond.company_id = {$ne: req.decoded.company_id};
                cond.user_id = {$in: arr, $ne: req.decoded.id};
                cond.list_offer = {$ne: [req.decoded.id]}
            }
            global.lib_Demand.getCount(cond, cb);
        },
        function (count, cb) {
            result.count = count;
            result.exist = count > req.body.page * global.config_common.list_per_page;
            global.lib_Demand.getList({
                find: cond,
                sort: {time_creation: -1},
                limit: global.config_common.list_per_page,
                skip: global.config_common.list_per_page * (req.body.page - 1)
            }, cb);
        },
        function (data, cb) {
            data = JSON.parse(JSON.stringify(data));
            addUserAndCompany2(data, cb);
        },
        function (data, cb) {
            result.list = data;
            cb(null, result);
        }
    ], callback)
};
//自己发布的报价列表
exports.getList_dj_self = function (req, callback) {
    var user_server_common = '/api/server/common/get';
    var cond = {type: 'DJ', status: {$ne: 'expired'}, user_id: req.decoded.id};
    var result2;
    async.waterfall([
        function (cb) {
            global.lib_PriceOffer.getListByParam(req, {
                find: cond,
                skip: config_common.list_per_page * (req.body.page - 1),
                limit: config_common.list_per_page,
                sort: {time_creation: -1}
            }, mw.getCityQuery(req.body, {user_id: req.body.user_id || req.decoded.id}), cb, req.body.page, req.body.type === config_model.offer_type.DJ, {});
        },
        function (result, cb) {
            async.eachSeries(result.list, function (list, cb) {
                global.http.sendUserServer({
                    method: 'getOne',
                    cond: {find: {_id: list.location_storage}},
                    model: 'Address'
                }, user_server_common, function (err, address) {
                    list.site = address;
                    cb();
                });
            }, function (err) {
                if (err) {
                    console.log('err', err)
                }
                global.lib_common.addUserAndCompany(req, result, cb);
            });
        },
        function (result, cb) {
            result2 = result;
            global.lib_PriceOffer.addJJTotalAmount(result.list, cb);
        },
        function (cb) {
            cond.lock = 'true';
            global.lib_PriceOffer.getCount(cond, cb)
        },
        function (count, cb) {
            result2.lock = {
                true: count,
                false: result2.count - count
            };
            cb(null, result2);
        }
    ], callback);
};
//自己发布的采购列表
exports.getList_demand_self = function (req, callback) {
    var query = {user_id: req.decoded.id};
    async.waterfall([
        function (cb) {
            global.lib_Demand.getListAndCount(req.body.page, {
                find: query,
                skip: config_common.list_per_page * (req.body.page - 1),
                limit: config_common.list_per_page,
                sort: {time_creation: -1}
            }, cb);
        },
        function (result, cb) {
            global.lib_common.addUserAndCompany(req, result, cb);
        }
    ], callback);
};
exports.getList_jj_self = function (req, callback) {
    var user_server_common = '/api/server/common/get';
    var result = {};
    var real_name;
    var company;
    async.waterfall([
        function (cb) {
            global.lib_User.getCompanyOne({
                find: {
                    _id: req.decoded.company_id
                }
            }, cb);
        },
        function (companyInof, cb) {
            company = companyInof;
            global.lib_User.getUserOne({
                find: {_id: req.decoded.id}
            }, cb);
        },
        function (user, cb) {
            real_name = user.real_name;
            global.lib_PriceOffer.getCount({
                user_id: req.decoded.id,
                status: {$ne: 'history'},
                type: {'$in': ['JJ', 'DjJJ']}
            }, cb);
        },
        function (count, cb) {
            result.count = count;
            result.exist = count > req.body.page * global.config_common.list_per_page;
            global.lib_common.getList_all_jj({
                find: {user_id: req.decoded.id, status: 'published', type: {'$in': ['JJ', 'DjJJ']}},
                skip: config_common.list_per_page * (req.body.page - 1),
                limit: config_common.list_per_page,
                sort: {time_creation: -1}
            }, cb);
        },
        function (data, cb) {
            result.list = data;
            async.eachSeries(data, function (list, cbk) {
                global.http.sendUserServer({
                    method: 'getOne',
                    cond: {find: {_id: list.location_storage}},
                    model: 'Address'
                }, user_server_common, function (err, address) {
                    list.real_name = real_name;
                    list.site = address;
                    list.verify_phase = company.verify_phase;
                    list.province = company.province;
                    cbk();
                });
            }, cb);
        },
        function (cb) {
            global.lib_PriceOffer.addJJTotalAmount(result.list, function (err) {
                if (err) {
                    return cb(err);
                }
                cb(null, result);
            });
        }
    ], callback);
};
/**
 * 功能：得到购物车列表
 * @param req
 * @param callback
 */
exports.getList_shop = function (req, callback) {

    if (req.body.company_id === "business") {
        req.body.company_id = "";
    }

    if (req.body.company_id) {
        var query = {
            user_demand_id: req.decoded.id,
            order_id: '',
            company_supply_id: req.body.company_id
        };
    } else {
        var query = {
            user_demand_id: req.decoded.id,
            order_id: ''
        };
    }
    var companyArr = [];
    var count;
    var shop_list;
    async.waterfall([
        function (cb) {
            if (req.body.company_id) {
                get_update_time(req, 'jj', cb)
            } else {
                cb(null, null, null);
            }
        },
        function (count, data, cb) {
            global.lib_shop.getList({
                find: query,
                sort: {time_creation: -1}
            }, cb);
        },
        function (result, cb) {
            shop_list = result;
            if (shop_list.length > 0) {
                global.lib_PriceOffer.getList({
                    find: {_id: {$in: _.pluck(shop_list, 'offer_id')}}
                }, cb);
            } else {
                cb(null, null);
            }
        },
        function (list, cb) {
            count = shop_list.length;
            async.eachSeries(_.uniq(_.pluck(shop_list, 'user_supply_id')), function (user_id, callback) {
                query.user_supply_id = user_id;
                var resultObj = {};
                async.waterfall([
                    function (cback) {
                        global.lib_shop.getList({
                            find: query,
                            sort: {time_creation: -1}
                        }, cback);
                    }
                ], function (err, result) {
                    if (err) return next(err);
                    resultObj.list = result;
                    resultObj.user_id = user_id;
                    shop_list.forEach(function (shop) {
                        if (shop.user_supply_id === user_id) {
                            resultObj.company_id = shop.company_supply_id;
                        }
                        list.forEach(function (obj) {
                            if (shop.offer_id === obj._id.toString()) {
                                resultObj.offer_role = obj.role;
                            }
                        });
                    });
                    companyArr.push(resultObj);
                    callback();
                });
            }, cb);
        },
        function (cb) {
            global.lib_Relationship.planCheck(req);
            cb(null, {
                list: companyArr,
                count: count
            })
        }
    ], callback);
};
//已参与的竞价列表
exports.getList_cy = function (req, callback) {
    if (req.body.company_id === "business") {
        req.body.company_id = "";
    }
    var result = {};
    var ids;
    async.waterfall([
        function (cb) {
            if (req.body.company_id) {
                global.lib_OfferAgain.getList({
                    find: {user_demand_id: req.decoded.id, company_supply_id: req.body.company_id}
                }, cb);
            } else {
                global.lib_OfferAgain.getList({
                    find: {user_demand_id: req.decoded.id}
                }, cb);
            }
        },
        function (data, cb) {
            ids = _.pluck(data, 'offer_id');
            global.lib_PriceOffer.getCount({_id: {$in: ids}, status: {$in: ['published', 'expired']}}, cb);
        },
        function (count, cb) {
            result.count = count;
            result.exist = count > req.body.page * global.config_common.list_per_page;
            global.lib_common.getList_all_jj({
                //find: {_id: {$in: ids}, status: {$in: ['published', 'expired']}},
                find: {_id: {$in: ids}, status: 'published'},
                skip: config_common.list_per_page * (req.body.page - 1),
                limit: config_common.list_per_page,
                sort: {time_creation: -1}
            }, cb);
        },
        function (data, cb) {
            data = JSON.parse(JSON.stringify(data));
            addUserAndCompany(data, cb);
        },
        function (data, cb) {
            result.list = data;
            cb(null, result);
        }
    ], callback);
};
//已参与的采购列表
exports.getList_cy_demand = function (req, callback) {
    if (req.body.company_id === "business") {
        req.body.company_id = "";
    }
    var result = {};
    var ids;
    async.waterfall([
        function (cb) {
            if (req.body.company_id) {
                global.lib_DemandOffer.getList({
                    find: {
                        user_supply_id: req.decoded.id,
                        company_demand_id: req.body.company_id
                    }
                }, cb);
            } else {
                global.lib_DemandOffer.getList({
                    find: {
                        user_supply_id: req.decoded.id
                    }
                }, cb);
            }
        },
        function (data, cb) {
            ids = _.pluck(data, 'demand_id');
            global.lib_Demand.getCount({
                _id: {$in: ids},
                status: {$in: ['published', 'expired']}
            }, cb);
        },
        function (count, cb) {
            result.count = count;
            result.exist = count > req.body.page * global.config_common.list_per_page;
            global.lib_common.getList_all({
                //find: { _id: {$in: ids}, status: {$in: ['published', 'expired']}},
                find: {_id: {$in: ids}, status: 'published'},
                skip: config_common.list_per_page * (req.body.page - 1),
                limit: config_common.list_per_page,
                sort: {time_creation: -1}
            }, cb);
        },
        function (data, cb) {
            data = JSON.parse(JSON.stringify(data));
            addUserAndCompany2(data, cb);
        },
        function (data, cb) {
            result.list = data;
            cb(null, result);
        }
    ], callback);
};
/**
 * 功能：得到订单列表
 * @param req
 * @param callback
 */
exports.getList_order = function (req, order_origin, callback) {
    if (req.body.company_id === "business") {
        req.body.company_id = "";
    }
    var query = lib_DemandOrder.getQueryByType('PURCHASE', req.decoded.id);
    query.status = req.body.status;
    query.order_origin = order_origin;
    if (req.body.company_id) query = _.extend(global.middleware.getOtherCompanyQueryByType(req.body.type, req.body.company_id), query);
    var Obj;
    var length;
    var user_server_common = '/api/server/common/get';
    async.waterfall([
        function (cb) {
            config_error.checkBody(req.body, ['status', 'type'], cb);
        },
        function (cb) {
            global.http.sendUserServer({
                method: 'getOne',
                cond: {find: {_id: query.user_demand_id}},
                model: 'User_trade'
            }, user_server_common, cb);
        },
        function (userInfo, cb) {
            if (userInfo && userInfo.role == 'TRADE_ADMIN' && userInfo.company_id) {
                global.http.sendUserServer({
                    method: 'getList',
                    cond: {find: {company_id: userInfo.company_id}},
                    model: 'User_trade'
                }, user_server_common, cb);
            } else {
                cb(null, null);
            }
        },
        function (users, cb) {
            if (users) {
                if (req.body.type === 'PURCHASE') {
                    query.user_demand_id = {
                        $in: _.map(_.pluck(users, '_id'), function (num) {
                            return num.toString()
                        })
                    };
                    query.company_demand_id = users[0].company_id;
                } else if (req.body.type === 'SALE') {
                    query.user_supply_id = {
                        $in: _.map(_.pluck(users, '_id'), function (num) {
                            return num.toString()
                        })
                    };
                    query.company_supply_id = users[0].company_id;
                }
            }
            cb();
        },
        function (cb) {
            lib_DemandOrder.getListAndCount(req.body.page, {
                find: query,
                skip: config_common.list_per_page * (req.body.page - 1),
                limit: config_common.list_per_page,
                sort: {time_creation: -1}
            }, cb);
        },
        function (result, cb) {
            Obj = result;
            Obj.update_count = length;
            var company_id, user_id, relationship_type;
            if (req.body.type === 'SALE') {
                company_id = 'company_demand_id';
                user_id = 'user_demand_id';
                relationship_type = 'supply';
            } else {
                company_id = 'company_supply_id';
                user_id = 'user_supply_id';
                relationship_type = 'demand';
            }
            global.lib_Relationship.orderCheckUpdate({
                id: req.decoded.id,
                company_id: req.decoded.company_id,
                relationship_type: 'trade_' + relationship_type + '_' + req.body.status
            }, {}, null, true);
            global.lib_common.addUserAndCompany(req, Obj, cb, null, user_id, company_id);
        }, function (result, cb) {

            //循环确定超管
            for (var i = 0; i < result.list.length; i++) {
                result.list[i] = JSON.parse(JSON.stringify(result.list[i]));
                if (result.list[i].user_demand_id == req.decoded.id || _.indexOf(result.user_supply_id, req.decoded.id) == 1) {
                    result.list[i].shield = false;
                } else {
                    result.list[i].shield = true;
                }
            }
            cb(null, result);
        }
    ], callback);
};

exports.getList_order_demand_hq = function (req, order_origin, callback) {
    if (req.body.company_id === "business") {
        req.body.company_id = "";
    }
    var query = lib_DemandOrder.getQueryByType('SALE', req.decoded.id);
    query.status = req.body.status;
    query.order_origin = order_origin;
    if (req.body.company_id) query = _.extend(global.middleware.getOtherCompanyQueryByType(req.body.type, req.body.company_id), query);
    var Obj;
    var length;
    var user_server_common = '/api/server/common/get';
    async.waterfall([
        function (cb) {
            config_error.checkBody(req.body, ['status', 'type'], cb);
        },
        //function (cb) {
        //    global.http.sendUserServer({
        //        method: 'getOne',
        //        cond: {find: {_id: query.user_demand_id}},
        //        model: 'User_trade'
        //    }, user_server_common, cb);
        //},
        //function (userInfo, cb) {
        //    if (userInfo && userInfo.role == 'TRADE_ADMIN' && userInfo.company_id) {
        //        global.http.sendUserServer({
        //            method: 'getList',
        //            cond: {find: {company_id: userInfo.company_id}},
        //            model: 'User_trade'
        //        }, user_server_common, cb);
        //    } else {
        //        cb(null, null);
        //    }
        //},
        //function (users, cb) {
        //    if (users) {
        //        query.user_supply_id = {
        //            $in: _.map(_.pluck(users, '_id'), function (num) {
        //                return num.toString()
        //            })
        //        };
        //        query.company_supply_id = users[0].company_id;
        //    }
        //    cb();
        //},
        function (cb) {
            lib_DemandOrder.getListAndCount(req.body.type, {
                find: query,
                skip: config_common.list_per_page * (req.body.type - 1),
                limit: config_common.list_per_page,
                sort: {time_creation: -1}
            }, cb);
        },
        function (result, cb) {
            Obj = result;
            Obj.update_count = length;
            var company_id, user_id, relationship_type;
            if (req.body.type === 'SALE') {
                company_id = 'company_demand_id';
                user_id = 'user_demand_id';
                relationship_type = 'supply';
            } else {
                company_id = 'company_supply_id';
                user_id = 'user_supply_id';
                relationship_type = 'demand';
            }
            global.lib_Relationship.orderCheckUpdate({
                id: req.decoded.id,
                company_id: req.decoded.company_id,
                relationship_type: 'trade_' + relationship_type + '_' + req.body.status
            }, {}, null, true);
            global.lib_common.addUserAndCompany(req, Obj, cb, null, user_id, company_id);
        }, function (result, cb) {
            //循环确定超管
            for (var i = 0; i < result.list.length; i++) {
                result.list[i] = JSON.parse(JSON.stringify(result.list[i]));
                if (result.list[i].user_demand_id == req.decoded.id || _.indexOf(result.user_supply_id, req.decoded.id) == 1) {
                    result.list[i].shield = false;
                } else {
                    result.list[i].shield = true;
                }
            }
            cb(null, result);
        }
    ], callback);
};

//跟自己有关的报价/竞价订单
exports.getList_order_dj = function (req, typ, callback) {
    var result = {};
    var query = {
        user_supply_id: req.decoded.id,
        order_origin: typ,
        status: req.body.status
    };
    async.waterfall([
        function (cb) {
            lib_DemandOrder.getCount(query, cb);
        },
        function (count, cb) {
            result.count = count;
            result.exist = count > req.body.page * global.config_common.list_per_page;
            lib_DemandOrder.getList({
                find: query,
                skip: config_common.list_per_page * (req.body.page - 1),
                limit: config_common.list_per_page,
                sort: {time_creation: -1}
            }, cb);
        },
        function (data, cb) {
            result.list = data;
            cb(null, result);
        }
    ], callback);
};
//单独写的已参与列表中的数据状态排序
exports.getList_order_dj_participation = function (req, typ, callback) {
    var result = {};
    var query = {
        user_supply_id: req.decoded.id,
        order_origin: typ,
        status: req.body.status
    };
    if (typ === 'demand') {
        query = {
            user_demand_id: req.decoded.id,
            order_origin: typ,
            status: req.body.status
        };
    }
    async.waterfall([
        function (cb) {
            lib_DemandOrder.getCount(query, cb);
        },
        function (count, cb) {
            result.count = count;
            result.exist = count > req.body.page * global.config_common.list_per_page;
            query.status = config_common.listType.ineffective;
            global.lib_common.getList_all_dj_participation({
                find: query,
                skip: config_common.list_per_page * (req.body.page - 1),
                limit: config_common.list_per_page,
                sort: {time_creation: -1}
            }, cb);
        },
        function (data, cb) {
            result.list = data;
            cb(null, result);
        }
    ], callback);
};
//跟自己有关的采购订单
exports.getList_order_demand = function (req, typ, callback) {
    var result = {};
    var query = {
        user_demand_id: req.decoded.id,
        order_origin: typ,
        status: req.body.status
    };
    async.waterfall([
        function (cb) {
            lib_DemandOrder.getCount(query, cb);
        },
        function (count, cb) {
            result.count = count;
            result.exist = count > req.body.page * global.config_common.list_per_page;
            lib_DemandOrder.getList({
                find: query,
                skip: config_common.list_per_page * (req.body.page - 1),
                limit: config_common.list_per_page,
                sort: {time_creation: -1}
            }, cb);
        },
        function (data, cb) {
            result.list = data;
            cb(null, result);
        }
    ], callback);
};

/**
 * 功能：根据人的id得到这个人的好友id数组
 * @param id 这个人的id
 * @param callback 回调
 */
var getFriend = function (id, type, callback) {
    var arr = [];
    var arr02 = [];
    async.waterfall([
        function (cb) {
            global.http.sendUserServer({
                method: 'getList',
                cond: {
                    find: {user_id: id, type: 'FRIEND'}
                },
                model: 'User_relation'
            }, '/api/server/common/get', cb);
        },
        function (data, cb) {
            //查询到的所有的好友
            arr = _.pluck(data, 'other_id');
            global.http.sendUserServer({
                method: 'getList',
                cond: {
                    find: {
                        user_id: id,
                        type: type.type
                    }
                },
                model: 'Work_relation'
            }, '/api/server/common/get', cb);
        },
        function (list, cb) {
            //查询到的所有的好友
            arr02 = _.pluck(list, 'other_user_id');

            arr = _.uniq(arr.concat(arr02));
            cb(null, arr);
        }
    ], callback)
};
exports.getFriend = getFriend;

/**
 * 功能：根据人的id得到这个人的合作关系id数组
 * @param id 这个人的id
 * @param company_id 这个人合作的公司的id
 * @param callback 回调
 */
var getWorkSale = function (id, company_id, data, callback) {
    var arr = [];
    async.waterfall([
        function (cb) {
            global.http.sendUserServer({
                method: 'getList',
                cond: {
                    find: {
                        user_id: id,
                        other_company_id: company_id,
                        type: data
                    }
                },
                model: 'Work_relation'
            }, '/api/server/common/get', cb);
        },
        function (list, cb) {
            //查询到的所有的好友
            arr = _.pluck(list, 'other_user_id');
            cb(null, arr);
        }
    ], callback);
};
exports.getWorkSale = getWorkSale;


/**
 * 功能：根据人的id和自己公司的买/卖，得到相关报价id
 * @param users
 * @param arr
 * @param callback
 */
var getProduces = function (users, company_id, arr, callback) {

    if (_.indexOf(arr, 'buxianzhi') != -1) {
        arr = ['buxianzhi', "gangtie", "zaishengziyuan", "meijiao", "kuangshi"]
    }

    if (users) {
        var cond = {
            user_id: {$in: users},
            "layer.material": {$in: arr}
        }
    } else {
        var cond = {
            company_id: company_id,
            "layer.material": {$in: arr}
        }
    }
    async.waterfall([
        function (cb) {
            global.lib_PriceOfferProducts.getList({find: cond}, cb);
        },
        function (list, cb) {
            var arr = _.flatten(_.pluck(list, 'PID'));
            cb(null, arr);
        }
    ], callback);
};
exports.getProduces = getProduces;

/**
 * 补全报价竞价的属性 和需要的人和公司信息
 * @param list 传入的报价数组
 * @param callback
 */
var addUserAndCompany = function (list, callback) {
    async.mapSeries(list, function (data, cb) {
        var userData;
        async.waterfall([
            function (cbk) {
                lib_PriceOfferProducts.getList({
                    find: {PID: data._id}
                }, cbk);
            },
            function (Products, cbk) {
                data.product_categories = Products;
                cbk();
            },
            function (cbk) {
                global.lib_User.getUserOne({
                    find: {_id: data.user_id},
                    select: 'real_name photo_url role'
                }, cbk)
            },
            function (user, cbk) {
                userData = user;
                if (data.company_id) {
                    global.lib_User.getCompanyOne({
                        find: {_id: data.company_id},
                        select: 'nick_name url_logo verify_phase vip panorama_url'
                    }, cbk);
                } else {
                    cbk(null, null)
                }
            },
            function (company, cbk) {
                data.dt_type = 'trade_pricing';
                cbk(null, {
                    list: data,
                    company: company,
                    user: userData
                });
            }
        ], function (err, result) {
            if (err) {
                return callback(err);
            }
            cb(null, result);
        })
    }, callback)
};
exports.addUserAndCompany = addUserAndCompany;
/**
 * 补全采购 需要的人和公司信息
 * @param list
 * @param callback
 */
var addUserAndCompany2 = function (list, callback) {
    async.mapSeries(list, function (data, cb) {
        var userData;
        async.waterfall([
            function (cbk) {
                global.lib_User.getUserOne({
                    find: {_id: data.user_id},
                    select: 'real_name photo_url role'
                }, cbk)
            },
            function (user, cbk) {
                userData = user;
                if (data.company_id) {
                    global.lib_User.getCompanyOne({
                        find: {_id: data.company_id},
                        select: 'nick_name url_logo verify_phase vip panorama_url'
                    }, cbk);
                } else {
                    cbk(null, null)
                }
            },
            function (company, cbk) {
                data.dt_type = 'trade_demand';
                cbk(null, {
                    list: data,
                    company: company,
                    user: userData
                });
            }
        ], function (err, result) {
            if (err) {
                return callback(err);
            }
            cb(null, result);
        })
    }, callback)
};

exports.addUserAndCompany2 = addUserAndCompany;
//更新时间
var get_update_time = function (req, type, callback) {
    async.waterfall([
        function (cb) {
            global.lib_Relationship.getOne({
                find: {
                    user_id: req.decoded.id,
                    company_id: req.body.company_id,
                    type: type
                }
            }, cb);
        },
        function (data, cb) {
            if (data) {
                data.update_time = new Date();
                data.save(cb);
                //global.lib_Relationship.edit(data,cb);
            } else {
                global.lib_Relationship.add({
                    user_id: req.decoded.id,
                    company_id: req.body.company_id,
                    type: type,
                    update_time: new Date()
                }, cb);
            }
        }
    ], callback);
};
exports.get_update_time = get_update_time;
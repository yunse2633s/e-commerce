/**
 * Created by Administrator on 2017/4/9.
 */
var async = require('async');
var decimal = require('decimal');
var _ = require('underscore');
var config_error = global.config_error;
var config_common = global.config_common;

var lib_priceOfferCity = global.lib_priceOfferCity;
var lib_PassPrice = global.lib_PassPrice;
var lib_common = global.lib_common;

module.exports = function (app, express) {

    var api = express.Router();

    // 拦截非授权请求
    api.use(require('../../middlewares/mid_verify_user')());

    /**
     * 增删改查
     */
    api.post('/add', function (req, res, next) {
        var resultObj;
        async.waterfall([
            function (cb) {
                if (!req.body.pass_type) {
                    req.body.pass_type = "sale";
                }
                if (req.body.pass_type == "DJ") {
                    req.body.pass_type = 'sale';
                }
                config_error.checkBody(req.body, ['name', 'type', 'location_storage', 'price_routes', 'pass_type'], cb, null, 'passPrice');
            },
            function (cb) {
                global.lib_User.getAddressOne({
                    find: {_id: req.body.location_storage,}
                }, cb);
            },
            function (addressData, cb) {
                lib_PassPrice.add({
                    pass_type: req.body.pass_type,//sale  purchase
                    type: req.body.type,
                    time_goods: req.body.time_goods,
                    warehouse_name: addressData.name || '',
                    name: req.body.name,
                    user_id: req.decoded.id,
                    company_id: req.decoded.company_id,
                    location_storage: req.body.location_storage,
                    role: req.decoded.role,
                    appendix: req.body.appendix
                }, cb);
            },
            function (result, count, cb) {
                resultObj = result;
                var priceOfferCity = [];
                if (!req.body.price_routes[0].district || !req.body.price_routes[0].district.length) {
                    req.body.price_routes.forEach(function (offerCity) {
                        offerCity['passPrice_id'] = [result._id.toString()];
                        offerCity['user_id'] = req.decoded.id;
                        if (offerCity._id) delete offerCity._id;
                        priceOfferCity.push(offerCity);
                    });
                    lib_priceOfferCity.addList(priceOfferCity, cb);
                } else {
                    var arr = [];
                    for (var i = 0; i < req.body.price_routes.length; i++) {
                        arr.push({
                            province: req.body.price_routes[i].province,
                            city: req.body.price_routes[i].city,
                            price: req.body.price_routes[i].price,
                            passPrice_id: [result._id.toString()],
                            user_id: req.decoded.id,
                            district: req.body.price_routes[i].district,
                        })
                    }
                    lib_priceOfferCity.addList(arr, cb);
                }
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, _.extend(JSON.parse(JSON.stringify(resultObj)), {price_routes: result}), next);
        });
    });
    api.post('/del', function (req, res, next) {

        global.lib_PriceOffer.getCount({passPrice_id: {$in: req.body.ids}}, function (err,count) {
            if (err) {
                return next(err);
            }
            if(count != 0){
                return next('您有'+count+"条报价正在使用，请先修改报价");
            }else {
                lib_common.del(req, lib_PassPrice, function (err) {
                    if (err) {
                        return next(err);
                    }
                    //删除区域配送模板后将对应报价中的相关字段也删除掉
                    // global.lib_PriceOffer.update({
                    //     find: {passPrice_id: {$in: req.body.ids}},
                    //     set: {passPrice_id: ''}
                    // }, function (err) {
                    //     if (err) {
                    //         return next(err);
                    //     }
                    // });
                    config_common.sendData(req, {}, next);
                });
            }
        });

    });
    api.post('/edit', function (req, res, next) {
        lib_PassPrice.passPriceEdit(req, {_id: req.body.id}, function (err, result) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, result, next);
        })
    });
    api.post('/detail', function (req, res, next) {
        if (!req.body.id) {
            return next('invalid_format : id');
        }
        lib_common.detail(req, lib_PassPrice, function (err, result) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, result, next);
        });
    });

    /**
     * 物流模板列表
     */
    api.post('/get_list', function (req, res, next) {
        if (!req.body.page) {
            req.body.page = 1;
        }
        if (!req.body.pass_type) {
            req.body.pass_type = 'sale';
        }
        if (req.body.pass_type == "DJ") {
            req.body.pass_type = 'sale';
        }
        var result = {list: []}
        async.waterfall([
            function (cb) {
                lib_PassPrice.getCount({user_id: req.decoded.id, pass_type: req.body.pass_type}, cb);
            },
            function (count, cb) {
                result.exist = count > config_common.entry_per_page * req.body.page;
                result.count = count;
                var cond = {user_id: req.decoded.id, pass_type: req.body.pass_type};
                if (req.body.id) {
                    cond.location_storage = req.body.id;
                }
                lib_PassPrice.getList({
                    find: cond,
                    skip: (req.body.page - 1) * config_common.entry_per_page,
                    limit: config_common.entry_per_page,
                    sort: {time_creation: -1}
                }, cb);
            },
            function (data, cb) {
                async.eachSeries(data, function (entry, cback) {
                    entry = JSON.parse(JSON.stringify(entry));
                    async.waterfall([
                        function (back) {
                            lib_priceOfferCity.getList({
                                find: {passPrice_id: entry._id.toString()}
                            }, back);
                        },
                        function (pass, back) {
                            entry.price_routes = pass;
                            global.lib_PriceOffer.onlyList({find: {passPrice_id: entry._id.toString()}}, back);
                        },
                        function (offer, back) {
                            entry.offer_count = offer.length;
                            global.lib_PriceOfferProducts.getList({
                                find: {
                                    PID: {
                                        $in: _.map(_.pluck(offer, '_id'), function (num) {
                                            return num.toString();
                                        })
                                    }
                                }
                            }, back);
                        },
                        function (produckts, back) {
                            entry.product_categories = produckts;
                            result.list.push(entry);
                            back();
                        }
                    ], cback);
                }, cb);
            }
        ], function (err) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, result, next);
        });
    });

    /**
     * 物流模板列表
     */
    api.post('/get_only_name', function (req, res, next) {
        if (!req.body.pass_type) {
            req.body.pass_type = 'sale';
        }
        if (req.body.pass_type == 'DJ') {
            req.body.pass_type = 'sale';
        }
        async.waterfall([
            function (cb) {
                lib_PassPrice.getList({
                    find: {user_id: req.decoded.id, pass_type: req.body.pass_type},
                    select: 'name location_storage',
                    sort: {time_creation: -1}
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
     * 物流模板单个详情
     */
    api.post('/get_one', function (req, res, next) {
        if (!req.body.id) {
            return next('invalid_format');
        }
        async.waterfall([
            function (cb) {
                lib_PassPrice.getOne({find: {_id: req.body.id}}, cb);
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, result, next);
        });
    });

    /**
     * 物流推荐线路
     * start : {
     *     province:"", 省
     *     city:"", 市
     *     district:""  县/区
     * }
     * end:[{
     *     province:"", 省
     *     city:[""], 市
     *     district:[""], 县/区
     * }]
     *
     */
    api.post('/get_lines', function (req, res, next) {
        if (!req.body.start || !req.body.end) {
            return next('invalid_format');
        }
        var obj = {
            user_server_common: '/api/server/common/get', // 自定义查询物流
        };
        var result = {};
        var relationArr;
        async.waterfall([
            function (cb) {
                //得到自己认证的物流企业
                global.http.sendUserServer({
                    method: 'getList',
                    cond: {
                        find: {
                            other_type: global.config_common.company_category.TRAFFIC,
                            self_id: req.decoded.company_id
                        }
                    },
                    model: 'Company_relation'
                }, obj.user_server_common, cb);
            },
            function (relations, cb) {
                //自己认证企业的_id
                relationArr = _.pluck(relations, 'other_id');
                //根据有几条终点去分别查询可以匹配到的线路
                async.eachSeries(req.body.end, function (one_end, callback) {
                    //开始位置--> 省 市 县/区 是固定的 可以匹配的情况有
                    //（1）司机线路起点省市县都匹配的
                    //（2）司机线路匹配到市的
                    //（3）司机跑全省的
                    //目的地-->省 市 县/区 先去可能不存在
                    var cond = {
                        //起点和终点的省
                        status: 'effective',
                        end_province: one_end.province,
                        start_province: req.body.start.province,
                        $and: [{
                            $or: [{
                                start_city: {$in: [req.body.start.city]},
                                start_district: {$in: [req.body.start.district]}
                            }, {
                                start_city: {$in: [req.body.start.city]},
                            }, {
                                start_city: [],
                                start_district: []
                            }]
                        }, {
                            $or: [{
                                end_city: {$in: one_end.city},
                                end_district: {$in: one_end.district}
                            }, {
                                end_city: {$in: one_end.city}
                            }, {
                                end_city: [],
                                end_district: []
                            }]
                        }]
                    };
                    var unCond = {
                        //起点和终点的省
                        status: 'effective',
                        start_province: one_end.province,
                        end_province: req.body.start.province,
                        $and: [{
                            $or: [{
                                end_city: {$in: [req.body.start.city]},
                                end_district: {$in: [req.body.start.district]}
                            }, {
                                end_city: {$in: [req.body.start.city]},
                            }, {
                                end_city: [],
                                end_district: []
                            }]
                        }, {
                            $or: [{
                                start_city: {$in: one_end.city},
                                start_district: {$in: one_end.district}
                            }, {
                                start_city: {$in: one_end.city},
                            }, {
                                start_city: [],
                                start_district: []
                            }]
                        }]
                    };
                    var work_count;
                    var other_count;
                    var work_price_arr;
                    var other_price_arr;
                    var work_arr;
                    var other_arr;
                    async.waterfall([
                        function (cbk) {
                            //第一遍查询到自己相关企业的物流线路信息
                            cond.company_id = {$in: relationArr, $ne: '', $exists: true}
                            global.http.sendTrafficServer({
                                method: 'getList',
                                cond: {find: cond},
                                model: 'TrafficLine'
                            }, obj.user_server_common, cbk);
                        },
                        function (data, cbk) {
                            work_arr = data;
                            work_count = data.length;
                            work_price_arr = _.pluck(_.filter(data, function (num) {
                                return num.money > 0;
                            }), 'money');
                            unCond.company_id = {$in: relationArr, $ne: '', $exists: true}
                            global.http.sendTrafficServer({
                                method: 'getList',
                                cond: {find: unCond},
                                model: 'TrafficLine'
                            }, obj.user_server_common, cbk);
                        },
                        function (data, cbk) {
                            var ids = _.pluck(work_arr, '_id');
                            data = _.filter(data, function (num) {
                                return _.indexOf(ids, num._id) == -1;
                            });
                            work_count = work_count + data.length;
                            work_price_arr = _.flatten(work_price_arr.concat(_.pluck(_.filter(data, function (num) {
                                return num.unmoney > 0;
                            }), 'unmoney')));
                            cond.company_id = {$nin: relationArr, $ne: '', $exists: true}
                            global.http.sendTrafficServer({
                                method: 'getList',
                                cond: {find: cond},
                                model: 'TrafficLine'
                            }, obj.user_server_common, cbk);
                        },
                        function (data, cbk) {
                            other_arr = data;
                            other_count = data.length;
                            other_price_arr = _.pluck(data, 'money');
                            unCond.company_id = {$nin: relationArr, $ne: '', $exists: true}
                            global.http.sendTrafficServer({
                                method: 'getList',
                                cond: {find: unCond},
                                model: 'TrafficLine'
                            }, obj.user_server_common, cbk);
                        },
                        function (data, cbk) {
                            var ids = _.pluck(other_arr, '_id');
                            data = _.filter(data, function (num) {
                                return _.indexOf(ids, num._id) == -1;
                            });
                            other_count = other_count + data.length;
                            other_price_arr = _.flatten(other_price_arr.concat(_.pluck(data, 'unmoney')));
                            result.work_count = work_count;
                            result.other_count = other_count;
                            if (work_price_arr.length > 0) {
                                result.work_price = config_common.getAve(work_price_arr);
                            } else {
                                result.work_price = 0;
                            }
                            // result.work_price = config_common.getAve(work_price_arr);
                            result.other_price = config_common.getAve(other_price_arr);
                            cbk();
                        }
                    ], callback);
                }, cb)
            }
        ], function (err) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, result, next);
        })
    });

    /**
     * 物流推荐线路
     * start : {
     *     province:"", 省
     *     city:"", 市
     *     district:""  县/区
     * }
     * end:[{
     *     province:"", 省
     *     city:[""], 市
     *     district:[""], 县/区
     * }]
     *
     */
    api.post('/get_lines_content', function (req, res, next) {
        if (!req.body.start || !req.body.end) {
            return next('invalid_format');
        }
        var obj = {
            user_server_common: '/api/server/common/get', // 自定义查询物流
        };
        var result = {};
        var relationArr;
        var cond = {
            //起点和终点的省
            status: 'effective',
            end_province: req.body.end.province,
            start_province: req.body.start.province,
            $and: [{
                $or: [{
                    start_city: {$in: [req.body.start.city]},
                    start_district: {$in: [req.body.start.district]}
                }, {
                    start_city: {$in: [req.body.start.city]},
                }, {
                    start_city: [],
                    start_district: []
                }]
            }, {
                $or: [{
                    end_city: {$in: req.body.end.city},
                    end_district: {$in: req.body.end.district}
                }, {
                    end_city: {$in: req.body.end.city}
                }, {
                    end_city: [],
                    end_district: []
                }]
            }]
        }
        var unCond = {
            //起点和终点的省
            status: 'effective',
            start_province: req.body.end.province,
            end_province: req.body.start.province,
            $and: [{
                $or: [{
                    end_city: {$in: [req.body.start.city]},
                    end_district: {$in: [req.body.start.district]}
                }, {
                    end_city: {$in: [req.body.start.city]},
                }, {
                    end_city: [],
                    end_district: []
                }]
            }, {
                $or: [{
                    start_city: {$in: req.body.end.city},
                    start_district: {$in: req.body.end.district}
                }, {
                    start_city: {$in: req.body.end.city},
                }, {
                    start_city: [],
                    start_district: []
                }]
            }]
        }
        var work_count;
        var other_count;
        var work_price_arr;
        var other_price_arr;
        var work_arr;
        var other_arr;
        async.waterfall([
            function (cb) {
                //得到自己认证的物流企业
                global.http.sendUserServer({
                    method: 'getList',
                    cond: {
                        find: {
                            other_type: global.config_common.company_category.TRAFFIC,
                            self_id: req.decoded.company_id
                        }
                    },
                    model: 'Company_relation'
                }, obj.user_server_common, cb);
            },
            function (relations, cb) {
                //自己认证企业的_id
                relationArr = _.pluck(relations, 'other_id');
                cond.company_id = {$in: relationArr, $ne: '', $exists: true}
                global.http.sendTrafficServer({
                    method: 'getList',
                    cond: {find: cond},
                    model: 'TrafficLine'
                }, obj.user_server_common, cb);
            },
            function (data, cb) {
                work_count = data.length;
                work_price_arr = _.pluck(_.filter(data, function (num) {
                    return num.money > 0;
                }), 'money');
                result.work_arr = data;
                unCond.company_id = {$in: relationArr, $ne: '', $exists: true}
                global.http.sendTrafficServer({
                    method: 'getList',
                    cond: {find: unCond},
                    model: 'TrafficLine'
                }, obj.user_server_common, cb);
            },
            function (data, cb) {
                var ids = _.pluck(result.work_arr, '_id');
                data = _.filter(data, function (num) {
                    return _.indexOf(ids, num._id) == -1;
                });
                result.work_arr = result.work_arr.concat(data);
                work_count = work_count + data.length;
                work_price_arr = _.flatten(work_price_arr.concat(_.pluck(_.filter(data, function (num) {
                    return num.unmoney > 0;
                }), 'unmoney')));
                cond.company_id = {$nin: relationArr, $ne: '', $exists: true}
                global.http.sendTrafficServer({
                    method: 'getList',
                    cond: {find: cond},
                    model: 'TrafficLine'
                }, obj.user_server_common, cb);
            },
            function (data, cb) {
                result.other_arr = data;
                other_count = data.length;
                other_price_arr = _.pluck(_.filter(data, function (num) {
                    return num.money > 0;
                }), 'money');
                unCond.company_id = {$nin: relationArr, $ne: '', $exists: true}
                global.http.sendTrafficServer({
                    method: 'getList',
                    cond: {find: unCond},
                    model: 'TrafficLine'
                }, obj.user_server_common, cb);
            },
            function (data, cb) {
                var ids = _.pluck(result.other_arr, '_id');
                data = _.filter(data, function (num) {
                    return _.indexOf(ids, num._id) == -1;
                });
                result.other_arr = result.other_arr.concat(data);
                other_count = other_count + data.length;
                other_price_arr = _.flatten(other_price_arr.concat(_.pluck(data, 'unmoney')));
                result.work_count = work_count;
                result.other_count = other_count;
                result.work_price = config_common.getAve(work_price_arr);
                result.other_price = config_common.getAve(other_price_arr);
                cb();
            },
            function (cb) {
                if (result.work_arr.length) {
                    async.eachSeries(result.work_arr, function (work_arr, cbk) {
                        async.waterfall([
                            function (cb2) {
                                global.http.sendUserServer({
                                    method: 'getOne',
                                    cond: {
                                        find: {
                                            _id: work_arr.user_id
                                        }
                                    },
                                    model: 'User_traffic'
                                }, obj.user_server_common, cb2);
                            },
                            function (traffic, cb2) {
                                if (traffic) {
                                    work_arr.user_name = traffic.real_name;
                                    work_arr.user_photo = traffic.photo_url;
                                } else {
                                    work_arr.user_name = "";
                                    work_arr.user_photo = "";
                                }
                                cb2();
                            },
                            function (cb2) {
                                global.http.sendUserServer({
                                    method: 'getOne',
                                    cond: {
                                        find: {
                                            _id: work_arr.company_id
                                        }
                                    },
                                    model: 'Company_traffic'
                                }, obj.user_server_common, cb2);
                            },
                            function (traffic, cb2) {
                                work_arr.company_name = traffic.nick_name;
                                work_arr.verify_phase = traffic.verify_phase;
                                cb2();
                            }
                        ], cbk);
                    }, cb);
                } else {
                    cb();
                }
            },
            function (cb) {
                if (result.other_arr.length) {
                    result.other_arr = _.sortBy(result.other_arr, function (data) {
                        return data.money;
                    });
                    async.eachSeries(result.other_arr, function (other_arr, cbk) {
                        async.waterfall([
                            function (cbk2) {
                                global.http.sendUserServer({
                                    method: 'getOne',
                                    cond: {
                                        find: {
                                            _id: other_arr.user_id
                                        }
                                    },
                                    model: 'User_traffic'
                                }, obj.user_server_common, cbk2);
                            },
                            function (traffic, cbk2) {
                                other_arr.user_name = traffic.real_name;
                                other_arr.user_photo = traffic.photo_url;
                                cbk2();
                            },
                            function (cbk2) {
                                global.http.sendUserServer({
                                    method: 'getOne',
                                    cond: {
                                        find: {
                                            _id: other_arr.company_id
                                        }
                                    },
                                    model: 'Company_traffic'
                                }, obj.user_server_common, cbk2);
                            },
                            function (traffic, cbk2) {
                                traffic = JSON.parse(JSON.stringify(traffic));
                                other_arr.company_name = traffic.nick_name;
                                other_arr.verify_phase = traffic.verify_phase;
                                cbk2();
                            }
                        ], cbk);
                    }, cb);
                } else {
                    cb();
                }
            }
        ], function (err) {
            if (err) {
                return next(err);
            }
            //result排序
            if (req.body.sort) {
                switch (req.body.sort) {
                    case 'new':
                        result.work_arr = _.sortBy(result.work_arr, function (item) {
                            return item.time_creation;
                        });
                        result.other_arr = _.sortBy(result.other_arr, function (item) {
                            return item.time_creation;
                        });
                        break;
                    case 'old':
                        result.work_arr = _.sortBy(result.work_arr, function (item) {
                            return -item.time_creation;
                        });
                        result.other_arr = _.sortBy(result.other_arr, function (item) {
                            return -item.time_creation;
                        });
                        break;
                    case 'less':
                        result.work_arr = _.sortBy(result.work_arr, function (item) {
                            return item.money;
                        });
                        result.other_arr = _.sortBy(result.other_arr, function (item) {
                            return item.money;
                        });
                        break;
                    case 'more':
                        result.work_arr = _.sortBy(result.work_arr, function (item) {
                            return -item.money;
                        });
                        result.other_arr = _.sortBy(result.other_arr, function (item) {
                            return -item.money;
                        });
                        break;
                }
            }
            config_common.sendData(req, result, next);
        })
    });

    return api;

};

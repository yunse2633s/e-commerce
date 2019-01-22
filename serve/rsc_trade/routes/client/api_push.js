/**
 * Created by Administrator on 2017/10/19.
 */
var async = require('async');
var _ = require('underscore');

module.exports = function (app, express) {

    var api = express.Router();

    api.use(require('../../middlewares/mid_verify_user')());
    /**
     * 判断是否刷新智能推荐
     */
    api.post('/refresh', function (req, res, next) {
        if (!global.config_common.push_type[req.body.type]) {
            return next('invalid_format');
        }
        var obj = {
            user_server_common: '/api/server/common/get', // 自定义查询user
            admin_server_get: "/api/server/common/get", // 自定义查询admin
            admin_server_edit_push_count: '/api/server/push_count/edit',
        };
        var pushData;
        var countData;
        var heiMingDan;
        async.waterfall([
            function (cb) {
                global.http.sendAdminServer({
                    method: 'getOne',
                    cond: {find: {type: 'company'}},
                    model: 'Blacklist'
                }, obj.admin_server_get, cb);
            },
            function (heimingdan, cb) {
                heiMingDan = heimingdan;
                global.http.sendAdminServer({
                    method: 'getOne',
                    cond: {find: {user_id: req.decoded.id}},
                    model: 'PushCount'
                }, obj.admin_server_get, cb);
            },
            function (data, cb) {
                if (data) {
                    //筛选出需要提推送的类型  -- 根据指挥中心转换type类型
                    var type = {
                        OFFER: 'DJ',     //报价
                        AUCTION: 'JJ', //竞价
                        DEMAND: 'demand'    //采购
                    }
                    var panDuan = _.filter(data.count, function (num) {
                        return num.type == type[req.body.type];
                    });
                    if (panDuan[0].count_validity_order > 0) {
                        countData = panDuan[0];
                    } else {
                        return cb('count_zero');
                    }
                } else {
                    return cb('count_zero');
                }
                global.lib_push.getOne({
                    find: {user_id: req.decoded.id, newest: true, type: req.body.type}
                }, cb);
            },
            function (push, cb) {
                //根据最新推送判断，是否刷新
                if (!push) {
                    cb(null, true, 1);
                } else {
                    pushData = push;
                    if (global.util.isSameDay(push.time_creation, new Date())) {
                        cb(null, false, 1);
                    } else {
                        var days = Math.floor((Date.now() - push.time_creation.getTime()) / (24 * 60 * 60 * 1000));
                        cb(null, days > 0, days);
                    }
                }
            },
            function (refresh, count, cb) {
                if (refresh) {
                    var cond = {};
                    async.waterfall([
                        function (cbk) {
                            //1,查询到这个人的好友
                            global.http.sendUserServer({
                                method: 'getList',
                                cond: {
                                    find: {user_id: req.decoded.id.toString(), type: 'FRIEND'}
                                },
                                model: 'User_relation'
                            }, obj.user_server_common, cbk);
                        },
                        function (user, cbk) {
                            cond.user_id = {$nin: _.pluck(user, 'other_id')};
                            //获取个人买卖产品
                            global.lib_User.getUserOne({find: {_id: req.decoded.id}}, cbk);
                        },
                        function (user, cbk) {
                            //个人有公司则获取公司买卖产品
                            if (global.lib_User.checkUserCompany(user)) {
                                global.lib_User.getCompanyOne({find: {_id: user.company_id}}, cbk);
                            } else {
                                cbk(null, user);
                            }
                        },
                        function (data, cbk) {
                            //初始化不推荐的公司
                            cond.company_id = {$nin: heiMingDan ? heiMingDan.id : []};
                            if (req.decoded.company_id) {
                                cond.company_id = {$nin: [req.decoded.company_id]};
                                //2,查询到和这个人所在公司合作的公司
                                global.lib_User.getWorkRelation({find: {company_id: req.decoded.company_id}}, function (err, rel) {
                                    cond.company_id.$nin = cond.company_id.$nin.concat(_.pluck(rel, 'other_company_id'));
                                    cond.company_id.$nin = cond.company_id.$nin.concat(heiMingDan ? heiMingDan.id : []);
                                })
                            }
                            if (req.body.type === global.config_common.push_type.OFFER ||
                                req.body.type === global.config_common.push_type.AUCTION) {
                                //报价如下
                                async.waterfall([
                                    //todo 不能是认证公司，不能是好友，有更新的可以推荐
                                    // if(pushData){
                                    //     cond.time_update = {$gt: pushData.time_creation};
                                    // }
                                    function (callback) {
                                        //匹配报价产品
                                        global.lib_PriceOfferProducts.getList({
                                            find: {$or: [{'layer.material': {$in: data['buy']}}, {'layer.material_chn': {$in: data['buy']}}]}
                                        }, callback);
                                    },
                                    function (result, callback) {
                                        //匹配报价个数
                                        cond._id = {$in: _.pluck(result, 'PID')};
                                        cond.status = global.config_model.offer_status.published;
                                        if (req.body.type === global.config_common.push_type.OFFER) {
                                            cond.type = global.config_model.offer_type.DJ;
                                        } else {
                                            cond.type = {$nin: [global.config_model.offer_type.DJ]};
                                        }
                                        global.lib_PriceOffer.getCount(cond, callback);
                                    },
                                    function (offerCount, callback) {
                                        //随机取报价
                                        var skip = offerCount >= count ? Math.floor(Math.random() * Math.abs(offerCount - count)) : 0;
                                        global.lib_PriceOffer.getList({
                                            find: cond,
                                            select: '_id',
                                            skip: skip,
                                            limit: countData.count_everyday_order,
                                            sort: {time_creation: -1}
                                        }, callback);
                                    }
                                ], cbk);
                            } else {
                                cond['$or'] = [
                                    {product_categories: {$elemMatch: {'layer.material': {$in: data['sell']}}}},
                                    {product_categories: {$elemMatch: {'layer.material_chn': {$in: data['sell']}}}}
                                ];
                                cond.status = global.config_model.offer_status.published;
                                async.waterfall([
                                    function (callback) {
                                        global.lib_Demand.getCount(cond, callback);
                                    },
                                    function (offerCount, callback) {
                                        var skip = offerCount >= count ? Math.floor(Math.random() * Math.abs(offerCount - count)) : 0;
                                        global.lib_Demand.getList({
                                            find: cond,
                                            select: '_id',
                                            skip: skip,
                                            limit: countData.count_everyday_order,
                                            sort: {time_creation: -1}
                                        }, callback);
                                    }
                                ], cbk);
                            }
                        },
                        function (offers, cbk) {
                            if (offers.length) {
                                global.lib_push.update({
                                    find: {
                                        user_id: req.decoded.id,
                                        type: req.body.type,
                                        status: global.config_common.push_status.effective
                                    },
                                    set: {status: global.config_common.push_status.effective}
                                }, function (err) {
                                    if (err) {
                                        return cbk(err);
                                    }
                                });
                                global.lib_push.add({
                                    user_id: req.decoded.id,
                                    id: _.map(_.pluck(offers, '_id'), function (num) {
                                        return num.toString()
                                    }),
                                    type: req.body.type,
                                    newest: true
                                }, function (err, content, count) {
                                    //修改指挥中心数据
                                    global.http.sendAdminServer({
                                        count: content.id.length,
                                        id: req.decoded.id,
                                        type: req.body.type,
                                        type_two: 'order'
                                    }, obj.admin_server_edit_push_count, function (err) {
                                        if (err) {
                                            return cbk(err);
                                        }
                                        console.log('指挥中心推荐数量修改成功')
                                    });
                                    cbk();
                                });
                            } else {
                                cbk();
                            }
                        }
                    ], cb);
                } else {
                    cb();
                }
            }
        ], function (err) {
            if (err) {
                return next(err);
            }
            global.config_common.sendData(req, {}, next);
        });
    });

    /**
     * 得到最新的智能推荐
     */
    api.post('/get_newest', function (req, res, next) {
        if (!global.config_common.push_type[req.body.type]) {
            return next('invalid_format');
        }
        var user_server_common = '/api/server/common/get';
        var result = [];
        var Data;
        async.waterfall([
            function (cb) {
                global.lib_push.getOne({
                    find: {
                        user_id: req.decoded.id,
                        newest: true,
                        type: req.body.type,
                        status: global.config_common.push_status.effective
                    }
                }, cb);
            },
            function (push, cb) {
                if (!push) {
                    return global.config_common.sendData(req, {}, next);
                }
                if (push.type === global.config_common.push_type.OFFER ||
                    push.type === global.config_common.push_type.AUCTION) {
                    global.lib_PriceOffer.getList({find: {_id: {$in: push.id}}}, cb);
                } else {
                    global.lib_Demand.getList({find: {_id: {$in: push.id}}}, cb);
                }
            },
            function (data, cb) {
                async.eachSeries(data, function (one_data, callback) {
                    var companyData;
                    async.waterfall([
                        function (cbk) {
                            if (one_data.company_id) {
                                global.lib_User.getCompanyOne({
                                    find: {_id: one_data.company_id},
                                    select: 'nick_name url_logo verify_phase'
                                }, cbk);
                            } else {
                                cbk(null, null);
                            }
                        },
                        function (company, cbk) {
                            companyData = company;
                            global.lib_User.getUserOne({
                                find: {_id: one_data.user_id},
                                select: 'photo_url real_name recommend'
                            }, cbk);
                        },
                        function (user, cbk) {
                            global.http.sendUserServer({
                                method: 'getOne',
                                cond: {find: {_id: one_data.location_storage}},
                                model: 'Address'
                            }, user_server_common, function(err,address){
                                one_data.site=address;
                                if(user.recommend){
                                    result.push({
                                        list: one_data,
                                        company: companyData,
                                        user: user
                                    });
                                }
                                cbk();
                            });
                        }
                    ], callback)
                }, cb);
            }

            // function (data, cb) {
            //     Data = data;
            //     result.list = data;
            //     // if(req.body.type === global.config_common.push_type.OFFER){
            //     global.lib_User.getCompanyOne({
            //         find: {_id: data.company_id},
            //         select: 'nick_name url_logo verify_phase'
            //     }, cb);
            //     // }else{
            //     //
            //     // }
            // },
            // function (company, cb) {
            //     result.company = company;
            //     // if(req.body.type === global.config_common.push_type.OFFER){
            //     global.lib_User.getUserOne({find: {_id: Data.user_id}, select: 'photo_url real_name'}, cb);
            //     // }else{
            //     //
            //     // }
            // },
            // function (user, cb) {
            //     result.user = user;
            //     cb();
            // }

        ], function (err) {
            if (err) {
                return next(err);
            }
            async.eachSeries(result.list,function(one_data,cb){
                if(one_data.list.browse_offer.length && _.indexOf(one_data.list.browse_offer, req.decoded.id)!=-1){
                    one_data.list.hint = "已浏览";
                }
                if(one_data.list.list_offer.length && _.indexOf(one_data.list.list_offer, req.decoded.id)!=-1){
                    one_data.list.hint = "已出价";
                }
                if(one_data.list.has_order.length && _.indexOf(one_data.list.has_order, req.decoded.id)!=-1){
                    one_data.list.hint = "已交易";
                }
                if (one_data.list.type == 'DJ' && one_data.list.hint =="已浏览") {
                    global.lib_http.sendTradeServer({
                        method: 'getOne',
                        cond: {
                            find: {
                                user_demand_id: req.decoded.id,
                                offer_id:one_data.list._id.toString()
                            }
                        },
                        model: 'shop'
                    }, global.config_api_url.trade_server_common_get,function(err,data){
                        if(data){
                            one_data.list.hint="已加入购物车";
                        }
                        cb();
                    });
                }else {
                    cb();
                }
            },function(err){
                if (err){
                    console.log(err);
                }
                global.config_common.sendData(req, result, next);
            });
            //global.config_common.sendData(req, result, next);
        });
    });

    /**
     * 得到历史智能推荐
     * 需要继续修改
     */
    api.post('/get_list', function (req, res, next) {
        if (!global.config_common.push_type[req.body.type]) {
            return next('invalid_format');
        }
        if (!_.isNumber(req.body.page) && !req.body.page) {
            req.body.page = 1;
        }
        var finishData = {};
        var cond = {
            user_id: req.decoded.id,
            type: req.body.type,
            status: global.config_common.push_status.ineffective
        };
        async.waterfall([
            function (cb) {
                global.lib_push.getCount(cond, cb);
            },
            function (count, cb) {
                finishData.count = count;
                finishData.exist = count > req.body.page * global.config_common.entry_per_page;
                global.lib_push.getList({
                    find: cond,
                    skip: (req.body.page - 1) * global.config_common.entry_per_page,
                    limit: global.config_common.entry_per_page,
                    sort: {time_creation: -1}
                }, cb);
            },
            function (pushes, cb) {
                finishData.list = [];
                var arr = _.flatten(_.pluck(pushes, 'id'));
                async.eachSeries(arr, function (id, callback) {
                    var Data;
                    var result = {};
                    async.waterfall([
                        function (cbk) {
                            if (req.body.type === global.config_common.push_type.OFFER ||
                                req.body.type === global.config_common.push_type.AUCTION) {
                                global.lib_PriceOffer.getOne({find: {_id: id}}, cbk);
                            } else {
                                global.lib_Demand.getOne({find: {_id: id}}, cbk);
                            }
                        },
                        function (data, cbk) {
                            if (data) {
                                Data = data;
                                result.list = data;
                                // if(req.body.type === global.config_common.push_type.OFFER){
                                global.lib_User.getCompanyOne({
                                    find: {_id: data.company_id},
                                    select: 'nick_name url_logo verify_phase'
                                }, cbk);
                                // }else{
                                //
                                // }
                            } else {
                                cbk(null, null);
                            }
                        },
                        function (company, cbk) {
                            if (Data) {
                                result.company = company;
                                // if(req.body.type === global.config_common.push_type.OFFER){
                                global.lib_User.getUserOne({
                                    find: {_id: Data.user_id},
                                    select: 'photo_url real_name'
                                }, cbk);
                                // }else{
                                //
                                // }
                            } else {
                                cbk(null, null);
                            }
                        },
                        function (user, cbk) {
                            if(user){
                                result.user = user;
                                finishData.list.push(result);
                            }
                            cbk();
                        }
                    ], callback);
                }, cb);
            }
        ], function (err) {
            if (err) {
                return next(err);
            }
            global.lib_common.hint(finishData,req,function(err,data){
                global.config_common.sendData(req, data, next);
            });
            //global.config_common.sendData(req, finishData, next);
        });
    });

    api.post('/get_count', function (req, res, next) {
        if (!global.config_common.push_type[req.body.type]) {
            return next('invalid_format');
        }
        async.parallel([
            function (cb) {
                global.lib_push.getCount({
                    user_id: req.decoded.id,
                    newest: false,
                    type: req.body.type,
                    status: global.config_common.push_status.effective
                }, cb);
            },
            function (cb) {
                global.lib_push.getCount({
                    user_id: req.decoded.id,
                    newest: false,
                    type: req.body.type,
                    status: global.config_common.push_status.ineffective
                }, cb);
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            global.config_common.sendData(req, {
                total: result[0] + result[1],
                effective: result[0],
                ineffective: result[1]
            }, next);
        });
    });

    /**
     * 得到专属推荐列表
     */
    api.post('/get_list_exclusive', function (req, res, next) {
        if (!global.config_common.push_type[req.body.type]) {
            return next('invalid_format');
        }
        var user_server_common = '/api/server/common/get';
        //筛选出需要提推送的类型  -- 根据指挥中心转换type类型
        var type = {
            OFFER: 'DJ',        //报价
            AUCTION: 'JJ',      //竞价
            DEMAND: 'demand'    //采购
        }
        req.body.type = type[req.body.type];
        var obj = {
            user_server_common: '/api/server/common/get', // 自定义查询user
            admin_server_get: "/api/server/common/get", // 自定义查询admin
            admin_server_edit_push_count: '/api/server/push_count/edit',
        };
        var cond = {
            user_id: req.decoded.id,
            type: req.body.type
        };
        var finishData = {};
        async.waterfall([
            function (cb) {
                global.http.sendAdminServer({
                    method: 'getOne',
                    cond: {find: cond},
                    model: 'ExclusivePush'
                }, obj.admin_server_get, cb);
            },
            function (adminData, cb) {
                if (!adminData) {
                    return cb('count_zero');
                }
                finishData.list = [];
                async.eachSeries(adminData.id, function (id, callback) {
                    var Data;
                    var result = {};
                    async.waterfall([
                        function (cbk) {
                            if (req.body.type === 'DJ' || req.body.type === 'JJ') {
                                global.lib_PriceOffer.getOne({
                                    find: {_id: id}
                                }, cbk);
                            } else {
                                global.lib_Demand.getOne({
                                    find: {_id: id}
                                }, cbk);
                            }
                        },
                        function (data, cbk) {
                            global.http.sendUserServer({
                                method: 'getOne',
                                cond: {find: {_id: data.location_storage}},
                                model: 'Address'
                            }, user_server_common, function(err,address){
                                data.site=address;
                            });
                            Data = data;
                            result.list = data;
                            if (data) {
                                global.lib_User.getCompanyOne({
                                    find: {_id: data.company_id},
                                    select: 'nick_name url_logo verify_phase'
                                }, cbk);
                            } else {
                                cbk(null, null);
                            }
                        },
                        function (company, cbk) {
                            result.company = company;
                            if (Data) {
                                global.lib_User.getUserOne({
                                    find: {_id: Data.user_id},
                                    select: 'photo_url real_name'
                                }, cbk);
                            } else {
                                cb(null, null);
                            }
                        },
                        function (user, cbk) {
                            result.user = user;
                            result.admin = {admin_name: adminData.admin_name};
                            finishData.list.push(result);
                            cbk();
                        }
                    ], callback);
                }, cb);
            }
        ], function (err) {
            if (err) {
                return next(err);
            }
            //global.config_common.sendData(req, finishData, next);
            //global.lib_common.hint(finishData,req,next);
            global.lib_common.hint(finishData,req,function(err,data){
                global.config_common.sendData(req, data, next);
            });
        });
    });

    return api;
};
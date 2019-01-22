/**
 * Created by Administrator on 17/5/4.
 */
var async = require('async');
var decimal = require('decimal');
var jwt = require('jsonwebtoken');
var config_error = global.config_error;
var config_common = global.config_common;

var lib_Demand = global.lib_Demand;
var lib_DemandOffer = global.lib_DemandOffer;
var lib_DemandOrder = global.lib_DemandOrder;
var lib_common = global.lib_common;


module.exports = function (app, express) {

    var api = express.Router();

    /**
     * 获取自己发布的列表
     * id  采购单id
     */
    api.post('/get_list', function (req, res, next) {
        var page_num = req.body.page || 1;
        async.waterfall([
            function (cb) {
                var token = req.body['x-access-token'] || req.headers['x-access-token'];
                if (token) {
                    jwt.verify(token, config_common.secret_keys.user, function (err, decoded) {
                        if (err && err.message == 'jwt expired') {
                            return cb('jwt_expired');
                        } else if (err) {
                            return cb('auth_failed_user');
                        }
                        req.decoded = decoded;
                    });
                }
                cb();
            },
            function (cb) {
                config_error.checkBody(req.body, ['id', 'page'], cb);
            },
            function (cb) {
                lib_DemandOffer.getListAndCount(page_num, {
                    find: {demand_id: req.body.id},
                    sort: req.body.sort || {time_creation: -1},
                    skip: config_common.entry_per_page * (page_num - 1),
                    limit: config_common.entry_per_page
                }, cb);
            },
            function (result, cb) {
                result.list = global.util.toObjective(result.list);
                global.lib_common.addUserAndCompany(req, result, cb, 'supply', 'user_supply_id', 'company_supply_id');
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, result, next);
        });
    });

    // 拦截非授权请求
    api.use(require('../../middlewares/mid_verify_user')());
    /**
     * 增删改查
     */
    api.post('/add', function (req, res, next) {
        var entry;
        async.waterfall([
            function (cb) {
                config_error.checkRole(req.decoded.role, [config_common.user_roles.TRADE_ADMIN, config_common.user_roles.TRADE_SALE, config_common.user_roles.TRADE_PURCHASE], cb);
            },
            function (cb) {
                config_error.checkBody(req.body, ['id', 'price_type'],
                    cb, [
                        [{type: 'DjJJ'}, ['amount']],
                        [{type: 'QjJJ'}, ['amount_min', 'amount_max']]
                    ]);
            },
            function (cb) {
                lib_Demand.getOne({
                    find: {_id: req.body.id}
                }, cb);
            },
            function (demand, cb) {
                entry = demand;
                global.lib_ProductClassify.checkProduct(req.body.product_categories, null, cb);
            },
            function (result, cb) {
                if (entry.list_offer.indexOf(req.decoded.id) >= 0) return next(config_error.JJ_ERROR);
                var demandOffer = {
                    demand_id: entry._id,
                    admin_id: req.decoded.admin_id || entry.admin_id,
                    user_supply_id: req.decoded.id,
                    company_supply_id: req.decoded.company_id,
                    company_supply_name: req.decoded.company_name,
                    user_demand_id: entry.user_id,
                    company_demand_id: entry.company_id,
                    company_demand_name: entry.company_name,

                    product_categories: result,

                    att_quality: entry.att_quality,
                    att_payment: entry.att_payment,
                    att_traffic: entry.att_traffic,
                    att_settlement: entry.att_settlement,
                    path_loss: entry.path_loss,

                    price_type: req.body.price_type,
                    price: req.body.price ? req.body.price : entry.price,
                    amount: req.body.amount,

                    location_storage: req.body.location_storage,
                    location_storage_unit_id: req.body.location_storage_unit_id,
                    location_depart: entry.location_depart,
                    location_depart_unit_id: entry.location_storage_unit_id,
                    payment_style: entry.payment_style,
                    quality_img: entry.quality_img,
                    replenish: req.body.replenish,

                    time_validity: new Date(entry.time_validity.getTime() + 1000 * 60 * 60 * 24 * 3),

                    delay_day: entry.delay_day,
                    delay_type: entry.delay_type,
                    percent_advance: entry.percent_advance,
                    appendix: req.body.appendix
                };
                lib_DemandOffer.add(req, demandOffer, cb);
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            if (result.type == global.config_model.demand_type.DjJJ) {
                global.lib_User.getUserOne({find: {_id: result.user_demand_id}}, function (err, user) {
                    global.lib_msg.push(req, {
                        title: '发布采购被抢单',
                        content: global.config_msg_templates.encodeContent(
                            'add_demandOffer',
                            [user.real_name, entry.product_categories[0].layer.material_chn, entry.has_order.length + 1, entry.count_offer])
                    }, {}, '', {
                        params: {id: result.demand_id, type: 'sell'},
                        url: config_common.push_url.demandOffer
                    }, [result.user_demand_id]);
                });
            } else {
                global.lib_User.getUserOne({find: {_id: result.user_demand_id}}, function (err, user) {
                    global.lib_msg.push(req, {
                        title: '发布采购被抢单',
                        content: global.config_msg_templates.encodeContent(
                            'add_demandOffer_QjJJ',
                            [user.real_name, entry.product_categories[0].layer.material_chn, result.company_supply_name, req.body.price])
                    }, {}, '', {
                        params: {id: result.demand_id, type: 'sell'},
                        url: config_common.push_url.demandOffer
                    }, [result.user_demand_id]);
                });
            }
            // global.lib_User.getUserOne({find: {_id: result.demand_id}}, function (err, user) {
            //     if (user) {
            //         global.lib_msg.send_sms([user.real_name, entry.product_categories[0].layer.material_chn, entry.has_order.length, entry.count_offer], 'demand_offer_add', [user.phone]);
            //     }
            // });
            config_common.sendData(req, {
                offer_id: result._id,
                demand_id: entry._id
            }, next);
        });
    });
    api.post('/del', function (req, res, next) {
        lib_common.del(req, [lib_DemandOffer, lib_Demand], function (err, result) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, result, next);
        });
    });
    api.post('/edit', function (req, res, next) {
        lib_common.edit(req, lib_DemandOffer, function (err, result) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, result, next);
        });
    });
    api.post('/detail', function (req, res, next) {
        lib_common.detail(req, lib_DemandOffer, function (err, result) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, result, next);
        });
    });

    /**
     * 剩余修改次数
     * id   抢单id
     */
    api.post('/get_change_remain', function (req, res, next) {
        lib_common.get_change_remain(req, lib_DemandOffer, function (err, result) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, result, next);
        });
    });

    /**
     * 获取自己发布的列表
     * id  采购单id
     */
    // api.post('/get_list', function (req, res, next) {
    //     var page_num = req.body.page || 1;
    //     async.waterfall([
    //         function (cb) {
    //             var token = req.body['x-access-token'] || req.headers['x-access-token'];
    //             if (token) {
    //                 jwt.verify(token, config_common.secret_keys.user, function (err, decoded) {
    //                     if (err && err.message == 'jwt expired') {
    //                         return cb('jwt_expired');
    //                     } else if (err) {
    //                         return cb('auth_failed_user');
    //                     }
    //                     req.decoded = decoded;
    //                 });
    //             }
    //             cb();
    //         },
    //         function (cb) {
    //             config_error.checkBody(req.body, ['id', 'page'], cb);
    //         },
    //         function (cb) {
    //             lib_DemandOffer.getListAndCount(page_num, {
    //                 find: {demand_id: req.body.id},
    //                 sort: req.body.sort || {time_creation: -1},
    //                 skip: config_common.entry_per_page * (page_num - 1),
    //                 limit: config_common.entry_per_page
    //             }, cb);
    //         },
    //         function (result, cb) {
    //             result.list = global.util.toObjective(result.list);
    //             global.lib_common.addUserAndCompany(req, result, cb, 'supply', 'user_supply_id', 'company_supply_id');
    //         }
    //     ], function (err, result) {
    //         if (err) {
    //             return next(err);
    //         }
    //         config_common.sendData(req, result, next);
    //     });
    // });

    return api;
};

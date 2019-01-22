/**
 * Created by Administrator on 17/5/15.
 */
var async = require('async');
var decimal = require('decimal');
var jwt = require('jsonwebtoken');
var _ = require('underscore');

var config_common = global.config_common;
var config_error = global.config_error;

var lib_priceOfferCity = global.lib_priceOfferCity;
var lib_PriceOffer = global.lib_PriceOffer;
var lib_OfferAgain = global.lib_OfferAgain;
var lib_DemandOrder = global.lib_DemandOrder;
var lib_common = global.lib_common;

module.exports = function (app, express) {

    var api = express.Router();

    /**
     * 获取竞价排行榜
     * id 报价id
     * page
     */
    api.post('/get_list', function (req, res, next) {
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
                var page_num = req.body.page || 1;
                lib_OfferAgain.getListAndCount(page_num, {
                    find: {offer_id: req.body.id},
                    sort: req.body.sort || {time_creation: -1},
                    skip: config_common.entry_per_page * (page_num - 1),
                    limit: config_common.entry_per_page
                }, cb);
            },
            function (result, cb) {
                result.list = global.util.toObjective(result.list);
                global.lib_common.addUserAndCompany(req, result, cb, 'demand', 'user_demand_id', 'company_demand_id');
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
        var offerData;
        async.waterfall([
            function (cb) {
                config_error.checkBody(req.body, ['id', 'product_categories', 'price', 'amount', 'price_type'], cb);
            },
            // function (cb) {
            //     if (!req.decoded.company_id) return cb(config_error.invalid_VIP);
            //     global.lib_User.checkCompanyVIP({_id: req.decoded.company_id}, cb);
            // },
            function (cb) {
                lib_PriceOffer.getOne({
                    find: {_id: req.body.id}
                }, cb);
            },
            function (offer, cb) {
                offerData = offer;
                console.log('req.body.id',req.body.id);
                if (offer.list_offer.indexOf(req.decoded.id) >= 0) return next(config_error.JJ_ERROR);
                var offerAgain = {
                    admin_id: req.decoded.admin_id || offer.admin_id,
                    offer_id: req.body.id,
                    user_demand_id: req.decoded.id,
                    user_supply_id: offer.user_id,
                    company_demand_id: req.decoded.company_id,
                    company_demand_name: req.decoded.company_name,
                    company_supply_id: offer.company_id,
                    company_supply_name: offer.company_name,

                    product_categories: req.body.product_categories,

                    price_type: req.body.price_type,

                    att_quality: offer.att_quality,
                    att_payment: offer.att_payment,
                    att_traffic: offer.att_traffic,
                    att_settlement: offer.att_settlement,
                    path_loss: offer.path_loss,

                    price: req.body.price,
                    amount: req.body.amount,

                    location_storage: offer.location_storage,
                    location_depart: req.body.location_depart,
                    quality_img: offer.quality_img,
                    role: req.decoded.role,
                    type: offer.type,
                    replenish: req.body.replenish || [],
                    payment_style: req.body.payment_style || 'FOB',
                    time_validity: offer.time_validity,
                    time_creation: new Date(),

                    delay_day: offer.delay_day,
                    delay_type: offer.delay_type,
                    percent_advance: offer.percent_advance
                };
                lib_OfferAgain.add(req, offerAgain, cb);
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            global.lib_User.getUserOne({find: {_id: result.user_supply_id}}, function (err, user) {
                if (user) {
                    global.lib_msg.send_sms([user.real_name, result.product_categories[0].layer.material_chn, result.company_demand_name, result.amount, result.company_demand_name], 'bidding_offer_add', [user.phone]);
                }
            });
            if (!offerData.admin_id) {
                global.lib_User.getUserOne({find: {_id: result.user_supply_id}}, function (err, userData) {
                    global.lib_msg.push(req, {
                        title: '交易竞价',
                        content: global.config_msg_templates.encodeContent('add_JJ',
                            [userData.real_name, result.product_categories[0].layer['layer_1_chn'], result.company_demand_name, result.amount, result.company_demand_name])
                    }, {}, '', {
                        params: {id: result.offer_id},
                        url: config_common.push_url.offerAgain
                    }, [result.user_supply_id]);
                });
            } else {
                global.lib_User.getUserOne({find: {_id: result.user_supply_id}}, function (err, userData) {
                    global.lib_msg.push(req, {
                        title: '交易竞价',
                        content: global.config_msg_templates.encodeContent('add_JJ_dai',
                            [userData.real_name, result.amount, result.product_categories[0].layer['layer_1_chn'], result.company_demand_name, offerData.count_offer + 1])
                    }, {}, '', {
                        params: {id: result.offer_id},
                        url: config_common.push_url.offerAgain
                    }, [result.user_supply_id]);
                });
            }

            config_common.sendData(req, result, next);
        });
    });
    api.post('/del', function (req, res, next) {
        lib_common.del(req, [lib_OfferAgain, lib_PriceOffer], function (err) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, {}, next);
        }, 'offer_id', true);
    });
    api.post('/edit', function (req, res, next) {
        lib_common.edit(req, lib_OfferAgain, function (err, result) {
            if (err) {
                return next(err);
            }
            //修改竞价的之后的发推送
            global.lib_OfferAgain.getOne({find: {_id: result}}, function (err, data) {
                http.sendMsgServerNotToken(req, {
                    title: '交易竞价',
                    user_ids: JSON.stringify([data.user_supply_id]),
                    content: req.decoded.company_name + req.decoded.user_name + "修改了竞价，请查看",
                    data: JSON.stringify({
                        params: {id: data.offer_id, type: "TRADE"},
                        url: 'rsc.bidding_details',
                        type: "TRADE"
                    })
                }, '/api/push/push');
            });

            config_common.sendData(req, result, next);
        });
    });
    api.post('/detail', function (req, res, next) {
        lib_common.detail(req, lib_OfferAgain, function (err, result) {
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
        lib_common.get_change_remain(req, lib_OfferAgain, function (err, result) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, result, next);
        });
    });

    /**
     * 获取竞价总吨数
     * id   抢单id
     */
    api.post('/get_total_amount', function (req, res, next) {
        async.waterfall([
            function (cb) {
                config_error.checkBody(req.body, ['offer_id'], cb);
            },
            function (cb) {
                lib_OfferAgain.getAggregate({
                    match: {offer_id: req.body.offer_id},
                    group: {_id: null, 'sum': {$sum: '$amount'}}
                }, cb);
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, result[0], next);
        });
    });

    /**
     * 获取竞价排行榜 --已提到最上！wly
     * id 报价id
     * page
     */
    // api.post('/get_list', function (req, res, next) {
    //     async.waterfall([
    //         function (cb) {
    //             config_error.checkBody(req.body, ['id', 'page'], cb);
    //         },
    //         function (cb) {
    //             var page_num = req.body.page || 1;
    //             lib_OfferAgain.getListAndCount(page_num, {
    //                 find: {offer_id: req.body.id},
    //                 sort: req.body.sort || {time_creation: -1},
    //                 skip: config_common.entry_per_page * (page_num - 1),
    //                 limit: config_common.entry_per_page
    //             }, cb);
    //         },
    //         function (result, cb) {
    //             result.list = global.util.toObjective(result.list);
    //             global.lib_common.addUserAndCompany(req, result, cb, 'demand', 'user_demand_id', 'company_demand_id');
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
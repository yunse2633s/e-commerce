/**
 * Created by Administrator on 17/6/24.
 */
var async = require('async');
var _ = require('underscore');

var config_common = global.config_common;

var lib_shop = global.lib_shop;
var lib_PriceOffer = global.lib_PriceOffer;
var lib_priceOfferCity = global.lib_priceOfferCity;
var lib_common = global.lib_common;
var lib_log = global.lib_log;
module.exports = function (app, express) {

    var api = express.Router();

    // 拦截非授权请求
    api.use(require('../../middlewares/mid_verify_user')());

    /**
     * 区域优惠
     * ids              区域id数组
     *
     * 批量优惠
     * price     优惠额度
     */
    api.post('/preferential', function (req, res, next) {
        var log;
        var baoJiaIds;
        async.waterfall([
            function (cb) {
                global.config_error.checkBody(req.body, ['ids', 'price'], cb);
            },
            function (cb) {
                lib_priceOfferCity.getList({find: {_id: {$in: req.body.ids}}}, cb);
            },
            function (data, cb) {
                baoJiaIds = _.flatten(_.pluck(data, 'PID'));
                if (req.body.province) {
                    async.eachSeries(data, function (one_data, callback) {
                        async.waterfall([
                            function (cbk) {
                                //确认如果one_data是一个全国的，我需要将它修改补全为新的优惠区域列表
                                if (one_data.countries == '全国' && one_data.price == 0) {
                                    if (!req.body.city) {
                                        req.body.city = [''];
                                    }
                                    var priceOfferCity = [];
                                    for (var i = 0; i < req.body.city.length; i++) {
                                        var obj = {
                                            "city": req.body.city[i],
                                            "province": req.body.province,
                                            "price": req.body.price,
                                            "user_id": one_data.user_id,
                                            "PID": one_data.PID
                                        }
                                        priceOfferCity.push(obj);
                                    }
                                    lib_priceOfferCity.del(one_data, function (err, aa) {
                                        lib_priceOfferCity.addList(priceOfferCity, cbk);
                                    })
                                } else if (one_data.countries == '全国') {
                                    lib_priceOfferCity.update({
                                        find: {_id: one_data._id.toString()},
                                        set: {price: req.body.price}
                                    }, cbk);
                                } else if (one_data.province == req.body.province) {
                                    if (!req.body.city) {
                                        req.body.city = [''];
                                    }
                                    var priceOfferCity = [];
                                    for (var i = 0; i < req.body.city.length; i++) {
                                        var obj = {
                                            "city": req.body.city[i],
                                            "province": req.body.province,
                                            "price": req.body.price,
                                            "user_id": one_data.user_id,
                                            "PID": one_data.PID
                                        }
                                        priceOfferCity.push(obj);
                                    }
                                    lib_priceOfferCity.del(one_data, function (err, aa) {
                                        lib_priceOfferCity.addList(priceOfferCity, cbk);
                                    })
                                } else {
                                    cbk(null, null);
                                }
                            },
                            function (jieShou, cbk) {
                                cbk();
                            }
                        ], callback)
                    }, cb);
                } else {
                    lib_priceOfferCity.update({
                        find: {_id: {$in: req.body.ids}},
                        set: {price: req.body.price}
                    }, function (err, result) {
                        cb();
                    });
                }
            },
            function (cb) {
                lib_priceOfferCity.getList({
                    find: {_id: {$in: req.body.ids}}
                }, cb);
            },
            function (result, cb) {
                lib_PriceOffer.update({
                    find: {_id: {$in: _.pluck(result, 'offer_id')}, province: req.body.province},
                    set: {time_preferential: new Date()}
                }, cb);
            },
            function (result, cb) {
                lib_log.add({
                    user_id: req.decoded.id,
                    product_name: req.body.product_name,
                    type: 'preferential',
                    price: req.body.price,
                    province: req.body.province,
                    city: req.body.city,
                    countries: req.body.countries,
                    layer: global.middleware.getLayer(req.body),
                    content: req.body.type ? [{
                        type: global.config_model.price_type[req.body.type]
                    }] : [{
                        type: global.config_model.price_type['price_remember']
                    }, {
                        type: global.config_model.price_type['price_weight']
                    }]
                }, cb);
            },
            function (result, count, cb) {
                log = result;
                // global.lib_msg.push(req, {
                //     title: '区域优惠',
                //     content: global.config_msg_templates.encodeContent('preferential', [req.decoded.company_name || '', req.decoded['user_name']])
                // }, {}, '', {}, null, global.config_model.company_type.PURCHASE, cb);
                cb(null, result);
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            //修改购物车中的相关数据
            for (var i = 0; i < baoJiaIds.length; i++) {
                global.lib_common.editShop(baoJiaIds[i]);
            }
            config_common.sendData(req, _.extend({log: log}, result), next);
        });
    });

    /**
     * 区域优惠
     * ids              区域id数组
     * preferential_FOB 优惠出厂价
     * preferential_CIF 优惠到岸价
     *
     * 批量优惠
     * price     优惠额度
     //  */
    // api.post('/preferential', function (req, res, next) {
    //     async.waterfall([
    //         function (cb) {
    //             global.config_error.checkBody(req.body, ['ids', 'company_ids'], cb);
    //         },
    //         function (cb) {
    //             async.eachSeries(req.body.company_ids, function (id, callback) {
    //                 async.eachSeries(req.body.ids, function (city_id, cback) {
    //                     async.waterfall([
    //                         function (cbk) {
    //                             lib_priceOfferCity.getOne({
    //                                 find: {_id: city_id}
    //                             }, cbk);
    //                         },
    //                         function (result, cbk) {
    //                             var FOB = [], CIF = [], isFOB = false, isCIF = false;
    //                             if (req.body.price) {
    //                                 result.preferential_FOB.forEach(function (preferentialObj) {
    //                                     if (preferentialObj.company_id === id) {
    //                                         isFOB = true;
    //                                         preferentialObj['price'] = req.body.price;
    //                                     }
    //                                     FOB.push(preferentialObj);
    //                                 });
    //                                 result.preferential_CIF.forEach(function (preferentialObj) {
    //                                     if (preferentialObj.company_id === id) {
    //                                         isCIF = true;
    //                                         preferentialObj['price'] = req.body.price;
    //                                     }
    //                                     CIF.push(preferentialObj);
    //                                 });
    //                                 if (!isFOB) FOB.push({company_id: id, price: req.body.price});
    //                                 if (!isCIF) CIF.push({company_id: id, price: req.body.price});
    //                             } else if (req.body.FOB) {
    //                                 CIF = result.preferential_CIF;
    //                                 result.preferential_FOB.forEach(function (preferentialObj) {
    //                                     if (preferentialObj.company_id === id) {
    //                                         isFOB = true;
    //                                         preferentialObj['price'] = req.body.FOB;
    //                                     }
    //                                     FOB.push(preferentialObj);
    //                                 });
    //                                 if (!isFOB) FOB.push({company_id: id, price: req.body.FOB});
    //                             } else {
    //                                 FOB = result.preferential_FOB;
    //                                 result.preferential_CIF.forEach(function (preferentialObj) {
    //                                     if (preferentialObj.company_id === id) {
    //                                         isCIF = true;
    //                                         preferentialObj['price'] = req.body.CIF;
    //                                     }
    //                                     CIF.push(preferentialObj);
    //                                 });
    //                                 if (!isCIF) CIF.push({company_id: id, price: req.body.CIF});
    //                             }
    //                             result.preferential_FOB = FOB;
    //                             result.preferential_CIF = CIF;
    //                             result.markModified('preferential_CIF');
    //                             result.markModified('preferential_FOB');
    //                             lib_priceOfferCity.edit(result, cbk);
    //                         }
    //                     ], cback);
    //                 }, callback);
    //             }, cb);
    //         },
    //         function (cb) {
    //             lib_priceOfferCity.getList({
    //                 find: {_id: {$in: req.body.ids}}
    //             }, cb);
    //         },
    //         function (result, cb) {
    //             lib_PriceOffer.update({
    //                 find: {_id: {$in: _.pluck(result, 'offer_id')}},
    //                 set: {time_preferential: new Date()}
    //             }, cb);
    //         }
    //     ], function (err) {
    //         if (err) {
    //             return next(err);
    //         }
    //         config_common.sendData(req, {}, next);
    //     })
    // });

    /**
     * 区域调价
     * ids  id数组、
     * FOB  出厂价调价额度
     * CIF  到岸价调价额度
     *
     * 批量调价
     * price       调价额度
     */
    // api.post('/readjust', function (req, res, next) {
    //     if (!req.body.ids.length || (!req.body.price && !req.body.CIF && !req.body.FOB)) return next(global.config_error.invalid_format);
    //     var list;
    //     async.waterfall([
    //         function (cb) {
    //             lib_priceOfferCity.getList({
    //                 find: {_id: {$in: req.body.ids}}
    //             }, cb);
    //         },
    //         function (result, cb) {
    //             async.eachSeries(result, function (obj, callback) {
    //                 if (req.body.price) {
    //                     if (obj.CIF) {
    //                         obj['CIF'] = global.util.add(obj['CIF'], req.body.price) < 0 ? 0 : global.util.add(obj['CIF'], req.body.price);
    //                         obj['update_CIF'] = req.body.price;
    //                     }
    //                     if (obj.FOB) {
    //                         obj['FOB'] = global.util.add(obj['FOB'], req.body.price) < 0 ? 0 : global.util.add(obj['FOB'], req.body.price);
    //                         obj['update_FOB'] = req.body.price;
    //                     }
    //                 }
    //                 if (req.body.CIF && obj['CIF']) {
    //                     obj['CIF'] = global.util.add(obj['CIF'], req.body.CIF) < 0 ? 0 : global.util.add(obj['CIF'], req.body.CIF);
    //                     obj['update_CIF'] = req.body.CIF;
    //                 }
    //                 if (req.body.FOB && obj['FOB']) {
    //                     obj['FOB'] = global.util.add(obj['FOB'], req.body.FOB) < 0 ? 0 : global.util.add(obj['FOB'], req.body.FOB);
    //                     obj['update_FOB'] = req.body.FOB;
    //                 }
    //                 lib_priceOfferCity.edit(obj, callback);
    //             }, cb);
    //         },
    //         function (cb) {
    //             lib_priceOfferCity.getList({
    //                 find: {_id: {$in: req.body.ids}}
    //             }, cb);
    //         },
    //         function (result, cb) {
    //             list = result;
    //             var obj = global.util.getGroupByParam(result, 'offer_id');
    //             async.eachSeries(_.uniq(_.pluck(result, 'offer_id')), function (id, callback) {
    //                 lib_PriceOffer.update({
    //                     find: {_id: id},
    //                     set: {
    //                         FOB: {
    //                             max: _.max(_.pluck(obj[id].array, 'FOB')) || 0,
    //                             min: _.min(_.pluck(obj[id].array, 'FOB')) || 0
    //                         },
    //                         CIF: {
    //                             max: _.max(_.pluck(obj[id].array, 'CIF')) || 0,
    //                             min: _.min(_.pluck(obj[id].array, 'CIF')) || 0
    //                         },
    //                         time_update_price: new Date()
    //                     }
    //                 }, callback);
    //             }, cb);
    //         },
    //         function (cb) {
    //             lib_log.add({
    //                 user_id: req.decoded.id,
    //                 material_chn: req.body.material_chn,
    //                 layer_1_chn: req.body.layer_1_chn,
    //                 layer_2_chn: req.body.layer_2_chn,
    //                 product_name: req.body.product_name,
    //                 type: 'readjust',
    //                 content: _.reduce(list, function (arr, obj) {
    //                     if (obj.FOB && (req.body.price || req.body.FOB) || obj.CIF && (req.body.price || req.body.CIF))
    //                         arr.push({
    //                             area: obj.city ? obj.city : obj.province ? obj.province : obj.countries,
    //                             FOB: obj.FOB,
    //                             CIF: obj.CIF,
    //                             update_FOB: req.body.price ? req.body.price : req.body.FOB || 0,
    //                             update_CIF: req.body.price ? req.body.price : req.body.CIF || 0
    //                         });
    //                     return arr;
    //                 }, [])
    //             }, cb);
    //         }
    //     ], function (err, result) {
    //         if (err) {
    //             return next(err);
    //         }
    //         config_common.sendData(req,{log:result}, next);
    //     })
    // });


    return api;
};

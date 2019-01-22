/**
 * Created by Administrator on 2017/4/9.
 */
var async = require('async');
var decimal = require('decimal');
var _ = require('underscore');

var config_error = global.config_error;
var config_common = global.config_common;
var config_model = global.config_model;

var lib_shop = global.lib_shop;
var lib_PriceOffer = global.lib_PriceOffer;
var lib_DemandOrder = global.lib_DemandOrder;
var lib_common = global.lib_common;
var mw = global.middleware;

module.exports = function (app, express) {

    var api = express.Router();

    // 拦截非授权请求
    api.use(require('../../middlewares/mid_verify_user')());

    /**
     * 增删改查
     */
    api.post('/add', function (req, res, next) {
        var shop;
        var Arr = [];
        async.waterfall([
            function (cb) {
                config_error.checkRole(req.decoded.role, [config_common.user_roles.TRADE_ADMIN, config_common.user_roles.TRADE_PURCHASE], cb);
            },
            function (cb) {
                config_error.checkBody(req.body, ['offer_id', 'product_categories', 'type', 'payment_style', 'price', 'amount'], cb);
            },
            function (cb) {
                lib_PriceOffer.getOne({
                    find: {_id: req.body.offer_id}
                }, cb);
            },
            function (offer, cb) {
                if (!offer) return next(config_error.invalid_id);
                async.eachSeries(req.body.product_categories, function (obj, callback) {
                    async.eachSeries(obj.product_name, function (nameObj, cback) {
                        if (!nameObj.amount) return cb(config_error.invalid_amount);
                        if (!nameObj.number) return cb(config_error.invalid_number);
                        async.waterfall([
                            //这种方式有小数精度问题
                            // function (cbk) {
                            //     var query = {payment_style: req.body.payment_style};
                            //     query.offer_id = req.body.offer_id;
                            //     query.user_demand_id = req.decoded.id;
                            //     query.type = req.body.type;
                            //     query['product_categories.product_name.name'] = nameObj.name;
                            //     query['product_categories.product_name.price'] = nameObj.price;
                            //     query['product_categories.product_name.preferential'] = nameObj.preferential || 0;
                            //     query = mw.getDoubleLayerQuery(obj.layer, query);
                            //
                            //     var set = {$inc: {}};
                            //     set['$inc']['product_categories.product_name.number'] = Number(nameObj.number) || 0;
                            //     set['$inc']['product_categories.product_name.amount'] = Number(nameObj.amount) || 0;
                            //     set['$inc']['amount'] = nameObj.amount;
                            //     lib_shop.update({
                            //         find: query,
                            //         set: set
                            //     }, cbk);
                            // }
                            function (cbk) {
                                var query = {payment_style: req.body.payment_style};
                                query.offer_id = req.body.offer_id;
                                query.user_demand_id = req.decoded.id;
                                query.type = req.body.type;
                                query['product_categories.product_name.name'] = nameObj.name;
                                query['product_categories.product_name.price'] = nameObj.price;
                                query['product_categories.product_name.preferential'] = nameObj.preferential || 0;
                                query['product_categories.product_name.short_id'] = nameObj.short_id;
                                query = mw.getDoubleLayerQuery(obj.layer, query);
                                lib_shop.getOne({find: query}, function (err, shop) {
                                    if (shop) {
                                        // shop.product_categories.product_name.number = global.util.add(shop.product_categories.product_name.number, Number(nameObj.number));
                                        // shop.product_categories.product_name.amount = global.util.add(shop.product_categories.product_name.amount, Number(nameObj.amount));
                                        // shop.amount = global.util.add(shop.amount, Number(nameObj.amount));
                                        shop.product_categories.product_name.number = Number(nameObj.number);
                                        shop.product_categories.product_name.amount = Number(nameObj.amount);
                                        shop.amount = Number(nameObj.amount);
                                        shop.markModified('product_categories');
                                        shop.time_creation = new Date();

                                        shop.timeout_price = offer.timeout_price;
                                        shop.not_count_price = offer.not_count_price;

                                        shop.save(function (err) {
                                            if (err) {
                                                return cbk(err);
                                            }
                                            cbk(null, {n: 1});
                                        });
                                    } else {
                                        cbk(null, {n: 0});
                                    }
                                });
                            }
                        ], function (err, result) {
                            if (err) return next(err);
                            if (result.n === 0) {
                                var productObj = JSON.parse(JSON.stringify(obj));
                                if (productObj.PID) delete productObj.PID;
                                productObj.product_name = JSON.parse(JSON.stringify(nameObj));
                                if (productObj.product_name['__v']) delete productObj.product_name['__v'];
                                if (productObj.product_name['_id']) delete productObj.product_name['_id'];
                                if (productObj.product_name['price_remember']) delete productObj.product_name['price_remember'];
                                if (productObj.product_name['price_weight']) delete productObj.product_name['price_weight'];
                                if (productObj.product_name['price_update']) delete productObj.product_name['price_update'];
                                productObj.product_name['price'] = req.body.price;
                                productObj.product_name['price_pass'] = req.body.price_pass;
                                if (!req.body.payment_style) {
                                    req.body.payment_style = 'FOB';
                                }
                                if (req.body.payment_style == 'FOB') {
                                    req.body.location_depart = "";
                                    req.body.location_depart_unit_id = "";
                                }
                                Arr.push({
                                    offer_id: req.body.offer_id,
                                    user_demand_id: req.decoded.id,
                                    user_supply_id: offer.user_id,
                                    company_supply_id: offer.company_id,
                                    company_supply_name: offer.company_name,
                                    company_demand_id: req.decoded.company_id,
                                    company_demand_name: req.decoded.company_name,

                                    product_categories: productObj,

                                    att_quality: offer.att_quality,
                                    att_payment: offer.att_payment,
                                    att_traffic: offer.att_traffic,
                                    att_settlement: offer.att_settlement,
                                    path_loss: offer.path_loss,

                                    delay_day: offer.delay_day,
                                    delay_type: offer.delay_type,
                                    percent_advance: offer.percent_advance,
                                    type: req.body.type,

                                    price: req.body.price,
                                    price_pass: req.body.price_pass,
                                    amount: Number(nameObj.amount),

                                    warehouse_name: offer.warehouse_name,
                                    payment_style: req.body.payment_style || 'FOB',
                                    location_storage: offer.location_storage,
                                    location_storage_unit_id: offer.location_storage_unit_id,
                                    location_depart: req.body.location_depart,
                                    location_depart_unit_id: req.body.location_depart_unit_id,
                                    address_Obj: req.body.address_Obj,

                                    starting_count:offer.starting_count,

                                    date_type:offer.date_type,
                                    cut_date:offer.cut_date,
                                    cut_type:offer.cut_type,
                                    start_date:offer.start_date,

                                    timeout_price:offer.timeout_price,
                                    not_count_price:offer.not_count_price,
                                });
                            }
                            cback();
                        });
                    }, callback);
                }, cb);
            },
            function (cb) {
                if (Arr.length) {
                    lib_shop.addList(Arr, cb);
                } else {
                    cb(null, null);
                }
            },
            function (result, cb) {
                shop = result;
                lib_shop.getCount({
                    find: {offer_id: req.body.offer_id}
                }, cb);
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            global.lib_Statistical.statistical_server_companyTrade_add(req, {
                companyObj: [{
                    id: req.decoded.company_id,
                    type: global.config_model.statistical_type.purchase_plan,
                    count: result === Arr.length ? 1 : 0,
                    shop_count: Arr.length,
                    category: Arr.length ? Arr[0].product_categories.layer['layer_1'] : ''
                }]
            });
            config_common.sendData(req, shop ? _.pluck(shop, '_id') : [], next);
        });
    });
    api.post('/del', function (req, res, next) {
        lib_common.del(req, lib_shop, function (err) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, {}, next);
        });
    });
    api.post('/edit', function (req, res, next) {
        lib_common.edit(req, lib_shop, function (err, result) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, result, next);
        });
    });
    api.post('/detail', function (req, res, next) {
        lib_common.detail(req, lib_shop, function (err, result) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, result, next);
        });
    });

    // /**
    //  * 采购计划列表3.0.0
    //  */
    // api.post('/get_list', function (req, res, next) {
    //     var query = {
    //         user_demand_id: req.decoded.id,
    //         order_id: ''
    //     };
    //     var companyArr = [];
    //     var count;
    //     var shop_list;
    //     async.waterfall([
    //         function (cb) {
    //             lib_shop.getList({
    //                 find: query
    //             }, cb);
    //         },
    //         function (result, cb) {
    //             shop_list = result;
    //             if (shop_list.length > 0) {
    //                 lib_PriceOffer.getList({
    //                     find: {_id: {$in: _.pluck(shop_list, 'offer_id')}}
    //                 }, cb);
    //             } else {
    //                 cb(null, null);
    //             }
    //         },
    //         function (list, cb) {
    //             count = shop_list.length;
    //             async.eachSeries(_.uniq(_.pluck(shop_list, 'user_supply_id')), function (user_id, callback) {
    //                 query.user_supply_id = user_id;
    //                 async.parallel({
    //                     CIF: function (cback) {
    //                         query.payment_style = config_model.payment_style.CIF;
    //                         lib_shop.getList({
    //                             find: query
    //                         }, cback);
    //                     },
    //                     FOB: function (cback) {
    //                         query.payment_style = config_model.payment_style.FOB;
    //                         lib_shop.getList({
    //                             find: query
    //                         }, cback);
    //                     }
    //                 }, function (err, result) {
    //                     if (err) return next(err);
    //                     result.user_id = user_id;
    //                     shop_list.forEach(function (shop) {
    //                         if (shop.user_supply_id === user_id) {
    //                             result.company_id = shop.company_supply_id;
    //                         }
    //                         list.forEach(function (obj) {
    //                             if (shop.offer_id === obj._id.toString()) {
    //                                 result.offer_role = obj.role;
    //                             }
    //                         });
    //                     });
    //                     companyArr.push(result);
    //                     callback();
    //                 });
    //             }, cb);
    //         }
    //     ], function (err) {
    //         if (err) {
    //             return next(err);
    //         }
    //         global.lib_Relationship.planCheck(req);
    //         config_common.sendData(req, {
    //             list: companyArr,
    //             count: count
    //         }, next);
    //     });
    // });

    /**
     * 5.0.0计划列表
     */
    api.post('/get_list', function (req, res, next) {
        var query = {
            user_demand_id: req.decoded.id,
            order_id: ''
        };
        var companyArr = [];
        var count;
        var shop_list;
        async.waterfall([
            function (cb) {
                lib_shop.getList({
                    find: query,
                    sort: {time_creation: -1},
                }, cb);
            },
            function (result, cb) {
                shop_list = result;
                if (shop_list.length > 0) {
                    lib_PriceOffer.getList({
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
                            lib_shop.getList({
                                find: query,
                                sort: {time_creation: -1},
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
            }
        ], function (err) {
            if (err) {
                return next(err);
            }
            global.lib_Relationship.planCheck(req);
            config_common.sendData(req, {
                list: companyArr,
                count: count
            }, next);
        });
    });

    /**
     * 提示条数
     * companies 公司d数组 [{id:公司id，material：产品}]
     */
    api.post('/get_remind', function (req, res, next) {
        async.waterfall([
            function (cb) {
                lib_shop.getCount({user_demand_id: req.decoded.id}, cb);
            }
        ], function (err, count) {
            if (err) return next(err);
            config_common.sendData(req, count, next);
        });
    });


    //清除购物车功能
    api.post('/shop_clear',function(req,res,next){
        async.waterfall([
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
                global.lib_shop.del(query, cb);
            }
        ],function(err,result){
            if(err){console.log('err',err)}
            config_common.sendData(req, result, next);
        });
    });

    //购物车加减功能
    api.post('/shop_add_and_sub',function(req,res,next){
        console.log('shop_id',req.body.shop_id);
        if(!req.body.shop_id){
            return next('invalid_format');
        }
        async.waterfall([
            function(cb){
                global.lib_shop.getOne({
                    find:{
                        _id:req.body.shop_id
                    }
                },cb);
            },
            function(data,cb){
                if(req.body.number){
                    data.product_categories.product_name.number=req.body.number;
                    if(data.product_categories.product_name.amount_unit){
                        data.product_categories.product_name.amount=data.product_categories.product_name.amount_unit*req.body.number;
                        data.amount=data.product_categories.product_name.amount;
                    }else{
                        data.product_categories.product_name.amount=req.body.number;
                    }
                }
                data.markModified('product_categories');
                data.save(cb);
            }
        ],function(err,result){
            if(err){console.log('err',err)}
            config_common.sendData(req, result, next);
        });

    });

    return api;

};

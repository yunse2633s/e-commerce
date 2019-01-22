/**
 * Created by Administrator on 17/12/12.
 */
var async = require('async');
var config_model = global.config_model;
var config_common = global.config_common;
var config_error = global.config_error;

module.exports = function (app, express) {

    var api = express.Router();
    // 拦截非授权请求
    api.use(require('../../middlewares/mid_verify_server')());

    //更新历史发布单据状态
    api.post('/update_history_status', function (req, res, next) {
        async.waterfall([
            function (cb) {
                global.lib_PriceOffer.update({find: {user_id: req.body.user_id}, set: {status: config_model.offer_status.history}}, cb);
            },
            function (count, cb) {
                global.lib_Demand.update({find: {user_id: req.body.user_id}, set: {status: config_model.demand_status.history}}, cb);
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, result, next);
        });
    });

    //更新出价单据，购物车公司所属
    api.post('/update_partake_company', function (req, res, next) {
        async.waterfall([
            function (cb) {
                global.lib_DemandOffer.update({
                    find: {user_demand_id: req.body.user_id},
                    set: {
                        company_demand_id: req.body.company_id,
                        company_demand_name: req.body.company_name
                    }}, cb);
            },
            function (count, cb) {
                global.lib_shop.update({
                    find: {user_demand_id: req.body.user_id},
                    set: {
                        company_demand_id: req.body.company_id,
                        company_demand_name: req.body.company_name
                    }}, cb);
            },
            function (count, cb) {
                global.lib_OfferAgain.update({
                    find: {user_demand_id: req.body.user_id},
                    set: {
                        company_demand_id: req.body.company_id,
                        company_demand_name: req.body.company_name
                    }}, cb);
            }
        ], function (err) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, {}, next);
        });
    });

    //复制数据，更新人，状态
    api.post('/copy_send_data', function (req, res, next) {
        if(!req.body.user_id_old ||
            !req.body.user_id_new){
            return next('invalid_format');
        }
        var price_offer_ids = [];
        var new_price_offer_id;
        async.waterfall([
            //报价竞价处理
            function (cb) {
                global.lib_PriceOffer.getList({find: {user_id: req.body.user_id_old}, select:''}, cb);
            },
            function (offers, cb) {
                price_offer_ids = global.util.transObjArrToSigArr(offers, '_id');
                global.lib_PriceOffer.update({find: {user_id: req.body.user_id_old}, set: {user_id: req.body.user_id_new}}, cb);
            },
            function (count, cb) {
                global.lib_priceOfferCity.update({find: {user_id: req.body.user_id_old}, set: {user_id: req.body.user_id_new}}, cb);
            },
            function (count, cb) {
                global.lib_PriceOffer.onlyList({find: {_id: {$in: price_offer_ids}}}, cb);
            },
            function (list, cb) {
                async.eachSeries(list, function (priceOffer, callback) {
                    var price_offer_id = priceOffer._id.toString();
                    async.waterfall([
                        function (cbk) {
                            //处理主报价
                            var data = global.util.clone(priceOffer);
                            data.status = global.config_model.offer_status.history;
                            data.user_id = req.body.user_id_old;
                            delete data._id;
                            global.lib_PriceOffer.add(data, cbk);
                        },
                        function (priceOfferData, count, cbk) {
                            //处理报价城市
                            new_price_offer_id = priceOfferData._id.toString();
                            global.lib_priceOfferCity.getList({find: {PID: price_offer_id}}, cbk);
                        },
                        function (cities, cbk) {
                            var arr = [];
                            for(var i = 0; i < cities.length; i++){
                                var data = global.util.clone(cities[i]);
                                delete data._id;
                                data.user_id = req.body.user_id_old;
                                data.PID = [new_price_offer_id];
                                arr.push(data);
                            }
                            global.lib_priceOfferCity.addList(arr, cbk);
                        },
                        function (count, cbk) {
                            //处理报价产品包括分类和名称
                            global.lib_PriceOfferProducts.getList({find: {PID: price_offer_id}}, cbk);
                        },
                        function (products, cbk) {
                            async.eachSeries(products, function (product, cb1) {
                                var productData = global.util.clone(product);
                                productData.PID = [new_price_offer_id];
                                delete productData._id;
                                async.waterfall([
                                    function (cb2) {
                                        global.lib_ProductName.getList({find: {_id: {$in: productData.product_name}}}, cb2);
                                    },
                                    function (names, cb2) {
                                        productData.product_name = [];
                                        async.eachSeries(names, function (name, cb3) {
                                            var data = global.util.clone(name);
                                            delete data._id;
                                            global.lib_ProductName.add(data, function (err, nameData) {
                                                if(err){
                                                    return cb3(err);
                                                }
                                                productData.product_name.push(nameData._id.toString());
                                                cb3();
                                            });
                                        }, cb2);
                                    },
                                    function (cb2) {
                                        global.lib_PriceOfferProducts.addOnly(productData, function (err) {
                                            if(err){
                                                return cb2(err);
                                            }
                                            cb2();
                                        });
                                    }
                                ], cb1);
                            }, cbk);
                        }
                    ], callback);
                }, cb);
            },
            //处理采购
            function (cb) {
                global.lib_Demand.update({
                    find: {user_id: req.body.user_id_old, status: {$ne: global.config_model.demand_status.history}},
                    set: {user_id: req.body.user_id_new}
                }, cb);
            },
            function (count, cb) {
                global.lib_Demand.getList({find: {user_id: req.body.user_id_new}}, cb);
            },
            function (list, cb) {
                var arr = [];
                for(var i = 0; i < list.length; i++){
                    var demand = global.util.clone(list[i]);
                    delete demand._id;
                    demand.status = global.config_model.offer_status.history;
                    demand.user_id = req.body.user_id_old;
                    arr.push(demand);
                }
                global.lib_Demand.addList(arr, cb);
            }
        ], function (err) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, {}, next);
        });
    });

    //更新订单所属人
    api.post('/update_order_user_id', function (req, res, next) {
        if(!req.body.user_id_old ||
            !req.body.user_id_new){
            return next('invalid_format');
        }
        async.waterfall([
            function (cb) {
                global.lib_DemandOrder.update({
                    find: {user_demand_id: req.body.user_id_old},
                    set: {user_demand_id: req.body.user_id_new}
                }, cb);
            },
            function (count, cb) {
                global.lib_DemandOrder.update({
                    find: {user_supply_id: req.body.user_id_old},
                    set: {user_supply_id: req.body.user_id_new}
                }, cb);
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, result, next);
        });
    });

    //更新出价单据，购物车公司所属
    api.post('/update_partake_user', function (req, res, next) {
        if(!req.body.user_id_old ||
            !req.body.user_id_new){
            return next('invalid_format');
        }
        async.waterfall([
            function (cb) {
                global.lib_DemandOffer.update({
                    find: {user_demand_id: req.body.user_id_old},
                    set: {
                        user_demand_id: req.body.user_id_new
                    }}, cb);
            },
            function (count, cb) {
                global.lib_shop.update({
                    find: {user_demand_id: req.body.user_id_old},
                    set: {
                        user_demand_id: req.body.user_id_new
                    }}, cb);
            },
            function (count, cb) {
                global.lib_OfferAgain.update({
                    find: {user_demand_id: req.body.user_id_old},
                    set: {
                        user_demand_id: req.body.user_id_new
                    }}, cb);
            }
        ], function (err) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, {}, next);
        });
    });

    return api;
};

/**
 * Created by Administrator on 2017/2/27.
 */

var model = require('../dbs/db_base');
model = model('PriceOffer');
var offerAgainModel = require('../dbs/db_base')('OfferAgain');
var _ = require('underscore');
var async = require('async');

var lib_priceOfferCity = require('../libs/lib_priceOfferCity');
var lib_PriceOfferProducts = require('../libs/lib_PriceOfferProducts');
var lib_Classify = require('../libs/lib_Classify');

var mw = require('../libs/middleware');
var util = require('../libs/util');

var config_common = global.config_common;
var config_model = global.config_model;
var config_error = global.config_error;

exports.add = function (data, callback) {
    model.add(data, callback);
};

exports.getAggregate = function (data, callback) {
    model.group(data, callback);
};

exports.getOne = function (data, callback) {
    async.waterfall([
        function (cb) {
            model.getOne(data, cb);
        },
        function (offer, cb) {
            offer = JSON.parse(JSON.stringify(offer));
            if (offer) {
                async.waterfall([
                    function (cbk) {
                        lib_priceOfferCity.getList({
                            find: {PID: offer._id}
                        }, cbk);
                    },
                    function (result, cbk) {
                        offer.price_routes = result;

                        //if (result.length === 0) return cb(config_error.invalid_id);

                        lib_PriceOfferProducts.getList({
                            find: {PID: offer._id}
                        }, cbk);
                    },
                    function (result, cbk) {
                        offer.product_categories = result;
                        cbk(null, offer);

                    }
                ], cb);
            } else {
                cb(null, null);
            }
        }
    ], callback);
};

exports.getList = function (data, callback) {
    var offerArr = [];
    async.waterfall([
        function (cbk) {
            model.getList(data, cbk);
        },
        function (result, cbk) {
            async.eachSeries(result, function (offer, cback) {
                offer = JSON.parse(JSON.stringify(offer));
                async.waterfall([
                    function (cb) {
                        lib_priceOfferCity.getList({
                            find: {PID: offer._id}
                        }, cb);
                    },
                    function (City, cb) {
                        offer.price_routes = City;
                        lib_PriceOfferProducts.getList({
                            find: {PID: offer._id}
                        }, cb);
                    },
                    function (result, cb) {
                        offer.product_categories = result;
                        //如果没有优惠/配送区域则不会添加到列表
                        if (offer.price_routes.length > 0) {
                            offerArr.push(offer);
                        }
                        cb();
                    }
                ], cback);
            }, function (err) {
                if (err) {
                    return cbk(err);
                }
                cbk(null, offerArr);
            });
        }
    ], callback);
};

exports.onlyList = function (cond, callback) {
    model.getList(cond, callback);
};

exports.update = function (cond, callback) {
    model.update(cond, callback);
};

exports.onlyGetOne = function (cond, callback) {
    model.getOne(cond, callback);
};

var getCount = function (cond, callback) {
    model.getCount(cond, callback);
};
exports.getCount = getCount;

exports.getListAndCount = function (page, data, callback) {
    var offerArr = [];
    async.waterfall([
        function (cb) {
            model.getCount(data.find, cb);
        },
        function (count, cb) {
            async.waterfall([
                function (cbk) {
                    model.getList(data, cbk);
                },
                function (list, cbk) {
                    async.eachSeries(list, function (offer, cback) {
                        offer = JSON.parse(JSON.stringify(offer));
                        async.waterfall([
                            function (cbk) {
                                lib_priceOfferCity.getList({
                                    find: {PID: offer._id}
                                }, cbk);
                            },
                            function (result, cbk) {
                                offer.price_routes = result;
                                lib_PriceOfferProducts.getList({
                                    find: {PID: offer._id}
                                }, cbk);
                            },
                            function (result, cbk) {
                                offer.product_categories = result;
                                if (offer.price_routes.length > 0) {
                                    offerArr.push(offer);
                                }
                                cbk();
                            }
                        ], cback);
                    }, function (err) {
                        if (err) {
                            return cbk(err);
                        }
                        cbk(null, {
                            exist: count > config_common.list_per_page * page,
                            count: count,
                            list: offerArr
                        });
                    });
                }
            ], cb);
        }
    ], callback);
};

exports.edit = function (data, callback) {
    model.edit(data, callback)
};

exports.del = function (data, callback) {
    async.waterfall([
        function (cb) {
            model.del(data, cb);
        },
        function (result, cb) {
            lib_priceOfferCity.del({PID: data._id}, cb);
        },
        function (result, cb) {
            lib_PriceOfferProducts.del({PID: data._id}, cb);
        }
    ], callback);
};

exports.addNewOffer = function (req, callback) {
    var entry;
    async.waterfall([
        function (cb) {
            var dateObj = {};
            if(new Date(req.body['time_validity']).getTime()<(new Date()).getTime()){
                return cb('time over');
            }
            if (req.body['time_validity']) dateObj['time_validity'] = req.body['time_validity'];
            var historyArr = [];
            for (var i = 0; i < req.body.product_categories[0].product_name.length; i++) {
                var historyObj = {};
                var price_weight_inclusive=req.body.product_categories[0].product_name[i].price_weight_inclusive||0,
                    price_remember_inclusive=req.body.product_categories[0].product_name[i].price_remember_inclusive||0,
                    price_weight=req.body.product_categories[0].product_name[i].price_weight||0,
                    price_remember=req.body.product_categories[0].product_name[i].price_remember||0;
                if (req.body.product_categories[0].product_name[i].price_remember) {
                    historyObj = {
                        name: req.body.product_categories[0].product_name[i].name,
                        price_weight: [{
                            price: price_weight_inclusive?(price_weight_inclusive+price_weight):price_weight,
                            time: new Date()
                        }],
                        price_remember: [{
                            price: price_remember_inclusive?(price_remember_inclusive+price_remember):price_remember,
                            time: new Date()
                        }]
                    }
                } else {
                    historyObj = {
                        name: req.body.product_categories[0].product_name[i].name,
                        price_weight: [{
                            price: price_weight_inclusive?(price_weight_inclusive+price_weight):price_weight,
                            time: new Date()
                        }]
                    }
                }
                historyArr.push(historyObj)
            }
            model.add(_.extend({
                ownType: req.body.type === global.config_model.offer_type.DJ ? global.config_model.offer_ownType.pricing : global.config_model.offer_ownType.bidding,
                user_id: req.decoded.id,
                admin_id: req.decoded.admin_id,
                company_id: req.decoded.company_id,
                company_name: req.decoded.company_name,

                att_quality: req.body.att_quality,
                att_payment: req.body.att_payment,
                att_traffic: req.body.att_traffic,
                att_settlement: req.body.att_settlement,
                path_loss: req.body.path_loss,

                price_history: historyArr,

                location_storage: req.body.location_storage,    //提货地址
                location_storage_unit_id: req.body.location_storage_unit_id,    //提货地址区域
                passPrice_id: req.body.passPrice_id,                                  // 运费模板
                isDelivery:req.body.isDelivery,                                       //是否包邮
                status: config_model.offer_status.published,
                type: req.body.type,
                role: req.decoded.role,
                appendix: req.body.appendix,
                warehouse_name: req.body.warehouse_name,

                delay_day: !isNaN(parseInt(req.body.delay_day)) ? parseInt(req.body.delay_day) : undefined,
                delay_type: req.body.delay_type ? req.body.delay_type : undefined,
                percent_advance: req.body.percent_advance || 0,

                background_urls: req.body.background_urls || [],

                amount: req.body.amount || 0,
                starting_count: req.body.starting_count || 0,

                time_goods: req.body.time_goods || 0,
                cut_time: req.body.cut_time,
                timeout_price: req.body.timeout_price,
                not_count_price: req.body.not_count_price,


                sum_number:req.body.sum_number,
                date_type:req.body.date_type,
                cut_date:req.body.cut_date,
                cut_type:req.body.cut_type,
                start_date:req.body.start_date

            }, dateObj), cb);
        },
        function (offer, count, cb) {
            entry = offer.toObject();
            var priceOfferCity = [];
            if (!req.body.price_routes || req.body.price_routes.length === 0) {
                req.body.price_routes = [{
                    PID: [offer._id.toString()],
                    price: req.body.price || 0,
                    min: req.body['price_min'] || 0,
                    max: req.body['price_max'] || 0,
                    countries: '全国'
                }]
            }
            req.body.price_routes.forEach(function (offerCity) {
                offerCity.PID = [offer._id.toString()];
                offerCity['user_id'] = req.decoded.id;
                offerCity['type'] = req.body.type;
                if (offerCity._id) delete offerCity._id;
                priceOfferCity.push(offerCity);
            });
            lib_priceOfferCity.addList(priceOfferCity, cb);
        },
        function (result, cb) {
            entry.price_routes = result;
            global.lib_ProductClassify.checkProduct(req.body.product_categories, {
                id: entry._id,
                user_id: req.decoded.id,
                company_id: req.decoded.company_id
            }, cb);
        },
        function (result, cb) {
            result[0].for_liji = req.body.PID;
            lib_PriceOfferProducts.addList(result, cb);
        }
    ], function (err, result) {
        if (err) return callback(err);
        var type, other_type, statistical_type, title, url;
        entry.product_categories = result;
        global.lib_User.addCompanyDynamic({
            company_id: req.decoded.company_id,
            user_id: req.decoded.id,
            type: config_common.typeCode.trade_pricing,
            data: JSON.stringify(entry)
        });
        if (entry.type === config_model.offer_type.DJ) {
            type = 'offer';
            title = '交易报价';
            statistical_type = config_model.statistical_type.sale_pricing;
            other_type = config_model.statistical_type.purchase_pricing;
            url = config_common.push_url.offer;
        } else {
            type = 'JJ_offer';
            title = '交易竞价';
            statistical_type = config_model.statistical_type.sale_bidding;
            other_type = config_model.statistical_type.purchase_bidding;
            url = config_common.push_url.bidding;
        }

        global.lib_User.getCompanyRelationList({
            find: {other_id: req.decoded.company_id},
            select: 'self_id'
        }, function (err, list) {
            global.lib_Statistical.statistical_server_companyTrade_add(req, {
                companyObj: [{
                    id: req.decoded.company_id,
                    type: statistical_type,
                    add_user_id: req.decoded.id,
                    category: result[0].layer['layer_1']
                }].concat(_.reduce(_.pluck(list, 'self_id'), function (list, id) {
                    list.push({
                        id: id,
                        type: other_type
                    });
                    return list;
                }, []))
            });
        });
        async.waterfall([
            function (cbk) {
                global.lib_msg.push(req, {
                        title: title,
                        content: global.config_msg_templates.encodeContent(type, [req.decoded.company_name || '', req.decoded['user_name'], result[0].layer['layer_1_chn']])
                    }, {}, '', {
                        params: {id: entry._id, deal: 'buy', type: 'quan'},
                        url: url
                    }, null, global.config_model.company_type.PURCHASE,
                    cbk);
            },
            function (list, cbk) {
                cbk(null, _.extend({id: entry._id}, list));
            }
        ], callback);
    });
};

exports.offerEdit = function (req, cond, callback) {
    var entry;
    var obj;
    var price_history = {};
    var addressData;
    var oldOffer;
    var passPrice_id;
    var xiuGai;
    var shuXinXiuGai;
    async.waterfall([
        function (cb) {
            global.lib_PriceOfferProducts.getOne({find: {PID: {$in: [cond._id]}}}, cb);
        },
        function (aa, cb) {
            shuXinXiuGai = aa;
            cb();
        },
        function (cb) {
            global.http.sendUserServer({
                method: 'getOne',
                cond: {find: {_id: req.body.location_storage}},
                model: 'Address'
            }, '/api/server/common/get', cb);
        },
        function (address, cb) {
            req.body.warehouse_name = address.name || "";
            model.getOne({
                find: cond
            }, cb);
        },
        function (offer, cb) {
            if (!offer) return cb(config_error.invalid_id);
            entry = offer;
            if (offer.type == 'DJ') {
                oldOffer = offer;
                passPrice_id = offer.passPrice_id;
            }
            global.lib_PriceOfferProducts.getOne({
                find: {PID: {$in: [cond._id]}}
            }, function (err, layer) {
                if (layer) {
                    var str = '';
                    var arr = [];
                    for (var i = 0; i < _.keys(layer.layer).length; i++) {
                        var index = _.keys(layer.layer)[i];
                        index = index.replace('_chn', '').toString();
                        arr[index.split('_')[1] - 1] = layer.layer[index] + ';';
                    }
                    //keys顺序会变，从一级分类开始整理
                    for (var j = 0; j < arr.length; j++) {
                        str += arr[j];
                    }
                    str = str.substr(0, str.length - 1);
                    var str1 = '';
                    var arr1 = [];
                    for (var i = 0; i < _.keys(req.body.product_categories[0]).length; i++) {
                        var index2 = _.keys(req.body.product_categories[0])[i];
                        arr1[index2.split('_')[1] - 1] = req.body.product_categories[0][index2] + ';';
                    }
                    //keys顺序会变，从一级分类开始整理
                    for (var j = 0; j < arr1.length; j++) {
                        str1 += arr1[j];
                    }
                    str1 = str1.substr(0, str1.length - 1);
                    //判断是否修改大类

                    if (str == str1) {
                        for (var i = 0; i < offer.price_history.length; i++) {
                            for (var j = 0; j < req.body.product_categories[0].product_name.length; j++) {
                                var price_weight_inclusive=req.body.product_categories[0].product_name[j].price_weight_inclusive||0,
                                    price_remember_inclusive=req.body.product_categories[0].product_name[j].price_remember_inclusive||0,
                                    price_weight=req.body.product_categories[0].product_name[j].price_weight||0,
                                    price_remember=req.body.product_categories[0].product_name[j].price_remember||0;
                                if (req.body.product_categories[0].product_name[j].name == offer.price_history[i].name) {
                                    if (req.body.product_categories[0].product_name[j].price_remember) {
                                        //这里多加一个判断-->根据时间判断如果两次修改时间小于3s则不添加
                                        offer.price_history[i].price_weight.push({
                                            price: price_weight_inclusive?(price_weight_inclusive+price_weight):price_weight,
                                            time: new Date()
                                        });
                                        offer.price_history[i].price_remember.push({
                                            price: price_remember_inclusive?(price_remember_inclusive+price_remember):price_remember,
                                            time: new Date()
                                        });
                                    } else {
                                        offer.price_history[i].price_weight.push({
                                            price: price_weight_inclusive?(price_weight_inclusive+price_weight):price_weight,
                                            time: new Date()
                                        });
                                    }
                                } else if (_.indexOf(_.pluck(offer.price_history, 'name'), req.body.product_categories[0].product_name[j].name) == -1) {
                                    var historyObj2 = {};
                                    if (req.body.product_categories[0].product_name[j].price_remember) {
                                        historyObj2 = {
                                            name: req.body.product_categories[0].product_name[j].name,
                                            price_weight: [{
                                                price: price_weight_inclusive?(price_weight_inclusive+price_weight):price_weight,
                                                time: new Date()
                                            }],
                                            price_remember: [{
                                                price: price_remember_inclusive?(price_remember_inclusive+price_remember):price_remember,
                                                time: new Date()
                                            }]
                                        }
                                    } else {
                                        historyObj2 = {
                                            name: req.body.product_categories[0].product_name[j].name,
                                            price_weight: [{
                                                price: price_weight_inclusive?(price_weight_inclusive+price_weight):price_weight,
                                                time: new Date()
                                            }]
                                        }
                                    }
                                    offer.price_history.push(historyObj2);
                                }

                            }


                        }
                    } else {
                        xiuGai = true;
                        offer.price_history = [];
                        for (var i = 0; i < req.body.product_categories[0].product_name.length; i++) {
                            var price_weight_inclusive=req.body.product_categories[0].product_name[j].price_weight_inclusive||0,
                                price_remember_inclusive=req.body.product_categories[0].product_name[j].price_remember_inclusive||0,
                                price_weight=req.body.product_categories[0].product_name[j].price_weight||0,
                                price_remember=req.body.product_categories[0].product_name[j].price_remember||0;
                            var historyObj = {};
                            if (req.body.product_categories[0].product_name[i].price_remember) {
                                historyObj = {
                                    name: req.body.product_categories[0].product_name[i].name,
                                    price_weight: [{
                                        price: price_weight_inclusive?(price_weight_inclusive+price_weight):price_weight,
                                        time: new Date()
                                    }],
                                    price_remember: [{
                                        price: price_remember_inclusive?(price_remember_inclusive+price_remember):price_remember,
                                        time: new Date()
                                    }]
                                }
                            } else {
                                historyObj = {
                                    name: req.body.product_categories[0].product_name[i].name,
                                    price_weight: [{
                                        price: price_weight_inclusive?(price_weight_inclusive+price_weight):price_weight,
                                        time: new Date()
                                    }]
                                }
                            }
                            offer.price_history.push(historyObj)
                        }
                    }
                    for (var index in req.body) {
                        if (req.body.hasOwnProperty(index) && _.allKeys(offer).indexOf(index) >= 0 && !edit[index]) {
                            offer[index] = req.body[index];
                        }
                    }
                    if (offer.cut_time) {
                    }
                    entry.is_sms = false;
                    entry.time_creation = new Date();
                    entry.time_update = new Date();
                    if (req.body.cut_time && req.body.cut_time > new Date()) {
                        entry.cut_time = req.body.cut_time;
                    }
                    entry.starting_count=req.body.starting_count || 0;
                    entry.markModified('price_history');
                    model.edit(entry, cb);
                }
            });
        },
        function (offer, count, cb) {
            obj = offer;
            if (req.body.price_routes) {
                lib_priceOfferCity.del({PID: req.body.id}, function (err) {
                    if (err) return cb(err);
                    cb();
                });
            }else{
                cb();
            }
        },
        function(cb){
            if (req.body.product_categories) {
                lib_PriceOfferProducts.del({PID: req.body.id}, function (err) {
                    if (err) return cb(err);
                    cb();
                });
            }else {
                cb();
            }
        },
        function (cb) {
            if (req.body.price_routes) {
                var priceOfferCity = [];
                req.body.price_routes.forEach(function (offerCity) {
                    if (req.body.price_routes.length == 1 && offerCity.price == 0 && offerCity.countries == "全国") {
                        if (offerCity._id){
                            if (offerCity._id) delete offerCity._id;
                        }
                        offerCity['PID'] = [obj._id.toString()];
                        offerCity['user_id'] = req.decoded.id;
                        offerCity['type'] = entry.type;
                        priceOfferCity.push(offerCity);
                    } else {
                        if (offerCity._id){
                            if (offerCity._id) delete offerCity._id;
                        }
                        if (offerCity.countries != "全国" || offerCity.price != 0) {
                            offerCity['PID'] = [obj._id.toString()];
                            offerCity['user_id'] = req.decoded.id;
                            offerCity['type'] = entry.type;
                            priceOfferCity.push(offerCity);
                        }
                    }
                });
                if (priceOfferCity.length) {
                    lib_priceOfferCity.addList(priceOfferCity, cb);
                } else {
                    cb(null, null);
                }
            } else {
                cb(null, null);
            }
        },
        function (offer, cb) {
            //关于用费模板和修改大类的判断
            if (oldOffer) {
                if (passPrice_id != req.body.passPrice_id || xiuGai) {
                    global.lib_shop.getList({find: {offer_id: oldOffer._id.toString()}}, cb);
                } else {
                    cb(null, null);
                }
            } else {
                cb(null, null);
            }
        },
        function (shopList, cb) {
            if (shopList) {
                async.eachSeries(shopList, function (oneData, callback) {
                    oneData.status = true;
                    oneData.save();
                    callback();
                }, cb);
            } else {
                cb();
            }
        },
        function (cb) {
            if (req.body.product_categories) {
                global.lib_ProductClassify.checkProduct(req.body.product_categories, {
                    id: entry._id,
                    user_id: req.decoded.id,
                    company_id: req.decoded.company_id
                }, function (err, result) {
                    if (err) return cb(err);
                    lib_PriceOfferProducts.addList(result, cb);
                });
            } else {
                cb();
            }
        }
    ], function (err) {
        if (err)return callback(err);
        //检查 报价中的产品分类
        global.lib_PriceOfferProducts.getOne({find: {PID: {$in: [cond._id]}}}, function (err, data) {
            if (data.product_name.toString() !== shuXinXiuGai.product_name.toString()) {
                global.lib_shop.getList({find: {offer_id: oldOffer._id.toString()}}, function (err, list) {
                    async.eachSeries(list, function (oneData, callback) {
                        oneData.status = true;
                        oneData.save();
                        callback();
                    }, function (err) {
                        if (err) {
                            console.log('err:', err);
                        }
                    });
                });
            }
        });
        callback(null, obj);
    });
};

exports.insertTypeCount = function (entry, callback) {
    var list = [];
    async.waterfall([
        function (cb) {
            async.eachSeries(entry.list, function (offer, cbk) {
                async.parallel({
                    DJ: function (cback) {
                        model.getCount({
                            user_id: offer.user_id,
                            type: config_model.offer_type.DJ,
                            status: config_model.offer_status.published
                        }, cback);
                    },
                    JJ: function (cback) {
                        model.getCount({
                            user_id: offer.user_id,
                            type: {$in: [config_model.offer_type.JJ, config_model.offer_type.DjJJ]},
                            status: config_model.offer_status.published
                        }, cback);
                    }
                }, function (err, result) {
                    if (err) {
                        return next(err);
                    }
                    offer.typeCount = result;
                    list.push(offer);
                    cbk();
                });
            }, cb);
        }
    ], function (err) {
        if (err) {
            return callback(err);
        }
        entry.list = list;
        callback(null, entry);
    });
};

exports.getUpdateCount = function (req, callback) {
    var query = {
        status: global.config_model.demand_status.published
    };
    async.waterfall([
        function (cb) {
            //查询自己与某公司的列表更新时间
            query.company_id = req.body.company_id;
            global.lib_Relationship.relationCheck(req, {
                param: 'time_update',
                type: global.config_model.relationship_type.trade_offer
            }, query, cb);
        },
        function (length, cb) {
            if (length === 0) {
                cb(null, null);
            } else {
                global.lib_User.getWorkRelationList(req, global.config_model.company_type.SALE, cb);
            }
        },
        function (result, cb) {
            if (!result) {
                cb(null, 0);
            } else {
                getCountByParam(req, {find: query}, mw.getCityQuery(req.body, {user_id: {$in: result}}), cb);
            }
        }
    ], callback);
};

exports.getListByParam = function (req, query, cond, callback, page_num, is_DJ, productCond) {
    async.waterfall([
        function (cb) {
            if (cond) {
                lib_priceOfferCity.getList({
                    find: cond
                }, cb);
            } else {
                cb(null, null);
            }
        },
        function (result, cb) {
            if (result) {
                query.find._id = _.flatten(_.pluck(result, 'PID'));
            }
            if (cond) {
                global.lib_PriceOfferProducts.getList({
                    find: mw.getLayerQuery(req.body, {PID: {$in: _.flatten(_.pluck(result, 'PID'))}})
                }, cb, productCond);

            } else {
                if (query.find.company_id) {
                    global.lib_PriceOfferProducts.getList({
                        find: mw.getLayerQuery(req.body, {
                            company_id: query.find.company_id
                        })
                    }, cb, productCond);
                } else {
                    global.lib_PriceOfferProducts.getList({
                        find: mw.getLayerQuery(req.body, {
                            user_id: query.find.user_id
                        })
                    }, cb, productCond);
                }
            }
        },
        function (result, cb) {
            if (req.body.sort) {
                switch (req.body.sort) {
                    case config_common.sort.new:
                        query.sort = {time_creation: -1}
                        break;
                    case config_common.sort.old:
                        query.sort = {time_creation: 1}
                        break;
                    case config_common.sort.max:
                        query.sort = {has_order: -1}
                        break;
                    case config_common.sort.min:
                        query.sort = {has_order: 1}
                        break;
                }
            }
            if (req.body.passPrice_id) {
                query.find.passPrice_id = req.body.passPrice_id;
            }
            if (is_DJ) query.find.type = config_model.offer_type.DJ;
            if (query.find._id) {
                query.find._id = {$in: _.uniq(_.intersection(query.find._id, _.flatten(_.pluck(result, 'PID'))))};
            } else {
                query.find._id = {$in: _.flatten(_.pluck(result, 'PID'))}
            }
            this['lib_PriceOffer'].getListAndCount(page_num || 1, query, cb);
        }
    ], callback)
};

var getCountByParam = function (req, query, cond, callback) {
    async.waterfall([
        function (cb) {
            lib_priceOfferCity.getList({
                find: cond
            }, cb);
        },
        function (result, cb) {
            query.find._id = _.flatten(_.pluck(result, 'PID'));
            global.lib_PriceOfferProducts.getList({
                find: mw.getLayerQuery(req.body, {PID: {$in: _.flatten(_.pluck(result, 'PID'))}})
            }, cb);
        },
        function (result, cb) {
            query.find._id = {$in: _.uniq(_.intersection(query.find._id, _.flatten(_.pluck(result, 'PID'))))};
            this['lib_PriceOffer'].getCount(query.find, cb);
        }
    ], callback)
};
exports.getCountByParam = getCountByParam;

exports.getDataByUser = function (id, other_company_id, callback) {
    async.waterfall([
        function (cb) {
            global.lib_ProductName.getList({
                find: {'price_preferential.user_id': id}
            }, cb);
        },
        function (result, cb) {
            global.lib_PriceOfferProducts.getList({
                find: {product_name: {$in: JSON.parse(JSON.stringify(_.pluck(result, '_id')))}}
            }, cb);
        },
        function (result, cb) {
            global.lib_PriceOffer.getList({
                find: {_id: {$in: _.pluck(result, 'PID')}}
            }, cb);
        },
        function (result, cb) {
            async.parallel({
                order: function (cbk) {
                    global.lib_DemandOrder.getCount({
                        $or: [{user_supply_id: id}, {user_demand_id: id}]
                    }, cbk);
                },
                offer: function (cbk) {
                    cbk(null, result.length);
                },
                product: function (cbk) {
                    cbk(null, _.pluck(_.flatten(_.pluck(result, 'product_categories')), 'product_name').length);
                },
                company: function (cbk) {
                    global.lib_User.getCompanyOne({
                        find: {_id: other_company_id},
                        select: 'full_name nick_name url_logo verify_phase province city'
                    }, cbk);
                },
                user: function (cbk) {
                    global.lib_User.getUserOne({
                        find: {_id: id},
                        select: 'real_name photo_url'
                    }, cbk);
                },
                price: function (cbk) {
                    var priceArr = [];
                    _.flatten(_.pluck(_.flatten(_.pluck(result, 'product_categories')), 'product_name')).forEach(function (obj) {
                        priceArr.push(_.pluck(obj.price_preferential, 'price')[_.pluck(obj.price_preferential, 'user_id').indexOf(id)]);
                    });
                    cbk(null, {
                        min: priceArr.length ? _.min(priceArr) : 0,
                        max: priceArr.length ? _.max(priceArr) : 0
                    });
                }
            }, cb);
        }
    ], callback);
};

exports.getParam = function (body, result, callback) {
    var one = ['price_routes', 'product_categories'];
    var two = ['countries', 'province', 'city'];
    var resultObj = {};
    if (body.params) body.params.forEach(function (param) {
        if (one.indexOf(param) !== -1) {
            resultObj[param] = function (cbk) {
                util.getChild(result.list, param, cbk);
            }
        }
        if (two.indexOf(param) !== -1) {
            resultObj[param] = function (cbk) {
                util.getTwo(result.list, 'price_routes', param, cbk);
            }
        }
        if ((new RegExp('material')).test(param) || (new RegExp('layer')).test(param)) {
            resultObj[param] = function (cbk) {
                util.getProduct(result.list, param, cbk);
            }
        }
    });
    resultObj['offer_id'] = function (cbk) {
        cbk(null, _.pluck(result.list, '_id'));
    };
    resultObj['id'] = function (cbk) {
        util.getTwo(result.list, 'price_routes', '_id', cbk);
    };
    resultObj['type'] = function (cbk) {
        cbk(null, _.reduce(_.flatten(_.pluck(result.list, 'price_routes')), function (list, obj) {
            if (obj && obj.price_remember) list.push('price_remember');
            if (obj && obj.price_weight) list.push('price_weight');
            return _.uniq(list);
        }, []));
    };
    resultObj['product_id'] = function (cbk) {
        util.getTwo(result.list, 'product_categories', '_id', cbk);
    };
    resultObj['product_name_id'] = function (cbk) {
        cbk(null, _.compact(_.uniq(_.pluck(_.flatten(_.compact(_.uniq(_.pluck(_.flatten(_.pluck(result.list, 'product_categories')), 'product_name')))), '_id'))));
    };
    resultObj['product_name'] = function (cbk) {
        util.getProductName(result.list, cbk);
    };
    async.parallel(resultObj, callback);
};

exports.addJJTotalAmount = function (list, callback) {
    async.eachSeries(list, function (offer, cb) {
        if (offer.type !== config_model.offer_type.DJ) {
            offerAgainModel.group({
                match: {offer_id: offer._id.toString()},
                group: {_id: null, 'sum': {$sum: '$amount'}}
            }, function (err, result) {
                if (err) {
                    return cb(err);
                }
                offer.amount_offers = result[0] ? result[0].sum : 0;
                cb();
            });
        } else {
            cb();
        }
    }, callback);
};

var edit = {
    id: 'id',
    _id: '_id',
    price_routes: 'price_routes',
    product_categories: 'product_categories'
};
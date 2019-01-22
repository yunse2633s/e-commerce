/**
 * Created by Administrator on 2017/3/28.
 */
var async = require('async');
var _ = require('underscore');

var config_error = global.config_error;
var config_common = global.config_common;

var lib_Store = global.lib_Store;
var lib_DemandOrder = global.lib_DemandOrder;
var lib_PriceOffer = global.lib_PriceOffer;
var lib_Statistical = global.lib_Statistical;
var lib_Relationship = global.lib_Relationship;
var lib_Demand = global.lib_Demand;
var lib_priceOfferCity = global.lib_priceOfferCity;

var lib_DemandOffer = global.lib_DemandOffer;
var lib_shop = global.lib_shop;
var lib_OfferAgain = global.lib_OfferAgain;
var mw = global.middleware;
var util = global.util;
var http = global.http;

module.exports = function (app, express) {

    var api = express.Router();

    // 拦截非授权请求
    api.use(require('../../middlewares/mid_verify_user')());

    /**
     * 增删改查
     * 流程
     * 1 发布订单
     * 2 线上找车
     * 3 发布物流需求单
     * 4 线下找车
     * 5 完成订单
     */
    api.post('/add', function (req, res, next) {
        var libModel, list, relationship_type, other_relationship_type, price_param;
        var idObj = {};
        var tuiSongCompany_id;
        var order_id;
        var endData;
        if (_.isString(req.body.ids)) req.body.ids = JSON.parse(req.body.ids);
        if (_.isString(req.body.product_categories)) req.body.product_categories = JSON.parse(req.body.product_categories);
        //确认是分类是什么 demand-->采购；bidding-->竞价；pricing-->报价；
        switch (req.body.type) {
            case 'demand': {
                libModel = lib_DemandOffer;
                idObj = {
                    demandOffer_id: req.body.ids,
                    step: 1,
                    status: global.config_model.order_status.ineffective,
                    order_origin: global.config_model.order_origin.demand
                };
                price_param = 'price_type';
                relationship_type = global.config_model.relationship_type.trade_supply_effective;
                other_relationship_type = global.config_model.relationship_type.trade_demand_effective;
                break;
            }
            case 'bidding': {
                libModel = lib_OfferAgain;
                idObj = {
                    offerAgain_id: req.body.ids,
                    step: 1,//2和effective是跳过确认步骤
                    status: global.config_model.order_status.ineffective,
                    order_origin: global.config_model.order_origin.JJ
                };
                price_param = 'price_type';
                relationship_type = global.config_model.relationship_type.trade_supply_effective;
                other_relationship_type = global.config_model.relationship_type.trade_demand_effective;
                break;

            }
            case 'pricing': {
                libModel = lib_shop;
                idObj = {
                    step: 1,
                    status: global.config_model.order_status.ineffective,
                    order_origin: global.config_model.order_origin.DJ
                };
                price_param = 'type';
                relationship_type = global.config_model.relationship_type.trade_supply_ineffective;
                other_relationship_type = global.config_model.relationship_type.trade_demand_ineffective;
                break;
            }
        }
        async.waterfall([
            function (cb) {
                config_error.checkRole(req.decoded.role, [config_common.user_roles.TRADE_ADMIN, config_common.user_roles.TRADE_SALE, config_common.user_roles.TRADE_PURCHASE], cb);
            },
            function (cb) {
                config_error.checkBody(req.body, ['type', 'ids'], cb,
                    [[{payment_style: 'CIF'}, ['send_address_id', 'send_province', 'send_city', 'send_district', 'send_addr', 'send_phone', 'send_name', 'send_location']]
                        , [{payment_style: 'FOB'}, ['send_address_id', 'receive_address_id', 'send_province', 'send_city', 'send_district', 'send_addr', 'send_phone', 'send_name', 'send_location',
                        'receive_province', 'receive_city', 'receive_district', 'receive_addr', 'receive_phone', 'receive_name', 'receive_location']]]);
            },
            function (cb) {
                //查询到购物车列表/竞价出价列表/采购出价列表
                libModel.getList({
                    find: {_id: {$in: req.body.ids}, order_id: ''}
                }, cb);
            },
            function (result, cb) {
                if (result.length === 0) return next(config_error.invalid_id);
                //当type为采购，竞价时，如果没有修改订单中的数量，则订单跳过 待确认 直接走进 第二步 进行中；
                if (req.body.type == 'demand' || req.body.type == 'bidding') {
                    var sum1 = _.reduce(_.pluck(result[0].product_categories[0].product_name, 'amount'), function (memo, num) {
                        return memo + num;
                    }, 0);
                    var sum2 = _.reduce(_.pluck(req.body.product_categories[0].product_name, 'amount'), function (memo, num) {
                        return memo + num;
                    }, 0);
                    if (sum1 === sum2 && !result.admin_id && !req.decoded.admin_id) {
                        idObj.step = 2;
                        idObj.status = global.config_model.order_status.effective;
                        //global.lib_common.sum_order(req,result[0].offer_id);
                    }
                    if (req.body.type == 'bidding' && result[0].type == 'DjJJ') {
                        endData = result;
                        idObj.step = 2;
                        idObj.status = global.config_model.order_status.effective;
                        //global.lib_common.sum_order(req,result[0].offer_id);
                    }
                }
                list = result;
                //检查报价方公司id,报价类型
                var checkArr = ['company_supply_id', 'payment_style'];
                for (var i = 0; i < checkArr.length; i++) {
                    if (_.uniq(_.pluck(result, checkArr[i])).length !== 1) return cb(config_error['order_' + checkArr[i] + '_onlyOne']);
                }
                //检查产品大类是否正确
                var checkProductArr = ['material'];
                for (var j = 0; j < checkProductArr.length; j++) {
                    if (_.uniq(_.pluck(_.flatten(_.pluck(result, 'product_categories')), checkArr[j])).length !== 1) return cb(config_error['order_' + checkProductArr[i] + '_onlyOne']);
                }
                //初始化价格，吨数，优惠价格
                var price_total = 0;
                var amount_total = 0;
                var preferential = 0;
                if (req.body.product_categories) {
                    req.body.product_categories.forEach(function (product) {
                        product.product_name.forEach(function (nameObj) {
                            if (!nameObj.amount) return cb(config_error.invalid_amount);
                            amount_total = global.util.add(amount_total, nameObj.amount);
                            price_total = global.util.add(price_total, global.util.mul(nameObj.price, nameObj.amount));
                            preferential = global.util.mul(nameObj.preferential || 0, nameObj.amount);
                        });
                    });
                } else {
                    _.flatten(_.pluck(result, 'product_categories')).forEach(function (obj) {
                        (_.isArray(obj.product_name) ? obj.product_name : [obj.product_name]).forEach(function (nameObj) {
                            if (!nameObj.amount) return cb(config_error.invalid_amount);
                            amount_total = global.util.add(amount_total, nameObj.amount);
                            price_total = global.util.add(price_total, global.util.mul(nameObj.price, nameObj.amount));
                            preferential = global.util.mul(nameObj.preferential || 0, nameObj.amount);
                        });
                    });
                }
                var product_categories = _.reduce(req.body.product_categories || _.flatten(_.pluck(result, 'product_categories')), function (list, product) {
                    var product_name = [];
                    (_.isArray(product.product_name) ? product.product_name : [product.product_name]).forEach(function (obj) {
                        if (obj['price_pass']) price_total = global.util.add(price_total, global.util.mul(obj['price_pass'], obj.amount) || 0);
                        obj['number'] = Number(obj.number);
                        obj['number_remain'] = obj.number;
                        obj.attribute = _.filter(obj.attribute, function (num) {
                            return !num.can_count;
                        });
                        product_name.push(obj);
                    });
                    product.product_name = product_name;
                    if (product.layer) {
                        product = _.extend(product, product.layer);
                        delete product.layer;
                    }
                    list.push(product);
                    return list;
                }, []);
                //判断如果是报价来的订单并且报价的的价格类型是FOB则不需要交货地址
                if (result[0].offer_id && result[0].payment_style == 'FOB') {
                    req.body.receive_province = "";
                    req.body.receive_city = "";
                    req.body.receive_district = "";
                    req.body.receive_addr = "";
                }
                lib_DemandOrder.add(_.extend({
                    offer_id: _.uniq(_.pluck(result, 'offer_id')) || [],
                    admin_id: req.decoded.admin_id || result.admin_id,

                    index: util.getOrderIndex('order'),
                    user_demand_id: _.uniq(_.pluck(result, 'user_demand_id'))[0],
                    company_demand_id: _.uniq(_.pluck(result, 'company_demand_id'))[0],
                    company_demand_name: _.uniq(_.pluck(result, 'company_demand_name'))[0],
                    company_supply_id: _.uniq(_.pluck(result, 'company_supply_id'))[0],
                    company_supply_name: _.uniq(_.pluck(result, 'company_supply_name'))[0],
                    user_supply_id: _.uniq(_.pluck(result, 'user_supply_id')),
                    user_confirm_id: req.body.type === 'bidding' ? _.uniq(_.pluck(result, 'user_demand_id'))[0] : _.uniq(_.pluck(result, 'user_supply_id'))[0],

                    payment_style: _.uniq(_.pluck(result, 'payment_style'))[0] || 'FOB',

                    product_categories: product_categories,

                    warehouse_name: _.uniq(_.pluck(result, 'warehouse_name')),

                    att_quality: _.uniq(_.pluck(result, 'att_quality')),
                    att_payment: _.uniq(_.pluck(result, 'att_payment')),
                    att_traffic: _.uniq(_.pluck(result, 'att_traffic')),
                    att_settlement: _.uniq(_.pluck(result, 'att_settlement')),
                    path_loss: _.uniq(_.pluck(result, 'path_loss')),

                    amount: amount_total,
                    price: price_total,
                    preferential: preferential,

                    delay_day: _.compact(_.uniq(_.pluck(result, 'delay_day'))),
                    delay_type: _.compact(_.uniq(_.pluck(result, 'delay_type'))),
                    percent_advance: _.compact(_.uniq(_.pluck(result, 'percent_advance'))),

                    time_depart_end: global.util.getDateByHour(12),

                    price_type: _.reduce(_.pluck(result, price_param), function (arr, type) {
                        arr.push(type.indexOf('_') === -1 ? 'price_' + type : type);
                        return arr;
                    }, [])[0],
                    send_address_id: req.body.send_address_id,
                    send_address_unit_id: req.body.send_address_unit_id,
                    receive_address_id: req.body.receive_address_id,
                    receive_address_unit_id: req.body.receive_address_unit_id,

                    send_province: req.body.send_province,
                    send_city: req.body.send_city,
                    send_district: req.body.send_district,
                    send_addr: req.body.send_addr,
                    send_phone: req.body.send_phone,
                    send_name: req.body.send_name,
                    send_unit: req.body.send_unit,
                    send_location: req.body.send_location,

                    receive_province: req.body.receive_province,
                    receive_city: req.body.receive_city,
                    receive_district: req.body.receive_district,
                    receive_addr: req.body.receive_addr,
                    receive_phone: req.body.receive_phone,
                    receive_name: req.body.receive_name,
                    receive_unit: req.body.receive_unit,
                    receive_location: req.body.receive_location,

                    replenish: req.body.replenish || _.compact(_.flatten(_.pluck(result, 'replenish'))),
                    appendix: req.body.appendix,

                    receive_add_name: req.body.receive_add_name || "",
                    send_add_name: req.body.send_add_name || "",
                }, idObj), cb);
            },
            function (result, count, cb) {
                if(result && result.step == 2 && result.order_origin=='JJ'){
                    global.lib_common.sum_order(req,result.offer_id,result);
                }
                //如果是固定竞价的则去查询是否将这个竞价变为失效
                tuiSongCompany_id = result.company_supply_id;
                order_id = result._id.toString();
                // if (result.order_origin === global.config_model.order_origin.DJ) {
                //     global.lib_User.getUserOne({find: {_id: result.user_supply_id}}, function (err, user) {
                //          if (user) {
                //             global.lib_msg.send_sms(
                //                 [result.company_demand_name, result.product_categories[0].material_chn, result.amount],
                //                 'pricing_order_add',
                //                 [user.phone]
                //             );
                //         }
                //     });
                // }
                // if (result.order_origin === global.config_model.order_origin.JJ &&
                //     result.step === 1) {
                //     global.lib_User.getUserOne({find: {_id: result.user_demand_id}}, function (err, user) {
                //         if (user) {
                //             global.lib_msg.send_sms([user.real_name, result.product_categories[0].material_chn, result.company_supply_name, result.amount],
                //                 'bidding_order_add',
                //                 [user.phone]);
                //         }
                //     });
                // }
                // if (req.body.send_address_unit_id) {
                //     //生成交易订单,同步减少仓库量
                //     global.http.sendUserServer({
                //             amount: result.amount,
                //             operate: 'sub',
                //             store_id: result.send_address_id,
                //             store_unit_id: result.send_address_unit_id
                //         }, '/api/server/common/modify_store_amount',
                //         function (err) {
                //             if (err) {
                //                 return cb(err);
                //             }
                //             cb(null, result, count);
                //         });
                // } else {
                cb(null, result, count);
                // }
            },
            function (result, count, cb) {
                lib_Relationship.orderCheckAdd([{
                    id: result.user_demand_id,
                    company_id: result.company_demand_id,
                    relationship_type: other_relationship_type
                }, {
                    id: result.user_supply_id,
                    company_id: result.company_supply_id,
                    relationship_type: relationship_type
                }]);
                if (result.step === 2) {
                    lib_Store.add_store_agreement({
                        order_id: result._id.toString(),
                        send_address_id: result.send_address_id,
                        receive_address_id: result.receive_address_id,
                        amount: result.amount,
                        send_user_id: result.user_supply_id,
                        receive_user_id: result.user_demand_id,
                        send_company_id: result.company_supply_id,
                        receive_company_id: result.company_demand_id
                    });
                }
                //更新购物车，竞价出价，采购出价，的相关数据
                lib_DemandOrder.addOrderEnd(req, result, list);
                if (req.body.type === 'pricing') {
                    libModel.del({_id: {$in: req.body.ids}}, cb);
                } else {
                    libModel.update({
                        find: {_id: {$in: req.body.ids}},
                        set: {order_id: result._id}
                    }, cb);
                }
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            //检查是否应该发推送参数 company_id
            global.lib_common.pushTuiSongOrder(req, tuiSongCompany_id, function (err) {
                if (err) {
                    return next(err);
                }
                if (req.body.type == 'bidding' && endData && endData[0].type == 'DjJJ') {
                    global.lib_common.editDjJJ(order_id);
                }
                config_common.sendData(req, {id: result._id, step: idObj.step}, next);
            });
        });
    });

    api.post('/del', function (req, res, next) {
        var type;
        var orderData;
        async.waterfall([
            function (cb) {
                lib_DemandOrder.getOne({find: {_id: req.body.ids[0]}}, cb);
            },
            function (order, cb) {
                if (!order) {
                    return cb('not_found');
                }
                orderData = order;
                if (order.demandOffer_id) {
                    type = 'demand';
                    lib_DemandOffer.getOne({find: {_id: order.demandOffer_id}}, cb);
                } else if (order.offerAgain_id) {
                    type = 'priceOffer';
                    lib_OfferAgain.getOne({find: {_id: order.offerAgain_id}}, cb);
                } else {
                    cb(null, null)
                }
            },
            function (data, cb) {
                if (type === 'demand') {
                    lib_Demand.update({
                        find: {_id: data.demand_id},
                        set: {
                            $inc: {amount_remain: -orderData.amount},
                            $pull: {has_order: orderData.user_supply_id[0]}
                        }
                    }, cb);
                } else if (type === 'priceOffer') {
                    lib_PriceOffer.update({
                        find: {_id: data.offer_id},
                        set: {
                            $inc: {amount_remain: -orderData.amount},
                            $pull: {has_order: orderData.user_demand_id}
                        }
                    }, cb);
                } else {
                    cb(null, null);
                }
            },
            function (count, cb) {
                lib_DemandOffer.update({
                    find: {order_id: {$in: req.body.ids}},
                    set: {order_id: ''}
                }, cb);
            },
            function (count, cb) {
                lib_OfferAgain.update({
                    find: {order_id: {$in: req.body.ids}},
                    set: {order_id: ''}
                }, cb);
            },
            function (count, cb) {
                global.lib_common.del(req, lib_DemandOrder, cb);
            },
            function (cb) {
                lib_Store.del_store_agreement({
                    order_id: req.body.ids[0]
                }, cb);
            },
            function (Store, cb) {
                if (orderData.order_origin == 'DJ' && orderData.step != 1) {
                    var product_names;
                    var short_ids;
                    async.waterfall([
                        function (cbk) {
                            //取出来所有的product_name属性
                            product_names = _.flatten(_.pluck(orderData.product_categories, 'product_name'));
                            //查询到所有的 short_id--> 对应的数据 修改（1）报价的（2）订单自己的
                            short_ids = _.pluck(product_names, 'short_id');
                            global.lib_ProductName.getList({find: {short_id: {$in: short_ids}}}, cbk);
                        },
                        function (list, cbk) {
                            for (var i = 0; i < list.length; i++) {
                                var number1 = _.find(product_names, function (num) {
                                    return num.short_id == list[i].short_id;
                                });
                                var number2 = _.find(list, function (num) {
                                    return num.short_id == list[i].short_id;
                                });
                                var number3 = _.find(number2.attribute, function (num) {
                                    return num.can_count == true;
                                });
                                if (number1.number > number3.value) {
                                    return cb('not_enough');
                                }
                            }
                            for (var i = 0; i < list.length; i++) {
                                var number1 = _.find(product_names, function (num) {
                                    return num.short_id == list[i].short_id;
                                });
                                list[i].attribute[0].value = list[i].attribute[0].value + number1.number;
                                list[i].markModified('attribute');
                                list[i].save();
                            }
                            cbk();
                        },
                    ], cb);
                } else {
                    cb();
                }
            }
        ], function (err) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, {}, next);
        });
    });
    api.post('/edit', function (req, res, next) {
        async.waterfall([
            function (cb) {
                config_error.checkBody(req.body, ['id', 'step'], cb);
            },
            function (cb) {
                lib_DemandOrder.update({
                    find: {_id: req.body.id},
                    set: req.body.step === 4 ? {
                        trafficOrder: true,
                        step: req.body.step,
                        time_update_step: new Date()
                    } : {step: req.body.step, time_update_step: new Date()}
                }, cb);
            },
            function (result, cb) {
                lib_DemandOrder.getOne({
                    find: {_id: req.body.id}
                }, cb);
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            var type;
            if (result.payment_style === 'CIF') {
                type = 'buy_transit';
            } else {
                type = 'sale_transit';
            }
            if (req.body.step === 4) {
                global.lib_msg.push(req, {
                    title: '交易订单',
                    content: global.config_msg_templates.encodeContent('order_car', [req.decoded.company_name || '', req.decoded['user_name'], result.product_categories[0]['layer_1_chn']])
                }, {}, '', {
                    params: {id: result._id, source: type},
                    url: config_common.push_url.order
                }, req.decoded.id === result.user_demand_id ? [result.user_supply_id] : [result.user_demand_id]);
                lib_Store.add_store_ready({
                    order_id: result._id.toString(),
                    send_address_id: result.send_address_id,
                    receive_address_id: result.receive_address_id,
                    amount: result.amount,
                    send_user_id: result.user_supply_id,
                    receive_user_id: result.user_demand_id,
                    send_company_id: result.company_supply_id,
                    receive_company_id: result.company_demand_id,
                    product_categories: result.product_categories
                });
            }
            config_common.sendData(req, result, next);
        })
    });
    api.post('/detail', function (req, res, next) {
        global.lib_common.detail(req, lib_DemandOrder, function (err, result) {
            if (err) {
                return next(err);
            }
            if (result) {
                // result = result.toObject();
                result.categories = global.util.getMaterialList(result.product_categories);
            }
            var short_ids = _.uniq(_.pluck(_.flatten(_.pluck(result.product_categories, 'product_name')), 'short_id'));
            result.assign_amount = _.map(short_ids, function (num) {
                var obj = {};
                obj = {
                    name: num,
                    up: 0,
                    down: 0
                };
                return obj;
            });
            async.waterfall([
                function (cb) {
                    global.http.sendTrafficServer({
                        method: 'getList',
                        cond: {
                            find: {
                                index_trade: result.index
                            }
                        },
                        model: 'TrafficOrder'
                    }, '/api/server/common/get', cb);
                },
                function (data, cb) {
                    result = JSON.parse(JSON.stringify(result));
                    result.traffic = _.flatten(_.pluck(data, '_id'));
                    if (result.user_demand_id === req.decoded.id || _.indexOf(result.user_supply_id, req.decoded.id) != -1) {
                        result.shield = false;
                    } else {
                        result.shield = true;
                    }
                    cb();
                },
                function (cb) {
                    //查找线下找车运输的总吨数
                    global.http.sendTrafficServer({
                        method: 'getList',
                        cond: {
                            find: {index_trade: result.index, source: 'remark'},
                            select: 'amount source product_categories'
                        },
                        model: 'TrafficDriverOrder'
                    }, '/api/server/common/get', cb);
                },
                function (list, cb) {
                    var product_nameArr = _.flatten(_.pluck(_.flatten(_.pluck(list, 'product_categories')), 'product_name'));
                    result.assign_amount = _.map(result.assign_amount, function (oneData) {
                        oneData.down = _.reduce(_.pluck(_.filter(product_nameArr, function (product_name) {
                            return product_name.short_id == oneData.name;
                        }), 'amount'), function (memo, num) {
                            memo = parseInt(memo)
                            num = parseInt(num)
                            return memo + num;
                        }, 0);
                        return oneData;
                    });
                    cb()
                },
                function (cb) {
                    //查找线上找车运输的总吨数
                    global.http.sendTrafficServer({
                        method: 'getList',
                        cond: {
                            find: {index_trade: result.index},
                            select: 'product_categories'
                        },
                        model: 'TrafficDemand'
                    }, '/api/server/common/get', cb);
                },
                function (list, cb) {
                    var product_nameArr = _.flatten(_.pluck(_.flatten(_.pluck(list, 'product_categories')), 'product_name'));
                    result.assign_amount = _.map(result.assign_amount, function (oneData) {
                        oneData.up = _.reduce(_.pluck(_.filter(product_nameArr, function (product_name) {
                            return product_name.short_id == oneData.name;
                        }), 'amount'), function (memo, num) {
                            memo = parseInt(memo);
                            num = parseInt(num);
                            return memo + num;
                        }, 0);
                        return oneData;
                    });
                    cb();
                }
            ], function (err) {
                config_common.sendData(req, result || {}, next);
            });
        });
    });

    /**
     * 检验能不能同时下单
     * arr   需要检查的第一层分类数组
     */
    api.post('/check', function (req, res, next) {
        async.waterfall([
            function (cb) {
                config_error.checkBody(req.body, ['arr'], cb);
            },
            function (cb) {
                global.lib_OrderClassify.getCount({
                    arr: {$in: req.body.arr}
                }, cb);
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, result > 0 ? !(result - 1) : config_error.no_product, next);
        });
    });

    /**
     * 订单列表
     * status 列表类型
     */
    api.post('/get_list', function (req, res, next) {
        var page_num = req.body.page || 1;
        var query = lib_DemandOrder.getQueryByType(req.body.type, req.decoded.id);
        query.status = req.body.status;
        if (req.body.company_id) query = _.extend(global.middleware.getOtherCompanyQueryByType(req.body.type, req.body.company_id), query);
        var Obj;
        var length;
        var user_server_common = '/api/server/common/get';
        async.waterfall([
            function (cb) {
                config_error.checkBody(req.body, ['status', 'type'], cb);
            },
            function (cb) {
                if (req.body.type === 'PURCHASE') {
                    global.http.sendUserServer({
                        method: 'getOne',
                        cond: {find: {_id: query.user_demand_id}},
                        model: 'User_trade'
                    }, user_server_common, cb);
                } else if (req.body.type === 'SALE') {
                    global.http.sendUserServer({
                        method: 'getOne',
                        cond: {find: {_id: query.user_supply_id}},
                        model: 'User_trade'
                    }, user_server_common, cb);
                } else {
                    cb(null, null);
                }
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
                lib_DemandOrder.getListAndCount(page_num, {
                    find: query,
                    skip: config_common.entry_per_page * (page_num - 1),
                    limit: config_common.entry_per_page,
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
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            //循环确定超管
            for (var i = 0; i < result.list.length; i++) {
                result.list[i] = JSON.parse(JSON.stringify(result.list[i]));
                if (result.list[i].user_demand_id == req.decoded.id || _.indexOf(result.user_supply_id, req.decoded.id) == 1) {
                    result.list[i].shield = false;
                } else {
                    result.list[i].shield = true;
                }
            }
            //查询本公司今日销售总吨数
            // global.lib_common.getAllAmount(req.decoded.company_id, function (err, data) {
            //     result.all_amount = data;
            //
            // });
            config_common.sendData(req, result, next);
        });
    });

    /**
     * 运输里面的订单列表
     * type   supply：卖   demand：买
     */
    api.post('/get_pass_list', function (req, res, next) {
        var page_num = req.body.page || 1;
        var query = {step: {$in: [2, 3]}, is_assign: true, status: req.body.status};
        if (req.body.assign) delete query.is_assign;
        if (!req.body.status) delete query.status;
        var result;
        var arr = [];
        async.waterfall([
            function (cb) {
                config_error.checkBody(req.body, ['page'], cb);
            },
            function (cb) {
                lib_DemandOrder.getListAndCount(page_num, {
                    find: mw.getUserAndPaymentQuery(req.decoded.id, req.body, query),
                    skip: config_common.entry_per_page * (page_num - 1),
                    limit: config_common.entry_per_page,
                    sort: {time_creation: -1}
                }, cb);
            },
            function (result2, cb) {
                result = result2;
                result.list = JSON.parse(JSON.stringify(result.list));
                async.eachSeries(result.list, function (data, callback) {
                    http.sendUserServer({
                        cond: {find: {_id: data.company_supply_id}},
                        model: 'Company_trade',
                        method: 'getOne'
                    }, '/api/server/common/get', function (err, company_data) {
                        data.verify_phase = company_data.verify_phase;
                        arr.push(data);
                        callback()
                    });
                }, cb);
            }
        ], function (err) {
            if (err) return next(err);
            result.list = arr;
            config_common.sendData(req, result, next);
        });
    });

    /**
     * 提示条数
     * type
     *
     */
    api.post('/get_remind', function (req, res, next) {
        async.waterfall([
            function (cb) {
                config_error.checkBody(req.body, ['type'], cb);
            },
            function (cb) {
                global.lib_count.getOrderRemind(req.decoded, req.body.type, cb);
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            if (result) result.all = eval(_.values(result).join('+'));
            config_common.sendData(req, result, next);
        });
    });

    /**
     * 获取各个状态订单的个数
     * type  采购或者销售
     */
    api.post('/get_oneself_count', function (req, res, next) {
        var query = lib_DemandOrder.getQueryByType(req.body.type, req.decoded.id);
        if (req.body.company_id) query = _.extend(global.middleware.getOtherCompanyQueryByType(req.body.type, req.body.company_id), query);
        var Status = {
            ineffective: 0,
            effective: 0,
            complete: 0,
            cancelled: 0
        };
        var user_server_common = '/api/server/common/get';
        async.waterfall([
            function (cb) {
                config_error.checkBody(req.body, ['type'], cb);
            },
            function (cb) {
                if (req.body.type === 'PURCHASE') {
                    global.http.sendUserServer({
                        method: 'getOne',
                        cond: {find: {_id: query.user_demand_id}},
                        model: 'User_trade'
                    }, user_server_common, cb);
                } else if (req.body.type === 'SALE') {
                    global.http.sendUserServer({
                        method: 'getOne',
                        cond: {find: {_id: query.user_supply_id}},
                        model: 'User_trade'
                    }, user_server_common, cb);
                } else {
                    cb(null, null);
                }
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
                lib_DemandOrder.getAggregate({
                    match: query,
                    group: {_id: '$status', num: {$sum: 1}}
                }, cb);
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            _.each(result, function (status) {
                Status[status._id] = status.num;
            });
            config_common.sendData(req, Status, next);
        });
    });

    /**
     * 确认订单
     * id  订单id
     */
    api.post('/confirm', function (req, res, next) {
        //确认报价订单式需要先确定可销售吨数数量-->如果可以则可以确定否则无法确定-->确定成功则去修改报价中相关产品的可销售吨数
        var offerData;
        var saveOrderData;
        async.waterfall([
            function (cb) {
                //查询到订单的具体数据
                lib_DemandOrder.getOne({
                    find: {_id: req.body.id}
                }, cb);
            },
            function (orderData, cb) {
                orderData.time_creation = new Date();
                orderData.save();
                saveOrderData = orderData;
                if (orderData.order_origin == 'DJ') {
                    var product_names;
                    var short_ids;
                    async.waterfall([
                        function (cbk) {
                            //取出来所有的product_name属性
                            product_names = _.flatten(_.pluck(orderData.product_categories, 'product_name'));
                            //查询到所有的 short_id--> 对应的数据 修改（1）报价的（2）订单自己的
                            short_ids = _.pluck(product_names, 'short_id');
                            global.lib_ProductName.getList({find: {short_id: {$in: short_ids}}}, cbk);
                        },
                        function (list, cbk) {
                            for (var i = 0; i < list.length; i++) {
                                var number1 = _.find(product_names, function (num) {
                                    return num.short_id == list[i].short_id;
                                });
                                var number2 = _.find(list, function (num) {
                                    return num.short_id == list[i].short_id;
                                });
                                var number3 = _.find(number2.attribute, function (num) {
                                    return num.can_count == true;
                                });
                                if (number1.number > number3.value) {
                                    return cb('not_enough');
                                }
                            }
                            for (var i = 0; i < list.length; i++) {
                                var number1 = _.find(product_names, function (num) {
                                    return num.short_id == list[i].short_id;
                                });
                                list[i].attribute[0].value = list[i].attribute[0].value - number1.number;
                                if (list[i].attribute[0].value == 0) {
                                    list[i].attribute[0].end_time = new Date();
                                }
                                list[i].markModified('attribute');
                                list[i].save();
                            }
                            cbk();
                        },
                        function (cbk) {
                            global.lib_PriceOffer.onlyGetOne({find: {_id: orderData.offer_id}}, cbk);
                        },
                        function (offer, cbk) {
                            offerData = offer;
                            cbk();
                        }
                    ], cb);
                } else {
                    cb();
                }
            },
            function (cb) {
                var set = {status: global.config_model.order_status.effective, step: 2};
                if (offerData) {
                    saveOrderData.date_content.type = offerData.date_type;
                    saveOrderData.date_content.cut_date = offerData.cut_date;
                    saveOrderData.date_content.cut_type = offerData.cut_type;
                    saveOrderData.date_content.start_date = offerData.start_date;
                    if (offerData.date_type == 'cut') {
                        var cut_time = (offerData.cut_type == 'today' ? 0 : 1000 * 60 * 60 * 24) + 1000 * 60 * 60 * offerData.cut_date;
                        var time = new Date(new Date().toLocaleDateString()).getTime();
                        var newTime = new Date(time + cut_time);
                        saveOrderData.date_content.date = newTime;
                        saveOrderData.date_content.timeout_price = offerData.timeout_price;
                        saveOrderData.date_content.not_count_price = offerData.not_count_price;
                    } else {
                        saveOrderData.date_content.date = new Date(new Date(new Date().toLocaleDateString()).getTime() + (1000 * 60 * 60 * 24 * offerData.start_date));
                    }
                    saveOrderData.markModified('date_content');
                    saveOrderData.save();
                }
                lib_DemandOrder.update({
                    find: {_id: req.body.id},
                    set: set
                }, cb);
            },
            function (count,cb) {
                lib_DemandOrder.getOne({
                    find: {_id: req.body.id}
                }, cb);
            }
        ], function (err, result) {
            if (err) return next(err);
            lib_Relationship.orderCheckAdd([{
                id: result.user_demand_id,
                company_id: result.company_demand_id,
                relationship_type: global.config_model.relationship_type.trade_demand_effective
            }, {
                id: result.user_supply_id,
                company_id: result.company_supply_id,
                relationship_type: global.config_model.relationship_type.trade_supply_effective
            }]);
            lib_Store.add_store_agreement({
                order_id: result._id.toString(),
                send_address_id: result.send_address_id,
                receive_address_id: result.receive_address_id,
                amount: result.amount,
                send_user_id: result.user_supply_id,
                receive_user_id: result.user_demand_id,
                send_company_id: result.company_supply_id,
                receive_company_id: result.company_demand_id
            });
            if (req.decoded.id === result.user_demand_id) {
                global.lib_msg.push(req, {
                    title: '交易订单',
                    content: global.config_msg_templates.encodeContent(
                        'PURCHASE_order',
                        [req.decoded.company_name || '', req.decoded['user_name'], result.amount, result.product_categories[0].pass_unit, result.product_categories[0]['layer_1_chn']])
                }, {}, '', {
                    params: {
                        id: result._id,
                        source: 'sale_transit'
                    },
                    url: config_common.push_url.order
                }, [result.user_supply_id]);
            } else {
                global.lib_User.getUserOne({find: {_id: result.user_demand_id}}, function (err, userData) {
                    global.lib_msg.push(req, {
                        title: '交易订单',
                        content: global.config_msg_templates.encodeContent(
                            'PURCHASE_order',
                            [userData.real_name, result.amount, result.product_categories[0].pass_unit, result.product_categories[0]['layer_1_chn'], result.company_supply_name])
                    }, {}, '', {
                        params: {
                            id: result._id,
                            source: 'buy_transit'
                        },
                        url: config_common.push_url.order
                    }, [result.user_demand_id]);
                })
            }
            if (result.order_origin === global.config_model.order_origin.DJ) {
                global.lib_User.getUserOne({find: {_id: result.user_demand_id}}, function (err, user) {
                    if (user) {
                        global.lib_msg.send_sms([user.real_name, result.amount, result.product_categories[0].material_chn, result.company_supply_name], 'pricing_order_confirm', [user.phone]);
                    }
                });
            }
            config_common.sendData(req, {}, next);
        });
    });
    //待发布物流，采购确认接口
    api.post('/new_confirm', function (req, res, next) {
        //确认报价订单式需要先确定可销售吨数数量-->如果可以则可以确定否则无法确定-->确定成功则去修改报价中相关产品的可销售吨数
        var offerData;
        var saveOrderData;
        async.waterfall([
            function (cb) {
                //查询到订单的具体数据
                lib_DemandOrder.getOne({
                    find: {_id: req.body.id}
                }, cb);
            },
            function (orderData, cb) {
                orderData.buy_district_type=req.body.buy_district_type;
                orderData.time_creation = new Date();
                orderData.save();
                saveOrderData = orderData;
                if (orderData.order_origin == 'DJ') {
                    var product_names;
                    var short_ids;
                    async.waterfall([
                        function (cbk) {
                            //取出来所有的product_name属性
                            product_names = _.flatten(_.pluck(orderData.product_categories, 'product_name'));
                            //查询到所有的 short_id--> 对应的数据 修改（1）报价的（2）订单自己的
                            short_ids = _.pluck(product_names, 'short_id');
                            global.lib_ProductName.getList({find: {short_id: {$in: short_ids}}}, cbk);
                        },
                        function (list, cbk) {
                            for (var i = 0; i < list.length; i++) {
                                var number1 = _.find(product_names, function (num) {
                                    return num.short_id == list[i].short_id;
                                });
                                var number2 = _.find(list, function (num) {
                                    return num.short_id == list[i].short_id;
                                });
                                var number3 = _.find(number2.attribute, function (num) {
                                    return num.can_count == true;
                                });
                                if (number1.number > number3.value) {
                                    return cb('not_enough');
                                }
                            }
                            for (var i = 0; i < list.length; i++) {
                                var number1 = _.find(product_names, function (num) {
                                    return num.short_id == list[i].short_id;
                                });
                                list[i].attribute[0].value = list[i].attribute[0].value - number1.number;
                                if (list[i].attribute[0].value == 0) {
                                    list[i].attribute[0].end_time = new Date();
                                }
                                list[i].markModified('attribute');
                                list[i].save();
                            }
                            cbk();
                        },
                        function (cbk) {
                            global.lib_PriceOffer.onlyGetOne({find: {_id: {$in:orderData.offer_id}}}, cbk);
                        },
                        function (offer, cbk) {
                            offerData = offer;
                            cbk();
                        }
                    ], cb);
                } else {
                    cb();
                }
            },
            function (cb) {
                var set = {status: global.config_model.order_status.effective, step: 2};
                if (offerData) {
                    saveOrderData.date_content.type = offerData.date_type;
                    saveOrderData.date_content.cut_date = offerData.cut_date;
                    saveOrderData.date_content.cut_type = offerData.cut_type;
                    saveOrderData.date_content.start_date = offerData.start_date;
                    if (offerData.date_type == 'cut') {
                        var cut_time = (offerData.cut_type == 'today' ? 0 : 1000 * 60 * 60 * 24) + 1000 * 60 * 60 * offerData.cut_date;
                        var time = new Date(new Date().toLocaleDateString()).getTime();
                        var newTime = new Date(time + cut_time);
                        saveOrderData.date_content.date = newTime;
                        saveOrderData.date_content.timeout_price = offerData.timeout_price;
                        saveOrderData.date_content.not_count_price = offerData.not_count_price;
                    } else {
                        saveOrderData.date_content.date = new Date(new Date(new Date().toLocaleDateString()).getTime() + (1000 * 60 * 60 * 24 * offerData.start_date));
                    }
                    saveOrderData.markModified('date_content');
                    saveOrderData.save();
                }
                lib_DemandOrder.update({
                    find: {_id: req.body.id},
                    set: set
                }, cb);
            },
            //此处新增加代发物流

            function(count, cb){
                //销售方添加配送区域时
                if(saveOrderData.district_type){
                    console.log('进入销售');
                    req.body.pass_type='sale';
                    async.waterfall([
                        function(cb){
                            //查区域模板
                            global.lib_PassPrice.getList({
                                find: {
                                    pass_type: req.body.pass_type,
                                    location_storage :saveOrderData.send_address_id
                                }
                            }, cb);
                        },
                        function(data,cb){
                            if(data.length==0){
                                console.log('aaaaaaaaaaaaaaaaaa');
                                global.lib_sell.sell_add_area(req,saveOrderData,cb);
                            }else{
                                console.log('bbbbbbbbbbbbb');
                                async.eachSeries(data, function (entry, cbk) {
                                    entry = JSON.parse(JSON.stringify(entry));
                                    async.waterfall([
                                        function (cbk1) {
                                            //查配送区域
                                            global.lib_priceOfferCity.getList({
                                                find: {passPrice_id: entry._id.toString()}
                                            }, cbk1);
                                        },
                                        function (pass, cbk1) {
                                            console.log('pass',pass);
                                            var city= _.pluck(pass,'city');
                                            var province= _.pluck(pass,'province');
                                            var district= _.pluck(pass,'district');
                                            if((_.indexOf(city, saveOrderData.receive_city)==-1) || (_.indexOf(province, saveOrderData.receive_province)==-1) || (_.indexOf(district, saveOrderData.receive_district)==-1)){
                                               console.log('####11111111111111111');
                                                global.lib_sell.sell_add_city(req,saveOrderData,cbk1);
                                            }else{
                                                console.log('####2222222222222222');
                                                global.lib_sell.sell_edit_city(req,saveOrderData,cbk1);
                                            }
                                        }
                                    ], cbk);
                                }, cb);
                            }
                        },
                    ],cb)
                }else{
                    cb();
                }
            },
            function(cb){
                //采购方添加提货区域时
                if(req.body.buy_district_type){
                    req.body.pass_type='purchase';
                    console.log('进入采购');
                    async.waterfall([
                        function(cb1){
                            //查区域模板
                            global.lib_PassPrice.getList({
                                find: {
                                    pass_type: req.body.pass_type,
                                    location_storage :saveOrderData.receive_address_id
                                }
                            }, cb1);
                        },
                        function(data,cb1){
                            if(data.length==0){
                                global.lib_sell.sell_add_area(req,saveOrderData,function(err,result,count){
                                    if(err){console.log('err',err)}
                                    cb1();
                                });
                            }else{
                                async.eachSeries(data, function (entry, cbk) {
                                    entry = JSON.parse(JSON.stringify(entry));
                                    async.waterfall([
                                        function (cbk1) {
                                            //查提货区域
                                            global.lib_priceOfferCity.getList({
                                                find: {passPrice_id: entry._id.toString()}
                                            }, cbk1);
                                        },
                                        function (pass, cbk1) {
                                            var city= _.pluck(pass,'city');
                                            var province= _.pluck(pass,'province');
                                            var district= _.pluck(pass,'district');
                                            if((_.indexOf(city, saveOrderData.send_city)==-1) || (_.indexOf(province, saveOrderData.send_province)==-1) || (_.indexOf(district, saveOrderData.send_district)==-1)){
                                                console.log('aaaaaaaaaaaaaaaa');
                                                global.lib_sell.sell_add_city(req,saveOrderData,cbk1);
                                            }else{
                                                console.log('bbbbbbbbbbbbbbbbbb');
                                                global.lib_sell.sell_edit_city(req,saveOrderData,cbk1);
                                            }
                                        }
                                    ], cbk);
                                }, cb1);
                            }
                        }
                    ],cb);
                }else{
                    cb();
                }
            },



            function (cb) {
                lib_DemandOrder.getOne({
                    find: {_id: req.body.id}
                }, cb);
            }
        ], function (err, result) {
            if (err) return next(err);
            lib_Relationship.orderCheckAdd([{
                id: result.user_demand_id,
                company_id: result.company_demand_id,
                relationship_type: global.config_model.relationship_type.trade_demand_effective
            }, {
                id: result.user_supply_id,
                company_id: result.company_supply_id,
                relationship_type: global.config_model.relationship_type.trade_supply_effective
            }]);
            lib_Store.add_store_agreement({
                order_id: result._id.toString(),
                send_address_id: result.send_address_id,
                receive_address_id: result.receive_address_id,
                amount: result.amount,
                send_user_id: result.user_supply_id,
                receive_user_id: result.user_demand_id,
                send_company_id: result.company_supply_id,
                receive_company_id: result.company_demand_id
            });
            if (req.decoded.id === result.user_demand_id) {
                global.lib_msg.push(req, {
                    title: '交易订单',
                    content: global.config_msg_templates.encodeContent(
                        'PURCHASE_order',
                        [req.decoded.company_name || '', req.decoded['user_name'], result.amount, result.product_categories[0].pass_unit, result.product_categories[0]['layer_1_chn']])
                }, {}, '', {
                    params: {
                        id: result._id,
                        source: 'sale_transit'
                    },
                    url: config_common.push_url.order
                }, [result.user_supply_id]);
            } else {
                global.lib_User.getUserOne({find: {_id: result.user_demand_id}}, function (err, userData) {
                    global.lib_msg.push(req, {
                        title: '交易订单',
                        content: global.config_msg_templates.encodeContent(
                            'PURCHASE_order',
                            [userData.real_name, result.amount, result.product_categories[0].pass_unit, result.product_categories[0]['layer_1_chn'], result.company_supply_name])
                    }, {}, '', {
                        params: {
                            id: result._id,
                            source: 'buy_transit'
                        },
                        url: config_common.push_url.order
                    }, [result.user_demand_id]);
                })
            }
            if (result.order_origin === global.config_model.order_origin.DJ) {
                global.lib_User.getUserOne({find: {_id: result.user_demand_id}}, function (err, user) {
                    if (user) {
                        global.lib_msg.send_sms([user.real_name, result.amount, result.product_categories[0].material_chn, result.company_supply_name], 'pricing_order_confirm', [user.phone]);
                    }
                });
            }
            config_common.sendData(req, {}, next);
        });
    });

    /***
     * 区分添加到采购提货区域还是销售配送区域
     * ***/
    api.post('/differentiate_area',function(req,res,next){
        if(!req.body.type || !req.body.location_storage){
            return next(config_error.invalid_format);
        }
        var area_type;
        var result = {list: []};
        async.waterfall([
            function(cb){
                global.lib_PassPrice.getList({
                    find:{
                        location_storage:req.body.location_storage,
                        pass_type:req.body.type
                    }
                },cb);
            },
            function(data,cb){
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
        ],function(err){
            if(err){console.log('err',err)}
            if(result.list.length==0){
                area_type='false';
            }else{
                area_type='true';
            }
            if(req.body.type='purchase'){
                config_common.sendData(req, result, next);
            }else{
                config_common.sendData(req, {}, next);
            }

        });
    });
    /**
     * 设定价格接口
     */
    api.post('/customization_confirm',function (req, res, next) {
        //确认报价订单式需要先确定可销售吨数数量-->如果可以则可以确定否则无法确定-->确定成功则去修改报价中相关产品的可销售吨数
        if(!req.body.traffic_cost){
            return next(config_error.invalid_format);
        }
        async.waterfall([
            function (cb) {
                //查询到订单的具体数据
                lib_DemandOrder.getOne({
                    find: {_id: req.body.id}
                }, cb);
            },
            function (orderData, cb) {
                orderData.traffic_cost=req.body.traffic_cost;
                orderData.district_type=req.body.district_type;
                orderData.save(cb);
            },
        ], function (err,result) {
            if(err){console.log('err',err)}
            global.lib_msg.push(req, {
                title: '交易订单',
                content: global.config_msg_templates.encodeContent(
                    'PURCHASE_order',
                    [req.decoded.company_name || '', req.decoded['user_name'], result.amount, result.product_categories[0].pass_unit, result.product_categories[0]['layer_1_chn']])
            }, {}, '', {
                params: {
                    id: result._id,
                    source: 'sale_transit'
                },
                url: config_common.push_url.order
            }, [result.user_supply_id]);
            config_common.sendData(req, result, next);
        });
    });
    /**  需要改推送模板
     * 推送短信信息
     * type   buy  sell
     * id  订单id
     * user_id  要推送给谁
     * layer_1_chn 订单的产品一级
     */
    api.post('/push', function (req, res, next) {
        global.lib_msg.push(req, {
            title: '交易订单',
            content: global.config_msg_templates.encodeContent('inform_SALE', [req.decoded.company_name || '', req.decoded['user_name'], req.body.amount, req.body['layer_1_chn']])
        }, {}, '', {
            params: {id: req.body.id, source: 'sale_confirmed'},
            url: config_common.push_url.order
        }, [req.body.user_id], '', function (err) {
            if (err) return next('no_reg_ids');
            config_common.sendData(req, {}, next);
        });
    });

    /**
     * 订单结束
     *
     * id  单子id
     */
    api.post('/over', function (req, res, next) {
        // 权限检查--弱
        if (req.decoded.role !== config_common.user_roles.TRADE_ADMIN &&
            req.decoded.role !== config_common.user_roles.TRADE_PURCHASE &&
            req.decoded.role !== config_common.user_roles.TRADE_SALE) {
            return next(config_error.invalid_role);
        }
        async.waterfall([
            function (cb) {
                config_error.checkRole(req.decoded.role, [config_common.user_roles.TRADE_ADMIN, config_common.user_roles.TRADE_SALE, config_common.user_roles.TRADE_PURCHASE], cb);
            },
            function (cb) {
                config_error.checkBody(req.body, ['id'], cb);
            },
            function (cb) {
                lib_DemandOrder.getOne({
                    find: {_id: req.body.id}
                }, cb);
            },
            function (entry, cb) {
                if (!entry) return next(config_error.not_found);
                // 权限检查--强
                if (req.body.step == 4) {
                    if (req.decoded.id !== entry.user_supply_id &&
                        (req.decoded.role === config_common.user_roles.TRADE_ADMIN &&
                        req.decoded.company_id !== entry.company_supply_id)) {
                        return next(config_error.invalid_role);
                    }
                } else {
                    if (req.decoded.id !== entry.user_demand_id &&
                        (req.decoded.role === config_common.user_roles.TRADE_ADMIN &&
                        req.decoded.company_id !== entry.company_demand_id)) {
                        return next(config_error.invalid_role);
                    }
                }
                entry.status = global.config_model.order_status.complete;
                entry.step = 5;
                if (entry['unline_driver'] && entry['unline_driver'].length > 0) {
                    entry['unline_driver'][0]['status'] = 'completed';
                    entry.markModified('unline_driver');
                }
                entry.trafficOrder = true;
                entry.time_update_step = new Date();
                lib_DemandOrder.edit(entry, cb);
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            global.lib_User.addCompanyDynamic({
                company_id: result.company_demand_id,
                user_id: result.user_demand_id,
                type: config_common.typeCode.trade_order_confirm_purchase,
                data: JSON.stringify(result)
            });
            global.lib_User.addCompanyDynamic({
                company_id: result.company_supply_id,
                user_id: result.user_supply_id,
                type: config_common.typeCode.trade_order_confirm_sale,
                data: JSON.stringify(result)
            });
            lib_Relationship.orderCheckAdd([{
                id: result.user_demand_id,
                company_id: result.company_demand_id,
                relationship_type: global.config_model.relationship_type.trade_demand_complete
            }, {
                id: result.user_supply_id,
                company_id: result.company_supply_id,
                relationship_type: global.config_model.relationship_type.trade_supply_complete
            }]);
            var type, other_type;
            if (result.order_origin === global.config_model.order_origin.JJ) {
                type = global.config_model.statistical_type.sale_bidding_order;
                other_type = global.config_model.statistical_type.purchase_offerAgain_order;
            } else if (result.order_origin === global.config_model.order_origin.DJ) {
                type = global.config_model.statistical_type.sale_pricing_order;
                other_type = global.config_model.statistical_type.purchase_pricing_order;
            } else {
                type = global.config_model.statistical_type.sale_demandOffer_order;
                other_type = global.config_model.statistical_type.purchase_demand_order;
            }
            global.lib_Statistical.statistical_server_companyTrade_add(req, {
                companyObj: [{
                    type: type,
                    amount: result.amount,
                    price: result.price,
                    att_payment: result.att_payment[0],
                    id: result.company_supply_id,
                    material: result.product_categories.material,
                    payment_choice: result.att_payment
                }, {
                    type: other_type,
                    amount: result.amount,
                    price: result.price,
                    att_payment: result.att_payment[0],
                    id: result.company_demand_id,
                    material: result.product_categories.material,
                    payment_choice: result.att_payment
                }]
            });
            lib_Store.storeServerOrderTradeComplete({
                order_id: result._id.toString(),
                product_categories: result.product_categories
            });
            lib_Statistical.add({
                data: {
                    order_id: result._id,
                    type: 'trade',
                    company_supply_id: result.company_supply_id,
                    company_demand_id: result.company_demand_id,
                    company_traffic_id: '',
                    time_final_payment: result.time_update_step
                }
            });
            //向信用中心发送完成请求
            global.http.sendCreditServer({
                order_id: result._id,
                company_supply_id: result.company_supply_id,
                company_demand_id: result.company_demand_id,
                type: 'TRADE',
                order_origin: result.order_origin,
                att_payment: result.att_payment[0],
                order_over_time: result.time_update_step
            }, '/api/server/order/add', function (err, data) {
            });
            config_common.sendData(req, result, next);
        });
    });

    /**
     * 公司订单列表
     * status 列表类型
     */
    api.post('/get_company_list', function (req, res, next) {
        var page_num = req.body.page || 1;
        var query = lib_DemandOrder.getCompanyQueryByType(req.body.type, req.decoded.company_id);
        query.status = req.body.status;
        if (req.body.att_payment) query.att_payment = req.body.att_payment;
        if (req.body.company_id) query = _.extend(global.middleware.getOtherCompanyQueryByType(req.body.type, req.body.company_id), query);
        var Obj;
        var length;
        async.waterfall([
            function (cb) {
                config_error.checkBody(req.body, ['status', 'type'], cb);
            },
            function (cb) {
                lib_DemandOrder.getListAndCount(page_num, {
                    find: query,
                    skip: config_common.entry_per_page * (page_num - 1),
                    limit: config_common.entry_per_page,
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
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, result, next);
        });
    });

    /**
     * 线下找车
     * @param order_id: 订单id
     * @param extra: 额外信息
     */
    api.post('/unline_driver', function (req, res, next) {
        if (!req.body.index_trade || !req.body.assign) {
            return next(config_error.invalid_format)
        }
        var sendArr = '';
        req.body.assign = _.isString(req.body.assign) ? JSON.parse(req.body.assign) : req.body.assign;
        async.waterfall([
            function (cb) {
                lib_DemandOrder.getOne({
                    find: {
                        index: req.body.index_trade
                    }
                }, cb)
            },
            function (order, cb) {
                if (!order) {
                    return cb('not_found');
                }
                if (order.send_province) {
                    sendArr += order.send_province;
                }
                if (order.send_city && order.send_city != order.send_province) {
                    sendArr += order.send_city;
                }
                if (order.send_district) {
                    sendArr += order.send_district;
                }
                if (order.send_addr) {
                    sendArr += order.send_addr;
                }
                _.each(req.body.assign, function (a) {
                    a.time_cretion = new Date();
                });
                if (!order.unline_driver || order.unline_driver.length == 0) {
                    order.unline_driver = req.body.assign;
                } else {
                    order.unline_driver.push(req.body.assign[0]);
                }
                var subProduct = function (A, B) {
                    _.each(B, function (b) {
                        _.each(b.product_name, function (bb) {
                            _.each(A, function (a) {
                                _.each(a.product_name, function (aa) {
                                    if (aa.short_id == bb.short_id) {
                                        //减去分配数 number_remian 不存在，但是可以为0
                                        if (typeof(aa.number_remain) == 'undefined') {
                                            aa.number_remain = global.util.sub(aa.number, bb.number);
                                        } else {
                                            aa.number_remain = global.util.sub(aa.number_remain, bb.number);
                                        }
                                        order.amount_been_demand = global.util.add(order.amount_been_demand, global.util.mul(bb.number, global.util.div(bb.amount, bb.number)))
                                    }
                                });
                            });
                        });
                    });
                };
                _.each(req.body.assign, function (a) {
                    _.each(a.driver, function (b) {
                        subProduct(order.product_categories, b.product_categories)
                    })
                });
                order.markModified('product_categories');
                order.markModified('unline_driver');
                order.save(cb);
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            global.lib_DriverOrder.createDriverOder(req, {
                assign: req.body.assign,
                user_id: req.decoded.id,
                index: result.index,
                trade_phone: req.decoded.phone,
                send_addr: sendArr
            }, function (x, y) {
                console.log(x, y)
            });

            config_common.sendData(req, result, next);
        })
    });
    api.post('/unline_driver_edit', function (req, res, next) {
        //只修改某一个坐标位置的状态
        if (!req.body.index_trade || !req.body.assign) {
            return next(config_error.invalid_format)
        }
        async.waterfall([
            function (cb) {
                lib_DemandOrder.getOne({
                    find: {
                        index: req.body.index_trade
                    }
                }, cb)
            },
            function (order, cb) {
                //[{jiaobiao: [x,y], status: '' }]
                _.each(req.body.assign, function (b) {
                    if (b['jiaobiao'][1] === '' || typeof(b['jiaobiao'][1]) === 'undefined' || typeof(b['jiaobiao'][1]) === 'null') {
                        order['unline_driver'][b['jiaobiao'][0]]['status'] = b.status;
                    } else {
                        order['unline_driver'][b['jiaobiao'][0]]['driver'][b['jiaobiao'][1]]['status'] = b.status;
                    }

                });
                order.markModified('unline_driver');
                order.save(cb);
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, result, next);
        })
    });
    api.post('/test', function (req, res, next) {

        async.waterfall([
            function (cb) {
                cb()
            }
        ], function (x, y) {
            if (x) {
                return next(x)
            }
            config_common.sendData(req, y, next);
        })
    })
    return api;
};
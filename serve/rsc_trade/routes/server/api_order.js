/**
 * Created by Administrator on 17/4/25.
 */
var async = require('async');
var _ = require('underscore');

var config_common = global.config_common;
var config_error = global.config_error;
var lib_Store = global.lib_Store;
var lib_DemandOrder = global.lib_DemandOrder;
var config_model = global.config_model;

var util = global.util;

module.exports = function (app, express) {

    var api = express.Router();

    // 拦截非授权请求
    api.use(require('../../middlewares/mid_verify_server')());

    /**
     * 发布物流需求单 取消物流需求单 或 指派物流 的时候修改交易订单数据
     * id 或 index   单子的唯一标示
     * is_true true  发布物流需求单  false  删除物流需求单 或者 需求单获取
     * amount        吨数
     */
    api.post('/edit', function (req, res, next) {
        async.waterfall([
            function (cb) {
                lib_DemandOrder.getOne({
                    find: {$or: [{_id: req.body.id}, {index: req.body.index}]}
                }, cb);
            },
            function (order, cb) {
                if (!order) return next(config_error.invalid_id);
                if (_['isString'](req.body['products_remain'])) req.body['products_remain'] = JSON.parse(req.body['products_remain']);
                if (req.body['is_true']) {
                    if (util.add(order.amount_been_demand, req.body.amount) > order.amount) return next(config_error.not_amount);
                    order.step = 3;
                    order.amount_been_demand = util.add(order.amount_been_demand, req.body.amount);
                    order.product_categories = lib_DemandOrder.assign(order.product_categories, req.body['products_remain'], util.sub);
                    if (!order.product_categories) return cb(config_error.invalid_product);
                    if (order.amount_been_demand > order.amount) return cb(config_error.invalid_amount);
                } else {
                    order.amount_been_demand = util.sub(order.amount_been_demand, req.body.amount);
                    order.product_categories = lib_DemandOrder.assign(order.product_categories, req.body['products_remain'], util.add);
                    if (!order.product_categories) return cb(config_error.invalid_product);
                    order.step = order.amount_been_demand === 0 ? 3 : 2
                }
                if (order.amount === order.amount_been_demand) order.is_assign = false;
                order.att_traffic = config_model.att_traffic.pick_up;
                order.markModified('product_categories');
                lib_DemandOrder.edit(order, cb);
            }
        ], function (err) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, {}, next);
        });
    });

    /**
     * 补货修改交易订单
     * id  单子id
     * replenishCar  司机补货信息
     */
    api.post('/replenish', function (req, res, next) {
        async.waterfall([
            function (cb) {
                lib_DemandOrder.getOne({find: {$or: [{_id: req.body.id}, {index: req.body.index}]}}, cb);
            },
            function (data, cb) {
                data.amount = util.add(data.amount, req.body.amount);
                data.amount_been_demand = util.add(data.amount_been_demand, req.body.amount);
                data.price_replenish = util.add(data.price_replenish, _.reduce(req.body.replenishCar.product_name, function (memo, num) {
                    return util.mul(num.price, num.amount);
                }, 0));
                data.price = util.add(data.price, _.reduce(req.body.replenishCar.product_name, function (memo, num) {
                    return util.mul(num.price, num.amount);
                }, 0));
                data.save();
                cb();
            }
        ], function (err) {
            if (err) {
                return next(err);
            }
            lib_DemandOrder.update({
                find: {$or: [{_id: req.body.id}, {index: req.body.index}]},
                set: {
                    $addToSet: {
                        replenishCar: req.body.replenishCar
                    }
                }
            }, function (err) {
                if (err) {
                    return next(err);
                }
                config_common.sendData(req, {}, next);
            });
        })
    })

    /**
     * 确认物流订单修改交易订单
     * id  单子id
     */
    api.post('/update', function (req, res, next) {
        var order;
        async.waterfall([
            function (cb) {
                lib_DemandOrder.getOne({find: {$or: [{_id: req.body.id}, {index: req.body.index}]}}, cb);
            },
            function (result, cb) {
                if(!result){
                    return cb('not_found');
                }
                order = result;
                lib_DemandOrder.update({
                    find: {$or: [{_id: req.body.id}, {index: req.body.index}]},
                    set: {
                        trafficOrder: true, $inc: {
                            amount_pick_up_weight: req.body.amount_pick_up_weight || 0,
                            amount_arrival_weight: req.body.amount_arrival_weight || 0,
                            price_pick_up_weight: req.body.price_actual || util.mul(req.body.amount_pick_up_weight || 0, result.product_categories[0].product_name[0].price),
                            price_arrival_weight: req.body.price_actual || util.mul(req.body.amount_arrival_weight || 0, result.product_categories[0].product_name[0].price)
                        }
                    }
                }, cb);
            }
        ], function (err) {
            if (err) return next(err);
            config_common.sendData(req, {}, next);
        });

    });

    api.post('/set_store_region', function (req, res, next) {
        if (!req.body.order_id ||
            !req.body.store_id ||
            !req.body.unit_name ||
            !_.isNumber(req.body.area)) {
            return next('invalid_format');
        }
        async.waterfall([
            function (cb) {
                lib_DemandOrder.getOne({
                    find: {_id: req.body.order_id}
                }, cb);
            },
            function (order, cb) {
                if (!order) {
                    return cb('not_found');
                }
                if (req.body.store_id === order.send_address_id) {
                    order.send_unit_name = req.body.unit_name;
                    order.send_area = req.body.area;
                }
                if (req.body.store_id === order.receive_address_id) {
                    order.receive_unit_name = req.body.unit_name;
                    order.receive_area = req.body.area;
                }
                order.save(cb);
            }
        ], function (err, order) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, order, next);
        });
    });

    return api;
};
/**
 * Created by Administrator on 17/4/27.
 */
var async = require('async');
var _ = require('underscore');
var express = require('express');
var lib_pay_surplus = require('../../libs/lib_pay_surplus');
var config_common = require('../../configs/config_common');
var lib_pay_carrynow = require('../../libs/lib_pay_carrynow');
var lib_pay_informationorder = require('../../libs/lib_pay_InformationOrder');
var lib_pay_aggregate = require('../../libs/lib_pay_aggregate');

module.exports = function () {

    var api = express.Router();

    api.use(require('../../middlewares/mid_verify_server')());

    /**
     * 缴纳扣款信息费
     */
    api.post('/pay_information_debit', function (req, res, next) {
        if (!req.body.payer_id || !req.body.receivables_id || !req.body.order_id || !req.body.amount || !req.body.payProducts || !req.body.order_type || !req.body.role||!req.body.pay_method||!req.body.receivables_company_id) {
            return next('invalid_format');
        }
        var date = new Date();
        var orderNo = lib_pay_carrynow.dateByOrder(date);
        var result = {};
        async.waterfall([
            function (cb) {
                //获取用户余额
                lib_pay_surplus.getOne({find: {pay_id: req.body.payer_id}}, cb);
            },
            function (data, cb) {
                if (!data) {
                    var obj = {};
                    obj.pay_id = req.body.payer_id;
                    obj.role = req.body.role;
                    obj.pay_surplus_amount = 0;
                    obj.time_update = new Date();
                    lib_pay_surplus.add(obj, function (err, content, cont) {
                        if (err) {
                            console.log('err', err);
                        }
                        cb('余额不足，请先充值');
                    })
                } else {
                    var amount = config_common.rscDecimal('sub', data.pay_surplus_amount, req.body.amount,2);
                    if (amount >= 0) {
                        cb(null);
                    } else {
                        cb('余额不足，请先充值');
                    }
                }
            },
            function (cb) {
                lib_pay_surplus.getOne({find: {pay_id: req.body.payer_id}}, cb);
            },
            function (data, cb) {
                var price_sub = config_common.rscDecimal('sub', data.pay_surplus_amount, req.body.amount,2);
                lib_pay_surplus.update({
                    find: {pay_id: req.body.payer_id},
                    set: {pay_surplus_amount: price_sub, time_update: date}
                }, cb)
            },
            function (data,cb) {
                result = {
                    payer_id: req.body.payer_id,
                    receivables_id: req.body.receivables_id,
                    receivables_company_id:req.body.receivables_company_id,
                    orderNo: orderNo,
                    order_id: req.body.order_id,
                    order_type: req.body.order_type,
                    amount: req.body.amount,
                    pay_method:req.body.pay_method,
                    payProducts: req.body.payProducts,
                    trade_status: 'effective',
                };
                lib_pay_informationorder.add(result, function (err, content, cont) {
                    if (err) {
                        console.log('err', err);
                    }
                    cb(null);
                })
            },
            function (cb) {
                lib_pay_informationorder.getOne({find: {orderNo: orderNo}}, cb);
            },
            function (data, cb) {
                lib_pay_aggregate.add({
                    PID: data._id,
                    user_id: data.payer_id,
                    orderNo: data.orderNo,
                    source: 'information_expenditure'
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
     * 缴纳添加信息费
     */
    api.post('/pay_information_recharge', function (req, res, next) {
        if (!req.body.orderNo || !req.body.receivablesProducts || !req.body.role) {
            return next('invalid_format');
        }
        var date = new Date();
        var result = {};
        var informationorder = {};
        async.waterfall([
            function (cb) {
                lib_pay_informationorder.getOne({find: {orderNo: req.body.orderNo}}, cb);
            },
            function (data, cb) {
                informationorder = data;
                lib_pay_surplus.getOne({find: {pay_id: informationorder.receivables_id}}, cb);
            },
            function (data, cb) {
                if (!data) {
                    var obj = {};
                    obj.pay_id = informationorder.receivables_id;
                    obj.role = req.body.role;
                    obj.pay_surplus_amount = 0;
                    obj.time_update = new Date();
                    lib_pay_surplus.add(obj, function (err, content, cont) {
                        if (err) {
                            console.log('err', err);
                        }
                        cb(null);
                    })
                } else {
                    cb(null);
                }
            },
            function (cb) {
                //获取用户余额
                lib_pay_surplus.getOne({find: {pay_id: informationorder.receivables_id}}, cb);
            },
            function (data, cb) {
                var price_add = config_common.rscDecimal('add', data.pay_surplus_amount, informationorder.amount,2);
                lib_pay_surplus.update({
                    find: {pay_id: informationorder.receivables_id},
                    set: {pay_surplus_amount: price_add, time_update: date}
                }, cb)
            },
            function (data,cb) {
                lib_pay_informationorder.update({
                    find: {orderNo: req.body.orderNo},
                    set: {
                        receivablesProducts: req.body.receivablesProducts,
                        trade_status: 'complete',
                        time_update: date
                    }
                }, cb)
            },
            function (data,cb) {
                lib_pay_informationorder.getOne({find: {orderNo: req.body.orderNo}}, cb);
            },
            function (data, cb) {
                result = data;
                lib_pay_aggregate.add({
                    PID: result._id,
                    user_id: result.receivables_id,
                    orderNo: result.orderNo,
                    company_id:data.receivables_company_id,
                    source: 'information_income'
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
     * 信息费原路退回
     */
    api.post('/pay_information_refund', function (req, res, next) {
        if (!req.body.orderNo || !req.body.receivablesProducts || !req.body.role) {
            return next('invalid_format');
        }
        var date = new Date();
        var result = {};
        var informationorder = {};
        async.waterfall([
            function (cb) {
                lib_pay_informationorder.getOne({find: {orderNo: req.body.orderNo}}, cb);
            },
            function (data, cb) {
                informationorder = data;
                lib_pay_surplus.getOne({find: {pay_id: informationorder.payer_id}}, cb);
            },
            function (data, cb) {
                if (!data) {
                    var obj = {};
                    obj.pay_id = informationorder.payer_id;
                    obj.role = req.body.role;
                    obj.pay_surplus_amount = 0;
                    obj.time_update = new Date();
                    lib_pay_surplus.add(obj, function (err, content, cont) {
                        if (err) {
                            console.log('err', err);
                        }
                        cb(null);
                    })
                } else {
                    cb(null);
                }
            },
            function (cb) {
                //获取用户余额
                lib_pay_surplus.getOne({find: {pay_id: informationorder.payer_id}}, cb);
            },
            function (data, cb) {
                var price_add = config_common.rscDecimal('add', data.pay_surplus_amount, informationorder.amount,2);
                lib_pay_surplus.update({
                    find: {pay_id: informationorder.payer_id},
                    set: {pay_surplus_amount: price_add, time_update: date}
                }, cb)
            },
            function (data,cb) {
                lib_pay_informationorder.update({
                    find: {orderNo: req.body.orderNo},
                    set: {
                        receivablesProducts: req.body.receivablesProducts,
                        trade_status: 'cancelled',
                        time_update: date
                    }
                }, cb)
            },
            function (data,cb) {
                lib_pay_informationorder.getOne({find: {orderNo: req.body.orderNo}}, cb);
            },
            function (data, cb) {
                result = data;
                lib_pay_aggregate.update({
                    PID: result._id,
                    user_id: result.payer_id,
                    source: 'information_refund'
                }, cb)
            }

        ], function (err) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, result, next);
        })

    });
    return api;
};

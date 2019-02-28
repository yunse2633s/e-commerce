/**
 * Created by Administrator on 2016/11/7.
 */
var async = require('async');
var _ = require('underscore');

var express = require('express');
var crypto = require('crypto');
var https = require('https');
var qs = require('querystring');
var fs = require('fs');
var http = require('../../libs/http');
var config_common = require('../../configs/config_common');
var lib_pay_order = require('../../libs/lib_pay_order');
var lib_pay_surplus = require('../../libs/lib_pay_surplus');
var lib_pay_carrynow = require('../../libs/lib_pay_carrynow');


module.exports = function () {
    var api = express.Router();
    /**
     * 前端重定向页面，签名，验签
     */
    api.post('/pay_page_redirection', function (req, res, next) {
        var create = lib_pay_order.createSignWowUnicom(req.body);
        var result = lib_pay_order.checkSignWowUnicom(req.body);
        res.redirect('http://credit.e-wto.com/#/rsc/paySuccess/');
        if (result) {
            res.end('success');
        } else {
            res.end('faild');
        }

    });
    /**
     * 支付成功
     */
    api.post('/pay_order_success', function (req, res, next) {
        if (!req.body) {
            return next('invalid_format');
        }
        var result;
        var alipay;
        async.waterfall([
            function (cb) {
                // console.log('支付宝成功回调-----------------------',req.body);
                result = lib_pay_order.checkSignWowUnicom(req.body);
                // console.log('验证结果order',result);
                if (result) {
                    cb();
                } else {
                    res.end('faild');
                }
            },
            function (cb) {
                lib_pay_order.getOne({
                    find: {orderNo: req.body.orderNo}
                }, cb)
            },
            function (order, cb) {

                if (!order) {
                    cb();
                }
                alipay = order;
                lib_pay_order.update({
                    find: {orderNo: req.body.orderNo},
                    set: {amount: req.body.amount, trade_status: req.body.trade_status}
                }, cb)
            }
        ], function (err) {
            if (err) {
                console.log('err', err);
            }

            console.log('end')


            res.end('success');
        })
    });
    api.use(require('../../middlewares/mid_verify_user')());

    api.post('/get_one', function (req, res, next) {
        if (!req.body.orderNo) {
            return next('invalid_format');
        }
        var cond = {
            orderNo: req.body.orderNo
        };
        lib_pay_order.getOne({find: cond}, function (err, result) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, result, next);
        });
    });
    /**
     * 支付
     */
    api.post('/pay_order_price', function (req, res, next) {
        if (!req.body.amount || !req.body.pay_method || !req.body.pay_surplus) {
            return next('invalid_format');
        }
        var data = new Date();
        var orderNo = lib_pay_order.dateByOrder(data);
        var parmas = lib_pay_order.getParams(req.body.pay_method, req.body);
        var result = {
            order: '',
            orderNo: orderNo
        };
        async.waterfall([
            function (cb) {
                result.order = lib_pay_order.getSignType(req.body.pay_method, parmas);
                cb(null);
            },
            function (cb) {
                lib_pay_order.add({
                    payer_id: req.decoded.id,//付款方
                    receivables_id: parmas.receivables_id,//收款方
                    interfaceVersion: parmas.interfaceVersion,
                    tranType: parmas.tranType,
                    merNo: parmas.merNo,
                    goodsName: parmas.goodsName,
                    orderDate: parmas.orderDate,
                    orderNo: orderNo,//商户订单号
                    amount: req.body.amount, //价格
                    charSet: parmas.charSet,
                    payProducts: parmas.payProducts,
                    tradeMode: parmas.tradeMode,
                    reqTime: parmas.reqTime,
                    respMode: parmas.respMode,
                    callbackUrl: parmas.callbackUrl,
                    signType: parmas.signType,
                    serverCallUrl: parmas.serverCallUrl,
                    trade_status: 'ineffective',
                    pay_method: req.body.pay_method,  //类型:支付宝，微信，wow联通  Alipay、WeChat、WowUnicom
                    pay_surplus: req.body.pay_surplus, //充值/提现/订单  recharge/withdrawals/order
                }, cb)
            }
        ], function (err) {
            if (err) {
                console.log('err', err);
            }
            config_common.sendData(req, result, next);
        })

    });
    /**
     * 获取订单记录
     */
    api.post('/get_pay_list', function (req, res, next) {
        if (!req.decoded.id) {
            return next('invalid_format');
        }
        var result;
        async.waterfall([
            function (cb) {
                console.log('id', req.decoded.id)
                //获取充值列表
                lib_pay_order.getList({
                    find: {
                        payer_id: req.decoded.id,
                        trade_status: 'TRADE_SUCCESS',
                        pay_method: 'WowUnicom'
                    }
                }, cb);
            },
            function (data, cb) {
                result = data;
                cb();
            }
        ], function (err) {
            if (err) {
                console.log('err', err);
            }
            config_common.sendData(req, result, next);
        })
    });

    return api;

};
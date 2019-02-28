/**
 * Created by Administrator on 2016/11/7.
 */
var async = require('async');
var _ = require('underscore');

var randomstring = require("randomstring");//获取随机数
var express = require('express');
var crypto = require('crypto');
var https = require('https');
var request = require('request');
var qs = require('querystring');
var fs = require('fs');
var http = require('../../libs/http');
var config_api_url = require('../../configs/config_api_url');
var config_common = require('../../configs/config_common');
var lib_pay_recharge = require('../../libs/lib_pay_recharge');
var lib_pay_surplus = require('../../libs/lib_pay_surplus');
var lib_pay_carrynow = require('../../libs/lib_pay_carrynow');
var lib_pay_aggregate = require('../../libs/lib_pay_aggregate');
var lib_pay_informationorder = require('../../libs/lib_pay_InformationOrder');

module.exports = function () {
    var api = express.Router();
    //注意：这三个接口在更新正式服的时候要调用一下。
    /**
     * 充值表新增service_charge字段
     */
    api.post('/update_recharge_table', function (req, res, next) {
        async.waterfall([
            function (cb) {
                lib_pay_recharge.getList({
                    find: {}
                }, cb)
            },
            function (recharge, cb) {
                async.eachSeries(recharge, function (data, cbk) {
                    //支付宝充值服务费
                    if (data.pay_method === 'Alipay') {
                        data.service_charge = config_common.rscDecimal('mul', data.total_amount, 0.0055, 2);
                    } else {
                        data.service_charge = config_common.rscDecimal('mul', data.total_amount, 0.01, 2);
                    }
                    //此处使用update方法无效
                    data.save(cbk);
                }, cb);
            }
        ], function (err) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, {}, next);
        })
    })
    /**
     * 提现表新增company_id、service_charge字段
     */
    api.post('/update_carry_table', function (req, res, next) {
        async.waterfall([
            function (cb) {
                lib_pay_carrynow.getList({
                    find: {}
                }, cb)
            },
            function (carry, cb) {
                async.eachSeries(carry, function (data, cbk) {
                    async.waterfall([
                        function (cb2) {
                            http.sendUserServer({
                                method: 'getOne',
                                cond: {find: {_id: data.carry_id}},
                                model: 'User_traffic'
                            }, global.config_api_url.user_server_common, cb2);
                        },
                        function (company, cb2) {
                            var service_charge = 0;
                            if (!company) {
                                return cb2('没有该公司信息')
                            }
                            if (!data.company_id) {
                                //支付宝充值服务费
                                lib_pay_carrynow.update({
                                    find: {out_biz_no: data.out_biz_no},
                                    set: {
                                        service_charge: service_charge,//服务费
                                        company_id: company.company_id[0]
                                    }
                                }, cb2);
                            } else {
                                cb2();
                            }

                        }
                    ], cbk)
                }, cb);
            }
        ], function (err) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, {}, next);
        })
    })
    /**
     * PayInformationOrder字段新增receivables_company_id字段
     */
    api.post('/update_information_table', function (req, res, next) {
        async.waterfall([
            function (cb) {
                lib_pay_informationorder.getList({
                    find: {}
                }, cb)
            },
            function (information, cb) {
                async.eachSeries(information, function (data, cbk) {
                    async.waterfall([
                        function (cb2) {
                            http.sendUserServer({
                                method: 'getOne',
                                cond: {find: {_id: data.receivables_id}},
                                model: 'User_traffic'
                            }, global.config_api_url.user_server_common, cb2);
                        },
                        function (company, cb2) {
                            var service_charge = 0;
                            if (!company) {
                                return cb2('没有该公司信息')
                            }
                            if (!data.receivables_company_id) {
                                //支付宝充值服务费
                                lib_pay_informationorder.update({
                                    find: {orderNo: data.orderNo},
                                    set: {
                                        // service_charge: service_charge,//服务费
                                        receivables_company_id: company.company_id[0]
                                    }
                                }, cb2);
                            } else {
                                cb2();
                            }

                        }
                    ], cbk)
                }, cb);
            }
        ], function (err) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, {}, next);
        })
    })

    /**
     * 整合表新增company_id
     */
    api.post('/update_aggregate_table', function (req, res, next) {
        async.waterfall([
            function (cb) {
                lib_pay_aggregate.getList({
                    find: {source: {$in: ['withdrawals', 'information_income']}}
                }, cb)
            },
            function (information, cb) {
                async.eachSeries(information, function (data, cbk) {
                    async.waterfall([
                        function (cb2) {
                            http.sendUserServer({
                                method: 'getOne',
                                cond: {find: {_id: data.user_id}},
                                model: 'User_traffic'
                            }, global.config_api_url.user_server_common, cb2);
                        },
                        function (company, cb2) {
                            var service_charge = 0;
                            if (!company) {
                                return cb2('没有该公司信息')
                            }
                            //支付宝充值服务费
                            if (!data.company_id) {
                                lib_pay_aggregate.update({
                                    find: {orderNo: data.orderNo},
                                    set: {
                                        // service_charge: service_charge,//服务费
                                        company_id: company.company_id[0]
                                    }
                                }, cb2);
                            } else {
                                cb2();
                            }

                        }
                    ], cbk)
                }, cb);
            }
        ], function (err) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, {}, next);
        })
    })
    /**
     * 支付成功
     */
    api.post('/pay_price_success', function (req, res, next) {
        if (!req.body) {
            return next('invalid_format');
        }
        // req.body = {
        //     "gmt_create": "2018-01-27 14:14:16",
        //     "charset": "utf-8",
        //     "seller_email": "dev@stark.tm",
        //     "subject": "1",
        //     "sign": "FqWEWO6calgz/RYxaUxL4qETmrCW7HUHRgQGNDl7SKagKcDgMnxFo1SazMaxG5aQsDRlS+l5Hapcp1SUpZr35TN4owrVWjYe6ej8+cQL6Zg3xxNPkbOc5I3W0Sc94NenGoR1saMeouXKh/XvFKHHHymv9ifcyIV3yNTMhRxf+r4XZB6wJuh4ggWz1aVm8cDg0t2+TmXB2RuEtkxOncn6KoW+EQRa20VoLd5Sh5uccbq5S0HaKACV+otPo46I/V+dd2IGZRX845elHTET72YthyNg48qPzY0K++QETX5R6I6Ga+s2nHn3rd9qDlhNkBgjBQiKkdNDUk/aAR+tdTvMHg==",
        //     "body": "我是测试数据",
        //     "buyer_id": "2088912113655368",
        //     "invoice_amount": "0.01",
        //     "notify_id": "d641e41d5e7c7ee804fde927bf69be0is2",
        //     "fund_bill_list": "[{\"amount\":\"0.01\",\"fundChannel\":\"ALIPAYACCOUNT\"}]",
        //     "notify_type": "trade_status_sync",
        //     "trade_status": "TRADE_SUCCESS",
        //     "receipt_amount": "0.01",
        //     "app_id": "2018012502069441",
        //     "buyer_pay_amount": "0.01",
        //     "sign_type": "RSA2",
        //     "seller_id": "2088921709578378",
        //     "gmt_payment": "2018-01-27 14:14:16",
        //     "notify_time": "2018-01-27 14:14:17",
        //     "version": "1.0",
        //     "out_trade_no": "20180307095207334",
        //     "total_amount": "0.01",
        //     "trade_no": "2018012721001004360200069353",
        //     "auth_app_id": "2018012502069441",
        //     "buyer_logon_id": "138****1691",
        //     "point_amount": "0.00"
        // };
        var result;
        var alipay;
        var informationorder;
        var callback_info = {};
        callback_info = req.body;
        var date = new Date();
        // console.log('支付宝成功回调-----------------------', req.body);
        async.waterfall([
            function (cb) {
                lib_pay_informationorder.getOne({
                    find: {orderNo: req.body.out_trade_no}
                }, cb)
            },
            function (info, cb) {
                informationorder = info;
                lib_pay_recharge.getOne({
                    find: {out_trade_no: req.body.out_trade_no}
                }, cb)
            },
            function (order, cb) {
                if (!order && !informationorder) {
                    cb(null, null);
                }
                alipay = order;
                if (informationorder) {
                    result = lib_pay_recharge.checkSignAlipay(req.body, informationorder.packageName);
                } else {
                    result = lib_pay_recharge.checkSignAlipay(req.body, alipay.packageName);
                }
                // console.log('验证结果',result);
                if (result && ((alipay && alipay.trade_status !== 'TRADE_SUCCESS') || (informationorder && informationorder.trade_status !== 'complete'))) {
                    //支付宝充值服务费
                    var service_charge = config_common.rscDecimal('mul', req.body.total_amount, 0.0055, 2);
                    if (informationorder && informationorder.payProducts === 'information_expenditure') {
                        lib_pay_informationorder.update({
                            find: {orderNo: req.body.out_trade_no},
                            set: {
                                receivablesProducts: 'information_income',
                                trade_status: 'complete',
                                time_update: date
                            }
                        }, cb)
                    } else {
                        lib_pay_recharge.update({
                            find: {out_trade_no: req.body.out_trade_no},
                            set: {
                                total_amount: req.body.total_amount,
                                trade_status: req.body.trade_status,
                                service_charge: service_charge,
                                callback_info: callback_info
                            }
                        }, cb)
                    }
                } else {
                    res.end('faild');
                }
            },
            function (data, cb) {
                if (!alipay) {
                    cb(null, null);
                } else {
                    //查询余额
                    lib_pay_surplus.getOne({
                        find: {pay_id: alipay.pay_id}
                    }, cb)

                }
            },
            function (data, cb) {
                if (alipay && data) {
                    var pay_surplus_amount = config_common.rscDecimal('add', data.pay_surplus_amount, req.body.total_amount, 2);
                    lib_pay_surplus.update({
                        find: {pay_id: alipay.pay_id},
                        set: {pay_surplus_amount: pay_surplus_amount}
                    }, cb)
                } else {
                    cb(null, null);
                }

            },
            function (data, cb) {
                if (informationorder && informationorder.payProducts === 'information_expenditure') {
                    lib_pay_aggregate.add({
                        PID: informationorder._id,
                        user_id: informationorder.receivables_id,
                        orderNo: informationorder.orderNo,
                        company_id: informationorder.receivables_company_id,
                        source: 'information_income'
                    }, cb)
                } else {
                    lib_pay_aggregate.add({
                        PID: alipay._id,
                        user_id: alipay.pay_id,
                        orderNo: alipay.out_trade_no,
                        source: 'recharge'
                    }, cb)
                }
            },
            function (content, cont, cb) {
                if (informationorder && informationorder.payProducts === 'information_expenditure') {
                    http.sendTrafficServer({
                        order_id: informationorder.order_id,
                        price: informationorder.amount,
                        orderNo: informationorder.orderNo,
                    }, config_api_url.traffic_server_pay, function (err, result) {
                        if (err) {
                            cb(err);
                        } else {
                            cb();
                        }
                    });
                } else {
                    cb();
                }
            }
        ], function (err) {
            if (err) {
                return next(err);
            }
            res.end('success');
        })
    });

    /**
     * 微信支付成功回调
     */
    api.post('/pay_weixin_success', function (req, res, next) {
        if (!req.body) {
            return next('invalid_format');
        }
        // var msg = { appid: 'wx7b4d8cfdcab2ef5e',
        //     bank_type: 'CFT',
        //     cash_fee: '1',
        //     fee_type: 'CNY',
        //     is_subscribe: 'N',
        //     mch_id: '1497860742',
        //     nonce_str: 'trI37XVj0cSxijQzGY9Rs7KRIDZUIa',
        //     openid: 'ovh3k0j1Sq1SDRtcqBoF88vNlhhk',
        //     out_trade_no: '20180308113807729',
        //     result_code: 'SUCCESS',
        //     return_code: 'SUCCESS',
        //     sign: 'C08AC1C106E37558E3246E452791E27D',
        //     time_end: '20180308113813',
        //     total_fee: '1',
        //     trade_type: 'APP',
        //     transaction_id: '4200000093201803084729470355' }
        var call_xml;
        var informationorder;
        var call_obj = {};
        var alipay = {};
        var sign_one;
        var result = false;
        var amount_result = 0;
        var date = new Date();
        async.waterfall([
            function (cb) {
                lib_pay_recharge.getRawBody(req, function (a, data) {
                    call_xml = data;
                    call_obj = lib_pay_recharge.getXMLNodeValue(data);
                    // console.log('微信成功回调-----------------------', call_obj);
                    amount_result = config_common.rscDecimal('div', call_obj.total_fee, 100, 2);
                    if (call_obj.result_code !== 'SUCCESS') {
                        cb('支付失败')
                    } else {
                        cb();
                    }
                });
            },
            function (cb) {
                lib_pay_informationorder.getOne({
                    find: {orderNo: call_obj.out_trade_no}
                }, cb)
            },
            function (info, cb) {
                informationorder = info;
                lib_pay_recharge.getOne({
                    find: {out_trade_no: call_obj.out_trade_no}
                }, cb)
            },
            function (order, cb) {
                if (!order && !informationorder) {
                    cb(null, '订单未找到');
                }
                alipay = order;
                if ((alipay && alipay.trade_status === 'SUCCESS') || (informationorder && informationorder.trade_status === 'complete')) {
                    res.end('success');
                }
                //签名
                sign_one = lib_pay_recharge.paysignApp(call_obj, 'callback');
                if (sign_one === call_obj.sign) {
                    result = true;
                }
                // console.log('验证结果', result);
                if (result) {
                    //微信充值服务费
                    var service_charge = config_common.rscDecimal('mul', amount_result, 0.01, 2);
                    if (informationorder && informationorder.payProducts === 'information_expenditure') {
                        lib_pay_informationorder.update({
                            find: {orderNo: call_obj.out_trade_no},
                            set: {
                                receivablesProducts: 'information_income',
                                trade_status: 'complete',
                                time_update: date
                            }
                        }, cb)
                    } else {
                        lib_pay_recharge.update({
                            find: {out_trade_no: call_obj.out_trade_no},
                            set: {
                                total_amount: amount_result,
                                trade_status: 'TRADE_SUCCESS',
                                service_charge: service_charge,
                                callback_info: call_obj
                            }
                        }, cb)
                    }
                } else {
                    res.end('faild');
                }
            },
            function (data, cb) {
                if (!alipay) {
                    cb(null, null);
                } else {
                    //查询余额
                    lib_pay_surplus.getOne({
                        find: {pay_id: alipay.pay_id}
                    }, cb)

                }
            },
            function (data, cb) {
                if (alipay && data) {
                    var pay_surplus_amount = config_common.rscDecimal('add', data.pay_surplus_amount, amount_result, 2);
                    lib_pay_surplus.update({
                        find: {pay_id: alipay.pay_id},
                        set: {pay_surplus_amount: pay_surplus_amount}
                    }, cb)
                } else {
                    cb(null, null);
                }
            },
            function (data, cb) {
                if (informationorder && informationorder.payProducts === 'information_expenditure') {
                    lib_pay_aggregate.add({
                        PID: informationorder._id,
                        user_id: informationorder.receivables_id,
                        orderNo: informationorder.orderNo,
                        company_id: informationorder.receivables_company_id,
                        source: 'information_income'
                    }, cb)
                } else {
                    lib_pay_aggregate.add({
                        PID: alipay._id,
                        user_id: alipay.pay_id,
                        orderNo: alipay.out_trade_no,
                        source: 'recharge'
                    }, cb)
                }
            },
            function (content, cont, cb) {
                if (informationorder && informationorder.payProducts === 'information_expenditure') {
                    http.sendTrafficServer({
                        order_id: informationorder.order_id,
                        price: informationorder.amount,
                        orderNo: informationorder.orderNo,
                    }, config_api_url.traffic_server_pay, function (err, result) {
                        if (err) {
                            cb(err);
                        } else {
                            cb();
                        }
                    });
                } else {
                    cb();
                }
            }
        ], function (err) {
            if (err) {
                return next(err);
            }
            res.end('success');
        })
    });
    api.use(require('../../middlewares/mid_verify_user')());
    /**
     * 获取充值详情
     */
    api.post('/get_one', function (req, res, next) {
        if (!req.body.out_trade_no) {
            return next('invalid_format');
        }
        var cond = {
            out_trade_no: req.body.out_trade_no
        };
        var result = {};
        async.waterfall([
            function (cb) {
                lib_pay_recharge.getOne({find: cond}, cb);
            },
            function (data, cb) {
                if (!data) {
                    lib_pay_informationorder.getOne({find: {orderNo: req.body.out_trade_no}}, cb);
                } else {
                    result = data;
                    cb(null, null);
                }
            },
            function (data, cb) {
                if (data) {
                    result = data;
                }
                cb();
            }
        ], function (err) {
            if (err) {
                return next(err);
            }
            ;
            config_common.sendData(req, result, next);
        });
    });

    /**
     * 支付
     * total_amount 钱数
     * pay_method 支付宝，微信 Alipay、WeChat
     * pay_surplus 提现/充值
     * packageName 包名
     */
    api.post('/pay_price', function (req, res, next) {
        if (!req.body.total_amount || !req.body.pay_method || !req.body.pay_surplus || !req.body.packageName) {
            return next('invalid_format');
        }
        var parmas = lib_pay_recharge.getParams(req.body.pay_method, req.body);
        var out_trade_no = parmas.biz_content.out_trade_no;
        var timeout_express = parmas.biz_content.timeout_express;
        var result = {
            order: '',
            out_trade_no: parmas.biz_content.out_trade_no
        };
        async.waterfall([
            function (cb) {
                result.order = lib_pay_recharge.getSignType(req.body.pay_method, parmas);
                cb(null);
            },
            function (cb) {
                lib_pay_recharge.add({
                    app_id: parmas.app_id,
                    out_trade_no: out_trade_no,
                    total_amount: req.body.total_amount,
                    trade_status: 'effective',
                    subject: '司机中心充值',
                    pay_id: req.decoded.id,
                    company_id: '',
                    packageName: req.body.packageName,
                    timeout_express: timeout_express,
                    pay_method: req.body.pay_method,  //类型:支付宝，微信
                    pay_surplus: req.body.pay_surplus //充值/提现
                }, cb);
            }
            // function (conent,count,cb) {
            //     lib_pay_recharge.getOne({find: {out_trade_no: out_trade_no}}, cb);
            // },
            // function (data, cb) {
            //     lib_pay_aggregate.add({
            //         PID: data._id,
            //         user_id: data.pay_id,
            //         orderNo: data.out_trade_no,
            //         source: 'recharge'
            //     }, cb)
            // }
        ], function (err) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, result, next);
        })

    });
    /**
     * 获取余额
     */
    api.post('/get_surplus', function (req, res, next) {
        if (!req.decoded.id) {
            return next('invalid_format');
        }
        var result;
        async.waterfall([
            function (cb) {
                //获取用户余额
                lib_pay_surplus.getOne({find: {pay_id: req.decoded.id}}, cb);
            },
            function (data, cb) {
                if (!data) {
                    var obj = {};
                    obj.pay_id = req.decoded.id;
                    obj.role = req.decoded.role;
                    obj.pay_surplus_amount = "0";
                    obj.time_update = new Date();
                    lib_pay_surplus.add(obj, function (err, content, cont) {
                        if (err) {
                            console.log('err', err);
                        }
                    }, cb)
                } else {
                    cb();
                }
            },
            function (cb) {
                lib_pay_surplus.getOne({find: {pay_id: req.decoded.id}}, cb);
            },
            function (data, cb) {
                var data_new = JSON.parse(JSON.stringify(data));
                data_new.pay_surplus_amount = config_common.rscDecimal('add', 0, data.pay_surplus_amount, 2);
                result = data_new;
                cb();
            }
        ], function (err) {
            if (err) {
                return next(err);
            }

            config_common.sendData(req, result, next);
        })
    });
    /**
     * 初始化余额
     */
    // api.post('/get_surplus_init', function (req, res, next) {
    //     async.waterfall([
    //         function (cb3) {
    //             global.http.sendUserServer({
    //                 method: 'getList',
    //                 cond: {find:{}},
    //                 model: 'User_trade'
    //             }, global.config_api_url.user_server_common, cb3);
    //         },
    //         function (data,cb3) {
    //             if(data.length > 0){
    //                 for(var i  = 0; i < data.length; i++){
    //                     var obj1 = {};
    //                     obj1.pay_id = data[i]._id;
    //                     obj1.role = data[i].role;
    //                     obj1.pay_surplus_amount = 0;
    //                     obj1.time_update = new Date();
    //                     lib_pay_surplus.add(obj1,function (err,content,cont) {
    //                         if (err) {
    //                             console.log('err', err);
    //                         }
    //                     })
    //                 }
    //
    //             }
    //             global.http.sendUserServer({
    //                 method: 'getList',
    //                 cond: {find: {}},
    //                 model: 'User_traffic'
    //             }, global.config_api_url.user_server_common, cb3);
    //         },
    //         function (data,cb3) {
    //             if(data.length > 0 ){
    //                 for(var i  = 0; i < data.length; i++){
    //                     var obj3 = {};
    //                     obj3.pay_id = data[i]._id;
    //                     obj3.role = data[i].role;
    //                     obj3.pay_surplus_amount = 0;
    //                     obj3.time_update = new Date();
    //                     lib_pay_surplus.add(obj3,function (err,content,cont) {
    //                         if (err) {
    //                             console.log('err', err);
    //                         }
    //                     })
    //                 }
    //             }
    //             cb3();
    //         }
    //     ], function (err) {
    //         if (err) {
    //             console.log('err', err);
    //         }
    //         config_common.sendData(req, {}, next);
    //     })
    // });
    /**
     * 提现
     */
    api.post('/pay_price_carry', function (req, res, next) {
        if (!req.body.amount || !req.body.pay_method || !req.body.pay_surplus || !req.body.payee_account || !req.body.packageName || !req.body.payee_real_name) {
            return next('invalid_format');
        }
        if (req.body.amount && req.body.amount < 0.1) {
            return next('EXCEED_LIMIT_SM_MIN_AMOUNT');
        }
        var parmas_init = lib_pay_carrynow.getParams(req.body.pay_method, req.body);
        var parmas = lib_pay_carrynow.getParams(req.body.pay_method, req.body);
        var today = new Date();
        var result = {};
        var amount = 0;
        var obj_carry = {};
        async.waterfall([
            function (cb) {
                //获取用户余额
                lib_pay_surplus.getOne({find: {pay_id: req.decoded.id}}, cb);
            },
            function (data, cb) {
                if (!data) {
                    var obj = {};
                    obj.pay_id = req.decoded.id;
                    obj.role = req.decoded.role;
                    obj.pay_surplus_amount = 0;
                    obj.time_update = new Date();
                    lib_pay_surplus.add(obj, function (err, content, cont) {
                        if (err) {
                            console.log('err', err);
                        }
                        cb('NOT_ENOUGH');
                    })
                } else {
                    amount = config_common.rscDecimal('sub', data.pay_surplus_amount, req.body.amount, 2);
                    var amount_new = config_common.rscDecimal('sub', req.body.amount, data.pay_surplus_amount, 2);
                    if (amount >= 0) {
                        cb(null);
                    } else if (amount_new > 0) {
                        cb('NOT_ENOUGH');
                    } else {
                        cb('unknown');
                    }
                }
            },
            function (cb) {
                obj_carry.order = lib_pay_carrynow.getSignType(req.body.pay_method, parmas);
                request({
                    url: 'https://openapi.alipay.com/gateway.do?' + obj_carry.order,
                    method: 'get',
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                }, cb);
            },
            function (response, request, cb) {
                //真实数据
                obj_carry = {
                    app_id: '2018012502069877',
                    out_biz_no: parmas_init.biz_content.out_biz_no,
                    amount: req.body.amount,
                    trade_status: 'TRADE_SUCCESS',
                    carry_id: req.decoded.id,
                    company_id: req.decoded.company_id,
                    packageName: req.body.packageName,
                    payer_show_name: parmas_init.biz_content.payer_show_name,
                    payee_real_name: parmas_init.biz_content.payee_real_name,
                    remark: parmas_init.biz_content.remark,
                    payee_account: parmas_init.biz_content.payee_account,
                    pay_method: req.body.pay_method,  //类型:支付宝，微信
                    pay_surplus: req.body.pay_surplus, //充值/提现
                    callback_info: request //回调
                }
                var callback_info = JSON.parse(request);
                if (callback_info.alipay_fund_trans_toaccount_transfer_response.code === '10000') {
                    lib_pay_carrynow.add(obj_carry, function (err, content, cont) {
                        if (err) {
                            console.log('err', err);
                        }
                        cb(null);
                    });
                } else {
                    var sub_code = callback_info.alipay_fund_trans_toaccount_transfer_response.sub_code;
                    obj_carry.trade_status = 'ineffective';
                    lib_pay_carrynow.add(obj_carry, function (err, content, cont) {
                        if (err) {
                            console.log('err', err);
                        }
                    });
                    if (sub_code === 'PAYER_BALANCE_NOT_ENOUGH') {
                        http.sendMsgServerSMS(req, 'regular', {
                            template_id: 'custom',
                            content: ['北京日升昌记科技有限公司支付宝账号余额不足，请及时充值'],
                            phone_list: ['15911012453']
                        }, function (err, data) {
                            if (err) {
                                return next(err);
                            }
                        });
                    }
                    return cb(sub_code);
                }
                //测试数据
                // obj_carry = {
                //     app_id: '2018012502069877',
                //     out_biz_no: parmas_init.biz_content.out_biz_no,
                //     amount: req.body.amount,
                //     trade_status: 'TRADE_SUCCESS',
                //     carry_id: req.decoded.id,
                //     packageName: req.body.packageName,
                //     payer_show_name: parmas_init.biz_content.payer_show_name,
                //     payee_real_name: parmas_init.biz_content.payee_real_name,
                //     remark: parmas_init.biz_content.remark,
                //     payee_account: parmas_init.biz_content.payee_account,
                //     pay_method: req.body.pay_method,  //类型:支付宝，微信
                //     pay_surplus: req.body.pay_surplus, //充值/提现
                //     callback_info: {} //回调
                // }
                // lib_pay_carrynow.add(obj_carry, function (err, content, cont) {
                //     if (err) {
                //         console.log('err', err);
                //     }
                //     cb(null);
                // });
            },
            function (cb) {
                lib_pay_carrynow.getOne({find: {out_biz_no: parmas_init.biz_content.out_biz_no}}, cb);
            },
            function (data, cb) {
                result = data;
                lib_pay_aggregate.add({
                    PID: data._id,
                    user_id: data.carry_id,
                    orderNo: data.out_biz_no,
                    source: 'withdrawals'
                }, cb)
            },
            function (content, count, cb) {
                lib_pay_surplus.update({
                    find: {pay_id: req.decoded.id},
                    set: {pay_surplus_amount: amount, time_update: today}
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
     * 获取充值记录
     */
    api.post('/get_pay_list', function (req, res, next) {
        if (!req.decoded.id) {
            return next('invalid_format');
        }
        var result;
        async.waterfall([
            function (cb) {
                //获取充值列表
                lib_pay_recharge.getList({
                    find: {
                        pay_id: req.decoded.id,
                        trade_status: 'TRADE_SUCCESS',
                        pay_method: 'Alipay'
                    }
                }, cb);
            },
            function (data, cb) {
                result = data;
                cb();
            }
        ], function (err) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, result, next);
        })
    });

    /**
     * 获取交易记录
     */
    api.post('/get_list', function (req, res, next) {
        if (!req.decoded.id) {
            return next('invalid_format');
        }
        var page = parseInt(req.body.page);
        if (!page) {
            page = 1;
        }
        var result = {
            lists: []
        };
        async.waterfall([
            function (cb) {
                //获取整合PayRecharge，PayInformationOrder，PayCarryNow的数据
                lib_pay_aggregate.getList({find: {user_id: req.decoded.id}}, cb);
            },
            function (data, cb) {
                result.count = data.length;
                result.exist = data.length > page * config_common.entry_per_page;
                //分页处理
                lib_pay_aggregate.getList({
                    find: {user_id: req.decoded.id},
                    sort: {time_creation: -1},
                    limit: config_common.entry_per_page,
                    skip: config_common.entry_per_page * (page - 1)
                }, cb);
            },
            function (data, cb) {
                //获取列表中每条记录详情
                async.eachSeries(data, function (one_data, cbk) {
                    var source = one_data.source;
                    async.waterfall([
                        function (cbk2) {
                            //提现
                            if (source === 'withdrawals') {
                                lib_pay_carrynow.getOne({find: {_id: one_data.PID}}, cbk2);
                            } else if (source === 'recharge') {
                                lib_pay_recharge.getOne({find: {_id: one_data.PID}}, cbk2);
                            } else if (source === 'information_expenditure') {
                                lib_pay_informationorder.getOne({find: {_id: one_data.PID}}, cbk2);
                            } else {
                                lib_pay_informationorder.getOne({find: {_id: one_data.PID}}, cbk2);
                            }
                        },
                        function (info, cbk2) {
                            //提现
                            if (source === 'withdrawals') {
                                result.lists.push({
                                    user_id: info.carry_id,
                                    time_creation: info.time_creation,
                                    orderNo: info.out_biz_no,
                                    amount: info.amount,
                                    pay_method: info.pay_method,
                                    pay_surplus: info.pay_surplus,
                                    remark: info.remark,
                                    trade_status: info.trade_status
                                });
                            } else if (source === 'recharge') {
                                if (info) {
                                    result.lists.push({
                                        user_id: info.pay_id,
                                        time_creation: info.time_creation,
                                        orderNo: info.out_trade_no,
                                        amount: info.total_amount,
                                        pay_method: info.pay_method,
                                        pay_surplus: info.pay_surplus,
                                        remark: info.subject,
                                        trade_status: info.trade_status
                                    });
                                }
                            } else if (source === 'information_expenditure') {
                                result.lists.push({
                                    user_id: info.payer_id,
                                    time_creation: info.time_creation,
                                    orderNo: info.orderNo,
                                    amount: info.amount,
                                    pay_method: info.pay_method,
                                    pay_surplus: info.payProducts,
                                    trade_status: info.trade_status
                                });
                            } else if (source === 'information_refund') {
                                result.lists.push({
                                    user_id: info.receivables_id,
                                    time_creation: info.time_update,
                                    orderNo: info.orderNo,
                                    amount: info.amount,
                                    pay_method: info.pay_method,
                                    pay_surplus: info.receivablesProducts,
                                    trade_status: info.trade_status
                                });
                            } else {
                                result.lists.push({
                                    user_id: info.receivables_id,
                                    time_creation: info.time_update,
                                    orderNo: info.orderNo,
                                    amount: info.amount,
                                    pay_method: info.pay_method,
                                    pay_surplus: info.receivablesProducts,
                                    trade_status: info.trade_status
                                });
                            }
                            cbk2(null);
                        }
                    ], cbk)
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
     * 获取微信充值
     */
    api.post('/pay_weixin', function (req, res, next) {
        if (!req.body.total_fee || !req.body.pay_method || !req.body.pay_surplus || !req.body.packageName || !req.body.spbill_create_ip) {
            return next('invalid_format');
        }
        var sign_two;
        var result;
        var status;
        var amount = config_common.rscDecimal('mul', req.body.total_fee, 100, 2);
        req.body.total_fee = parseFloat(amount);
        var amount_result = config_common.rscDecimal('div', req.body.total_fee, 100, 2);
        var timeStamp = Date.parse(new Date()) / 1000;
        var parmas = lib_pay_recharge.getParams(req.body.pay_method, req.body);
        //这一步是第一次签名，签名规则按照文档来，签名成功之后，编成xml格式的数据，向微信服务器发送https请求，若成功，微信服务器会返回xml格式数据，解析之后会得到预付交易会话标识prepay_id;
        var sign_one = lib_pay_recharge.paysignApp(parmas);
        console.log('sign_one', sign_one);
        var formData = "<xml>";
        formData += "<appid>" + parmas.appid + "</appid>"; //appid
        formData += "<body>" + parmas.body + "</body>";
        formData += "<mch_id>" + parmas.mch_id + "</mch_id>"; //商户号
        formData += "<nonce_str>" + parmas.nonce_str + "</nonce_str>"; //随机字符串，不长于32位。
        formData += "<notify_url>" + parmas.notify_url + "</notify_url>";
        formData += "<out_trade_no>" + parmas.out_trade_no + "</out_trade_no>";
        formData += "<spbill_create_ip>" + parmas.spbill_create_ip + "</spbill_create_ip>";
        formData += "<total_fee>" + parmas.total_fee + "</total_fee>";
        formData += "<trade_type>" + parmas.trade_type + "</trade_type>";
        formData += "<sign>" + sign_one + "</sign>";//第一次签名的sign
        formData += "</xml>";
        async.waterfall([
            function (cb) {
                request({
                    url: 'https://api.mch.weixin.qq.com/pay/unifiedorder',
                    method: 'POST',
                    body: formData
                }, cb);
            },
            function (response, data, cb) {
                status = lib_pay_recharge.getXMLNodeValue(data);
                if (status.return_code === 'SUCCESS') {
                    if (status.prepay_id) {
                        sign_two = lib_pay_recharge.paySignTwo(parmas.appid, parmas.nonce_str, 'Sign=WXPay', parmas.mch_id, status.prepay_id, timeStamp);//得到prepay再次签名
                        cb(null);
                    } else {
                        cb('err');
                    }
                } else {
                    cb('err');
                }
            },
            function (cb) {
                result = {
                    appid: parmas.appid,
                    partnerid: parmas.mch_id,
                    prepayid: status.prepay_id,
                    noncestr: parmas.nonce_str,
                    timestamp: timeStamp,
                    package: 'Sign=WXPay',
                    out_trade_no: parmas.out_trade_no,
                    sign: sign_two
                };
                lib_pay_recharge.add({
                    app_id: parmas.app_id,
                    out_trade_no: parmas.out_trade_no,
                    total_amount: amount_result,
                    trade_status: 'effective',
                    subject: '司机中心充值',
                    pay_id: req.decoded.id,
                    company_id: '',
                    packageName: req.body.packageName,
                    pay_method: req.body.pay_method,  //类型:支付宝，微信
                    pay_surplus: req.body.pay_surplus //充值/提现
                }, cb);
            }
            // function (conent,count,cb) {
            //     lib_pay_recharge.getOne({find: {out_trade_no: parmas.out_trade_no}}, cb);
            // },
            // function (data, cb) {
            //     lib_pay_aggregate.add({
            //         PID: data._id,
            //         user_id: data.pay_id,
            //         orderNo: data.out_trade_no,
            //         source: 'recharge'
            //     }, cb)
            // }
        ], function (err) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, result, next);
        })
    });

    /**
     * 新支付宝缴费接口
     */
    api.post('/pay_ali_order', function (req, res, next) {
        if (!req.body.total_amount || !req.body.pay_method || !req.body.pay_surplus || !req.body.packageName || !req.body.receivables_id || !req.body.receivables_company_id || !req.body.order_id || !req.body.order_type) {
            return next('invalid_format');
        }
        var parmas = lib_pay_recharge.getParams(req.body.pay_method, req.body);
        var out_trade_no = parmas.biz_content.out_trade_no;
        var timeout_express = parmas.biz_content.timeout_express;
        var result = {
            order: '',
            out_trade_no: parmas.biz_content.out_trade_no
        };
        async.waterfall([
            function (cb) {
                result.order = lib_pay_recharge.getSignType(req.body.pay_method, parmas);
                var infor = {
                    payer_id: req.decoded.id,
                    receivables_id: req.body.receivables_id,
                    receivables_company_id: req.body.receivables_company_id,
                    orderNo: out_trade_no,
                    order_id: req.body.order_id,
                    order_type: req.body.order_type,
                    amount: req.body.total_amount,
                    pay_method: req.body.pay_method,
                    payProducts: req.body.pay_surplus,
                    packageName: req.body.packageName,
                    trade_status: 'effective',
                };
                lib_pay_informationorder.add(infor, function (err, content, cont) {
                    if (err) {
                        console.log('err', err);
                    }
                    cb(null);
                })
            },
            function (cb) {
                lib_pay_informationorder.getOne({find: {orderNo: out_trade_no}}, cb);
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
     * 新微信缴费接口
     */
    api.post('/pay_weixin_order', function (req, res, next) {
        if (!req.body.total_fee || !req.body.pay_method || !req.body.pay_surplus || !req.body.packageName || !req.body.spbill_create_ip || !req.body.receivables_id || !req.body.receivables_company_id || !req.body.order_id || !req.body.order_type) {
            return next('invalid_format');
        }
        var sign_two;
        var result;
        var status;
        var amount = config_common.rscDecimal('mul', req.body.total_fee, 100, 2);
        req.body.total_fee = parseFloat(amount);
        var amount_result = config_common.rscDecimal('div', req.body.total_fee, 100, 2);
        var timeStamp = Date.parse(new Date()) / 1000;
        var parmas = lib_pay_recharge.getParams(req.body.pay_method, req.body);
        //这一步是第一次签名，签名规则按照文档来，签名成功之后，编成xml格式的数据，向微信服务器发送https请求，若成功，微信服务器会返回xml格式数据，解析之后会得到预付交易会话标识prepay_id;
        var sign_one = lib_pay_recharge.paysignApp(parmas);
        console.log('sign_one', sign_one);
        var formData = "<xml>";
        formData += "<appid>" + parmas.appid + "</appid>"; //appid
        formData += "<body>" + parmas.body + "</body>";
        formData += "<mch_id>" + parmas.mch_id + "</mch_id>"; //商户号
        formData += "<nonce_str>" + parmas.nonce_str + "</nonce_str>"; //随机字符串，不长于32位。
        formData += "<notify_url>" + parmas.notify_url + "</notify_url>";
        formData += "<out_trade_no>" + parmas.out_trade_no + "</out_trade_no>";
        formData += "<spbill_create_ip>" + parmas.spbill_create_ip + "</spbill_create_ip>";
        formData += "<total_fee>" + parmas.total_fee + "</total_fee>";
        formData += "<trade_type>" + parmas.trade_type + "</trade_type>";
        formData += "<sign>" + sign_one + "</sign>";//第一次签名的sign
        formData += "</xml>";
        async.waterfall([
            function (cb) {
                request({
                    url: 'https://api.mch.weixin.qq.com/pay/unifiedorder',
                    method: 'POST',
                    body: formData
                }, cb);
            },
            function (response, data, cb) {
                status = lib_pay_recharge.getXMLNodeValue(data);
                if (status.return_code === 'SUCCESS') {
                    if (status.prepay_id) {
                        sign_two = lib_pay_recharge.paySignTwo(parmas.appid, parmas.nonce_str, 'Sign=WXPay', parmas.mch_id, status.prepay_id, timeStamp);//得到prepay再次签名
                        cb(null);
                    } else {
                        cb('err');
                    }
                } else {
                    cb('err');
                }
            },
            function (cb) {
                result = {
                    appid: parmas.appid,
                    partnerid: parmas.mch_id,
                    prepayid: status.prepay_id,
                    noncestr: parmas.nonce_str,
                    timestamp: timeStamp,
                    package: 'Sign=WXPay',
                    out_trade_no: parmas.out_trade_no,
                    sign: sign_two
                };
                var infor = {
                    payer_id: req.decoded.id,
                    receivables_id: req.body.receivables_id,
                    receivables_company_id: req.body.receivables_company_id,
                    orderNo: parmas.out_trade_no,
                    order_id: req.body.order_id,
                    order_type: req.body.order_type,
                    amount: amount_result,
                    pay_method: req.body.pay_method,
                    packageName: req.body.packageName,
                    payProducts: req.body.pay_surplus,
                    trade_status: 'effective',
                };
                lib_pay_informationorder.add(infor, function (err, content, cont) {
                    if (err) {
                        console.log('err', err);
                    }
                    cb(null);
                })
            },
            function (cb) {
                lib_pay_informationorder.getOne({find: {orderNo: parmas.out_trade_no}}, cb);
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

    return api;
};
/**
 * Created by Administrator on 2017/4/27.
 */

var async = require('async');
var express = require('express');

module.exports = function () {

    var api = express.Router();

    api.use(require('../../middlewares/mid_verify_user')());

    //获取交易角色个人数据
    api.post('/get_trade_user', function (req, res, next) {
        if (!req.body.user_id) {
            return next('invalid_format');
        }
        var result = {};
        async.waterfall([
            function (cb) {
                global.lib_http.sendTradeServer({user_id: req.body.user_id}, global.config_api_url.trade_server_get_count, cb);
            },
            function (data, cb) {
                result.price_offer_jingjia = data.DJ;
                result.price_offer_dingjia = data.JJ;
                result.demand_trade = data.demand;
                result.order_sale = data.SALE;
                result.order_purchase = data.PURCHASE;
                //TODO 获取物流服务器角色单据个数
                //     global.lib_http.sendTrafficServer({user_id: req.body.user_id, type: 'TRADE'}, global.config_api_url.traffic_server_get_count, cb);
                // },
                // function (data, cb) {
                //     result.demand_traffic = data.demand;
                global.lib_company_relation.getCount({
                    type: global.config_common.relation_type.ACCEPT,
                    self_user_id: req.body.user_id
                }, cb);
            },
            function (count, cb) {
                result.company_sale = count;
                global.lib_company_relation.getCount({
                    type: global.config_common.relation_type.ACCEPT,
                    other_user_id: req.body.user_id
                }, cb);
            },
            function (count, cb) {
                result.company_purchase = count;
                cb();
            }
        ], function (err) {
            if (err) {
                return next(err);
            }
            global.config_common.sendData(req, result, next);
        });
    });

    //获取物流角色个人数据
    api.post('/get_traffic_user', function (req, res, next) {
        if (!req.body.user_id) {
            return next('invalid_format');
        }
        var result = {};
        async.waterfall([
            function (cb) {
                global.lib_line.getCount({user_id: req.body.user_id}, cb);
            },
            function (count, cb) {
                result.line = count;
                //TODO 获取物流服务器角色单据个数
                //     global.lib_http.sendTrafficServer({user_id: req.body.user_id, type: 'TRAFFIC'}, global.config_api_url.traffic_server_get_count, cb);
                // },
                // function (data, cb) {
                //     result.order = data.order;
                //     result.demand = data.demand;
                cb();
            }
        ], function (err) {
            if (err) {
                return next(err);
            }
            global.config_common.sendData(req, result, next);
        });
    });

    //获取司机角色个人数据
    api.post('/get_driver_user', function (req, res, next) {
        if (!req.body.user_id) {
            return next('invalid_format');
        }
        var result = {};
        async.waterfall([
            function (cb) {
                global.lib_user.getOne({find: {user_id: req.body.user_id}}, cb);
            },
            function (user, cb) {
                result.line = user.line ? user.line.length : 0;
                //     global.lib_http.sendTrafficServer({user_id: req.body.user_id, type: 'DRIVER'}, global.config_api_url.traffic_server_get_count, cb);
                // },
                // function (data, cb) {
                //     result.order = data.order;
                cb();
            }
        ], function (err) {
            if (err) {
                return next(err);
            }
            global.config_common.sendData(req, result, next);
        });
    });

    /**    types
     *
     * TRADE_OFFER  交易报价
     * DJ   定价
     * JJ   竞价
     * TRADE_DEMAND  交易需求单
     * PURCHASE   采购
     * SALE  销售
     * DRIVER   车辆
     * TRAFFIC_DEMAND 物流需求
     * TRAFFIC_OFFER 物流抢单
     * TRAFFIC_ORDER 物流订单
     * TRAFFIC_LINE 物流线路
     * DRIVER_DEMAND 司机需求
     * DRIVER_OFFER 司机抢单
     * DRIVER_ORDER 司机订单
     * DRIVER_LINE 司机线路
     * company_sale   销售公司
     * company_purchase  采购公司
     *
     */
    //获取交易公司数据  req.body{user_id||company_id,types:[]需要哪些count}
    api.post('/get_count', function (req, res, next) {
        if ((!req.body.company_ids &&
            !req.body.user_ids) ||
            !req.body.types) {
            return next('invalid_format');
        }
        async.waterfall([
            function (cb) {
                global.lib_count.get(req, cb);
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            var ids = req.body.company_ids.length?req.body.company_ids:req.body.user_ids;
            if(ids.length === 1 ){
                result = result[ids[0]];
            }
            global.config_common.sendData(req, result, next);
        });
    });

    return api;

};
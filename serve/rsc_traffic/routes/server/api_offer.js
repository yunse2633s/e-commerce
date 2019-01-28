/**
 * sj 20170424.
 */
//外部工具引用
var async = require('async');
var _ = require('underscore');
var express = require('express');
//内部工具引用
var http = require('../../lib/http');


//配置文件引用
var config_server = require('../../configs/config_server');
var config_common = require('../../configs/config_common');
config_server = config_server[config_server.env];
//内部数据操作引用
var trafficDemandSV = require('../../lib/lib_traffic_demand');
var trafficOfferSV = require('../../lib/lib_traffic_offer');
var trafficOrderSV = require('../../lib/lib_traffic_order');
var driverDemandSV = require('../../lib/lib_traffic_driver_demand');
var driverOfferSV = require('../../lib/lib_traffic_driver_offer');
var driverOrderSV = require('../../lib/lib_traffic_driver_order');
var trafficLineSV = require('../../lib/lib_traffic_line');

module.exports = function () {
    var api = express.Router();

    //token 解析判断
    api.use(require('../../middlewares/mid_verify_server')());
    //数量 20171018 取消状态查询的条件
    api.post('/get_count', function (req, res, next) {
        var result = {};
        // if(!_.isArray(req.body.user_ids) && !_.isArray(req.body.company_ids)){
        //     return next('ids_not_array');
        // }
        async.eachSeries(req.body.company_ids ? req.body.company_ids : req.body.user_ids, function (id, callback) {
            var obj = {};
            async.waterfall([
                function (cb) {
                    async.eachSeries(req.body.types, function (type, cbk) {
                        var orderCond = {};
                        switch (type) {
                            case 'TRAFFIC_DEMAND': {
                                if (req.body.user_ids) {
                                    orderCond.demand_user_id = id;
                                }
                                if (req.body.company_ids) {
                                    orderCond.demand_company_id = id;
                                }
                                // orderCond.status = config_common.demand_status.effective; //{$nin: config_common.demand_status.ineffective}; //不包含无效
                                orderCond.time_validity = {$gt: new Date()};
                                trafficDemandSV.getCount(orderCond, function (err, count) {
                                    if (err) return next(err);
                                    obj[type] = count;
                                    cbk();
                                });
                                break;
                            }
                            case 'TRAFFIC_OFFER': {
                                if (req.body.user_ids) {
                                    orderCond.user_demand_id = id;
                                }
                                if (req.body.company_ids) {
                                    orderCond.company_demand_id = id;
                                }
                                // orderCond.status = config_common.demand_status.effective; //不包含无效
                                trafficOfferSV.getCount(orderCond, function (err, count) {
                                    if (err)return next(err);
                                    obj[type] = count;
                                    cbk();
                                });
                                break;
                            }
                            case 'TRAFFIC_ORDER': {
                                if (req.body.user_ids) {
                                    orderCond.demand_user_id = id;
                                }
                                if (req.body.company_ids) {
                                    orderCond.demand_company_id = id;
                                }
                                orderCond.status = config_common.demand_status.complete; //不包含无效
                                trafficOrderSV.getCount(orderCond, function (err, count) {
                                    if (err)return next(err);
                                    obj[type] = count;
                                    cbk();
                                });
                                break;
                            }
                            case 'TRAFFIC_SUPPLY_ORDER': {
                                if (req.body.user_ids) {
                                    orderCond.supply_user_id = id;
                                }
                                if (req.body.company_ids) {
                                    orderCond.supply_company_id = id;
                                }
                                orderCond.status = config_common.demand_status.complete; //不包含无效
                                trafficOrderSV.getCount(orderCond, function (err, count) {
                                    if (err)return next(err);
                                    obj[type] = count;
                                    cbk();
                                });
                                break;
                            }
                            case 'TRAFFIC_LINE': {
                                if (req.body.user_ids) {
                                    orderCond.user_id = id;
                                }
                                if (req.body.company_ids) {
                                    orderCond.company_id = id;
                                }
                                orderCond.status =config_common.demand_status.effective;
                                trafficLineSV.getCount(orderCond, function (err, count) {
                                    if (err)return next(err);
                                    obj[type] = count;
                                    cbk();
                                });
                                break;
                            }
                            case 'DRIVER_DEMAND': {
                                if (req.body.user_ids) {
                                    orderCond.demand_user_id = id;
                                }
                                if (req.body.company_ids) {
                                    orderCond.demand_company_id = id;
                                }
                                // orderCond.status = config_common.demand_status.effective; //不包含无效
                                driverDemandSV.getCount(orderCond, function (err, count) {
                                    if (err)return next(err);
                                    obj[type] = count;
                                    cbk();
                                });
                                break;
                            }
                            case 'DRIVER_OFFER': {
                                if (req.body.user_ids) {
                                    orderCond.user_demand_id = id;
                                }
                                if (req.body.company_ids) {
                                    orderCond.company_demand_id = id;
                                }
                                // orderCond.status = config_common.demand_status.effective; //不包含无效
                                driverOfferSV.getCount(orderCond, function (err, count) {
                                    if (err)return next(err);
                                    obj[type] = count;
                                    cbk();
                                });
                                break;
                            }
                            case 'DRIVER_ORDER': {
                                if (req.body.user_ids) {
                                    orderCond.demand_user_id = id;
                                }
                                if (req.body.company_ids) {
                                    orderCond.demand_company_id = id;
                                }
                                orderCond.status =config_common.demand_status.complete; //不包含无效
                                driverOrderSV.getCount(orderCond, function (err, count) {
                                    if (err)return next(err);
                                    obj[type] = count;
                                    cbk();
                                });
                                break;
                            }
                            case 'DRIVER_SUPPLY_ORDER': {
                                if (req.body.user_ids) {
                                    orderCond.supply_user_id = id;
                                }
                                orderCond.status = config_common.demand_status.complete; //不包含无效
                                driverOrderSV.getCount(orderCond, function (err, count) {
                                    if (err)return next(err);
                                    obj[type] = count;
                                    cbk();
                                });
                                break;
                            }
                            case 'DRIVER_LINE': {
                                if (req.body.user_ids) {
                                    orderCond.user_id = id;
                                }
                                // orderCond.status = config_common.demand_status.effective; //不包含无效
                                trafficLineSV.getCount(orderCond, function (err, count) {
                                    if (err)return next(err);
                                    obj[type] = count;
                                    cbk();
                                });
                                break;
                            }
                            case 'RELATION_TRAFFIC_ORDER': {
                                if (req.body.user_ids) {
                                    orderCond.supply_user_id = req.body.user_id;
                                    orderCond.demand_user_id = id;
                                }
                                if (req.body.company_ids) {
                                    orderCond.supply_user_id = req.body.company_id;
                                    orderCond.demand_company_id = id;
                                }
                                orderCond.status = {$nin: config_common.demand_status.ineffective}; //不包含无效
                                trafficOrderSV.getCount(orderCond, function (err, count) {
                                    if (err)return next(err);
                                    obj[type] = count;
                                    cbk();
                                });
                                break;
                            }
                            default:
                                cbk();
                                break;
                            //        司机订单
                        }
                    }, cb);
                }
            ], function (err) {
                if (err) {
                    return next(err);
                }
                result[id] = obj;
                callback();
            })
        }, function (err) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, result, next);
        });

    });
    //列表

    return api;
};


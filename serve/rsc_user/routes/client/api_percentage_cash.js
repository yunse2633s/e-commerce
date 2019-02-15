/**
 * Created by Administrator on 2017/6/30.
 */
var async = require('async');
var express = require('express');
module.exports = function () {
    var api = express.Router();

    api.use(require('../../middlewares/mid_verify_user')());

    /**
     * 功能：保存物流超管设置的提现百分比
     * 参数：TRAFFIC_EMPLOYEE，TRAFFIC_CAPTAIN：数字，
     */
    api.post('/save_percentage', function (req, res, next) {
        if (!req.body.traffic_employee || !req.body.traffic_captain) {
            return next('invalid_format');
        }
        if (req.decoded.role !== global.config_common.user_roles.TRAFFIC_ADMIN) {
            return next('not_allow');
        }
        async.waterfall([
            function (cb) {
                global.lib_percentage_cash.getOne({
                    find: {company_id: req.decoded.company_id[0]}
                }, cb);
            },
            function (data, cb) {
                if (data) {
                    data.traffic_employee = req.body.traffic_employee;
                    data.traffic_captain = req.body.traffic_captain;
                    data.save(cb);
                } else {
                    global.lib_percentage_cash.add({
                        company_id: req.decoded.company_id[0],
                        traffic_employee: req.body.traffic_employee,
                        traffic_captain: req.body.traffic_captain
                    }, cb);
                }
            }
        ], function (err, content) {
            if (err) {
                return next(err);
            }
            global.config_common.sendData(req, content, next);
        });
    });

    /**
     * 功能:获取本公司的提现比例
     */
    api.post('/get_one', function (req, res, next) {
        if (req.decoded.role !== global.config_common.user_roles.TRAFFIC_ADMIN) {
            return next('not_allow');
        }
        async.waterfall([
            function (cb) {
                global.lib_percentage_cash.getOne({
                    find: {company_id: req.decoded.company_id[0]}
                }, cb);
            }
        ], function (err, content) {
            if (err) {
                return next(err);
            }
            global.config_common.sendData(req, content, next);
        });
    });

    return api;
};
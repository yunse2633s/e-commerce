/**
 * Created by Administrator on 2017/4/21.
 */
var async = require('async');
var express = require('express');

module.exports = function () {

    var api = express.Router();

    api.use(require('../../middlewares/mid_verify_server')());

    api.post('/get_list', function (req, res, next) {
        if (!req.body.cond) {
            return next('invalid_format');
        }
        async.waterfall([
            function (cb) {
                global.lib_company.getList(req.body.cond, cb);
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            global.config_common.sendData(req, result, next);
        });
    });

    api.post('/get_list_all', function (req, res, next) {
        if (!req.body.cond) {
            return next('invalid_format');
        }
        async.waterfall([
            function (cb) {
                global.lib_company.getListAll(req.body.cond, cb);
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            global.config_common.sendData(req, result, next);
        });
    });

    api.post('/get_one', function (req, res, next) {
        if (!req.body.cond) {
            return next('invalid_format');
        }
        async.waterfall([
            function (cb) {
                global.lib_company.getOne(req.body.cond, cb);
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            global.config_common.sendData(req, result, next);
        });
    });

    return api;

};
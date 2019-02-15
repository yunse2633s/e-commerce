/**
 * Created by Administrator on 2017/4/17.
 */
var async = require('async');
var _ = require('underscore');
var express = require('express');

module.exports = function () {

    var api = express.Router();

    api.use(require('../../middlewares/mid_verify_server')());

    api.post('/get_token', function (req, res, next) {
        if (!req.body.user_id) {
            return next('invalid_format');
        }
        var userData;
        async.waterfall([
            function (cb) {
                global.lib_user.getOne({find: {_id: req.body.user_id}}, cb);
            },
            function (user, cb) {
                if(!user){
                    return cb('user_not_found');
                }
                userData = user;
                global.lib_company.getOne({find: {_id: user.company_id}}, cb);
            },
            function (company, cb) {
                cb(null, global.config_common.createTokenUser(userData, company || {}));
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            global.config_common.sendData(req, result, next);
        });
    });

    api.post('/get_list', function (req, res, next) {
        if (!req.body.cond) {
            return next('invalid_format');
        }
        async.waterfall([
            function (cb) {
                global.lib_user.getList(req.body.cond, cb);
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
                global.lib_user.getListAll(req.body.cond, cb);
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
                global.lib_user.getOne(req.body.cond, cb);
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            global.config_common.sendData(req, result, next);
        });
    });

    api.post('/get_one_user_truck', function (req, res, next) {
        if (!req.body.user_id) {
            return next('invalid_format');
        }
        var userData;
        async.waterfall([
            function (cb) {
                global.lib_user.getOne({find: {_id: req.body.user_id}}, cb);
            },
            function (user, cb) {
                userData = user;
                global.lib_truck.getOne({find: {user_id: req.body.user_id}}, cb);
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            global.config_common.sendData(req, {user: userData, truck: result}, next);
        });
    });

    return api;

};
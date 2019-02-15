/**
 * Created by Administrator on 2017/4/19.
 */
var async = require('async');
var jwt = require('jsonwebtoken');
var express = require('express');
var _ = require('underscore');
module.exports = function () {

    var api = express.Router();

    api.post('/verify', function (req, res, next) {
        var token = req.body['x-access-token'] || req.headers['x-access-token'];
        if (token) {
            jwt.verify(token, global.config_common.secret_keys.user, function (err) {
                if (err) {
                    return next('jwt_expired');
                }
                global.config_common.sendData(req, {}, next);
            });
        } else {
            next('jwt_expired');
        }
    });

    api.post('/get_base_data', function (req, res, next) {
        var result = {};
        async.waterfall([
            function (cb) {
                var token = req.body['x-access-token'] || req.headers['x-access-token'];
                if (token) {
                    jwt.verify(token, config_common.secret_keys.user, function (err, decoded) {
                        if (err && err.message == 'jwt expired') {
                            return cb('jwt_expired');
                        } else if (err) {
                            return cb('auth_failed_user');
                        }
                        req.decoded = decoded;
                        global.lib_user.getOne({find: {_id: req.decoded.id}}, cb);
                    });
                } else {
                    return cb('no_token');
                }
            },
            function (user, cb) {
                result.user = user;
                if (_.isArray(user.company_id) && !user.company_id.length) {
                    cb(null, null);
                } else if (user.company_id) {
                    global.lib_company.getOne({find: {_id: user.company_id.toString()}}, cb);
                } else {
                    cb(null, null);
                }
            },
            function (company, cb) {
                result.company = company;
                result.token = global.config_common.createTokenUser(result.user, company || {});
                cb();
            }
        ], function (err) {
            if (err) {
                return next(err);
            }
            global.config_common.sendData(req, result, next);
        });
    });

    api.use(require('../../middlewares/mid_verify_user')());

    return api;
};
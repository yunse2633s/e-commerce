/**
 * Created by Administrator on 17/4/21.
 */
var async = require('async');
var _ = require('underscore');
var jwt = require('jsonwebtoken');
var request = require('request');
var querystring = require('querystring');

var config_server = require('../configs/config_server');
var config_common = require('../configs/config_common');
var obj = {
    user_server_common: '/api/server/common/get', // 自定义查询user
    admin_server_get: '/api/server/common/get'    //自定义指挥中心人员查询
};

var sendUserServer = function (data, url, cb) {
    if (!cb) {
        cb = function () {
        };
    }
    request({
        body: querystring.stringify({token: jwt.sign(data, config_common.secret_keys.user, {expiresIn: config_common.token_server_timeout})}),
        url: 'http://' + config_server.user_server_ip + ':' + config_server.user_server_port + url,
        method: 'POST',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'}
    }, function (err, http_res, http_req) {
        if (err) return cb(err);
        if (JSON.parse(http_req).status === 'success') {
            cb(null, JSON.parse(http_req).data)
        } else {
            cb(JSON.parse(http_req).msg);
        }
    });
};

var sendAdminServer = function (data, url, cb) {
    if (!cb) {
        cb = function () {
        };
    }
    request({
        body: querystring.stringify({token: jwt.sign(data, config_common.secret_keys.admin, {expiresIn: config_common.token_server_timeout})}),
        url: 'http://' + config_server.admin_server_ip + ':' + config_server.admin_server_port + url,
        method: 'POST',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'}
    }, function (err, http_res, http_req) {
        if (err) return cb(err);
        if (JSON.parse(http_req).status === 'success') {
            cb(null, JSON.parse(http_req).data)
        } else {
            cb(JSON.parse(http_req).msg);
        }
    });
};

/**
 * 用户
 * @param data
 * @param callback
 */
exports.getUserList = function (data, callback) {
    async.waterfall([
        function (cb) {
            sendUserServer({
                cond: data,
                model: 'User_trade',
                method: 'getList'
            }, obj.user_server_common, cb);
        },
        function (result, cb) {
            if (result.length > 0) return cb(null, result);
            sendUserServer({
                cond: data,
                model: 'User_traffic',
                method: 'getList'
            }, obj.user_server_common, cb);
        },
        function (result,cb) {
            if (result.length > 0) return cb(null, result);
            sendAdminServer({
                method: 'getList',
                cond: data,
                model: 'SuperAdmin'
            },obj.admin_server_get, cb);
        }
    ], callback);
};

exports.getUserOne = function (data, callback) {
    async.waterfall([
        function (cb) {
            sendUserServer({
                cond: data,
                model: 'User_trade',
                method: 'getOne'
            }, obj.user_server_common, cb);
        },
        function (company, cb) {
            if (company) return cb(null, company);
            sendUserServer({
                cond: data,
                model: 'User_traffic',
                method: 'getOne'
            }, obj.user_server_common, cb);
        }
    ], callback);
};

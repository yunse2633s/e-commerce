/**
 * Created by Administrator on 17/5/10.
 */

var config_common = global.config_common;
var jwt = require('jsonwebtoken');
var request = require('request');
var querystring = require('querystring');
var config_server = global.config_server;
var obj = {
    //订单完成添加到统计服务器
    statistical_server_order_add: '/api/server/order/add',
    //订单完成添加到统计服务器
    statistical_server_order_addList: '/api/server/order/addList',

    //交易公司操作
    statistical_server_companyTrade_add: '/api/server/companyTrade/add'
};
var createTokenStatisticalServer = function (data) {
    return jwt.sign(data, config_common.secret_keys.statistical,
        {
            expiresIn: config_common.token_server_timeout
        });
};
var sendStatisticalServer = function (data, url, cb) {
    if (!cb) {
        cb = function () {
        };
    }
    data = createTokenStatisticalServer(data);
    var headers = {
        'Content-Type': 'application/x-www-form-urlencoded'
    };
    var option = {
        body: querystring.stringify({token: data}),
        url: 'http://' + config_server.statistical_server_ip + ':' + config_server.statistical_server_port + url,
        method: 'POST',
        headers: headers
    };
    request(option, function (err, http_res, http_req) {
        if (err) return cb(err);
        if (JSON.parse(http_req).status === 'success') {
            cb(null, JSON.parse(http_req).data)
        } else {
            cb(JSON.parse(http_req).msg);
        }
    });
};

/**
 * 订单完成同步统计服务器
 * @param data
 * @param callback
 */
exports.addList = function (data, callback) {
    if (!callback) callback = function () {
    };
    sendStatisticalServer(data, obj.statistical_server_order_addList, callback);
};

/**
 * 订单完成同步统计服务器
 * @param data
 * @param callback
 */
exports.add = function (data, callback) {
    if (!callback) callback = function () {
    };
    sendStatisticalServer(data, obj.statistical_server_order_add, callback);
};

/**
 * 各个环节统计数量和活跃度
 * @param data
 * @param callback
 */
exports.statistical_server_companyTrade_add = function (req, data, callback) {
    if (!callback) callback = function () {
    };
    if (req && req.decoded) {
        if (req.decoded.company_id) sendStatisticalServer(data, obj.statistical_server_companyTrade_add, callback);
    } else {
        if (req.company_id) sendStatisticalServer(data, obj.statistical_server_companyTrade_add, callback);
    }
};

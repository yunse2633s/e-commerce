/**
 * Created by Administrator on 2017/6/19.
 */
var async = require('async');

var lib_http = require('./lib_http');
var config_api_url = require('../configs/config_api_url');

var obj = {
    //交易公司操作
    statistical_server_companyTrade_add: '/api/server/companyTrade/add',
    statistical_server_companyTraffic_add: '/api/server/companyTraffic/add',
    statistical_server_driver_add: '/api/server/userDriver/add'
};

exports.add = function (cond, callback) {
    lib_http.sendStatisticalServer(cond, config_api_url.statistical_server_platform_add, callback);
};

exports.statistical_server_companyTrade_add = function (req, data, callback) {
    if (!callback) callback = function () {
    };
    if (req.body.company_id) lib_http.sendStatisticalServer(data, obj.statistical_server_companyTrade_add, callback);
};

exports.statistical_server_companyTraffic_add = function (req, data, callback) {
    if (!callback) callback = function () {
    };
    if (req.decoded.company_id) lib_http.sendStatisticalServer(data, obj.statistical_server_companyTraffic_add, callback);
};

exports.statistical_server_driver_add = function (req, data, callback) {
    if (!callback) callback = function () {
    };
    lib_http.sendStatisticalServer(data, obj.statistical_server_driver_add, callback);
};

// exports.getOne = function (cond, callback) {
//     db_model.getOne(cond, callback);
// };
//
// exports.getCount = function (cond, callback) {
//     db_model.getCount(cond, callback);
// };
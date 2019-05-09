/**
 * Created by Administrator on 2017/2/27.
 */
var async = require('async');

// var config_common = require('../configs/config_common');
var config_api_url = require('../configs/config_api_url');

var lib_http = require('./lib_http');

// //获取交易人员
// exports.getOneTrade = function (data, callback) {
//     async.waterfall([
//         function (cb) {
//             lib_http.sendUserServer({cond: data}, config_api_url.user_server_get_one_trade, cb);
//         }
//     ], callback);
// };
//
// //获取交易人员
// exports.getOneTraffic = function (data, callback) {
//     async.waterfall([
//         function (cb) {
//             lib_http.sendUserServer({cond: data}, config_api_url.user_server_get_one_traffic, cb);
//         }
//     ], callback);
// };
//
//获取一个人员
exports.getOne = function (data, callback) {
    async.waterfall([
        function (cb) {
            lib_http.sendUserServer({cond: data}, config_api_url.user_server_get_one, cb);
        }
    ], callback);
};

//获取一群人员
exports.getListAll = function (data, callback) {
    async.waterfall([
        function (cb) {
            lib_http.sendUserServer({cond: data}, config_api_url.user_server_user_get_list_all, cb);
        }
    ], callback);
};

//获取一群人员
exports.getCount = function (data, callback) {
    async.waterfall([
        function (cb) {
            lib_http.sendUserServer({cond: data, model: ''}, config_api_url.user_server_user_get_list_all, cb);
        }
    ], callback);
};

// //检查物流公司角色
// var isTrafficRole = function (role) {
//     return role.indexOf('TRAFFIC') >= 0;
// };
// exports.isTrafficRole = isTrafficRole;
//
// //检查交易公司角色
// var isTradeRole = function (role) {
//     return role.indexOf('TRADE') >= 0;
// };
// exports.isTradeRole = isTradeRole;

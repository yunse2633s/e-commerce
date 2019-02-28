/**
 * Created by Administrator on 2017/2/27.
 */
var http = require('../libs/http');
var https = require('https');
var async = require('async');
var _ = require('underscore');
var fs = require('fs');

var config_api_url = global.config_api_url;
var config_error = global.config_error;
var crypto = require('crypto');

var PayInformationOrder = require('../dbs/db_base')('PayInformationOrder');

//依据条件查询单个表详情
exports.getOne = function (data, callback) {
    PayInformationOrder.getOne(data, callback);
};
//依据条件添加单个表详情
exports.add = function (data, callback) {
    PayInformationOrder.add(data, callback);
};
exports.del = function (data, callback) {
    PayInformationOrder.del(data, callback)
};
//依据条件修改单个表详情
exports.update = function (data, callback) {
    PayInformationOrder.update(data, callback);
};
exports.getList = function (data, callback) {
    PayInformationOrder.getList(data, callback);
};
exports.getCount = function (data, callback) {
    PayInformationOrder.getCount(data, callback);
};

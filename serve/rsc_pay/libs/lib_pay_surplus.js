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

var PaySurplusDB = require('../dbs/db_base')('PaySurplus');

//依据条件查询单个表详情
exports.getOne = function (data, callback) {
    PaySurplusDB.getOne(data, callback);
};
//依据条件添加单个表详情
exports.add = function (data, callback) {
    PaySurplusDB.add(data, callback);
};
exports.del = function (data, callback) {
    PaySurplusDB.del(data, callback)
};
exports.getList = function (data, callback) {
    PaySurplusDB.getList(data, callback);
};
exports.update = function (data, callback) {
    PaySurplusDB.update(data, callback);
};
exports.getCount = function (data, callback) {
    PaySurplusDB.getCount(data, callback);
};

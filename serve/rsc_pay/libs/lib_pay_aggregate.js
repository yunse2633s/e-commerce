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

var PayAggregateDB = require('../dbs/db_base')('PayAggregate');

//依据条件查询单个表详情
exports.getOne = function (data, callback) {
    PayAggregateDB.getOne(data, callback);
};
//依据条件添加单个表详情
exports.add = function (data, callback) {
    PayAggregateDB.add(data, callback);
};
exports.del = function (data, callback) {
    PayAggregateDB.del(data, callback)
};
//依据条件修改单个表详情
exports.update = function (data, callback) {
    PayAggregateDB.update(data, callback);
};
exports.getList = function (data, callback) {
    PayAggregateDB.getList(data, callback);
};
exports.getCount = function (data, callback) {
    PayAggregateDB.getCount(data, callback);
};
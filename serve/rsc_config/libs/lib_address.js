/**
 * Created by Administrator on 2017/2/27.
 */
var async = require('async');
var config_api_url = require('../configs/config_api_url');
var config_common = require('../configs/config_common');
var addressDB = require('../dbs/db_base')('Address');

//依据条件查询单个表详情
exports.getOne = function (data, callback) {
    addressDB.getOne(data, callback);
};

/**
 * Created by Administrator on 2017\11\11 0011.
 */
/**
 * 仓库柜的增删改查
 */
var async = require('async');

var DB = require('../dbs/db_base')('Store_sort');

exports.add = function (data, callback) {
    DB.add(data, callback);
};
//删除记录
exports.del = function (data, callback) {
    DB.del(data, callback);
};

//依据条件修改原表数据
exports.edit = function (data, callback) {
    DB.edit(data, callback);
};

//依据条件查询单个表详情
exports.getOne = function (data, callback) {
    DB.getOne(data, callback);
};

//依据条件查询单个表详情
exports.getList = function (data, callback) {
    DB.getList(data, callback);
};
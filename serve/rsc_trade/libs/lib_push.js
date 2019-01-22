/**
 * Created by Administrator on 2017/3/15.
 */
var model = require('../dbs/db_base');
model = model('Push');
var async = require('async');

exports.add = function (data, callback) {
    model.add(data, callback);
};
exports.addList = function (data, callback) {
    model.addList(data, callback);
};
exports.getOne = function (data, callback) {
    model.getOne(data, callback);
};
exports.getList = function (data, callback) {
    model.getList(data, callback);
};
exports.update = function (cond, callback) {
    model.update(cond, callback);
};
exports.getCount = function (cond, callback) {
    model.getCount(cond, callback);
};
exports.edit = function (data, callback) {
    model.edit(data, callback)
};
exports.del = function (data, callback) {
    model.del(data, callback)
};

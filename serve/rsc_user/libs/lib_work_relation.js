/**
 * Created by Administrator on 2017/6/23.
 */
var db_model = require('../dbs/db_base')('Work_relation');

exports.add = function (cond, callback) {
    db_model.add(cond, callback);
};

exports.getCount = function (cond, callback) {
    db_model.getCount(cond, callback);
};

exports.getOne = function (cond, callback) {
    db_model.getOne(cond, callback);
};

exports.getList = function (cond, callback) {
    db_model.getList(cond, callback);
};

exports.del = function (cond, callback) {
    db_model.del(cond, callback);
};

exports.addList = function (cond, callback) {
    db_model.addList(cond, callback);
};

exports.del = function (cond, callback) {
    db_model.del(cond, callback);
};

exports.updateList = function (cond, callback) {
    db_model.update(cond, callback);
};
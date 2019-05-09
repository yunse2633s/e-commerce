/**
 * Created by Administrator on 2018\2\3 0003.
 */
var async = require('async');
var model = require('../dbs/db_base');
model = model('session_store');


exports.add = function (data, callback) {
   model.add(data,callback);
};

exports.getList = function (data, callback) {
    model.getList(data, callback);
};

exports.edit = function (data, callback) {
    model.edit(data, callback);
};

exports.update = function (data, callback) {
    model.update(data, callback);
};

exports.getOne = function (data, callback) {
    model.getOne(data, callback);
};

/**
 * Created by Administrator on 2018/2/6/006.
 */

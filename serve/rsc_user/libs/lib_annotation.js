/**
 * Created by Administrator on 2018\6\5 0005.
 */
var model = require('../dbs/db_base');
model = model('Annotation');

exports.add = function (data, callback) {
    model.add(data, callback);
};

exports.getOne = function (data, callback) {
    model.getOne(data, callback);
};

exports.getList = function (data, callback) {
    model.getList(data, callback);
};

exports.del = function (data, callback) {
    model.del(data, callback)
};

exports.getCount = function (data, callback) {
    model.getCount(data, callback);
};
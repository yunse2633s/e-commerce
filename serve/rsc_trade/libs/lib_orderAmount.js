/**
 * Created by Administrator on 2018\3\29 0029.
 */
var model = require('../dbs/db_base');
model = model('OrderAmount');

exports.add = function (data, callback) {
    model.add(data, callback);
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

exports.getCount = function (data, callback) {
    model.getCount(data, callback);
};

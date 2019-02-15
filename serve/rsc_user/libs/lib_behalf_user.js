/**
 * Created by Administrator on 2017\10\23 0023.
 */
var model = require('../dbs/db_base');
model = model('behalf_user');

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
/**
 * Created by Administrator on 2017/6/26.
 */
var db_model = require('../dbs/db_base')('Tip');

exports.edit = function (data, cb) {
    db_model.update(data, cb);
};

exports.getOne = function (data, cb) {
    db_model.getOne(data, cb);
};

exports.add = function (data, cb) {
    db_model.add(data, cb);
};
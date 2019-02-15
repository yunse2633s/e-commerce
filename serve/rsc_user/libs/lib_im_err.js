/**
 * Created by Administrator on 2018\3\24 0024.
 */
var db_model = require('../dbs/db_base')('IM_err_user');

exports.add = function (data, cb) {
    db_model.add(data, cb);
};

exports.getOne = function (data, cb) {
    db_model.getOne(data, cb);
};

exports.getList = function (data, cb) {
    db_model.getList(data, cb);
};

exports.del = function (data, cb) {
    db_model.del(data, cb);
};

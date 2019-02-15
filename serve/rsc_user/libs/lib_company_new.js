var db_model = require('../dbs/db_base')('Company');

exports.add = function (cond, callback) {
    db_model.add(cond, callback);
};

exports.getOne = function (cond, callback) {
    db_model.getOne(cond, callback);
};

exports.getList = function (cond, callback) {
    db_model.getList(cond, callback);
};
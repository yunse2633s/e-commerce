var db_model = require('../dbs/db_base')('User');

exports.add = function (cond, callback) {
    db_model.add(cond, callback);
};

exports.getOne = function (cond, callback) {
    db_model.getOne(cond, callback);
};
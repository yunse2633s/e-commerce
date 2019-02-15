var db_model = require('../dbs/db_base')('Default_store');

exports.add = function (data, cb) {
    db_model.add(data, cb);
};

exports.edit = function (data, cb) {
    db_model.update(data, cb);
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

exports.update = function (data, cb) {
    db_model.update(data, cb);
};
var db_model = require('../dbs/db_base')('Signature');

exports.add = function (data, cb) {
    db_model.add(data, cb);
};

exports.edit = function (data, cb) {
    db_model.update(data, cb);
};

exports.getOne = function (data, cb) {
    db_model.getOne(data, cb);
};

exports.del = function (data, cb) {
    db_model.del(data, cb);
};

exports.update = function (data, cb) {
    db_model.update(data, cb);
};
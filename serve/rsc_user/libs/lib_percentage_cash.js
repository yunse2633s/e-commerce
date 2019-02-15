/**
 * Created by Administrator on 2017/10/19.
 */

var db_model = require('../dbs/db_base')('Percentage_cash');

exports.add = function (cond, callback) {
    db_model.add(cond, callback);
};

exports.getOne = function (cond, callback) {
    db_model.getOne(cond, callback);
};

exports.getCount = function (cond, callback) {
    db_model.getCount(cond, callback);
};
/**
 * Created by Administrator on 17/4/19.
 */
var model = require('../dbs/db_base');
model = model('PriceOfferCity');
var config_common = global.config_common;
var async = require('async');

exports.add = function (data, callback) {
    model.add(data, callback);
};
exports.addList = function (data, callback) {
    model.addList(data, callback);
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
exports.getListAndCount = function (page, data, callback) {
    async.waterfall([
        function (cb) {
            model.getCount(data.find, cb);
        },
        function (count, cb) {
            model.getList(data, function (err, result) {
                if (err) {
                    return cb(err);
                }
                cb(null, {
                    exist: count > config_common.entry_per_page * page,
                    list: result,
                    count: count
                });
            })
        }
    ], callback);
};

exports.getCount = function (cond, callback) {
    model.getCount(cond, callback);
};


exports.edit = function (data, callback) {
    model.edit(data, callback)
};
exports.del = function (data, callback) {
    model.del(data, callback)
};

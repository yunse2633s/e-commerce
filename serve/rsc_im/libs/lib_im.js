/**
 * Created by Administrator on 2017/2/27.
 */
var async = require('async');
var _ = require('underscore');

var model = require('../dbs/db_base');
model = model('PushUser');

exports.getList = function (data, callback) {
    model.getList(data, callback);
};

exports.edit = function (data, callback) {
    model.edit(data, callback);
};
exports.update = function (data, callback) {
    model.update(data, callback);
};
exports.getOne = function (data, callback) {
    model.getOne(data, callback);
};


exports.add = function (data, callback) {
    async.waterfall([
        function (cb) {
            model.update({
                find: data,
                set: {$inc: {count: 1}, push: true, time_creation: new Date()}
            }, cb);
        },
        function (result, cb) {
            if (result.n === 0) {
                model.add(_.extend(data, {count: 1, push: true}), cb);
            } else {
                cb(null, null, null);
            }
        }
    ], callback);
};



/**
 * by Administrator 20170410
 */
var dbModel = function (dbName) {

    var funObj = {};

    var model = require('../models/' + dbName);

    //增删改查
    funObj.add = function (data, cb) {
        if (!cb) {
            cb = function () {};
        }
        var result = new model(data);
        result.save(cb);
    };

    funObj.del = function (data, cb) {
        if (!cb) {
            cb = function () {};
        }
        model
            .remove(data)
            .exec(cb);
    };

    funObj.edit = function (data, cb) {
        if (!cb) {
            cb = function () {};
        }
        data.save(cb);
    };

    funObj.getOne = function (data, cb) {
        if (!cb) {
            cb = function () {};
        }
        model
            .findOne(data.find)
            .select(data.select || {})
            .exec(cb);
    };

    //扩展
    funObj.getCount = function (data, cb) {
        if (!cb) {
            cb = function () {};
        }
        model
            .count(data)
            .exec(cb);
    };

    funObj.getById = function (data, cb) {
        if (!cb) {
            cb = function () {};
        }
        model
            .findById(data.find)
            .select(data.select || {})
            .exec(cb);
    };

    funObj.getList = function (data, cb) {
        if (!cb) {
            cb = function () {};
        }
        model
            .find(data.find)
            .select(data.select || {})
            .sort(data.sort || {})
            .skip(data.skip)
            .limit(data.limit)
            .exec(cb);
    };

    //批量更新
    funObj.update = function (data, cb) {
        if (!cb) {
            cb = function () {};
        }
        model
            .update(data.find, data.set, data.options || {multi: true})
            .exec(cb);
    };

    funObj.group = function (data, cb) {
        if (!cb) {
            cb = function () {};
        }
        model
            .aggregate()
            .match(data.match)
            .group(data.group)
            .exec(cb);
    };

    return funObj;
};

module.exports = dbModel;
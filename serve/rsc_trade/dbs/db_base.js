/**
 * by Administrator 20170410
 */
var fs = require('fs');

var dbModel = function (dbName, callback) {
    var funObj = {};
    var fileArr = fs.readdirSync(__dirname.replace('dbs', 'models'));
    var error = 'Not_found :' + dbName + ',Should be in:';
    var modelArr = [];
    for (var i = 0; i < fileArr.length; i++) {
        var fileName = fileArr[i];
        fileName = fileName.split('.')[0];
        modelArr.push(fileName);
        if (dbName === fileName) {
            error = undefined;
        }
    }
    if (callback) {
        if (error) return callback(error + modelArr);
    }
    var model = require('../models/' + dbName);
    //增删改查
    funObj.add = function (data, cb) {
        var result = new model(data);
        result.save(cb);
    };
    funObj.del = function (data, cb) {
        model
            .remove(data)
            .exec(cb);
    };
    funObj.edit = function (data, cb) {
        data.save(cb);
    };
    funObj.addList = function (data, cb) {
        model.create(data, cb);
    };
    funObj.getOne = function (data, cb) {
        model
            .findOne(data.find)
            .select(data.select || {})
            .exec(cb);
    };
    //扩展
    funObj.getCount = function (data, cb) {
        model
            .count(data)
            .exec(cb);
    };
    funObj.getById = function (data, cb) {
        model
            .findById(data.find)
            .select(data.select || {})
            .exec(cb);
    };
    funObj.getList = function (data, cb) {
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
        model
            .update(data.find, data.set, data.multi || {multi: true})
            .exec(cb);
    };
    funObj.group = function (data, cb) {
        model
            .aggregate()
            .match(data.match)
            .group(data.group)
            .exec(cb);
    };
    if (callback) return callback(null, funObj);
    return funObj;
};

module.exports = dbModel;
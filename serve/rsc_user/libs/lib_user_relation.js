/**
 * Created by Administrator on 2017/6/22.
 */
var async = require('async');
var modelDB = require('../dbs/db_base')('User_relation');

//获取邀请列表
exports.getOne = function(data, callback){
    async.waterfall([
        function(cb){
            modelDB.getOne(data, cb);
        }
    ], callback);
};

//获取邀请列表
exports.getList = function(data, callback){
    async.waterfall([
        function(cb){
            modelDB.getList(data, cb);
        }
    ], callback);
};

//获取邀请列表
exports.getCount = function(data, callback){
    async.waterfall([
        function(cb){
            modelDB.getCount(data, cb);
        }
    ], callback);
};

//删除好友关系
exports.del = function(data, callback){
    async.waterfall([
        function(cb){
            modelDB.del(data, cb);
        }
    ], callback);
};
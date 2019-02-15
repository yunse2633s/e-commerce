/**
 * Created by Administrator on 2017/2/27.
 */
var async = require('async');
var http = require('./lib_http');
var config_api_url = require('../configs/config_api_url');
var config_common = require('../configs/config_common');
var driverVerifyDB = require('../dbs/db_base')('Driver_verify');

/**
 * 增删改查
 */
exports.addCheck = function(data,callback){
    async.waterfall([
        function (cb) {
            driverVerifyDB.getOne({find: data}, cb);
        },
        function (verify, cb) {
            if(verify){
                cb(null, verify, 1);
            }else{
                driverVerifyDB.add(data,cb);
            }
        }
    ], callback);
};
/**
 * 增删改查
 */
exports.add = function(data,callback){
    driverVerifyDB.add(data,callback);
};
//删除记录
exports.del = function(data,callback){
    driverVerifyDB.del(data,callback);
};

//依据条件修改原表数据
exports.edit = function(data,callback){
    driverVerifyDB.edit(data,callback);
};

//依据条件查询单个表详情
exports.getOne = function(data, callback){
    driverVerifyDB.getOne(data,callback);
};

/**
 * 扩展
 */
//通过id查询
exports.getById = function(data, callback){
    driverVerifyDB.getById(data,callback);
};
//获取表数量
exports.getCount = function(data, callback){
    driverVerifyDB.getCount(data, callback);
};
//获取分页数据
exports.getList = function(data, callback){
    driverVerifyDB.getList(data,callback)
};
//批量编辑
exports.editList = function(data,callback){
    driverVerifyDB.edit(data,callback);
};
//批量更新
exports.updateList = function(data,callback){
    driverVerifyDB.update(data,callback);
};
//相似检查
exports.check=function(){

};
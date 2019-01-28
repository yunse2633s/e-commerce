/**
 * Created by Administrator on 2017/3/1.
 */
var async = require('async');
var http = require('../lib/http');
var _ = require('underscore');
var decimal = require('decimal');

var config_api_url = require('../configs/config_api_url');
var config_common = require('../configs/config_common');
// var config_msg_url = require('../configs/config_msg_url');

var DB = require('../dbs/db_base')('TrafficOffer');
var trafficDemandDB = require('../dbs/db_base')('TrafficDemand');

var config_server = require('../configs/config_server');

/**
 * 扩展-------20170410
 */
//依据条件查询单个表详情
exports.getOne = function(data, callback){
    DB.getOne(data,callback);
};

//通过id查询
exports.getById = function(data, callback){
    DB.getById(data,callback);
};
//获取表数量
exports.getCount = function(data, callback){
    DB.getCount(data, callback);
};
//获取分页数据
exports.getList = function(data, callback){
    DB.getCount(data.find,function(err,count){
        if(err){
            return callback(err);
        }
        DB.getList(data,function(err, orders){
            if(err){
                return callback(err);
            }
            callback(null,{
                offers: orders,
                exist: count > data.page*config_common.entry_per_page,
                count: count
            });
        });
    });
};
//批量编辑
exports.editList = function(data,callback){
    DB.edit(data,callback);
};
//批量更新
exports.updateList = function(data,callback){
    DB.update(data,callback);
};
exports.onlyList = function(data,callback){
    DB.getList(data,callback);
};
exports.onlyAdd = function(data,callback){
    DB.add(data,callback);
};
//统计
exports.getAggregate = function(data, callback){
    DB.group(data, callback);
};
//相似检查
exports.check=function(){

};
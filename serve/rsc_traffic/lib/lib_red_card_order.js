/*
* */
var async = require('async');
var http = require('../lib/http');
var util = require('../lib/util');
var config_api_url = require('../configs/config_api_url');
var config_common = require('../configs/config_common');
var DB = require('../dbs/db_base')('RedCardOrder');
var tipSV=require('../lib/lib_tip');
var extServer=require('../lib/lib_ext_server');
var _=require('underscore')

/**
 * 增删改查
 */
exports.add = function(data,callback){
    DB.add(data,callback);
};
//删除记录
exports.del = function(data,callback){
    DB.del(data,callback);
};

//依据条件修改原表数据
exports.edit = function(data,callback){
    DB.edit(data,callback);
};

//依据条件查询单个表详情
exports.getOne = function(data, callback){
    DB.getOne(data,callback);
};

/**
 * 扩展
 */
//通过id查询
exports.getById = function(data, callback){
    DB.getById(data,callback);
};
//获取表数量
exports.getCount = function(data, callback){
    DB.getCount(data, callback);
};
//获取分页数据
exports.getList = function(data, callback, req){
    var result = {count: 0, lists: [], exist: false};
    async.waterfall([
        function (cb) {
            DB.getCount(data.find, cb);
        }, function (count, cb) {
            result.count = count;
            result.exist = count > data.page * config_common.entry_per_page;
            DB.getList(data, cb);
        }, function (lists, cb) {
            async.eachSeries(lists, function (list, cb1) {
                var demandOne = list.toObject();
                extServer.userFind(
                    // req && req.decoded && req.decoded.role==config_common.user_roles.TRAFFIC_ADMIN ? {user_id: list.user_id} : {user_id: list.send_user_id}, function(err, user){
                    req && req.decoded && config_common.accessRule.pass.indexOf(req.decoded.role)> -1 ? {user_id: list.user_id} : {user_id: list.send_user_id}, function(err, user){


                    if(!err){
                        demandOne = _.extend(demandOne, user);
                    }
                    result.lists.push(demandOne);
                    cb1();
                });
            }, cb);
        }
    ], function (err) {
        if(err){
            return callback(err);
        }
        callback(null, result);
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
    DB.save(data,callback);
};
//相似检查
exports.check=function(){

};
exports.tipGetOne=function(req, cond, flag, callback){
    var condV=cond;
  async.waterfall([
      function (cb) {
          tipSV.getTime({
              user_id: req.decoded.id,
              type: config_common.tip_type.red_card_order
          }, false, cb)
      },function(tipTime, cb){

          if(tipTime){
              condV.time_creation = {$gte: tipTime.update_time};
          }
          DB.getList({find:condV}, cb)
      }
  ], callback)  
};
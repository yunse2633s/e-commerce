/**
 * by Administrator 20170410
 */
var _ = require('underscore');
var async = require('async');
var http = require('../lib/http');
var util = require('../lib/util');
var config_api_url = require('../configs/config_api_url');
var config_common = require('../configs/config_common');
var DB = require('../dbs/db_base')('TrafficPlan');
var trafficDemandSV = require('../lib/lib_traffic_demand');


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
exports.getList = function(data, callback){

    var planList = {};
    async.waterfall([
        function (cb) {
            DB.getCount(data.find,function(err,count){
                if(err){
                    return callback(err);
                }
                DB.getList(data,function(err, orders){
                    if(err){
                        return callback(err);
                    }
                    cb(null,{
                        orders: orders,
                        exist: count > data.page*config_common.entry_per_page,
                        count: count
                    });
                });
            });
        },function (list, cb) {
            planList.count=list.count;
            planList.exist=list.exist;
            planList.orders=[];
            if(list.orders.length>0){
                async.eachSeries(list.orders, function (order, cb1) {
                    var planOne = order.toObject();
                    trafficDemandSV.getDemandOne({
                        find: {_id: order.demand_id}
                    }, function (err, demand) {
                        if(demand){
                            planOne.demand = demand;
                            planList.orders.push(planOne);
                            cb1();
                        }else{
                            order.status = config_common.demand_status.cancelled;
                            order.save(function(){});
                            cb1();
                        }
                    })
                }, cb);
            }else{
                cb();
            }
        }
    ], function () {
        callback(null, planList)
    })
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
exports.getAggregate = function(data, callback){
    DB.group(data, callback);
};

exports.specialList = function(data, callback, req){
    //new
    var result = {count: 0, lists: [], exist: false};
    async.waterfall([
        function (cb) {
            data.sort = {time_creation: -1, sorting: 1};
            DB.getCount(data.find,function(err,count){
                if(err){
                    return cb(err);
                }
                DB.getList(data,function(err, orders){
                    if(err){
                        return cb(err);
                    }
                    cb(null,{
                        orders: JSON.parse(JSON.stringify(orders)),
                        exist: count > data.page*config_common.entry_per_page,
                        count: count
                    });
                });
            });
        }, function (lists, cb) {
            result.count = lists.count;
            result.exist = lists.exist;
            async.eachSeries(lists.orders, function (order, cb1) {
                trafficDemandSV.getDemandOne({
                    find: {_id: order.demand_id}
                }, function (err, demandInfo) {
                    if(demandInfo){
                        result.lists.push( _.extend(order, {demand: demandInfo}));
                        cb1();
                    }else{
                        order.status = config_common.demand_status.cancelled;
                        order.save(function(){});
                        cb1();
                    }
                })
            }, cb);
        }
    ], function (err) {
        if(err){
            return callback(err);
        }
        callback(null, result);
    });

};
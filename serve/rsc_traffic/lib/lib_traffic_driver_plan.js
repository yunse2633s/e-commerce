/**
 * by Administrator 20170410
 */
var async = require('async');
var _ = require('underscore');
var http = require('../lib/http');
var util = require('../lib/util');
var config_api_url = require('../configs/config_api_url');
var config_common = require('../configs/config_common');
var DB = require('../dbs/db_base')('TrafficDriverPlan');
var driverDemandDB = require('../dbs/db_base')('TrafficDriverDemand');
var extServer = require('../lib/lib_ext_server');

/**
 * 增删改查
 */
exports.add = function(data, callback){
    DB.add(data,callback);
};
//删除记录
exports.del = function(data, callback){
    DB.del(data,callback);
};

//依据条件修改原表数据
exports.edit = function(data, callback){
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
    DB.getCount(data.find,function(err,count){
        if(err){
            return callback(err);
        }
        DB.getList(data,function(err, orders){
            if(err){
                return callback(err);
            }
            callback(null,{
                orders: orders,
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
    DB.save(data,callback);
};
//相似检查
exports.check=function(){

};
//统计
exports.getAggregate = function(data, callback){
    DB.group(data, callback);
};
//主页面统一调用，只传条件
exports.specialList = function(data, callback, req){
    var plan_result = {lists:[], count: 0, exist: 0};
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
        }, 
        function (lists, cb) {
            plan_result['count'] = lists.count ;
            plan_result['lists'] = [];
            plan_result['exist'] = lists.exist;
            async.eachSeries(lists.orders, function (list, cb1) {
                var plan_obj = list;
                async.waterfall([
                    function (cb10) {
                        //检查认证关系
                        driverDemandDB.getById({find: list.demand_id}, function (err, demandOne) {
                            if(err || !demandOne){
                                return cb1();
                            }
                            if(!demandOne.demand_company_id){
                                cb10(null, _.extend(demandOne.toObject(), {is_relation: false}))
                            }
                            extServer.generalFun(req, {
                                source: 'user',
                                db:'Driver_verify',
                                method:'getList',
                                query: {
                                    find: {
                                        user_id: req.decoded.id,
                                        company_id: demandOne.demand_company_id
                                    },
                                    select: 'company_id'
                                }
                            }, function (err, valid) {
                                cb10(null, _.extend(demandOne.toObject(), {is_relation: valid && valid.length > 0 ? true : false}));
                            })
                        });
                    }, 
                    function (demand, cb10) {
                        //获取物流公司和人员信息
                        extServer.userFind({user_id: demand.demand_user_id}, function(err, user){
                            plan_obj['demandInfo'] = _.extend(demand, user || {});
                            plan_obj['demandInfo']['plan_count'] = plan_obj['demandInfo']['offer_count'];
                            plan_result['lists'].push(plan_obj);
                            cb10();
                        });
                    }
                ], cb1);
            }, function () {
                cb(null, plan_result)
            });
        }
    ], callback)

};
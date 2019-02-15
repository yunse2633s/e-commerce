/**
 * Created by Administrator on 2017/2/20.
 */

var async = require('async');

// var db_company_dynamic = require('../dbs/db_base')('Company_dynamic');
// var db_company_dynamic_praise = require('../dbs/db_base')('Company_dynamic_praise');

var config_common = require('../configs/config_common');
var config_api_url = require('../configs/config_api_url');

var lib_util = require('./lib_util');
var lib_user = require('./lib_user');
var lib_http = require('./lib_http');

var typeCode = {
    // msg: 'msg',                                             //动态消息
    company_des: 'company_des',                          //编辑公司简介
    traffic_line: 'traffic_line',                       //物流线路报价
    traffic_demand: 'traffic_demand',                  //物流需求单
    traffic_driver_demand: 'traffic_driver_demand',  //司机需求单
    traffic_order_confirm: 'traffic_order_confirm', //物流确认接单
    trade_order_confirm: 'trade_order_confirm',     //确认交易订单
    trade_pricing: 'trade_pricing',                   //交易报价
    trade_demand: 'trade_demand'                      //交易需求单
};
exports.typeCode = typeCode;

//获取最新公司动态(无动态消息)
exports.get = function(company_id, user_id, page, callback){
    async.waterfall([
        function(cb){
            db_company_dynamic.getList({
                find: {company_id: company_id, type: {$nin: [typeCode.msg]}},
                sort: {time_creation: -1},
                limit: config_common.entry_per_page,
                skip: config_common.entry_per_page * (page - 1)
            }, cb);
        },
        function(dynamics, cb){
            var arr = [];
            async.eachSeries(dynamics, function(dynamic, eachCb){
                async.waterfall([
                    function(waterCb){
                    //     db_company_dynamic_praise.getCount({dynamic_id: dynamic._id.toString()}, waterCb);
                    // },
                    // function(count, waterCb){
                        dynamic = dynamic.toObject();
                        // dynamic.count = count;
                        db_company_dynamic_praise.getCount({dynamic_id: dynamic._id.toString(), user_id: user_id}, waterCb);
                    },
                    function(count, waterCb){
                        dynamic.isPraised = !!count; //true表示点过赞
                        dynamic.time_long = lib_util.getTimeLongStr(dynamic.time_creation);
                        waterCb();
                    },
                    function (waterCb) {
                        db_company_dynamic_praise.getList({
                            find:{dynamic_id: dynamic._id.toString()}
                        }, waterCb);
                    },
                    function (praises, waterCb) {
                        var user_ids = lib_util.transObjArrToSigArr(praises, 'user_id');
                        lib_user.getList({
                            find: {_id: {$in: user_ids}},
                            select: 'real_name'
                        }, waterCb);
                    },
                    function (users, waterCb) {
                        dynamic.users = users;
                        arr.push(dynamic);
                        lib_user.getOne({
                            find: {_id: dynamic.user_id},
                            select: 'real_name photo_url post role'
                        }, waterCb);
                    },
                    function (user, waterCb) {
                        dynamic.user = user;
                        waterCb();
                    }
                ], eachCb);
            }, function(err){
                if(err){
                    return cb(err);
                }
                cb(null, arr);
            });
        }
    ], callback);
};

//获取公司动态总数(无动态消息)
exports.getCountAll = function(company_id, callback){
    async.waterfall([
        function(cb){
            db_company_dynamic.getCount(
                {company_id: company_id, type: {$nin: [typeCode.msg]}},
                cb);
        }
    ], callback);
};

//获取最新公司消息动态
exports.getMsgNewest = function(company_id, user_id, callback){
    var msgData;
    async.waterfall([
        function(cb){
            db_company_dynamic.getList({
                find: {company_id: company_id, type: typeCode.msg},
                sort: {time_creation: -1},
                limit: 1
            }, cb);
        },
        function(msg, cb){
            if(!msg[0]){
                return cb(null, 0);
            }
            msgData = msg[0].toObject();
            db_company_dynamic_praise.getCount({dynamic_id: msgData._id.toString()}, cb);
        },
        function(count, cb){
            if(msgData){
                msgData.count = count;
                db_company_dynamic_praise.getCount({dynamic_id: msgData._id.toString(), user_id: user_id}, cb);
            }else{
                cb(null, 0)
            }
        },
        function(count, cb){
            if(msgData){
                msgData.isPraised = !!count; //true表示点过赞
            }
            cb(null, msgData);
        }
    ], callback);
};

//增加公司动态
exports.add = function(data, callback){
    lib_http.sendDynamicServer(data, config_api_url.dynamic_server_company_dynamic_add, callback);
};

//增加动态点赞
exports.addPraise = function(dynamic_id, user_id, callback){
    async.waterfall([
        function(cb){
            db_company_dynamic.getOne({
                find: {
                    _id: dynamic_id
                }
            }, cb);
        },
        function(dynamic, cb){
            if(dynamic){
                db_company_dynamic_praise.getCount({dynamic_id: dynamic_id, user_id: user_id}, cb);
            }else{
                cb('not_found');
            }
        },
        function(count, cb){
            if(count){
                return cb('already_exist');
            }
            db_company_dynamic_praise.add({dynamic_id: dynamic_id, user_id: user_id}, cb);
        }
    ], callback);
};
/**
 * Created by Administrator on 2016/2/25.
 */
var async = require('async');
var _ = require('underscore');
var util = require('./lib_util');
var http = require('./lib_http');
var Truck = require('../models/Truck');
var DriverVerify = require('../models/Driver_verify');
var TruckGroupRelation = require('../models/Relation_group_user');
var config_common = require('../configs/config_common');
var config_api_url = require('../configs/config_api_url');
var User_traffic = require('../models/User_traffic');

var db_model = require('../dbs/db_base')('Truck');
var db_driver_verify = require('../dbs/db_base')('Driver_verify');
var db_truck_group_relation = require('../dbs/db_base')('Relation_group_user');

exports.getList = function (data, cb) {
    db_model.getList(data, cb);
};

exports.getCount = function (data, cb) {
    db_model.getCount(data, cb);
};

exports.getOne = function (data, cb) {
    db_model.getOne(data, cb);
};

exports.add = function (data, cb) {
    db_model.add(data, cb);
};

//公司全部车辆
exports.getCompanyTruckAll = function(company_id, callback) {
    var self = this;
    this.getCompanyTruck(company_id, function(err, trucks1){
        if(err){
            return callback(err);
        }
        self.getDriverTruck(company_id, function(err, trucks2){
            if(err){
                return callback(err);
            }
            callback(null, trucks1.concat(trucks2));
        });
    });
};

//公司所有可用车辆
exports.getCompanyTruckUseAll = function(req, company_id, callback) {
    var self = this;
    async.waterfall([
        function(cb){
            self.getCompanyTruckAll(company_id, cb);
        },
        function(trucks, cb){
            var truck_ids = util.transObjArrToSigArr(trucks, '_id');
            var truckObj = util.transObjArrToObj(trucks, '_id');
            http.sendTrafficServer({truck_ids: truck_ids}, config_api_url.get_used_truck_path, function(err, routes){
                if(err){
                    return cb(err);
                }
                var busy_truck_ids = routes.length > 0 ? _.map(routes, function(data){return data.truck_id.toString()}) : [];
                for(var i = 0; i < busy_truck_ids.length; i++){
                    delete truckObj[busy_truck_ids[i]];
                }
                cb(null, _.values(truckObj));
            });
        }
    ],function(err, trucks){
        if(err){
            return callback(err);
        }
        callback(null, trucks);
    });
};

//公司所有忙碌车辆
exports.getCompanyTruckUsedAll = function(req, company_id, callback) {
    var self = this;
    async.waterfall([
        function(cb){
            self.getCompanyTruckAll(company_id, cb);
        },
        function(trucks, cb){
            var truck_ids = util.transObjArrToSigArr(trucks, '_id');
            var truckObj = util.transObjArrToObj(trucks, '_id');
            http.sendTrafficServer({truck_ids: truck_ids}, config_api_url.get_used_truck_path, function(err, routes){
                if(err){
                    return cb(err);
                }
                var busy_truck_ids = routes.length > 0 ? _.map(routes, function(data){return data.truck_id.toString()}) : [];
                var busyObj = {};
                for(var i = 0; i < busy_truck_ids.length; i++){
                    busyObj[busy_truck_ids[i]] = truckObj[busy_truck_ids[i]];
                }
                cb(null, _.values(busyObj));
            });
        }
    ],function(err, trucks){
        if(err){
            return callback(err);
        }
        callback(null, trucks);
    });
};

//公司自有车辆
exports.getCompanyTruck = function(company_id, callback){
    async.waterfall([
        function(cb) {
            Truck.find({create_company_id: company_id}, function(err, trucks){
                if(err){
                    return cb(err);
                }
                cb(null, trucks);
            });
        }
    ],function(err, result){
        if(err){
            return callback(err);
        }
        callback(null, result);
    });
};

//公司挂靠车辆
exports.getDriverTruck = function(company_id, callback) {
    async.waterfall([
        function(cb){
            DriverVerify.find({
                company_id: company_id,
                status: config_common.verification_phase.SUCCESS
            },function(err, verifies){
                if (err) {
                    return cb(err);
                }
                cb(null, util.transObjArrToSigArr(verifies, 'user_id'));
            });
        },
        function (user_ids, cb) {
            Truck.find({create_user_id: {$in:user_ids}}, function (err, trucks) {
                if (err) {
                    return cb(err);
                }
                cb(null, trucks);
            });
        }
    ], function (err, result) {
        if (err) {
            return callback(err);
        }
        callback(null, result);
    });
};

//公司挂靠司机手机号
exports.getDriverPhone = function(company_id, callback) {
    async.waterfall([
        function(cb){
            DriverVerify.find({
                company_id: company_id,
                status: config_common.verification_phase.SUCCESS
            },function(err, verifies){
                if (err) {
                    return cb(err);
                }
                cb(null, util.transObjArrToSigArr(verifies, 'user_id'));
            });
        },
        function (user_ids, cb) {
            User_traffic.find({_id: {$in:user_ids}}, function (err, trucks) {
                if (err) {
                    return cb(err);
                }
                cb(null, util.transObjArrToSigArr(trucks, 'phone'));
            });
        }
    ], function (err, result) {
        if (err) {
            return callback(err);
        }
        callback(null, result);
    });
};

//公司挂靠可用车辆(传order_id表示此笔订单未进行中车辆，不代表这些车辆没在运输其它订单，要是取空闲车辆不传order_id)
exports.getDriverTruckUse = function(req, company_id, callback, order_id) {
    var self = this;
    async.waterfall([
        function(cb){
            self.getDriverTruck(company_id, cb);
        },
        function(trucks, cb){
            var truck_ids = util.transObjArrToSigArr(trucks, '_id');
            var truckObj = util.transObjArrToObj(trucks, '_id');
            http.sendTrafficServer({truck_ids: truck_ids, order_id: order_id}, config_api_url.get_used_truck_path, function(err, routes){
                if(err){
                    return cb(err);
                }
                var busy_truck_ids = routes.length > 0 ? _.map(routes, function(data){return data.truck_id.toString()}) : [];
                for(var i = 0; i < busy_truck_ids.length; i++){
                    delete truckObj[busy_truck_ids[i]];
                }
                cb(null, _.values(truckObj));
            });
        }
    ],function(err, trucks){
        if(err){
            return callback(err);
        }
        callback(null, trucks);
    });
};

//公司自有可用车辆
exports.getCompanyTruckUse = function(req, company_id, callback, order_id) {
    var self = this;
    async.waterfall([
        function(cb){
            self.getCompanyTruck(company_id, cb);
        },
        function(trucks, cb){
            var truck_ids = util.transObjArrToSigArr(trucks, '_id');
            var truckObj = util.transObjArrToObj(trucks, '_id');
            http.sendTrafficServer({truck_ids: truck_ids, order_id: order_id}, config_api_url.get_used_truck_path, function(err, routes){
                if(err){
                    return cb(err);
                }
                var busy_truck_ids = routes.length > 0 ? _.map(routes, function(data){return data.truck_id.toString()}) : [];
                for(var i = 0; i < busy_truck_ids.length; i++){
                    delete truckObj[busy_truck_ids[i]];
                }
                cb(null, _.values(truckObj));
            });
        }
    ],function(err, trucks){
        if(err){
            return callback(err);
        }
        callback(null, trucks);
    });
};

//公司自有忙碌车辆
exports.getCompanyTruckUsed = function(req, company_id, callback) {
    var self = this;
    async.waterfall([
        function(cb){
            self.getCompanyTruck(company_id, cb);
        },
        function(trucks, cb){
            var truck_ids = util.transObjArrToSigArr(trucks, '_id');
            var truckObj = util.transObjArrToObj(trucks, '_id');
            http.sendTrafficServer({truck_ids: truck_ids}, config_api_url.get_used_truck_path, function(err, routes){
                if(err){
                    return cb(err);
                }
                var busy_truck_ids = routes.length > 0 ? _.map(routes, function(data){return data.truck_id.toString()}) : [];
                var busyObj = {};
                for(var i = 0; i < busy_truck_ids.length; i++){
                    busyObj[busy_truck_ids[i]] = truckObj[busy_truck_ids[i]];
                }
                cb(null, _.values(busyObj));
            });
        }
    ],function(err, trucks){
        if(err){
            return callback(err);
        }
        callback(null, trucks);
    });
};

//公司挂靠忙碌车辆
exports.getDriverTruckUsed = function(req, company_id, callback) {
    var self = this;
    async.waterfall([
        function(cb){
            self.getDriverTruck(company_id, cb);
        },
        function(trucks, cb){
            var truck_ids = util.transObjArrToSigArr(trucks, '_id');
            var truckObj = util.transObjArrToObj(trucks, '_id');
            http.sendTrafficServer({truck_ids: truck_ids}, config_api_url.get_used_truck_path, function(err, routes){
                if(err){
                    return cb(err);
                }
                var busy_truck_ids = routes.length > 0 ? _.map(routes, function(data){return data.truck_id.toString()}) : [];
                var busyObj = {};
                for(var i = 0; i < busy_truck_ids.length; i++){
                    busyObj[busy_truck_ids[i]] = truckObj[busy_truck_ids[i]];
                }
                cb(null, _.values(busyObj));
            });
        }
    ],function(err, trucks){
        if(err){
            return callback(err);
        }
        callback(null, trucks);
    });
};

//公司自有未派单车辆
exports.getCompanyTruckNotPlan = function(req, company_id, order_id, callback) {
    var self = this;
    async.waterfall([
        function(cb){
            self.getCompanyTruck(company_id, cb);
        },
        function(trucks, cb){
            var truck_ids = util.transObjArrToSigArr(trucks, '_id');
            var truckObj = util.transObjArrToObj(trucks, '_id');
            http.sendTrafficServer({truck_ids: truck_ids, order_id: order_id}, config_api_url.traffic_server_plan_get_used_truck_path, function(err, routes){
                if(err){
                    return cb(err);
                }
                var busy_truck_ids = routes.length > 0 ? _.map(routes, function(data){return data.truck_id.toString()}) : [];
                for(var i = 0; i < busy_truck_ids.length; i++){
                    delete truckObj[busy_truck_ids[i]];
                }
                cb(null, _.values(truckObj));
            });
        }
    ],function(err, trucks){
        if(err){
            return callback(err);
        }
        callback(null, trucks);
    });
};

//公司挂靠未派单车辆
exports.getDriverTruckNotPlan = function(req, company_id, order_id, callback) {
    var self = this;
    async.waterfall([
        function(cb){
            self.getDriverTruck(company_id, cb);
        },
        function(trucks, cb){
            var truck_ids = util.transObjArrToSigArr(trucks, '_id');
            var truckObj = util.transObjArrToObj(trucks, '_id');
            http.sendTrafficServer({truck_ids: truck_ids, order_id: order_id}, config_api_url.traffic_server_plan_get_used_truck_path, function(err, routes){
                if(err){
                    return cb(err);
                }
                var busy_truck_ids = routes.length > 0 ? _.map(routes, function(data){return data.truck_id.toString()}) : [];
                for(var i = 0; i < busy_truck_ids.length; i++){
                    delete truckObj[busy_truck_ids[i]];
                }
                cb(null, _.values(truckObj));
            });
        }
    ],function(err, trucks){
        if(err){
            return callback(err);
        }
        callback(null, trucks);
    });
};

//某组车辆
exports.getGroupTruck = function(company_id, group_id, type, callback) {
    var self = this;
    async.waterfall([
        function(cb){
            var cond = {company_id: company_id};
            if(group_id){
                cond.group_id = group_id;
            }
            TruckGroupRelation.find(cond, cb);
        },
        function(relations, cb){
            var cond = {};
            if(group_id){
                var truck_ids = util.transObjArrToSigArr(relations, 'truck_id');
                cond._id = {$in: truck_ids};
                Truck.find(cond, cb);
            }else{
                var func;
                if(type == config_common.truck_group_type.PUBLIC){
                    func = self.getCompanyTruck;
                }else{
                    func = self.getDriverTruck;
                }
                var truckObj = util.transObjArrToObj(relations, 'truck_id');
                func(company_id, function(err, trucks){
                    var arr = [];
                    for(var i = 0; i < trucks.length; i++){
                        if(!truckObj[trucks[i]._id]){
                            arr.push(trucks[i]);
                        }
                    }
                    cb(null, arr);
                });
            }
        }
    ], function(err, data){
        if(err){
            return callback(err);
        }
        callback(null, data);
    });
};

//默认组车辆
exports.getGroupDefault = function(company_id, callback) {
    var user_ids;
    async.waterfall([
        function(cb){
            db_driver_verify.getList({find: {company_id: company_id}}, cb);
        },
        function(verifies, cb){
            user_ids = global.lib_util.transObjArrToSigArr(verifies, 'user_id');
            db_truck_group_relation.getList({find: {company_id: company_id}}, cb);
        },
        function (relations, cb) {
            var truck_ids = global.lib_util.transObjArrToSigArr(relations, 'truck_id');
            db_model.getList({find: {_id: {$nin: truck_ids}, create_user_id: {$in: user_ids}}}, cb);
        }
    ], function(err, data){
        if(err){
            return callback(err);
        }
        callback(null, data);
    });
};

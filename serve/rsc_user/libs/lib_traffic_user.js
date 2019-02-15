/**
 * Created by Administrator on 2016/3/4.
 */
var async = require('async');
var _ = require('underscore');
var util = require('./lib_util');
var http = require('./lib_http');
var TrafficUser = require('../models/User_traffic');
var config_common = require('../configs/config_common');
var config_api_url = require('../configs/config_api_url');

//公司自有司机
exports.getCompanyUser = function(company_id, callback){
    async.waterfall([
        function(cb) {
            TrafficUser.find({
                company_id: company_id,
                role: config_common.user_roles.TRAFFIC_DRIVER_PUBLISH
            }, function(err, users){
                if(err){
                    return cb(err);
                }
                cb(null, users);
            });
        }
    ],function(err, result){
        if(err){
            return callback(err);
        }
        callback(null, result);
    });
};

//公司自有可用司机
exports.getCompanyUserUse = function(req, company_id, callback, order_id) {
    var self = this;
    async.waterfall([
        function(cb){
            self.getCompanyUser(company_id, cb);
        },
        function(trucks, cb){
            var truck_ids = util.transObjArrToSigArr(trucks, '_id');
            var truckObj = util.transObjArrToObj(trucks, '_id');
            http.sendTrafficServerNoToken(req, {user_id: truck_ids, order_id: order_id}, config_api_url.get_by_user_ids, function(err, routes){
                if(err){
                    return cb(err);
                }
                var busy_truck_ids = routes.length > 0 ? _.map(routes, function(data){return data.user_id.toString()}) : [];
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

//公司自有未派单司机
exports.getCompanyUserNotPlan = function(req, company_id, order_id, callback) {
    var self = this;
    async.waterfall([
        function(cb){
            self.getCompanyUser(company_id, cb);
        },
        function(trucks, cb){
            var truck_ids = util.transObjArrToSigArr(trucks, '_id');
            var truckObj = util.transObjArrToObj(trucks, '_id');
            http.sendTrafficServerNoToken(req, {user_id: truck_ids, order_id: order_id}, config_api_url.traffic_server_plan_get_by_user_ids, function(err, routes){
                if(err){
                    return cb(err);
                }
                var busy_truck_ids = routes.length > 0 ? _.map(routes, function(data){return data.user_id.toString()}) : [];
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
/**
 * Created by Administrator on 2016/5/14.
 */
var _ = require('underscore');
var async = require('async');
var express = require('express');
var http = require('../../libs/lib_http');
var util = require('../../libs/lib_util');
var truckService = require('../../libs/lib_truck');
var Truck = require('../../models/Truck');
var DriverVerify = require('../../models/Driver_verify');
var TruckGroup = require('../../models/Relation_group');
var TruckGroupRelation = require('../../models/Relation_group_user');
var config_common = require('../../configs/config_common');
var config_server = require('../../configs/config_server');

module.exports = function() {
    var api = express.Router();

    api.use(require('../../middlewares/mid_verify_user')());

    // api.post('/judge',function(req, res, next) {
    //     async.waterfall([
    //         function (cb) {
    //             Truck.findOne({user_id: req.decoded.id}, cb);
    //         },
    //         function (truck,cb) {
    //             var status = false;
    //             if(truck){
    //                 if(truck.xing_shi_zheng_url){
    //                     status = true;
    //                 }
    //             }
    //             cb(null,status);
    //         }
    //     ],function (err,status) {
    //         if(err) return next(err);
    //         config_common.sendData(req, status, next);
    //     });
    // });
    //
    // api.post('/add',function(req, res, next) {
    //     if(!req.body.name ||
    //         !config_common.checkTruckGroupType(req.body.type)){
    //         return next('invalid_format');
    //     }
    //     if(req.decoded.role !== config_common.user_roles.TRAFFIC_ADMIN){
    //         return next('not_allow');
    //     }
    //     async.waterfall([
    //         function(cb){
    //             TruckGroup.count({
    //                 company_id: req.decoded.company_id,
    //                 type: req.body.type
    //             }, cb);
    //         },
    //         function(count, cb){
    //             if(count >= config_common.truck_group_number){
    //                 return cb('not_allow');
    //             }
    //             var group = new TruckGroup({
    //                 name: req.body.name,            //名称
    //                 type: req.body.type,            //组类型
    //                 company_id: req.decoded.company_id     //所属公司id
    //             });
    //             group.save(cb);
    //         }
    //     ], function(err, data){
    //         if(err){
    //             return next(err);
    //         }
    //         config_common.sendData(req, data, next);
    //     });
    // });
    //
    // api.post('/dec',function(req, res, next) {
    //     if(req.decoded.role !== config_common.user_roles.TRAFFIC_ADMIN){
    //         return next('not_allow');
    //     }
    //     if(!req.body.group_id){
    //         return next('invalid_format');
    //     }
    //     var group_id;
    //     async.waterfall([
    //         function(cb){
    //             TruckGroup.findById(req.body.group_id, cb);
    //         },
    //         function(group, cb){
    //             if(!group){
    //                 return cb();
    //             }
    //             group_id = group._id.toString();
    //             if(group.company_id !== req.decoded.company_id){
    //                 return cb('not_allow');
    //             }
    //             group.remove(cb);
    //         },
    //         function(number, cb){
    //             TruckGroupRelation.remove({group_id: group_id}, cb);
    //         }
    //     ], function(err){
    //         if(err){
    //             return next(err);
    //         }
    //         config_common.sendData(req, {}, next);
    //     });
    // });
    //
    // api.post('/edit',function(req, res, next) {
    //     if(req.decoded.role !== config_common.user_roles.TRAFFIC_ADMIN){
    //         return next('not_allow');
    //     }
    //     if(!req.body.group_id ||
    //         !req.body.name){
    //         return next('invalid_format');
    //     }
    //     async.waterfall([
    //         function(cb){
    //             TruckGroup.findById(req.body.group_id, cb);
    //         },
    //         function(group, cb){
    //             if(!group){
    //                 return cb('not_found');
    //             }
    //             if(group.company_id !== req.decoded.company_id){
    //                 return cb('not_allow');
    //             }
    //             group.name = req.body.name;
    //             group.save(cb);
    //         }
    //     ], function(err, result){
    //         if(err){
    //             return next(err);
    //         }
    //         config_common.sendData(req, result, next);
    //     });
    // });
    //
    // api.post('/get_list', function (req, res, next) {
    //     var result = [];
    //     var user_ids = [];
    //     async.waterfall([
    //         function (cb) {
    //             global.lib_truck_group.getList({
    //                 find: {company_id: req.decoded.company_id, type: global.config_common.truck_group_type.PRIVATE}
    //             }, cb);
    //         },
    //         function (groups, cb) {
    //             var groupObj = global.lib_util.transObjArrToObj(groups, '_id');
    //             async.each(groups, function(group, eachCb){
    //                 global.lib_truck_group_relation.getCount({group_id: group._id}, function(err, count){
    //                     if(err){
    //                         return eachCb(err);
    //                     }
    //                     if(groupObj[group._id]){
    //                         groupObj[group._id].count = count;
    //                     }
    //                     eachCb();
    //                 });
    //             },function(err){
    //                 if(err){
    //                     return cb(err);
    //                 }
    //                 cb(null, _.values(groupObj));
    //             });
    //         },
    //         function (arr, cb) {
    //             result = arr;
    //             global.lib_driver_verify.getList({find: {company_id: req.decoded.company_id}}, cb);
    //         },
    //         function(verifies, cb) {
    //             user_ids = global.lib_util.transObjArrToSigArr(verifies, 'user_id');
    //             global.lib_user.getList({find: {_id: {$in: user_ids}}}, cb);
    //         },
    //         function(users, cb){
    //             global.lib_truck_group_relation.getList({find: {company_id: req.decoded.company_id}}, cb);
    //         },
    //         function (relations, cb) {
    //             var truck_ids = global.lib_util.transObjArrToSigArr(relations, 'truck_id');
    //             global.lib_truck.getCount({_id: {$nin: truck_ids}, create_user_id: {$in: user_ids}}, cb);
    //         },
    //         function(count, cb){
    //             result.unshift({
    //                 name: '默认组',
    //                 type: global.config_common.truck_group_type.PRIVATE,
    //                 count: count,
    //                 company_id: req.decoded.company_id
    //             });
    //             cb();
    //         }
    //     ], function (err) {
    //         if(err){
    //             return next(err);
    //         }
    //         global.config_common.sendData(req, result, next);
    //     });
    // });
    //
    // api.post('/get', function(req, res, next){
    //     if(req.decoded.role !== config_common.user_roles.TRAFFIC_ADMIN){
    //         return next('not_allow');
    //     }
    //     async.waterfall([
    //         function(cb){
    //             TruckGroup.find({
    //                 company_id: req.decoded.company_id,
    //                 type: req.body.type
    //             }, cb);
    //         },
    //         function(groups, cb){
    //             var groupObj = util.transObjArrToObj(groups, '_id');
    //             async.each(groups, function(group, eachCb){
    //                 TruckGroupRelation.count({group_id: group._id}, function(err, count){
    //                     if(err){
    //                         return eachCb(err);
    //                     }
    //                     if(groupObj[group._id]){
    //                         groupObj[group._id].count = count;
    //                     }
    //                     eachCb();
    //                 })
    //             },function(err){
    //                 if(err){
    //                     return cb(err);
    //                 }
    //                 cb(null, _.values(groupObj));
    //             });
    //         }
    //     ], function(err, result){
    //         if(err){
    //             return next(err);
    //         }
    //         config_common.sendData(req, result, next);
    //     });
    // });
    //
    // api.post('/get_one', function(req, res, next){
    //     if(req.decoded.role !== config_common.user_roles.TRAFFIC_ADMIN){
    //         return next('not_allow');
    //     }
    //     if(!req.body.group_id){
    //         return next('invalid_format');
    //     }
    //     async.waterfall([
    //         function(cb){
    //             TruckGroup.findById(req.body.group_id, cb);
    //         }
    //     ], function(err, result){
    //         if(err){
    //             return next(err);
    //         }
    //         config_common.sendData(req, result, next);
    //     });
    // });
    //
    // api.post('/get_other', function(req, res, next){
    //     if(req.decoded.role !== config_common.user_roles.TRAFFIC_ADMIN){
    //         return next('not_allow');
    //     }
    //     async.waterfall([
    //         function(cb){
    //             var cond = {
    //                 company_id: req.decoded.company_id,
    //                 type: req.body.type
    //             };
    //             if(req.body.group_id){
    //                 cond._id = {$nin: [req.body.group_id]};
    //             }
    //             TruckGroup.find(cond, cb);
    //         }
    //     ], function(err, result){
    //         if(err){
    //             return next(err);
    //         }
    //         config_common.sendData(req, result, next);
    //     });
    // });
    //
    // api.post('/add_truck',function(req, res, next) {
    //     if(!req.body.group_id ||
    //         !req.body.truck_id){
    //         return next('invalid_format');
    //     }
    //     if(req.decoded.role !== config_common.user_roles.TRAFFIC_ADMIN){
    //         return next('not_allow');
    //     }
    //     var type;
    //     async.waterfall([
    //         function(cb){
    //             //车辆只能属于一个组不能同时在多个组
    //             TruckGroupRelation.count({
    //                 truck_id: {$in: req.body.truck_id},     //名称
    //                 company_id: req.decoded.company_id     //所属公司id
    //             }, function(err, count){
    //                 if(err){
    //                     return cb(err);
    //                 }
    //                 if(count){
    //                     return cb('not_allow');
    //                 }
    //                 cb();
    //             });
    //         },
    //         function(cb){
    //             TruckGroup.findById(req.body.group_id, cb);
    //         },
    //         function(group, cb){
    //             if(!group){
    //                 return cb('not_found');
    //             }
    //             if(group.company_id !== req.decoded.company_id){
    //                 return cb('not_allow');
    //             }
    //             type = group.type;
    //             Truck.find({_id: {$in:req.body.truck_id}}, cb);
    //         },
    //         function(trucks, cb){
    //             //检查被分配组车辆个数是否允许
    //             TruckGroupRelation.count({
    //                 group_id: req.decoded.group_id     //所属公司id
    //             }, function(err, count){
    //                 if(err){
    //                     return cb(err);
    //                 }
    //                 if(count+req.body.truck_id.length > config_common.truck_group_unit_number){
    //                     return cb('Maximum limit');
    //                 }
    //                 cb(null, trucks);
    //             });
    //         },
    //         function(trucks, cb){
    //             async.each(trucks, function(truck, eachCb){
    //                 async.waterfall([
    //                     function(callback){
    //                         if(truck.create_company_id == req.decoded.company_id &&
    //                             type == config_common.truck_group_type.PUBLIC){
    //                             callback();
    //                         }else if(type == config_common.truck_group_type.PRIVATE){
    //                             DriverVerify.count({
    //                                 company_id: req.decoded.company_id,
    //                                 user_id: truck.user_id,
    //                                 status: config_common.verification_phase.SUCCESS
    //                             }, function(err, count){
    //                                 if(err){
    //                                     return callback(err);
    //                                 }
    //                                 if(count == 0){
    //                                     return callback('not_allow');
    //                                 }
    //                                 callback();
    //                             });
    //                         }else{
    //                             return callback('not_allow');
    //                         }
    //                     },
    //                     function(callback){
    //                         var relation = new TruckGroupRelation({
    //                             company_id: req.decoded.company_id,
    //                             truck_id: truck._id.toString(),
    //                             group_id: req.body.group_id
    //                         });
    //                         relation.save(callback);
    //                     }
    //                 ], function(err){
    //                     if(err){
    //                         return eachCb(err);
    //                     }
    //                     eachCb();
    //                 });
    //             },function(err){
    //                 if(err){
    //                     return cb(err);
    //                 }
    //                 cb();
    //             });
    //         }
    //     ], function(err, data){
    //         if(err){
    //             return next(err);
    //         }
    //         config_common.sendData(req, data, next);
    //     });
    // });
    //
    // api.post('/dec_truck',function(req, res, next) {
    //     if(!req.body.group_id ||
    //         !req.body.truck_id){
    //         return next('invalid_format');
    //     }
    //     if(req.decoded.role !== config_common.user_roles.TRAFFIC_ADMIN){
    //         return next('not_allow');
    //     }
    //     async.waterfall([
    //         function(cb){
    //             TruckGroupRelation.remove({
    //                 company_id: req.decoded.company_id,
    //                 truck_id: {$in: req.body.truck_id},     //名称
    //                 group_id: req.body.group_id     //所属公司id
    //             }, cb);
    //         }
    //     ], function(err, data){
    //         if(err){
    //             return next(err);
    //         }
    //         config_common.sendData(req, data, next);
    //     });
    // });
    //
    // api.post('/get_truck',function(req, res, next) {
    //     if(req.decoded.role !== config_common.user_roles.TRAFFIC_ADMIN){
    //         return next('not_allow');
    //     }
    //     req.body.page = req.body.page ? req.body.page : 1;
    //     async.waterfall([
    //         function(cb){
    //             truckService.getGroupTruck(req.decoded.company_id, req.body.group_id, req.body.type, cb);
    //         }
    //     ], function(err, truck_arr){
    //         if(err){
    //             return next(err);
    //         }
    //         var pages = Math.floor(truck_arr.length/config_common.truck_group_per_page);
    //         if(truck_arr.length%config_common.truck_group_per_page){
    //             pages++;
    //         }
    //         var truck = truck_arr.slice((req.body.page-1)*config_common.truck_group_per_page, req.body.page*config_common.truck_group_per_page);
    //         var data = {truck:truck, pages:pages, count:truck_arr.length};
    //         config_common.sendData(req, data, next);
    //     });
    // });
    //
    // api.post('/get_default_count', function(req, res, next){
    //     if(req.decoded.role !== config_common.user_roles.TRAFFIC_ADMIN){
    //         return next('not_allow');
    //     }
    //     var total;
    //     async.waterfall([
    //         function(cb){
    //             if(req.body.type == config_common.truck_group_type.PRIVATE){
    //                 DriverVerify.count({
    //                     company_id: req.decoded.company_id,
    //                     status: config_common.verification_phase.SUCCESS
    //                 }, cb);
    //             }else{
    //                 Truck.count({create_company_id: req.decoded.company_id}, cb);
    //             }
    //         },
    //         function(count, cb){
    //             total = count;
    //             TruckGroup.find({
    //                 company_id: req.decoded.company_id,
    //                 type: req.body.type
    //             }, cb);
    //         },
    //         function(groups, cb){
    //             if(groups.length){
    //                 var group_ids = util.transObjArrToSigArr(groups, '_id');
    //                 TruckGroupRelation.count({group_id: {$in:group_ids}}, cb);
    //             }else{
    //                 cb(null, 0);
    //             }
    //         },
    //         function(count, cb){
    //             cb(null, total-count);
    //         }
    //     ], function(err, result){
    //         if(err){
    //             return next(err);
    //         }
    //         config_common.sendData(req, result, next);
    //     });
    // });
    //
    // //派车时获取默认组个数
    // api.post('/add_truck_get_default_count', function(req, res, next){
    //     if(req.decoded.role !== config_common.user_roles.TRAFFIC_ADMIN){
    //         return next('not_allow');
    //     }
    //     if(!req.body.order_id){
    //         return next('invalid_format');
    //     }
    //     var truck_arr;
    //     if(req.body.type == config_common.truck_group_type.PUBLIC){
    //         async.waterfall([
    //             function(cb){
    //                 truckService.getCompanyTruckUse(req, req.decoded.company_id, cb, req.body.order_id);
    //             },
    //             function(useTrucks, cb){
    //                 //truckService.getCompanyTruckNotPlan(req, req.decoded.company_id, req.body.order_id, function(err, planTrucks){
    //                 //    if(err){
    //                 //        return cb(err);
    //                 //    }
    //                 //    var useObj = util.transObjArrToObj(useTrucks, '_id');
    //                 //    var data = {};
    //                 //    for(var i = 0; i < (planTrucks).length; i++){
    //                 //        var truck = (planTrucks)[i];
    //                 //        if(useObj[truck._id]){
    //                 //            data[truck._id] = truck;
    //                 //        }
    //                 //    }
    //                 //    truck_arr = _.values(data);
    //                 //    truckService.getGroupTruck(req.decoded.company_id, null, req.body.type, cb);
    //                 //});
    //                 truck_arr = useTrucks;
    //                 truckService.getGroupTruck(req.decoded.company_id, null, req.body.type, cb);
    //             },
    //             function(trucks, cb){
    //                 var useObj = util.transObjArrToObj(trucks, '_id');
    //                 var data = {};
    //                 for(var i = 0; i < (truck_arr).length; i++){
    //                     var truck = (truck_arr)[i];
    //                     if(useObj[truck._id]){
    //                         data[truck._id] = truck;
    //                     }
    //                 }
    //                 cb(null, _.size(data));
    //             }
    //         ], function(err, result){
    //             if(err){
    //                 return next(err);
    //             }
    //             config_common.sendData(req, result, next);
    //         });
    //     }else{
    //         async.waterfall([
    //             function(cb){
    //                 //truckService.getDriverTruckUse(req, req.decoded.company_id, cb, req.body.order_id);
    //                 truckService.getDriverTruck(req.decoded.company_id, cb);
    //             },
    //             function(useTrucks, cb){
    //                 //truckService.getDriverTruckNotPlan(req, req.decoded.company_id, req.body.order_id, function(err, planTrucks){
    //                 //    if(err){
    //                 //        return cb(err);
    //                 //    }
    //                 //    var useObj = util.transObjArrToObj(useTrucks, '_id');
    //                 //    var data = {};
    //                 //    for(var i = 0; i < (planTrucks).length; i++){
    //                 //        var truck = (planTrucks)[i];
    //                 //        if(useObj[truck._id]){
    //                 //            data[truck._id] = truck;
    //                 //        }
    //                 //    }
    //                 //    truck_arr = _.values(data);
    //                 //    truckService.getGroupTruck(req.decoded.company_id, null, req.body.type, cb);
    //                 //});
    //                 truck_arr = useTrucks;
    //                 truckService.getGroupTruck(req.decoded.company_id, null, req.body.type, cb);
    //             },
    //             function(trucks, cb){
    //                 var useObj = util.transObjArrToObj(trucks, '_id');
    //                 var data = {};
    //                 for(var i = 0; i < (truck_arr).length; i++){
    //                     var truck = (truck_arr)[i];
    //                     if(useObj[truck._id]){
    //                         data[truck._id] = truck;
    //                     }
    //                 }
    //                 cb(null, _.size(data));
    //             }
    //         ], function(err, result){
    //             if(err){
    //                 return next(err);
    //             }
    //             config_common.sendData(req, result, next);
    //         });
    //     }
    // });
    //
    // //派车时获取组
    // api.post('/add_truck_get', function(req, res, next){
    //     if(req.decoded.role !== config_common.user_roles.TRAFFIC_ADMIN){
    //         return next('not_allow');
    //     }
    //     if(!req.body.order_id){
    //         return next('invalid_format');
    //     }
    //     async.waterfall([
    //         function(cb){
    //             TruckGroup.find({
    //                 company_id: req.decoded.company_id,
    //                 type: req.body.type
    //             }, cb);
    //         },
    //         function(groups, cb){
    //             var groupObj = util.transObjArrToObj(groups, '_id');
    //             var truck_arr;
    //             if(req.body.type == config_common.truck_group_type.PUBLIC){
    //                 async.each(groups, function(group, eachCb){
    //                     async.waterfall([
    //                         function(cb){
    //                             truckService.getCompanyTruckUse(req, req.decoded.company_id, cb, req.body.order_id);
    //                         },
    //                         function(useTrucks, cb){
    //                             //truckService.getCompanyTruckNotPlan(req, req.decoded.company_id, req.body.order_id, function(err, planTrucks){
    //                             //    if(err){
    //                             //        return cb(err);
    //                             //    }
    //                             //    var useObj = util.transObjArrToObj(useTrucks, '_id');
    //                             //    var data = {};
    //                             //    for(var i = 0; i < (planTrucks).length; i++){
    //                             //        var truck = (planTrucks)[i];
    //                             //        if(useObj[truck._id]){
    //                             //            data[truck._id] = truck;
    //                             //        }
    //                             //    }
    //                             //    truck_arr = _.values(data);
    //                             //    truckService.getGroupTruck(req.decoded.company_id, group._id, req.body.type, cb);
    //                             //});
    //                             truck_arr = useTrucks;
    //                             truckService.getGroupTruck(req.decoded.company_id, group._id, req.body.type, cb);
    //                         },
    //                         function(trucks, cb){
    //                             var useObj = util.transObjArrToObj(trucks, '_id');
    //                             var data = {};
    //                             for(var i = 0; i < (truck_arr).length; i++){
    //                                 var truck = (truck_arr)[i];
    //                                 if(useObj[truck._id]){
    //                                     data[truck._id] = truck;
    //                                 }
    //                             }
    //                             groupObj[group._id].count = _.size(data);
    //                             cb();
    //                         }
    //                     ],function(err){
    //                         if(err){
    //                             return eachCb(err);
    //                         }
    //                         eachCb();
    //                     });
    //                 },function(err){
    //                     if(err){
    //                         return cb(err);
    //                     }
    //                     cb(null, _.values(groupObj));
    //                 });
    //             }else{
    //                 async.each(groups, function(group, eachCb){
    //                     async.waterfall([
    //                         function(cb){
    //                             //truckService.getDriverTruckUse(req, req.decoded.company_id, cb, req.body.order_id);
    //                             truckService.getDriverTruck(req.decoded.company_id, cb);
    //                         },
    //                         function(useTrucks, cb){
    //                             //truckService.getDriverTruckNotPlan(req, req.decoded.company_id, req.body.order_id, function(err, planTrucks){
    //                             //    if(err){
    //                             //        return cb(err);
    //                             //    }
    //                             //    var useObj = util.transObjArrToObj(useTrucks, '_id');
    //                             //    var data = {};
    //                             //    for(var i = 0; i < (planTrucks).length; i++){
    //                             //        var truck = (planTrucks)[i];
    //                             //        if(useObj[truck._id]){
    //                             //            data[truck._id] = truck;
    //                             //        }
    //                             //    }
    //                             //    truck_arr = _.values(data);
    //                             //    truckService.getGroupTruck(req.decoded.company_id, group._id, req.body.type, cb);
    //                             //});
    //                             truck_arr = useTrucks;
    //                             truckService.getGroupTruck(req.decoded.company_id, group._id, req.body.type, cb);
    //                         },
    //                         function(trucks, cb){
    //                             var useObj = util.transObjArrToObj(trucks, '_id');
    //                             var data = {};
    //                             for(var i = 0; i < (truck_arr).length; i++){
    //                                 var truck = (truck_arr)[i];
    //                                 if(useObj[truck._id]){
    //                                     data[truck._id] = truck;
    //                                 }
    //                             }
    //                             groupObj[group._id].count = _.size(data);
    //                             cb();
    //                         }
    //                     ],function(err){
    //                         if(err){
    //                             return eachCb(err);
    //                         }
    //                         eachCb();
    //                     });
    //                 },function(err){
    //                     if(err){
    //                         return cb(err);
    //                     }
    //                     cb(null, _.values(groupObj));
    //                 });
    //             }
    //         }
    //     ], function(err, result){
    //         if(err){
    //             return next(err);
    //         }
    //         config_common.sendData(req, result, next);
    //     });
    // });

    return api;
};
/**
 * Created by Administrator on 2017/4/24.
 */
var async = require('async');
var _ = require('underscore');
var express = require('express');

module.exports = function () {

    var api = express.Router();

    api.use(require('../../middlewares/mid_verify_server')());

    api.post('/get_trucks_users', function (req, res, next) {
        if(!req.body.company_id){
            return next('invalid_format');
        }
        if(_.isArray(req.body.company_id)){
            req.body.company_id = req.body.company_id[0];
        }
        if (!_.isNumber(req.body.page)) {
            req.body.page = 1;
        }
        if(!req.body.group_id){
            var user_ids;
            var userObj;
            var truck_ids;
            var countData = 0;
            async.waterfall([
                function(cb){
                    global.lib_driver_verify.getList({find: {company_id: req.body.company_id}}, cb);
                },
                function(verifies, cb) {
                    user_ids = global.lib_util.transObjArrToSigArr(verifies, 'user_id');
                    global.lib_user.getList({find: {_id: {$in: user_ids}}}, cb);
                },
                function(users, cb){
                    userObj = global.lib_util.transObjArrToObj(users, '_id');
                    global.lib_truck_group_relation.getList({find: {company_id: req.body.company_id}}, cb);
                },
                function (relations, cb) {
                    truck_ids = global.lib_util.transObjArrToSigArr(relations, 'truck_id');
                    global.lib_truck.getCount({_id: {$nin: truck_ids}, create_user_id: {$in: user_ids}}, cb);
                },
                function(count, cb){
                    countData = count;
                    if(req.body.page == -1){
                        global.lib_truck.getList({
                            find: {_id: {$nin: truck_ids}, create_user_id: {$in: user_ids}}
                        }, cb);
                    }else{
                        global.lib_truck.getList({
                            find: {_id: {$nin: truck_ids}, create_user_id: {$in: user_ids}},
                            skip: (req.body.page - 1) * global.config_common.entry_per_page,
                            limit: global.config_common.entry_per_page
                        }, cb);
                    }
                },
                function (trucks, cb) {
                    var arr = [];
                    for (var i = 0; i < trucks.length; i++) {
                        var truck = trucks[i];
                        arr.push({
                            user: userObj[truck.create_user_id],
                            truck: truck
                        });
                    }
                    cb(null, {
                        list: arr,
                        count: countData,
                        exist: countData > req.body.page * global.config_common.entry_per_page
                    });
                }
            ], function(err, data){
                if(err){
                    return next(err);
                }
                global.config_common.sendData(req, data, next);
            });
        }else{
            var truckObj;
            var countData = 0;
            async.waterfall([
                function (cb) {
                    global.lib_truck_group_relation.getCount({group_id: req.body.group_id}, cb);
                },
                function (count, cb) {
                    countData = count;
                    if(req.body.page == -1){
                        global.lib_truck_group_relation.getList({
                            find: {group_id: req.body.group_id},
                            select: 'truck_id'
                        }, cb);
                    }else{
                        global.lib_truck_group_relation.getList({
                            find: {group_id: req.body.group_id},
                            select: 'truck_id',
                            skip: (req.body.page - 1) * global.config_common.entry_per_page,
                            limit: global.config_common.entry_per_page
                        }, cb);
                    }

                },
                function (relations, cb) {
                    var truck_ids = global.lib_util.transObjArrToSigArr(relations, 'truck_id');
                    global.lib_truck.getList({
                        find: {_id: {$in: truck_ids}}
                    }, cb);
                },
                function (trucks, cb) {
                    truckObj = global.lib_util.transObjArrToObj(trucks, 'create_user_id');
                    var user_ids = global.lib_util.transObjArrToSigArr(trucks, 'create_user_id');
                    global.lib_user.getList({
                        find: {_id: {$in: user_ids}}
                    }, cb);
                },
                function (users, cb) {
                    var arr = [];
                    for (var i = 0; i < users.length; i++) {
                        var user = users[i];
                        arr.push({
                            user: user,
                            truck: truckObj[user._id]
                        });
                    }
                    cb(null, {
                        list: arr,
                        count: countData,
                        exist: countData > req.body.page * global.config_common.entry_per_page
                    });
                }
            ], function (err, result) {
                if (err) {
                    return next(err);
                }
                global.config_common.sendData(req, result, next);
            });
        }
    });

    return api;

};
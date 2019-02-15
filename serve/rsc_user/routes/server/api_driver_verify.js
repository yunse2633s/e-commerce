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
        if (!req.body.truck_type || !req.body.company_id) {
            return next('invalid_format');
        }
        if (!_.isNumber(req.body.page)) {
            req.body.page = 1;
        }
        var truckObj;
        var user_ids;
        var countData;
        async.waterfall([
            function (cb) {
                global.lib_driver_verify.getList({
                    find: {company_id: req.body.company_id},
                    select: 'user_id'
                }, cb);
            },
            function (verifies, cb) {
                user_ids = global.lib_util.transObjArrToSigArr(verifies, 'user_id');
                global.lib_truck.getCount({create_user_id: {$in: user_ids}, type: req.body.truck_type}, cb);
            },
            function (count, cb) {
                countData = count;
                global.lib_truck.getList({
                    find: {create_user_id: {$in: user_ids}, type: req.body.truck_type},
                    skip: (req.body.page - 1) * global.config_common.entry_per_page,
                    limit: global.config_common.entry_per_page
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
    });

    return api;

};
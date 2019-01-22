/**
 * Created by Administrator on 17/4/15.
 */
var scheduler = require('node-schedule');
var async = require('async');
var _ = require('underscore');

var config_model = require('../configs/config_model');

var lib_Demand = require('../libs/lib_Demand');

exports.timer = function () {
    // 每小时一次
    var schedule_rule = new scheduler.RecurrenceRule();
    schedule_rule.minute = 0;
    scheduler.scheduleJob(schedule_rule, function () {

    });
    // 每10分进行一次
    var schedule_rule_10 = new scheduler.RecurrenceRule();
    schedule_rule_10.minute = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9,
        10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
        20, 21, 22, 23, 24, 25, 26, 27, 28, 29,
        30, 31, 32, 33, 34, 35, 36, 37, 38, 39,
        40, 41, 42, 43, 44, 45, 46, 47, 48, 49,
        50, 51, 52, 53, 54, 55, 56, 57, 58, 59];
    scheduler.scheduleJob(schedule_rule_10, function () {
        demandDenyGeneration();
    });

    // // 每天10点一次
    // var hours_10 = new scheduler.RecurrenceRule();
    // hours_10.minute = 55;
    // hours_10.hour = 9;
    // scheduler.scheduleJob(hours_10, function () {
    //     push();
    // });
    // // 每天10点一次
    // var hours_3 = new scheduler.RecurrenceRule();
    // hours_3.minute = 0;
    // hours_3.hour = 15;
    // scheduler.scheduleJob(hours_3, function () {
    //     push(true);
    // });
};


// 修改采购单状态
var demandDenyGeneration = function () {
    var today = new Date();
    async.waterfall([
        function (cb) {
            lib_Demand.update({
                find: {time_validity: {'$lt': today}},
                set: {status: config_model.demand_status.expired}
            }, cb);
        }
    ], function (err) {
        if (err) {
            console.log('Demand Can_Generate Update ERROR at ' + new Date().toString());
        }
        else {
            console.log('Demand Can_Generate Update SUCCESS at ' + new Date().toString());
        }
    });
};

var push = function (verify) {
    async.waterfall([
        function (cb) {
            if (verify) {
                global.lib_User.getCompanyList({find: {VIP: true}}, cb);
            } else {
                cb(null, null);
            }
        },
        function (result, cb) {
            global.lib_User.getUserList({find: result ? {VIP: true} : {}}, cb);
        },
        function (list, cb) {
            var arr = [];
            async.eachSeries(list, function (user, cbk) {
                var offer;
                async.waterfall([
                    function (callback) {
                        global.lib_User.getWorkRelationListAll({body: {user_id: user._id.toString()}}, global.config_model.company_type.SALE, callback);
                    },
                    function (result, callback) {
                        lib_Demand.getOne({
                            find: {
                                '$or': [{'product_categories.material': {$in: user['sell']}}, {'product_categories.material_chn': {$in: user['sell']}}],
                                user_id: {$nin: result.concat(user._id.toString())},
                                status: config_model.offer_status.published
                            },
                            sort: {time_creation: -1}
                        }, callback);
                    },
                    function (result, callback) {
                        if (!result) {
                            callback(null, null);
                        } else {
                            offer = result;
                            global.lib_push.update({
                                find: {user_id: user._id.toString()},
                                set: {$addToSet: {demand_id: result._id.toString()}}
                            }, callback);
                        }
                    },
                    function (result, callback) {
                        if (result && result.n === 0) {
                            arr.push({
                                demand_id: offer._id.toString(),
                                user_id: user._id
                            });
                        }
                        callback();
                    }
                ], cbk);
            }, function () {
                global.lib_push.addList(arr, cb);
            });
        }
    ], function (err) {
        if (err) {
            console.log('push  Demand ERROR at ' + new Date().toString());
        }
        else {
            console.log('push  Demand SUCCESS at ' + new Date().toString());
        }
    });
};
exports.demandDenyGeneration = demandDenyGeneration;


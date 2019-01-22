/**
 * Created by Administrator on 17/4/15.
 */
var scheduler = require('node-schedule');
var async = require('async');
var _ = require('underscore');

var config_model = global.config_model;

var lib_PriceOffer = global.lib_PriceOffer;
var lib_PriceOfferProducts = global.lib_PriceOfferProducts;
exports.timer = function () {
    // 每20分进行一次
    var schedule_rule_20 = new scheduler.RecurrenceRule();
    schedule_rule_20.minute = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9,
        10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
        20, 21, 22, 23, 24, 25, 26, 27, 28, 29,
        30, 31, 32, 33, 34, 35, 36, 37, 38, 39,
        40, 41, 42, 43, 44, 45, 46, 47, 48, 49,
        50, 51, 52, 53, 54, 55, 56, 57, 58, 59];
    scheduler.scheduleJob(schedule_rule_20, function () {
        update_status();
    });
    // 每20分进行一次
    var schedule_rule_0 = new scheduler.RecurrenceRule();
    schedule_rule_0.minute = [10, 30, 50];
    scheduler.scheduleJob(schedule_rule_0, function () {
        update_status();
    });
    // // 每天10点一次
    // var hours_10 = new scheduler.RecurrenceRule();
    // hours_10.minute = 50;
    // hours_10.hour = 9;
    // scheduler.scheduleJob(hours_10, function () {
    //     push();
    // });
    // // 每天10点一次
    // var hours_3 = new scheduler.RecurrenceRule();
    // hours_3.minute = 5;
    // hours_3.hour = 15;
    // scheduler.scheduleJob(hours_3, function () {
    //     push(true);
    // });
};


var update_status = function () {
    var date = new Date();
    lib_PriceOffer.update({
        find: {
            type: {$in: ['JJ', 'DjJJ']},
            time_validity: {$lt: new Date(date.getTime() + 60 * 60 * 10)},
            status: config_model.offer_status.published
        },
        set: {status: config_model.offer_status.expired}
    }, function (err) {
        if (err) {
            console.log('update expired offer ERROR at ' + new Date().toString());
        }
        else {
            console.log('update expired offer SUCCESS at ' + new Date().toString());
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
                var offer, userArr;
                async.waterfall([
                    function (callback) {
                        global.lib_User.getWorkRelationListAll({body: {user_id: user._id.toString()}}, global.config_model.company_type.PURCHASE, callback);
                    },
                    function (result, callback) {
                        userArr = result;
                        lib_PriceOfferProducts.getList({
                            find: {$or: [{material: {$in: user['buy']}}, {material_chn: {$in: user['buy']}}]}
                        }, callback);
                    },
                    function (result, callback) {
                        lib_PriceOffer.getOne({
                            find: {
                                _id: {$in: _.pluck(result, 'PID')},
                                user_id: {$nin: userArr.concat(user._id.toString())},
                                status: config_model.offer_status.published
                            },
                            sort: {time_creation: -1}
                        }, callback);
                    },
                    function (result, callback) {
                        offer = result;
                        if (!result) {
                            callback(null, null);
                        } else {
                            global.lib_push.update({
                                find: {user_id: user._id.toString()},
                                set: {$addToSet: {offer_id: result._id.toString()}}
                            }, callback);
                        }
                    },
                    function (result, callback) {
                        if (result && result.n === 0) {
                            arr.push({
                                offer_id: offer._id.toString(),
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
            console.log('push  Offer ERROR at ' + new Date().toString());
        }
        else {
            console.log('push  Offer SUCCESS at ' + new Date().toString());
        }
    });
};




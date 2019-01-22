/**
 * Created by Administrator on 17/4/15.
 */

var scheduler = require('node-schedule');
var async = require('async');

var lib_DemandOrder = global.lib_DemandOrder;


exports.timer = function () {
    // 每10分钟一次
    var schedule_rule = new scheduler.RecurrenceRule();

    schedule_rule.minute = [0, 10, 20, 30, 40, 50];

    scheduler.scheduleJob(schedule_rule, function () {
        updateCancelledOrder();
    });
};
// 定期过期
var updateCancelledOrder = function () {
    lib_DemandOrder.update({
        find: {step: 1, time_depart_end: {$lte: new Date((new Date()).getTime() + 1000 * 60 * 10)}},
        set: {status: global.config_model.order_status.cancelled, trafficOrder: false}
    }, function (err) {
        if (err) {
            console.log('Delete cancelled order ERROR at ' + new Date().toString());
        }
        else {
            console.log('Delete cancelled order SUCCESS at ' + new Date().toString());
        }
    });
};
exports.updateCancelledOrder = updateCancelledOrder;

/**
 * Created by Administrator on 17/4/26.
 */
var scheduler = require('node-schedule');
var async = require('async');


var lib_shop = global.lib_shop;

exports.timer = function () {
    // 每小时一次
    var schedule_rule = new scheduler.RecurrenceRule();
    schedule_rule.minute = 0;
    scheduler.scheduleJob(schedule_rule, function () {

    });
};


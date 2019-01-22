/**
 * Created by Administrator on 2018\3\29 0029.
 */
var scheduler = require('node-schedule');
var async = require('async');

exports.timer = function () {
    // 每天零点一次
    var schedule_rule = new scheduler.RecurrenceRule();
    schedule_rule.minute = 5;
    schedule_rule.hour = 0;
    scheduler.scheduleJob(schedule_rule, function () {
        update_amount()
    });

    var update_amount = function () {
        global.lib_orderAmount.update({
            find: {},
            set: {amount: 0}
        }, function (err) {
            if (err) {
                console.log('update amount  ERROR at ' + new Date().toString());
            }
            else {
                console.log('update amount  SUCCESS at ' + new Date().toString());
            }
        });
    };

};


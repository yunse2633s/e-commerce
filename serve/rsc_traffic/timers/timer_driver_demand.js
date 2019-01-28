/**
 * Created by Administrator on 2015/12/24.
 */
var util = require('../lib/util');
var driverDemandSV = require('../lib/lib_traffic_driver_demand');
var config_common = require('../configs/config_common');
var async = require('async');
var scheduler = require('node-schedule');

exports.timer = function () {
    // 每小时一次
    // var schedule_rule = new scheduler.RecurrenceRule();
    // schedule_rule.minute = 0;
    // scheduler.scheduleJob(schedule_rule, function () {
    //
    // });
    // 每10分进行一次
    var close_rule = new scheduler.RecurrenceRule();
    // close_rule.minute = [0, 10, 20, 30, 40, 50];
    close_rule.minute = 0;
    scheduler.scheduleJob(close_rule, function () {
        close_validty_demand();
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
//关闭失效的物流需求单
var close_validty_demand = function(){
    var time = new Date();
    var demand_Arr = [];
    async.waterfall([
        function (cb) {
            driverDemandSV.onlyList({
                find: {
                    time_validity:{$lt: time},
                    status: config_common.demand_status.effective
                },
                select: 'index amount_remain time_validity status'
            }, cb)
        }, function(demand, cb){
            demand_Arr = demand;

            if(demand){
                async.each(util.transObjArrToSigArr(demand, '_id'), function(demand_id, cb1){
                    driverDemandSV.close({'demand_id': demand_id}, config_common.demand_status.ineffective, cb1);
                }, cb);
            }else{
                cb();
            }
        }
    ], function () {
    });
};

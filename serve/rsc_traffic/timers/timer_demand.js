/**
 *
 */
var scheduler = require('node-schedule');
var util = require('../lib/util');
var async = require('async');
var trafficDemandSV = require('../lib/lib_traffic_demand');
var config_common = require('../configs/config_common');

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
        console.log('执行的定时器')
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

//关闭过期物流需求单
var close_validty_demand = function(){
    var time = new Date();
    var demand_Arr = [], demand={};
    async.waterfall([
        function (cb) {
            trafficDemandSV.onlyList({
                find: {
                    amount_remain: {$gte: 0},
                    time_validity: {$lt: time},
                    status: config_common.demand_status.effective
                },
                select: 'amount_remain time_validity'
            }, cb)
        }, function(demand, cb){
            if(demand){
                demand_Arr = util.transObjArrToSigArr(demand, '_id');
                async.each(demand_Arr, function(demand_id, cb1){
                    trafficDemandSV.close('server', {
                        'demand_id': demand_id.toString(),
                        status: config_common.demand_status.ineffective
                    }, cb1);
                }, cb);
            }else{
                cb();
            }
        }
    ], function () {
    });
};
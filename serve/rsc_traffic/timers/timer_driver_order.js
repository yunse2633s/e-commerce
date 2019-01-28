/**
 * Created by Administrator on 2015/12/24.
 */
var util = require('../lib/util');
var config_common = require('../configs/config_common');
var async = require('async');
var scheduler = require('node-schedule');
var driverOrderSV = require('../lib/lib_traffic_driver_order');
var extServer = require('../lib/lib_ext_server');
var config_msg_template = require('../configs/config_msg_template');

exports.timer = function () {
    
    // 每小时一次
    // var schedule_rule = new scheduler.RecurrenceRule();
    // schedule_rule.minute = 0;
    // scheduler.scheduleJob(schedule_rule, function () {
    //
    // });
    // 每10分进行一次 处理过期司机订单
    var close_rule = new scheduler.RecurrenceRule();
    // close_rule.minute = [0, 10, 20, 30, 40, 50];
    close_rule.minute = 0;
    scheduler.scheduleJob(close_rule, function () {
        close_validty_order();
    });
    //每天12点 发短信
    var sms_rule = new scheduler.RecurrenceRule();
    // sms_rule.hour = [12];
    sms_rule.minute = 0;
    scheduler.scheduleJob(sms_rule, function () {
        sms_noon_order();
    });
    //每天23:30 费用转账
    var pay_rule = new scheduler.RecurrenceRule();
    // pay_rule.hour = [23];
    // pay_rule.minute = [30];
    pay_rule.minute = 0;
    scheduler.scheduleJob(pay_rule, function () {
        pay_zero_order();
    });
    
};

//关闭失效的司机订单
var close_validty_order = function(){
    var time = (new Date()).getTime();
    var demand_Arr = [];
    async.waterfall([
        function (cb) {
            driverOrderSV.onlyList({
                find: {
                    time_tip_price:{$lt: time},
                    step: 0.5,
                    status: config_common.demand_status.effective
                },
                select: 'index amount_remain time_validity status'
            }, cb)
        }, function(orders, cb){
            async.eachSeries(orders, function (order, cb1) {
                //付费有效期结束后，发短信确认或调换车辆
                if(order.status){
                    order.status = config_common.demand_status.cancelled;
                    order.save()
                }
                // 订单关闭后，回退给司机需求单 ，若司机需求单没有，回退给物流订单，若没有则不回退；
                cb1()
            }, cb)
        }
    ], function () {
        // console.log('司机订单清理')
    });
};

// 提货到期当天12点
var sms_noon_order = function(){
    var time = new Date(),
        year = time.getFullYear(),
        month = time.getMonth() + 1,
        parseDay = time.getDate();
    var hours = time.getHours(); //12点 0点执行
    var afterTime = new Date(time.getTime() + 12*60*60*1000);
    var beforeTime= new Date(time.getTime() - 12*60*60*1000);
    var cond = {
        status: 'effective',
        step: {$lt: 2},
        tip_prices:{$gt: 0},
        time_depart: {$gt: beforeTime, $lt: afterTime} //time_depart
    };
    if(hours==12){
        async.waterfall([
            function(cb){
                driverOrderSV.onlyList({find: cond}, cb)
            }
            ,function (lists, cb) {
                //消息提醒
                async.eachSeries(lists, function(order, cb1){

                    var msgObj = {
                        title: '逾期提货',
                        //您与#公司达成的#吨#运输订单提货日为今天（#），请在提货时间内申请提货，逾期信息费不退回
                        content: config_msg_template.encodeContent('driver_loading', [
                            order.demand_company_name ? order.demand_company_name : '',
                            order.amount,
                            order.category_chn,
                            year + '年' + month + '月' + parseDay + '日'
                        ]),
                        user_ids: [order.supply_user_id]
                    };
                    extServer.push({}, msgObj, {}, '', {
                        params: {id: order._id.toString(), type: config_common.push_url.driver_order_detail},
                        url: config_common.push_url.driver_order_detail
                    }, function () {
                        console.log('逾期提货')
                        cb1();
                    });

                }, cb)
            }
        ], function(){

        })
    }

};
// 提货提货期当晚24点的扣款，
var pay_zero_order = function(){
    var time = new Date();
    var hours = time.getHours(); //12点 0点执行
    var afterTime = time; // new Date(time.getTime() + 1*60*60*1000);
    var beforeTime= new Date(time.getTime() - 23*60*60*1000);
    var cond = {
        status: 'effective',
        step: 1,
        tip_prices:{$gt: 0},
        tip_price_id: {$exists: true},
        time_depart: {$gt: beforeTime, $lt: afterTime} //time_depart
    };
    if(hours==23){
        async.waterfall([
            function(cb){
                driverOrderSV.onlyList({find: cond}, cb)
            }
            ,function (lists, cb) {
                //扣除信息费
                async.eachSeries(lists, function (order, cb1) {
                    //信息费转账给物流
                    driverOrderSV.payTipToBuy({}, order._id, function () {
                        console.log('信息费转账给物流')
                        cb1();
                    });
                }, cb)
            }
        ], function(){

        })
    }
};
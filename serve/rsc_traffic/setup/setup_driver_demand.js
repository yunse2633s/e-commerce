/**
 * Created by Administrator on 2015/12/24.
 */
var util = require('../lib/util');
var driverDemandSV = require('../lib/lib_traffic_driver_demand');
var config_common = require('../configs/config_common');
var async = require('async');

//关闭失效的物流需求单
exports.close_validty_demand = function(){
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
        },
        // function (cb) {
        //     var Arr = [];
        //     _.each(demand_Arr,function (demand) {
        //        _.each(_.difference(demand['verify_driver'],demand_Arr['unoffer_list']),function (id) {
        //            Arr.push({
        //                id:id,
        //                type:config_common.statistical.driver_assign_timeOut
        //            })
        //        });
        //     });
        // }
    ], function () {
    });
};

/**
 * Created by Administrator on 2015/12/9.
 */
var util = require('../lib/util');
var async = require('async');
var trafficDemandSV = require('../lib/lib_traffic_demand');
var config_common = require('../configs/config_common');



//关闭过期物流需求单
exports.close_validty_demand = function(){
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
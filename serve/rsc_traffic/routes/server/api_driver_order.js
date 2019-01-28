var _ = require('underscore');
var async = require('async');
var express = require('express');

var config_common = require('../../configs/config_common');

var driverOrderSV = require('../../lib/lib_traffic_driver_order');
var redCardOrderSV=require('../../lib/lib_red_card_order');
var redCardSV=require('../../lib/lib_red_card');
var extServer=require('../../lib/lib_ext_server');

module.exports = function() {

    var api = express.Router();

    api.use(require('../../middlewares/mid_verify_server')());

    api.post('/get_count_list', function (req, res, next) {
        if (!req.body.order_ids) {
            return next({dev:'invalid_format', pro: 'invalid_format'});
        }
        req.body.order_ids = !_.isObject(req.body.order_ids) ? JSON.parse(req.body.order_ids) : req.body.order_ids;
        if(!_.isArray(req.body.order_ids)){
            return next({dev:'字段类型为数组'});
        }
        async.waterfall([
            function (cb) {
                driverOrderSV.getAggregate({
                    match: {
                        order_id: {$in: req.body.order_ids}
                    },
                    group: {
                        _id: '$order_id', num: { $sum: 1 }
                    }}, cb)

            }
        ], function (err, order) {

            if (err) {
                return next(err);
            }
            config_common.sendData(req, order, next);
        });
    });

    // 交易订单index, 销售方id 或 采购方id ；并查询司机订单数
    /**
     * @生成司机订单
     * @param data:{assign: 指派信息,index:交易订单, demand_id: 线下找车发起者}
     */
    api.post('/unline_driver', function (req, res, next) {
        var category_info='';
        async.waterfall([
            function (cb) {
                //判断字段
                var flag = true;
                if(!req.body.assign || !req.body.user_id || !req.body.index ||!req.body.trade_phone ||!req.body.send_addr){
                    flag=false;
                    return cb({dev: '缺少参数'});
                }
                if(flag){
                    cb();
                }
            },function (cb) {

                async.each(req.body.assign, function(group, cb2){
                    async.eachSeries(group.driver, function(driver, cb1){
                        async.waterfall([
                            function(cb10){
                                driverOrderSV.add({
                                        index: config_common.getDriverOrderIndex(),
                                        index_trade: req.body.index,
                                        demand_trade_user_id: req.body.user_id,
                                        truck_num: driver.truck_num,
                                        supply_user_phone: driver.user_phone,
                                        supply_user_name: driver.user_name,
                                        product_categories :driver.product_categories,
                                        amount: driver.amount,
                                        demand_company_name: group.company_name,
                                        demand_user_name: group.user_name,
                                        price: group.pass_price,
                                        source: config_common.demand_source.driver_temp,
                                        status: driver.status,
                                        time_update_step: new Date(),
                                        time_creation: new Date()
                                    }, function (x,y) {
                                        // 【司机中心】请驾驶 冀U88393 前往河北邯郸鑫汇成品库装取16件高线，理计重量34吨，开取派车单，联系电话15399008899
                                        //
                                        // 请驾驶%s前往%s装取%s，理计重量%s吨，开取派车单，联系电话%s
                                        if(y){
                                            var category_penult_chn = config_common.penultCategoryChn(y.product_categories);
                                            var category_count =config_common.categoryNumber(y.product_categories);
                                            var category_amount =(function () {
                                                var amount=0;
                                                _.each(y.product_categories, function (a) {
                                                    _.each(y.product_name, function (b) {
                                                        amount=config_common.rscDecimal('add', amount, b.amount);
                                                    })
                                                })
                                                return amount;
                                            })();
                                            if(y.product_categories[0]['pass_unit']==y.product_categories[0]['unit']){
                                                category_info += category_penult_chn;
                                            }else{
                                                category_info += category_count+y.product_categories[0]['unit']+category_penult_chn;
                                            }
                                            req.decoded={id: req.body.user_id, role:'TRADE'};
                                            extServer.driverMsg(req, {
                                                phone: [y.supply_user_phone],
                                                params: [
                                                    y.truck_num,
                                                    req.body.send_addr,
                                                    category_info,
                                                    y.amount,
                                                    req.body.trade_phone
                                                ],
                                                templateid: '3942837',
                                                id: y.index_trade
                                            }, function () {

                                            })
                                        }
                                        cb10()
                                    })
                            }
                        ], cb1)
                    }, cb2);
                }, cb)
            }
        ], function (err, result) {

            config_common.sendData(req, result, next);
        })

    });
    /**
     * 司机直接付款后，付款平台调用的接口
     */
    api.post('/immediate_pay_modify', function (req, res, next) {

        async.waterfall([
            function (cb) {
                if(!req.body.order_id && !req.body.price && !req.body.orderNo){
                    return cb({dev: '参数不足'})
                }else{
                    cb();
                }
            }
            ,function (cb) {
                driverOrderSV.getOne({find:{_id: req.body.order_id}}, cb)
            }
        ], function(err, result){
            console.log('err直接支付', err,req.body.order_id ,req.body.price ,req.body.orderNo)
            if(err){
                return next(err)
            }else{
                result.tip_prices=req.body.price;
                result.tip_price_id=req.body.orderNo;
                result.step=1;
                result.time_update_step=new Date();
                result.save(function () {});
            }
            config_common.sendData(req, {}, next);
        })

    });
    return api;
};
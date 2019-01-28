/**
 * Created by Administrator on 2017/10/31.
 */
var _ = require('underscore');
var async = require('async');
var express = require('express');

var config_common = require('../../configs/config_common');

var trafficOrderSV = require('../../lib/lib_traffic_order');

module.exports = function() {

    var api = express.Router();

    api.use(require('../../middlewares/mid_verify_server')());

    api.post('/set_store_region', function (req, res, next) {
        if (!req.body.order_id ||
            !req.body.store_id ||
            !req.body.unit_name ||
            !_.isNumber(req.body.area)) {
            return next({dev:'invalid_format', pro: 'invalid_format'});
        }
        async.waterfall([
            function (cb) {
                trafficOrderSV.getOne({
                    find: {_id: req.body.order_id}
                }, cb);
            },
            function (order, cb) {
                if(!order){
                    return cb({dev: '物流订单没找到', pro: '000004'});
                }
                if(req.body.store_id === order.send_address_id){
                    order.send_unit_name = req.body.unit_name;
                    order.send_area = req.body.area;
                }
                if(req.body.store_id === order.receive_address_id){
                    order.receive_unit_name = req.body.unit_name;
                    order.receive_area = req.body.area;
                }
                order.save(cb);
            }
        ], function (err, order) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, order, next);
        });
    });
    
    return api;
};
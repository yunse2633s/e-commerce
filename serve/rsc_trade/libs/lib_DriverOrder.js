/**
 * Created by Administrator on 17/4/21.
 */
var http = require('../libs/http');
var async = require('async');
var _ = require('underscore');
var request = require('request');
var querystring = require('querystring');
var config_server = global.config_server;
var config_common = global.config_common;
var obj = {
    unline_driver: '/api/server/driver_order/unline_driver'  //获取要推送的好友和合作人
};

/**
 * 生成司机订单
 * @param data:{assign: 指派信息,index:交易订单, demand_id: 线下找车发起者}
 */
exports.createDriverOder=function(req, data, callback){
    http.sendTrafficServer(data, obj.unline_driver, callback);
};

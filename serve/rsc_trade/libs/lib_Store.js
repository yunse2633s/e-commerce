/**
 * Created by Administrator on 2017/11/11.
 */
var http = require('../libs/http');
var async = require('async');
var _ = require('underscore');
var jwt = require('jsonwebtoken');
var request = require('request');
var querystring = require('querystring');

var config_server = global.config_server;

var config_common = global.config_common;
var obj = {
    store_server_add_store_ready: '/api/server/store_ready/order_trade_add',            //添加交易预计入库
    store_server_add_store_agreement: '/api/server/store_agreement/order_trade_add',    //添加交易合同库
    store_server_del_store_agreement: '/api/server/store_agreement/order_trade_del',    //取消交易合同库
    store_server_order_trade_complete: '/api/server/store_unit/order_trade_complete'    //添加交易完成
};

/**
 * 生意圈显示的人id
 * @param data  {user_id,type}
 * @param callback
 */
exports.add_store_ready = function (data, callback) {
    http.sendStoreServer(data, obj.store_server_add_store_ready, callback);
};

exports.add_store_agreement = function (data, callback) {
    http.sendStoreServer(data, obj.store_server_add_store_agreement, callback);
};

exports.del_store_agreement = function (data, callback) {
    http.sendStoreServer(data, obj.store_server_del_store_agreement, callback);
};

exports.storeServerOrderTradeComplete = function(data, callback){
    if(!callback){
        callback = function (){};
    }
    http.sendStoreServer(data, obj.store_server_order_trade_complete, callback);
};
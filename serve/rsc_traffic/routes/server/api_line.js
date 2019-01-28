/**
 * sj 20170424.
 */
//外部工具引用
var async = require('async');
var _ = require('underscore');
var express = require('express');
//内部工具引用
var http = require('../../lib/http');


//配置文件引用
var config_server = require('../../configs/config_server');
var config_common = require('../../configs/config_common');
config_server = config_server[config_server.env];
var trafficLineSV = require('../../lib/lib_traffic_line');

module.exports = function () {
  var api = express.Router();

  //token 解析判断
  api.use(require('../../middlewares/mid_verify_server')());
  //数量 20171018 取消状态查询的条件
  api.post('/update_company_info', function (req, res, next) {
    var result = {};
    async.waterfall([
        function (cb) {
          if(req.body.user_id || req.body.company_id){
            return cb({dev: '缺少user_id, company_id参数'});
          }
          trafficLineSV.onlyList({
            find: {
              user_id: req.body.user_id
            }
          }, cb)
        }, function (lists, cb) {
        async.eachSeries(lists, function(list, cb2){
          list.company_id = req.body.company_id;
          list.save(cb2);
        }, cb)
      }
    ], function(){
      config_common.sendData(req, result, next);
    })


  });
  //列表

  return api;
};


/**
 * Created by Administrator on 2017/4/18.
 */
var _ = require('underscore');
var express = require('express');
var async = require('async');

var sdk_im_wangyiyunxin = require('../sdks/sdk_im_wangyiyunxin');

var lib_push = require('../lib/lib_push');

var config_common = require('../configs/config_common');
var config_socket_templates = require('../configs/config_socket_templates');

module.exports = function () {

  var api = express.Router();

  //查询设备号
  api.post('/push', function (req, res, next) {
    if (!req.body.from ||
        !req.body.to ||
        !config_socket_templates[req.body.type] ||
        !req.body.value) {
      return next('invalid_format');
    }
    //实时推送
    sdk_im_wangyiyunxin.sendAttachMsg({
      from: req.body.from,
      to: req.body.to,
      data: {type: req.body.type, value: req.body.value}
    }, function (err, result) {
      if(err){
        return next(err);
      }
      config_common.sendData(req, result, next);
    });
  });

  return api;

};
/**
 * Created by Administrator on 2015/11/18.
 */
var async = require('async');
var express = require('express');
var _ = require('underscore');
var jwt = require('jsonwebtoken');

var http = require('../../libs/lib_http');
var VerifyCode = require('../../models/Verify_code');
// var config_common = require('../../configs/config_common');
// var config_server = require('../../configs/config_server');
var UserTraffic = require('../../models/User_traffic');
var User_trade = require('../../models/User_trade');
// var PhoneBook = require('../../models/PhoneBook');
var Company_traffic = require('../../models/Company_traffic');
var Company_trade = require('../../models/Company_trade');
// var PhoneBookGroup = require('../../models/PhoneBookGroup');
var truck = require('../../libs/lib_truck');
var util = require('../../libs/lib_util');
var request = require('request');
var querystring = require('querystring');

function getArr(data) {
  var users = [], uhash = {};
  for (var i = 0, length = data.length; i < length; ++i) {
    if (!uhash[data[i]]) {
      uhash[data[i]] = true;
      users.push(data[i]);
    }
  }
  return users;
}

module.exports = function () {

  var api = express.Router();

  //reload-3.0.0-2017/4/20
  api.get('/exist/:phone/:package_name', function (req, res, next) {
    if (!global.config_common.checkPhone(req.params.phone)) {
      return next('invalid_format');
    }
    async.waterfall([
      function (cb) {
        global.lib_verify_code.getOne({
          find: {
            phone: req.params.phone,
            type: global.config_common.verify_code_type[req.params.package_name]
          }
        }, cb);
      }
    ], function (err, result) {
      if (err) {
        return next(err);
      }
      if (result && result.companyType) {
        global.config_common.sendData(req, {use: true}, next);
      } else {
        global.config_common.sendData(req, {use: false}, next);
      }
    })
  });
  // api.get('/exist/:phone', function (req, res, next) {
  //     if (!global.config_common.checkPhone(req.params.phone)) {
  //         return next('invalid_format');
  //     }
  //     global.lib_verify_code.getOne({
  //         find: {phone: req.params.phone}
  //     }, function (err, result) {
  //         if (err) {
  //             return next(err);
  //         }
  //         if (result && result.companyType) {
  //             global.config_common.sendData(req, {use: true}, next);
  //         } else {
  //             global.config_common.sendData(req, {use: false}, next);
  //         }
  //     });
  // });

  //reload-3.0.0-2017/4/20
  api.get('/get_verify_code/:phone/:package_name', function (req, res, next) {
    if (!global.config_common.checkPhone(req.params.phone)) {
      return next('invalid_format');
    }
    async.waterfall([
      function (cb) {
        global.lib_verify_code.getOne({
          find: {
            phone: req.params.phone,
            type: global.config_common.verify_code_type[req.params.package_name]
          }
        }, cb);
      },
      function (codeData, cb) {
        if (!codeData) {
          global.lib_verify_code.add({
            code: global.config_common.getVerifyCode(),
            phone: req.params.phone,
            type: global.config_common.verify_code_type[req.params.package_name]
          }, cb);
        } else {
          if (Date.now() - codeData.time_creation.getTime() < global.config_common.verify_codes_resend) {
            cb('verify_code_too_frequent');
          } else {
            codeData.code = global.config_common.getVerifyCode();
            codeData.time_creation = new Date();
            global.lib_verify_code.edit(codeData, cb);
          }
        }
      }
    ], function (err, result) {
      if (err) {
        return next(err);
      }
      if (process.env.node_env !== 'pro') {
        global.config_common.sendData(req, result, next);
      } else {
        if (!req.headers['package-name']) {
          req.headers['package-name'] = req.params.package_name;
        }
        http.sendMsgServerSMS(req, 'regular', {
          template_id: global.config_common.sms_templates.get_verify_code,
          content: [result.code],
          phone_list: [req.params.phone]
        }, function (err, data) {
          if (err) {
            return next(err);
          }
          global.config_common.sendData(req, {}, next);
        });
      }
    });
  });
  // api.get('/get_verify_code/:phone', function (req, res, next) {
  //     if (!global.config_common.checkPhone(req.params.phone)) {
  //         return next('invalid_format');
  //     }
  //     async.waterfall([
  //         function (cb) {
  //             global.lib_verify_code.getOne({find: {phone: req.params.phone}}, cb);
  //         },
  //         function (codeData, cb) {
  //             if (!codeData) {
  //                 global.lib_verify_code.add({
  //                     code: global.config_common.getVerifyCode(),
  //                     phone: req.params.phone
  //                 }, cb);
  //             } else {
  //                 if (Date.now() - codeData.time_creation.getTime() < global.config_common.verify_codes_resend) {
  //                     cb('verify_code_too_frequent');
  //                 } else {
  //                     codeData.code = global.config_common.getVerifyCode();
  //                     codeData.time_creation = new Date();
  //                     global.lib_verify_code.edit(codeData, cb);
  //                 }
  //             }
  //         }
  //     ], function (err, result) {
  //         if (err) {
  //             return next(err);
  //         }
  //         http.sendMsgServerSMS(req, 'regular', {
  //             template_id: global.config_common.sms_templates.get_verify_code,
  //             content: [result.code],
  //             phone_list: [req.params.phone]
  //         }, function (err, data) {
  //             if (err) {
  //                 return next(err);
  //             }
  //             if (process.env.node_env !== 'pro') {
  //                 global.config_common.sendData(req, result, next);
  //             } else {
  //                 global.config_common.sendData(req, {}, next);
  //             }
  //         });
  //     });
  // });

  //-----------get请求——5.3.7版本上线后——都删除掉！

  //校验验证码
  api.post('/check_verify_code', function (req, res, next) {
    if (!global.config_common.checkPhone(req.body.phone) && req.body.verify_code) {
      return next('invalid_format');
    }
    global.lib_verify_code.getOne({
      find: {
        phone: req.body.phone,
        code: req.body.verify_code
        // companyType: {$exists: true}
      }
    }, function (err, result) {
      if (err) {
        return next(err);
      }
      global.config_common.sendData(req, !!result, next);
    });
  });

  /**
   * 检查手机号是否已经注册
   * 参数1：phone;
   * 参数2: package_name;
   */
  api.post('/exist', function (req, res, next) {
    if (!global.config_common.checkPhone(req.body.phone)) {
      return next('invalid_format');
    }
    //检查注册时分为多个端检测
    async.waterfall([
      function (cb) {
        if (_.isArray(global.config_common.verify_code_type[req.body.package_name])) {
          global.lib_verify_code.getOne({
            find: {
              phone: req.body.phone,
              type: {$in: global.config_common.verify_code_type[req.body.package_name]}
            }
          }, cb);
        } else {
          global.lib_verify_code.getOne({
            find: {
              phone: req.body.phone,
              type: global.config_common.verify_code_type[req.body.package_name]
            }
          }, cb);
        }
      }
    ], function (err, result) {
      if (err) {
        return next(err);
      }
      if (result && result.companyType) {
        global.config_common.sendData(req, {use: true}, next);
      } else {
        global.config_common.sendData(req, {use: false}, next);
      }
    })

  });

  /**
   * 检查手机号是否已经注册
   * 参数1：phone;
   * 参数2: package_name;
   */
  api.post('/exist_trade', function (req, res, next) {
    //if (!global.config_common.checkPhone(req.body.phone)) {
    //    return next('invalid_format');
    //}
    ////检查注册时分为多个端检测
    //async.waterfall([
    //    function (cb) {
    //        global.lib_verify_code.getOne({
    //            find: {
    //                phone: req.body.phone,
    //                type: 'trade'
    //            }
    //        }, cb);
    //    }
    //], function (err, result) {
    //    if (err) {
    //        return next(err);
    //    }
    //    if (result) {
    //        global.config_common.sendData(req, {use: true}, next);
    //    } else {
    //        global.config_common.sendData(req, {use: false}, next);
    //    }
    //})
    if (!global.config_common.checkPhone(req.body.phone)) {
      return next('invalid_format');
    }
    //检查注册时分为多个端检测
    async.waterfall([
      function (cb) {
        global.lib_user.getOne({
          find: {
            phone: req.body.phone,
            role: {$in: [global.config_common.user_roles.TRADE_ADMIN, global.config_common.user_roles.TRADE_PURCHASE, global.config_common.user_roles.TRADE_SALE]}
          }
        }, cb);
      }
    ], function (err, result) {
      if (err) {
        return next(err);
      }
      var obj = {use: false};
      if (result) {
        obj = {use: true, id: result._id.toString()}
      }
      global.config_common.sendData(req, obj, next);
    })

  });


  /**
   * 得到验证码
   * 参数1：phone
   */
  api.post('/get_verify_code_new', function (req, res, next) {
    //新增多端登录功能
    if (!global.config_common.checkPhone(req.body.phone)) {
      return next('invalid_format');
    }
    async.waterfall([
      function (cb) {
        console.log('11', code)
        var code = global.config_common.change(req.body.code, 2, 8);
        console.log('22', code)
        code = global.config_common.change(code, 3, 6);
        console.log('33', code)
        jwt.verify(code, global.config_common.secret_keys.version, function (err, data) {
          if (err && err.message == 'jwt expired') {
            console.log('11111111')
            return cb('invalid_format');
          } else if (err) {
            console.log('222222222')
            return cb('invalid_format');
          } else {
            cb();
          }
        });
      },
      function (cb) {
        if (_.isArray(global.config_common.verify_code_type[req.body.package_name])) {
          global.lib_verify_code.getOne({
            find: {
              phone: req.body.phone,
              type: {$in: global.config_common.verify_code_type[req.body.package_name]}
            }
          }, cb);
        } else {
          global.lib_verify_code.getOne({
            find: {
              phone: req.body.phone,
              type: global.config_common.verify_code_type[req.body.package_name]
            }
          }, cb);
        }
      },
      function (codeData, cb) {
        if (!codeData) {
          global.lib_verify_code.add({
            code: global.config_common.getVerifyCode(),
            phone: req.body.phone,
            type: global.config_common.verify_code_type[req.body.package_name]
          }, cb);
        } else {
          if (Date.now() - codeData.time_creation.getTime() < global.config_common.verify_codes_resend) {
            cb('verify_code_too_frequent');
          } else {
            codeData.code = global.config_common.getVerifyCode();
            codeData.time_creation = new Date();
            global.lib_verify_code.edit(codeData, cb);
          }
        }
      }
    ], function (err, result) {
      if (err) {
        return next(err);
      }
      if (process.env.node_env !== 'pro') {
        global.config_common.sendData(req, result, next);
      } else {
        http.sendMsgServerSMS(req, 'regular', {
          template_id: global.config_common.sms_templates.get_verify_code,
          content: [result.code],
          phone_list: [req.body.phone]
        }, function (err, data) {
          if (err) {
            return next(err);
          }
          global.config_common.sendData(req, {}, next);
        });
      }
    });

  });
  //金森物流验证码接口
  api.post('/get_verify_code_traffic', function (req, res, next) {
    async.waterfall([
      function (cb) {
        var code = global.config_common.change(req.body.code, 3, 6);
        code = global.config_common.change(code, 2, 8);
        jwt.verify(code, global.config_common.secret_keys.version, function (err, data) {
          if (err && err.message == 'jwt expired') {
            return cb('invalid_format');
          } else if (err) {
            console.log('err', err);
            return cb('invalid_format');
          } else {
            cb();
          }
        });
      },
      function (cb) {
        global.lib_verify_code.getOne({find: {phone: req.body.phone, type: 'trade'}}, cb);
      },
      function (codeData, cb) {
        if (!codeData) {
          global.lib_verify_code.add({
            code: global.config_common.getVerifyCode(),
            phone: req.body.phone,
            type: 'trade'
          }, cb);
        } else {
          if (Date.now() - codeData.time_creation.getTime() < global.config_common.verify_codes_resend) {
            cb('verify_code_too_frequent');
          } else {
            codeData.code = global.config_common.getVerifyCode();
            codeData.time_creation = new Date();
            global.lib_verify_code.edit(codeData, cb);
          }
        }
      }
    ], function (err, result) {
      if (err) {
        return next(err);
      }
      if (process.env.node_env !== 'pro') {
        global.config_common.sendData(req, result, next);
      } else {
        http.sendMsgServerSMS(req, 'regular', {
          template_id: global.config_common.sms_templates.get_verify_code,
          content: [result.code],
          phone_list: [req.body.phone]
        }, function (err, data) {
          if (err) {
            return next(err);
          }
          global.config_common.sendData(req, {}, next);
        });
      }
    });
  });
  /**
   * 得到验证码前的验证接口
   */
  api.post('/get_code', function (req, res, next) {
    if (!req.body.phone) {
      return next('invalid_format');
    }
    var arr = global.config_common.createTokenPhoen(req.body.phone);
    console.log('arr', arr)
    var arr2 = global.config_common.change(arr, 3, 6);
    console.log('arr2', arr2)
    global.config_common.sendData(req, {code: arr2}, next);
  });

  /**
   * 检查司机手机号是否已经注册
   * 参数：phone;
   */
  api.post('/exist_driver', function (req, res, next) {
    if (!global.config_common.checkPhone(req.body.phone)) {
      return next('invalid_format');
    }
    //检查注册时分为多个端检测
    async.waterfall([
      function (cb) {
        global.lib_user.getOne({
          find: {
            phone: req.body.phone,
            role: global.config_common.user_roles.TRAFFIC_DRIVER_PRIVATE
          }
        }, cb);
      }
    ], function (err, result) {
      if (err) {
        return next(err);
      }
      var obj = {};
      if (result) {
        obj = {user: true, id: result._id.toString()}
      }
      global.config_common.sendData(req, obj, next);
    })
  });


  return api;

};
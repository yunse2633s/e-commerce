/**
 * Created by Administrator on 2015/12/28.
 */
var async = require('async');
var _ = require('underscore');
var express = require('express');
var jwt = require('jsonwebtoken');
var http = require('../../libs/lib_http');
var util = require('../../libs/lib_util');
var lib_user = require('../../libs/lib_user');
var lib_invitation_user = require('../../libs/lib_invitation_user');
var sdk_im_wangyiyunxin = require(
  '../../sdks/im_wangyiyunxin/sdk_im_wangyiyunxin');

var Truck = require('../../models/Truck');
var UserTrade = require('../../models/User_trade');
var VerifyCode = require('../../models/Verify_code');
var UserTraffic = require('../../models/User_traffic');
var CompanyList = require('../../models/Company_list');
var CompanyTrade = require('../../models/Company_trade');
var CompanyTraffic = require('../../models/Company_traffic');

var config_common = require('../../configs/config_common');

module.exports = function() {

  var api = express.Router();

  /**
   * 获取基本买卖运的属性
   */
  api.post('/get_product', function(req, res, next) {
    global.lib_http.sendTradeServer({
      method: 'getList',
      cond: {find: {lev: 0}},
      model: 'Classify',
    }, global.config_api_url.trade_server_get_hanzi, function(err, result) {
      config_common.sendData(req, result, next);
    });
  });

  /**
   * 功能：得到指挥中心设置的秘书服务时间
   * 参数：user_id
   */
  api.post('/get_server_time', function(req, res, next) {
    if (!req.body.user_id) {
      return next('invalid_format');
    }
    var result = {
      time_validity: 0,
      user_name: '线上客服',
      photo_url: '',
    };
    async.waterfall([
      function(cb) {
        global.lib_http.sendAdminServer({
          method: 'getOne',
          cond: {find: {user_id: req.body.user_id}},
          model: 'ServiceTime',
        }, global.config_api_url.admin_server_get, cb);
      },
      function(time, cb) {
        if (time) {
          result.time_validity = time.time_validity;
        }
        if (req.body.company_id) {
          global.lib_http.sendAdminServer({
            method: 'getOne',
            cond: {
              find: {
                $or: [
                  {trade_company_id: {$in: req.decoded.company_id}},
                  {traffic_company_id: {$in: req.decoded.company_id}},
                  {storage_company_id: {$in: req.decoded.company_id}}],
                role: {$in: ['trade_service', 'traffic_service', 'car_service']},
              },
            },
            model: 'SuperAdmin',
          }, global.config_api_url.admin_server_get, cb);
        } else {
          cb(null, null);
        }
      },
    ], function(err, data) {
      if (err) {
        return next(err);
      }
      if (data) {
        result.user_name = data.user_name;
        result.photo_url = data.photo_url;
      }
      config_common.sendData(req, result, next);
    });
  });

  /**
   * 功能：开通指挥中心推送-->默认为每次推送一条；一共推送100条；
   * 参数：user_id
   * type:开通的类型
   */
  api.post('/open_push_count', function(req, res, next) {
    if (!req.body.user_id || !req.body.type) {
      return next('invalid_format');
    }
    //根据type类型得到相应的信息
    switch (req.body.type) {
      case 'DJ':
        var data = {
          'type': 'DJ', //报价
          'disabled': true,
          'count_validity_order': 100,
          'count_everyday_order': 10,
          'count_history_order': 0,
          'count_validity_user': 100,
          'count_everyday_user': 10,
          'count_history_user': 0,
        };
        break;
      case 'JJ':
        var data = {
          'type': 'JJ', //竞价
          'disabled': true,
          'count_validity_order': 100,
          'count_everyday_order': 10,
          'count_history_order': 0,
          'count_validity_user': 100,
          'count_everyday_user': 10,
          'count_history_user': 0,
        };
        break;
      case 'demand':
        var data = {
          'type': 'demand', //采购
          'disabled': true,
          'count_validity_order': 100,
          'count_everyday_order': 10,
          'count_history_order': 0,
          'count_validity_user': 100,
          'count_everyday_user': 10,
          'count_history_user': 0,
        };
        break;
      case 'trade_traffic':
        var data = {
          'type': 'trade_traffic', //物流
          'disabled': true,
          'count_validity_order': 100,
          'count_everyday_order': 10,
          'count_history_order': 0,
          'count_validity_user': 100,
          'count_everyday_user': 10,
          'count_history_user': 0,
        };
        break;
      case 'supply_goods':
        var data = {
          'type': 'supply_goods', //货源
          'disabled': true,
          'count_validity_order': 100, //剩余推荐数 订单
          'count_everyday_order': 10,//每天推荐数
          'count_history_order': 0,//历史推荐数
          'count_validity_user': 100,//剩余推荐数  交易人
          'count_everyday_user': 10,
          'count_history_user': 0,
        };
        break;
      case 'traffic_truck':
        var data = {
          'type': 'traffic_truck', //车辆
          'disabled': true,
          //每日推荐线路
          'count_validity_line': 100, //线路推荐
          'count_everyday_line': 10, //
          'count_history_line': 0,
          //每日推荐车辆
          'count_validity_truck': 100, //车辆人
          'count_everyday_truck': 10, //
          'count_history_truck': 0,
        };
        break;
      case 'driver_traffic':
        var data = {
          'type': 'driver_traffic', //物流（司机的）
          'disabled': true,
          'count_validity_order': 100,
          'count_everyday_order': 10,
          'count_history_order': 0,
          'count_validity_user': 100,  //物流人
          'count_everyday_user': 10,
          'count_history_user': 0,
        };
        break;
      default :
        return next('type_err');
        break;
    }

    async.waterfall([
      function(cb) {
        //（1）修改个人是否可以推荐
        global.lib_user.getOneEasy({find: {_id: req.body.user_id}}, cb);
      },
      function(user, cb) {
        if (!user.recommend) {
          user.recommend = true;
          user.save();
        }
        cb();
      },
      function(cb) {
        global.lib_http.sendAdminServer({
          method: 'getOne',
          cond: {find: {user_id: req.body.user_id}},
          model: 'PushCount',
        }, global.config_api_url.admin_server_get, cb);
      },
      function(count, cb) {
        if (!count) {
          global.lib_http.sendAdminServer({
            arr: data,
            user_id: req.body.user_id,
          }, global.config_api_url.admin_server_save_push_count, function(err) {
            global.lib_http.sendAdminServer({
              method: 'getOne',
              cond: {find: {user_id: req.body.user_id}},
              model: 'PushCount',
            }, global.config_api_url.admin_server_get, cb);
          });
        } else {
          cb(null, count);
        }
      },
      function(count, cb) {
        for (var i = 0; i < count.count.length; i++) {
          if (count.count[i].type == data.type) {
            count.count[i] = data;
          }
        }
        var arr = count.count;
        global.lib_http.sendAdminServer({
          arr: arr,
          user_id: req.body.user_id,
        }, global.config_api_url.admin_server_save_push_count, cb);
      },
    ], function(err, result) {
      if (err) {
        return next(err);
      }
      config_common.sendData(req, result, next);
    });
  });

  /**
   * 功能：得到指挥中心设置的推送条数
   * 参数：user_id:人的id;
   */
  api.post('/get_push_count', function(req, res, next) {
    if (!req.body.user_id || !req.body.type) {
      return next('invalid_format');
    }
    async.waterfall([
      function(cb) {
        global.lib_http.sendAdminServer({
          method: 'getOne',
          cond: {find: {user_id: req.body.user_id}},
          model: 'PushCount',
        }, global.config_api_url.admin_server_get, cb);
      },
      function(data, cb) {
        if (data) {
          var evens = _.filter(data.count, function(num) {
            return num.type == req.body.type;
          });
        } else {
          var evens = [];
        }
        if (evens.length && evens[0].disabled) {
          cb(null, {open: true, count: evens[0]});
        } else {
          cb(null, {open: false});
        }
      },
    ], function(err, result) {
      if (err) {
        return next(err);
      }
      config_common.sendData(req, result, next);
    });
  });

  /**
   * 功能：得到指挥中心设置的推送条数
   * 参数：user_id:人的id;
   */
  api.post('/get_admin_home', function(req, res, next) {
    if (!req.body.admin_id) {
      return next('invalid_format');
    }
    var user = {};
    var companys = [];
    async.waterfall([
      function(cb) {
        global.lib_http.sendAdminServer({
          method: 'getOne',
          cond: {find: {_id: req.body.admin_id}},
          model: 'SuperAdmin',
        }, global.config_api_url.admin_server_get, cb);
      },
      function(userData, cb) {
        if (!userData) {
          return cb('user_not_found');
        }
        //将userData的数据放在user中
        var arr = [];
        arr.push(userData.trade_company_id);
        arr.push(userData.traffic_company_id);
        arr.push(userData.storage_company_id);
        arr = _.flatten(arr);
        user = userData;
        //1,整理好userData.company_id的数据
        async.eachSeries(arr, function(company_id, callback) {
          async.waterfall([
            function(cbk) {
              global.lib_company.getOne({
                find: {_id: company_id},
              }, cbk);
            },
            function(company, cbk) {
              companys.push(company);
              cbk();
            },
          ], callback);
        }, cb);
      },
      function(cb) {
        //整理数据，然后返回给客户端
        var data = {};
        data.roleObj = config_common.super_admin_role_new[user.role];
        data.companys = companys;
        data.name = user.user_name;
        data.phone = user.phone;
        data.role = user.role;
        data.photo_url = user.photo_url;
        data.team_id = user.team_id;
        cb(null, data);
      },
    ], function(err, result) {
      if (err) {
        return next(err);
      }
      config_common.sendData(req, result, next);
    });
  });

  //根据id数组得到头像和人名
  api.post('/get_photo', function(req, res, next) {
    if (!_.isArray(req.body.user_ids)) {
      return next('invalid_format');
    }
    async.waterfall([
      function(cb) {
        global.lib_user.getListAll({
          find: {_id: {$in: req.body.user_ids}},
          select: 'photo_url role real_name',
        }, cb);
      },
    ], function(err, result) {
      if (err) {
        return next(err);
      }
      var arr = [];
      for (var i = 0; i < result.length; i++) {
        var obj = {};
        var arr01 = [];
        arr01.push(result[i].photo_url);
        arr01.push(result[i].role);
        arr01.push(result[i].real_name);
        obj[result[i]._id] = arr01;
        arr.push(obj);
      }
      config_common.sendData(req, arr, next);
    });
  });

  //忘记密码
  api.post('/forget_password', function(req, res, next) {
    if (!config_common.checkPassword(req.body.password) ||
      !req.body.verify_code || !config_common.checkPhone(req.body.phone)) {
      return next('invalid_format');
    }
    async.waterfall([
      function(cb) {
        VerifyCode.findOne({phone: req.body.phone}, cb);
      },
      function(verifyCode, cb) {
        if (Date.now() - verifyCode.time_creation.getTime() >=
          config_common.verify_codes_timeout) {
          return cb('verify_code_timeout');
        }
        if (verifyCode.code !== req.body.verify_code) {
          return cb('invalid_verify_code');
        }
        var userDB;
        switch (verifyCode.companyType) {
          case config_common.company_category.TRADE:
            userDB = UserTrade;
            break;
          case config_common.company_category.TRAFFIC:
            userDB = UserTraffic;
            break;
          default :
            return cb('invalid_format');
        }
        userDB.findOne({phone: req.body.phone}).
          select('password').
          exec(function(err, user) {
            if (err) {
              return cb(err);
            }
            if (!user) {
              return cb('not_found');
            }
            user.password = req.body.password;
            user.save(cb);
          });
      },
    ], function(err, user) {
      if (err) {
        return next(err);
      }
      config_common.sendData(req, {}, next);
    });
  });

  //获取名片信息
  api.post('/get_business_card', function(req, res, next) {
    if (!req.body.user_id) {
      return next('invalid_format');
    }
    var user_select = 'company_id phone real_name role photo_url mail province city district addr post line';
    async.waterfall([
      function(cb) {
        UserTrade.findOne({_id: req.body.user_id}).select(user_select).exec(cb);
      },
      function(user, cb) {
        if (user) {
          return cb(null, user);
        }
        UserTraffic.findOne({_id: req.body.user_id}).
          select(user_select).
          exec(cb);
      },
      function(user, cb) {
        if (!user) {
          return cb('not_found');
        }
        if (user.role == config_common.user_roles.TRAFFIC_DRIVER_PRIVATE) {
          Truck.findOne({
            create_user_id: req.body.user_id,
          }, function(err, truck) {
            if (err) {
              return cb(err);
            }
            return cb(null, {user: user, truck: truck});
          });
        } else if (global.config_common.checkUserCompany(user)) {
          var companyDB;
          if (config_common.checkTradeCompanyByRole(user.role)) {
            companyDB = CompanyTrade;
          } else {
            companyDB = CompanyTraffic;
          }
          companyDB.findOne({_id: user.company_id})
          //.select('full_name nick_name des verify_phase type')
            .exec(function(err, company) {
              if (err) {
                return cb(err);
              }
              cb(null, {user: user, company: company});
            });
        } else {
          cb(null, {user: user});
        }
      },
    ], function(err, result) {
      if (err) {
        return next(err);
      }
      config_common.sendData(req, result, next);
    });
  });

  //获取同名公司reload-3.0.0-2017/4/20，注册时候判断是否有同名公司注册使用
  api.post('/get_by_name', function(req, res, next) {
    if (!req.body.name || !req.body.type) {
      return next('invalid_format');
    }
    async.waterfall([
      function(cb) {
        var cond = {
          find: {
            $or: [
              {full_name: new RegExp(req.body.name)},
              {nick_name: new RegExp(req.body.name)}],
          },
          limit: 10,
          select: 'full_name nick_name',
        };
        if (req.body.type == global.config_common.company_category.TRADE) {
          global.lib_company.getListTrade(cond, cb);
        } else {
          global.lib_company.getListTraffic(cond, cb);
        }
      },
    ], function(err, result) {
      if (err) {
        return next(err);
      }
      config_common.sendData(req, result, next);
    });
  });

  //获取公司管理员reload-3.0.0-2017/4/20，注册时候判断是否有同名公司注册使用
  api.post('/get_by_company_id', function(req, res, next) {
    if (!req.body.company_id || !req.body.type) {
      return next('invalid_format');
    }
    async.waterfall([
      function(cb) {
        var cond = {
          find: {company_id: req.body.company_id},
          select: 'real_name',
        };
        if (req.body.type == config_common.company_category.TRADE) {
          cond.find.role = config_common.user_roles.TRADE_ADMIN;
          global.lib_user.getOneTrade(cond, cb);
        } else {
          cond.find.role = config_common.user_roles.TRAFFIC_ADMIN;
          global.lib_user.getOneTraffic(cond, cb);
        }
      },
    ], function(err, result) {
      if (err) {
        return next(err);
      }
      config_common.sendData(req, result, next);
    });
  });

  //注册
  api.post('/signup', function(req, res, next) {
    //基本参数检查
    if (!global.config_common.checkPhone(req.body.phone) ||
      !req.body.verify_code ||
      (!global.config_common.user_type[req.body.type]) ||
      !global.config_common.checkRealName(req.body.real_name)) {
      return next('invalid_format');
    }
    if (!req.body.package_name) {
      return next('invalid_format');
    }
    //司机注册检查
    if (req.body.type === global.config_common.user_type.DRIVER &&
      (!req.body.number || !req.body.weight)) {
      return next('invalid_format');
    }
    //仓库注册检查
    if (req.body.type === global.config_common.user_type.STORE &&
      (!global.config_common.checkProvince(req.body.province) ||
        !req.body.name ||
        !global.config_common.checkCity(req.body.province, req.body.city) ||
        !req.body.addr || !req.body.area ||
        !global.config_common.store_type[req.body.store_type])) {
      return next('invalid_format');
    }
    var verifyCodeData;
    var companyType;
    var userRole;
    var userData;
    var peiZhi;
    async.waterfall([
      function(cb) {
        //查询买卖运的大类
        global.lib_http.sendTradeServer({
          method: 'getList',
          cond: {find: {lev: 0}},
          model: 'Classify',
        }, global.config_api_url.trade_server_get_hanzi, cb);
      },
      function(peizhi, cb) {
        peiZhi = peizhi;
        global.lib_verify_code.getOne({
          find: {
            $or: [
              {
                phone: req.body.phone,
                type: global.config_common.verify_code_type[req.body.package_name],
              }, {phone: req.body.phone, type: null}],
          },
        }, cb);
      },
      function(code, cb) {
        verifyCodeData = code;
        global.lib_verify_code.check(code, req.body.verify_code, cb);
      },
      function(cb) {
        if (verifyCodeData.companyType) {
          return cb('phone_is_used');
        }
        if (req.body.type === global.config_common.user_type.DRIVER) {
          companyType = global.config_common.company_category.TRAFFIC;
          userRole = global.config_common.user_roles.TRAFFIC_DRIVER_PRIVATE;
        } else if (req.body.type === global.config_common.user_type.TRAFFIC) {
          companyType = global.config_common.company_category.TRAFFIC;
          userRole = global.config_common.user_roles.TRAFFIC_ADMIN;
        } else if (req.body.type === global.config_common.user_type.STORE) {
          companyType = global.config_common.company_category.TRADE;
          userRole = global.config_common.user_roles.TRADE_STORAGE;
        } else if (req.body.type === global.config_common.user_type.OFFICE) {
          companyType = global.config_common.company_category.OFFICE;
          userRole = global.config_common.user_roles.OFFICE_ADMIN;
        } else {
          companyType = global.config_common.company_category.TRADE;
          userRole = global.config_common.user_roles.TRADE_ADMIN;
        }
        verifyCodeData.companyType = companyType;
        verifyCodeData.save(cb);
      },
      function(v_code, count, cb) {
        global.lib_user_new.getOne({find: {phone: req.body.phone}}, cb);
      },
      function(userNew, cb) {
        if (userNew) {
          cb(null, userNew, 0);
        } else {
          global.lib_user_new.add({
            phone: req.body.phone,
            role: userRole,
            real_name: req.body.real_name,
          }, cb);
        }
      },
      function(user, count, cb) {
        global.lib_user.add({
          user_id: user._id.toString(),
          phone: req.body.phone,
          role: userRole,
          real_name: req.body.real_name,
        }, cb);
      },
      function(user, count, data, cb) {
        userData = user;
        //增加一个判断，根据包名查询和是否是vip公司 如果是的话，根据包名查询到这家公司并向公司超管发送好友申请
        if (req.body.package_name) {
          //每一家不同的vip公司都有不同的包名！
          global.lib_company.getOne({
            find: {package_name: req.body.package_name},
          }, cb);
        } else {
          cb(null, null);
        }
      },
      function(company_package, cb) {
        //如果存在包名就继续判断是否是vip公司并且判断是否是自己的包
        if (company_package) {
          if (company_package.package_name !== req.body.package_name ||
            !company_package.vip) {
            cb();
          } else {
            //继续判断 如果这个人 的公司 id 不等于这家公司 就给这家公司超管发送申请
            if (userData.company_id === company_package._id.toString()) {
              cb();
            } else {
              //经过一系列判断后，确定这个人需要给这个包所属的公司的超管 发送 好友申请 了
              async.waterfall([
                function(cbk) {
                  lib_user.getList({
                    find: {
                      company_id: company_package._id.toString(),
                      role: global.config_common.user_roles.TRADE_ADMIN,
                    },
                  }, cbk);
                },
                function(users, cbk) {
                  async.eachSeries(users, function(user, callback) {
                    global.lib_http.sendMsgServerNoToken({
                      title: '互联网+',
                      user_ids: JSON.stringify([user._id.toString()]),
                      content: '' + '' + userData.real_name + '来访企业，请点击查看',
                      data: JSON.stringify({
                        params: {id: userData._id, type: 'rsc.new_relation'},
                        url: 'trade.new_message',

                      }),
                    }, global.config_api_url.msg_server_push);
                    var data = {
                      type: global.config_common.relation_style.VISITOR,
                      user_id: user._id.toString(),               //自己id
                      other_user_id: userData._id.toString(),     //对方id
                      status: global.config_common.relation_status.VISITOR,
                    };
                    global.lib_apply_relation.add(data, callback);
                  }, cbk);
                },
              ], cb);
            }
          }
        } else {
          cb();
        }
      },
      function(cb) {
        if (req.body.type === global.config_common.user_type.DRIVER) {
          global.lib_truck.add({
            number: req.body.number,                //车牌号
            weight: req.body.weight,                //载重
            create_user_id: userData._id.toString(),//创建者用户id(司机创建)
            user_id: [userData._id.toString()],     //所属用户
            //is_default: true
          }, cb);
        } else if (req.body.type === global.config_common.user_type.STORE) {
          var startProvince = global.config_province[req.body.province];
          var startCity = global.config_city[req.body.province][req.body.city];
          var startDistrict = global.config_district[req.body.city][req.body.district];
          var address = {
            name: req.body.name,
            province: startProvince.name,
            city: startCity.name,
            district: startDistrict ? startDistrict.name : '',
            addr: req.body.addr,
            prin_name: userData.real_name,
            prin_phone: userData.phone,
            type: req.body.store_type,
            area: req.body.area,
            user_ids: [userData._id.toString()],
          };
          global.lib_address.add(req, address, cb);
        } else {
          cb(null, null);
        }
      },
    ], function(err, driver) {
      if (err) {
        return next(err);
      }
      global.lib_verify_code.getOne({find: {phone: userData.phone}},
        function(err, codeData) {
          if (!codeData.type) {
            switch (userData.role) {
              case global.config_common.user_roles.TRADE_ADMIN:
              case global.config_common.user_roles.TRADE_PURCHASE:
              case global.config_common.user_roles.TRADE_SALE:
                codeData.type = 'trade';
                codeData.save();
                break;
              case global.config_common.user_roles.TRADE_STORAGE:
                codeData.type = 'store';
                codeData.save();
                break;
              case global.config_common.user_roles.TRAFFIC_ADMIN:
                codeData.type = 'traffic';
                codeData.save();
                break;
              case global.config_common.user_roles.TRAFFIC_DRIVER_PRIVATE:
                codeData.type = 'driver';
                codeData.save();
                break;
              case global.config_common.user_roles.OFFICE_ADMIN:
                codeData.type = 'office';
                codeData.save();
                break;
            }
          }
          global.lib_invitation_user.signup(userData, function() {
          });
          var result = {
            user: userData,
            token: global.config_common.createTokenUser(userData, {}),
            trade_config: peiZhi,
          };
          if (codeData.type == 'trade') {
            result.company = {};
          }
          global.config_common.sendData(req, result, next);
        });
    });
  });

  /***
   * 功能：金森物流注册
   * 参数
   * phone           电话号
   * real_name       角色名称
   * verify_code     验证码
   * **/
  api.post('/register_traffic', function(req, res, next) {
    //基本参数检查
    if (!global.config_common.checkPhone(req.body.phone) ||
      !req.body.verify_code) {
      return next('invalid_format');
    }
    async.waterfall([
      //1.检查验证码
      function(cb) {
        global.lib_verify_code.getOne({
          find: {phone: req.body.phone, type: 'trade'},
        }, cb);
      },
      function(code, cb) {
        //检查验证码
        global.lib_verify_code.check(code, req.body.verify_code, cb);
      },
      function(cb) {
        global.lib_user_new.getOne({find: {phone: req.body.phone}}, cb);
      },
      function(user, cb) {
        //如果有user说明该手机号被注册了，否则添加一个新的
        if (user) {
          cb(null, user, 0);
        } else {
          global.lib_user_new.add({
            phone: req.body.phone,
            real_name: req.body.real_name,
          }, cb);
        }
      },
      function(user, count, cb) {
        global.lib_user.add({
          user_id: user._id.toString(),
          phone: req.body.phone,
          role: global.config_common.user_roles.TRADE_ADMIN,
          real_name: req.body.real_name,
        }, cb);
      },
    ], function(err, userData, count, data) {
      if (err) {
        return next(err);
      }
      var result = {
        user: userData,
        token: global.config_common.createTokenUser(userData, {}),
      };
      global.config_common.sendData(req, result, next);
    });
  });
  //司机登录
  api.post('/login_truck', function(req, res, next) {
    if (!global.config_common.checkPhone(req.body.phone) ||
      !req.body.verify_code) {
      return next('invalid_format');
    }
    var userData;
    var data = {};
    async.waterfall([
      function(cb) {
        global.lib_verify_code.getOne(
          {find: {phone: req.body.phone, type: 'driver'}}, cb);
      },
      function(v_code, cb) {
        if (req.body.verify_code === global.config_common.password
        // && _.indexOf(global.config_common.phoneArr, req.body.phone) !== -1
        ) {
          cb();
        } else {
          global.lib_verify_code.check(v_code, req.body.verify_code, cb);
        }
      },
      function(cb) {
        global.lib_user.getOneTraffic({
          find: {
            user_id: {$exists: true},
            source: {$exists: false},
            phone: req.body.phone,
            role: global.config_common.user_roles.TRAFFIC_DRIVER_PRIVATE,
          },
        }, cb);
      },
      function(user, cb) {
        if (!user) {
          return cb('user_not_found');
        }
        userData = user;
        var token;
        if (req.body.admin) {
          token = global.config_common.createTokenForReplace(userData, {});
          data = {
            token: token,
            user: userData,
            transport: [],
            admin_id: '5976f947169e2997301675b0',
          };
        } else {
          token = global.config_common.createTokenUser(userData, {});
          data = {token: token, user: userData, transport: []};
        }
        if (_.size(userData.transport)) {
          global.lib_http.sendTradeServer({
            method: 'getList',
            cond: {find: {eng: {$in: userData.transport}, lev: 0}},
            model: 'Classify',
          }, global.config_api_url.trade_server_get_hanzi, cb);
        } else {
          cb(null, null);
        }
        // cb(null, data);
      },
    ], function(err, result) {
      if (err) {
        return next(err);
      }
      if (result) {
        for (var i = 0; i < result.length; i++) {
          data.transport.push(result[i]);
        }
      }
      global.config_common.sendData(req, data, next);
    });
  });

  //交易登录
  api.post('/login_trade', function(req, res, next) {
    if (!global.config_common.checkPhone(req.body.phone) ||
      !req.body.verify_code) {
      return next('invalid_format');
    }
    var userData;
    var data = {arrSell: [], arrBuy: [], company: {}};
    async.waterfall([
      function(cb) {
        global.lib_verify_code.getOne(
          {find: {phone: req.body.phone, type: 'trade'}}, cb);
      },
      function(v_code, cb) {
        if (req.body.verify_code === global.config_common.password_new ||
          (req.body.verify_code === global.config_common.password &&
            _.indexOf(global.config_common.phoneArr, req.body.phone) !== -1)) {
          cb();
        } else {
          global.lib_verify_code.check(v_code, req.body.verify_code, cb);
        }
      },
      function(cb) {
        global.lib_http.sendTradeServer({
          method: 'getList',
          cond: {find: {lev: 0}},
          model: 'Classify',
        }, global.config_api_url.trade_server_get_hanzi, cb);
      },
      function(peiZhi, cb) {
        peiZhi = JSON.parse(JSON.stringify(peiZhi));
        peiZhi = _.map(peiZhi, function(num) {
          if (num.eng === 'buxianzhi') {
            num.chn = '不限制';
          }
          return num;
        });
        data.trade_config = peiZhi;
        global.lib_user.getOneTrade({
          find: {
            //user_id: {$exists: true},
            source: {$exists: false},
            phone: req.body.phone,
            role: {$ne: global.config_common.user_roles.TRADE_STORAGE},
          },
        }, cb);
      },
      function(user, cb) {
        if (!user) {
          return cb('user_not_found');
        }
        userData = user;
        data.user = user;
        global.lib_behalf_user.getOne(
          {find: {behalf_user: user._id, status: 'PROCESSING'}}, cb);
      },
      function(behalf_data, cb) {
        if (behalf_data) {
          behalf_data.status = 'SUCCESS';
          //behalf_data.save();
          global.lib_http.sendMsgServerNoToken({
            title: '邀请人已上线',
            user_ids: JSON.stringify([behalf_data.user_id.toString()]),
            content: '' + '您邀请的' + userData.real_name + '已经登录了',
            data: JSON.stringify(
              {params: {id: userData._id, type: 'rsc.new_relation'}, url: ''}),
          }, global.config_api_url.msg_server_push);
        }
        //改为，如果有公司就查询，没有就不查，因为上面已经判断过是一个交易的账号
        if (userData.company_id) {
          global.lib_company.getOne({find: {_id: userData.company_id}}, cb);
        } else {
          cb(null, null);
        }
      },
      function(company, cb) {
        data.token = global.config_common.createTokenUser(userData, company ||
          {});
        var entry;
        if (company) {
          data.company = company.toObject();
          if (data.company.vip) {
            if (data.company.package_name != req.body.package_name) {
              // data.company.vip = false;
            }
          }
          async.waterfall([
            function(cb) {
              global.lib_user.getOne({find: {phone: req.body.phone}}, cb);
            },
            function(company, cb) {
              entry = company;
              //买
              if (_.size(entry.sell)) {
                global.lib_http.sendTradeServer({
                  method: 'getList',
                  cond: {find: {eng: {$in: entry.sell}, lev: 0}},
                  model: 'Classify',
                }, global.config_api_url.trade_server_get_hanzi, cb);
              } else {
                cb(null, null);
              }
            },
            function(datas, cb) {
              if (datas) {
                for (var i = 0; i < datas.length; i++) {
                  data.arrSell.push(datas[i]);
                }
              }
              //卖
              if (_.size(entry.buy)) {
                global.lib_http.sendTradeServer(
                  {
                    method: 'getList',
                    cond: {find: {eng: {$in: entry.buy}, lev: 0}},
                    model: 'Classify',
                  },
                  global.config_api_url.trade_server_get_hanzi,
                  cb
                );
              } else {
                cb(null, null);
              }
            },
          ], function(err, result) {
            if (err) {
              return cb(err);
            }
            if (result) {
              for (var i = 0; i < result.length; i++) {
                data.arrBuy.push(result[i]);
              }
            }
            cb(null, data);
          });
        } else {
          async.waterfall([
            function(cb) {
              global.lib_user.getOne({find: {phone: req.body.phone}}, cb);
            },
            function(user, cb) {
              entry = user;
              //买
              if (_.size(entry.sell)) {
                global.lib_http.sendTradeServer(
                  {
                    method: 'getList',
                    cond: {find: {eng: {$in: entry.sell}, lev: 0}},
                    model: 'Classify',
                  },
                  global.config_api_url.trade_server_get_hanzi,
                  cb
                );
              } else {
                cb(null, null);
              }
            },
            function(datas, cb) {
              if (datas) {
                for (var i = 0; i < datas.length; i++) {
                  data.arrBuy.push(datas[i]);
                }
              }
              //卖
              if (_.size(entry.buy)) {
                global.lib_http.sendTradeServer(
                  {
                    method: 'getList',
                    cond: {find: {eng: {$in: entry.buy}, lev: 0}},
                    model: 'Classify',
                  },
                  global.config_api_url.trade_server_get_hanzi,
                  cb
                );
              } else {
                cb(null, null);
              }
            },
          ], function(err, result) {
            if (err) {
              return cb(err);
            }
            if (result) {
              for (var i = 0; i < result.length; i++) {
                data.arrBuy.push(result[i]);
              }
            }
            cb(null, data);
          });
        }
      },
    ], function(err, result) {
      if (err) {
        return next(err);
      }
      global.config_common.sendData(req, result, next);
    });
  });
  //金森物流登录
  api.post('/login_trade_new', function(req, res, next) {
    if (!global.config_common.checkPhone(req.body.phone) ||
      !req.body.verify_code) {
      return next('invalid_format');
    }
    var userData;
    var data = {arrSell: [], arrBuy: [], company: {}};
    var company;
    var companyData;
    async.waterfall([
      function(cb) {
        global.lib_company.getOneTraffic({
          find: {_id: req.body.company_id},
        }, cb);
      },
      function(data, cb) {
        if (!data) {
          return next('invalid_format');
        } else {
          company = data;
          cb();
        }
      },
      function(cb) {
        global.lib_verify_code.getOne(
          {find: {phone: req.body.phone, type: 'trade'}}, cb);
      },
      function(v_code, cb) {
        if (req.body.verify_code === global.config_common.password_new ||
          (req.body.verify_code === global.config_common.password &&
            _.indexOf(global.config_common.phoneArr, req.body.phone) !== -1)) {
          cb();
        } else {
          global.lib_verify_code.check(v_code, req.body.verify_code, cb);
        }
      },
      function(cb) {
        global.lib_http.sendTradeServer({
          method: 'getList',
          cond: {find: {lev: 0}},
          model: 'Classify',
        }, global.config_api_url.trade_server_get_hanzi, cb);
      },
      function(peiZhi, cb) {
        peiZhi = JSON.parse(JSON.stringify(peiZhi));
        peiZhi = _.map(peiZhi, function (num) {
          if (num.eng === 'buxianzhi') {
            num.chn = '不限制';
          }
          return num;
        });
        data.trade_config = peiZhi;
        global.lib_user.getOneTrade({
          find: {
            //user_id: {$exists: true},
            source: {$exists: false},
            phone: req.body.phone,
            role: {$ne: global.config_common.user_roles.TRADE_STORAGE},
          },
        }, cb);
      },
      function(user, cb) {
        if (!user) {
          return cb('请先注册');
        }
        userData = user;
        data.user = user;
        if (user.company_id) {
          global.lib_company.getOneTrade({
            find: {_id: user.company_id},
          }, cb);
        } else {
          return cb('no_company');
        }
      },
      function(company, cb) {
        companyData = company;
        global.lib_company_relation.getOne({
          find: {
            self_id: company._id,
            other_id: req.body.company_id,
          },
        }, cb);
      },
      function(relation, cb) {
        if (relation) {
          global.lib_behalf_user.getOne(
            {find: {behalf_user: userData._id, status: 'PROCESSING'}}, cb);
        } else {
          async.waterfall([
            //如果不是合作关系，添加合作关系
            function(cb01) {
              global.lib_company_relation.add({
                self_id: companyData._id,
                other_id: company._id,
                other_type: company.type,
              }, cb01);
            },
            function(data, count, cb01) {
              global.lib_company_relation.add({
                self_id: company._id,
                other_id: companyData._id,
                other_type: companyData.type,
              }, cb01);
            },
            function(data, count, cb01) {
              global.lib_work_relation.add({
                user_id: company.user_id,
                other_user_id: companyData.user_id,
                company_id: company._id,
                other_company_id: companyData._id,
                type: companyData.type,
              }, cb01);
            },
            function(data, count, cb01) {
              global.lib_work_relation.add({
                user_id: userData._id,
                other_user_id: company.user_id,
                company_id: companyData._id,
                other_company_id: company._id,
                type: company.type,
              }, function(err, result, count) {
                if (err) {
                  return next(err);
                }
                global.lib_behalf_user.getOne(
                  {find: {behalf_user: userData._id, status: 'PROCESSING'}},
                  cb01);
              });
            },
          ], cb);
        }
      },
      function(behalf_data, cb) {
        if (behalf_data) {
          behalf_data.status = 'SUCCESS';
          //behalf_data.save();
          global.lib_http.sendMsgServerNoToken({
            title: '邀请人已上线',
            user_ids: JSON.stringify([behalf_data.user_id.toString()]),
            content: '' + '您邀请的' + userData.real_name + '已经登录了',
            data: JSON.stringify(
              {params: {id: userData._id, type: 'rsc.new_relation'}, url: ''}),
          }, global.config_api_url.msg_server_push);
        }
        //改为，如果有公司就查询，没有就不查，因为上面已经判断过是一个交易的账号
        if (userData.company_id) {
          global.lib_company.getOne({find: {_id: userData.company_id}}, cb);
        } else {
          cb(null, null);
        }
      },
      function(company, cb) {
        data.token = global.config_common.createTokenUser(userData, company ||
          {});
        var entry;
        if (company) {
          data.company = company.toObject();
          if (data.company.vip) {
            if (data.company.package_name != req.body.package_name) {
              // data.company.vip = false;
            }
          }
          async.waterfall([
            function(cb) {
              global.lib_user.getOne({find: {phone: req.body.phone}}, cb);
            },
            function(company, cb) {
              entry = company;
              //买
              if (_.size(entry.sell)) {
                global.lib_http.sendTradeServer({
                  method: 'getList',
                  cond: {find: {eng: {$in: entry.sell}, lev: 0}},
                  model: 'Classify',
                }, global.config_api_url.trade_server_get_hanzi, cb);
              } else {
                cb(null, null);
              }
            },
            function(datas, cb) {
              if (datas) {
                for (var i = 0; i < datas.length; i++) {
                  data.arrSell.push(datas[i]);
                }
              }
              //卖
              if (_.size(entry.buy)) {
                global.lib_http.sendTradeServer(
                  {
                    method: 'getList',
                    cond: {find: {eng: {$in: entry.buy}, lev: 0}},
                    model: 'Classify',
                  },
                  global.config_api_url.trade_server_get_hanzi,
                  cb
                );
              } else {
                cb(null, null);
              }
            },
          ], function(err, result) {
            if (err) {
              return cb(err);
            }
            if (result) {
              for (var i = 0; i < result.length; i++) {
                data.arrBuy.push(result[i]);
              }
            }
            cb(null, data);
          });
        } else {
          async.waterfall([
            function(cb) {
              global.lib_user.getOne({find: {phone: req.body.phone}}, cb);
            },
            function(user, cb) {
              entry = user;
              //买
              if (_.size(entry.sell)) {
                global.lib_http.sendTradeServer(
                  {
                    method: 'getList',
                    cond: {find: {eng: {$in: entry.sell}, lev: 0}},
                    model: 'Classify',
                  },
                  global.config_api_url.trade_server_get_hanzi,
                  cb
                );
              } else {
                cb(null, null);
              }
            },
            function(datas, cb) {
              if (datas) {
                for (var i = 0; i < datas.length; i++) {
                  data.arrBuy.push(datas[i]);
                }
              }
              //卖
              if (_.size(entry.buy)) {
                global.lib_http.sendTradeServer(
                  {
                    method: 'getList',
                    cond: {find: {eng: {$in: entry.buy}, lev: 0}},
                    model: 'Classify',
                  },
                  global.config_api_url.trade_server_get_hanzi,
                  cb
                );
              } else {
                cb(null, null);
              }
            },
          ], function(err, result) {
            if (err) {
              return cb(err);
            }
            if (result) {
              for (var i = 0; i < result.length; i++) {
                data.arrBuy.push(result[i]);
              }
            }
            cb(null, data);
          });
        }
      },
    ], function(err, result) {
      if (err) {
        return next(err);
      }
      global.config_common.sendData(req, result, next);
    });
  });
  //仓库登录
  api.post('/login_store', function(req, res, next) {
    if (!global.config_common.checkPhone(req.body.phone) ||
      !req.body.verify_code) {
      return next('invalid_format');
    }
    var userData;
    var data = {};
    async.waterfall([
      function(cb) {
        global.lib_verify_code.getOne(
          {find: {phone: req.body.phone, type: 'store'}}, cb);
      },
      function(v_code, cb) {
        if (req.body.verify_code === global.config_common.password_new ||
          (req.body.verify_code === global.config_common.password &&
            _.indexOf(global.config_common.phoneArr, req.body.phone) !== -1)) {
          cb();
        } else {
          global.lib_verify_code.check(v_code, req.body.verify_code, cb);
        }
      },
      function(cb) {
        global.lib_http.sendTradeServer({
          method: 'getList',
          cond: {find: {lev: 0}},
          model: 'Classify',
        }, global.config_api_url.trade_server_get_hanzi, cb);
      },
      function(peiZhi, cb) {
        data.trade_config = peiZhi;
        global.lib_user.getOneTrade({
          find: {
            //user_id: {$exists: true},
            source: {$exists: false},
            phone: req.body.phone,
            role: global.config_common.user_roles.TRADE_STORAGE,
          },
        }, cb);
      },
      function(user, cb) {
        if (!user) {
          return cb('user_not_found');
        }
        userData = user;
        data.user = user;
        //改为，如果有公司就查询，没有就不查，因为上面已经判断过是一个交易的账号
        if (userData.company_id) {
          global.lib_company.getOne({find: {_id: userData.company_id}}, cb);
        } else {
          cb(null, null);
        }
      },
      function(company, cb) {
        data.token = global.config_common.createTokenUser(userData, company ||
          {});
        if (company) {
          data.company = company.toObject();
          if (data.company.package_name !== req.body.package_name &&
            data.company.vip) {
            data.company.vip = false;
          }
          cb(null, data);
        } else {
          cb(null, data);
        }
      },
    ], function(err, result) {
      if (err) {
        return next(err);
      }
      global.config_common.sendData(req, result, next);
    });
  });

  //物流登录
  api.post('/login_traffic', function(req, res, next) {
    if (!global.config_common.checkPhone(req.body.phone) ||
      !req.body.verify_code) {
      return next('invalid_format');
    }
    var userData;
    var data = {transport: []};
    async.waterfall([
      function(cb) {
        global.lib_verify_code.getOne(
          {find: {phone: req.body.phone, type: 'traffic'}}, cb);
      },
      function(v_code, cb) {
        if (req.body.verify_code === global.config_common.password_new ||
          (req.body.verify_code === global.config_common.password &&
            _.indexOf(global.config_common.phoneArr, req.body.phone) !== -1)) {
          cb();
        } else {
          global.lib_verify_code.check(v_code, req.body.verify_code, cb);
        }
      },
      function(cb) {
        global.lib_http.sendTradeServer({
          method: 'getList',
          cond: {find: {lev: 0}},
          model: 'Classify',
        }, global.config_api_url.trade_server_get_hanzi, cb);
      },
      function(peiZhi, cb) {
        peiZhi = JSON.parse(JSON.stringify(peiZhi));
        peiZhi = _.map(peiZhi, function (num) {
          if (num.eng === 'buxianzhi') {
            num.chn = '不限制';
          }
          return num;
        });
        data.trade_config = peiZhi;
        global.lib_user.getOne({
          find: {
            //user_id: {$exists: true},
            source: {$exists: false},
            phone: req.body.phone,
            //role:global.config_common.user_roles.TRAFFIC_ADMIN
            role: {
              $in: [
                global.config_common.user_roles.TRAFFIC_ADMIN,
                global.config_common.user_roles.TRAFFIC_EMPLOYEE,
                global.config_common.user_roles.TRAFFIC_CAPTAIN],
            },
          },
        }, cb);
      },
      function(user, cb) {

        if (!user) {
          return cb('user_not_found');
        }
        userData = user;
        data.user = user;
        global.lib_behalf_user.getOne(
          {find: {behalf_user: user._id, status: 'PROCESSING'}}, cb);
      },
      function(behalf_data, cb) {
        if (behalf_data) {
          behalf_data.status = 'SUCCESS';
          //behalf_data.save();
          global.lib_http.sendMsgServerNoToken({
            title: '互联网+',
            user_ids: JSON.stringify([behalf_data.user_id.toString()]),
            content: '' + '您邀请的' + userData.real_name + '已经登录了',
            data: JSON.stringify(
              {params: {id: userData._id, type: 'rsc.new_relation'}, url: ''}),
          }, global.config_api_url.msg_server_push);
        }
        if (userData.role ==
          global.config_common.user_roles.TRAFFIC_DRIVER_PRIVATE) {
          return cb('user_not_found');
        }
        //改为，如果有公司就查询，没有就不查，因为上面已经判断过是一个物流的账号
        if (userData.company_id) {
          global.lib_company.getOne({find: {_id: userData.company_id}}, cb);
        } else {
          cb(null, null);
        }
      },
      function(company, cb) {
        data.token = global.config_common.createTokenUser(userData, company ||
          {});
        cb(null, data);
      },
    ], function(err, result) {
      if (err) {
        return next(err);
      }
      global.config_common.sendData(req, result, next);
    });

  });

  //信用中心登录
  api.post('/login_credit', function(req, res, next) {
    if (!global.config_common.checkPhone(req.body.phone) ||
      !req.body.verify_code) {
      return next('invalid_format');
    }
    var userData;
    var data = {arrSell: [], arrBuy: []};
    async.waterfall([
      function(cb) {
        global.lib_verify_code.getOne(
          {find: {phone: req.body.phone, type: {$in: ['traffic', 'trade']}}},
          cb);
      },
      function(v_code, cb) {
        if (req.body.verify_code === global.config_common.password_new ||
          (req.body.verify_code === global.config_common.password &&
            _.indexOf(global.config_common.phoneArr, req.body.phone) !== -1)) {
          cb();
        } else {
          global.lib_verify_code.check(v_code, req.body.verify_code, cb);
        }
      },
      function(cb) {
        global.lib_http.sendTradeServer({
          method: 'getList',
          cond: {find: {lev: 0}},
          model: 'Classify',
        }, global.config_api_url.trade_server_get_hanzi, cb);
      },
      function(peiZhi, cb) {
        data.trade_config = peiZhi;
        global.lib_user.getOne({
          find: {
            user_id: {$exists: true},
            source: {$exists: false},
            phone: req.body.phone,
            role: {
              $in: [
                global.config_common.user_roles.TRADE_ADMIN,
                global.config_common.user_roles.TRAFFIC_ADMIN],
            },
          },
        }, cb);
      },
      function(user, cb) {
        if (!user) {
          return cb('user_not_found');
        }
        userData = user;
        data.user = user;
        //改为，如果有公司就查询，没有就不查，因为上面已经判断过是一个交易的账号
        if (userData.company_id) {
          global.lib_company.getOne({find: {_id: userData.company_id}}, cb);
        } else {
          return cb('company_not_found');
        }
      },
      function(company, cb) {
        data.token = global.config_common.createTokenUser(userData, company ||
          {});
        if (company) {
          data.company = company.toObject();
          if (data.company.package_name !== req.body.package_name &&
            data.company.vip) {
            data.company.vip = false;
          }
          cb(null, data);
        } else {
          cb(null, data);
        }
      },
    ], function(err, result) {
      if (err) {
        return next(err);
      }
      global.config_common.sendData(req, result, next);
    });
  });

  //个人主页
  api.post('/get_personal_homepage', function(req, res, next) {
    if (!req.body.user_id) {
      return next('invalid_format');
    }
    if (!global.lib_util.checkID(req.body.user_id)) {
      return next('invalid_format');
    }
    var role;
    var result = {};
    async.waterfall([
      function(cb) {
        global.lib_user.getOne({
          find: {_id: req.body.user_id},
          //select: 'jia_shi_zheng_url id_card_number_back_url id_card_number_url photo_url company_id real_name sell buy transport role phone other_picture'
        }, cb);
      },
      function(user, cb) {
        if (!user) {
          return cb('user_not_found');
        }
        result.user = user;
        //买
        if (_.size(result.user.sell)) {
          global.lib_http.sendTradeServer({
            method: 'getList',
            cond: {find: {eng: {$in: result.user.sell}, lev: 0}},
            model: 'Classify',
          }, global.config_api_url.trade_server_get_hanzi, cb);
        } else {
          cb(null, null);
        }
      },
      function(data, cb) {
        if (data) {
          result.arrSell = data;
        }
        //卖
        if (_.size(result.user.buy)) {
          global.lib_http.sendTradeServer({
            method: 'getList',
            cond: {find: {eng: {$in: result.user.buy}, lev: 0}},
            model: 'Classify',
          }, global.config_api_url.trade_server_get_hanzi, cb);
        } else {
          cb(null, null);
        }
      },
      function(data, cb) {
        if (data) {
          result.arrBuy = data;
        }
        //运
        if (_.size(result.user.transport)) {
          global.lib_http.sendTradeServer({
            method: 'getList',
            cond: {find: {eng: {$in: result.user.transport}}},
            model: 'Classify',
          }, global.config_api_url.trade_server_get_hanzi, cb);
        } else {
          cb(null, null);
        }
      },
      function(data, cb) {
        if (data) {
          result.transport = data;
        }
        if (result.user.role ==
          global.config_common.user_roles.TRAFFIC_DRIVER_PRIVATE) {
          role = global.config_common.user_roles.TRAFFIC_DRIVER_PRIVATE;
          global.lib_truck.getOne({
            find: {
              $or: [
                {create_user_id: result.user._id.toString()},
                {user_id: {$in: [result.user._id.toString()]}}],
            },
          }, cb);
        } else {
          cb(null, null);
        }
      },
      function(truck, cb) {
        if (truck) {
          result.truck = truck;
          cb(null, null);
        } else {
          if (global.config_common.checkUserCompany(result.user)) {
            global.lib_company.getOne({
              find: {_id: result.user.company_id},
              select: 'des nick_name sell buy transport province city verify_phase vip type panorama_url',
            }, cb);
          } else {
            cb(null, null);
          }
        }
      },
      function(company, cb) {
        if (company) {
          result.company = company;
          if (result.user.role ==
            global.config_common.user_roles.TRADE_STORAGE) {
            global.lib_address.getCount({user_ids: {$in: [req.body.user_id]}},
              cb);
          } else {
            global.lib_count.get({
              body: {
                //company_ids: [company._id.toString()],
                user_ids: [req.body.user_id],
                types: [
                  config_common.count_type.DJ,
                  config_common.count_type.JJ,
                  config_common.count_type.TRAFFIC_DEMAND,
                  config_common.count_type.TRADE_DEMAND,
                  config_common.count_type.TRAFFIC_LINE,
                  config_common.count_type.DRIVER_DEMAND,
                ],
              },
            }, cb);
          }
        } else if (role ==
          global.config_common.user_roles.TRAFFIC_DRIVER_PRIVATE) {
          global.lib_count.get({
            body: {
              user_ids: [req.body.user_id],
              types: [
                config_common.count_type.DRIVER_LINE,
              ],
            },
          }, cb);
        } else {
          cb(null, null);
        }
      },
      function(count, cb) {
        if (count) {
          if (result.user.role ==
            global.config_common.user_roles.TRADE_STORAGE) {
            result.count = {TRADE_STORAGE: count};
          } else {
            result.count = count[req.body.user_id];
          }
        }
        cb();
      },
      function(cb) {
        var token = req.body['x-access-token'] || req.headers['x-access-token'];
        if (token) {
          jwt.verify(token, config_common.secret_keys.user,
            function(err, decoded) {
              if (err && err.message == 'jwt expired') {
                return cb('jwt_expired');
              } else if (err) {
                return cb('auth_failed_user');
              }
              req.decoded = decoded;
              cb();
            });
        } else {
          cb();
        }
      },
      function(cb) {
        if (req.decoded) {
          global.lib_user_relation.getOne({
            find: {
              user_id: req.decoded.id,
              other_id: req.body.user_id,
            },
          }, cb);
        } else {
          cb(null, null);
        }
      },
      function(data, cb) {
        if (req.decoded) {
          if (!data && (req.body.user_id !== req.decoded.id)) {
            result.friend = true;
          } else {
            result.friend = false;
          }
          result.colleague = result.user.company_id === req.decoded.company_id;
          cb();
        } else {
          cb();
        }
      },
      function(cb) {
        if (req.decoded) {
          global.lib_annotation.getOne(
            {find: {user_id: req.decoded.id, other_id: req.body.user_id}}, cb);
        } else {
          cb(null, null);
        }
      },
      function(annotation, cb) {
        if (annotation) {
          result.annotation = annotation;
        }
        cb();
      },
    ], function(err) {
      if (err) {
        return next(err);
      }
      global.config_common.sendData(req, result, next);
    });
  });

  api.post('/get_personal_homepage_status', function(req, res, next) {
    if (!req.body.user_id) {
      return next('invalid_format');
    }
    if (!global.lib_util.checkID(req.body.user_id)) {
      return next('invalid_format');
    }
    var result = {};
    // 1 什么都没有操作的时候 status 是空 默认为两个人之间没有合作关系
    result.status = '';
    result.cancel = false;

    //result.friend = ''; //查看自己和对方可以加好友的相关状态

    var userData;// --> 看的那个人的个人数据
    var selfData;// --> 自己的个人数据
    async.waterfall([
      function(cb) {
        var token = req.body['x-access-token'] || req.headers['x-access-token'];
        if (token) {
          jwt.verify(token, config_common.secret_keys.user,
            function(err, decoded) {
              if (err && err.message === 'jwt expired') {
                return cb('jwt_expired');
              } else if (err) {
                return cb('auth_failed_user');
              }
              req.decoded = decoded;
              cb();
            });
        } else {
          return global.config_common.sendData(req, result, next);
        }
      },
      function(cb) {
        if (req.body.user_id === req.decoded.id) {
          // 2 如果是自己看自己则不需要合作关系 status 为 空
          return global.config_common.sendData(req, result, next);
        }
        global.lib_user.getOne({
          find: {_id: req.body.user_id},
          select: 'photo_url company_id real_name sell buy transport role',
        }, cb);
      },
      function(user, cb) {
        if (!user) {
          return cb('user_not_found');
        }
        userData = user;
        global.lib_user.getOne({
          find: {_id: req.decoded.id},
        }, cb);
      },
      function(user, cb) {
        if (user) {
          req.decoded.company_id = user.company_id;
        }
        selfData = user;
        //如果有一个人角色是司机的话继续下去进行判断
        if (selfData.role !==
          global.config_common.user_roles.TRAFFIC_DRIVER_PRIVATE &&
          userData.role !==
          global.config_common.user_roles.TRAFFIC_DRIVER_PRIVATE) {
          if (selfData.company_id.toString() ===
            userData.company_id.toString()) {
            // 3 如果是同事的话 他们之间不需要显示合作关系的内容 所以 status --> 空
            return global.config_common.sendData(req, result, next);
          }
        }
        //司机
        // if (userData.role == global.config_common.user_roles.TRAFFIC_DRIVER_PRIVATE) {
        //     // 4 如果对方角色是司机，那么司机只有加好友，也没有合作的关系
        //     result.status = '';
        //     cb();
        //
        // } else
        if (userData.role === global.config_common.user_roles.TRADE_STORAGE ||
          selfData.role === global.config_common.user_roles.TRADE_STORAGE) {
          //如果自己的角色是 仓库或者对方角色是仓库直接全部处理
          global.lib_user.getStoreTradeSupplyVerifyStatus(selfData, userData,
            function(err, status, cancel) {
              result.status = status;
              result.cancel = cancel;
              cb();
            });
        } else if (selfData.role ===
          global.config_common.user_roles.TRAFFIC_DRIVER_PRIVATE) {
          // 5 自己的角色是 私人司机
          //有公司未认证的物管
          if (global.config_common.checkUserCompany(userData) &&
            (userData.role === global.config_common.user_roles.TRAFFIC_ADMIN ||
              userData.role ===
              global.config_common.user_roles.TRAFFIC_EMPLOYEE ||
              userData.role ===
              global.config_common.user_roles.TRAFFIC_CAPTAIN)) {
            //->对方的角色是物流管理员
            global.lib_driver_verify.getCount({
              user_id: selfData._id.toString(),
              approve_id: userData._id.toString(),
              company_id: userData.company_id[0],
            }, function(err, count) {
              if (err) {
                return cb(err);
              }
              if (!count) {
                // 5-1 对方和自己没有合作关系，所以 自己可以向对方申请认证挂靠 -->司机查看物管
                result.status = global.config_common.user_homepage_status.DRIVER_TRAFFIC;
              } else {
                // 5-2 已经向这个物管申请了挂靠，所以没有合作关系了 status 为 空
                //所以可以取消合作关系
                result.cancel = true;
              }
              cb();
            });
          } else {
            // 5-3 如果对方的角色不是物管 那么 司机角色看其他的人没有合作关系 status 为 空
            cb();
          }
          //有公司的物管
        } else if (global.config_common.checkUserCompany(selfData) &&
          (selfData.role === global.config_common.user_roles.TRAFFIC_ADMIN ||
            selfData.role ===
            global.config_common.user_roles.TRAFFIC_EMPLOYEE ||
            selfData.role ===
            global.config_common.user_roles.TRAFFIC_CAPTAIN)) {
          // 6 自己的角色是物流管理员
          //未认证的司机
          if (userData.role ===
            global.config_common.user_roles.TRAFFIC_DRIVER_PRIVATE) {
            global.lib_driver_verify.getCount({
              user_id: userData._id.toString(),
              approve_id: selfData._id.toString(),
              company_id: selfData.company_id[0],
            }, function(err, count) {
              if (err) {
                return cb(err);
              }
              if (!count) {
                //6-1  物管看未认证的司机
                result.status = global.config_common.user_homepage_status.TRAFFIC_DRIVER;
              } else {
                //6-2 物管看已认证的司机 不需要合作关系 status '';
                //所以可以 取消合作
                result.cancel = true;
              }
              cb();
            });
            //有公司未认证的交易
          } else if (global.config_common.checkUserCompany(userData) &&
            global.config_common.checkTradeCompanyByRole(userData.role)) {
            global.lib_work_relation.getCount({
              user_id: selfData._id.toString(),               //自己id
              company_id: selfData.company_id[0],             //自己公司id
              other_user_id: userData._id.toString(),         //对方id
              other_company_id: userData.company_id,          //对方公司id
              type: global.config_common.company_type.PURCHASE,
            }, function(err, count) {
              if (err) {
                return cb(err);
              }
              if (!count) {
                //6-3 物管看没有合作关系的 交易角色
                result.status = global.config_common.user_homepage_status.TRAFFIC_TRADE;
              } else {
                //6-4 物流看有合作关系的 交易角色 status --> 空
                //所以可以取消合作
                result.cancel = true;
              }
              cb();
            });
          } else {
            //6-5 物管 看 物管 角色相同 无合作关系 status --> 空
            cb();
          }
          //有公司的交易
        } else if ((global.config_common.checkUserCompany(selfData) &&
            global.config_common.checkTradeCompanyByRole(selfData.role))) {
          //7 自己有公司 并且是一个交易的角色
          if (global.config_common.checkUserCompany(userData)) {
            //角色相同不处理
            if ((userData.role ==
                global.config_common.user_roles.TRADE_PURCHASE &&
                userData.role == selfData.role) ||
              (userData.role == global.config_common.user_roles.TRADE_SALE &&
                userData.role == selfData.role)) {
              // 7-1 如果自己是采购和销售并且看的人和自己的角色一样那么 不需要合作 status --> 空
              cb();
            } else if (userData.role ==
              global.config_common.user_roles.TRAFFIC_ADMIN || userData.role ==
              global.config_common.user_roles.TRAFFIC_CAPTAIN ||
              userData.role ==
              global.config_common.user_roles.TRAFFIC_EMPLOYEE) {
              // 对方的角色是物流管理员
              global.lib_work_relation.getCount({
                user_id: selfData._id.toString(),               //自己id
                company_id: selfData.company_id,             //自己公司id
                other_user_id: userData._id.toString(),         //对方id
                other_company_id: userData.company_id.toString(),          //对方公司id
                type: global.config_common.company_type.TRAFFIC,
              }, function(err, count) {
                if (err) {
                  return cb(err);
                }
                if (!count) {
                  //7-2 交易角色面对物流管理员角色 并且没有合作 status -
                  result.status = global.config_common.user_homepage_status.TRADE_TRAFFIC;
                } else {
                  //7-3 交易角色面对物流管理员角色 有合作关系 status --> '';
                  //可以取消合作
                  result.cancel = true;
                }
                cb();
              });
            } else {
              //采购-销售
              if (selfData.role ==
                global.config_common.user_roles.TRADE_PURCHASE ||
                userData.role == global.config_common.user_roles.TRADE_SALE) {
                global.lib_work_relation.getCount({
                  user_id: selfData._id.toString(),               //自己id
                  company_id: selfData.company_id,             //自己公司id
                  other_user_id: userData._id.toString(),         //对方id
                  other_company_id: userData.company_id,          //对方公司id
                  type: global.config_common.company_type.SALE,
                }, function(err, count) {
                  if (err) {
                    return cb(err);
                  }
                  if (!count) {
                    //7-4 采购-销售 没有合作关系 status
                    result.status = global.config_common.user_homepage_status.PURCHASE_SALE;
                  } else {
                    //7-5 采购-销售 有合作关系 status 为 空
                    //可以取消合作
                    result.cancel = true;
                  }
                  cb();
                });
                //销售-采购
              } else if (selfData.role ==
                global.config_common.user_roles.TRADE_SALE ||
                userData.role ==
                global.config_common.user_roles.TRADE_PURCHASE) {
                global.lib_work_relation.getCount({
                  user_id: selfData._id.toString(),               //自己id
                  company_id: selfData.company_id,             //自己公司id
                  other_user_id: userData._id.toString(),         //对方id
                  other_company_id: userData.company_id,          //对方公司id
                  type: global.config_common.company_type.PURCHASE,
                }, function(err, count) {
                  if (err) {
                    return cb(err);
                  }
                  if (!count) {
                    // 7-6 销售-采购 没有合作关系
                    result.status = global.config_common.user_homepage_status.SALE_PURCHASE;
                  } else {
                    // 7-7 销售-采购 有合作关系 status - 空
                    //可以取消合作
                    result.cancel = true;
                  }
                  cb();
                });
                //超管-超管
              } else {
                global.lib_work_relation.getList({
                  find: {
                    user_id: selfData._id.toString(),               //自己id
                    company_id: selfData.company_id,             //自己公司id
                    other_user_id: userData._id.toString(),         //对方id
                    other_company_id: userData.company_id           //对方公司id
                  },
                }, function(err, datas) {
                  if (err) {
                    return cb(err);
                  }
                  if (datas.length == 0) {
                    // 7-8 交易超管看交易超管 没有合作关系
                    result.status = global.config_common.user_homepage_status.TRADE_ADMIN;
                  } else if (datas.length == 2) {
                    // 7-9 交易超管看交易超管 有两项合作关系  status --> 空
                    //可以取消合作
                    result.cancel = true;
                  } else {
                    if (datas[0].type ==
                      global.config_common.company_type.PURCHASE) {
                      // 7-10 交易超管看交易超管 是销售对采购的关系
                      result.status = global.config_common.user_homepage_status.PURCHASE_SALE;
                      //可以取消合作
                      result.cancel = true;
                    } else {
                      // 7-11 交易超管看交易超管 是采购对销售的关系
                      result.status = global.config_common.user_homepage_status.SALE_PURCHASE;
                      //可以取消合作
                      result.cancel = true;
                    }
                  }
                  cb();
                });
              }
            }
          } else {
            cb();
          }
        } else {
          cb();
        }
      },
      //根据自己的id和对方的id查询result.friend应该是什么
      function(cb) {
        global.lib_apply_relation.checkFriendStatus(selfData, userData, cb);
      },
      function(role, cb) {
        if (role) {
          result.friend = role;
        }
        cb();
      },
    ], function(err) {
      if (err) {
        return next(err);
      }
      global.config_common.sendData(req, result, next);
    });
  });

  api.use(require('../../middlewares/mid_verify_user')());

  //来访公司用户列表
  api.post('/visitor_list', function(req, res, next) {
    if (!_.isNumber(req.body.page)) {
      req.body.page = 1;
    }
    //此处type可以不传参，直接用config_common中定义的字段
    if (!req.body.type) {
      return next('invalid_format');
    }
    var result = {};
    async.waterfall([
      function(cb) {
        global.lib_tip.getOne({
          find: {
            user_id: req.decoded.id,
            type: 'visitor',
          },
        }, cb);
      },
      function(tip, cb) {
        if (tip) {
          tip.update_time = new Date();
          tip.save(cb);
        } else {
          global.lib_tip.add({
            user_id: req.decoded.id,
            type: 'visitor',
            update_time: new Date(),
          }, cb);
        }
      },
      function(content, count, cb) {
        global.lib_apply_relation.getCount({
          user_id: req.decoded.id,
          'type': req.body.type,
        }, cb);
      },
      function(count, cb) {
        result.count = count;
        result.exist = count > req.body.page *
          global.config_common.entry_per_page;
        global.lib_apply_relation.getList({
          find: {
            user_id: req.decoded.id,
            'type': req.body.type,
          },
          skip: (req.body.page - 1) * global.config_common.entry_per_page,
          limit: global.config_common.entry_per_page,
        }, cb);
      },
      function(data, cb) {
        data = JSON.parse(JSON.stringify(data));
        result.list = data;
        async.eachSeries(data, function(one_dara, callback) {
          async.waterfall([
            function(cbk) {
              global.lib_user.getOne({find: {_id: one_dara.other_user_id}}, cbk);
            },
            function(data01, cbk) {
              one_dara.other_user_detail = data01;
              cbk();
            },
          ], callback);
        }, cb);
      },
    ], function(err, data) {
      if (err) {
        return next(err);
      }
      global.config_common.sendData(req, result, next);
    });
  });

  api.post('/login_data', function(req, res, next) {
    var userData;
    var hanzi;
    async.waterfall([
      function(cb) {
        global.lib_http.sendTradeServer({
          method: 'getList',
          cond: {find: {lev: 0}},
          model: 'Classify',
        }, global.config_api_url.trade_server_get_hanzi, cb);
      },
      function(han, cb) {
        hanzi = han;
        global.lib_user.getOne({find: {_id: req.decoded.id}}, cb);
      },
      function(user, cb) {
        if (!user) {
          return cb('user_not_found');
        }
        userData = user;
        if (user.company_id && user.role !==
          global.config_common.user_roles.TRAFFIC_DRIVER_PRIVATE) {
          global.lib_company.getOne({find: {_id: user.company_id}}, cb);
        } else {
          cb(null, null);
        }
      },
      function(company, cb) {
        if (req.body.admin) {
          var token = global.config_common.createTokenForReplace(userData, {});
          var data = {
            token: token,
            user: userData,
            arrSell: [],
            arrBuy: [],
            transport: [],
            hanzi: [],
            admin_id: '5976f947169e2997301675b0',
          };
        } else {
          var token = global.config_common.createTokenUser(userData, company ||
            {});
          var data = {
            token: token,
            user: userData,
            arrSell: [],
            arrBuy: [],
            transport: [],
            hanzi: [],
          };
        }
        data.hanzi = hanzi;
        var entry;
        if (company) {
          data.company = company.toObject();
          async.waterfall([
            function(cb) {
              //查询到
              global.lib_team.getOne(
                {find: {company_id: company._id.toString()}}, cb);
            },
            function(teamData, cb) {
              if (teamData) {
                data.company.team_id = [teamData.team_id];
              }
              entry = company;
              if (_.size(entry.sell)) {
                global.lib_http.sendTradeServer({
                  method: 'getList',
                  cond: {find: {eng: {$in: entry.sell}, lev: 0}},
                  model: 'Classify',
                }, global.config_api_url.trade_server_get_hanzi, cb);
              } else {
                cb(null, null);
              }
            },
            function(datas, cb) {
              if (datas) {
                for (var i = 0; i < datas.length; i++) {
                  data.arrSell.push(datas[i]);
                }
              }
              if (_.size(entry.buy)) {
                global.lib_http.sendTradeServer({
                  method: 'getList',
                  cond: {find: {eng: {$in: entry.buy}, lev: 0}},
                  model: 'Classify',
                }, global.config_api_url.trade_server_get_hanzi, cb);
              } else {
                cb(null, null);
              }
            },
            function(datas, cb) {
              if (datas) {
                for (var i = 0; i < datas.length; i++) {
                  data.arrBuy.push(datas[i]);
                }
              }
              if (_.size(entry.transport)) {
                global.lib_http.sendTradeServer({
                  method: 'getList',
                  cond: {find: {eng: {$in: entry.transport}, lev: 0}},
                  model: 'Classify',
                }, global.config_api_url.trade_server_get_hanzi, cb);
              } else {
                cb(null, null);
              }
            },
            function(datas, cb) {
              if (datas) {
                for (var i = 0; i < datas.length; i++) {
                  data.transport.push(datas[i]);
                }
              }
              cb();
            },
          ], function(err) {
            if (err) {
              return cb(err);
            }
            cb(null, data);
          });
        } else {
          async.waterfall([
            function(cb) {
              global.lib_user.getOne({find: {_id: req.decoded.id}}, cb);
            },
            function(user, cb) {
              entry = user;
              if (_.size(entry.sell)) {
                global.lib_http.sendTradeServer({
                    method: 'getList',
                    cond: {find: {eng: {$in: entry.sell}, lev: 0}},
                    model: 'Classify',
                  }, global.config_api_url.trade_server_get_hanzi, cb
                );
              } else {
                cb(null, null);
              }
            },
            function(datas, cb) {
              if (datas) {
                for (var i = 0; i < datas.length; i++) {
                  data.arrSell.push(datas[i]);
                }
              }
              if (_.size(entry.buy)) {
                global.lib_http.sendTradeServer({
                  method: 'getList',
                  cond: {find: {eng: {$in: entry.buy}, lev: 0}},
                  model: 'Classify',
                }, global.config_api_url.trade_server_get_hanzi, cb);
              } else {
                cb(null, null);
              }
            },
            function(datas, cb) {
              if (datas) {
                for (var i = 0; i < datas.length; i++) {
                  data.arrBuy.push(datas[i]);
                }
              }
              if (_.size(entry.transport)) {
                global.lib_http.sendTradeServer({
                  method: 'getList',
                  cond: {find: {eng: {$in: entry.transport}, lev: 0}},
                  model: 'Classify',
                }, global.config_api_url.trade_server_get_hanzi, cb);
              } else {
                cb(null, null);
              }
            },
            function(datas, cb) {
              if (datas) {
                for (var i = 0; i < datas.length; i++) {
                  data.transport.push(datas[i]);
                }
              }
              cb();
            },
          ], function(err) {
            if (err) {
              return cb(err);
            }
            cb(null, data);
          });
        }
        //cb(null, data);
      },
    ], function(err, result) {
      if (err) {
        return next(err);
      }
      global.config_common.sendData(req, result, next);
    });
  });

  /**
   * 得到一个公司所有的员工并按照角色分类
   * company_id
   */
  api.post('/get_list_company_role', function(req, res, next) {
    if (!req.body.company_id) {
      return next('invalid_format');
    }
    async.waterfall([
      function(cb) {
        global.lib_user.getListAll({
          find: {company_id: {$in: [req.body.company_id]}},
        }, cb);
      },
      function(users, cb) {
        //（1）确定有几个角色
        var arrRole = _.uniq(_.pluck(users, 'role'));
        //（2）声明最后返回的数组
        var result = [];
        //（3）确定数组的数据格式
        for (var i = 0; i < arrRole.length; i++) {
          result.push({
            role: arrRole[i],
            users: _.filter(users, function(num) {
              return num.role === arrRole[i];
            }),
          });
        }
        cb(null, result);
      },
    ], function(err, result) {
      if (err) {
        return next(err);
      }
      global.config_common.sendData(req, result, next);
    });
  });

  /**
   * 向指挥中心发送用户的手机信息
   */
  api.post('/add_system_info', function(req, res, next) {
    if (!req.body.user_id ||
      !req.body.platform ||
      !req.body.model ||
      !req.body.manufacturer ||
      !req.body.version) {
      return next('invalid_format');
    }
    async.waterfall([
      function(cb) {
        global.lib_user.getOne({find: {_id: req.body.user_id}}, cb);
      },
      function(user, cb) {
        if (!user) {
          return cb('user_not_found');
        }
        //修改指挥中心数据
        global.lib_http.sendAdminServer({
            user_id: req.body.user_id,
            role: user.role,
            platform: req.body.platform,
            model: req.body.model,
            manufacturer: req.body.manufacturer,
            version: req.body.version,
            update_time: new Date(),
          }, global.config_api_url.admin_server_add_system_info, cb
        );
      },
    ], function(err, content) {
      if (err) {
        return next(err);
      }
      global.config_common.sendData(req, content, next);
    });
  });

  /**
   * 查询到用户的公司群组信息
   * company_id
   */
  api.post('/get_team_data', function(req, res, next) {
    if (!req.body.company_id) {
      return next('invalid_format');
    }
    if (_.isArray(req.body.company_id)) {
      req.body.company_id = req.body.company_id[0];
    }
    if (req.decoded.role ==
      global.config_common.user_roles.TRAFFIC_DRIVER_PRIVATE) {
      global.config_common.sendData(req, {}, next);
    } else {
      var arr;
      var groupArr;
      async.waterfall([
        //修改查询条件
        function(cb) {
          //公司群
          global.lib_team.getList({
            find: {company_id: req.body.company_id,},
          }, cb);
        },
        function(teamData, cb) {
          arr = teamData;
          global.lib_relation_group.getListGroupUser({
            find: {member_id: req.decoded.id},
          }, cb);
        },
        function(groupList, cb) {
          groupArr = _.uniq(_.pluck(groupList, 'group_id'));
          global.lib_team.getList({
            find: {user_id: req.decoded.id},
          }, cb);
        },
        function(groupList, cb) {
          groupArr = groupArr.concat(_.uniq(_.pluck(groupList, 'group_id')));
          global.lib_team.getList({
            find: {group_id: {$in: groupArr}},
          }, cb);
        },
        function(teamData, cb) {
          arr = arr.concat(teamData);
          if (teamData.length) {
            var tids = JSON.stringify(_.pluck(arr, 'team_id'));
            sdk_im_wangyiyunxin.teamQuery({
              tids: tids,
              ope: 1,
            }, cb);
          } else {
            cb(null, null);
          }
        },
      ], function(err, result) {
        if (err) {
          return next(err);
        }
        global.lib_team.checkTeam({user_id: req.decoded.id}, arr);
        if (result) {
          result = JSON.parse(result);
          result = result.tinfos;
        }
        global.config_common.sendData(req, result, next);
      });
    }
  });

  api.post('/edit', function(req, res, next) {
    if (!req.body.sell &&
      !req.body.buy &&
      !req.body.transport) {
      return next('invalid_format');
    }
    async.waterfall([
      function(cb) {
        global.lib_user.getOneEasy({find: {_id: req.decoded.id}}, cb);
      },
      function(user, cb) {
        if (req.body.buy) {
          user.buy = req.body.buy;
        }
        if (req.body.sell) {
          user.sell = req.body.sell;
        }
        if (req.body.transport) {
          if (_.isString(req.body.transport)) {
            req.body.transport = req.body.transport.split(',');
          }
          user.transport = req.body.transport;
        }
        user.save(cb);
      },
    ], function(err, result) {
      if (err) {
        return next(err);
      }
      global.config_common.sendData(req, result, next);
    });
  });

  /**
   * 个人主页状态
   * 获得看个人主页的人和个人主页这个人之间的关系和有关系的订单列表
   */
  api.post('/homepage_relation_status', function(req, res, next) {
    if (!req.body.user_id) {
      return next('invalid_format');
    }
    var result = {};
    async.waterfall([
      function(cb) {
        if (req.body.user_id == req.decoded.id) {
          return cb('yourself');
        }
        //查询到人的信息
        global.lib_user.getOne({
          find: {_id: req.body.user_id},
        }, cb);
      },
      function(user, cb) {
        async.parallel({
          friend: function(cbk) {
            //查询到好友关系
            global.lib_user_relation.getOne({
              find: {
                user_id: req.decoded.id,
                other_id: req.body.user_id,
                type: 'FRIEND',
              },
            }, cbk);
          },
          work: function(cbk) {
            global.lib_company_relation.getOne({
              find: {self_id: req.decoded.company_id, other_id: user.company_id},
            }, cbk);
          },
          demand: function(cbk) {
            global.lib_http.sendTradeServer({
              method: 'getList',
              cond: {
                find: {
                  status: req.body.status,
                  type: 'DJ',
                  user_id: req.body.user_id,
                  has_order: {$in: [req.decoded.id]},
                },
              },
              model: 'PriceOffer',
            }, global.config_api_url.trade_server_get_hanzi, cbk);
          },
        }, function(err, data) {
          if (err) return cb(err);
          if (data.friend) {
            result.friend = true;
          } else {
            result.friend = false;
          }
          if (data.work) {
            result.work = true;
          } else {
            result.work = false;
          }
          if (data.demand) {
            result.count = data.demand.length;
          } else {
            result.count = 0;
          }
          cb();
        });
      },
    ], function(err) {
      if (err) {
        return next(err);
      }
      global.config_common.sendData(req, result, next);
    });
  });

  //获取某公司id或某公司名的相应职位人员电话和姓名
  api.post('/get_by_condition', function(req, res, next) {
    req.body.role = _.isString(req.body.role) ?
      JSON.parse(req.body.role) :
      req.body.role;
    req.body.company_id = _.isString(req.body.company_id) ?
      JSON.parse(req.body.company_id) :
      req.body.company_id;
    if (!req.body.role || req.body.role.length == 0 ||
      ((!req.body.company_id && !req.body.keyword) ||
        (req.body.company_id && req.body.company_id.length == 0))) {
      return next('invalid_format');
    }
    async.waterfall([
      function(cb) {
        if (req.body.company_id) {
          cb(null, req.body.company_id);
        } else {
          var re = new RegExp(req.body.keyword);
          CompanyTrade.find({full_name: re}).
            select('_id').
            exec(function(err, companyTrades) {
              if (err) {
                return next(err);
              }
              CompanyTraffic.find({full_name: re}).
                select('_id').
                exec(function(err, companyTraffics) {
                  if (err) {
                    return next(err);
                  }
                  var data = util.transObjArrToSigArr(
                    companyTraffics.concat(companyTrades), '_id');
                  cb(null, data);
                });
            });
        }
      },
      function(companyIdArr, cb) {
        CompanyList.find({company_id: {$in: companyIdArr}}, cb);
      },
      function(companys, cb) {
        if (companys.length > 0) {
          async.map(companys, function(company, mapCb) {
            var User;
            if (company.type == config_common.company_category.TRADE) {
              User = UserTrade;
            } else {
              User = UserTraffic;
            }
            User.find({
              role: {$in: req.body.role},
              company_id: company.company_id,
            }).select('real_name phone').exec(function(err, user) {
              mapCb(null, user || []);
            });
          }, function(err, users) {
            cb(null, users);
          });
        } else {
          cb(null, []);
        }
      },
    ], function(err, users) {
      if (err) {
        return next(err);
      }
      var data = [];
      for (var i = 0; i < users.length; i++) {
        if (users[i]) {
          data = data.concat(users[i]);
        }
      }
      config_common.sendData(req, data, next);
    });
  });

  //修改密码
  api.post('/modify_password', function(req, res, next) {
    if (!config_common.checkPassword(req.body.old_password) ||
      !config_common.checkPassword(req.body.new_password) ||
      !req.body.verify_code || !config_common.checkPhone(req.body.phone)) {
      return next('invalid_format');
    }
    async.waterfall([
      function(cb) {
        VerifyCode.findOne({phone: req.body.phone}, cb);
      },
      function(verifyCode, cb) {
        if (Date.now() - verifyCode.time_creation.getTime() >=
          config_common.verify_codes_timeout) {
          return cb('verify_code_timeout');
        }
        if (verifyCode.code !== req.body.verify_code) {
          return cb('invalid_verify_code');
        }
        var userDB;
        switch (verifyCode.companyType) {
          case config_common.company_category.TRADE:
            userDB = UserTrade;
            break;
          case config_common.company_category.TRAFFIC:
            userDB = UserTraffic;
            break;
          default :
            return cb('invalid_format');
        }
        userDB.findOne({phone: req.body.phone}).
          select('password').
          exec(function(err, user) {
            if (err) {
              return cb(err);
            }
            if (!user) {
              return cb('not_found');
            }
            if (user._id.toString() !== req.decoded.id) {
              return cb('not_allow');
            }
            if (!user.comparePassword(req.body.old_password)) {
              return cb('password_err');
            }
            user.password = req.body.new_password;
            user.save(cb);
          });
      },
    ], function(err, user) {
      if (err) {
        return next(err);
      }
      config_common.sendData(req, {}, next);
    });
  });

  //获取同事列表-3.0.0
  api.post('/get_colleague', function(req, res, next) {
    if (req.decoded.role ==
      global.config_common.user_roles.TRAFFIC_DRIVER_PRIVATE) {
      return next('not_allow');
    }
    var userData;
    var types;
    var count;
    async.waterfall([
      function(cb) {
        var cond = {company_id: req.decoded.company_id};
        if (req.decoded.role == global.config_common.user_roles.TRAFFIC_ADMIN) {
          cond = {company_id: req.decoded.company_id[0], role: 'TRAFFIC_ADMIN'};
        }
        types = [
          config_common.count_type.SALE,
          config_common.count_type.PURCHASE];
        if (req.decoded.role == global.config_common.user_roles.TRAFFIC_ADMIN) {
          // cond.role = global.config_common.user_roles.TRAFFIC_ADMIN;
          types = [
            config_common.count_type.TRAFFIC_LINE,
            config_common.count_type.TRADE_OFFER];
        }
        if (cond.company_id) {
          global.lib_user.getList({
            find: cond,
            select: 'company_id phone real_name role photo_url',
            sort: {real_name: -1},
          }, cb);
        } else {
          cb(null, []);
        }
      },
      function(users, cb) {
        userData = users;
        var user_ids = _.pluck(users, '_id');
        global.lib_count.get({
          body: {
            user_ids: user_ids,
            types: types,
          },
        }, cb);
      },
      function(counts, cb) {
        var arr = [];
        userData.forEach(function(user) {
          user = user.toObject();
          user.count = counts[user._id];
          arr.push(user);
        });
        userData = arr;
        global.lib_invitation_user.getList({
          find: {company_id: req.decoded.company_id, status: 'PROCESSING'},
          sort: {real_name: -1},
        }, cb);
      },
      function(users, cb) {
        for (var i = 0; i < users.length; i++) {
          var user = users[i].toObject();
          user.invitate = true;
          userData.push(user);
        }
        cb(null, userData);
      },
    ], function(err, result) {
      if (err) {
        return next(err);
      }
      global.config_common.sendData(req, result, next);
    });
  });

  //获取同事数量
  api.post('/get_colleague_count', function(req, res, next) {
    if (req.decoded.role ==
      global.config_common.user_roles.TRAFFIC_DRIVER_PRIVATE ||
      req.decoded.role ==
      global.config_common.user_roles.TRAFFIC_DRIVER_PUBLISH) {
      return next('not_allow');
    }
    var data = {};
    async.waterfall([
      function(cb) {
        if (req.decoded.role == global.config_common.user_roles.TRAFFIC_ADMIN) {
          global.lib_user.getList(
            {find: {company_id: req.decoded.company_id, role: 'TRAFFIC_ADMIN'}},
            cb);
        } else {
          global.lib_user.getList({find: {company_id: req.decoded.company_id}},
            cb);
        }
      },
      function(users, cb) {
        data.colleague_count = users.length;
        global.lib_invitation_user.getList({
          find: {company_id: req.decoded.company_id},
        }, cb);
      },
    ], function(err, result) {
      if (err) {
        return next(err);
      }
      data.invitate_colleague_count_ = result.length;
      global.config_common.sendData(req, data, next);
    });
  });

  //复制报价获取销售管理员列表-3.0.0
  api.post('/copy_pricing_get_colleague', function(req, res, next) {
    if (req.decoded.role !== global.config_common.user_roles.TRADE_ADMIN &&
      req.decoded.role !== global.config_common.user_roles.TRADE_SALE) {
      return next('not_allow');
    }

    if (!global.config_common.checkUserCompany(
        {role: req.decoded.role, company_id: req.decoded.company_id})) {
      return global.config_common.sendData(req, [], next);
    }

    var userData;
    var types;
    async.waterfall([
      function(cb) {
        var cond = {
          _id: {$nin: [req.decoded.id]},
          company_id: req.decoded.company_id,
          role: {
            $in: [
              global.config_common.user_roles.TRADE_SALE,
              global.config_common.user_roles.TRADE_ADMIN],
          },
        };
        types = [global.config_common.count_type.DJ];
        global.lib_user.getList({
          find: cond,
          select: 'real_name role photo_url',
          sort: {role: 1},
        }, cb);
      },
      function(users, cb) {
        userData = users;
        var user_ids = _.pluck(users, '_id');
        global.lib_count.get({
          body: {
            user_ids: user_ids,
            types: types,
          },
        }, cb);
      },
      function(counts, cb) {
        var arr = [];
        userData.forEach(function(user) {
          user = user.toObject();
          user.count = counts[user._id];
          arr.push(user);
        });
        cb(null, arr);
      },
    ], function(err, result) {
      if (err) {
        return next(err);
      }
      global.config_common.sendData(req, result, next);
    });
  });

  //获取聊天记录的人员公司信息
  api.post('/get_users_companies', function(req, res, next) {
    if (!_.isArray(req.body.user_ids)) {
      return next('invalid_format');
    }
    async.waterfall([
      function(cb) {
        global.lib_user.getList({
          find: {_id: {$in: req.body.user_ids}},
          select: 'real_name photo_url',
        }, cb);
      },
      function(users, cb) {
        var company_ids = global.lib_util.transObjArrToSigArr(users,
          'company_id');
        global.lib_company.getList({
          find: {_id: {$in: company_ids}},
          select: 'nick_name full_name verify_phase',
        }, function(err, companies) {
          if (err) {
            return cb(err);
          }
          var arr = [];
          var companyObj = global.lib_util.transObjArrToObj(companies, '_id');
          for (var i = 0; i < users.length; i++) {
            var user = users[i];
            arr.push({
              company: companyObj[user.company_id],
              user: user,
            });
          }
          cb(null, arr);
        });
      },
    ], function(err, result) {
      if (err) {
        return next(err);
      }
      global.config_common.sendData(req, result, next);
    });
  });

  //根据传来的通讯录号码，返回对应的数据
  api.post('/get_user_info_by_phones', function(req, res, next) {
    req.body.users = JSON.parse(req.body.users);
    //判断传来的数据是否为数组
    if (!_.isArray(req.body.users)) {
      return next('invalid_format');
    }
    //data,用来收集对应的数据；
    var data = {};
    data.phones = global.lib_util.transObjArrToSigArr(req.body.users, 'phone');
    var acpUser;
    //  async 异步控制
    async.waterfall([
      //确认人的基本信息
      function(cb) {
        global.lib_user.getListAll({
          find: {phone: {$in: data.phones}},
          select: 'phone company_id real_name photo_url',
        }, cb);
      },
      //确认公司的基本信息
      function(users, cb) {
        acpUser = users;
        data.users = global.lib_util.transObjArrToObj(users, 'phone');
        var company_ids = global.lib_util.transObjArrToSigArr(acpUser,
          'company_id');
        global.lib_company.getListAll({
          find: {_id: {$in: company_ids}},
          select: 'nick_name verify_phase',
        }, cb);
      },
      //确认好友关系
      function(companies, cb) {
        data.companies = global.lib_util.transObjArrToObj(companies, '_id');
        var other_ids = global.lib_util.transObjArrToSigArr(acpUser, '_id');
        var cond = {
          user_id: req.decoded.id,
          other_id: {$in: other_ids},//这个id应该来自上面user表查到的
          type: global.config_common.relation_style.FRIEND,
        };
        global.lib_user_relation.getList({
          find: cond,
          select: 'other_id',
        }, cb);
      },
      //确认同事关系
      function(friends, cb) {
        data.friends = global.lib_util.transObjArrToObj(friends, 'other_id');
        var other_ids = global.lib_util.transObjArrToSigArr(acpUser, '_id');
        var cond = {
          user_id: req.decoded.id,
          other_user_id: {$in: other_ids},
        };
        global.lib_work_relation.getList({
          find: cond,
          select: 'other_user_id',
        }, cb);
      },
      //确认是否上线-->得到的是未上线人的phone
      function(colleagues, cb) {
        data.colleagues = global.lib_util.transObjArrToObj(colleagues,
          'other_user_id');
        var other_ids = global.lib_util.transObjArrToSigArr(acpUser, '_id');
        var cond = {
          user_id: req.decoded.id,
          phone: {$in: data.phones},
        };
        global.lib_invitation_user.getList({
          find: cond,
          select: 'phone',
        }, cb);
      },
      //整合数据-->直接传给前端整理好的数据
      function(relations, cb) {
        data.actives = global.lib_util.transObjArrToObj(relations, 'phone');
        var arr = [];
        for (var i = 0; i < req.body.users.length; i++) {
          var user = req.body.users[i];
          var userData = data.users[user.phone];
          var companyData = userData ?
            data.companies[userData.company_id] || {} :
            {};
          var friendData = userData ?
            data.friends[userData._id.toString()] :
            '';
          var colleagueData = userData ?
            data.colleagues[userData._id.toString()] :
            '';
          var activeData = data.actives[user.phone];
          var res = {};
          res.phone = user.phone;
          res.user_name = userData ? userData.real_name : user.name;
          res.photo_url = userData ? userData.photo_url : '';
          res.company_name = companyData.nick_name;
          res.verify_phase = companyData.verify_phase;
          if (friendData) {
            res.add = true;
          } else if (colleagueData) {
            res.add = true;
          } else {
            res.add = false;
          }
          res.actives = !!activeData;
          arr.push(res);
        }
        cb(null, arr);
      },
    ], function(err, result) {
      if (err) {
        return next(err);
      }
      global.config_common.sendData(req, result, next);
    });

  });

  //查询个人是否有申请公司，有的话返回申请的公司的信息
  api.post('/get_supply_company', function(req, res, next) {
    async.waterfall([
      function(cb) {
        global.lib_apply_relation.getList({
          find: {
            other_user_id: req.decoded.id,
            status: global.config_common.relation_status.WAIT,
            type: global.config_common.relation_style.COMPANY_INVITE,
          },
        }, cb);
      },
      function(supply, cb) {
        if (supply) {
          gllbal.lib_company.getOne({find: {_id: supply.company_id}}, cb);
        } else {
          cb(null, null);
        }
      },
    ], function(err, result) {
      if (err) {
        return next(err);
      }
      global.config_common.sendData(req, result, next);
    });
  });

  /**
   * 超管修改手下角色
   * role:修改成的角色
   * id:被修改者的id
   */
  api.post('/edit_role', function(req, res, next) {
    var role = global.config_common.user_roles[req.body.role];
    if (!req.body.id || !req.body.role || !role) {
      return next('invalid_format');
    }
    async.waterfall([
      function(cb) {
        global.lib_user.getOneEasy({find: {_id: req.body.id}}, cb);
      },
      function(user, cb) {
        global.lib_http.sendTradeServer({
          method: 'getCount',
          cond: {
            status: {$ne: 'complete'},
            '$or': [{user_demand_id: user._id}, {user_supply_id: user._id}],
          },
          model: 'DemandOrder',
        }, global.config_api_url.server_common_get, function(err, tradeCount) {
          if (err) {
            return cb(err);
          }
          if (tradeCount) {
            return cb('您还有未完成订单');
          }
          global.lib_http.sendTrafficServer({
              method: 'getCount',
              cond: {
                status: {$ne: 'complete'},
                '$or': [{demand_user_id: user._id}, {supply_user_id: user._id}],
              },
              model: 'TrafficOrder',
            }, global.config_api_url.server_common_get,
            function(err, trafficCount) {
              if (err) {
                return cb(err);
              }
              if (trafficCount) {
                return cb('您还有未完成订单');
              }
              cb(null, user);
            });
        });
      },
      function(user, cb) {
        if (user) {
          user.role = req.body.role;
          user.save(cb);

          global.lib_http.sendTradeServer({user_id: user._id.toString()},
            global.config_api_url.server_change_change, cb);
        } else {
          cb(null, null, null);
        }
      },
    ], function(err, result, count) {
      if (err) {
        return next(err);
      }
      global.config_common.sendData(req, result, next);
    });
  });

  return api;
};
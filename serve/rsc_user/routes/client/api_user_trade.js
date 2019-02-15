/**
 * Created by Administrator on 2015/11/6 0006.
 */
var async = require('async');
var _ = require('underscore');
var express = require('express');

var http = require('../../libs/lib_http');
var util = require('../../libs/lib_util');
var companyService = require('../../libs/lib_company');

var sdk_im_wangyiyunxin = require('../../sdks/im_wangyiyunxin/sdk_im_wangyiyunxin');

var User = require('../../models/User_trade');
var Truck = require('../../models/Truck');
var Company = require('../../models/Company_trade');
var VerifyCode = require('../../models/Verify_code');
var Driver_verify = require('../../models/Driver_verify');
var UserTraffic = require('../../models/User_traffic');
var User_trade = require('../../models/User_trade');
var CompanyTraffic = require('../../models/Company_traffic');

var configCity = require('../../configs/config_city');
var configDistrict = require('../../configs/config_district');
var configProvince = require('../../configs/config_province');
var config_common = require('../../configs/config_common');
var config_api_url = require('../../configs/config_api_url');
var config_msg_url = require('../../configs/config_msg_url');
var config_server = require('../../configs/config_server');


module.exports = function () {
    var api = express.Router();

    //删除发送用户短信时间--服务器用
    api.post('/delete_user_sms_time', function (req, res, next) {
        User_trade.find({}, function (err, offerlist) {
            if (err) return next('user smstime delect ERROR at ' + new Date().toString());
            var date = new Date();
            offerlist.forEach(function (offer) {
                var sms_timeArr = offer.sms_timeArr;
                for (var i = 0; i < sms_timeArr.length; i++) {
                    if (sms_timeArr[i].getTime() < date.getTime() - 1000 * 60 * 120) {
                        sms_timeArr.splice(i, 1);
                        i--;
                    }
                }
                offer.save(function (err) {
                    if (err) return next('user smstime delect ERROR at ' + new Date().toString());
                });
            });
        });
    });

    //删除发送用户短信时间--服务器用
    api.post('/delete_traffic_user_sms_time', function (req, res, next) {
        UserTraffic.find({}, function (err, offerlist) {
            if (err) return next('user smstime delect ERROR at ' + new Date().toString());
            var date = new Date();
            offerlist.forEach(function (offer) {
                var sms_timeArr = offer.sms_timeArr;
                for (var i = 0; i < sms_timeArr.length; i++) {
                    if (sms_timeArr[i].getTime() < date.getTime() - 1000 * 60 * 10) {
                        sms_timeArr.splice(i, 1);
                        i--;
                    }
                }
                offer.save(function (err) {
                    if (err) return next('user smstime delect ERROR at ' + new Date().toString());
                });
            });
        });
    });

    //删除发送用户短信时间--服务器用
    api.post('/delete_traffic_user_sms_length', function (req, res, next) {
        UserTraffic.update({}, {sms_length: 0}, function (err) {
            if (err) return next('user smstime delect ERROR at ' + new Date().toString());
        });
    });

    api.use(require('../../middlewares/mid_verify_user')());

    api.get('/me', function (req, res, next) {
        User.findById(req.decoded.id, function (err, user) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, {user: user}, next);
        });
    });

    //首页设置删除里面的某个内容
    api.post('/delete_from_home_see', function (req, res, next) {
        if (!req.body.name) {
            return next('invalid_format');
        }
        async.waterfall([
            function (cb) {
                User.findById(req.decoded.id, cb);
            },
            function (user, cb) {
                if (!user) {
                    return cb('not_found');
                }
                var edit = false;
                if (user.home_see) {
                    user.home_see = _.without(user.home_see, req.body.name);
                    edit = true;
                }
                if (edit) {
                    user.save(cb);
                } else {
                    cb(null, user);
                }
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, result.home_see || [], next);
        });
    });

    api.post('/modify_self', function (req, res, next) {
        if (!req.body.phone && !req.body.real_name && !req.body.gender && !req.body.photo_url && !req.body.mail && !req.body.addr && !req.body.sign && !_.isString(req.body.post) && !req.body.district && !req.body.city && !req.body.province && !req.body.home_see && !req.body.role) {
            return next('invalid_format');
        }
        if (req.body.province || req.body.city || req.body.district) {
            if (!config_common.checkProvince(req.body.province) || !config_common.checkCity(req.body.province, req.body.city) || !config_common.checkDistrict(req.body.city, req.body.district)) {
                return next('invalid_format');
            }
        }
        if ((req.body.phone && !config_common.checkPhone(req.body.phone) && req.body.verify_code) ||
            (req.body.real_name && !config_common.checkRealName(req.body.real_name)) ||
            (req.body.gender && !config_common.checkGender(req.body.gender)) ||
            (req.body.role && !config_common.checkRoleType(req.body.role))) {
            return next('invalid_format');
        }
        var edit = false;
        var company;
        async.waterfall([
            function (cb) {
                //if(req.body.sell || req.body.buy){
                //    Company.findById(req.decoded.company_id, function(err, data){
                //        if(err){
                //            return cb(err);
                //        }
                //        company = data;
                //        var count = config_common.self_setting_not_verify_count;
                //        if(company.verify_phase == config_common.verification_phase.SUCCESS){
                //            count = config_common.self_setting_verify_count;
                //        }
                //        if((req.body.sell && req.body.sell.length > count) ||
                //            (req.body.buy && req.body.buy.length > count)){
                //            return cb('invalid_format');
                //        }
                //        cb();
                //    });
                //}else{
                cb();
                //}
            },
            function (cb) {
                User.findById(req.decoded.id, cb);
            },
            function (user, cb) {
                if (!user) {
                    return cb('not_found');
                }
                global.lib_user.editAll(req.decoded.id, req.body, function (err, result) {
                    if (err) {
                        console.log(err);
                    }
                    cb(null, user);
                });
            },
            function (user, cb) {
                if (req.body.role &&
                    user.role == config_common.user_roles.TRADE_ADMIN &&
                    user.role !== req.body.role &&
                    req.body.role.indexOf(config_common.company_category.TRADE) >= 0) {
                    User.count({
                        company_id: req.decoded.company_id,
                        role: config_common.user_roles.TRADE_ADMIN
                    }, function (err, count) {
                        if (err) {
                            return cb(err);
                        }
                        if (count <= 1) {
                            return cb('admin_must_exist_one');
                        }
                        user.role = req.body.role;
                        edit = true;
                        cb(null, user);
                    });
                } else {
                    cb(null, user);
                }
            },
            function (user, cb) {
                //if((req.decoded.role == config_common.user_roles.TRADE_PURCHASE ||
                //    req.decoded.role == config_common.user_roles.TRADE_ADMIN) && req.body.buy){
                //    user.buy = req.body.buy;
                //    edit = true;
                //}
                //if((req.decoded.role == config_common.user_roles.TRADE_SALE ||
                //    req.decoded.role == config_common.user_roles.TRADE_ADMIN) && req.body.sell){
                //    user.sell = req.body.sell;
                //    edit = true;
                //}
                if ((req.decoded.role == config_common.user_roles.TRADE_SALE ||
                    req.decoded.role == config_common.user_roles.TRADE_PURCHASE ||
                    req.decoded.role == config_common.user_roles.TRADE_ADMIN) &&
                    req.body.home_see) {
                    user.home_see = req.body.home_see;
                    edit = true;
                }
                if (req.body.real_name && req.body.real_name !== user.real_name) {
                    //user.real_name = req.body.real_name;
                    global.lib_user.editAll(req.decoded.id, req.body, function (err, result) {
                        if (err) {
                            console.log(err);
                        }
                    });
                    edit = true;
                }
                if (req.body.gender && req.body.gender !== user.gender) {
                    //user.gender = req.body.gender;
                    global.lib_user.editAll(req.decoded.id, req.body, function (err, result) {
                        if (err) {
                            console.log(err);
                        }
                    });
                    edit = true;
                }
                if (req.body.photo_url && req.body.photo_url !== user.photo_url) {
                    user.photo_url = req.body.photo_url;
                    edit = true;
                }
                if (req.body.province && req.body.province !== user.province) {
                    user.province = configProvince[req.body.province].name;
                    edit = true;
                }
                if (req.body.city && req.body.city !== user.city) {
                    user.city = configCity[req.body.province][req.body.city].name;
                    edit = true;
                }
                if (req.body.district && req.body.district !== user.district) {
                    user.district = configDistrict[req.body.city][req.body.district].name;
                    edit = true;
                }
                if (req.body.addr && req.body.addr !== user.addr) {
                    user.addr = req.body.addr;
                    edit = true;
                }
                if (req.body.mail && req.body.mail !== user.mail) {
                    user.mail = req.body.mail;
                    edit = true;
                }
                if (_.isString(req.body.post) && req.body.post !== user.post) {
                    user.post = req.body.post;
                    edit = true;
                }
                if (req.body.sign && req.body.sign !== user.sign) {
                    user.sign = req.body.sign;
                    edit = true;
                }
                if (edit) {
                    user.save(cb);
                } else {
                    cb(null, user);
                }
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            sdk_im_wangyiyunxin.updateUser({
                accid: result._id.toString(),
                name: result.real_name,
                icon: result.photo_url
            });
            config_common.sendData(req, result, next);
        });
    });

    api.post('/get_colleague', function (req, res, next) {
        if (!config_common.checkTradeCompanyByRole(req.decoded.role)) {
            return next('not_allow');
        }
        User.find({company_id: req.decoded.company_id}, function (err, result) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, result, next);
        });
    });

    api.post('/get_colleague_count', function (req, res, next) {
        if (!config_common.checkTradeCompanyByRole(req.decoded.role)) {
            return next('not_allow');
        }
        User.count({company_id: req.decoded.company_id}, function (err, result) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, result, next);
        });
    });

    //通过user_id获取人
    api.post('/get_by_id', function (req, res, next) {
        if (!(req.body.user_id)) {
            return next('invalid_format');
        }
        async.waterfall([
            function (cb) {
                User.findById(req.body.user_id, cb);
            },
            function (user, cb) {
                if (user) {
                    return cb(null, user);
                }
                UserTraffic.findById(req.body.user_id, cb);
            },
            function (user, cb) {
                if (!user) {
                    return cb('not_found');
                }
                if (user.role == config_common.user_roles.TRAFFIC_DRIVER_PRIVATE) {
                    Truck.findOne({
                        create_user_id: req.body.user_id
                    }, function (err, truck) {
                        if (err) {
                            return cb(err);
                        }
                        var data = user.toObject();
                        data.truck = truck;
                        cb(null, data);
                    });
                } else {
                    cb(null, user);
                }
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, result, next);
        });
    });

    //获取不是这个store_id的库管人
    api.post('/get_store_user_except_store_id', function (req, res, next) {
        if (!(req.body.store_id)) {
            return next('invalid_format');
        }
        if (!config_common.checkAdmin(req.decoded.role)) {
            return next('not_allow');
        }
        async.waterfall([
            function (cb) {
                User.find({
                    store_id: {$nin: [req.body.store_id]},
                    role: config_common.user_roles.TRADE_STORAGE,
                    company_id: req.decoded.company_id
                }, cb);
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, result, next);
        });
    });

    //获取本公司某职位的人
    api.post('/get_user_by_role', function (req, res, next) {
        if (!config_common.checkAdmin(req.decoded.role)) {
            return next('not_allow');
        }
        if (!config_common.checkRoleType(req.body.role)) {
            return next('invalid_format');
        }
        async.waterfall([
            function (cb) {
                User.find({
                    role: req.body.role,
                    company_id: req.decoded.company_id
                }, cb);
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, result, next);
        });
    });

    //按页获取人员
    api.post('/get_user_by_page', function (req, res, next) {
        if (!req.body.page) {
            req.body.page = 1;
        }
        async.waterfall([
            function (cb) {
                if (req.decoded.role !== config_common.user_roles.TRAFFIC_ADMIN) {
                    return cb('not_allow');
                }
                User.find({company_id: req.decoded.company_id})
                    .skip((req.body.page - 1) * config_common.user_per_page)
                    .limit(config_common.user_per_page)
                    .exec(function (err, users) {
                        if (err) {
                            return cb(err);
                        }
                        cb(null, users);
                    });
            }
        ], function (err, users) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, users, next);
        });
    });

    //给某个公司某些人发送消息
    api.post('/send_sms', function (req, res, next) {
        var data = req.body;
        var cond = {};
        if (data.company_id) {
            cond.company_id = data.company_id;
        }
        if (data.role) {
            cond.role = {$in: data.role};
        }
        if (data.store_id) {
            cond.store_id = data.store_id;
        }
        if (cond && process.env.node_env == 'pro') {
            User.find(cond).select('_id phone').exec(function (err, users) {
                if (users.length > 0) {
                    users = util.transObjArrToSigArr(users, 'phone');
                    http.sendMsgServerSMS(req, 'operation', {template_id: data.template_id, phone_list: users});
                }
                config_common.sendData(req, {}, next);
            });
        } else {
            config_common.sendData(req, {}, next);
        }
    });

    //获取用户角色
    api.post('/get_user_role', function (req, res, next) {
        var data = req.body;
        var cond = {};
        if (!data.user_id) return next();
        if (!data.company_id) return next();
        cond._id = data.user_id;
        if (data.type == "TRADE") {
            User.findOne(cond, {'role': 1, 'real_name': 1}, function (err, role) {
                if (!!err || !role) return next();
                Company.findOne({_id: data.company_id}, {full_name: 1}, function (err, comp) {
                    if (!!err)  return next();
                    config_common.sendData(req, JSON.stringify({
                        role: role.role,
                        user_name: role.real_name,
                        company_name: comp.full_name
                    }), next);
                });
            });
        } else {
            UserTraffic.findOne(cond, {'role': 1, 'real_name': 1}, function (err, role) {
                if (!!err || !role) return next();
                CompanyTraffic.findOne({_id: data.company_id}, {full_name: 1}, function (err, comp) {
                    if (!!err)  return next();
                    config_common.sendData(req, JSON.stringify({
                        role: role.role,
                        user_name: role.real_name,
                        company_name: comp.full_name
                    }), next);
                });
            });
        }

    });

    //修改理记状态
    api.post('/copy_quotation', function (req, res, next) {
        Company_trade.update({_id: req.body.company_id}, {is_update: req.body.type}, function (err) {
            if (err) return next();
            config_common.sendData(req, {}, next);
        });
    });

    //获取交易管理员和销售负责人的列表
    api.post('/copy_quotation', function (req, res, next) {
        User_trade.find({
            _id: {$nin: [req.decoded.id]},
            role: {$in: [config_common.user_roles.TRADE_SALE, config_common.user_roles.TRADE_ADMIN]}
        }, function (err, list) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, list, next);
        })
    });

    //获取公司买卖的行业大类
    api.post('/get_material_category', function (req, res, next) {

        var materialArr = [];
        var obj = {};
        async.waterfall([
            function (cb) {
                companyService.getOne({
                    find: {_id: req.decoded.company_id}
                }, cb);
            },
            function (company, cb) {
                materialArr = materialArr.concat(company.buy);
                materialArr = materialArr.concat(company.sell);
                materialArr = util.getArr(materialArr);
                async.eachSeries(materialArr, function (material, cbk) {
                    http.sendTradeServerNoToken(req, {category: material},
                        config_api_url.trade_server_demand_list_goods, function (err, resCategory) {
                            obj[material] = resCategory;
                            cbk();
                        });
                }, cb);
            }
        ], function (err) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, obj, next);
        });
    });

    return api;
};
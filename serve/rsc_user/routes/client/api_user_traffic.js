/**
 * Created by Administrator on 2015/11/23.
 */
var _ = require('underscore');
var async = require('async');
var express = require('express');

var http = require('../../libs/lib_http');
var util = require('../../libs/lib_util');
var truckService = require('../../libs/lib_truck');
var trafficUserService = require('../../libs/lib_traffic_user');
var companyRelation = require('../../libs/lib_company_relation');
var userService = require('../../libs/lib_user');
var companyService = require('../../libs/lib_company');
var verifyCodeService = require('../../libs/lib_verify_code');
var request = require('request');

var Truck = require('../../models/Truck');
var User = require('../../models/User_traffic');
var VerifyCode = require('../../models/Verify_code');
var Company = require('../../models/Company_traffic');
var DriverVerify = require('../../models/Driver_verify');
var configCity = require('../../configs/config_city');

var config_api_url = require('../../configs/config_api_url');
var config_msg_url = require('../../configs/config_msg_url');
var configDistrict = require('../../configs/config_district');
var configProvince = require('../../configs/config_province');
var config_common = require('../../configs/config_common');
var config_server = require('../../configs/config_server');

var sdk_im_wangyiyunxin = require('../../sdks/im_wangyiyunxin/sdk_im_wangyiyunxin');

module.exports = function () {

    var api = express.Router();

    api.use(require('../../middlewares/mid_verify_user')());

    //物管添加车辆(物流订单中添加车辆)
    api.post('/traffic_admin_add_user_truck', function (req, res, next) {
        if (req.decoded.role !== config_common.user_roles.TRAFFIC_ADMIN &&
            req.decoded.role !== config_common.user_roles.TRAFFIC_EMPLOYEE &&
            req.decoded.role !== config_common.user_roles.TRAFFIC_CAPTAIN) {
            return next('not_allow');
        }
        if (!req.body.number) {
            req.body.number = config_common.getRandomTruckNumber();
        }
        if (!config_common.checkPhone(req.body.phone) || !req.body.number) {
            return next('invalid_format');
        }
        var selfUser;
        var selfCompany;
        var userData;
        var truckData;
        var is_have = false;
        var panDuan;
        var data_g;
        async.waterfall([
            function (cb) {
                global.lib_user.getOneTraffic({
                    find: {
                        _id: req.decoded.id
                    }
                }, cb);
            },
            function (user, cb) {
                selfUser = user;
                global.lib_company.getOne({find: {_id: req.decoded.company_id}}, cb);
            },
            function (company, cb) {
                selfCompany = company;
                global.lib_user.getOneTraffic({
                    find: {
                        source: {$exists: false},
                        phone: req.body.phone,
                        role: config_common.user_roles.TRAFFIC_DRIVER_PRIVATE
                    }
                }, cb);
            },
            function (user, cb) {
                if (user) {
                    global.lib_driver_verify.getOne({
                        find: {
                            user_id: user._id.toString(),
                            company_id: req.decoded.company_id
                        }
                    }, cb)
                } else {
                    return cb(null, null);
                }
            },
            function (apply, cb) {
                if (apply) {
                    return cb('该司机已被本企业其他负责人添加');
                }
                global.lib_truck.getOne({
                    find: {number: req.body.number, "user_id.0": {"$exists": true}}
                }, cb);
            },
            function (truck, cb) {
                if (truck) {
                    request(util.shortenurl(config_server.share_url + config_common.download_url), function (err, http_req, http_res) {
                        if (err) {
                            return cb('err');
                        }
                        var data = JSON.parse(http_res);
                        data = data.urls;
                        data = data[0].url_short;
                        http.sendMsgServerSMS1(req, 'GBK', {
                            template_id: 'traffic_add_truck_new',
                            content: [selfCompany.nick_name, selfUser.real_name, selfUser.phone, data],
                            phone_list: [req.body.phone]
                        }, null);
                    });
                }
                cb();
            },
            function (cb) {
                //检查本公司挂靠车辆不能多于最大值
                truckService.getDriverTruck(req.decoded.company_id, cb);
            },
            function (trucks, cb) {
                //检查本公司挂靠车辆不能多于最大值
                if (trucks.length >= config_common.company_private_truck_number) {
                    return cb('private_truck_is_max');
                } else {
                    cb();
                }
            },
            function (cb) {
                //查询这个司机的验证码是否存在
                global.lib_verify_code.getOne({
                    find: {
                        phone: req.body.phone,
                        type: global.config_common.verify_code_type['com.rsc.android_driver']
                    }
                }, cb);
            },
            function (v_code, cb) {
                if (!v_code) {
                    var obj = {
                        code: '111111',
                        phone: req.body.phone,
                        companyType: config_common.company_category.TRAFFIC,
                        type: global.config_common.verify_code_type['com.rsc.android_driver']
                    }
                    global.lib_verify_code.add(obj, cb);
                } else {
                    cb(null, v_code, 1);
                }
            },
            function (verifyCode, count, cb) {
                global.lib_user.getOneTraffic({
                    find: {
                        phone: req.body.phone,
                        role: config_common.user_roles.TRAFFIC_DRIVER_PRIVATE,
                        source: {$exists: false},
                    }
                }, cb);
            },
            function (user, cb) {
                if (user) {
                    user.company_id = _.union(user.company_id, req.decoded.company_id);
                    user.save(cb);
                } else {
                    //添加人和角色
                    global.service_user.add({
                        phone: req.body.phone,
                        real_name: req.body.real_name,
                        type: global.config_common.user_type.DRIVER,
                        transport: req.body.transport,
                    }, function (err, user) {
                        if (err) {
                            return cb(err);
                        }
                        cb(null, user, 1);
                    });
                }
            },
            function (user, count, cb) {
                userData = user;
                global.lib_truck.getOne({
                    find: {user_id: {$in: [userData._id.toString()]}}
                }, cb);
            },
            function (truck, cb) {
                if (truck) {
                    cb(null, null, null);
                } else {
                    global.lib_truck.add({
                        create_user_id: userData._id.toString(),
                        create_company_id: '',
                        number: req.body.number,
                        type: req.body.type,
                        weight: req.body.weight,
                        user_id: [userData._id.toString()],
                        long: req.body.long
                    }, cb);
                }
                // if (!truck) {
                //     global.lib_truck.add({
                //         create_user_id: userData._id.toString(),
                //         create_company_id: '',
                //         number: req.body.number,
                //         type: req.body.type,
                //         weight: req.body.weight,
                //         user_id: [userData._id.toString()],
                //         long: req.body.long,
                //         is_default: true
                //     }, cb);
                // } else {
                //     truck.create_user_id = userData._id.toString();
                //     truck.create_company_id = '';
                //     truck.number = req.body.number;
                //     truck.type = req.body.type;
                //     truck.weight = req.body.weight;
                //     truck.user_id = [userData._id.toString()];
                //     truck.compile_status = false;
                //     truck.long = req.body.long;
                //     truck.save(cb);
                // }
            },
            function (truck, count, cb) {
                truckData = truck;
                global.lib_driver_verify.getOne({
                    find: {
                        user_id: userData._id.toString(),
                        company_id: req.decoded.company_id
                    }
                }, cb);
            },
            function (apply, cb) {
                if (!apply) {
                    global.lib_driver_verify.add({
                        company_id: req.decoded.company_id,
                        user_id: userData._id.toString(),
                        approve_id: req.decoded.id
                    }, function (err, content, count) {
                        cb();
                    });
                } else {
                    cb();
                }
            },
            function (cb) {
                if (req.body.group_id && userData) {
                    data_g = {
                        "member_id": userData._id.toString(),
                        "type": "DRIVER",
                        "group_id": req.body.group_id,
                        "company_id": selfCompany._id.toString(),
                    }
                    global.lib_relation_group.getOneGroupUser({find: data_g}, cb);
                } else {
                    cb(null, null);
                }
            },
            function (count, cb) {
                if (count) {
                    cb()
                } else {
                    global.lib_relation_group.addGroupUser(data_g, cb);
                }
            }
        ], function (err) {
            if (err) {
                return next(err);
            }
            var data = {user: userData, truck: truckData};
            config_common.sendData(req, data, next);
            if (!is_have) {
                request(util.shortenurl(config_server.share_url + config_common.download_url), function (err, http_req, http_res) {
                    if (err) {
                        return cb('err');
                    }
                    var data = JSON.parse(http_res);
                    data = data.urls;
                    data = data[0].url_short;
                    // http.sendMsgServerSMS1(req, 'GBK', {
                    //     template_id: 'traffic_add_truck_new',
                    //     content: [selfCompany.nick_name, selfUser.real_name, selfUser.phone, data],
                    //     phone_list: [req.body.phone]
                    // }, null);
                    global.lib_http.sendTrafficServer({
                        method: 'getCount',
                        cond: {company_id: selfCompany._id.toString()},
                        model: 'TrafficLine'
                    }, global.config_api_url.server_common_get, function (err, count) {
                        global.lib_http.sendTrafficServer({
                            method: 'getOne',
                            cond: {find: {company_id: req.decoded.company_id, status: 'effective'}},
                            model: 'RedCard'
                        }, global.config_api_url.server_common_get, function (err, redData) {
                            if (redData) {
                                var str = '24小时内登录赠送' + redData.money + '元现金红包'
                                //切换短信为网易云短信，模板
                                global.lib_http.sendMsgServerSMSNew(req, {
                                    phone: JSON.stringify([req.body.phone]),
                                    params: JSON.stringify([selfCompany.nick_name, count, str, 'vehicles.e-wto.com']),
                                    templateid: '3942839'
                                }, '/msg/send_driver_sms', function (err) {
                                    console.log('err:', err);
                                    global.lib_http.sendTrafficServer({
                                        company_id: req.decoded.company_id,
                                        user_id: userData._id.toString(),
                                        user_phone: userData.phone
                                    }, '/api/server/common/depend_red_card', function (a, b) {

                                    })
                                });
                            } else {
                                //切换短信为网易云短信，模板
                                global.lib_http.sendMsgServerSMSNew(req, {
                                    phone: JSON.stringify([req.body.phone]),
                                    params: JSON.stringify([selfCompany.nick_name, count, 'vehicles.e-wto.com']),
                                    templateid: '3902721'
                                }, '/msg/send_driver_sms', function (err) {
                                    console.log('err:', err);
                                });
                            }
                        });
                    });

                });
            }
        });
    });

    //物管添加多个车辆(物流订单中添加车辆)
    api.post('/traffic_admin_add_users_trucks', function (req, res, next) {
        if (req.decoded.role !== config_common.user_roles.TRAFFIC_ADMIN) {
            return next('not_allow');
        }
        if (!req.body.TotalPhoneNumbers) {
            return next('not_allow');
        }
        async.each(req.body.TotalPhoneNumbers, function (data, callback) {
            if (!config_common.checkPhone(data.phone) ||
                !config_common.checkRealName(data.name)) {
                return callback('invalid_format');
            }
            req.body.number = config_common.getRandomTruckNumber();
            req.body.type = config_common.getRandomTruckType();
            req.body.long = config_common.getRandomTruckLong();
            req.body.weight = config_common.getRandomTruckWeight();
            var userData;
            var truckData;
            async.waterfall([
                function (cb) {
                    //检查车牌号码是否被使用
                    Truck.findOne({
                        number: req.body.number,
                        "user_id.0": {"$exists": true}
                    }, function (err, truck) {
                        if (err) {
                            return cb(err);
                        }
                        if (truck) {
                            return cb('number_is_used');
                        }
                        cb();
                    });
                },
                function (cb) {
                    //检查本公司挂靠车辆不能多于最大值
                    truckService.getDriverTruck(req.decoded.company_id, function (err, trucks) {
                        if (trucks.length >= config_common.company_private_truck_number) {
                            return cb('private_truck_is_max');
                        } else {
                            cb();
                        }
                    });
                },
                function (cb) {
                    VerifyCode.findOne({phone: data.phone}, function (err, v_code) {
                        if (err) {
                            return cb(err);
                        }
                        //检查号码是否被交易角色使用
                        if (v_code && v_code.companyType == config_common.company_category.TRADE) {
                            return cb('phone_is_used');
                        }
                        if (!v_code) {
                            v_code = new VerifyCode({});
                            v_code.code = '111111';
                            v_code.phone = data.phone;
                            v_code.companyType = config_common.company_category.TRAFFIC;
                            v_code.save(cb);
                        } else {
                            cb(null, v_code, 1);
                        }
                    });
                },
                function (verifyCode, count, cb) {
                    User.findOne({
                        phone: data.phone
                    }, function (err, user) {
                        if (err) {
                            return cb(err);
                        }
                        if (user) {
                            if (user.role !== config_common.user_roles.TRAFFIC_DRIVER_PRIVATE) {
                                verifyCode.remove(function () {
                                });
                                return cb('phone_is_used');
                            }
                            user.company_id = _.union(user.company_id, req.decoded.company_id);
                            cb(null, user, 1);
                        } else {
                            user = new User({
                                phone: data.phone,
                                password: 'a11111',
                                role: config_common.user_roles.TRAFFIC_DRIVER_PRIVATE,
                                real_name: data.name,
                                company_id: req.decoded.company_id
                            });
                            global.lib_statistical.add({id: user._id.toString(), type: 'driver', count: 1});
                        }
                        user.save(cb);
                    });
                },
                function (user, count, cb) {
                    userData = user;
                    Truck.findOne({
                        number: req.body.number
                    }, function (err, truck) {
                        if (err) {
                            return cb(err);
                        }
                        if (!truck) {
                            truck = new Truck({
                                create_user_id: user._id.toString(),
                                create_company_id: '',
                                number: req.body.number,
                                type: req.body.type,
                                weight: req.body.weight,
                                user_id: [user._id.toString()]
                            });
                        } else {
                            truck.create_user_id = user._id.toString();
                            truck.create_company_id = '';
                            truck.number = req.body.number;
                            truck.type = req.body.type;
                            truck.weight = req.body.weight;
                            truck.user_id = [user._id.toString()];
                            truck.compile_status = false;
                        }
                        truck.long = req.body.long;
                        truck.save(cb);
                    });
                },
                function (truck, count, cb) {
                    truckData = truck;
                    DriverVerify.findOne({
                        user_id: userData._id.toString(),
                        company_id: req.decoded.company_id
                    }, function (err, apply) {
                        if (err) {
                            return cb(err);
                        }
                        if (!apply) {
                            apply = new DriverVerify({
                                company_id: req.decoded.company_id,
                                user_id: userData._id.toString()
                            });
                        }
                        apply.status = config_common.verification_phase.SUCCESS;
                        apply.save(cb);
                    });
                }
            ], function (error) {
                if (error) {
                    return callback(error);
                }
                callback();
            });
        }, function (err) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, {}, next);
        });
    });

    // api.get('/me', function (req, res, next) {
    //     User.findById(req.decoded.id, function (err, user) {
    //         if (err) {
    //             return next(err);
    //         }
    //         config_common.sendData(req, {user: user}, next);
    //     });
    // });

    api.post('/me', function (req, res, next) {
        var result = {};
        async.waterfall([
            function (cb) {
                global.lib_user.getOne({
                    find: {_id: req.decoded.id}
                }, cb)
            },
            function (userData, cb) {
                if (!userData) {
                    return cb('user_not_found');
                }
                result.user = userData
                //运
                if (_.size(result.user.transport)) {
                    global.lib_http.sendTradeServer({
                        method: 'getList',
                        cond: {find: {eng: {$in: result.user.transport}}},
                        model: 'Classify'
                    }, global.config_api_url.trade_server_get_hanzi, cb);
                } else {
                    cb(null, null)
                }
            },
            function (data, cb) {
                if (data) {
                    result.transport = data;
                }
                cb();
            }
        ], function (err) {
            if (err) {
                return next(err);
            }
            global.config_common.sendData(req, result, next);
        })
        // User.findById(req.decoded.id, function (err, user) {
        //     if (err) {
        //         return next(err);
        //     }
        //     config_common.sendData(req, {user: user}, next);
        // });
    });

    api.post('/me_new', function (req, res, next) {
        User.findById(req.body.user_id, function (err, user) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, user, next);
        });
    });

    //检查发送消息的人是否是某公司的认证司机
    api.post('/check_driver', function (req, res, next) {
        if (!config_common.checkDriver(req.decoded.role)) {
            return next('not_allow');
        }
        if (!req.body.company_id) {
            return next('invalid_format');
        }
        async.waterfall([
            function (cb) {
                User.findById(req.decoded.id, cb);
            },
            function (user, cb) {
                if (req.decoded.role == config_common.user_roles.TRAFFIC_DRIVER_PUBLISH &&
                    user.company_id.indexOf(req.body.company_id) < 0) {
                    cb(null, false);
                } else if (req.decoded.role == config_common.user_roles.TRAFFIC_DRIVER_PRIVATE) {
                    DriverVerify.count({
                        user_id: req.decoded.id,
                        company_id: req.body.company_id,
                        status: config_common.verification_phase.SUCCESS
                    }, cb);
                } else {
                    cb(null, true);
                }
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, result, next);
        });
    });

    /**
     * 功能：修改司机的个人信息
     * 参数：photo_url:个人头像
     *      real_name:司机姓名
     *      phone:电话
     *      gender:性别
     *      id_card_number:身份证号码
     *      jia_shi_zheng_url:驾驶证照片
     *      id_card_number_url:身份证照片正面
     *      id_card_number_back_url:身份证照片背面
     *      other_picture:司机设置上传其它证件使用
     *      */
    api.post('/modify_self', function (req, res, next) {
        if (!req.body.phone &&
            !req.body.real_name &&
            !req.body.gender &&
            !req.body.photo_url &&
            !config_common.checkIdCard(req.body.id_card_number) &&
            !req.body.jia_shi_zheng_url &&
            !req.body.id_card_number_url &&
            !req.body.id_card_number_back_url &&
            !req.body.role &&
            !req.body.mail &&
            !req.body.addr &&
            !req.body.sign &&
            !_.isString(req.body.post) &&
            !req.body.district &&
            !req.body.city &&
            !req.body.other_picture &&
            !req.body.company_addr &&
            !req.body.line &&
            !req.body.province) {
            return next('invalid_format');
        }
        if (req.body.province || req.body.city || req.body.district) {
            if (!config_common.checkProvince(req.body.province) ||
                !config_common.checkCity(req.body.province, req.body.city) ||
                !config_common.checkDistrict(req.body.city, req.body.district)) {
                return next('invalid_format');
            }
        }
        if ((req.body.phone && !config_common.checkPhone(req.body.phone) && req.body.verify_code) ||
            (req.body.real_name && !config_common.checkRealName(req.body.real_name)) ||
            (req.body.gender && !config_common.checkGender(req.body.gender)) ||
            (req.body.province && !config_common.checkProvince(req.body.province)) ||
            (req.body.city && !config_common.checkCity(req.body.province, req.body.city)) ||
            (req.body.role && !config_common.checkRoleType(req.body.role))) {
            return next('invalid_format');
        }
        var edit = false;
        async.waterfall([
            function (cb) {
                User.findById(req.decoded.id, cb);
            },
            function (user, cb) {
                if (!user) {
                    return cb('not_found');
                }
                global.lib_user.editAll(req.decoded.id, req.body, function (err, result) {
                    if (err) {
                        return cb(err);
                    }
                    cb(null, user);
                });
            },
            function (user, cb) {
                if (req.body.role &&
                    user.role == config_common.user_roles.TRAFFIC_ADMIN &&
                    user.role !== req.body.role &&
                    req.body.role.indexOf(config_common.company_category.TRAFFIC) >= 0) {
                    User.count({
                        company_id: req.decoded.company_id,
                        role: config_common.user_roles.TRAFFIC_ADMIN
                    }, function (err, count) {
                        if (err) {
                            return cb(err);
                        }
                        if (count <= 0) {
                            return cb('not_allow');
                        }
                        user.role = req.body.role;
                        cb(null, user);
                    });
                } else {
                    cb(null, user);
                }
            },
            function (user, cb) {
                if (typeof(req.body.line) == 'string') req.body.line = JSON.parse(req.body.line);
                if (req.body.line &&
                    req.decoded.role == config_common.user_roles.TRAFFIC_DRIVER_PRIVATE &&
                    req.body.line.length <= config_common.self_setting_private_driver_count) {
                    user.line = req.body.line;
                    edit = true;
                }
                if (typeof (req.body.company_addr) == 'string') req.body.company_addr = JSON.parse(req.body.company_addr);
                if (req.body.company_addr &&
                    req.body.company_addr.length <= config_common.self_setting_private_driver_count &&
                    req.decoded.role == config_common.user_roles.TRAFFIC_DRIVER_PRIVATE) {
                    user.company_addr = req.body.company_addr;
                    edit = true;
                }
                if (req.body.id_card_number &&
                    req.body.id_card_number !== user.id_card_number
                ) {
                    user.id_card_number = req.body.id_card_number;
                    edit = true;
                }
                if (req.body.id_card_number_url && req.body.id_card_number_url !== user.id_card_number_url) {
                    user.id_card_number_url = req.body.id_card_number_url;
                    edit = true;
                }
                if (req.body.id_card_number_back_url && req.body.id_card_number_back_url !== user.id_card_number_back_url) {
                    user.id_card_number_back_url = req.body.id_card_number_back_url;
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
                if (req.body.other_picture && req.body.other_picture !== user.other_picture) {
                    req.body.other_picture = _.isString(req.body.other_picture) ? JSON.parse(req.body.other_picture) : req.body.other_picture;
                    user.other_picture = req.body.other_picture;
                    edit = true;
                }
                cb(null, user);
            },
            function (user, cb) {
                if (req.body.jia_shi_zheng_url) {
                    if (user.role === config_common.user_roles.TRAFFIC_DRIVER_PRIVATE &&
                        user.verify_lock === config_common.verify_lock.UNLOCK) {
                        user.jia_shi_zheng_url = req.body.jia_shi_zheng_url;
                        edit = true;
                    }
                    cb(null, user);
                } else {
                    cb(null, user);
                }
            },
            function (user, cb) {
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

    api.post('/modify_other', function (req, res, next) {
        if (!req.body.id) {
            return next('invalid_id');
        }
        if (!config_common.checkAdmin(req.decoded.role)) {
            return next('not_authorized');
        }
        if (!req.body.phone &&
            !req.body.real_name &&
            !req.body.gender &&
            !req.body.role) {
            return next('invalid_format');
        }
        if ((req.body.phone && !config_common.checkPhone(req.body.phone)) ||
            (req.body.real_name && !config_common.checkRealName(req.body.real_name)) ||
            (req.body.gender && !config_common.checkGender(req.body.gender) ||
            (req.body.role && !config_common.checkRoleType(req.body.role)))) {
            return next('invalid_format');
        }
        var edit = false;
        async.waterfall([
            function (cb) {
                User.findById(req.body.id, cb);
            },
            function (user, cb) {
                if (!user) {
                    return cb('not_found');
                }
                if (
                    //config_common.checkAdmin(user.role) ||
                user.company_id !== req.decoded.company_id[0]) {
                    return cb('not_allow');
                }
                if (req.body.phone && req.body.phone !== user.phone) {
                    VerifyCode.findOne({phone: req.body.phone}, function (err, result) {
                        if (err) {
                            return cb(err);
                        }
                        if (!result) {
                            //return cb('not_found');
                            result = new VerifyCode({
                                code: config_common.getVerifyCode(),
                                phone: req.body.phone
                            });
                        }
                        if (result.companyType) {
                            return cb('phone_is_used');
                        }
                        //if(result.code !== req.body.verify_code){
                        //    return cb('invalid_verify_code');
                        //}
                        //if(Date.now() - result.time_creation.getTime() >= config_common.verify_codes_timeout){
                        //    return next('verify_code_timeout');
                        //}
                        result.companyType = config_common.getCompanyTypeByRole(req.decoded.role);
                        result.save(function (err, saveRes) {
                            if (err) {
                                return cb(err);
                            }
                            VerifyCode.remove({phone: user.phone}, function (err, removeRes) {
                                if (err) {
                                    return cb(err);
                                }
                                user.phone = req.body.phone;
                                edit = true;
                                cb(null, user);
                            });
                        });
                    });
                } else {
                    cb(null, user);
                }
            },
            function (user, cb) {
                if (req.body.real_name && req.body.real_name !== user.real_name) {
                    user.real_name = req.body.real_name;
                    edit = true;
                }
                if (req.body.gender && req.body.gender !== user.gender) {
                    user.gender = req.body.gender;
                    edit = true;
                }
                if (req.body.role && req.body.role !== user.role) {
                    user.role = req.body.role;
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
            config_common.sendData(req, result, next);
        });
    });

    api.post('/trans_to_private_driver', function (req, res, next) {
        User.findById(req.decoded.id, function (err, user) {
            if (err) {
                return next(err);
            }
            if (!user) {
                return next('not_found');
            }
            if (user.role !== config_common.user_roles.TRAFFIC_DRIVER_PUBLISH) {
                return next('not_allow');
            }
            user.role = config_common.user_roles.TRAFFIC_DRIVER_PRIVATE;
            user.save(function (err) {
                if (err) {
                    return next(err);
                }
                config_common.sendData(req, user, next);
            });
        });
    });

    api.post('/get_driver', function (req, res, next) {
        if (config_common.user_roles.TRAFFIC_ADMIN !== (req.decoded.role)) {
            return next('not_allow');
        }
        User.find({
            company_id: req.decoded.company_id[0],
            role: {$in: [config_common.user_roles.TRAFFIC_DRIVER_PRIVATE, config_common.user_roles.TRAFFIC_DRIVER_PUBLISH]}
        }, function (err, result) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, result, next);
        });
    });

    api.post('/get_private_driver', function (req, res, next) {
        if (config_common.user_roles.TRAFFIC_ADMIN !== (req.decoded.role)) {
            return next('not_allow');
        }
        User.find({
            company_id: req.decoded.company_id[0],
            role: config_common.user_roles.TRAFFIC_DRIVER_PRIVATE
        }, function (err, result) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, result, next);
        });
    });

    api.post('/get_colleague', function (req, res, next) {
        if (!config_common.checkTrafficCompanyByRole(req.decoded.role)) {
            return next('not_allow');
        }
        User.find({
            company_id: req.decoded.company_id[0],
            role: {$in: [config_common.user_roles.TRAFFIC_ADMIN, config_common.user_roles.TRAFFIC_DRIVER_PUBLISH]}
        }, function (err, result) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, result, next);
        });
    });

    api.post('/get_colleague_count', function (req, res, next) {
        if (!config_common.checkTrafficCompanyByRole(req.decoded.role)) {
            return next('not_allow');
        }
        User.count({
            company_id: req.decoded.company_id[0],
            role: config_common.user_roles.TRAFFIC_ADMIN
        }, function (err, result) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, result, next);
        });
    });

    //获取司机信息
    api.post('/get_one_driver', function (req, res, next) {
        if (req.decoded.role !== config_common.user_roles.TRADE_ADMIN &&
            req.decoded.role !== config_common.user_roles.TRAFFIC_ADMIN &&
            req.decoded.role !== config_common.user_roles.TRADE_SALE &&
            req.decoded.role !== config_common.user_roles.TRADE_PURCHASE &&
            !config_common.checkDriver(req.decoded.role) &&
            req.decoded.role !== config_common.user_roles.TRADE_STORAGE) {
            return next('not_allow');
        }
        if (!req.body.driver_id) {
            return next('invalid_format');
        }
        User.findById(req.body.driver_id, function (err, result) {
            if (err) {
                return next(err);
            }
            if (!result) {
                return next('not_found');
            }
            if (result.role == config_common.user_roles.TRAFFIC_DRIVER_PRIVATE) {
                Truck.findOne({
                    create_user_id: req.body.driver_id
                }, function (err, truck) {
                    if (err) {
                        return next(err);
                    }
                    var data = result.toObject();
                    data.truck = truck;
                    config_common.sendData(req, data, next);
                });
            } else {
                config_common.sendData(req, result, next);
            }
        });
    });

    //获取挂靠司机数量
    api.post('/get_private_driver_by_user_ids', function (req, res, next) {
        req.body.user_ids = _.isString(req.body.user_ids) ? JSON.parse(req.body.user_ids) : req.body.user_ids;
        User.find({
            _id: {$in: req.body.user_ids},
            role: config_common.user_roles.TRAFFIC_DRIVER_PRIVATE
        }, function (err, result) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, JSON.stringify(util.transObjArrToSigArr(result, '_id')), next);
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

    //获取未分配线路的司机（获取没有车的司机）
    api.post('/get_user_no_truck', function (req, res, next) {
        async.waterfall([
            function (cb) {
                if (req.decoded.role !== config_common.user_roles.TRAFFIC_ADMIN) {
                    return cb('not_allow');
                }
                User.find({
                    company_id: req.decoded.company_id,
                    role: config_common.user_roles.TRAFFIC_DRIVER
                }).exec(function (err, users) {
                    if (err) {
                        return cb(err);
                    }
                    cb(null, users);
                });
            },
            function (users, cb) {
                var userIds = util.transObjArrToSigArr(users, '_id');
                var userObj = util.transObjArrToObj(users, '_id');
                Truck.find({
                    user_id: {$in: userIds}
                }).select('user_id').exec(function (err, trucks) {
                    if (err) {
                        return cb(err);
                    }
                    var flag;
                    for (var i = 0; i < trucks.length; i++) {
                        for (var j = 0; j < trucks[i].user_id.length; j++) {
                            var userid = trucks[i].user_id[j];
                            if (userObj[userid]) {
                                delete userObj[userid];
                                if (_.size(userObj) == 0) {
                                    flag = true;
                                    break;
                                }
                            }
                        }
                        if (flag) break;
                    }
                    cb(null, _.values(userObj));
                });
            }
        ], function (err, users) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, users, next);
        });
    });

    //获取未分配线路的司机的数量（获取没有车的司机的数量）
    api.post('/get_count_no_truck', function (req, res, next) {
        async.waterfall([
            function (cb) {
                if (req.decoded.role !== config_common.user_roles.TRAFFIC_ADMIN) {
                    return cb('not_allow');
                }
                User.find({
                    company_id: req.decoded.company_id,
                    role: config_common.user_roles.TRAFFIC_DRIVER
                }).exec(function (err, users) {
                    if (err) {
                        return cb(err);
                    }
                    cb(null, users);
                });
            },
            function (users, cb) {
                var userIds = util.transObjArrToSigArr(users, '_id');
                var userObj = util.transObjArrToObj(users, '_id');
                Truck.find({
                    user_id: {$in: userIds}
                }).select('user_id').exec(function (err, trucks) {
                    if (err) {
                        return cb(err);
                    }
                    var flag;
                    for (var i = 0; i < trucks.length; i++) {
                        for (var j = 0; j < trucks[i].user_id.length; j++) {
                            var userid = trucks[i].user_id[j];
                            if (userObj[userid]) {
                                delete userObj[userid];
                                if (_.size(userObj) == 0) {
                                    flag = true;
                                    break;
                                }
                            }
                        }
                        if (flag) break;
                    }
                    cb(null, _.size(userObj));
                });
            }
        ], function (err, users) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, users, next);
        });
    });

    //给某个公司某些人发送短信
    api.post('/send_sms', function (req, res, next) {
        var data = req.body;
        var cond;
        if (data.user_id) {
            cond = {_id: {$in: data.user_id}};
        } else if (data.company_id && data.role && data.template_id) {
            cond = {
                company_id: data.company_id,
                role: {$in: data.role}
            };
        } else if (data.company_id && data.template_id) {
            cond = {company_id: data.company_id};
        }
        if (cond && process.env.node_env == 'pro') {
            User.find(cond).select('_id phone').exec(function (err, users) {
                if (users.length > 0) {
                    var phones = util.transObjArrToSigArr(users, 'phone');
                    http.sendMsgServerSMS(req, 'operation', {template_id: data.template_id, phone_list: phones});
                }
                config_common.sendData(req, {}, next);
            });
        } else {
            config_common.sendData(req, {}, next);
        }
    });

    //获取空闲或忙碌司机（可以使用，公有私有司机）
    api.post('/get_driver_free_busy', function (req, res, next) {
        if (req.decoded.role !== config_common.user_roles.TRAFFIC_ADMIN) {
            return next('not_allow');
        }
        req.body.page = parseInt(req.body.page) || 1;
        var condAll = {};
        var cond1 = {};
        cond1.company_id = req.decoded.company_id;
        cond1.role = config_common.user_roles.TRAFFIC_DRIVER_PUBLISH;
        if (req.body.name) {
            cond1.real_name = new RegExp(req.body.name);
        }
        async.waterfall([
            function (cb) {
                DriverVerify.find({
                    company_id: req.decoded.company_id,
                    status: config_common.verification_phase.SUCCESS
                }, function (err, verifies) {
                    if (err) {
                        return cb(err);
                    }
                    var cond2 = {};
                    if (req.body.name) {
                        cond2.real_name = new RegExp(req.body.name);
                    }
                    cond2._id = {$in: util.transObjArrToSigArr(verifies, 'user_id')};
                    condAll = {$or: [cond1, cond2]};
                    cb();
                });
            },
            function (cb) {
                User.find(condAll, cb);
            },
            function (users, cb) {
                var user_ids = util.transObjArrToSigArr(users, '_id');
                http.sendTrafficServerNoToken(req, {user_id: user_ids}, config_api_url.get_by_user_ids,
                    function (err, routes) {
                        if (err) {
                            return cb(err);
                        }
                        cb(null, users, user_ids, routes);
                    });
            },
            function (users, user_ids, routes, cb) {
                var busy_user_ids = util.transObjArrToSigArr(routes, 'user_id');
                if (req.body.busy) {
                    //cond._id = {$in: busy_user_ids};
                    cb(null, {_id: {$in: busy_user_ids}}, busy_user_ids.length);
                } else {
                    var arr = _.difference(user_ids, busy_user_ids);
                    //cond._id = {$in: arr};
                    cb(null, {_id: {$in: arr}}, arr.length);
                }
            },
            function (cond, count, cb) {
                User.find(cond)
                    .skip((req.body.page - 1) * config_common.user_per_page)
                    .limit(config_common.user_per_page)
                    .exec(function (err, users) {
                        if (err) {
                            return cb(err);
                        }
                        var exist = count > (req.body.page) * config_common.user_per_page;
                        cb(null, {exist: exist, users: users, count: count});
                    });
            },
            function (data, cb) {
                var user_ids = util.transObjArrToSigArr(data.users, '_id');
                var userObj = util.transObjArrToObj(data.users, '_id');
                for (var key in userObj) {
                    userObj[key].verify = true;//给客户端区分同意拒绝按钮显示
                }
                Truck.find({user_id: {$in: user_ids}}, function (err, trucks) {
                    if (err) {
                        return cb(err);
                    }
                    for (var i = 0; i < trucks.length; i++) {
                        var truck = trucks[i];
                        if (userObj[truck.user_id[0]]) {
                            userObj[truck.user_id[0]].truck = truck;
                        }
                    }
                    cb(null, {exist: data.exist, users: _.values(userObj), count: data.count});
                });
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, result, next);
        });
    });

    //获取空闲或忙碌司机（可以使用，公有私有司机）
    api.post('/get_driver_public', function (req, res, next) {
        if (req.decoded.role !== config_common.user_roles.TRAFFIC_ADMIN) {
            return next('not_allow');
        }
        async.waterfall([
            function (cb) {
                trafficUserService.getCompanyUser(req.decoded.company_id[0], cb);
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, result, next);
        });
    });

    /**
     *  功能：司机获取自己的个人信息
     *  参数：无
     */
    api.post('/driver_get_self_info', function (req, res, next) {
        if (req.decoded.role !== config_common.user_roles.TRAFFIC_DRIVER_PRIVATE) {
            return next('not_allow');
        }
        async.waterfall([
            function (cb) {
                global.lib_user.getOne({find: {_id: req.decoded.id}}, cb);
            },
            function (user, cb) {
                //兼容旧版只有一个车辆信息--->在6.0.1版本上线后可以删除！
                global.lib_truck.getOne({find: {create_user_id: req.decoded.id}}, function (err, truck) {
                    if (err) {
                        return cb(err);
                    }
                    cb(null, {truck: truck, user: user});
                });
            },
            function (data, cb) {
                global.lib_truck.getList({find: {create_user_id: req.decoded.id}}, function (err, truck) {
                    if (err) {
                        return cb(err);
                    }
                    data.truckArr = truck;
                    cb(null, data);
                });
            }
        ], function (err, data) {
            if (err) {
                return next(err);
            }
            data = JSON.parse(JSON.stringify(data));
            async.waterfall([
                function (cb) {
                    global.lib_http.sendTrafficServer({
                        method: 'getCount',
                        cond: {user_id: data.user._id.toString()},
                        model: 'TrafficLine'
                    }, global.config_api_url.trade_server_get_hanzi, cb);
                },
                function (count, cb) {
                    data.user.count = {line: count};
                    global.lib_http.sendTrafficServer({
                        method: 'getCount',
                        cond: {supply_user_id: data.user._id.toString()},
                        model: 'TrafficDriverOrder'
                    }, global.config_api_url.trade_server_get_hanzi, cb);
                }
            ], function (err, count) {
                if (err) {
                    return next(err);
                }
                data.user.count.goods = count;
                config_common.sendData(req, data, next);
            })
        });
        // api.post('/driver_get_self_info', function (req, res, next) {
        //     if (req.decoded.role !== config_common.user_roles.TRAFFIC_DRIVER_PRIVATE) {
        //         return next('not_allow');
        //     }
        //     async.waterfall([
        //         function (cb) {
        //             User.findById(req.decoded.id, cb);
        //         },
        //         function (user, cb) {
        //             Truck.findOne({create_user_id: req.decoded.id}, function (err, truck) {
        //                 if (err) {
        //                     return cb(err);
        //                 }
        //                 cb(null, {truck: truck, user: user});
        //             });
        //         }
        //     ], function (err, data) {
        //         if (err) {
        //             return next(err);
        //         }
        //         config_common.sendData(req, data, next);
        //     });
        // });
    });

    /**
     * 功能:挂靠司机编辑我的车辆信息
     * 参数：truck_id:车辆数据的_id
     *      type:类型
     *      weight：载重
     *      long:车长
     *      brand:品牌
     *      number:车牌号
     *      is_default:是否设为默认车辆
     *      xing_shi_zheng_url:行驶证照片
     *      yun_ying_zheng_url:运营证照片
     *      che_tou_zhao_url:车头照
     */
    api.post('/driver_edit_self_info', function (req, res, next) {
        if (req.decoded.role !== config_common.user_roles.TRAFFIC_DRIVER_PRIVATE) {
            return next('not_allow');
        }
        async.waterfall([
            function (cb) {
                global.lib_user.getOne({find: {_id: req.decoded.id}}, cb);
            },
            function (user, cb) {
                //（1）修改司机姓名
                var edit;
                if (req.body.name) {
                    user.real_name = req.body.name;
                    edit = true;
                }
                if (edit) {
                    user.save(cb);
                } else {
                    cb(null, user, 1);
                }
            },
            function (user, count, cb) {
                //查询车辆信息
                if (req.body.truck_id) {
                    Truck.findOne({_id: req.body.truck_id}, cb);
                } else {
                    //兼容旧版-->6.0.1版本后可以删除
                    Truck.findOne({create_user_id: req.decoded.id, number: req.body.number}, cb);
                }
            },
            function (truck, cb) {
                if (!truck && (config_common.checkTruckType(req.body.type) || req.body.number)) {
                    Truck.count({
                        number: req.body.number,
                        "user_id.0": {"$exists": true}
                    }, function (err, count) {
                        if (err) {
                            return cb(err);
                        }
                        if (count) {
                            return cb('number_is_used');
                        }
                        truck = new Truck({
                            create_user_id: req.decoded.id,
                            number: req.body.number,
                            type: req.body.type,
                            weight: req.body.weight,
                            user_id: [req.decoded.id],
                        });
                        cb(null, truck);
                    });
                } else {
                    cb(null, truck);
                }
            },
            function (truck, cb) {
                if (truck) {
                    var edit;
                    if (req.body.type && config_common.checkTruckType(req.body.type)) {
                        truck.type = req.body.type;
                        edit = true;
                    }
                    if (req.body.weight
                    // && config_common.checkTruckWeight(req.body.weight)
                    ) {
                        truck.weight = req.body.weight;
                        edit = true;
                    }
                    if (req.body.long) {
                        //if(req.body.long && config_common.checkTruckLong(req.body.long)){
                        if (req.body.long == 'null') {
                            truck.long = "";
                        } else {
                            truck.long = req.body.long;
                        }
                        edit = true;
                    }
                    if (req.body.brand) {
                        truck.brand = req.body.brand;
                        edit = true;
                    }
                    if (req.body.number) {
                        truck.number = req.body.number;
                        edit = true;
                    }
                    if (req.body.xing_shi_zheng_url && req.body.xing_shi_zheng_url !== truck.xing_shi_zheng_url) {
                        truck.xing_shi_zheng_url = req.body.xing_shi_zheng_url;
                        edit = true;
                    }
                    if (req.body.yun_ying_zheng_url && req.body.yun_ying_zheng_url !== truck.yun_ying_zheng_url) {
                        truck.yun_ying_zheng_url = req.body.yun_ying_zheng_url;
                        edit = true;
                    }
                    if (req.body.che_tou_zhao_url && req.body.che_tou_zhao_url !== truck.che_tou_zhao_url) {
                        truck.che_tou_zhao_url = req.body.che_tou_zhao_url;
                        edit = true;
                    }

                    if (req.body.is_default == 'true' || req.body.is_default == 'false') {
                        if (req.body.is_default == 'true') {
                            truck.is_default = true;
                        } else {
                            truck.is_default = false;
                        }
                        edit = true;
                    }

                    if (req.body.trailer_licence && req.body.trailer_licence !== truck.trailer_licence) {
                        truck.trailer_licence = req.body.trailer_licence;
                        edit = true;
                    }
                    //truck.compile_status = false;
                    if (edit) {
                        truck.save(cb);
                    } else {
                        cb(null, null, null);
                    }
                } else {
                    cb(null, truck, 1);
                }
            }
        ], function (err, truck, count) {
            if (err) {
                return next(err);
            }

            //如果存在truck并且truck的is_default,这是要去检查其他车辆信息是否存在默认
            if (truck && truck.is_default) {
                global.lib_truck.getOne({
                    find: {
                        create_user_id: req.decoded.id,
                        _id: {$ne: truck._id},
                        is_default: true
                    }
                }, function (err, truck) {
                    if (err) {
                        return next(err);
                    }
                    if (truck) {
                        truck.is_default = false;
                        truck.save();
                    }
                });
            }
            config_common.sendData(req, {}, next);
        });
    });

    api.post('/del_truck', function (req, res, next) {
        if (!req.body.truck_id) {
            return next('not_allow');
        }
        Truck.findOne({_id: req.body.truck_id}, function (err, data) {
            if (err) {
                return next(err);
            }
            data.remove();
            config_common.sendData(req, {}, next);
        });
    });

    // api.post('/driver_edit_self_info', function (req, res, next) {
    //     if (req.decoded.role !== config_common.user_roles.TRAFFIC_DRIVER_PRIVATE) {
    //         return next('not_allow');
    //     }
    //     async.waterfall([
    //         function (cb) {
    //             User.findById(req.decoded.id, cb);
    //         },
    //         function (user, cb) {
    //             var edit;
    //             if (req.body.name) {
    //                 user.real_name = req.body.name;
    //                 edit = true;
    //             }
    //             if (edit) {
    //                 user.save(cb);
    //             } else {
    //                 cb(null, user, 1);
    //             }
    //         },
    //         function (user, count, cb) {
    //             Truck.findOne({create_user_id: req.decoded.id}, cb);
    //         },
    //         function (truck, cb) {
    //             if (!truck &&
    //                 (config_common.checkTruckType(req.body.type) ||
    //                 // config_common.checkTruckWeight(req.body.weight) ||
    //                 req.body.number)) {
    //                 Truck.count({
    //                     number: req.body.number,
    //                     "user_id.0": {"$exists": true}
    //                 }, function (err, count) {
    //                     if (err) {
    //                         return cb(err);
    //                     }
    //                     if (count) {
    //                         return cb('number_is_used');
    //                     }
    //                     truck = new Truck({
    //                         create_user_id: req.decoded.id,
    //                         number: req.body.number,
    //                         type: req.body.type,
    //                         weight: req.body.weight,
    //                         user_id: [req.decoded.id],
    //                     });
    //                     cb(null, truck);
    //                 });
    //             } else {
    //                 cb(null, truck);
    //             }
    //         },
    //         function (truck, cb) {
    //             if (truck) {
    //                 var edit;
    //                 if (req.body.type && config_common.checkTruckType(req.body.type)) {
    //                     truck.type = req.body.type;
    //                     edit = true;
    //                 }
    //                 if (req.body.weight
    //                 // && config_common.checkTruckWeight(req.body.weight)
    //                 ) {
    //                     truck.weight = req.body.weight;
    //                     edit = true;
    //                 }
    //                 if (req.body.long) {
    //                     //if(req.body.long && config_common.checkTruckLong(req.body.long)){
    //                     truck.long = req.body.long;
    //                     edit = true;
    //                 }
    //                 if (req.body.brand) {
    //                     truck.brand = req.body.brand;
    //                     edit = true;
    //                 }
    //                 if (req.body.number) {
    //                     truck.number = req.body.number;
    //                     edit = true;
    //                 }
    //                 truck.compile_status = false;
    //                 if (edit) {
    //                     truck.save(cb);
    //                 } else {
    //                     cb();
    //                 }
    //             } else {
    //                 cb();
    //             }
    //         }
    //     ], function (err) {
    //         if (err) {
    //             return next(err);
    //         }
    //         config_common.sendData(req, {}, next);
    //     });
    // });

    /**
     * 功能：修改司机的个人信息
     * 参数：photo_url ： 个人头像
     *      name ：司机姓名
     *
     */
    // api.post('/driver_edit_user', function (req, res, next) {
    //     if (req.decoded.role !== config_common.user_roles.TRAFFIC_DRIVER_PRIVATE) {
    //         return next('not_allow');
    //     }
    //     async.waterfall([
    //         function (cb) {
    //             global.lib_user.getOneEasy({find: {_id: req.decoded.id}}, cb);
    //         },
    //         function (user, cb) {
    //             var edit;
    //             if (req.body.photo_url) {
    //                 user.photo_url = req.body.photo_url;
    //                 edit = true;
    //             }
    //             if (req.body.name) {
    //                 user.real_name = req.body.name;
    //                 edit = true;
    //             }
    //             if (req.body.gender) {
    //                 user.gender = req.body.gender;
    //                 edit = true;
    //             }
    //             if (_.isArray(req.body.transport) && req.body.transport.length) {
    //                 user.transport = req.body.transport;
    //                 edit = true;
    //             }
    //             if (req.body.id_card_number) {
    //                 user.id_card_number = req.body.id_card_number;
    //                 edit = true;
    //             }
    //             if (req.body.id_card_number_url) {
    //                 user.id_card_number_url = req.body.id_card_number_url;
    //                 edit = true;
    //             }
    //             if (req.body.id_card_number_back_url) {
    //                 user.id_card_number_back_url = req.body.id_card_number_back_url;
    //                 edit = true;
    //             }
    //             if (req.body.jia_shi_zheng_url) {
    //                 user.jia_shi_zheng_url = req.body.jia_shi_zheng_url;
    //                 edit = true;
    //             }
    //             if (req.body.other_picture && req.body.other_picture !== user.other_picture) {
    //                 req.body.other_picture = _.isString(req.body.other_picture) ? JSON.parse(req.body.other_picture) : req.body.other_picture;
    //                 user.other_picture = req.body.other_picture;
    //                 edit = true;
    //             }
    //         }
    //     ], function (err) {
    //         if (err) {
    //             return next(err);
    //         }
    //         config_common.sendData(req, {}, next);
    //     })
    //
    // });

    return api;
};
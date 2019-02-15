/**
 * Created by Administrator on 2016/2/24.
 */
var _ = require('underscore');
var async = require('async');
var express = require('express');
var http = require('../../libs/lib_http');
var util = require('../../libs/lib_util');
// var msgService = require('../../libs/lib_msg');
var truckService = require('../../libs/lib_truck');
var DriverVerify = require('../../models/Driver_verify');
var TrafficUser = require('../../models/User_traffic');
var TruckGroupRelation = require('../../models/Relation_group_user');
var Truck = require('../../models/Truck');
var TrafficCompany = require('../../models/Company_traffic');
var config_common = require('../../configs/config_common');
var config_server = require('../../configs/config_server');
var config_api_url = require('../../configs/config_api_url');
var config_msg_url = require('../../configs/config_msg_url');

var driverVerifyService = require('../../libs/lib_driver_verify');
var companyService = require('../../libs/lib_company');

module.exports = function () {
    var api = express.Router();

    api.use(require('../../middlewares/mid_verify_user')());

    //再次申请认证
    api.post('/re_apply', function (req, res, next) {
        if (req.decoded.role !== config_common.user_roles.TRAFFIC_DRIVER_PRIVATE) {
            return next('not_allow');
        }
        if (!req.body.company_id) {
            return next('invalid_format');
        }
        async.waterfall([
            function (cb) {
                DriverVerify.findOne({
                    company_id: req.body.company_id,
                    user_id: req.decoded.id
                }, function (err, apply) {
                    if (err) {
                        return cb(err);
                    }
                    if (!apply) {
                        return cb('not_found');
                    }
                    if (apply.time_apply.getTime() + config_common.driver_re_applay_timeout > Date.now()) {
                        return cb('invalid_time');
                    }
                    if (apply.status !== config_common.verification_phase.PROCESSING) {
                        return cb('not_allow');
                    }
                    apply.time_apply = new Date();
                    apply.save(cb);
                });
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            TrafficCompany.findById(req.body.company_id, function (err, companyData) {
                if (!err && companyData) {
                    http.sendMsgServerMSG(req.decoded.id, [req.decoded.id],
                        config_common.msg_templates.driver_apply_verify_self,
                        [companyData.full_name]);
                }
            });
            Truck.findOne({create_user_id: req.decoded.id}, function (err, truck) {
                if (!err && truck) {
                    msgService.sendTrafficUser({
                        template_id: config_common.msg_templates.driver_apply_verify_traffic,
                        content: [truck.number],
                        url: config_msg_url.traffic_admin_private_truck(),
                        company_id: [req.body.company_id],
                        role: [config_common.user_roles.TRAFFIC_ADMIN]
                    });
                }
            });
            config_common.sendData(req, result, next);
        });
    });

    api.post('/deal', function (req, res, next) {
        if (req.decoded.role !== config_common.user_roles.TRAFFIC_ADMIN) {
            return next('not_allow');
        }
        if (!req.body.user_id) {
            return next('invalid_format');
        }
        async.waterfall([
            function (cb) {
                if (req.body.agree) {
                    truckService.getDriverTruck(req.decoded.company_id, function (err, trucks) {
                        if (trucks.length >= config_common.company_private_truck_number) {
                            return cb('private_truck_is_max');
                        } else {
                            cb();
                        }
                    });
                } else {
                    cb();
                }
            },
            function (cb) {
                DriverVerify.findOne({
                    user_id: req.body.user_id,
                    company_id: req.decoded.company_id
                }, function (err, apply) {
                    if (err) {
                        return cb(err);
                    }
                    if (!apply) {
                        return cb('not_found');
                    }
                    if (apply.company_id !== req.decoded.company_id) {
                        return cb('not_allow');
                    }
                    cb(null, apply);
                });
            },
            function (apply, cb) {
                if (req.body.agree) {
                    apply.status = config_common.verification_phase.SUCCESS;
                    TrafficUser.findById(req.body.user_id, function (err, user) {
                        if (err) {
                            return cb(err);
                        }
                        if (!user) {
                            return cb('not_found');
                        }
                        if (user.role !== config_common.user_roles.TRAFFIC_DRIVER_PRIVATE) {
                            return next('not_allow');
                        }
                        user.company_id = _.union(user.company_id, [apply.company_id]);
                        user.save(function (err) {
                            if (err) {
                                return cb(err);
                            }
                            http.sendMsgServerMSG(req.decoded.id, [req.body.user_id],
                                config_common.msg_templates.driver_apply_verify_agree,
                                [req.decoded.company_name]);
                            apply.save(cb);
                        });
                    });
                } else {
                    http.sendMsgServerMSG(req.decoded.id, [req.body.user_id],
                        config_common.msg_templates.driver_apply_verify_disagree,
                        [req.decoded.company_name]);
                    apply.remove(cb);
                }
            }
        ], function (err) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, {}, next);
        });
    });

    //取消挂靠车辆认证
    api.post('/dec', function (req, res, next) {
        if (req.decoded.role !== config_common.user_roles.TRAFFIC_ADMIN) {
            return next('not_allow');
        }
        if (!req.body.user_id) {
            return next('invalid_format');
        }
        async.waterfall([
            function (cb) {
                //删除认证关系
                DriverVerify.remove({
                    user_id: req.body.user_id,
                    company_id: req.decoded.company_id
                }, cb);
            },
            function (count, cb) {
                //删除车辆组关系
                Truck.findOne({user_id: req.body.user_id}, function (err, truck) {
                    if (err) {
                        return cb(err);
                    }
                    if (truck) {
                        TruckGroupRelation.remove({
                            truck_id: truck._id.toString(),
                            company_id: req.decoded.company_id
                        }, cb);
                    } else {
                        cb(null, 0);
                    }
                });
            },
            function (count, cb) {
                TrafficUser.findById(req.body.user_id, cb);
            },
            function (user, cb) {
                if (!user) {
                    return cb('not_found');
                }
                if (user.role !== config_common.user_roles.TRAFFIC_DRIVER_PRIVATE ||
                    user.company_id.length == 1) {
                    return cb();
                }
                if (user.company_id.length > 1) {
                    user.company_id = _.without(user.company_id, req.decoded.company_id[0]);//物流管理员公司为数组结构
                }
                user.save(cb);
            }
            //function(cb){
            //    DriverVerify.remove({
            //        user_id: req.body.user_id,
            //        company_id: req.decoded.company_id
            //    }, function(err) {
            //        if(err) {
            //            return cb(err);
            //        }
            //        TrafficUser.findById(req.body.user_id, function(err, user){
            //            if(err){
            //                return cb(err);
            //            }
            //            if(!user){
            //                return cb('not_found');
            //            }
            //            if(user.role !== config_common.user_roles.TRAFFIC_DRIVER_PRIVATE ||
            //                user.company_id.length == 1){
            //                return cb(null, {});
            //            }
            //            if(user.company_id.length > 1){
            //                user.company_id = _.without(user.company_id, req.decoded.company_id);
            //            }
            //            user.save(function(err){
            //                if(err){
            //                    return cb(err);
            //                }
            //                cb(null, {});
            //            });
            //        });
            //    });
            //}
        ], function (err) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, {}, next);
        });
    });

    api.post('/on', function (req, res, next) {
        if (req.decoded.role !== config_common.user_roles.TRAFFIC_DRIVER_PRIVATE) {
            return next('not_allow');
        }
        TrafficUser.findById(req.decoded.id, function (err, user) {
            if (err) {
                return next(err);
            }
            if (!user) {
                return next('not_found');
            }
            user.verify_lock = config_common.verify_lock.LOCK;
            user.save(function (err) {
                if (err) {
                    return next(err);
                }
                config_common.sendData(req, user, next);
            });
        });
    });

    api.post('/off', function (req, res, next) {
        if (req.decoded.role !== config_common.user_roles.TRAFFIC_DRIVER_PRIVATE) {
            return next('not_allow');
        }
        async.waterfall([
            function (cb) {
                TrafficUser.findById(req.decoded.id, function (err, user) {
                    if (err) {
                        return cb(err);
                    }
                    if (!user) {
                        return cb('not_found');
                    }
                    user.verify_lock = config_common.verify_lock.UNLOCK;
                    // user.company_id = user.company_id.splice(1);
                    // http.sendMsgServerMSG(user._id, [user._id], config_common.msg_templates.invite_unlock_driver, [], config_msg_url.keyInfo());
                    user.save(cb);
                });
            }
            // function(user, count, cb){
            //     DriverVerify.remove({user_id: req.decoded.id}, cb);
            // },
            // function(count, cb){
            //     //删除车辆组关系
            //     Truck.findOne({user_id: req.decoded.id}, function(err, truck){
            //         if(err){
            //             return cb(err);
            //         }
            //         if(truck){
            //             TruckGroupRelation.remove({
            //                 truck_id: truck._id.toString()
            //             }, cb);
            //         }else{
            //             cb();
            //         }
            //     });
            // }
        ], function (err) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, {}, next);
        });
    });

    //检查发送消息的人是否是某公司的认证司机
    api.post('/get_one', function (req, res, next) {
        if (!config_common.checkDriver(req.decoded.role)) {
            return next('not_allow');
        }
        if (!req.body.company_id) {
            return next('invalid_format');
        }
        async.waterfall([
            function (cb) {
                DriverVerify.findOne({
                    user_id: req.decoded.id,
                    company_id: req.body.company_id
                }, cb);
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, result, next);
        });
    });

    api.post('/get', function (req, res, next) {
        var cond = {};
        if (req.decoded.role == config_common.user_roles.TRAFFIC_ADMIN) {
            cond.company_id = req.decoded.company_id;
        } else {
            cond.user_id = req.decoded.id;
        }
        DriverVerify.find(cond, function (err, applys) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, applys, next);
        });
    });

    api.post('/get_verify', function (req, res, next) {
        var cond = {status: config_common.verification_phase.SUCCESS};
        if (req.decoded.role == config_common.user_roles.TRAFFIC_ADMIN) {
            cond.company_id = req.decoded.company_id;
        } else {
            cond.user_id = req.decoded.id;
        }
        DriverVerify.find(cond, function (err, applys) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, applys, next);
        });
    });

    api.post('/get_truck_verify', function (req, res, next) {
        if (req.decoded.role !== config_common.user_roles.TRAFFIC_ADMIN) {
            return next('not_allow');
        }
        if (!req.body.user_id) {
            return next('invalid_format');
        }
        DriverVerify.findOne({
            user_id: req.body.user_id,
            company_id: req.decoded.company_id
        }, function (err, verify) {
            if (err) {
                return next(err);
            }
            if (!verify) {
                return next('not_found');
            }
            config_common.sendData(req, verify.status == config_common.verification_phase.SUCCESS, next);
        });
    });

    //司机获取司机需求单状态-2016/12/23-2.0.0
    api.post('/driver_get_demand_status', function (req, res, next) {
        if (req.decoded.role !== config_common.user_roles.TRAFFIC_DRIVER_PRIVATE) {
            return next('not_allow');
        }
        if (!req.body.company_id) {
            return next('invalid_format');
        }
        DriverVerify.findOne({
            user_id: req.decoded.id,
            company_id: req.body.company_id
        }, function (err, verify) {
            if (err) {
                return next(err);
            }
            var status = '';
            if (!verify) {
                status = '等待认证';
            } else {
                if (verify.status == config_common.verification_phase.SUCCESS) {
                    status = '等待抢单';
                } else {
                    status = '等待审核';
                }
            }
            config_common.sendData(req, status, next);
        });
    });

    //获取已认证公司
    api.post('/driver_get_company_verify', function (req, res, next) {
        if (req.decoded.role !== config_common.user_roles.TRAFFIC_DRIVER_PRIVATE) {
            return next('not_allow');
        }
        req.body.page = req.body.page || 1;
        var count = 0;
        var cond;
        async.waterfall([
            function (cb) {
                DriverVerify.find({
                    user_id: req.decoded.id
                    // status: config_common.verification_phase.SUCCESS
                }, cb);
            },
            function (verifies, cb) {
                var company_ids = util.transObjArrToSigArr(verifies, 'company_id');
                cond = {_id: {$in: company_ids}};
                if (req.body.name) {
                    cond['$or'] = [
                        {full_name: new RegExp(req.body.name)},
                        {nick_name: new RegExp(req.body.name)}
                    ];
                }
                TrafficCompany
                    .find(cond)
                    .skip((req.body.page - 1) * config_common.company_per_page)
                    .limit(config_common.company_per_page)
                    .select('_id full_name nick_name verify_phase url_logo type')
                    .exec(cb);
            },
            function (companies, cb) {
                TrafficCompany.count(cond, function (err, countdata) {
                    if (err) {
                        return cb(err);
                    }
                    count = countdata;
                    cb(null, companies);
                });
            },
            function (companies, cb) {
                global.lib_count.get({
                    body: {
                        company_ids: _.pluck(companies, '_id'),
                        types: [global.config_common.count_type.TRAFFIC_DEMAND, global.config_common.count_type.TRAFFIC_ORDER]
                    }
                }, function (err, countObj) {
                    if (err) {
                        return cb(err);
                    }
                    var arr = [];
                    for (var i = 0; i < companies.length; i++) {
                        var company = companies[i].toObject();
                        company.count = countObj[company._id.toString()];
                        arr.push(company);
                    }
                    cb(null, arr);
                });
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, {
                count: count,
                exist: count > req.body.page * config_common.company_per_page,
                company: result
            }, next);
        });
    });

    //获取已认证公司个数
    api.post('/driver_get_company_verify_count', function (req, res, next) {
        if (req.decoded.role !== config_common.user_roles.TRAFFIC_DRIVER_PRIVATE) {
            return next('not_allow');
        }
        async.waterfall([
            function (cb) {
                global.lib_driver_verify.getList({
                    find: {user_id: req.decoded.id}
                }, cb);
            },
            function (list, cb) {
                var arr = _.uniq(_.pluck(list, 'company_id'));
                cb(null, arr.length);
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, result, next);
        });
    });

    //获取已申请认证的公司(审核中)
    api.post('/driver_get_company_apply', function (req, res, next) {
        if (req.decoded.role !== config_common.user_roles.TRAFFIC_DRIVER_PRIVATE) {
            return next('not_allow');
        }
        req.body.page = req.body.page || 1;
        var count = 0;
        var cond;
        var applyDatas;
        async.waterfall([
            function (cb) {
                DriverVerify.find({
                    user_id: req.decoded.id,
                    status: config_common.verification_phase.PROCESSING
                }, cb);
            },
            function (applies, cb) {
                var company_ids = util.transObjArrToSigArr(applies, 'company_id');
                cond = {_id: {$in: company_ids}};
                if (req.body.name) {
                    cond['$or'] = [
                        {full_name: new RegExp(req.body.name)},
                        {nick_name: new RegExp(req.body.name)}
                    ];
                }
                applyDatas = applies;
                TrafficCompany
                    .find(cond)
                    .skip((req.body.page - 1) * config_common.company_per_page)
                    .limit(config_common.company_per_page)
                    .select('_id full_name nick_name verify_phase url_logo type')
                    .exec(cb);
            },
            function (companies, cb) {
                TrafficCompany.count(cond, function (err, countdata) {
                    if (err) {
                        return cb(err);
                    }
                    count = countdata;
                    var companyObj = util.transObjArrToObj(companies, '_id');
                    for (var i = 0; i < applyDatas.length; i++) {
                        if (companyObj[applyDatas[i].company_id]) {
                            companyObj[applyDatas[i].company_id].time_apply = applyDatas[i].time_apply;
                        }
                    }
                    cb(null, _.values(companyObj));
                });
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, {
                exist: count > req.body.page * config_common.company_per_page,
                company: result
            }, next);
        });
    });

    //获取已申请认证的公司个数(审核中)
    api.post('/driver_get_company_apply_count', function (req, res, next) {
        if (req.decoded.role !== config_common.user_roles.TRAFFIC_DRIVER_PRIVATE) {
            return next('not_allow');
        }
        async.waterfall([
            function (cb) {
                DriverVerify.count({
                    user_id: req.decoded.id,
                    status: config_common.verification_phase.PROCESSING
                }, cb);
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, result, next);
        });
    });

    //获取未申请认证的公司
    api.post('/driver_get_company_not_verify', function (req, res, next) {
        if (req.decoded.role !== config_common.user_roles.TRAFFIC_DRIVER_PRIVATE) {
            return next('not_allow');
        }
        req.body.page = req.body.page || 1;
        var count = 0;
        var company_ids;
        var cond;
        async.waterfall([
            function (cb) {
                DriverVerify.find({
                    user_id: req.decoded.id
                }, cb);
            },
            function (applies, cb) {
                company_ids = util.transObjArrToSigArr(applies, 'company_id');
                TrafficUser.findById(req.decoded.id, cb);
            },
            function (user, cb) {
                cond = {_id: {$nin: company_ids}};
                if (req.body.name) {
                    cond['$or'] = [
                        {full_name: new RegExp(req.body.name)},
                        {nick_name: new RegExp(req.body.name)}
                    ];
                }
                TrafficCompany
                    .find(cond)
                    .skip((req.body.page - 1) * config_common.company_per_page)
                    .limit(config_common.company_per_page)
                    .select('_id full_name nick_name verify_phase url_logo type')
                    .exec(cb);
            },
            function (companies, cb) {
                TrafficCompany.count(cond, function (err, countdata) {
                    if (err) {
                        return cb(err);
                    }
                    count = countdata;
                    cb(null, companies);
                });
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, {
                exist: count > req.body.page * config_common.company_per_page,
                company: result
            }, next);
        });
    });

    //获取未申请认证的公司个数
    api.post('/driver_get_company_not_verify_count', function (req, res, next) {
        if (req.decoded.role !== config_common.user_roles.TRAFFIC_DRIVER_PRIVATE) {
            return next('not_allow');
        }
        var company_ids;
        async.waterfall([
            function (cb) {
                DriverVerify.find({
                    user_id: req.decoded.id
                }, cb);
            },
            function (applies, cb) {
                company_ids = util.transObjArrToSigArr(applies, 'company_id');
                TrafficUser.findById(req.decoded.id, cb);
            },
            function (user, cb) {
                if (!user) {
                    return cb('not_found');
                }
                //company_ids = _.difference(user.company_id, company_ids);
                TrafficCompany
                    .count({_id: {$nin: company_ids}})
                    .exec(cb);
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, result, next);
        });
    });

    //物流管理员获取认证挂靠司机
    api.post('/admin_get_verify_driver', function (req, res, next) {
        // if(req.decoded.role !== config_common.user_roles.TRAFFIC_ADMIN){
        //     return next('not_allow');
        // }
        req.body.page = parseInt(req.body.page) || 1;
        var condUser;
        var usersData;
        var trucksData;
        async.waterfall([
            function (cb) {
                //获取认证状态的人id
                var cond = {company_id: req.decoded.company_id};
                if (req.body.verify) {
                    cond.status = config_common.verification_phase.SUCCESS;
                } else {
                    cond.status = config_common.verification_phase.PROCESSING;
                }
                DriverVerify.find(cond, function (err, verifies) {
                    if (err) {
                        return cb(err);
                    }
                    cb(null, util.transObjArrToSigArr(verifies, 'user_id'));
                });
            },
            function (user_ids, cb) {
                //查询符合条件的认证人
                condUser = {_id: {$in: user_ids}};
                if (req.body.name) {
                    condUser.real_name = new RegExp(req.body.name);
                }
                TrafficUser.find(condUser, cb);
            },
            function (users, cb) {
                usersData = users;
                //查询符合条件的车辆
                Truck.find({
                    create_user_id: {$in: condUser['_id']['$in']},
                    number: new RegExp(req.body.name)
                }, cb);
            },
            function (trucks, cb) {
                trucksData = trucks;
                //查询符合条件的车辆对应的人
                var user_ids = util.transObjArrToSigArr(trucks, 'create_user_id');
                TrafficUser.find({_id: {$in: user_ids}}, cb);
            },
            function (users, cb) {
                //查询符合条件的认证人对应的车
                var user_ids = util.transObjArrToSigArr(usersData, '_id');
                usersData = usersData.concat(users);
                Truck.find({create_user_id: {$in: user_ids}}, cb);
            },
            function (trucks, cb) {
                trucksData = trucksData.concat(trucks);
                var userObj = util.transObjArrToObj(usersData, '_id');
                var truckObj = util.transObjArrToObj(trucksData, '_id');
                if (req.body.verify) {
                    for (var key in userObj) {
                        userObj[key].verify = true;//给客户端区分同意拒绝按钮显示
                    }
                }
                for (var key in truckObj) {
                    var truck = truckObj[key];
                    if (userObj[truck.create_user_id]) {
                        userObj[truck.create_user_id].truck = truck;
                    }
                }
                cb(null, {
                    exist: _.size(userObj) > (req.body.page) * config_common.user_per_page,
                    //users: _.values(userObj),
                    users: (_.values(userObj)).slice((req.body.page - 1) * config_common.user_per_page, req.body.page * config_common.user_per_page),
                    count: _.size(userObj)
                });
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, result, next);
        });
    });

    //获取本公司已认证司机和邀请司机-reload-3.0.0-2017/5/3
    api.post('/admin_get_verify_driver_new', function (req, res, next) {
        if (req.decoded.role !== global.config_common.user_roles.TRAFFIC_ADMIN &&
            req.decoded.role !== global.config_common.user_roles.TRADE_ADMIN) {
            return next('not_allow');
        }
        req.body.page = req.body.page || 1;
        var result = {
            count: 0,
            list: [],
            exist: false
        };
        var user_ids = [];
        var verifyDatas = [];
        var apply_count = 0;
        var verify_count = 0;
        var verify_cond = {};
        var invite_cond = {};
        var page_count_current = req.body.page * global.config_common.entry_per_page;
        var page_count_last = (req.body.page - 1) * global.config_common.entry_per_page;
        async.waterfall([
            function (cb) {
                //已认证的
                verify_cond = {company_id: req.decoded.company_id};
                global.lib_driver_verify.getCount(verify_cond, cb);
            },
            function (count, cb) {
                verify_count = count;
                invite_cond = {
                    company_id: req.decoded.company_id,
                    role: global.config_common.TRAFFIC_ADMIN
                };
                global.lib_invitation_user.getCount(invite_cond, cb);
            },
            function (count, cb) {
                apply_count = count;
                result.count = apply_count + verify_count;
                result.exist = result.count > req.body.page * global.config_common.entry_per_page;
                //查认证公司表
                if (page_count_current <= verify_count ||
                    (page_count_current > verify_count && page_count_last < verify_count)) {
                    global.lib_driver_verify.getList({
                        find: verify_cond,
                        sort: {time_verify: -1},
                        skip: page_count_last,
                        limit: global.config_common.entry_per_page,
                        select: 'approve_id user_id'
                    }, cb);
                } else {
                    cb(null, []);
                }
            },
            function (verifies, cb) {
                verifyDatas = verifies;
                user_ids = global.lib_util.transObjArrToSigArr(verifyDatas, 'approve_id');
                user_ids = _.union(global.lib_util.transObjArrToSigArr(verifyDatas, 'user_id'), user_ids);
                global.lib_user.getList({
                    find: {_id: {$in: user_ids}},
                    select: 'photo_url real_name'
                }, cb)
            },
            function (users, cb) {
                global.lib_truck.getList({
                    find: {create_user_id: {$in: user_ids}},
                    select: 'weight type long create_user_id'
                }, function (err, trucks) {
                    if (err) {
                        return cb(err);
                    }
                    var userObj = global.lib_util.transObjArrToObj(users, '_id');
                    var truckObj = global.lib_util.transObjArrToObj(trucks, 'create_user_id');
                    for (var i = 0; i < verifyDatas.length; i++) {
                        var relation = verifyDatas[i];
                        result.list.push({
                            online: true,
                            truck: truckObj[relation.user_id],
                            user: userObj[relation.approve_id],
                            driver: userObj[relation.user_id]
                        });
                    }
                    cb();
                });
            },
            function (cb) {
                //未上线的
                var cond = {
                    company_id: req.decoded.company_id[0],
                    role: global.config_common.user_roles.TRAFFIC_DRIVER_PRIVATE
                };
                var select = 'phone real_name user_id';
                if (page_count_last >= verify_count) {
                    global.lib_invitation_user.getList({
                        find: cond,
                        select: select,
                        skip: page_count_last - verify_count,
                        sort: {time_creation: -1},
                        limit: global.config_common.entry_per_page
                    }, cb);
                } else if (page_count_current > verify_count && page_count_last < verify_count) {
                    global.lib_invitation_user.getList({
                        find: cond,
                        select: select,
                        skip: 0,
                        sort: {time_creation: -1},
                        limit: page_count_current - verify_count
                    }, cb);
                } else {
                    cb(null, []);
                }
            },
            function (phones, cb) {
                var user_ids = global.lib_util.transObjArrToSigArr(phones, 'user_id');
                global.lib_user.getList({
                    find: {_id: {$in: user_ids}},
                    select: 'photo_url real_name'
                }, function (err, users) {
                    if (err) {
                        return cb(err);
                    }
                    var userObj = global.lib_util.transObjArrToObj(users, '_id');
                    for (var i = 0; i < phones.length; i++) {
                        var phone = phones[i];
                        result.list.push({
                            online: false,
                            user: userObj[phone.user_id],
                            driver: {real_name: phone.real_name, phone: phone.phone}
                        });
                    }
                    cb();
                });
            }
        ], function (err) {
            if (err) {
                return next(err);
            }
            global.config_common.sendData(req, result, next);
        });
    });

    //物流管理员获取认证挂靠司机数
    api.post('/admin_get_verify_driver_count', function (req, res, next) {
        if (req.decoded.role !== config_common.user_roles.TRAFFIC_ADMIN) {
            return next('not_allow');
        }
        var cond = {
            company_id: req.decoded.company_id
        };
        var data = {};
        async.waterfall([
            function (cb) {
                cond.status = config_common.verification_phase.SUCCESS;
                DriverVerify.count(cond, cb);
            },
            function (count, cb) {
                data.verify = count;
                cond.status = config_common.verification_phase.PROCESSING;
                DriverVerify.count(cond, cb);
            },
            function (count, cb) {
                data.processing = count;
                cb(null, data);
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, result, next);
        });
    });

    return api;
};
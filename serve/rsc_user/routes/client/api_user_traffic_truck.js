/**
 * Created by Administrator on 2015/11/23.
 */

var async = require('async');
var _ = require('underscore');
var express = require('express');
var util = require('../../libs/lib_util');
var truckService = require('../../libs/lib_truck');
var http = require('../../libs/lib_http');
var Truck = require('../../models/Truck');
var UserTraffic = require('../../models/User_traffic');
var DriverVerify = require('../../models/Driver_verify');
var config_common = require('../../configs/config_common');
var config_api_url = require('../../configs/config_api_url');

module.exports = function () {
    var api = express.Router();

    api.use(require('../../middlewares/mid_verify_user')());

    //增加车辆
    api.post('/add', function (req, res, next) {
        if (!config_common.checkTrafficCompanyByRole(req.decoded.role)) {
            return next('not_allow');
        }
        if ((!config_common.checkTruckType(req.body.type)) ||
            !req.body.long ||
            !req.body.weight ||
            !req.body.number ||
            !req.body.xing_shi_zheng_url
        ) {
            return next('invalid_format');
        }
        async.waterfall([
            function (cb) {
                if (req.decoded.role == config_common.user_roles.TRAFFIC_DRIVER_PUBLISH) {
                    return cb('not_allow');
                }
                if (config_common.checkDriver(req.decoded.role)) {
                    Truck.count({create_user_id: req.decoded.id}, function (err, count) {
                        if (err) {
                            return cb(count);
                        }
                        if (count) {
                            return cb('not_allow');
                        }
                        cb();
                    });
                } else {
                    cb();
                }
            },
            function (cb) {
                Truck.findOne({
                    number: req.body.number,
                    "user_id.0": {"$exists": true}
                }, function (err, truck) {
                    if (err) {
                        return cb(err);
                    }
                    if (truck) {
                        return cb('not_allow');
                    }
                    var user_id = '';
                    var driver_id = [];
                    var company_id = '';
                    if (req.decoded.role == config_common.user_roles.TRAFFIC_DRIVER_PRIVATE) {
                        user_id = req.decoded.id;
                        driver_id = [req.decoded.id];
                    } else if (req.decoded.role == config_common.user_roles.TRAFFIC_ADMIN) {
                        company_id = req.decoded.company_id[0];
                    }
                    if (!truck) {
                        truck = new Truck({
                            create_user_id: user_id,
                            create_company_id: company_id,
                            number: req.body.number,
                            type: req.body.type,
                            weight: req.body.weight,
                            user_id: driver_id
                        });
                    } else {
                        truck.create_user_id = user_id;
                        truck.create_company_id = company_id;
                        truck.number = req.body.number;
                        truck.type = req.body.type;
                        truck.weight = req.body.weight;
                        truck.user_id = driver_id;
                    }
                    req.body.che_tou_zhao_url ? truck.che_tou_zhao_url = req.body.che_tou_zhao_url : 0;
                    req.body.xing_shi_zheng_url ? truck.xing_shi_zheng_url = req.body.xing_shi_zheng_url : 0;
                    req.body.long ? truck.long = req.body.long : 0;
                    req.body.brand ? truck.brand = req.body.brand : 0;
                    truck.save(cb);
                });
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, result, next);
        });
    });

    //删除车辆
    api.post('/dec', function (req, res, next) {
        if (!req.body.truck_id) {
            return next('invalid_format');
        }
        if (req.decoded.role !== config_common.user_roles.TRAFFIC_ADMIN &&
            req.decoded.role !== config_common.user_roles.TRAFFIC_DRIVER_PRIVATE) {
            return next('not_allow');
        }
        async.waterfall([
            function (cb) {
                UserTraffic.findById(req.decoded.id, function (err, user) {
                    if (err) {
                        return cb(err);
                    }
                    if (!user) {
                        return cb('not_found');
                    }
                    if (user.verify_lock == config_common.verify_lock.LOCK) {
                        return cb('truck_is_lock');
                    }
                    cb();
                });
            },
            function (cb) {
                Truck.findById(req.body.truck_id, function (err, truck) {
                    if (err) {
                        return cb(err);
                    }
                    if (!truck) {
                        return cb('not_found');
                    }
                    if (req.decoded.role == config_common.user_roles.TRAFFIC_ADMIN) {
                        if (truck.create_company_id !== req.decoded.company_id) {
                            return cb('not_allow');
                        }
                    } else {
                        if (truck.create_user_id !== req.decoded.id) {
                            return cb('not_allow');
                        }
                    }
                    truck.user_id = [];
                    //truck.xing_shi_zheng_url = '';  //行驶证照片
                    //truck.yun_ying_zheng_url = '';  //运营证照片
                    //truck.che_tou_zhao_url = '';    //车头照
                    //truck.verify_phase = 'NO';        //认证状态
                    truck.create_user_id = '';
                    truck.create_company_id = '';
                    truck.save(cb);
                });
            }
        ], function (err) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, {}, next);
        });
    });

    //编辑车辆
    api.post('/edit', function (req, res, next) {
        if (!req.body.truck_id ||
            (!req.body.type &&
            !req.body.long &&
            !req.body.weight &&
            !req.body.brand &&
            !req.body.number &&
            //!req.body.line_id &&
            !req.body.xing_shi_zheng_url &&
            !req.body.yun_ying_zheng_url &&
            !req.body.che_tou_zhao_url)) {
            return next('invalid_format');
        }
        req.body.line_id = _.isString(req.body.line_id) ? JSON.parse(req.body.line_id) : req.body.line_id;
        if (!config_common.checkTrafficCompanyByRole(req.decoded.role)) {
            return next('not_allow');
        }
        if ((req.body.type && !config_common.checkTruckType(req.body.type))
        // (req.body.long && !config_common.checkTruckLong(req.body.long)) ||
        // (req.body.weight && !config_common.checkTruckWeight(req.body.weight))
        ) {
            return next('invalid_format');
        }
        async.waterfall([
            function (cb) {
                Truck.findById(req.body.truck_id, function (err, truck) {
                    if (err) {
                        return cb(err);
                    }
                    if (!truck) {
                        return cb('not_found');
                    }
                    //if(truck.user_id.indexOf(req.decoded.id) < 0){
                    //    return cb('not_allow');
                    //}
                    //if((req.decoded.role == config_common.user_roles.TRAFFIC_DRIVER &&
                    //    truck.create_user_id &&
                    //    truck.create_user_id != req.decoded.id) ||
                    //    (req.decoded.role == config_common.user_roles.TRAFFIC_ADMIN &&
                    //    truck.create_company_id &&
                    //    truck.create_company_id != req.decoded.company_id[0])){
                    //    return cb('not_allow');
                    //}
                    //if(truck.verify_phase == config_common.verification_phase.PROCESSING ||
                    //    truck.verify_phase == config_common.verification_phase.SUCCESS){
                    //    return cb('not_allow');
                    //}
                    if ((req.decoded.role == config_common.user_roles.TRAFFIC_DRIVER_PUBLISH) ||
                        (req.decoded.role == config_common.user_roles.TRAFFIC_ADMIN && truck.create_company_id != req.decoded.company_id[0]) ||
                        (req.decoded.role == config_common.user_roles.TRAFFIC_DRIVER_PRIVATE && truck.create_user_id != req.decoded.id)) {
                        return cb('not_allow');
                    }
                    cb(null, truck);
                });
            },
            function (truck, cb) {
                if (req.body.number) {
                    if (req.body.number != truck.number) {
                        Truck.findOne({number: req.body.number}, function (err, count) {
                            if (err) {
                                return cb(err);
                            }
                            // if (count) {
                            //     return cb('truck_number_is_used');
                            // } else {
                            cb(null, truck);
                            //}
                        });
                    } else {
                        cb(null, truck);
                    }
                } else {
                    cb(null, truck);
                }
            },
            function (truck, cb) {
                if (req.body.line_id) {
                    Line.find({
                        _id: {$in: req.body.line_id},
                        company_id: {$in: req.decoded.company_id}
                    }, function (err, lines) {
                        if (err) {
                            return cb(err);
                        }
                        if (lines.length != req.body.line_id.length) {
                            return cb('invalid_format');
                        }
                        cb(null, truck);
                    });
                } else {
                    cb(null, truck);
                }
            },
            function (truck, cb) {
                req.body.type ? truck.type = req.body.type : 0;
                req.body.long ? truck.long = req.body.long : 0;
                req.body.weight ? truck.weight = req.body.weight : 0;
                req.body.brand ? truck.brand = req.body.brand : 0;
                req.body.number ? truck.number = req.body.number : 0;
                req.body.line_id ? truck.line_id = req.body.line_id : 0;
                //req.body.xing_shi_zheng_url ? truck.xing_shi_zheng_url = req.body.xing_shi_zheng_url : 0;
                req.body.yun_ying_zheng_url ? truck.yun_ying_zheng_url = req.body.yun_ying_zheng_url : 0;
                req.body.che_tou_zhao_url ? truck.che_tou_zhao_url = req.body.che_tou_zhao_url : 0;
                //truck.verify_phase = config_common.verification_phase.PROCESSING;
                cb(null, truck);
            },
            function (truck, cb) {
                if (req.body.xing_shi_zheng_url) {
                    if (req.decoded.role == config_common.user_roles.TRAFFIC_ADMIN) {
                        truck.xing_shi_zheng_url = req.body.xing_shi_zheng_url;
                        cb(null, truck);
                    } else {
                        UserTraffic.findById(req.decoded.id, function (err, user) {
                            if (err) {
                                return cb(err);
                            }
                            if (user.verify_lock == config_common.verify_lock.LOCK) {
                                return cb('not_allow');
                            }
                            truck.xing_shi_zheng_url = req.body.xing_shi_zheng_url;
                            cb(null, truck);
                        });
                    }
                } else {
                    cb(null, truck);
                }
            },
            function (truck, cb) {
                truck.save(cb);
            }
        ], function (err, truck) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, truck, next);
        });
    });

    //获取本人车辆
    api.post('/get', function (req, res, next) {
        // if(!config_common.checkTrafficCompanyByRole(req.decoded.role)){
        //     return next('not_allow');
        // }
        if (req.decoded.role == config_common.user_roles.TRAFFIC_ADMIN) {
            truckService.getCompanyTruck(req.decoded.company_id[0], function (err, lineArr) {
                if (err) {
                    return next(err);
                }
                config_common.sendData(req, lineArr, next);
            });
        } else {
            Truck.find({user_id: req.decoded.id}, function (err, lineArr) {
                if (err) {
                    return next(err);
                }
                config_common.sendData(req, lineArr, next);
            });
        }
    });

    //给若干车辆添加一个司机
    api.post('/add_user', function (req, res, next) {
        if (!req.body.truck_id ||
            !req.body.user_id ||
            (req.body.truck_id && req.body.truck_id.length == 0)) {
            return next('invalid_format');
        }
        if (req.decoded.role !== config_common.user_roles.TRAFFIC_ADMIN) {
            return next('not_allow');
        }
        var userData;
        req.body.truck_id = _.isString(req.body.truck_id) ? JSON.parse(req.body.truck_id) : req.body.truck_id;
        async.waterfall([
            function (cb) {
                UserTraffic.findById(req.body.user_id, function (err, user) {
                    if (err) {
                        return cb(err);
                    }
                    if (!user) {
                        return cb('not_found');
                    }
                    if (user.company_id.indexOf(req.decoded.company_id[0]) == -1 ||
                        user.role !== config_common.user_roles.TRAFFIC_DRIVER_PUBLISH) {
                        return cb('not_allow');
                    }
                    userData = user;
                    cb();
                });
            },
            function (cb) {
                Truck.findById(req.body.truck_id[0], function (err, truck) {
                    if (err) {
                        return cb(err);
                    }
                    if (!truck) {
                        return cb('not_found');
                    }
                    if (truck.create_company_id !== req.decoded.company_id) {
                        return cb('not_allow');
                    }
                    cb(null, truck);
                });
            },
            function (truck, cb) {
                //清理原司机所属车辆的人
                //Truck.update({user_id: req.body.user_id}, {user_id:[]},{multi:true}, function(err){
                //    if(err){
                //        return cb(err);
                //    }
                //    cb(null, truck);
                //});
                Truck.findOne({user_id: req.body.user_id}, function (err, oldTruck) {
                    if (err) {
                        return cb(err);
                    }
                    if (oldTruck) {
                        oldTruck.user_id = [];
                        oldTruck.save(function (err) {
                            if (err) {
                                return cb(err);
                            }
                            cb(null, truck, oldTruck);
                        });
                    } else {
                        cb(null, truck, oldTruck);
                    }
                });
            },
            function (truck, oldTruck, cb) {
                if (oldTruck) {
                    http.sendTrafficServerNoToken(req, {truck_id: oldTruck._id.toString()}, config_api_url.traffic_server_trans_truck_driver, function (err) {
                        if (err) {
                            return cb(err);
                        }
                        cb(null, truck);
                    });
                } else {
                    cb(null, truck);
                }
            },
            function (truck, cb) {
                //给新车绑定新人
                if (truck.user_id) {
                    http.sendMsgServerMSG(req.decoded.id, [truck.user_id[0]], config_common.msg_templates.old_public_dirver_trans, [req.decoded.user_name, truck.number, userData.real_name, truck.number, userData.real_name]);
                }
                truck.user_id = [req.body.user_id];
                http.sendMsgServerMSG(req.decoded.id, [truck.user_id[0]], config_common.msg_templates.new_public_dirver_trans, [req.decoded.user_name, truck.number, truck.number]);
                http.sendMsgServerMSG(req.decoded.id, [req.decoded.id], config_common.msg_templates.traffic_admin_dirver_trans, [truck.number, userData.real_name]);
                truck.save(cb);
            },
            function (truck, count, cb) {
                http.sendTrafficServerNoToken(req, {
                    truck_id: truck._id.toString(),
                    user_id: req.body.user_id
                }, config_api_url.traffic_server_trans_truck_driver, function (err) {
                    if (err) {
                        return cb(err);
                    }
                    cb(null, truck);
                });
            }
        ], function (err, truck) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, truck, next);
        });
    });

    //给一个司机删除若干车辆
    api.post('/dec_user', function (req, res, next) {
        if (!req.body.truck_id ||
            !req.body.user_id ||
            (req.body.truck_id && req.body.truck_id.length == 0)) {
            return next('invalid_format');
        }
        if (req.decoded.role !== config_common.user_roles.TRAFFIC_ADMIN) {
            return next('not_allow');
        }
        async.waterfall([
            function (cb) {
                UserTraffic.findById(req.body.user_id, function (err, user) {
                    if (err) {
                        return cb(err);
                    }
                    if (!user) {
                        return cb('not_found');
                    }
                    if (user.company_id.indexOf(req.decoded.company_id[0]) == -1 ||
                        user.role !== config_common.user_roles.TRAFFIC_DRIVER_PUBLISH) {
                        return cb('not_allow');
                    }
                    cb();
                });
            },
            function (cb) {
                Truck.findById(req.body.truck_id[0], function (err, truck) {
                    if (err) {
                        return cb(err);
                    }
                    if (!truck) {
                        return cb('not_found');
                    }
                    if (truck.create_company_id !== req.decoded.company_id) {
                        return cb('not_allow');
                    }
                    truck.user_id = [];
                    truck.save(cb);
                });
            }
        ], function (err, truck) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, truck, next);
        });
    });

    //检查车牌号是否被占用
    api.post('/check_number', function (req, res, next) {
        if (req.decoded.role !== config_common.user_roles.TRAFFIC_ADMIN &&
            req.decoded.role !== config_common.user_roles.TRAFFIC_DRIVER_PRIVATE) {
            return next('not_allow');
        }
        if (!req.body.number) {
            return next('invalid_format');
        }
        Truck.findOne({number: req.body.number}, function (err, truck) {
            if (err) {
                return next(err);
            }
            var exist = true;
            if (!truck) {
                exist = false;
            } else if (truck.create_company_id || truck.create_user_id) {
                exist = true;
            } else {
                exist = false;
            }
            config_common.sendData(req, exist, next);
        });
    });

    //检查车牌号是否被占用
    api.post('/new_check_number', function (req, res, next) {
        if (req.decoded.role !== config_common.user_roles.TRAFFIC_ADMIN &&
            req.decoded.role !== config_common.user_roles.TRAFFIC_DRIVER_PRIVATE) {
            return next('not_allow');
        }
        if (!req.body.number) {
            return next('invalid_format');
        }
        Truck.findOne({number: req.body.number}, function (err, truck) {
            if (err) {
                return next(err);
            }
            var exist = true;
            if (!truck) {
                exist = false;
            } else if (truck.create_company_id || truck.create_user_id) {
                exist = true;
            } else {
                exist = false;
            }
            if (truck) {
                UserTraffic.findOne({_id: truck.user_id[0]}, function (err, user) {
                    if (err) {
                        return next(err);
                    }
                    config_common.sendData(req, {
                        exist: exist,
                        truck: truck,
                        user: user
                    }, next);
                });
            } else {
                config_common.sendData(req, {
                    exist: exist,
                    truck: null,
                    user: null
                }, next);
            }

        });
    });

    //获取车辆信息
    api.post('/get_one', function (req, res, next) {
        if (!req.body.truck_id) {
            return next('invalid_format');
        }
        Truck.findById(req.body.truck_id, function (err, truck) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, truck, next);
        });
    });

    //按司机id取车辆
    api.post('/get_truck_by_user_id', function (req, res, next) {
        async.waterfall([
            function (cb) {
                //    if(!config_common.checkTrafficCompanyByRole(req.decoded.role)){
                //        return cb('not_allow');
                //    }
                if (!req.body.user_id) {
                    return cb('invalid_format');
                }
                //    UserTraffic.findById(req.body.user_id, function(err, users){
                //        if(err){
                //            return cb(err);
                //        }
                //        if(!users){
                //            return cb('not_found');
                //        }
                //        if(req.decoded.role == config_common.user_roles.TRAFFIC_ADMIN &&
                //            users.company_id !== req.decoded.company_id[0]){
                //            return cb('not_allow');
                //        }
                cb();
                //    });
            },
            function (cb) {
                Truck.find({user_id: req.body.user_id}).exec(function (err, trucks) {
                    if (err) {
                        return cb(err);
                    }
                    cb(null, trucks);
                });
            }
        ], function (err, trucks) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, trucks, next);
        });
    });

    //按司机id取默认司机不是这个司机的车辆
    api.post('/get_default_not_by_user_id', function (req, res, next) {
        async.waterfall([
            function (cb) {
                if (req.decoded.role !== config_common.user_roles.TRAFFIC_ADMIN) {
                    return cb('not_allow');
                }
                if (!req.body.user_id) {
                    return cb('invalid_format');
                }
                var cond = {
                    create_company_id: req.decoded.company_id,
                    user_id: {$nin: [req.body.user_id]}
                };
                if (req.body.number) {
                    cond.number = new RegExp(req.body.number);
                }
                Truck.find(cond, function (err, trucks) {
                    if (err) {
                        return cb(err);
                    }
                    cb(null, trucks);
                });
            }
        ], function (err, trucks) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, trucks, next);
        });
        //async.waterfall([
        //    function(cb){
        //        if(req.decoded.role !== config_common.user_roles.TRAFFIC_ADMIN){
        //            return cb('not_allow');
        //        }
        //        if(!req.body.user_id){
        //            return cb('invalid_format');
        //        }
        //        UserTraffic.find({
        //            //_id:{$nin:[req.body.user_id]},
        //            company_id: req.decoded.company_id
        //        }, function(err, users){
        //            if(err){
        //                return cb(err);
        //            }
        //            cb(null, users);
        //        });
        //    },
        //    function(users, cb){
        //        var user_ids = util.transObjArrToSigArr(users, '_id');
        //        if(req.body.number){
        //            Truck.find({
        //                number: new RegExp(req.body.number),
        //                user_id: {$in:user_ids}
        //            }).exec(function(err, trucks){
        //                if(err){
        //                    return cb(err);
        //                }
        //                cb(null, trucks);
        //            });
        //        }else{
        //            Truck.find({
        //                user_id: {$in:user_ids}
        //            }).exec(function(err, trucks){
        //                if(err){
        //                    return cb(err);
        //                }
        //                cb(null, trucks);
        //            });
        //        }
        //    },
        //    function(trucks, cb){
        //        for(var i = 0; i < trucks.length; i++){
        //            var truck = trucks[i];
        //            if(truck.user_id[truck.user_id.length-1] == req.body.user_id){
        //                trucks.splice(i, 1);
        //                i--;
        //            }
        //        }
        //        cb(null, trucks);
        //    }
        //],function(err, trucks){
        //    if(err){
        //        return next(err);
        //    }
        //    config_common.sendData(req, trucks, next);
        //});
    });

    //按司机id取不属于这个司机的车辆(同get_default_not_by_user_id)
    api.post('/get_not_in_user', function (req, res, next) {
        async.waterfall([
            function (cb) {
                if (req.decoded.role !== config_common.user_roles.TRAFFIC_ADMIN) {
                    return cb('not_allow');
                }
                if (!req.body.user_id) {
                    return cb('invalid_format');
                }
                UserTraffic.find({
                    _id: {$nin: [req.body.user_id]},
                    company_id: req.decoded.company_id
                }, function (err, users) {
                    if (err) {
                        return cb(err);
                    }
                    cb(null, users);
                });
            },
            function (users, cb) {
                var user_ids = util.transObjArrToSigArr(users, '_id');
                if (req.body.number) {
                    Truck.find({
                        number: new RegExp(req.body.number),
                        user_id: {$in: user_ids, $nin: [req.body.user_id]}
                    }).exec(function (err, trucks) {
                        if (err) {
                            return cb(err);
                        }
                        cb(null, trucks);
                    });
                } else {
                    Truck.find({
                        user_id: {$in: user_ids, $nin: [req.body.user_id]}
                    }).exec(function (err, trucks) {
                        if (err) {
                            return cb(err);
                        }
                        cb(null, trucks);
                    });
                }
            }
        ], function (err, trucks) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, trucks, next);
        });
    });

    //按页获取车辆
    api.post('/get_truck_by_page', function (req, res, next) {
        if (!req.body.page) {
            req.body.page = 1;
        }
        async.waterfall([
            function (cb) {
                if (req.decoded.role !== config_common.user_roles.TRAFFIC_ADMIN) {
                    return cb('not_allow');
                }
                UserTraffic.find({company_id: req.decoded.company_id[0]}, function (err, users) {
                    if (err) {
                        return cb(err);
                    }
                    cb(null, users);
                });
            },
            function (users, cb) {
                //更新司机使用状态和对应订单id
                var userIdArr = [];
                for (var i = 0; i < users.length; i++) {
                    userIdArr.push(users[i]._id.toString());
                }
                cb(null, userIdArr);
            },
            function (userIdArr, cb) {
                Truck.find({user_id: {$in: userIdArr}})
                    .skip((req.body.page - 1) * config_common.truck_per_page)
                    .limit(config_common.truck_per_page)
                    .exec(function (err, trucks) {
                        if (err) {
                            return cb(err);
                        }
                        cb(null, trucks);
                    });
            }
        ], function (err, trucks) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, trucks, next);
        });
    });

    //获取没有线路的车辆
    api.post('/get_truck_no_line', function (req, res, next) {
        async.waterfall([
            function (cb) {
                if (req.decoded.role !== config_common.user_roles.TRAFFIC_ADMIN &&
                    req.decoded.role !== config_common.user_roles.TRAFFIC_DRIVER) {
                    return cb('not_allow');
                }
                cb();
            },
            function (cb) {
                if (req.decoded.role == config_common.user_roles.TRAFFIC_ADMIN) {
                    UserTraffic.find({company_id: req.decoded.company_id[0]}).select('_id').exec(function (err, users) {
                        if (err) {
                            return cb(err);
                        }
                        users = util.transObjArrToSigArr(users, '_id');
                        cb(null, users);
                    });
                } else {
                    cb(null, [req.decoded.id]);
                }
            },
            function (users, cb) {
                Truck.find({user_id: {$in: users}}, function (err, trucks) {
                    if (err) {
                        return cb(err);
                    }
                    var arr = [];
                    for (var i = 0; i < trucks.length; i++) {
                        if (trucks[i].line_id.length == 0) {
                            arr.push(trucks[i]);
                        }
                    }
                    cb(null, arr);
                });
            }
        ], function (err, trucks) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, trucks, next);
        });
    });

    //获取不在某条线路的车辆
    api.post('/get_not_in_line', function (req, res, next) {
        async.waterfall([
            function (cb) {
                if (req.decoded.role !== config_common.user_roles.TRAFFIC_ADMIN) {
                    return cb('not_allow');
                }
                if (!req.body.line_id) {
                    return next('invalid_format');
                }
                cb();
            },
            function (cb) {
                UserTraffic.find({
                    company_id: req.decoded.company_id[0]
                }).select('_id').exec(function (err, users) {
                    if (err) {
                        return cb(err);
                    }
                    users = util.transObjArrToSigArr(users, '_id');
                    cb(null, users);
                });
            },
            function (users, cb) {
                Truck.find({
                    user_id: {$in: users},
                    line_id: {$nin: [req.body.line_id]}
                }, function (err, trucks) {
                    if (err) {
                        return cb(err);
                    }
                    cb(null, trucks);
                });
            }
        ], function (err, trucks) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, trucks, next);
        });
    });

    //获取某种类型的车辆的数量
    api.post('/get_type_number', function (req, res, next) {
        async.waterfall([
            function (cb) {
                if (req.decoded.role !== config_common.user_roles.TRAFFIC_ADMIN) {
                    return cb('not_allow');
                }
                truckService.getCompanyTruck(req.decoded.company_id, cb);
            },
            function (trucks, cb) {
                var data = {
                    all: trucks.length
                };
                for (var i = 0; i < trucks.length; i++) {
                    var truck = trucks[i];
                    if (!data[truck.type]) {
                        data[truck.type] = 0;
                    }
                    data[truck.type]++;
                }
                cb(null, data);
            }
        ], function (err, trucks) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, trucks, next);
        });
    });

    //获取公司可用车辆(认证通过且空闲)
    api.post('/get_use_truck', function (req, res, next) {
        if (req.decoded.role !== config_common.user_roles.TRAFFIC_ADMIN) {
            return next('not_allow');
        }
        truckService.getCompanyTruckUseAll(req, req.decoded.company_id[0], function (err, trucks) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, trucks, next);
        });
    });

    //获取公司可用车辆个数(认证通过且空闲)
    api.post('/get_use_truck_count', function (req, res, next) {
        if (req.decoded.role !== config_common.user_roles.TRAFFIC_ADMIN) {
            return next('not_allow');
        }
        truckService.getCompanyTruckUseAll(req, req.decoded.company_id[0], function (err, trucks) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, trucks.length, next);
        });
    });

    //获取公司繁忙车辆
    api.post('/get_used_truck', function (req, res, next) {
        if (req.decoded.role !== config_common.user_roles.TRAFFIC_ADMIN) {
            return next('not_allow');
        }
        truckService.getCompanyTruckUsedAll(req, req.decoded.company_id[0], function (err, trucks) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, trucks, next);
        });
    });

    //获取公司繁忙车辆个数
    api.post('/get_used_truck_count', function (req, res, next) {
        if (req.decoded.role !== config_common.user_roles.TRAFFIC_ADMIN) {
            return next('not_allow');
        }
        truckService.getCompanyTruckUsedAll(req, req.decoded.company_id[0], function (err, trucks) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, trucks.length, next);
        });
    });

    //获取公司未认证车辆
    api.post('/get_not_verify_truck', function (req, res, next) {
        if (req.decoded.role !== config_common.user_roles.TRAFFIC_ADMIN) {
            return next('not_allow');
        }
        async.waterfall([
            function (cb) {
                DriverVerify.find({
                    company_id: req.decoded.company_id,
                    status: config_common.verification_phase.PROCESSING
                }, cb);
            },
            function (verifies, cb) {
                var user_ids = util.transObjArrToSigArr(verifies, 'user_id');
                Truck.find({create_user_id: {$in: user_ids}}, cb);
            }
        ], function (err, trucks) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, trucks, next);
        });
    });

    //获取公司未认证车辆个数
    api.post('/get_not_verify_truck_count', function (req, res, next) {
        if (req.decoded.role !== config_common.user_roles.TRAFFIC_ADMIN) {
            return next('not_allow');
        }
        async.waterfall([
            function (cb) {
                DriverVerify.find({
                    company_id: req.decoded.company_id,
                    status: config_common.verification_phase.PROCESSING
                }, cb);
            },
            function (verifies, cb) {
                var user_ids = util.transObjArrToSigArr(verifies, 'user_id');
                Truck.find({create_user_id: {$in: user_ids}}, cb);
            }
        ], function (err, trucks) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, trucks.length, next);
        });
    });

    return api;
};
/**
 * Created by Administrator on 2015/11/23.
 */
var _ = require('underscore');
var async = require('async');
var express = require('express');
var jwt = require('jsonwebtoken');

var http = require('../../libs/lib_http');
var util = require('../../libs/lib_util');
var fileService = require('../../libs/lib_file');
var trafficUserService = require('../../libs/lib_traffic_user');
var truckService = require('../../libs/lib_truck');
var companyDynamicService = require('../../libs/lib_company_dynamic');

var sdk_map_gaode = require('../../sdks/map_gaode/sdk_map_gaode');

var Truck = require('../../models/Truck');
var Company = require('../../models/Company_traffic');
var UserTraffic = require('../../models/User_traffic');
var DriverVerify = require('../../models/Driver_verify');
var Company_relation = require('../../models/Company_relation');

var configCity = require('../../configs/config_city');
var configDistrict = require('../../configs/config_district');
var configProvince = require('../../configs/config_province');
var config_common = require('../../configs/config_common');
var config_server = require('../../configs/config_server');
var config_api_url = require('../../configs/config_api_url');

//检查物流司机和车辆（checkOwn用于判断车和司机是否属于调用次函数人所在公司）
function checkVInfo(req, next) {
    if (!_.isArray(req.body.v_info)) {
        return next('invalid_format');
    }
    var userObj = {};
    var truckObj = {};
    //循环查找每个{truck_id:Xxx,user_id:Xxx}
    async.each(req.body.v_info, function (data, cb) {
        if (!data.user_id || !_.isArray(data.user_id) || !data.truck_id) {
            return cb('invalid_format');
        }
        async.waterfall([
            function (callback) {
                if (userObj[data.user_id[0]]) {
                    return callback('user_used_repeat');
                }
                //检查司机
                UserTraffic.findById(data.user_id[0], function (err, findRes) {
                    if (err) {
                        return callback(err);
                    }
                    if (!findRes) {
                        return callback('user_not_found');
                    }
                    if (findRes.company_id.indexOf(req.decoded.company_id) < 0) {
                        return callback('user_not_allow');
                    }
                    if (!config_common.checkDriver(findRes.role)) {
                        return callback('user_is_not_driver');
                    }
                    userObj[findRes._id] = true;
                    callback(null, findRes);
                });
            },
            function (user, callback) {
                if (user.role == config_common.user_roles.TRAFFIC_DRIVER_PRIVATE) {
                    DriverVerify.count({
                        company_id: req.decoded.company_id,
                        status: config_common.verification_phase.SUCCESS,
                        user_id: user._id.toString()
                    }, function (err, count) {
                        if (err) {
                            return callback(err);
                        }
                        if (count < 1) {
                            return callback('truck_not_verify');
                        }
                        callback(null, user);
                    });
                } else {
                    callback(null, user);
                }
            },
            function (user, callback) {
                if (truckObj[data.truck_id]) {
                    return callback('truck_used_repeat');
                }
                //检查卡车
                Truck.findById(data.truck_id, function (err, findRes) {
                    if (err) {
                        return callback(err);
                    }
                    if (!findRes) {
                        return callback('truck_not_found');
                    }
                    if (findRes.create_company_id !== req.decoded.company_id &&
                        findRes.create_user_id !== user._id.toString()) {
                        return callback('truck_not_allow');
                    }
                    truckObj[findRes._id] = true;
                    callback();
                });
            }
        ], function (err) {
            if (err) {
                return cb(err);
            }
            cb();
        });
    }, function (err) {
        if (err) {
            return next(err);
        }
        next();
    });
}

module.exports = function () {
    var api = express.Router();

    //获取某个物流公司信息
    api.post('/get_one', function (req, res, next) {
        Company.findOne({_id: req.body.company_id}, function (err, company) {
            if (err) {
                return next(err);
            }
            if (!company) {
                return next('not_found');
            }
            config_common.sendData(req, company, next);
        });
    });

    api.use(require('../../middlewares/mid_verify_user')());

    //编辑公司信息
    api.post('/edit', function (req, res, next) {
        if (!req.body.des &&
            !req.body.url_logo &&
            !req.body.district &&
            !req.body.addr &&
            !req.body.city &&
            !req.body.province &&
            !req.body.url_honor &&
            !req.body.url_culture &&
            !req.body.manage &&
            !req.body.transport &&
            !req.body.nick_name &&
            !req.body.url_yingyezhizhao) {
            return next('invalid_format');
        }
        if (req.body.province || req.body.city || req.body.district) {
            if (!config_common.checkProvince(req.body.province) ||
                !config_common.checkCity(req.body.province, req.body.city) ||
                !config_common.checkDistrict(req.body.city, req.body.district)) {
                return next('invalid_format');
            }
        }
        if (req.decoded.role !== config_common.user_roles.TRAFFIC_ADMIN) {
            return next('not_allow');
        }
        async.waterfall([
            function (cb) {
                Company.findOne({_id: req.decoded.company_id}, function (err, company) {
                    if (err) {
                        return next(err);
                    }
                    if (!company) {
                        return next('not_found');
                    }
                    if (company.verify_phase !== config_common.verification_phase.PROCESSING &&
                        company.verify_phase !== config_common.verification_phase.SUCCESS &&
                        req.body.url_yingyezhizhao) {
                        company.url_yingyezhizhao = req.body.url_yingyezhizhao;
                    }
                    req.body.des ? company.des = req.body.des : 0;
                    req.body.url_logo ? company.url_logo = req.body.url_logo : 0;
                    var change;
                    if (req.body.province) {
                        company.province = configProvince[req.body.province].name;
                        change = true;
                    }
                    if (req.body.city) {
                        company.city = configCity[req.body.province][req.body.city].name;
                        change = true;
                    }
                    if (req.body.district) {
                        company.district = configDistrict[req.body.city][req.body.district].name;
                        change = true;
                    }
                    if (req.body.transport) {
                        company.transport = req.body.transport;
                    }
                    if(req.body.addr){
                        company.addr = req.body.addr;
                        change = true;
                    }
                    req.body.manage ? company.manage = req.body.manage : 0;
                    if (req.body.url_honor && req.body.url_honor.length <= config_common.company_honor_picture_count) {
                        for (var i = 0; i < company.url_honor.length; i++) {
                            if (company.url_honor[i] &&
                                company.url_honor[i] !== req.body.url_honor[i]) {
                                fileService.deleteImgFromAliyun(company.url_honor[i]);
                            }
                        }
                        company.url_honor = req.body.url_honor;
                    }
                    if (req.body.url_culture && req.body.url_culture.length <= config_common.company_culture_picture_count) {
                        for (var i = 0; i < company.url_culture.length; i++) {
                            if (company.url_culture[i] &&
                                company.url_culture[i] !== req.body.url_culture[i]) {
                                fileService.deleteImgFromAliyun(company.url_culture[i]);
                            }
                        }
                        company.url_culture = req.body.url_culture;
                    }
                    if (req.body.nick_name) {
                        company.nick_name = req.body.nick_name;
                    }
                    //if(req.body.province && req.body.city){
                    //    if(configCity[req.body.province] && configCity[req.body.province][req.body.city]){
                    //        company.province = configProvince[req.body.province].name;
                    //        company.city = configCity[req.body.province][req.body.city].name;
                    //    }
                    //}
                    if(change){
                        sdk_map_gaode.getCoordinate(company.province + company.city + company.district + company.addr, function (err, coordinate) {
                            if(coordinate && coordinate.geocodes && coordinate.geocodes[0]){
                                company.location = coordinate.geocodes[0].location.split(',');
                            }
                            company.save(cb);
                        });
                    }else{
                        company.save(cb);
                    }
                });
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            if (req.body.des) {
                companyDynamicService.add({
                    company_id: req.decoded.company_id,
                    user_id: req.decoded.id,
                    type: companyDynamicService.typeCode.company_des,
                    data: JSON.stringify({msg: req.body.des})
                }, function () {
                });
            }
            config_common.sendData(req, result, next);
        });
    });

    api.post('/get', function (req, res, next) {
        var company_id = req.decoded.company_id;
        if (_.isArray(company_id)) {
            company_id = company_id[0];
        }
        Company.findOne({_id: company_id}, function (err, company) {
            if (err) {
                return next(err);
            }
            if (!company) {
                return next('not_found');
            }
            config_common.sendData(req, company, next);
        });
    });

    //获取本公司同事自有挂靠货主个数-2.0.0-2017/2/3
    api.post('/get_role_count', function (req, res, next) {
        if (req.decoded.role !== config_common.user_roles.TRAFFIC_ADMIN) {
            return next('not_allow');
        }
        var data = {};
        async.waterfall([
            function (cb) {
                UserTraffic.count({
                    role: config_common.user_roles.TRAFFIC_ADMIN,
                    company_id: req.decoded.company_id,
                    _id: {$nin: [req.decoded.id]}
                }, cb);
            },
            function (count, cb) {
                data.traffic_admin = count || 0;
                // UserTraffic.count({
                //     role: config_common.user_roles.TRAFFIC_DRIVER_PRIVATE,
                //     company_id: req.decoded.company_id[0]
                // }, cb);
                var cond = {company_id: req.decoded.company_id, status: config_common.verification_phase.SUCCESS};
                DriverVerify.count(cond, cb);
            },
            function (count, cb) {
                data.traffic_driver_private = count || 0;
                UserTraffic.count({
                    role: config_common.user_roles.TRAFFIC_DRIVER_PUBLISH,
                    company_id: req.decoded.company_id[0]
                }, cb);
            },
            function (count, cb) {
                data.traffic_driver_publish = count || 0;
                Company_relation.count({
                    other_id: req.decoded.company_id
                    , type: config_common.relation_type.ACCEPT
                }, cb);
            }
        ], function (err, count) {
            data.relation_company = count || 0;
            if (err) {
                return next(err);
            }
            config_common.sendData(req, data, next);
        });
    });

    //检查物流信息可否使用
    api.post('/check_v_info', function (req, res, next) {
        jwt.verify(req.body.token, config_common.secret_keys.traffic, function (err, decoded) {
            if (err) {
                return next('auth_failed');
            }
            req.body.v_info = decoded.v_info;
            checkVInfo(req, function (err) {
                if (err) {
                    return next(err);
                }
                config_common.sendData(req, {}, next);
            });
        });
    });

    //获取公司所有有司机车辆
    api.post('/get_use_truck', function (req, res, next) {
        async.waterfall([
            function (cb) {
                if (req.decoded.role !== config_common.user_roles.TRAFFIC_ADMIN &&
                    req.decoded.role !== config_common.user_roles.TRADE_ADMIN &&
                    req.decoded.role !== config_common.user_roles.TRADE_SALE &&
                    req.decoded.role !== config_common.user_roles.TRADE_PURCHASE) {
                    return cb('not_allow');
                }
                if (!req.body.company_id) {
                    return cb('invalid_format');
                }
                Company.findById(req.body.company_id, function (err, company) {
                    if (err) {
                        return cb(err);
                    }
                    if (!company) {
                        return cb('not_found');
                    }
                    cb();
                });
            },
            function (cb) {
                UserTraffic.find({
                    company_id: req.body.company_id,
                    role: config_common.user_roles.TRAFFIC_DRIVER
                })
                    .select('_id')
                    .exec(function (err, users) {
                        if (err) {
                            return cb(err);
                        }
                        cb(null, users);
                    });
            },
            function (users, cb) {
                var user_ids = _.map(users, function (data) {
                    return data._id.toString()
                });
                Truck.find({
                    verify_phase: config_common.verification_phase.SUCCESS,//TODO 车辆认证打开时打开
                    user_id: {$in: user_ids}
                })
                    .select('_id')
                    .exec(function (err, trucks) {
                        if (err) {
                            return cb(err);
                        }
                        cb(null, user_ids, trucks);
                    });
            },
            function (user_ids, trucks, cb) {
                var truck_ids = _.map(trucks, function (data) {
                    return data._id.toString()
                });
                http.sendTrafficServer({truck_ids: truck_ids}, config_api_url.get_used_truck_path, function (err, trucks) {
                    if (err) {
                        return cb(err);
                    }
                    var truck_ids = trucks.length > 0 ? _.map(trucks, function (data) {
                        return data.truck_id.toString()
                    }) : [];
                    var cond = truck_ids ? {
                        verify_phase: config_common.verification_phase.SUCCESS,//TODO 车辆认证打开时打开
                        _id: {$nin: truck_ids},
                        user_id: {$in: user_ids}
                    } : {
                        verify_phase: config_common.verification_phase.SUCCESS,//TODO 车辆认证打开时打开
                        user_id: {$in: user_ids}
                    };
                    cb(null, cond);
                });
            },
            function (cond, cb) {
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
    });

    //获取本公司替换车辆(进行中订单换车使用)-2.0.0-2017/1/16
    api.post('/get_replace_truck', function (req, res, next) {
        if (req.decoded.role !== config_common.user_roles.TRAFFIC_ADMIN) {
            return next('not_allow');
        }
        req.body.page = req.body.page ? req.body.page : 1;
        if (!req.body.order_id) {
            return next('invalid_format');
        }
        async.waterfall([
            function (cb) {
                truckService.getDriverTruckUse(req, req.decoded.company_id, cb);
            },
            function (truck_arr, cb) {
                truckService.getDriverTruckNotPlan(req, req.decoded.company_id, req.body.order_id, function (err, trucks) {
                    if (err) {
                        return cb(err);
                    }
                    var arr = [];
                    var truckObj = util.transObjArrToObj(truck_arr, '_id');
                    for (var i = 0; i < trucks.length; i++) {
                        var truck = trucks[i];
                        if (truckObj[truck._id]) {
                            arr.push(truck);
                        }
                    }
                    cb(null, arr);
                });
            },
            function (truck_arr, cb) {
                var pages = Math.floor(truck_arr.length / config_common.truck_group_per_page);
                if (truck_arr.length % config_common.truck_group_per_page) {
                    pages++;
                }
                var truck = truck_arr.slice((req.body.page - 1) * config_common.truck_group_per_page, req.body.page * config_common.truck_group_per_page);
                var exist = req.body.page < pages;
                cb(null, {truck: truck, pages: pages, exist: exist});
            }
        ], function (err, data) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, data, next);
        });
    });

    //获取本公司替换车辆(已指派订单换车使用)-2.0.0-2017/1/18
    api.post('/get_replace_truck_plan', function (req, res, next) {
        if (req.decoded.role !== config_common.user_roles.TRAFFIC_ADMIN) {
            return next('not_allow');
        }
        req.body.page = req.body.page ? req.body.page : 1;
        if (!req.body.order_id) {
            return next('invalid_format');
        }
        async.waterfall([
            function (cb) {
                truckService.getDriverTruckUse(req, req.decoded.company_id, cb, req.body.order_id);
            },
            function (truck_arr, cb) {
                truckService.getDriverTruckNotPlan(req, req.decoded.company_id, req.body.order_id, function (err, trucks) {
                    if (err) {
                        return cb(err);
                    }
                    var arr = [];
                    var truckObj = util.transObjArrToObj(truck_arr, '_id');
                    for (var i = 0; i < trucks.length; i++) {
                        var truck = trucks[i];
                        if (truckObj[truck._id]) {
                            arr.push(truck);
                        }
                    }
                    cb(null, arr);
                });
            },
            function (truck_arr, cb) {
                var pages = Math.floor(truck_arr.length / config_common.truck_group_per_page);
                if (truck_arr.length % config_common.truck_group_per_page) {
                    pages++;
                }
                var truck = truck_arr.slice((req.body.page - 1) * config_common.truck_group_per_page, req.body.page * config_common.truck_group_per_page);
                var exist = req.body.page < pages;
                cb(null, {truck: truck, pages: pages, exist: exist});
            }
        ], function (err, data) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, data, next);
        });
    });

    //获取本公司所有可用司机和车辆(订单派车使用)
    api.post('/get_use_truck_user', function (req, res, next) {
        if (req.decoded.role !== config_common.user_roles.TRAFFIC_ADMIN) {
            return next('not_allow');
        }
        var truck_arr = [];
        req.body.page = req.body.page ? req.body.page : 1;
        if (req.body.is_public) {
            req.body.type = config_common.truck_group_type.PUBLIC;
            var user_data;
            async.waterfall([
                function (cb) {
                    trafficUserService.getCompanyUserUse(req, req.decoded.company_id, cb, req.body.order_id);
                },
                function (useUsers, cb) {
                    //trafficUserService.getCompanyUserNotPlan(req, req.decoded.company_id, req.body.order_id, function(err, planUsers){
                    //    if(err){
                    //        return cb(err);
                    //    }
                    //    var useObj = util.transObjArrToObj(useUsers, '_id');
                    //    var data = {};
                    //    for(var i = 0; i < (planUsers).length; i++){
                    //        var user = (planUsers)[i];
                    //        if(useObj[user._id]){
                    //            data[user._id] = user;
                    //        }
                    //    }
                    //    user_data = _.values(data);
                    //    cb();
                    //});
                    user_data = useUsers;
                    cb();
                },
                function (cb) {
                    truckService.getCompanyTruckUse(req, req.decoded.company_id, cb, req.body.order_id);
                },
                function (useTrucks, cb) {
                    //truckService.getCompanyTruckNotPlan(req, req.decoded.company_id, req.body.order_id, function(err, planTrucks){
                    //    if(err){
                    //        return cb(err);
                    //    }
                    //    var useObj = util.transObjArrToObj(useTrucks, '_id');
                    //    var data = {};
                    //    for(var i = 0; i < (planTrucks).length; i++){
                    //        var truck = (planTrucks)[i];
                    //        if(useObj[truck._id]){
                    //            data[truck._id] = truck;
                    //        }
                    //    }
                    //    truck_arr = _.values(data);
                    //    truckService.getGroupTruck(req.decoded.company_id, req.body.group_id, req.body.type, cb);
                    //});
                    truck_arr = useTrucks;
                    truckService.getGroupTruck(req.decoded.company_id, req.body.group_id, req.body.type, cb);
                },
                function (trucks, cb) {
                    var useObj = util.transObjArrToObj(trucks, '_id');
                    var data = {};
                    for (var i = 0; i < (truck_arr).length; i++) {
                        var truck = (truck_arr)[i];
                        if (useObj[truck._id]) {
                            data[truck._id] = truck;
                        }
                    }
                    truck_arr = _.values(data);
                    cb();
                },
                function (cb) {
                    for (var i = 0; i < truck_arr.length; i++) {
                        truck_arr[i].status = 'abusy';
                    }
                    var pages = Math.floor(truck_arr.length / config_common.truck_group_per_page);
                    if (truck_arr.length % config_common.truck_group_per_page) {
                        pages++;
                    }
                    var truck = truck_arr.slice((req.body.page - 1) * config_common.truck_group_per_page, req.body.page * config_common.truck_group_per_page);
                    cb(null, {user: user_data, truck: truck, pages: pages});
                }
            ], function (err, data) {
                if (err) {
                    return next(err);
                }
                config_common.sendData(req, data, next);
            });
        } else {
            req.body.type = config_common.truck_group_type.PRIVATE;
            async.waterfall([
                function (cb) {
                    //truckService.getDriverTruckUse(req, req.decoded.company_id, cb, req.body.order_id);
                    truckService.getDriverTruck(req.decoded.company_id, cb);
                },
                function (useTrucks, cb) {
                    //truckService.getDriverTruckNotPlan(req, req.decoded.company_id, req.body.order_id, function(err, planTrucks){
                    //    if(err){
                    //        return cb(err);
                    //    }
                    //    var useObj = util.transObjArrToObj(useTrucks, '_id');
                    //    var data = {};
                    //    for(var i = 0; i < (planTrucks).length; i++){
                    //        var truck = (planTrucks)[i];
                    //        if(useObj[truck._id]){
                    //            data[truck._id] = truck;
                    //        }
                    //    }
                    //    truck_arr = _.values(data);
                    //    truckService.getGroupTruck(req.decoded.company_id, req.body.group_id, req.body.type, cb);
                    //});
                    truck_arr = useTrucks;
                    truckService.getGroupTruck(req.decoded.company_id, req.body.group_id, req.body.type, cb);
                },
                function (trucks, cb) {
                    var useObj = util.transObjArrToObj(trucks, '_id');
                    var data = {};
                    for (var i = 0; i < (truck_arr).length; i++) {
                        var truck = (truck_arr)[i];
                        if (useObj[truck._id]) {
                            data[truck._id] = truck;
                        }
                    }
                    truck_arr = _.values(data);
                    cb();
                },
                function (cb) {
                    for (var i = 0; i < truck_arr.length; i++) {
                        truck_arr[i].status = 'abusy';
                    }
                    var pages = Math.floor(truck_arr.length / config_common.truck_group_per_page);
                    if (truck_arr.length % config_common.truck_group_per_page) {
                        pages++;
                    }
                    var truck = truck_arr.slice((req.body.page - 1) * config_common.truck_group_per_page, req.body.page * config_common.truck_group_per_page);
                    cb(null, {truck: truck, pages: pages});
                }
            ], function (err, data) {
                if (err) {
                    return next(err);
                }
                config_common.sendData(req, data, next);
            });
        }
    });

    //获取抢单车辆(订单派车使用)
    api.post('/get_offer_truck', function (req, res, next) {
        if (req.decoded.role !== config_common.user_roles.TRAFFIC_ADMIN) {
            return next('not_allow');
        }
        var truck_arr = [];
        async.waterfall([
            function (cb) {
                //truckService.getDriverTruckUse(req, req.decoded.company_id, cb, req.body.order_id);
                truckService.getDriverTruck(req.decoded.company_id, cb);
            },
            function (useTrucks, cb) {
                //truckService.getDriverTruckNotPlan(req, req.decoded.company_id, req.body.order_id, function(err, planTrucks){
                //    if(err){
                //        return cb(err);
                //    }
                //    var useObj = util.transObjArrToObj(useTrucks, '_id');
                //    var data = {};
                //    for(var i = 0; i < (planTrucks).length; i++){
                //        var truck = (planTrucks)[i];
                //        if(useObj[truck._id]){
                //            data[truck._id] = truck;
                //        }
                //    }
                //    truck_arr = _.values(data);
                //    cb(null, truck_arr);
                //});
                cb(null, useTrucks);
            },
            function (trucks, cb) {
                http.sendTrafficServerNoToken(req, {order_id: req.body.order_id}, config_api_url.traffic_server_driver_offer_admin_get, function (err, offers) {
                    if (err) {
                        return cb(err);
                    }
                    var arr = [];
                    var truckObj = util.transObjArrToObj(trucks, 'user_id');
                    for (var i = 0; i < offers.length; i++) {
                        var user_id = offers[i].user_id;
                        if (truckObj[user_id]) {
                            truckObj[user_id].time_offer = new Date(offers[i].time_creation);
                            arr.push(truckObj[user_id]);
                        }
                    }
                    truck_arr = arr;
                    cb();
                });
            },
            function (cb) {
                for (var i = 0; i < truck_arr.length; i++) {
                    truck_arr[i].status = 'abusy';
                }
                cb(null, {truck: truck_arr});
            }
        ], function (err, data) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, data, next);
        });
    });

    return api;
};
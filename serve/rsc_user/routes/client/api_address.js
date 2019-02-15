/**
 * Created by Administrator on 2016/11/7.
 */
var async = require('async');
var express = require('express');
var configCity = require('../../configs/config_city');
var configProvince = require('../../configs/config_province');
var configDistrict = require('../../configs/config_district');
var config_common = require('../../configs/config_common');

var addressService = require('../../libs/lib_address');
var sdk_map_gaode = require('../../sdks/map_gaode/sdk_map_gaode');

module.exports = function () {
    var api = express.Router();

    //根据地址的id得到一个地址
    api.post('/get_one', function (req, res, next) {
        if (!req.body.address_id) {
            return next('invalid_format');
        }
        var cond = {
            _id: req.body.address_id
        };
        addressService.getOne({find: cond}, function (err, address) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, address, next);
        });
    });

    api.use(require('../../middlewares/mid_verify_user')());

    //得到decoded.id的所有地址
    api.post('/get', function (req, res, next) {
        var query = {
            user_id: req.decoded.id,
            status: config_common.address_status.effective
        };

        // if (req.body.detailed_address) {
        //     query.detailed_address = {$regex: req.body.detailed_address, $options: 'i'};
        // }

        if (req.body.differentiate) {
            query.differentiate = req.body.differentiate;
        }
        addressService.getList({
            find: query,
            sort: {'time_creation': -1}
        }, function (err, address) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, address, next);
        });
    });

    //根据地址的文字得到经纬度信息
    api.post('/get_Coord', function (req, res, next) {
        if (!req.body.province ||
            !req.body.city ||
            !req.body.district ||
            !req.body.addr) {
            return next('invalid_format');
        }
        async.waterfall([
            function (cb) {
                sdk_map_gaode.getCoordinate(req.body.province + req.body.city + req.body.district + req.body.addr, cb);
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            global.config_common.sendData(req, result, next);
        })
    });

    //得到地址的具体内容
    api.post('/get_count', function (req, res, next) {
        var query = {
            user_id: req.decoded.id,
            status: config_common.address_status.effective
        };
        if (req.body.detailed_address) {
            query.detailed_address = {$regex: req.body.detailed_address, $options: 'i'};
        }
        if (req.body.differentiate) {
            query.differentiate = req.body.differentiate;
        }
        addressService.getCount(query, function (err, address) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, address, next);
        });
    });

    //获取默认地址
    api.post('/get_default_address', function (req, res, next) {
        if (!config_common.differentiate_type[req.body.differentiate]) {
            return next('invalid_format');
        }
        async.waterfall([
            function (cb) {
                // 由于仓库暂时不对外，当可以对外是可以放开
                // global.lib_default_store.getOne({
                //     find: {user_id: req.decoded.id, differentiate: req.body.differentiate}
                // }, cb);
                cb(null, null);
            },
            function (store, cb) {
                var cond;
                if (store) {
                    cond = {find: {_id: store.store_id}};
                } else {
                    cond = {
                        find: {
                            user_id: req.decoded.id,
                            differentiate: req.body.differentiate,
                            is_default: true
                        }
                    }
                }
                addressService.getOne(cond, cb);
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            global.config_common.sendData(req, result, next);
        });
    });

    //设为默认地址
    api.post('/set_default_address', function (req, res, next) {
        if (!req.body.address_id || !config_common.differentiate_type[req.body.differentiate]) {
            return next('invalid_format');
        }
        var data;
        async.waterfall([
            function (cb) {
                global.lib_address.getOne({
                    find: {
                        _id: req.body.address_id
                        //type: {$exists: true}
                        // company_id: req.decoded.company_id(为了设置第三方仓库为默认地址屏蔽)
                    }
                }, cb);
            },
            function (address, cb) {
                if (!address) {
                    return cb('address_not_found');
                }
                data = address;
                if (address.type) {
                    global.lib_default_store.update({
                        find: {
                            user_id: req.decoded.id,
                            differentiate: global.config_common.differentiate_type[req.body.differentiate]
                        },
                        set: {
                            user_id: req.decoded.id,
                            store_id: req.body.address_id,
                            differentiate: global.config_common.differentiate_type[req.body.differentiate]
                        },
                        options: {upsert: true}
                    }, cb);
                } else {
                    addressService.set_default({
                        user_id: req.decoded.id,
                        address_id: req.body.address_id,
                        differentiate: req.body.differentiate
                    }, cb);
                }
            }
        ], function (err) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, data, next);
        });
    });

    //增加地址
    api.post('/add', function (req, res, next) {
        if (!config_common.checkProvince(req.body.province) ||
            !config_common.checkCity(req.body.province, req.body.city) ||
            !req.body.addr ||
            !config_common.differentiate_type[req.body.differentiate]) {
            return next('invalid_format');
        }
        var startProvince = configProvince[req.body.province];
        var startCity = configCity[req.body.province][req.body.city];
        var startDistrict = configDistrict[req.body.city][req.body.district];
        var reqObj = {
            user_id: req.decoded.id,
            company_id: req.decoded.company_id,
            province: startProvince.name,
            city: startCity.name,
            district: startDistrict ? startDistrict.name : '',
            addr: req.body.addr,
            differentiate: req.body.differentiate,
            prin_name: req.body.prin_name,
            prin_phone: req.body.prin_phone
        };
        async.waterfall([
            function (cb) {
                addressService.add(req, reqObj, cb);
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, result, next);
        });
    });

    //删除地址
    api.post('/dec', function (req, res, next) {
        if (!req.body.address_id) {
            return next('invalid_format');
        }
        var cond = {
            _id: req.body.address_id,
            user_id: req.decoded.id
        };
        var is_default;
        var differentiate;

        async.waterfall([
            function (cb) {
                //先去查询销售配送区域相关的地址，如果有，则不让过！
                global.lib_http.sendTradeServer({
                    method: 'getCount',
                    cond: {location_storage: {$in:req.body.address_id}},
                    model: 'PassPrice'
                }, global.config_api_url.server_common_get, cb);
            },
            function (count,cb) {
                if(count>0){
                    return cb('地址已被使用，请删除配送模板相关数据！');
                }
                addressService.getOne({
                    find: cond
                }, cb);
            },
            function (address, cb) {
                if (!address) {
                    return cb(null, 1);
                } else {
                    is_default = address.is_default;
                    differentiate = address.differentiate;
                    address.remove(cb);
                }
            },
            function (count, cb) {
                if (is_default) {
                    var query = {
                        user_id: req.decoded.id,
                        differentiate: differentiate,
                        status: config_common.address_status.effective
                    };
                    addressService.getList({
                        find: query,
                        sort: {time_creation: -1}
                    }, function (err, addressArr) {
                        if (err) {
                            return cb(err);
                        }
                        if (addressArr[0]) {
                            addressArr[0].is_default = true;
                            addressArr[0].save(cb);
                        } else {
                            cb();
                        }
                    });
                } else {
                    cb();
                }
            }
        ], function (err) {
            if (err) {
                return next(err);
            }
            global.config_common.sendData(req, {}, next);
        });
    });

    //修改地址
    api.post('/edit', function (req, res, next) {
        if (!req.body.address_id) {
            return next('invalid_format');
        }
        if (req.body.province) {
            if (!config_common.checkProvince(req.body.province) ||
                !config_common.checkCity(req.body.province, req.body.city) ||
                !config_common.checkDistrictStrict(req.body.city, req.body.district)) {
                return next('invalid_format');
            }
        }
        addressService.getOne({
            find: {
                _id: req.body.address_id,
                user_id: req.decoded.id,
                status: config_common.address_status.effective
            }
        }, function (err, address) {
            if (err) {
                return next(err);
            }
            if (!address) {
                return next('not_found');
            }
            if (req.body.prin_name) {
                address.prin_name = req.body.prin_name;
            }
            if (req.body.prin_phone) {
                if (!config_common.checkPhone(req.body.prin_phone)) {
                    return next('phone_format_erro');
                }
                address.prin_phone = req.body.prin_phone;
            }
            var change;
            if (req.body.province) {
                var startProvince = configProvince[req.body.province];
                var startCity = configCity[req.body.province][req.body.city];
                var startDistrict = configDistrict[req.body.city][req.body.district];
                address.province = startProvince.name;
                address.city = startCity.name;
                address.district = startDistrict ? startDistrict.name : '';
                change = true;
            }
            if (req.body.addr) {
                address.addr = req.body.addr;
                change = true;
            }
            if (change) {
                sdk_map_gaode.getCoordinate(address.province + address.city + address.district + address.addr, function (err, coordinate) {
                    if (coordinate && coordinate.geocodes && coordinate.geocodes[0]) {
                        address.location = coordinate.geocodes[0].location.split(',');
                    }
                    addressService.edit(address, function (err, saveRes) {
                        if (err) {
                            return next(err);
                        }
                        config_common.sendData(req, saveRes, next);
                    });
                });
            } else {
                addressService.edit(address, function (err, saveRes) {
                    if (err) {
                        return next(err);
                    }
                    config_common.sendData(req, saveRes, next);
                });
            }
        });
    });


    return api;
};
/**
 * Created by Administrator on 2017/9/20.
 */

var async = require('async');
var _ = require('underscore');
var express = require('express');

var sdk_map_gaode = require('../../sdks/map_gaode/sdk_map_gaode');

module.exports = function () {

    var api = express.Router();

    api.use(require('../../middlewares/mid_verify_user')());

    //增加仓库
    api.post('/add', function (req, res, next) {
        if (!req.body.name ||
            !global.config_common.checkProvince(req.body.province) ||
            !global.config_common.checkCity(req.body.province, req.body.city) ||
            !req.body.addr || !_.isNumber(req.body.area) || !global.config_common.store_type[req.body.type]) {
            return next('invalid_format');
        }
        var startProvince = global.config_province[req.body.province];
        var startCity = global.config_city[req.body.province][req.body.city];
        var startDistrict = global.config_district[req.body.city][req.body.district];
        var address = {
            name: req.body.name,
            province: startProvince.name,
            city: startCity.name,
            district: startDistrict ? startDistrict.name : '',
            addr: req.body.addr,
            prin_name: req.decoded.user_name,
            prin_phone: req.decoded.phone,
            type: req.body.type,
            area: req.body.area,
            user_ids: [req.decoded.id]
        };
        async.waterfall([
            function (cb) {
                if (req.decoded.company_id) {
                    cb(null, req.decoded);
                } else {
                    global.lib_user.getOne({find: {_id: req.decoded.id}}, cb);
                }
            },
            function (user, cb) {
                if (!user) {
                    return cb('user_not_found');
                }
                if (user.company_id) {
                    address.company_id = user.company_id;
                }
                global.lib_address.add(req, address, cb);
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            global.config_common.sendData(req, result, next);
        });
    });

    //获取公司全部仓库地址
    api.post('/get', function (req, res, next) {
        var storeDatas;
        async.waterfall([
            function (cb) {
                global.lib_user.getOne({find: {_id: req.decoded.id}}, cb);
            },
            function (user, cb) {
                var query = {};
                if (req.body.scene === 'default') {
                    query.user_ids = {$in: [req.decoded.id]};
                    query.type = {$exists: true};
                } else {
                    if (_.isArray(user.company_id)) {
                        user.company_id = user.company_id[0];
                    }
                    if (user.company_id) {
                        if (_.isArray(user.company_id)) {
                            query.company_id = user.company_id[0];
                        } else {
                            query.company_id = user.company_id;
                        }
                        query.type = {$exists: true};
                    } else {
                        query.user_ids = req.decoded.id;
                    }
                }
                global.lib_address.getList({
                    find: query,
                    sort: {time_creation: -1}
                }, cb);
            },
            function (stores, cb) {
                storeDatas = stores;
                global.lib_default_store.getList({
                    find: {user_id: req.decoded.id}
                }, cb);
            },
            function (stores, cb) {
                if (stores.length) {
                    var storeObj = {};
                    for (var j = 0; j < stores.length; j++) {
                        var a = stores[j];
                        if (!storeObj[a.store_id]) {
                            storeObj[a.store_id] = a;
                        } else {
                            storeObj[a.store_id].differentiate = 'Both';
                        }
                    }
                    for (var i = 0; i < storeDatas.length; i++) {
                        var storeData = storeDatas[i];
                        var store = storeObj[storeData._id.toString()];
                        if (store && storeData._id.toString() === store.store_id) {
                            storeData = storeData.toObject();
                            storeData.is_default = true;
                            storeData.differentiate = store.differentiate;
                            storeDatas[i] = storeData;
                            //break;
                        }
                    }
                    cb(null, storeDatas);
                } else {
                    cb(null, storeDatas);
                }
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            global.config_common.sendData(req, result, next);
        });
    });

    //获取公司认证仓库公司的地址
    api.post('/get_verify', function (req, res, next) {
        var storeDatas;
        async.waterfall([
            function (cb) {
                global.lib_company_relation.getList({
                    find: {self_id: req.decoded.company_id, other_type: global.config_common.company_category.STORE}
                }, cb);
            },
            function (relations, cb) {
                var query = {};
                query.company_id = {$in: global.lib_util.transObjArrToSigArr(relations, 'other_id')};
                query.type = {$exists: true};
                global.lib_address.getList({
                    find: query,
                    sort: {time_creation: -1}
                }, cb);
            },
            function (stores, cb) {
                storeDatas = stores;
                global.lib_default_store.getList({
                    find: {user_id: req.decoded.id}
                }, cb);
            },
            function (stores, cb) {
                if (stores.length) {
                    var storeObj = {};
                    for (var j = 0; j < stores.length; j++) {
                        var a = stores[j];
                        if (!storeObj[a.store_id]) {
                            storeObj[a.store_id] = a;
                        } else {
                            storeObj[a.store_id].differentiate = 'Both';
                        }
                    }
                    for (var i = 0; i < storeDatas.length; i++) {
                        var storeData = storeDatas[i];
                        var store = storeObj[storeData._id.toString()];
                        if (store && storeData._id.toString() === store.store_id) {
                            storeData = storeData.toObject();
                            storeData.is_default = true;
                            storeData.differentiate = store.differentiate;
                            storeDatas[i] = storeData;
                            break;
                        }
                    }
                    cb(null, storeDatas);
                } else {
                    cb(null, storeDatas);
                }
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            global.config_common.sendData(req, result, next);
        });
    });

    //获取自己负责仓库地址
    api.post('/get_self', function (req, res, next) {
        async.waterfall([
            function (cb) {
                global.lib_user.getOneTrade({find: {_id: req.decoded.id}}, cb);
            },
            function (user, cb) {
                var query = {};
                query.user_ids = req.decoded.id;
                global.lib_address.getList({
                    find: query,
                    sort: {time_creation: -1}
                }, cb);
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            global.config_common.sendData(req, result, next);
        });
    });

    /**
     * 获取自己的仓库列表有排序
     */
    api.post('/get_self_sort', function (req, res, next) {
        var addressData;
        var arr3 = [];
        var sort_id;
        var sortData;
        async.waterfall([
            function (cb) {
                global.lib_address.getList({
                    find: {user_ids: req.decoded.id},
                    sort: {time_creation: -1}
                }, cb);
            },
            function (address, cb) {
                addressData = address;
                if (req.body.store_id) {
                    var arr = _.filter(addressData, function (num) {
                        return num._id.toString() != req.body.store_id;
                    });
                    var arr2 = _.filter(addressData, function (num) {
                        return num._id.toString() == req.body.store_id;
                    });
                    arr3 = arr2.concat(arr);
                }
                global.lib_store_sort.getOne({find: {user_id: req.decoded.id}}, cb);
            },
            function (sort, cb) {
                if (!sort) {
                    if (arr3.length) {
                        global.lib_store_sort.add({user_id: req.decoded.id, store_id: _.pluck(arr3, '_id')}, cb);
                    } else {
                        global.lib_store_sort.add({user_id: req.decoded.id, store_id: _.pluck(addressData, '_id')}, cb);
                    }
                } else {
                    sortData = sort;
                    if (arr3.length) {
                        sort.store_id = _.pluck(arr3, '_id');
                        sort.save(cb);
                    } else {
                        cb(null, null, null);
                    }
                }
            },
            function (data, count, cb) {
                if (data) {
                    sort_id = data.store_id[0];
                } else {
                    sort_id = sortData.store_id[0];
                }
                global.lib_address.getList({
                    find: {user_ids: req.decoded.id},
                    sort: {time_creation: -1}
                }, cb);
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            var arr = _.filter(result, function (num) {
                return num._id.toString() != sort_id;
            });
            var arr2 = _.filter(result, function (num) {
                return num._id.toString() == sort_id;
            });
            result = arr2.concat(arr);

            global.config_common.sendData(req, result, next);
        });
    });

    //修改仓库
    api.post('/edit', function (req, res, next) {
        if (!req.body.store_id) {
            return next('invalid_format');
        }
        if (req.body.province) {
            if (!global.config_common.checkProvince(req.body.province) ||
                !global.config_common.checkCity(req.body.province, req.body.city) ||
                !global.config_common.checkDistrictStrict(req.body.city, req.body.district)) {
                return next('invalid_format');
            }
        }
        global.lib_address.getOne({
            find: {_id: req.body.store_id}
        }, function (err, address) {
            if (err) {
                return next(err);
            }
            if (!address) {
                return next('address_not_found');
            }
            if (req.body.type) {
                if (!global.config_common.store_type[req.body.type]) {
                    return next('invalid_format');
                }
                address.type = req.body.type;
            }
            if (req.body.area) {
                if (!_.isNumber(req.body.area)) {
                    return next('invalid_format');
                }
                address.area = req.body.area;
            }
            if (req.body.name) {
                address.name = req.body.name;
            }
            address.time_creation = new Date();
            var change;
            if (req.body.province) {
                var startProvince = global.config_province[req.body.province];
                var startCity = global.config_city[req.body.province][req.body.city];
                var startDistrict = global.config_district[req.body.city][req.body.district];
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
                    global.lib_address.edit(address, function (err, saveRes) {
                        if (err) {
                            return next(err);
                        }
                        global.config_common.sendData(req, saveRes, next);
                    });
                });
            } else {
                global.lib_address.edit(address, function (err, saveRes) {
                    if (err) {
                        return next(err);
                    }
                    global.config_common.sendData(req, saveRes, next);
                });
            }
        });
    });

    //绑定仓库
    api.post('/bind', function (req, res, next) {
        if (!req.body.store_id ||
            !_.isBoolean(req.body.bind)) {
            return next('invalid_format');
        }
        global.lib_address.getOne({
            find: {_id: req.body.store_id}
        }, function (err, address) {
            if (err) {
                return next(err);
            }
            if (!address) {
                return next('address_not_found');
            }
            if (req.body.bind) {
                address.user_ids = _.union(address.user_ids, [req.decoded.id]);
            } else {
                if (address.user_ids.length === 1) {
                    return next('store_at_least_one_admin');
                }
                address.user_ids = _.without(address.user_ids, req.decoded.id);
            }
            global.lib_address.edit(address, function (err, saveRes) {
                if (err) {
                    return next(err);
                }
                global.config_common.sendData(req, saveRes, next);
            });
        });
    });

    //绑定仓库
    api.post('/del', function (req, res, next) {
        if (!req.body.store_id) {
            return next('invalid_format');
        }
        var addressData;
        async.waterfall([
            function (cb) {
                global.lib_address.getOne({
                    find: {_id: req.body.store_id}
                }, cb);
            },
            function (address, cb) {
                if (!address) {
                    return cb('address_not_found');
                }
                //公司级地址，不是你公司的不允许删除
                if (address.company_id && (address.company_id !== req.decoded.company_id)) {
                    return cb('not_allow');
                }
                //个人级地址，不是你的不允许删除
                if (!address.company_id && address.user_ids[0] !== req.decoded.id) {
                    return cb('not_allow');
                }
                addressData = address;
                global.lib_http.sendTrafficServer({
                    method: 'getCount',
                    cond: {
                        status: 'effective',
                        '$or': [{send_address_id: req.body.store_id}, {receive_address_id: req.body.store_id}]
                    },
                    model: 'TrafficOrder'
                }, global.config_api_url.server_common_get, cb);
            },
            function (count, cb) {
                if (count) {
                    return cb('store_is_using');
                }
                addressData.remove(cb);
            },
            function (count, cb) {
                global.lib_default_store.del({
                    store_id: req.body.store_id
                }, cb);
            }
        ], function (err) {
            if (err) {
                return next(err);
            }
            global.config_common.sendData(req, {}, next);
        });
    });

    return api;

};
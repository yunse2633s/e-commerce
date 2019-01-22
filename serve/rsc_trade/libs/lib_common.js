/**
 * Created by Administrator on 17/5/19.
 */
var async = require('async');
var _ = require('underscore');

var config_error = global.config_error;
var lib_User = require('../libs/lib_User');
var lib_push = require('../libs/lib_push');
var util = require('../libs/util');
var http = require('../libs/http');
var lib_PassPrice = require('../libs/lib_PassPrice');

var paramObj = {
    _id: 1,
    id: 1,
    change_remain: 1,
    quality_img: 1
};
/**
 * 修改
 * @param req
 * @param libModel
 * @param callback
 */
exports.edit = function (req, libModel, callback) {
    async.waterfall([
        function (cb) {
            config_error.checkBody(req.body, ['id'].concat(_.allKeys(req.body)), cb);
        },
        function (cb) {
            libModel.getOne({
                find: {_id: req.body.id}
            }, cb);
        },
        function (entry, cb) {
            if (!entry) return cb(config_error.invalid_id);
            for (var index in req.body) {
                if (req.body.hasOwnProperty(index) && _.allKeys(entry).indexOf(index) >= 0 && !paramObj[index]) {
                    entry[index] = req.body[index];
                }
            }
            if (entry.change_remain || entry.change_remain === 0) {
                if (entry.change_remain === 0) {
                    return cb(config_error.no_number);
                }
                entry.change_remain = entry.change_remain - 1;
            }
            if (req.body.quality_img) {
                entry.time_update_quality_img = new Date();
                entry.quality_img = req.body.quality_img;
                var original_file = entry.quality_img.split('/').pop();
                if (original_file !== undefined && original_file !== '') {
                    global.middleware.deleteImgFromAliyun(original_file);
                }
            }
            libModel.time_creation = new Date();
            libModel.edit(entry, function (err, obj) {
                if (err) return cb(err);
                cb(null, obj._id);
            });
        }
    ], callback);
};
/**
 * 详情
 * @param req
 * @param libModel
 * @param callback
 */
exports.detail = function (req, libModel, callback) {
    var entry;
    async.waterfall([
        function (cb) {
            config_error.checkBody(req.body, ['id'], cb);
        },
        function (cb) {
            libModel.getOne({
                find: {_id: req.body.id},
            }, cb);
        },
        function (result, cb) {
            if (!result) {
                //这个获取详细信息被用于登录和不登录两种状态
                if (req.decoded) {
                    libModel.getOne({
                        find: {user_demand_id: req.decoded.id, offer_id: req.body.id}
                    }, cb);
                } else {
                    cb(null, null);
                }
            } else {
                cb(null, result);
            }
        },
        function (result, cb) {
            if (!result) return cb(config_error.invalid_id);
            entry = JSON.parse(JSON.stringify(result));
            if (req.decoded) {
                libModel.update({
                    find: {_id: req.body.id},
                    set: req.decoded.id === result.user_id ? {} : {$addToSet: {browse_offer: req.decoded.id}}
                }, cb);
            } else if (req.body.user_id) {
                libModel.update({
                    find: {_id: req.body.id},
                    set: req.body.user_id === result.user_id ? {} : {$addToSet: {browse_offer: req.body.user_id}}
                }, cb);
            } else {
                cb(null, null);
            }
        }
    ], function (err) {
        if (err) return callback(err);
        if (req.decoded) {
            global.lib_Statistical.statistical_server_companyTrade_add(req, {
                companyObj: _.reduce(_.keys(entry), function (list, param) {
                    if ((new RegExp('id')).test(param) && (new RegExp('company')).test(param)) {
                        list.push({
                            id: entry[param],
                            type: entry.ownType + '_browse',
                            add_user_id: entry['user_' + _.rest(param.split('_')).join('_')],
                            user_id: req.decoded.id
                        });
                        if (entry.product_categories && entry.product_categories[0]) {
                            if (entry.product_categories[0]['layer_1']) {
                                list.push({
                                    id: entry[param],
                                    type: entry.ownType + entry.product_categories[0]['layer_1'],
                                    user_id: req.decoded.id
                                });
                            }
                            if (entry.product_categories[0].layer && entry.product_categories[0].layer['layer_1']) {
                                list.push({
                                    id: entry[param],
                                    type: entry.ownType + entry.product_categories[0].layer['layer_1'].split('_')[0] + '_browse',
                                    user_id: req.decoded.id
                                });
                            }
                        }
                    }
                    return list;
                }, [])
            });
        } else if (req.body.user_id) {
            lib_User.getUserOne({find: {_id: req.body.user_id}}, function (err, userData) {
                global.lib_Statistical.statistical_server_companyTrade_add(userData, {
                    companyObj: _.reduce(_.keys(entry), function (list, param) {
                        if ((new RegExp('id')).test(param) && (new RegExp('company')).test(param)) {
                            list.push({
                                id: entry[param],
                                type: entry.ownType + '_browse',
                                add_user_id: entry['user_' + _.rest(param.split('_')).join('_')],
                                user_id: req.body.user_id
                            });
                            if (entry.product_categories && entry.product_categories[0]) {
                                if (entry.product_categories[0]['layer_1']) {
                                    list.push({
                                        id: entry[param],
                                        type: entry.ownType + entry.product_categories[0]['layer_1'],
                                        user_id: req.body.user_id
                                    });
                                }
                                if (entry.product_categories[0].layer && entry.product_categories[0].layer['layer_1']) {
                                    list.push({
                                        id: entry[param],
                                        type: entry.ownType + entry.product_categories[0].layer['layer_1'].split('_')[0] + '_browse',
                                        user_id: req.body.user_id
                                    });
                                }
                            }
                        }
                        return list;
                    }, [])
                });
            })
        }
        callback(null, entry);
    });
};
/**
 * 删除
 * @param req
 * @param libModel
 * @param callback
 */
exports.del = function (req, libModel, callback) {
    async.waterfall([
        function (cb) {
            config_error.checkBody(req.body, ['ids'], cb);
        },
        function (cb) {
            if (_.isArray(libModel)) {
                var query = {
                    $or: [{
                        offer_id: {$in: req.body.ids},
                        user_demand_id: req.decoded.id
                    }, {
                        demand_id: {$in: req.body.ids},
                        user_supply_id: req.decoded.id
                    }, {
                        _id: {$in: req.body.ids}
                    }]
                };
                async.waterfall([
                    function (cback) {
                        libModel[1].update({
                            find: query,
                            set: {$inc: {count_offer: -1}, $pull: {list_offer: req.decoded.id}}
                        }, cback);
                    },
                    function (entry, cback) {
                        libModel[0].del(query, cback);
                    }
                ], cb);
            } else {
                libModel.del({_id: req.body.ids}, cb);
            }
        }
    ], function (err) {
        if (err) {
            return callback(err);
        }
        callback();
    });
};
/**
 * 添加公司和用户信息
 * @param req
 * @param result
 * @param callback
 * @param type
 * @param userParam
 * @param companyParam
 */
var addUserAndCompany = function (req, result, callback, type, userParam, companyParam) {
    var query = {};
    var cond = {};
    if (req.decoded) {
        if ((result.list.length > 0 && result.list[0].user_demand_id && result.list[0].user_demand_id !== req.decoded.id && type === 'supply') ||
            (result.list.length > 0 && result.list[0].user_supply_id && result.list[0].user_supply_id !== req.decoded.id && type === 'demand')) {
            query._id = req.decoded.id;
            if (req.decoded.company_id) {
                cond._id = req.decoded.company_id;
            }
        } else {
            query._id = {$in: _.pluck(result.list, userParam || 'user_id')};
            cond._id = {$in: _.compact(_.pluck(result.list, companyParam || 'company_id'))};
        }
        async.waterfall([
            function (cb) {
                lib_User.getUserList({
                    find: query
                }, cb);
            },
            function (userArr, cb) {
                result.list = util.addUser(result.list, userArr, userParam || 'user_id');
                lib_User.getCompanyList({
                    find: cond
                }, cb);
            },
            function (companyArr, cb) {
                result.list = util.getObjArr(util.addCompanyVIP(result.list, companyArr, companyParam || 'company_id'), '_id');
                cb(null, result);
            }
        ], callback);
    } else {
        callback(null, result);
    }

};
exports.addUserAndCompany = addUserAndCompany;

/**
 * 增加仓库名称
 * wly
 */
exports.addStorageName = function (data, callback) {
    async.waterfall([
        function (cb) {
            lib_User.getListStorage({
                find: {_id: {$in: _.compact(_.pluck(data.list, 'location_storage'))}}
            }, cb);
        },
        function (storage, cb) {
            data.list = util.addStorage(data.list, storage, 'location_storage');
            cb(null, data);
        }
    ], callback);
};

/**
 * 抢单和报价获取剩余修改次数
 * @param req
 * @param libModel
 * @param callback
 */
exports.get_change_remain = function (req, libModel, callback) {
    async.waterfall([
        function (cb) {
            config_error.checkBody(req.body, ['id'], cb);
        },
        function (cb) {
            libModel.getOne({
                find: {
                    $or: [{
                        demand_id: req.body.id,
                        user_supply_id: req.decoded.id
                    }, {
                        offer_id: req.body.id,
                        user_supply_id: req.decoded.id
                    }]
                }
            }, cb);
        },
        function (entry, cb) {
            cb(null, entry);
        }
    ], callback);
};
/**
 * 生意圈
 * @param req
 * @param libModel
 * @param fun
 * @param callback
 * @param type
 */
exports.circle_of_friends = function (req, libModel, fun, callback, type) {
    var page_num = req.body.page || 1;
    async.waterfall([
        function (cb) {
            lib_User.get_trade_circle({
                user_id: req.decoded.id,
                type: type
            }, cb);
        },
        function (result, cb) {
            var query = {
                find: {
                    user_id: {$in: result},
                    status: global.config_model.offer_status.published
                },
                skip: global.config_common.entry_per_page * (page_num - 1),
                limit: global.config_common.entry_per_page,
                sort: {time_creation: -1}
            };
            libModel.getListAndCount(page_num, query, cb);
        },
        function (result, cb) {
            if (!result) return callback(null, {count: 0, exist: false, list: []});
            fun(result, cb);
        },
        function (result, cb) {
            addUserAndCompany(req, result, cb);
        }
    ], callback);
};
/**
 * 智能推动列表
 * @param req
 * @param libModel
 * @param param
 * @param fun
 * @param callback
 */
exports.get_push = function (req, libModel, param, fun, callback) {
    var page_num = req.body.page || 1;
    async.waterfall([
        function (cb) {
            lib_push.getOne({
                find: {user_id: req.decoded.id}
            }, cb);
        },
        function (result, cb) {
            if (!result) return cb(global.config_error.invalid_format.not_found);
            var query = {
                find: {
                    _id: _.isArray(result[param]) ? {$in: result[param]} : result[param],
                    status: global.config_model.offer_status.published
                },
                skip: global.config_common.entry_per_page * (page_num - 1),
                limit: global.config_common.entry_per_page,
                sort: {time_creation: -1}
            };
            libModel.getListAndCount(page_num, query, cb);
        },
        function (result, cb) {
            if (!cb) return result(null, {count: 0, exist: false, list: []});
            fun(result, cb);
        },
        function (result, cb) {
            addUserAndCompany(req, result, cb);
        }
    ], callback);
};

/****
 * 灰色文字提示
 * *****/
exports.hint = function (result, req, callback) {
    async.eachSeries(result.list, function (one_data, cb) {
        if (one_data.list.browse_offer.length && _.indexOf(one_data.list.browse_offer, req.decoded.id) != -1) {
            one_data.list.hint = "已浏览";
        }
        if (one_data.list.list_offer.length && _.indexOf(one_data.list.list_offer, req.decoded.id) != -1) {
            one_data.list.hint = "已出价";
        }
        if (one_data.list.has_order.length && _.indexOf(one_data.list.has_order, req.decoded.id) != -1) {
            one_data.list.hint = "已交易";
        }
        if (one_data.list.type == 'DJ' && one_data.list.hint == "已浏览") {
            global.lib_shop.getOne({
                cond: {
                    find: {
                        user_demand_id: req.decoded.id,
                        offer_id: one_data.list._id.toString()
                    }
                }
            }, function (err, data) {
                if (data) {
                    one_data.list.hint = "已加入购物车";
                }
                cb();
            });
        } else {
            cb();
        }
    }, function (err) {
        if (err) {
            console.log(err);
        }
        callback(null, result);
    });

};
var getPID = function (count, length, layer, data, callback) {
    async.waterfall([
        function (cb) {
            if (count <= 0) {
                cb(null, data);
            } else {
                global.lib_Classify.getOne({
                    find: {
                        PID: data._id.toString(),
                        eng: layer['layer_' + length]
                    }
                }, function (err, result) {
                    data = result
                    return getPID(count - 1, length + 1, layer, data, cb);
                });
            }
        }
    ], function (err, result) {
        callback(err, result)
    })
}
exports.getPID = getPID;

/**
 * 根据报价id得到相应的购物车的列表，并修改购物车中的相关价格（加一个历史价格字段）
 * 参数 id(报价id)
 */
exports.editShop = function (id, callback) {
    if (!callback) {
        callback = function () {
        }
    }
    var obj = {};//收集有需要的信息（1）报价价格（2）优惠区域（3）专属优惠
    async.waterfall([
        function (cb) {
            // (1)根据id查询到相应的报价
            global.lib_PriceOffer.getOne({find: {_id: id}}, cb);
        },
        function (data, cb) {
            // (2-1)根据报价得到相应的 调价，区域优惠，专属优惠；
            obj.price_routes = data.price_routes;//优惠区域
            obj.product_categories = data.product_categories[0]
            //优惠区域
            //     if (data.passPrice_id) {
            //         lib_PassPrice.getOne({find: {_id: data.passPrice_id}})
            //     } else {
            //         cb(null, null);
            //     }
            // },
            // function (data, cb) {
            //     // (2-2)根据报价得到的
            //     if (data) {
            //         obj.price_pass = 90;
            //     } else {
            //         obj.price_pass = 0;
            //     }

            // (3)根据上述条件得到相关的购物车数据
            global.lib_shop.getList({find: {offer_id: id}}, cb);
        },
        function (list, cb) {
            //循环查询到的所有的购物车数据
            async.eachSeries(list, function (oneData, callback2) {
                for (var i = 0; i < obj.product_categories.product_name.length; i++) {
                    //确定和购物车中的是同一个产品，然后开始修改
                    if (obj.product_categories.product_name[i].short_id === oneData.product_categories.product_name.short_id) {
                        // (1)判断价格有没有修改；
                        // (1-1)替换购物车中的价格；
                        var odlPrice = oneData.price;
                        var newPrice;
                        oneData.product_categories.product_name.product_price = obj.product_categories.product_name[i].product_price;
                        // (1-2)判断购物车中的价格类型，收集应该新使用的价格；
                        if (oneData.type == 'weight') {
                            //新使用的价格
                            newPrice = obj.product_categories.product_name[i].price_weight;
                        } else {
                            newPrice = obj.product_categories.product_name[i].price_remember;
                        }
                        //(2)判断区域优惠有没有修改；
                        var quYuYouHui = _.find(obj.price_routes, function (num) {
                            return num.price != 0 && num.city == oneData.address_Obj.city;
                        });
                        if (!quYuYouHui) {
                            quYuYouHui = 0;
                        } else {
                            quYuYouHui = quYuYouHui.price;
                        }
                        //(3)判断专属优惠有没有修改；
                        var zhuanShuYouHui = 0;
                        if (obj.product_categories.product_name[i].price_preferential.length) {
                            //(3-1)修改购物车中的专属优惠
                            oneData.product_categories.product_name.price_preferential = obj.product_categories.product_name[i].price_preferential;
                            //(3-2)根据购物车的价格类型，取到新的专属优惠价格
                            if (oneData.type == 'weight') {
                                var data = _.find(oneData.product_categories.product_name.price_preferential, function (num) {
                                    if (!num.type) {
                                        num.type = all;
                                    }
                                    return num.user_id == oneData.user_demand_id && num.type != 'remember';
                                });
                                zhuanShuYouHui = data.price;
                            } else {
                                var data = _.find(oneData.product_categories.product_name.price_preferential, function (num) {
                                    if (!num.type) {
                                        num.type = all;
                                    }
                                    return num.user_id == oneData.user_demand_id && num.type != 'weight';
                                });
                                zhuanShuYouHui = data.price;
                            }
                        }

                        //（4）有区域优惠时去修改报价
                        // if (oneData.price_pass && oneData.price_pass != 0) {
                        //     //先判断报价中的price_pass
                        //     if (oneData.price_pass != obj.price_pass) {
                        //         oneData.price_pass = obj.price_pass
                        //     }
                        // }

                        //得到最新的价格
                        newPrice = newPrice - quYuYouHui - zhuanShuYouHui;
                        if (newPrice != odlPrice) {
                            oneData.price = newPrice;
                            oneData.product_categories.product_name.price = newPrice;
                            oneData.product_categories.product_name.preferential = quYuYouHui;
                            oneData.product_categories.product_name.preferential_company = zhuanShuYouHui;
                            if (newPrice - odlPrice > 0) {
                                oneData.changePrice = [{name: '上涨', price: newPrice - odlPrice}];
                            } else {
                                oneData.changePrice = [{name: '下调', price: odlPrice - newPrice}];
                            }


                            if (oneData.price_pass != 0) {
                                oneData.product_categories.product_name.preferential_company = zhuanShuYouHui
                            }


                            oneData.markModified('product_categories');
                            oneData.markModified('changePrice');
                            oneData.save();
                        }
                    }
                }
                callback2();
            }, cb);
        }
    ], callback)
};

/**
 * 推送给自己公司的相关人员，自己发了一条报价
 */
exports.pushTuiSong = function (req, data, callback) {
    if (!callback) {
        callback = function () {
        }
    }
    var ownType_zhuanHUna = {
        pricing: '报价',
        bidding: '竞价',
        demand: '采购'
    };
    var obj = {};
    async.waterfall([
        function (cb) {
            global.http.sendUserServer({
                method: 'getOne',
                cond: {find: {_id: data.user_id}},
                model: 'User_trade'
            }, '/api/server/common/get', cb);
        },
        function (user, cb) {
            obj.name = user.real_name;
            if (user && user.company_id) {
                var cond = {find: {company_id: data.company_id}}
                if (data.ownType == 'demand') {
                    cond.find.role = {$in: ['TRADE_PURCHASE', 'TRADE_ADMIN']}
                } else {
                    cond.find.role = {$in: ['TRADE_SALE', 'TRADE_ADMIN']}
                }
                global.http.sendUserServer({
                    method: 'getList',
                    cond: cond,
                    model: 'User_trade'
                }, '/api/server/common/get', cb);
            } else {
                cb(null, null);
            }
        },
        function (users, cb) {
            if (users) {
                obj.ids = _.difference(_.map(_.pluck(users, '_id'), function (num) {
                    return num.toString();
                }), [req.decoded.id]);
                http.sendMsgServerNotToken(req, {
                    title: '互联网+',
                    user_ids: JSON.stringify(obj.ids),
                    content: "您的同事" + obj.name + "发布了一条" + ownType_zhuanHUna[data.ownType],
                    data: JSON.stringify({
                        params: {id: data.company_id, type: "TRADE"},
                        url: 'rsc.company_page',
                        type: "TRADE"
                    })
                }, '/api/push/push');
            }
            cb();
        }
    ], callback);

};

/**
 * 给报价或竞价添加公司和用户信息
 */
var addUserAndCompany_w = function (list, callback) {
    var arr = [];
    async.eachSeries(list, function (oneData, cbk) {
        oneData.dt_type = 'trade_pricing';
        var obj = {list: oneData};
        async.waterfall([
            function (cbk2) {
                lib_User.getUserOne({
                    find: {_id: oneData.user_id},
                    select: 'real_name photo_url role'
                }, cbk2);
            },
            function (user, cbk2) {
                obj.user = user;
                lib_User.getCompanyOne({
                    find: {_id: oneData.company_id},
                    select: 'nick_name url_logo verify_phase vip panorama_url'
                }, cbk2);
            },
            function (company, cbk2) {
                obj.company = company;
                arr.push(obj);
                cbk2();
            }
        ], cbk)
    }, function (err) {
        if (err) {
            console.log('err:', err);
        }
        callback(null, arr);
    })
};
exports.addUserAndCompany_w = addUserAndCompany_w;

/**
 * 功能:根据公司id查询这个公司所有的销售订单是否达到500、1000、1500...吨
 * @param company_id
 * @param callback
 */
exports.pushTuiSongOrder = function (req, company_id, callback) {
    //这个用来判断是否发送推送
    var amount = 500;
    async.waterfall([
        function (cb) {
            //查询公司是否发送了500的推送
            global.lib_orderAmount.getOne({find: {company_id: company_id}}, cb);
        },
        function (data, cb) {
            if (data) {
                amount = data.amount + data.constant;
                cb(null, null, null);
            } else {
                global.lib_orderAmount.add({
                    company_id: company_id
                }, cb);
            }
        },
        function (data, count, cb) {
            //现在的时间
            var start = new Date(new Date(new Date().toLocaleDateString()).getTime());
            //今日0点
            var end = new Date(new Date(new Date().toLocaleDateString()).getTime() + 24 * 60 * 60 * 1000 - 1);
            global.lib_DemandOrder.getList({
                find: {
                    company_supply_id: company_id,
                    time_creation: {
                        $gte: start,
                        $lte: end
                    }
                }
            }, cb);
        },
        function (list, cb) {
            var a = _.pluck(list, 'amount');
            var allCount = 0;
            for (var i = 0; i < a.length; i++) {
                allCount += a[i];
            }
            if (allCount > amount) {
                global.http.sendUserServer({
                    method: 'getList',
                    cond: {
                        find: {
                            company_id: company_id,
                            role: {$in: ['TRADE_SALE', 'TRADE_ADMIN']}
                        }
                    },
                    model: 'User_trade'
                }, '/api/server/common/get', function (err, users) {
                    if (users.length) {
                        var ids = _.map(_.pluck(users, '_id'), function (num) {
                            return num.toString();
                        });
                        http.sendMsgServerNotToken(req, {
                            title: '互联网+',
                            user_ids: JSON.stringify(ids),
                            content: "贵公司今日成交销售订单已达" + allCount.toFixed(3) + '吨',
                            data: JSON.stringify({
                                params: {id: company_id, type: "TRADE"},
                                url: 'rsc.company_page',
                                type: "TRADE"
                            })
                        }, '/api/push/push');
                        global.lib_orderAmount.update({
                            find: {company_id: company_id},
                            set: {amount: amount}
                        }, function (err, data) {
                            if (err) {
                                console.log('pushTuiSongOrder_err:', err);
                            }
                        });
                    }
                    cb();
                });
            } else {
                cb();
            }
        }
    ], callback);
};

/**
 * 功能：修改
 * @param id 固定竞价形成的订单的id
 * @param callback
 */
exports.editDjJJ = function (id, callback) {
    var DjJJData;
    async.waterfall([
        function (cb) {
            //查询到这个固定竞价
            global.lib_OfferAgain.getOne({find: {order_id: id}}, cb);
        },
        function (data, cb) {
            global.lib_PriceOffer.getOne({find: {_id: data.offer_id}}, cb);
        },
        function (data, cb) {
            DjJJData = data;
            global.lib_OfferAgain.getList({find: {offer_id: data._id.toString()}}, cb);
        },
        function (list, cb) {
            global.lib_DemandOrder.getList({find: {_id: {$in: _.compact(_.pluck(list, "order_id"))}}}, cb);
        },
        function (list, cb) {
            var a = _.pluck(list, 'amount');
            var allCount = 0;
            for (var i = 0; i < a.length; i++) {
                allCount += a[i];
            }
            if (allCount >= DjJJData.amount) {
                global.lib_PriceOffer.update({
                    find: {_id: DjJJData._id.toString()},
                    set: {status: global.config_model.offer_status.expired}
                }, cb);
            } else {
                cb(null, null);
            }
        }
    ], callback);
};

/**
 * 功能：查询今日销售出去多少吨订单
 * 参数：id（公司的id）,callback
 */
exports.getAllAmount = function (id, callback) {
    async.waterfall([
        function (cb) {
            //现在的时间
            var start = new Date(new Date(new Date().toLocaleDateString()).getTime());
            //今日0点
            var end = new Date(new Date(new Date().toLocaleDateString()).getTime() + 24 * 60 * 60 * 1000 - 1);
            global.lib_DemandOrder.getList({
                find: {
                    company_supply_id: id,
                    time_creation: {
                        $gte: start,
                        $lte: end
                    }
                }
            }, cb);
        },
        function (list, cb) {
            var a = _.pluck(list, 'amount');
            var allCount = 0;
            for (var i = 0; i < a.length; i++) {
                allCount += a[i];
            }
            cb(null, allCount.toFixed(3));
        }
    ], callback);
};


exports.getList_all = function (data, callback) {
    //第一步，查询进行中的采购--1）查询进行中的数量，和页数所需要的个数进行比较，判断是查询进行中的还是去查询已取消的
    //第二部，查询已取消的采购--(2)根据总数和上一步查询的到的数量对比，更新查询的条件
    var shuZi = 0;
    var list;
    async.waterfall([
        function (cb) {
            global.lib_Demand.getCount(data.find, cb);
        },
        function (count02, cb) {
            shuZi = count02;
            global.lib_Demand.getList(data, cb);
        },
        function (lista, cb) {
            list = lista;
            //（1）确定是否需要查询已失效的
            if (shuZi < (data.skip + 10)) {
                //修改查询条件
                data.find.status = 'expired';
                //(2)根据取到第几条确定已失效的应该从第几条开始确定,如果是需要补全则limit需要减一下
                if ((data.skip + 10) - shuZi < 10) {
                    data.limit = (data.skip + 10) - shuZi;
                    data.skip = 0;
                } else {
                    var geWei = ((data.skip + 10) - shuZi) % 10;
                    var shiWei = parseInt((data.skip - shuZi) / 10) * 10;
                    data.skip = geWei + shiWei;
                }
                global.lib_Demand.getList(data, cb);
            } else {
                cb(null, []);
            }
        },
        function (data, cb) {
            return cb(null, list.concat(data));
        }
    ], callback);
};
exports.getList_all_jj = function (data, callback) {

    //第一步，查询进行中的采购--1）查询进行中的数量，和页数所需要的个数进行比较，判断是查询进行中的还是去查询已取消的

    //第二部，查询已取消的采购--(2)根据总数和上一步查询的到的数量对比，更新查询的条件
    var shuZi = 0;
    var list;
    async.waterfall([
        function (cb) {
            global.lib_PriceOffer.getCount(data.find, cb);
        },
        function (count02, cb) {
            shuZi = count02;
            global.lib_PriceOffer.getList(data, cb);
        },
        function (lista, cb) {
            list = lista;
            //（1）确定是否需要查询已失效的
            if (shuZi < (data.skip + 10)) {
                //修改查询条件
                data.find.status = 'expired';
                //(2)根据取到第几条确定已失效的应该从第几条开始确定,如果是需要补全则limit需要减一下
                if ((data.skip + 10) - shuZi < 10) {
                    data.limit = (data.skip + 10) - shuZi;
                    data.skip = 0;
                } else {
                    var geWei = ((data.skip + 10) - shuZi) % 10;
                    var shiWei = parseInt((data.skip - shuZi) / 10) * 10;
                    data.skip = geWei + shiWei;
                }
                global.lib_PriceOffer.getList(data, cb);
            } else {
                cb(null, []);
            }
        },
        function (data, cb) {
            return cb(null, list.concat(data));
        }
    ], callback);
};
exports.getList_all_dj_participation = function (data, callback) {

    //第一步，查询进行中的采购--1）查询进行中的数量，和页数所需要的个数进行比较，判断是查询进行中的还是去查询已取消的

    //第二部，查询已取消的采购--(2)根据总数和上一步查询的到的数量对比，更新查询的条件
    var shuZi = 0;
    var list;
    async.waterfall([
        function (cb) {
            global.lib_DemandOrder.getCount(data.find, cb);
        },
        function (count02, cb) {
            shuZi = count02;
            global.lib_DemandOrder.getList(data, cb);
        },
        function (lista, cb) {
            list = lista;
            //（1）确定是否需要查询已失效的
            if (shuZi < (data.skip + 10)) {
                //修改查询条件
                data.find.status = global.config_common.listType.cancelled;
                //(2)根据取到第几条确定已失效的应该从第几条开始确定,如果是需要补全则limit需要减一下
                if ((data.skip + 10) - shuZi < 10) {
                    data.limit = (data.skip + 10) - shuZi;
                    data.skip = 0;
                } else {
                    var geWei = ((data.skip + 10) - shuZi) % 10;
                    var shiWei = parseInt((data.skip - shuZi) / 10) * 10;
                    data.skip = geWei + shiWei;
                }
                global.lib_DemandOrder.getList(data, cb);
            } else {
                cb(null, []);
            }
        },
        function (data, cb) {
            return cb(null, list.concat(data));
        }
    ], callback);
};

/**
 * 功能：向详情中加入(1)报价创建时间到最后一个订单时间的时间差(2)查询到所有的订单总数量
 * @param data 报价的详情
 * @param callback
 */
exports.addLockContent = function (data, callback) {
    async.waterfall([
        function (cb) {
            //(1)根据id查询到报价相关的订单
            //(2)根据相关时间查询到对应订单的吨数
            global.lib_DemandOrder.getList({
                find: {
                    offer_id: {$in: [data._id.toString()]},
                    time_creation: {$gt: new Date(data.lock_date)}
                },
                sort: {time_creation: -1}
            }, cb);
        },
        function (orderList, cb) {
            //(3)收集整理数据
            if (orderList && orderList.length) {
                var time = orderList[0].time_creation.getTime() - new Date(data.lock_date).getTime();//时间差的毫秒数
                time = global.config_common.MillisecondToDate(time);
                var sum = _.reduce(_.pluck(orderList, 'amount'), function (memo, num) {
                    return memo + num;
                }, 0);//总吨数
            } else {
                var time = 0 + '秒';
                var sum = 0;
            }
            cb(null, {time: time, sum: sum});
        }
    ], callback)
};

/*
 * 功能：计算可销售数量，和总件数
 * @param req
 * @param offerAgain中的offer_id
 * */
exports.sum_order = function (req, offer_id, saveOrderData) {
    var product_names = _.flatten(_.pluck(req.body.product_categories, 'product_name'));
    var short_ids = _.pluck(product_names, 'short_id');
    var number = _.pluck(product_names, 'number');
    var sum = _.reduce(number, function (memo, num) {
        return memo + num;
    }, 0);
    var offerData;
    async.waterfall([
        function (cbk) {
            global.lib_PriceOffer.onlyGetOne({
                find: {_id: offer_id}
            }, cbk);
        },
        function (data, cbk) {
            offerData = data;
            if (data && data.sum_number != 0) {
                //总的剩余件数/吨数
                data.sum_number = data.sum_number - sum;
                data.save();
                cbk();
            } else {
                cbk();
            }
        },
        function (cbk) {
            global.lib_ProductName.getList({
                find: {
                    short_id: {$in: short_ids}
                }
            }, cbk);
        },
        function (list, cbk) {
            for (var i = 0; i < list.length; i++) {
                //匹配short_id相等的数据
                var number1 = _.find(product_names, function (num) {
                    return num.short_id == list[i].short_id;
                });
                //单个产品的剩余件数/吨数
                list[i].attribute[0].value = list[i].attribute[0].value - number1.number;
                if (list[i].attribute[0].value == 0) {
                    list[i].attribute[0].end_time = new Date();
                }
                list[i].markModified('attribute');
                list[i].save();
            }
            cbk();
        },
        function (cbk) {
            if (offerData) {
                saveOrderData.date_content.type = offerData.date_type;
                saveOrderData.date_content.cut_date = offerData.cut_date;
                saveOrderData.date_content.cut_type = offerData.cut_type;
                saveOrderData.date_content.start_date = offerData.start_date;
                if (offerData.date_type == 'cut') {
                    var cut_time = (offerData.cut_type == 'today' ? 0 : 1000 * 60 * 60 * 24) + 1000 * 60 * 60 * offerData.cut_date;
                    var time = new Date(new Date().toLocaleDateString()).getTime();
                    var newTime = new Date(time + cut_time);
                    saveOrderData.date_content.date = newTime;
                    saveOrderData.date_content.timeout_price = offerData.timeout_price;
                    saveOrderData.date_content.not_count_price = offerData.not_count_price;
                } else {
                    saveOrderData.date_content.date = new Date(new Date(new Date().toLocaleDateString()).getTime() + (1000 * 60 * 60 * 24 * offerData.start_date));
                }
                saveOrderData.markModified('date_content');
                saveOrderData.save();
            }
            cbk()
        }
    ], function (err, result) {
        if (err) {
            console.log('err', err)
        }
    });
};

//取产品最后一级
exports.change_layer=function(id,cbk){
    async.waterfall([
        function(cbk1){
            global.lib_PriceOffer.getOne({
                find:{_id:id}
            },cbk1);
        },
        function(data,cbk1){
            var layer=data.product_categories[0].layer;
            var str = '';
            var arr = [];
            for (var i = 0; i < _.keys(layer).length; i++) {
                var index = _.keys(layer)[i];
                index = index.replace('_chn', '').toString();
                arr[index.split('_')[1] - 1] = layer[index+'_chn'] + ';';
            }
            //keys顺序会变，从一级分类开始整理
            for (var j = 0; j < arr.length; j++) {
                str += arr[j];
            }
            str = str.substr(0, str.length - 1);
            var last_layer=str.split(';')[str.split(';').length-1];
            var last_layer_new=last_layer+'-'+data.product_categories[0].product_name[0].name+'等';
            cbk1(null,last_layer_new);
        }
    ],cbk);

};

exports.change_layer_demand=function(id,cbk){
    async.waterfall([
        function(cbk1){
            global.lib_Demand.getOne({
                find:{_id:id}
            },cbk1);
        },
        function(data,cbk1){
            var layer=data.product_categories[0].layer;
            var str = '';
            var arr = [];
            for (var i = 0; i < _.keys(layer).length; i++) {
                var index = _.keys(layer)[i];
                index = index.replace('_chn', '').toString();
                arr[index.split('_')[1] - 1] = layer[index+'_chn'] + ';';
            }
            //keys顺序会变，从一级分类开始整理
            for (var j = 0; j < arr.length; j++) {
                str += arr[j];
            }
            str = str.substr(0, str.length - 1);
            var last_layer=str.split(';')[str.split(';').length-1];
            var last_layer_new=last_layer+'-'+data.product_categories[0].product_name[0].name+'等';
            cbk1(null,last_layer_new);
        }
    ],cbk);

};

exports.change_buy=function(req,cbk){
    async.waterfall([
        function(cbk1){
            global.http.sendUserServer({
                method: 'getOne',
                cond: {find: {_id: req.decoded.id}},
                model: 'User_trade'
            }, '/api/server/common/get', cbk1);
        },function(user,cbk1){
            var arr = [];
            for(var i = 0; i<user.buy.length;i++){
                arr.push(global.config_common.buy[user.buy[i]])
            }
            var result=arr.join('-');
            cbk1(null,result);
        }
    ],cbk);
}
/**
 * Created by Administrator on 2017/10/19.
 */
var async = require('async');
var _ = require('underscore');
var express = require('express');

module.exports = function () {

    var api = express.Router();

    api.use(require('../../middlewares/mid_verify_user')());

    /**
     * 功能：关闭只能推荐
     * 参数: 无
     */
    api.post('/edit_push_count', function (req, res, next) {
        if (req.body.open === 'true') {
            req.body.open = true;
        } else if (req.body.open === 'false') {
            req.body.open = false;
        } else if (!_.isBoolean(req.body.open)) {
            return next('invalid_format');
        }
        async.waterfall([
            function (cb) {
                //（1）修改个人是否可以推荐
                global.lib_user.getOneEasy({find: {_id: req.decoded.id}}, cb);
            },
            function (user, cb) {
                user.recommend = req.body.open;
                user.save();
                cb();
            },
            function (cb) {
                global.lib_http.sendAdminServer({
                    user_id: req.decoded.id,
                    open: req.body.open
                }, global.config_api_url.admin_server_close_or_open_push_count, cb);
            },
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            global.config_common.sendData(req, result, next);
        })
    });

    /**
     * 功能：查询是否开通了商业智能
     */
    api.post('/check_push_count', function (req, res, next) {
        async.waterfall([
            function (cb) {
                //（1）修改个人是否可以推荐
                global.lib_user.getOneEasy({find: {_id: req.decoded.id}}, cb);
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            global.config_common.sendData(req, {open: result.recommend}, next);
        })
    });

    /**
     * 得到每日推荐的公司
     */
    api.post('/get_one', function (req, res, next) {
        if (!global.config_common.push_type[req.body.type]) {
            return next('invalid_format');
        }
        var adminData;
        var result = [];
        async.waterfall([
            function (cb) {
                //查询指挥中心设置的推送数据
                global.lib_http.sendAdminServer({
                    method: 'getOne',
                    cond: {
                        find: {user_id: req.decoded.id}
                    },
                    model: 'PushCount'
                }, global.config_api_url.admin_server_get, cb);
            },
            function (data, cb) {
                //在这里判断是否需要推送
                if (data) {
                    if (data.count[0].count_validity_company) {
                        adminData = data;
                    } else {
                        return cb('count_zero');
                    }
                } else {
                    return cb('count_zero');
                }
                global.lib_push.getOne({
                    find: {user_id: req.decoded.id, type: req.body.type}
                }, cb);
            },
            function (push, cb) {
                var now = new Date();
                if (push && global.lib_util.isSameDay(push.time_creation, now)) {
                    //今天已经推送过的直接查询就可以了
                    global.lib_company.getList({find: {_id: {$in: push.id}}}, cb);
                } else {
                    //今天第一次推送公司
                    var cond = {};
                    async.waterfall([
                        function (cbk) {
                            //查询到个人信息
                            global.lib_user.getOne({
                                find: {_id: req.decoded.id}
                            }, cbk);
                        },
                        function (user, cbk) {
                            if (global.config_common.checkUserCompany(user)) {
                                //确定这个人有公司 -->查询到这个人的合作公司
                                global.lib_company_relation.getList({
                                    find: {
                                        $or: [
                                            {self_id: user.company_id.toString()},
                                            {other_id: user.company_id.toString()}]
                                    }
                                }, function (err, relations) {
                                    if (err) {
                                        return cbk(err);
                                    }
                                    var company_ids = [req.decoded.company_id];
                                    for (var i = 0; i < relations.length; i++) {
                                        var relation = relations[i];
                                        if (relation.self_id === user.company_id.toString()) {
                                            company_ids.push(relation.other_id);
                                        } else {
                                            company_ids.push(relation.self_id);
                                        }
                                    }
                                    //将自己和自己有合作关心的公司去除
                                    cond._id = {$nin: company_ids};
                                    //查询到自己的这个公司
                                    global.lib_company.getOne({find: {_id: user.company_id}}, cbk);
                                });
                            } else {
                                //没有公司
                                cbk(null, user);
                            }
                        },
                        function (data, cbk) {
                            //根据个人信息或公司信息得到买卖运的数据，进行匹配对应的推荐公司
                            cond['$or'] = [
                                {sell: {$in: data.sell || []}},
                                {buy: {$in: data.buy || []}},
                                {transport: {$in: data.transport || []}}
                            ];
                            //查询符合条件的公司数
                            global.lib_company.getCount(cond, cbk);
                        },
                        function (count, cbk) {
                            //查询到符合条件的公司信息
                            // skip从第x个开始取，实现随机推荐
                            // limit 取出来几个
                            global.lib_company.getList({
                                find: cond,
                                skip: Math.floor(Math.random() * count),
                                limit: adminData.count[0].count_everyday_company
                            }, cbk);
                        },
                        function (companyArr, cbk) {
                            var company = companyArr[0];
                            if (!company) {
                                //如果没有查到对应公司就直接推送出空数据
                                return cbk(null, companyArr);
                            } else if (push) {
                                //  （1）有推荐公司数据数据  （2）user服务器存在push表
                                push.time_creation = new Date();
                                push.id = _.map(_.pluck(companyArr, '_id'), function (num) {
                                    return num.toString()
                                });
                                push.save(function (err, content, count) {
                                    if (err) {
                                        return cbk(err);
                                    }
                                    //修改指挥中心数据
                                    global.lib_http.sendAdminServer({
                                        count: content.id.length,
                                        id: req.decoded.id
                                    }, global.config_api_url.admin_server_edit_push_count, function (err) {
                                        if (err) {
                                            return cbk(err);
                                        }
                                        console.log('指挥中心推荐数量修改成功')
                                    });
                                    return cbk(null, companyArr);
                                });
                            } else {
                                //(1)查询到指挥中心推荐数（2）没有在user服务器加
                                global.lib_push.add({
                                    user_id: req.decoded.id,
                                    id: _.map(_.pluck(companyArr, '_id'), function (num) {
                                        return num.toString()
                                    }),
                                    type: req.body.type,
                                    newest: true
                                }, function (err) {
                                    if (err) {
                                        return cbk(err);
                                    }
                                    global.lib_http.sendAdminServer({
                                        count: companyArr.length,
                                        id: req.decoded.id
                                    }, global.config_api_url.admin_server_edit_push_count, function (err) {
                                        if (err) {
                                            return cbk(err);
                                        }
                                        console.log('指挥中心推荐数量修改成功');
                                    });
                                    return cbk(null, companyArr);
                                });
                            }
                        }
                    ], cb);
                }
            },
            function (companyArr, cb) {
                if (companyArr.length) {
                    async.eachSeries(companyArr, function (oneCompany, callback) {
                        async.waterfall([
                            function (cbk) {
                                global.lib_http.sendDynamicServer({company_id: oneCompany._id.toString()}, global.config_api_url.dynamic_server_company_dynamic_get_count, cbk);
                            },
                            function (count, cbk) {
                                oneCompany = oneCompany.toObject();
                                oneCompany.count = count;
                                result.push(oneCompany);
                                cbk();
                            }
                        ], callback)
                    }, cb);
                } else {
                    cb();
                }
            }
        ], function (err) {
            if (err) {
                return next(err);
            }
            global.config_common.sendData(req, result, next);
        });
    });

    /**
     * 得到每日推荐的个人
     */
    api.post('/get_list', function (req, res, next) {
        if (!global.config_common.push_count_type[req.body.type]) {
            return next('invalid_format');
        }
        var countData;
        var adminPushData;
        var truckBoolean = false;
        async.waterfall([
            function (cb) {
                //查询指挥中心设置的推送数据
                global.lib_http.sendAdminServer({
                    method: 'getOne',
                    cond: {
                        find: {user_id: req.decoded.id}
                    },
                    model: 'PushCount'
                }, global.config_api_url.admin_server_get, cb);
            },
            function (data, cb) {
                //在这里判断是否需要推送
                if (data) {
                    adminPushData = data;
                    //筛选出需要提推送的类型
                    var panDuan = _.filter(data.count, function (num) {
                        return num.type == req.body.type;
                    });
                    if (panDuan[0].disabled) {
                        if (req.body.type === 'traffic_truck') {
                            if (panDuan[0].count_validity_truck) {
                                if (panDuan[0].count_validity_truck > 0) {
                                    countData = panDuan[0];
                                    truckBoolean = adminPushData.pushTruck;
                                } else {
                                    return cb('count_zero');
                                }
                            } else {
                                return cb('count_zero');
                            }
                        } else {
                            if (panDuan[0].count_validity_user > 0) {
                                countData = panDuan[0];
                            } else {
                                return cb('count_zero');
                            }
                        }
                    } else {
                        return cb('count_zero');
                    }
                } else {
                    return cb('count_zero');
                }
                global.lib_push.getOne({
                    find: {user_id: req.decoded.id, type: req.body.type}
                }, cb);
            },
            function (push, cb) {
                var now = new Date();
                if (truckBoolean) {
                    //这里是给物流管理员推荐司机
                    var cond = {};
                    var userCond;
                    async.waterfall([
                        function (cbk) {
                            //查询到个人信息
                            global.lib_user.getOne({
                                find: {_id: req.decoded.id}
                            }, cbk);
                        },
                        function (user, cbk) {
                            //查询和自己有挂靠关系的司机
                            global.lib_driver_verify.getList({
                                find: {
                                    company_id: user.company_id[0],
                                    approve_id: user._id
                                },
                                select: 'user_id'
                            }, cbk);
                        },
                        function (guaKao, cbk) {
                            userCond = {
                                recommend: true,
                                user_id: {$exists: true},
                                _id: {$nin: _.pluck(guaKao, 'user_id')},
                                role: global.config_common.user_roles.TRAFFIC_DRIVER_PRIVATE,
                            };
                            var transport = {
                                "矿石": "kuangshi",
                                "煤焦": "meijiao",
                                "再生资源": "zaishengziyuan",
                                "钢铁": "gangtie"
                            };
                            var arr = _.filter(adminPushData.count, function (num) {
                                return num.type == "traffic_truck";
                            });
                            if (arr[0].transport_type) {
                                userCond['$or'] = [{input_type: arr[0].transport_type}, {transport: {$in: [transport[arr[0].transport_type]]}}];
                            }
                            global.lib_user.getCountAll(userCond, cbk);
                        },
                        function (count, cbk) {
                            global.lib_user.getList({
                                find: userCond,
                                skip: Math.floor(Math.random() * count),
                                limit: countData.count_everyday_truck
                            }, cbk);
                        },
                        function (userArr, cbk) {
                            var user = userArr[0];
                            if (!user) {
                                //如果没有查到对应公司就直接推送出空数据
                                return cbk(null, userArr);
                            } else if (push) {
                                //user服务器存在push表
                                push.time_creation = new Date();
                                push.id = _.map(_.pluck(userArr, '_id'), function (num) {
                                    return num.toString()
                                });
                                push.save(function (err, content, count) {
                                    if (err) {
                                        return cbk(err);
                                    }
                                    //修改指挥中心数据
                                    global.lib_http.sendAdminServer({
                                        count: content.id.length,
                                        id: req.decoded.id,
                                        type: req.body.type,
                                        type_two: 'user',
                                        pushTruck: false      //推荐司机
                                    }, global.config_api_url.admin_server_edit_push_count, function (err) {
                                        if (err) {
                                            return cbk(err);
                                        }
                                    });
                                    return cbk(null, userArr);
                                });
                            } else {
                                //(1)查询到指挥中心推荐数（2）没有在user服务器加
                                global.lib_push.add({
                                    user_id: req.decoded.id,
                                    id: _.map(_.pluck(userArr, '_id'), function (num) {
                                        return num.toString()
                                    }),
                                    type: req.body.type,
                                    newest: true
                                }, function (err) {
                                    if (err) {
                                        return cbk(err);
                                    }
                                    global.lib_http.sendAdminServer({
                                        count: userArr.length,
                                        id: req.decoded.id,
                                        type: req.body.type,
                                        type_two: 'user',
                                        pushTruck: false      //推荐司机
                                    }, global.config_api_url.admin_server_edit_push_count, function (err) {
                                        if (err) {
                                            return cbk(err);
                                        }
                                    });
                                    return cbk(null, userArr);
                                });
                            }
                        }
                    ], cb);
                } else if (push && global.lib_util.isSameDay(push.time_creation, now)) {
                    //今天已经推荐过，直接查询就可以了
                    global.lib_user.getList({find: {_id: {$in: push.id}, recommend: true,}, sort: {_id: -1}}, cb);
                } else {
                    //今天是第一次智能推荐，开始进行一系列判断
                    var cond = {};
                    var userCond;
                    async.waterfall([
                        function (cbk) {
                            //查询到个人信息
                            global.lib_user.getOne({
                                find: {_id: req.decoded.id}
                            }, cbk);
                        },
                        function (user, cbk) {
                            //检查这个人是否存在公司
                            if (req.body.type !== global.config_common.push_count_type.driver_traffic) {
                                if (global.config_common.checkUserCompany(user)) {
                                    //这个人有公司就查询与这家公司有关系合作的公司
                                    global.lib_company_relation.getList({
                                        find: {
                                            $or: [
                                                {self_id: user.company_id.toString()},
                                                {other_id: user.company_id.toString()}]
                                        }
                                    }, function (err, relations) {
                                        if (err) {
                                            return cbk(err);
                                        }
                                        //收集到所有的合作企业的id
                                        if (req.decoded.role == global.config_common.user_roles.TRAFFIC_ADMIN || req.decoded.role == global.config_common.user_roles.TRAFFIC_DRIVER_PRIVATE) {
                                            var company_ids = [req.decoded.company_id[0]];
                                        } else {
                                            var company_ids = [req.decoded.company_id];
                                        }
                                        for (var i = 0; i < relations.length; i++) {
                                            var relation = relations[i];
                                            if (relation.self_id === user.company_id.toString()) {
                                                company_ids.push(relation.other_id);
                                            } else {
                                                company_ids.push(relation.self_id);
                                            }
                                        }
                                        //收集到所有开通了智能推荐的企业


                                        //将自己和自己有合作关心的公司去除
                                        cond._id = {$nin: company_ids};
                                        //查询到自己的这个公司-->用于做筛选条件
                                        global.lib_company.getOne({find: {_id: user.company_id}}, cbk);
                                    });
                                } else {
                                    //没有公司
                                    cond._id = {$nin: []};
                                    cbk(null, user);
                                }
                            } else {
                                cbk(null, user);
                            }
                        },
                        function (data, cbk) {
                            //确定到一系列条件，开始根据 type 类型进行进一步分类与筛选
                            global.lib_http.sendAdminServer({
                                method: 'getOne',
                                cond: {
                                    find: {type: 'user'}
                                },
                                model: 'Blacklist'
                            }, global.config_api_url.admin_server_get, function (err, heiMingDan) {
                                switch (req.body.type) {
                                    //交易
                                    case global.config_common.push_count_type.DJ:
                                        userCond = {
                                            _id: {$nin: heiMingDan ? heiMingDan.id : []},
                                            recommend: true,
                                            company_id: {$nin: cond._id.$nin, $ne: ''},
                                            role: {$in: [global.config_common.user_roles.TRADE_SALE, global.config_common.user_roles.TRADE_ADMIN]},
                                            sell: {$in: data.buy}
                                        };
                                        break;
                                    case global.config_common.push_count_type.JJ:
                                        userCond = {
                                            _id: {$nin: heiMingDan ? heiMingDan.id : []},
                                            recommend: true,
                                            company_id: {$nin: cond._id.$nin, $ne: ''},
                                            role: {$in: [global.config_common.user_roles.TRADE_SALE, global.config_common.user_roles.TRADE_ADMIN]},
                                            sell: {$in: data.buy}
                                        };
                                        break;
                                    case global.config_common.push_count_type.demand:
                                        userCond = {
                                            _id: {$nin: heiMingDan ? heiMingDan.id : []},
                                            recommend: true,
                                            company_id: {$ne: '', $nin: cond._id.$nin},
                                            role: {$in: [global.config_common.user_roles.TRADE_PURCHASE, global.config_common.user_roles.TRADE_ADMIN]},
                                            buy: {$in: data.sell}
                                        }
                                        break;
                                    case global.config_common.push_count_type.trade_traffic:
                                        userCond = {
                                            _id: {$nin: heiMingDan ? heiMingDan.id : []},
                                            recommend: true,
                                            company_id: {$ne: '', $nin: cond._id.$nin},
                                            role: global.config_common.user_roles.TRAFFIC_ADMIN,
                                            transport: {$in: _.uniq(data.sell.concat(data.buy))}
                                        };
                                        break;
                                    //物流
                                    case global.config_common.push_count_type.supply_goods:
                                        userCond = {
                                            _id: {$nin: heiMingDan ? heiMingDan.id : []},
                                            recommend: true,
                                            company_id: {$ne: '', $nin: cond._id.$nin},
                                            role: {
                                                $in: [global.config_common.user_roles.TRADE_PURCHASE,
                                                    global.config_common.user_roles.TRADE_ADMIN,
                                                    global.config_common.user_roles.TRADE_SALE]
                                            },
                                            $or: [{sell: {$in: data.transport || []}},
                                                {buy: {$in: data.transport || []}}]
                                        };
                                        break;
                                    case global.config_common.push_count_type.traffic_truck:
                                        userCond = {
                                            recommend: true,
                                            _id: {$nin: heiMingDan ? heiMingDan.id : []},
                                            role: global.config_common.user_roles.TRAFFIC_DRIVER_PRIVATE,

                                            conpany_id: {$nin: cond._id.$nin},

                                            transport: {$in: data.transport}
                                        };
                                        break;
                                    //司机
                                    case global.config_common.push_count_type.driver_traffic:
                                        if (!data.transport.length) {
                                            data.transport = ['gangtie', 'meijiao', 'kuangshi']
                                        }
                                        userCond = {
                                            recommend: true,
                                            _id: {$nin: heiMingDan ? heiMingDan.id : []},
                                            conpany_id: {$nin: data.company_id},
                                            role: global.config_common.user_roles.TRAFFIC_ADMIN,
                                            transport: {$in: data.transport}
                                        };
                                        break;
                                    default :
                                        console.log('不可能出现的错误！')
                                        break;
                                }
                                global.lib_user.getCountAll(userCond, cbk);
                            });
                        },
                        function (count, cbk) {
                            //查询到符合条件的人
                            // skip从第x个开始取，实现随机推荐
                            // limit 取出来几个
                            if (req.body.type === global.config_common.push_count_type.traffic_truck) {
                                if (req.body.type == 'traffic_truck') {
                                    global.lib_user.getList({
                                        find: userCond,
                                        skip: Math.floor(Math.random() * count),
                                        limit: 100
                                    }, cbk);
                                } else {
                                    global.lib_user.getList({
                                        find: userCond,
                                        skip: Math.floor(Math.random() * count),
                                        limit: 100
                                    }, cbk);
                                }
                            } else {
                                if (req.body.type == 'traffic_truck') {
                                    global.lib_user.getList({
                                        find: userCond,
                                        skip: Math.floor(Math.random() * count),
                                        limit: countData.count_everyday_truck
                                    }, cbk);
                                } else {
                                    global.lib_user.getList({
                                        find: userCond,
                                        skip: Math.floor(Math.random() * count),
                                        limit: countData.count_everyday_user
                                    }, cbk);
                                }
                            }

                        },
                        function (userArr, cbk) {
                            var user = userArr[0];
                            if (!user) {
                                //如果没有查到对应公司就直接推送出空数据
                                return cbk(null, userArr);
                            } else if (push) {
                                //（1）有推荐公司数据数据  （2）user服务器存在push表
                                if (_.isString(userArr[0].company_id)) {
                                    //这里循环去除重复的公司id
                                    var arr = [];
                                    for (var i = 0; i < userArr.length; i++) {
                                        if (arr.length) {
                                            if (_.indexOf(_.pluck(arr, 'company_id'), userArr[i].company_id) == -1) {
                                                arr.push(userArr[i]);
                                            }
                                        } else {
                                            arr.push(userArr[i]);
                                        }
                                    }
                                    userArr = arr;
                                }
                                push.time_creation = new Date();
                                push.id = _.map(_.pluck(userArr, '_id'), function (num) {
                                    return num.toString()
                                });
                                push.save(function (err, content, count) {
                                    if (err) {
                                        return cbk(err);
                                    }
                                    //修改指挥中心数据
                                    global.lib_http.sendAdminServer({
                                        count: content.id.length,
                                        id: req.decoded.id,
                                        type: req.body.type,
                                        type_two: 'user'
                                    }, global.config_api_url.admin_server_edit_push_count, function (err) {
                                        if (err) {
                                            return cbk(err);
                                        }
                                        console.log('指挥中心推荐数量修改成功')
                                    });
                                    return cbk(null, userArr);

                                });
                            } else {
                                //(1)查询到指挥中心推荐数（2）没有在user服务器加
                                global.lib_push.add({
                                    user_id: req.decoded.id,
                                    id: _.map(_.pluck(userArr, '_id'), function (num) {
                                        return num.toString()
                                    }),
                                    type: req.body.type,
                                    newest: true
                                }, function (err) {
                                    if (err) {
                                        return cbk(err);
                                    }
                                    global.lib_http.sendAdminServer({
                                        count: userArr.length,
                                        id: req.decoded.id,
                                        type: req.body.type,
                                        type_two: 'user'
                                    }, global.config_api_url.admin_server_edit_push_count, function (err) {
                                        if (err) {
                                            return cbk(err);
                                        }
                                        console.log('指挥中心推荐数量修改成功');
                                    });
                                    return cbk(null, userArr);
                                });
                            }
                        }
                    ], cb);
                }
            },
            function (userArr, cb) {
                async.mapSeries(userArr, function (user, callback) {
                    user = JSON.parse(JSON.stringify(user));
                    if (req.body.type !== 'traffic_truck') {
                        global.lib_company.getOne({find: {_id: user.company_id}}, function (err, data) {
                            if (data) {
                                user.company_name = data.nick_name;
                                user.verify_phase = data.verify_phase;
                            } else {
                                user.company_name = "";
                                user.verify_phase = "";
                            }
                            callback(null, user);
                        })
                    } else {
                        global.lib_truck.getOne({find: {user_id: {$in: [user._id.toString()]}}}, function (err, data) {
                            if (data) {
                                user.number = data.number;
                                user.type = data.type;
                                user.weight = data.weight;
                            } else {
                                user.number = "";
                                user.type = "";
                                user.weight = "";
                            }
                            callback(null, user);
                        })
                    }
                }, cb);
            }
        ], function (err, userArr) {
            if (err) {
                return next(err);
            }
            if (req.body.type === 'traffic_truck') {
                global.lib_driver_verify.getList({
                    find: {
                        company_id: req.decoded.company_id[0],
                        approve_id: req.decoded.id
                    },
                    select: 'user_id'
                }, function (err, data) {
                    if (err) {
                        return next(err);
                    }
                    var arr = [];
                    for (var i = 0; i < userArr.length; i++) {
                        if (_.indexOf(_.pluck(data, 'user_id'), userArr[i]._id.toString()) == -1) {
                            arr.push(userArr[i]);
                        }
                    }
                    global.config_common.sendData(req, arr, next);

                });
            } else {
                global.config_common.sendData(req, userArr, next);
            }
        })
    });

    /**
     * 功能:得到司机列表
     * 参数：(1):transport 运输类型 (2):number 车牌号
     */
    api.post('/get_list_driver', function (req, res, next) {
        var list = [];
        async.waterfall([
            function (cb) {
                global.lib_push.getOne({
                    find: {user_id: req.decoded.id, type: "traffic_truck"}
                }, cb);
            },
            function (push, cb) {
                if (push) {
                    //判断买卖运
                    var cond = {_id: {$in: push.id}};
                    var transport = {
                        "矿石": "kuangshi",
                        "煤焦": "meijiao",
                        "再生资源": "zaishengziyuan",
                        "钢铁": "gangtie"
                    };
                    if (req.body.transport) {
                        cond["$or"] = [{input_type: req.body.transport}, {transport: {$in: [transport[req.body.transport]]}}];
                    }
                    global.lib_user.getList({find: cond}, cb);
                } else {
                    return cb('未找到推荐司机');
                }
            },
            function (users, cb) {
                global.lib_driver_verify.getList({
                    find: {
                        company_id: req.decoded.company_id[0],
                        approve_id: req.decoded.id
                    },
                    select: 'user_id'
                }, function (err, data) {
                    if (err) {
                        return next(err);
                    }
                    var arr = [];
                    for (var i = 0; i < users.length; i++) {
                        if (_.indexOf(_.pluck(data, 'user_id'), users[i]._id.toString()) == -1) {
                            arr.push(users[i]);
                        }
                    }
                    cb(null, arr);
                })
            },
            function (users, cb) {
                async.eachSeries(users, function (user, callback) {
                    if (req.body.number) {
                        global.lib_truck.getOne({
                            find: {
                                $or: [{create_user_id: user._id.toString()}, {user_id: {$in: [user._id.toString()]}}],
                                number: {$regex: req.body.number}
                            }
                        }, function (err, truck) {
                            if (err) {
                                return cb(err);
                            }
                            if (truck) {
                                list.push({
                                    user: user,
                                    truck: truck
                                });
                            }
                            callback()
                        });
                    } else {
                        global.lib_truck.getOne({
                            find: {$or: [{create_user_id: user._id.toString()}, {user_id: {$in: [user._id.toString()]}}]}
                        }, function (err, truck) {
                            if (err) {
                                return cb(err);
                            }
                            list.push({
                                user: user,
                                truck: truck
                            });
                            callback()
                        });
                    }
                }, cb)
            }
        ], function (err) {
            if (err) {
                return next(err);
            }
            global.lib_http.sendTradeServer({
                method: 'getList',
                cond: {find: {lev: 0}},
                model: 'Classify'
            }, global.config_api_url.trade_server_get_hanzi, function (err, result) {
                list = JSON.parse(JSON.stringify(list));
                var hanZi = _.indexBy(result, 'eng');
                for (var i = 0; i < list.length; i++) {
                    list[i].user.transport = _.map(list[i].user.transport, function (num) {
                        if (_.indexOf(_.pluck(result, 'eng'), num) !== -1) {
                            return hanZi[num].chn;
                        } else {
                            return "";
                        }
                    })
                    list[i].user.transport.push(list[i].user.input_type);
                    list[i].user.transport = _.compact(list[i].user.transport);
                }

                // list.unshift({
                //     user: {
                //         "_id": "5abb2b20f9b82a09fdaab8e2",
                //         "user_id": "5ab0cd68850bde659e57ceb3",
                //         "phone": "18001121549",
                //         "recommend": false,
                //         "other_picture": [],
                //         "admin_id": "",
                //         "jia_shi_zheng_url": "",
                //         "id_card_number_back_url": "",
                //         "id_card_number_url": "",
                //         "verify_lock": "UNLOCK",
                //         "buy": [],
                //         "sell": [],
                //         "post": "",
                //         "addr": "",
                //         "district": "",
                //         "city": "",
                //         "province": "",
                //         "photo_url": "http://support.e-wto.com/default_face.png",
                //         "company_id": [
                //             "5a7fbe757f55ba0cac361feb"
                //         ],
                //         "gender": "MALE",
                //         "role": "TRAFFIC_DRIVER_PRIVATE",
                //         "real_name": "田震",
                //         "transport": [
                //             "钢铁",
                //             "矿石",
                //             "煤焦",
                //             "再生资源"
                //         ],
                //         "__v": 2
                //     },
                //     truck: {
                //         "_id" : "5abb2b20f9b82a09fdaab8e3",
                //         "number" : "京FM7316",
                //         "weight" : "35",
                //         "create_user_id" : "5abb2b20f9b82a09fdaab8e2",
                //         "is_default" : false,
                //         "user_id" : [
                //             "5abb2b20f9b82a09fdaab8e2"
                //         ],
                //         "__v" : 0
                //     }
                // })

                global.config_common.sendData(req, list, next);
            });
        })
    });

    //获取公司分类
    api.post('/get_transport', function (req, res, next) {
        async.waterfall([
            function (cb) {
                //     global.lib_http.sendTradeServer({
                //         method: 'getList',
                //         cond: {find: {lev: 0}},
                //         model: 'Classify'
                //     }, global.config_api_url.trade_server_get_hanzi, cb);
                // },
                // function (list, cb) {
                //     var arr = _.pluck(list, 'chn');
                var arr = ["铁矿石", "辅料", "合金", "钢铁", "线材", "钢坯", "再生资源", "煤焦", "其它"];
                cb(null, arr);
            }
        ], function (err, arr) {
            if (err) {
                return next(err);
            }
            var arr2 = _.map(arr, function (num) {
                return {name: num};
            });
            global.config_common.sendData(req, arr2, next);
        })
    });

    return api;

};
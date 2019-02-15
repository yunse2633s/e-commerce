/**
 * Created by Administrator on 2017/6/23.
 */
var async = require('async');
var _ = require('underscore');
var express = require('express');
var config_common = require('../../configs/config_common');
var config_version = require('../../configs/config_version');

module.exports = function () {

    var api = express.Router();

    api.use(require('../../middlewares/mid_verify_user')());

    //用于角色查看各种单据进行不同提示跳转
    api.post('/get_status', function (req, res, next) {
        if (!req.body.user_id) {
            return next('invalid_format');
        }
        var result = {
            company_self: false,
            company_other: false,
            work_relation: false
        };
        async.waterfall([
            function (cb) {
                global.lib_user.getOne({find: {_id: req.decoded.id}}, cb);
            },
            function (user, cb) {
                if (global.config_common.checkUserCompany(user)) {
                    result.company_self = true;
                }
                global.lib_user.getOne({find: {_id: req.body.user_id}}, cb);
            },
            function (user, cb) {
                if (global.config_common.checkUserCompany(user)) {
                    result.company_other = true;
                }
                if (result.company_other && result.company_self) {
                    if (req.decoded.role === global.config_common.user_roles.TRAFFIC_ADMIN) {
                        global.lib_company_relation.getOne({
                            find: {
                                self_id: user.company_id,
                                other_id: req.decoded.company_id
                            }
                        }, cb);
                    } else if (req.decoded.role === global.config_common.user_roles.TRADE_ADMIN) {
                        global.lib_company_relation.getOne({
                            find: {
                                $or: [
                                    {self_id: req.decoded.company_id, other_id: user.company_id},
                                    {other_id: req.decoded.company_id, self_id: user.company_id}
                                ]
                            }
                        }, cb);
                    } else {
                        global.lib_work_relation.getOne({
                            find: {
                                user_id: req.body.user_id,
                                other_user_id: req.decoded.id
                            }
                        }, cb);
                    }
                } else {
                    cb(null, null);
                }
            },
            function (relation, cb) {
                if (relation) {
                    result.work_relation = true;
                }
                cb();
            }
        ], function (err) {
            if (err) {
                return next(err);
            }
            global.config_common.sendData(req, result, next);
        });
    });

    api.post('/get_one', function (req, res, next) {
        if (req.decoded.role !== global.config_common.user_roles.TRADE_ADMIN) {
            return next('not_allow');
        }
        if (!req.body.company_id ||
            !global.config_common.company_type[req.body.type]) {
            return next('invalid_format');
        }
        var result = {};
        var relationDatas;
        async.waterfall([
            function (cb) {
                if (!req.decoded.company_id) {
                    global.lib_user.getOne({
                        find: {_id: req.decoded.id},
                        select: 'company_id'
                    }, function (err, user) {
                        if (err) {
                            return next(err);
                        }
                        req.decoded.company_id = user.company_id;
                        cb();
                    });
                } else {
                    cb();
                }
            },
            function (cb) {
                global.lib_count.get({
                    body: {
                        company_ids: [req.body.company_id],
                        types: [config_common.count_type.PURCHASE, config_common.count_type.SALE]
                    }
                }, cb);
            },
            function (countObj, cb) {
                result.count = countObj[req.body.company_id];
                var cond = {};
                if (req.body.type === config_common.company_type.SALE) {
                    cond = {self_id: req.decoded.company_id, other_id: req.body.company_id};
                } else {
                    cond = {self_id: req.body.company_id, other_id: req.decoded.company_id};
                }
                global.lib_company_relation.getCount(cond, cb);
            },
            function (count, cb) {
                if (!count) {
                    return cb('not_allow');
                }
                global.lib_company.getOne({
                    find: {_id: req.body.company_id},
                    select: 'url_logo nick_name'
                }, cb);
            },
            function (company, cb) {
                result.company = company;
                var type = req.body.type === config_common.company_type.SALE ? config_common.company_type.PURCHASE : config_common.company_type.SALE;
                global.lib_work_relation.getList({
                    find: {
                        $or: [
                            {
                                company_id: req.decoded.company_id,
                                other_company_id: req.body.company_id,
                                type: req.body.type
                            },
                            {company_id: req.body.company_id, other_company_id: req.decoded.company_id, type: type}
                        ]
                    }
                }, cb);
            },
            function (relations, cb) {
                relationDatas = relations;
                var user_ids = global.lib_util.transObjArrToSigArr(relations, 'user_id');
                global.lib_user.getList({
                    find: {_id: {$in: user_ids}},
                    select: 'photo_url real_name role'
                }, cb);
            },
            function (users, cb) {
                result.list = {};
                var arr = {self: [], other: {}};
                var userObj = global.lib_util.transObjArrToObj(users, '_id');
                for (var i = 0; i < relationDatas.length; i++) {
                    var relation = relationDatas[i];
                    if (relation.company_id == req.decoded.company_id) {
                        //处理我公司没有对接人的
                        if (!relation.other_user_id) {
                            arr.self.push(userObj[relation.user_id]);
                        }
                    } else {
                        var data;
                        if (result.list[relation.user_id]) {
                            data = result.list[relation.user_id];
                        } else {
                            data = {};
                            result.list[relation.user_id] = data;
                        }
                        data.other = userObj[relation.user_id];
                        if (!data.self) {
                            data.self = [];
                        }
                        if (relation.other_user_id) {
                            data.self.push(userObj[relation.other_user_id]);
                        }
                    }
                }
                result.list = _.values(result.list);
                if (arr.self.length) {
                    result.list.push(arr);
                }
                cb();
            }
        ], function (err) {
            if (err) {
                return next(err);
            }
            global.config_common.sendData(req, result, next);
        });
    });

    api.post('/get_assign_users', function (req, res, next) {
        if (!req.body.company_id ||
            !req.body.user_id ||
            !global.config_common.company_type[req.body.type]) {
            return next('invalid_format');
        }
        var result = {};
        async.waterfall([
            function (cb) {
                if (!req.decoded.company_id) {
                    global.lib_user.getOne({
                        find: {_id: req.decoded.id},
                        select: 'company_id'
                    }, function (err, user) {
                        if (err) {
                            return cb(err);
                        }
                        req.decoded.company_id = user.company_id;
                        cb();
                    });
                } else {
                    cb();
                }
            },
            function (cb) {
                var cond = {};
                if (req.body.type == global.config_common.company_type.SALE) {
                    cond = {other_id: req.body.company_id, self_id: req.decoded.company_id};
                } else {
                    cond = {self_id: req.body.company_id, other_id: req.decoded.company_id};
                }
                global.lib_company_relation.getOne({find: cond}, cb);
            },
            function (relation, cb) {
                if (!relation) {
                    return cb('company_relation_not_found');
                }
                var roles = [global.config_common.user_roles.TRADE_ADMIN];
                if (relation.self_id == req.body.company_id) {
                    roles.push(global.config_common.user_roles.TRADE_SALE);
                } else {
                    roles.push(global.config_common.user_roles.TRADE_PURCHASE);
                }
                global.lib_user.getList({
                    find: {company_id: req.decoded.company_id, role: {$in: roles}},
                    select: 'real_name photo_url role company_id'
                }, cb);
            },
            function (users, cb) {
                result.users = [];
                async.eachSeries(users, function (user, callback) {
                    user = user.toObject();
                    async.waterfall([
                        function (cbk) {
                            global.lib_work_relation.getCount({
                                user_id: user._id.toString(),
                                company_id: user.company_id,
                                type: req.body.type
                            }, cbk);
                        },
                        function (count, cbk) {
                            user.count = count;
                            global.lib_work_relation.getCount({
                                user_id: user._id.toString(),
                                company_id: user.company_id,
                                other_company_id: req.body.company_id,
                                other_user_id: req.body.user_id,
                                type: req.body.type
                            }, cbk);
                        },
                        function (count, cbk) {
                            user.select = !!count;
                            result.users.push(user);
                            cbk();
                        }
                    ], callback);
                }, cb);
            }
        ], function (err) {
            if (err) {
                return next(err);
            }
            global.config_common.sendData(req, result, next);
        });
    });

    api.post('/assign_users', function (req, res, next) {
        if (!req.body.company_id ||
            !req.body.user_id ||
            !_.isArray(req.body.user_ids) ||
            !global.config_common.company_type[req.body.type]) {
            return next('invalid_format');
        }
        var type = req.body.type == config_common.company_type.SALE ? config_common.company_type.PURCHASE : config_common.company_type.SALE;
        async.waterfall([
            function (cb) {
                if (!req.decoded.company_id) {
                    global.lib_user.getOne({
                        find: {_id: req.decoded.id},
                        select: 'company_id'
                    }, function (err, user) {
                        if (err) {
                            return next(err);
                        }
                        req.decoded.company_id = user.company_id;
                        cb();
                    });
                } else {
                    cb();
                }
            },
            function (cb) {
                var cond = {};
                if (req.body.type == config_common.company_type.SALE) {
                    cond.self_id = req.decoded.company_id;
                    cond.other_id = req.body.company_id;
                } else {
                    cond.self_id = req.body.company_id;
                    cond.other_id = req.decoded.company_id;
                }
                global.lib_company_relation.getCount(cond, cb);
            },
            function (count, cb) {
                if (!count) {
                    return cb('not_allow');
                }
                var cond = {
                    company_id: req.decoded.company_id,
                    other_company_id: req.body.company_id,
                    other_user_id: req.body.user_id,
                    type: req.body.type
                };
                global.lib_work_relation.del(cond, cb);
            },
            function (count, cb) {
                var cond = {
                    user_id: req.body.user_id,
                    company_id: req.body.company_id,
                    other_company_id: req.decoded.company_id,
                    type: type
                };
                global.lib_work_relation.del(cond, cb);
            },
            function (count, cb) {
                if (!req.body.user_ids.length) {
                    global.lib_work_relation.add({
                        user_id: req.body.user_id,
                        company_id: req.body.company_id,
                        other_company_id: req.decoded.company_id,
                        type: type
                    }, cb);
                } else {
                    var arr = [];
                    for (var i = 0; i < req.body.user_ids.length; i++) {
                        var user_id = req.body.user_ids[i];
                        arr.push({
                            user_id: user_id,
                            company_id: req.decoded.company_id,
                            other_user_id: req.body.user_id,
                            other_company_id: req.body.company_id,
                            type: req.body.type
                        });
                        arr.push({
                            user_id: req.body.user_id,
                            company_id: req.body.company_id,
                            other_user_id: user_id,
                            other_company_id: req.decoded.company_id,
                            type: type
                        });
                    }
                    global.lib_work_relation.addList(arr, cb);
                }
            }
        ], function (err) {
            if (err) {
                return next(err);
            }
            global.config_common.sendData(req, {}, next);
        });
    });

    /**
     * 新替换员工
     * 参数:(1)user_id
     *      (2)phone
     *      (3)real_name
     */
    api.post('/replace', function (req, res, next) {
        //1，基本数据类型判断
        if (!req.body.user_id ||
            !global.config_common.checkPhone(req.body.phone) ||
            !req.body.real_name) {
            return next('invalid_format');
        }
        if (req.decoded.role !== global.config_common.user_roles.TRADE_ADMIN &&
            req.decoded.role !== global.config_common.user_roles.TRAFFIC_ADMIN) {
            return next('not_allow');
        }
        //2，走异步流程，将这个人的信息进行替换
        var userData1;
        var userData2;//1替换2
        async.waterfall([
            function (cb) {
                global.lib_user.getOneEasy({find: {_id: req.body.user_id}}, cb);
            },
            function (user, cb) {
                if (!user) {
                    return cb('user_not_found');
                }
                userData2 = user;
                //目前支持采购，销售，管理员
                if (userData2.role !== global.config_common.user_roles.TRADE_ADMIN &&
                    userData2.role !== global.config_common.user_roles.TRADE_SALE &&
                    userData2.role !== global.config_common.user_roles.TRADE_PURCHASE) {
                    return cb('not_open');
                }
                global.lib_user.getOne({find: {phone: req.body.phone}}, cb);
            },
            function (user, cb) {
                if (!user) {
                    //替换号码不存在创建角色
                    async.waterfall([
                        function (cbk) {
                            global.lib_verify_code.add({
                                phone: req.body.phone,
                                code: '111111',
                                type: "trade",
                                companyType: userData2.role.split('_')[0]
                            }, cbk);
                        },
                        function (code, count, cbk) {
                            global.lib_user.addUser({
                                phone: req.body.phone,
                                real_name: req.body.real_name
                            }, cbk);
                        },
                        function (user, count, cbk) {
                            global.lib_user.add({
                                user_id: user._id.toString(),
                                phone: req.body.phone,
                                role: userData2.role,
                                company_id: req.decoded.company_id,
                                real_name: req.body.real_name
                            }, cbk);
                        },
                        function (user, count, data, cbk) {
                            global.lib_invitation_user.signup(user, function () {
                            });
                            cbk(null, user);
                        }
                    ], cb);
                } else {
                    //判断已有角色可否替换，必须角色相同或者覆盖被替换人职能
                    if (user.role === userData2.role ||
                        (user.role === global.config_common.user_roles.TRADE_ADMIN && (
                            userData2.role === global.config_common.user_roles.TRADE_SALE ||
                            userData2.role === global.config_common.user_roles.TRADE_PURCHASE
                        ))) {
                        cb(null, user);
                    } else {
                        cb('role_not_match');
                    }
                }
            },
            function (user, cb) {
                userData1 = user;
                //复制被替换人的发布数据，把原数据替换成新人，复制出来的数据变更状态
                global.lib_http.sendTradeServer({
                    user_id_new: userData1._id.toString(),
                    user_id_old: userData2._id.toString()
                }, global.config_api_url.trade_server_copy_send_data, cb);
            },
            function (data, cb) {
                //更改订单人id
                global.lib_http.sendTradeServer({
                    user_id_new: userData1._id.toString(),
                    user_id_old: userData2._id.toString()
                }, global.config_api_url.trade_server_update_order_user_id, cb);
            },
            function (data, cb) {
                //更改参与人id
                global.lib_http.sendTradeServer({
                    user_id_new: userData1._id.toString(),
                    user_id_old: userData2._id.toString()
                }, global.config_api_url.trade_server_update_partake_user, cb);
            },
            //替换合作关系
            function (data, cb) {
                //替换自己的
                global.lib_work_relation.updateList({
                    find: {user_id: userData2._id.toString()},
                    set: {user_id: userData1._id.toString()}
                }, cb);
            },
            function (data, cb) {
                //替换别人的
                global.lib_work_relation.updateList({
                    find: {other_user_id: userData2._id.toString()},
                    set: {other_user_id: userData1._id.toString()}
                }, cb);
            },
            function (count, cb) {
                userData2.free = true;
                if (global.config_common.checkTradeCompanyByRole(userData2.role)) {
                    userData2.company_id = '';
                    userData2.role = global.config_common.user_roles.TRADE_ADMIN;
                } else {
                    userData2.company_id = [];
                    userData2.role = global.config_common.user_roles.TRAFFIC_ADMIN;
                }
                userData2.save(cb);
            }
        ], function (err) {
            if (err) {
                return next(err);
            }
            global.config_common.sendData(req, {}, next)
        });
    });

    /***
     * 删除个人之见的合作关系
     */
    api.post('/del_work_relation', function (req, res, next) {
        //1，基本数据类型判断
        if (!req.body.user_id) {
            return next('invalid_format');
        }
        var userData;
        //2，走异步流程，将这个人的信息进行替换
        async.waterfall([
            function (cb) {
                global.lib_work_relation.getOne({find: {user_id: req.body.user_id, other_user_id: req.decoded.id}}, cb);
            },
            function (workData, cb) {
                if (!workData) {
                    return cb('work_relation_not_found');
                }
                workData.remove(cb);
            },
            function (count, cb) {
                global.lib_relation_group.delGroupUser({user_id: req.body.user_id, member_id: req.decoded.id}, cb);
            },
            function (count, cb) {
                global.lib_work_relation.getOne({find: {user_id: req.decoded.id, other_user_id: req.body.user_id}}, cb);
            },
            function (workData, cb) {
                if (!workData) {
                    return cb('work_relation_not_found');
                }
                workData.remove(cb);
            },
            function (count, cb) {
                global.lib_relation_group.delGroupUser({user_id: req.decoded.id, member_id: req.body.user_id}, cb);
            },
            function (count, cb) {
                global.lib_apply_relation.getOne({
                    find: {
                        user_id: req.decoded.id,
                        other_user_id: req.body.user_id,
                        type: global.config_common.relation_style.WORK
                    }
                }, cb);
            },
            function (apply, cb) {
                if (apply) {
                    apply.remove();
                    cb(null, null);
                } else {
                    global.lib_apply_relation.getOne({
                        find: {
                            user_id: req.body.user_id,
                            other_user_id: req.decoded.id,
                            type: global.config_common.relation_style.WORK
                        }
                    }, cb);
                }
            },
            function (apply, cb) {
                if (apply) {
                    apply.remove();
                }
                cb();
            },
            // function (cb) {
            //     global.lib_user.getOne({find: {_id: req.body.user_id}}, cb);
            // },
            // function (user, cb) {
            //     userData = user;
            //     if (_.isArray(req.decoded.company_id)) {
            //         req.decoded.company_id = req.decoded.company_id[0];
            //     }
            //     if (_.isArray(userData.company_id)) {
            //         userData.company_id = userData.company_id[0];
            //     }
            //     //查询到双方的公司关系并删除
            //     global.lib_company_relation.getOne({
            //         find: {
            //             self_id: req.decoded.company_id,
            //             other_id: userData.company_id
            //         }
            //     }, cb);
            // },
            // function (data, cb) {
            //     if (data) {
            //         data.remove();
            //     }
            //     cb();
            // },
            // function (cb) {
            //     if (_.isArray(req.decoded.company_id)) {
            //         req.decoded.company_id = req.decoded.company_id[0];
            //     }
            //     if (_.isArray(userData.company_id)) {
            //         userData.company_id = userData.company_id[0];
            //     }
            //     //查询到双方的公司关系并删除
            //     global.lib_company_relation.getOne({
            //         find: {
            //             self_id: userData.company_id,
            //             other_id: req.decoded.company_id
            //         }
            //     }, cb);
            // },
            // function (data, cb) {
            //     if (data) {
            //         data.remove();
            //     }
            //     cb();
            // },
        ], function (err) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, {}, next)
        })
    });

    return api;
};
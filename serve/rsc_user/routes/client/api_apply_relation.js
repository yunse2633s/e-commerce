/**
 * Created by Administrator on 2017/6/21.
 */
//申请之间的关系
var async = require('async');
var _ = require('underscore');
var express = require('express');
var sdk_im_wangyiyunxin = require('../../sdks/im_wangyiyunxin/sdk_im_wangyiyunxin');
var config_common = require('../../configs/config_common');

module.exports = function () {

    var api = express.Router();

    /**
     * 功能：检查注册的手机号被多少人邀请过
     * 参数：phone
     */
    api.post('/exist_phone_invitation', function (req, res, next) {
        if (!req.body.phone) {
            return next('invalid_format');
        }
        global.lib_invitation_user.getCount({phone: req.body.phone}, function (err, count) {
            config_common.sendData(req, {count: count}, next);
        });
    });

    api.use(require('../../middlewares/mid_verify_user')());

    /**
     * 功能:根据type类型筛选加好友的类型的相关数据
     * 参数:??
     */
    api.post('/get_trade_friend', function (req, res, next) {
        async.parallel({
            sale: function (cb) {
                global.lib_apply_relation.getCount({
                    extend: 'purchase',
                    user_id: req.decoded.id,
                    type: "FRIEND",
                    status: "WAIT"
                }, cb)
            },
            purchase: function (cb) {
                global.lib_apply_relation.getCount({
                    extend: {$nin: ['purchase', 'trade']},
                    user_id: req.decoded.id,
                    type: "FRIEND",
                    status: "WAIT"
                }, cb)
            },
            traffic: function (cb) {
                global.lib_apply_relation.getCount({
                    extend: {$in: ['trade', 'traffic']},
                    user_id: req.decoded.id,
                    type: "FRIEND",
                    status: "WAIT"
                }, cb)
            }
        }, function (err, result) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, result, next);
        })
    });

    /**
     * 功能:根据type类型筛选加好友的类型的相关数据
     * 参数:??
     */
    api.post('/get_traffic_friend', function (req, res, next) {
        async.parallel({
            trade: function (cb) {
                global.lib_apply_relation.getCount({
                    friend_extend: 'traffic',
                    user_id: req.decoded.id,
                    type: "FRIEND",
                    status: "WAIT"
                }, cb)
            },
            driver: function (cb) {
                global.lib_apply_relation.getCount({
                    extend: 'TRAFFIC_ADMIN',
                    user_id: req.decoded.id,
                    type: "FRIEND",
                    status: "WAIT"
                }, cb)
            }
        }, function (err, result) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, result, next);
        })
    });

    /**
     * 功能:根据type类型筛选加好友的类型的相关数据
     * 参数:??
     */
    api.post('/get_driver_friend', function (req, res, next) {
        async.parallel({
            friend: function (cb) {
                global.lib_apply_relation.getCount({
                    user_id: req.decoded.id,
                    type: "FRIEND",
                    status: "WAIT"
                }, cb)
            }
        }, function (err, result) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, result, next);
        })
    });

    //得到申请消息个数
    api.post('/get_count', function (req, res, next) {
        var result = {};
        async.waterfall([
            function (cb) {
                global.lib_tip.getOne({
                    find: {
                        user_id: req.decoded.id,
                        type: global.config_common.tip_type.linkman
                    }
                }, cb);
            },
            function (tip, cb) {
                var cond = {
                    user_id: req.decoded.id,
                    status: global.config_common.relation_status.WAIT
                };
                if (tip) {
                    cond.time_creation = {$gt: tip.update_time};
                }
                global.lib_apply_relation.getCount(cond, cb);
            },
            function (count, cb) {
                result.count = count;
                global.lib_apply_relation.getList({
                    find: {
                        user_id: req.decoded.id
                        // status: global.config_common.relation_status.WAIT
                    },
                    sort: {time_creation: -1},
                    limit: 1
                }, cb);
            },
            function (relations, cb) {
                if (relations[0]) {
                    result.relation = relations[0];
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

    /**
     * 功能:获取(1)收到的申请(2)已发起的申请(3)来访者;最新的一条信息
     * tip表新增参数type:receive别人向自己发起的申请，launch自己向别人发起的申请，visitot来访者
     */
    api.post('/invite_info', function (req, res, next) {
        async.parallel({
            receive: function (cb) {
                var result = {};
                async.waterfall([
                    function (cbk) {
                        global.lib_tip.getOne({
                            find: {user_id: req.decoded.id, type: 'receive'}
                        }, cbk);
                    },
                    function (tip, cbk) {
                        var cond = {
                            user_id: req.decoded.id,
                            status: global.config_common.relation_status.WAIT,
                            type: {$ne: 'VISITOR'},
                        };
                        if (tip) {
                            cond.time_creation = {$gt: tip.update_time};
                        }
                        global.lib_apply_relation.getCount(cond, cbk);
                    },
                    function (count, cbk) {
                        result.count = count;
                        global.lib_apply_relation.getList({
                            find: {
                                user_id: req.decoded.id,
                                type: {$ne: 'VISITOR'},
                            },
                            sort: {time_creation: -1},
                            limit: 1
                        }, cbk);
                    },
                    function (relations, cbk) {
                        if (relations[0]) {
                            result.relation = relations[0];
                            global.lib_user.getOneEasy({find: {_id: result.relation.other_user_id}}, cbk);
                        } else {
                            cbk(null, null);
                        }
                    },
                    function (data, cbk) {
                        if (data) {
                            result.real_name = data.real_name
                        } else {
                            //result.real_name = '';
                        }
                        cbk(null, result);
                    }
                ], cb);
            },
            launch: function (cb) {
                var result = {};
                async.waterfall([
                    function (cbk) {
                        global.lib_tip.getOne({
                            find: {user_id: req.decoded.id, type: 'launch'}
                        }, cbk);
                    },
                    function (tip, cbk) {
                        var cond = {
                            other_user_id: req.decoded.id,
                            status: global.config_common.relation_status.WAIT,
                            type: {$ne: 'VISITOR'},
                        };
                        if (tip) {
                            cond.time_creation = {$gt: tip.update_time};
                        }
                        global.lib_apply_relation.getCount(cond, cbk);
                    },
                    function (count, cbk) {
                        result.count = count;
                        global.lib_apply_relation.getList({
                            find: {
                                other_user_id: req.decoded.id,
                                type: {$ne: 'VISITOR'},
                            },
                            sort: {time_creation: -1},
                            limit: 1
                        }, cbk);
                    },
                    function (relations, cbk) {
                        if (relations[0]) {
                            result.relation = relations[0];
                            global.lib_user.getOneEasy({find: {_id: result.relation.user_id}}, cbk);
                        } else {
                            cbk(null, null);
                        }
                    },
                    function (data, cbk) {
                        if (data) {
                            result.real_name = data.real_name
                        } else {
                            //result.real_name = '';
                        }
                        cbk(null, result);
                    }
                ], cb);
            },
            visitor: function (cb) {
                var result = {};
                async.waterfall([
                    function (cbk) {
                        global.lib_tip.getOne({
                            find: {user_id: req.decoded.id, type: 'visitor'}
                        }, cbk);
                    },
                    function (tip, cbk) {
                        var cond = {
                            user_id: req.decoded.id,
                            status: global.config_common.relation_status.WAIT,
                            type: 'VISITOR',
                        };
                        if (tip) {
                            cond.time_creation = {$gt: tip.update_time};
                        }
                        global.lib_apply_relation.getCount(cond, cbk);
                    },
                    function (count, cbk) {
                        result.count = count;
                        global.lib_apply_relation.getList({
                            find: {
                                user_id: req.decoded.id,
                                type: 'VISITOR',
                            },
                            sort: {time_creation: -1},
                            limit: 1
                        }, cbk);
                    },
                    function (relations, cbk) {
                        if (relations[0]) {
                            result.relation = relations[0];
                            global.lib_user.getOneEasy({find: {_id: result.relation.other_user_id}}, cbk);
                        } else {
                            cbk(null, null);
                        }
                    },
                    function (data, cbk) {
                        if (data) {
                            result.real_name = data.real_name
                        } else {
                            //result.real_name = '';
                        }
                        cbk(null, result);
                    }
                ], cb);
            }
        }, function (err, result) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, result, next);
        })
    });

    //得到申请消息列表
    api.post('/get_list', function (req, res, next) {
        if (!req.body.page) {
            req.body.page = 1;
        }
        var cond = {
            user_id: req.decoded.id
        };
        var relationDatas;
        var userDatas;
        var result = {};
        async.waterfall([
            function (cb) {
                global.lib_tip.getOne({
                    find: {
                        user_id: req.decoded.id,
                        type: 'receive'
                    }
                }, cb);
            },
            function (tip, cb) {
                if (tip) {
                    tip.update_time = new Date();
                    tip.save(cb);
                } else {
                    global.lib_tip.add({
                        user_id: req.decoded.id,
                        type: 'receive',
                        update_time: new Date()
                    }, cb);
                }
            },
            function (content, count, cb) {
                global.lib_apply_relation.getCount(cond, cb);
            },
            function (count, cb) {
                result.count = count;
                result.exist = count > req.body.page * global.config_common.entry_per_page;
                global.lib_apply_relation.getList({find: cond, sort: {time_creation: -1}}, cb);
                // global.lib_apply_relation.getList({
                //     find: cond,
                //     sort: {time_creation: -1},
                //     skip: (req.body.page - 1) * global.config_common.entry_per_page,
                //     limit: global.config_common.entry_per_page
                // }, cb);
            },
            function (relations, cb) {
                relationDatas = relations;
                var user_ids = global.lib_util.transObjArrToSigArr(relations, 'other_user_id');
                global.lib_user.getListAll({
                    find: {_id: {$in: user_ids}},
                    select: 'real_name photo_url role'
                }, cb);
            },
            function (users, cb) {
                userDatas = users;
                var company_ids = global.lib_util.transObjArrToSigArr(relationDatas, 'other_company_id');
                var arr = [];
                //增加循环方法，司机部分会存多个公司信息，将这些信息遍历整理出来
                for (var i = 0; i < company_ids.length; i++) {
                    if (company_ids[i].length !== 24) {
                        var arr2 = company_ids[i].split(",")
                        for (var j = 0; j < arr2.length; j++) {
                            arr.push(arr2[j])
                        }
                        company_ids.splice(i, 1);
                        i = i - 1;
                    }
                }
                for (var i = 0; i < arr.length; i++) {
                    company_ids.push(arr[i]);
                }
                global.lib_company.getList({find: {_id: {$in: company_ids}}, select: 'nick_name verify_phase'}, cb);

            },
            function (companies, cb) {
                var result = [];
                var companyObj = global.lib_util.transObjArrToObj(companies, '_id');
                var userObj = global.lib_util.transObjArrToObj(userDatas, '_id');
                for (var i = 0; i < relationDatas.length; i++) {
                    var relation = relationDatas[i];
                    result.push({
                        company: companyObj[relation.other_company_id],
                        user: userObj[relation.other_user_id],
                        relation: relation
                    });
                }
                cb(null, result);
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            if (!req.decoded.admin_id) {
                global.lib_tip.edit({
                    find: {user_id: req.decoded.id, type: global.config_common.tip_type.linkman},
                    options: {upsert: true},
                    set: {user_id: req.decoded.id, type: global.config_common.tip_type.linkman, update_time: new Date()}
                }, function () {
                });
            }
            //临时容错处理，纠正交易添加物流好友错误
            result = _.map(result, function (num) {
                if ((req.decoded.role === global.config_common.user_roles.TRADE_ADMIN ||
                        req.decoded.role === global.config_common.user_roles.TRADE_PURCHASE ||
                        req.decoded.role === global.config_common.user_roles.TRADE_SALE) &&
                    (num.user.role === global.config_common.user_roles.TRAFFIC_ADMIN ||
                        num.user.role === global.config_common.user_roles.TRAFFIC_EMPLOYEE ||
                        num.user.role === global.config_common.user_roles.TRAFFIC_CAPTAIN)) {
                    num =JSON.parse(JSON.stringify(num));
                    num.relation.friend_extend = 'traffic';
                }
                return num;
            });
            global.config_common.sendData(req, result, next);
        });
    });

    //得到申请消息列表
    api.post('/get_list_self', function (req, res, next) {
        if (!req.body.page) {
            req.body.page = 1;
        }
        var cond = {
            other_user_id: req.decoded.id,
            status: {$ne: 'SUCCESS'},
            type: {$ne: "VISITOR"}
        };
        var relationDatas;
        var userDatas;
        var result = {};
        async.waterfall([
            function (cb) {
                global.lib_tip.getOne({
                    find: {
                        user_id: req.decoded.id,
                        type: 'launch'
                    }
                }, cb);
            },
            function (tip, cb) {
                if (tip) {
                    tip.update_time = new Date();
                    tip.save(cb);
                } else {
                    global.lib_tip.add({
                        user_id: req.decoded.id,
                        type: 'launch',
                        update_time: new Date()
                    }, cb);
                }
            },
            function (content, count, cb) {
                global.lib_apply_relation.getCount(cond, cb);
            },
            function (count, cb) {
                result.count = count;
                result.exist = count > req.body.page * global.config_common.entry_per_page;
                global.lib_apply_relation.getList({find: cond, sort: {time_creation: -1}}, cb);
            },
            function (relations, cb) {
                relationDatas = relations;
                var user_ids = global.lib_util.transObjArrToSigArr(relations, 'user_id');
                global.lib_user.getListAll({find: {_id: {$in: user_ids}}, select: 'real_name photo_url role'}, cb);
            },
            function (users, cb) {
                userDatas = users;
                var company_ids = global.lib_util.transObjArrToSigArr(relationDatas, 'company_id');
                var arr = [];
                //增加循环方法，司机部分会存多个公司信息，将这些信息遍历整理出来
                for (var i = 0; i < company_ids.length; i++) {
                    if (company_ids[i].length !== 24) {
                        var arr2 = company_ids[i].split(",");
                        for (var j = 0; j < arr2.length; j++) {
                            arr.push(arr2[j]);
                        }
                        company_ids.splice(i, 1);
                        i = i - 1;
                    }
                }
                for (var i = 0; i < arr.length; i++) {
                    company_ids.push(arr[i]);
                }
                global.lib_company.getList({find: {_id: {$in: company_ids}}, select: 'nick_name verify_phase'}, cb);

            },
            function (companies, cb) {
                var result = [];
                var companyObj = global.lib_util.transObjArrToObj(companies, '_id');
                var userObj = global.lib_util.transObjArrToObj(userDatas, '_id');
                for (var i = 0; i < relationDatas.length; i++) {
                    var relation = relationDatas[i];
                    result.push({
                        company: companyObj[relation.company_id],
                        user: userObj[relation.user_id],
                        relation: relation
                    });
                }
                cb(null, result);
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            // global.lib_tip.edit({
            //     find: {user_id: req.decoded.id, type: global.config_common.tip_type.linkman},
            //     options: {upsert: true},
            //     set: {user_id: req.decoded.id, type: global.config_common.tip_type.linkman, update_time: new Date()}
            // }, function () {
            //
            // });
            global.config_common.sendData(req, result, next);
        });
    });

    //申请加入公司
    api.post('/company_supply', function (req, res, next) {
        if (!req.body.company_id) {
            // !global.config_common.user_roles[req.body.role]
            return next('invalid_format');
        }
        var role;
        var companyData;
        var userData;
        var count;
        async.waterfall([
            //在发送这个公司申请的时候就查询这个人是不是已经申请了一家公司 --开始
            function (cb) {
                //     global.lib_apply_relation.getOne({
                //         find: {
                //             other_user_id: req.decoded.id,
                //             type: "COMPANY_SUPPLY",
                //             status: global.config_common.relation_status.WAIT
                //         }
                //     }, cb);
                // },
                // function (status, cb) {
                //     if (status) {
                //         return cb('company_supply_have_one');
                //     }
                //在发送这个公司申请的时候就查询这个人是不是已经申请了一家公司 --结束
                global.lib_user.getList({find: {company_id: req.body.company_id}}, cb);
            },
            function (users, cb) {
                count = users.length;
                //查人
                global.lib_user.getOne({find: {_id: req.decoded.id}}, cb);
            },
            function (user, cb) {
                userData = user;
                //find：查询条件
                global.lib_company.getOne({find: {_id: req.body.company_id}}, cb);
            },
            function (company, cb) {
                //判断公司存不存在
                if (!company) {
                    return cb('company_not_found');
                }
                //判断vip公司人数限制
                if (company.type === config_common.company_category.TRADE) {
                    if (company.vip) {
                        if (count >= global.config_common.vip_count.vip) {
                            return cb('人数达到上限')
                        }
                    } else {
                        if (count >= global.config_common.vip_count.no_vip) {
                            return cb('人数达到上限')
                        }
                    }
                }
                //判断认证状态
                // if (company.verify_phase !== global.config_common.verification_phase.SUCCESS) {
                //     return cb('not_allow');
                // }
                //保存数据(保存公司的_id)
                companyData = company;
                //如果公司是 交易公司 ，别人向我身亲
                // if(company.type == global.config_common.company_category.TRADE &&
                //     (!global.config_common.checkTradeCompanyByRole(req.body.role))){
                //     return cb('not_allow');
                // }
                //关于物流
                // if(company.type == global.config_common.company_category.TRAFFIC &&
                //     (!global.config_common.checkTrafficCompanyByRole(req.body.role))){
                //     return cb('not_allow');
                // }
                if (global.config_common.checkUserCompany(userData)) {
                    global.lib_company.getOne({find: {_id: userData.company_id}}, cb);
                } else {
                    cb(null, {});
                }
            },
            function (company, cb) {
                global.lib_http.sendTradeServer({
                    method: 'getCount',
                    cond: {
                        status: {$ne: 'complete'},
                        '$or': [{user_demand_id: req.decoded.id}, {user_supply_id: req.decoded.id}]
                    },
                    model: 'DemandOrder'
                }, global.config_api_url.server_common_get, function (err, tradeCount) {
                    if (err) {
                        return cb(err);
                    }
                    if (tradeCount) {
                        return cb('您的订单还有未完成');
                    }
                    global.lib_http.sendTrafficServer({
                        method: 'getCount',
                        cond: {
                            status: {$ne: 'complete'},
                            '$or': [{demand_user_id: req.decoded.id}, {supply_user_id: req.decoded.id}]
                        },
                        model: 'TrafficOrder'
                    }, global.config_api_url.server_common_get, function (err, trafficCount) {
                        if (err) {
                            return cb(err);
                        }
                        if (trafficCount) {
                            return cb('您的订单还有未完成');
                        }
                        cb(null, company);
                    });
                });
            },
            function (company, cb) {
                //检查自己是否可以申请加入其它公司
                if (!global.config_common.checkUserCanJoinCompany(userData, company)) {
                    return cb('please_replace_yourself');
                }
                //查询条件
                var cond = {company_id: req.body.company_id};
                //向自己申请的那家公司所有管理发送申请 ->交易查超管，物流查
                if (companyData.type === global.config_common.company_category.TRADE) {
                    //交易公司的超管
                    cond.role = global.config_common.user_roles.TRADE_ADMIN;
                } else if (companyData.type === global.config_common.company_category.STORE) {
                    //交易公司的超管
                    cond.role = global.config_common.user_roles.TRADE_STORAGE;
                } else {
                    //物流公司的物流管理员
                    cond.role = global.config_common.user_roles.TRAFFIC_ADMIN;
                }
                //查找到这些人都是谁
                global.lib_user.getList({find: cond, select: '_id'}, cb);
            },
            function (users, cb) {
                //分别给管理发申请
                var user_ids = global.lib_util.transObjArrToSigArr(users, '_id');
                //申请加入公司的推送
                global.lib_http.sendMsgServerNoToken({
                    title: '互联网+',
                    user_ids: JSON.stringify(user_ids),
                    content: '' + req.decoded.user_name + '向您申请加入企业，请点击查看',
                    data: JSON.stringify({
                        params: {id: req.decoded.id, type: "rsc.new_relation"},
                        url: 'rsc.new_relation'
                    })
                }, global.config_api_url.msg_server_push);
                async.each(user_ids, function (user_id, callback) {
                    var data = {
                        user_id: user_id,
                        company_id: req.body.company_id,
                        other_user_id: req.decoded.id,
                        type: global.config_common.relation_style.COMPANY_SUPPLY,              //好友、公司、合作
                        status: global.config_common.relation_status.WAIT               //同意、拒绝
                    };
                    if (userData.role === global.config_common.user_roles.TRAFFIC_DRIVER_PRIVATE ||
                        userData.role === global.config_common.user_roles.TRAFFIC_ADMIN ||
                        userData.role === global.config_common.user_roles.TRADE_STORAGE) {
                        data.extend = userData.role;
                    }
                    if (req.body.role) {
                        data.extend = req.body.role;
                    }
                    global.lib_apply_relation.add(data, callback);
                }, cb);
            }
        ], function (err) {
            if (err) {
                return next(err);
            }
            global.config_common.sendData(req, {}, next);
        });
    });

    //删除公司申请
    api.post('/del_company_supply', function (req, res, next) {
        if (!req.body.company_id) {
            return next('invalid_format');
        }
        async.waterfall([
            function (cb) {
                global.lib_apply_relation.getList({
                    find: {
                        other_user_id: req.decoded.id,
                        status: global.config_common.relation_status.WAIT,
                        type: global.config_common.relation_style.COMPANY_INVITE,
                        company_id: req.body.company_id
                    }
                }, cb);
            },
            function (data, cb) {
                var ids = _.pluck(data, '_id');
                if (ids.length != 0) {
                    global.lib_apply_relation.del({_id: {$in: ids}}, cb);
                } else {
                    return cb('company_not_found');
                }
            }
        ], function (err, count) {
            if (err) {
                return next(err);
            }
            global.config_common.sendData(req, {}, next);
        });
    });


    //邀请，公司和好友
    api.post('/invite', function (req, res, next) {
        if (!_.isArray(req.body.users)) {
            req.body.users = JSON.parse(req.body.users);
        }
        if (!_.isArray(req.body.users) ||
            (req.body.type !== global.config_common.relation_style.FRIEND &&
                req.body.type !== global.config_common.relation_style.COMPANY_INVITE)) {
            return next('invalid_format');
        }
        var userData;
        var photoUrls = [];
        var count;
        var company;
        var inviteData1 = []; //应为这结构太长，怕下面有相同参数，所以加1
        var invite_ids;
        var invite_lixian_data;
        var users_data = [];
        var hanZi;
        var selfData01 = {};
        async.waterfall([
            function (cb) {
                //获取邀请列表
                global.lib_user_relation.getList({
                    find: {user_id: req.decoded.id, type: global.config_common.relation_style.FRIEND},
                    select: 'other_id'
                }, cb);
            },
            function (invite, cb) {
                //这是查询到的他的好友的_id数组
                invite_ids = _.pluck(invite, 'other_id');
                //查公司人数
                global.lib_user.getList({
                    find: {company_id: req.decoded.company_id.toString()}
                }, cb);
            },
            function (user, cb) {
                count = user.length;
                if (req.decoded.company_id) {
                    //查到这家公司
                    global.lib_company.getOne({
                        find: {_id: req.decoded.company_id}
                    }, cb);
                } else {
                    cb(null, null);
                }
            },
            function (companydata, cb) {
                company = companydata;
                //查到此人的账号信息
                global.lib_user.getOne({
                    find: {_id: req.decoded.id}
                }, cb);
            },
            function (user, cb) {
                selfData01.user = user;
                userData = user;
                //先判断是否为公司邀请，然后再判断
                if (req.body.type === global.config_common.relation_style.COMPANY_INVITE) {
                    //判断这个人的公司是否存在
                    if (!global.config_common.checkUserCompany(user)) {
                        return cb('not_allow');
                    }
                    //判断vip公司人数限制
                    if (company) {
                        if (company.type == config_common.company_category.TRADE) {
                            if (company.vip) {
                                if (count >= global.config_common.vip_count.vip) {
                                    return cb('人数达到上限');
                                }
                            } else {
                                if (count >= global.config_common.vip_count.no_vip) {
                                    return cb('人数达到上限');
                                }
                            }
                        }
                    }
                }
                req.decoded.company_id = user.company_id;
                if (req.body.type === global.config_common.relation_style.COMPANY_INVITE) {
                    if (user.role === global.config_common.user_roles.TRADE_ADMIN) {
                        if (req.body.role !== global.config_common.user_roles.TRADE_ADMIN &&
                            req.body.role !== global.config_common.user_roles.TRADE_PURCHASE &&
                            req.body.role !== global.config_common.user_roles.TRADE_SALE &&
                            req.body.role !== global.config_common.user_roles.TRADE_STORAGE) {
                            return cb('invalid_format');
                        }
                    }
                    if (user.role === global.config_common.user_roles.TRAFFIC_DRIVER_PRIVATE) {
                        if (req.body.role !== global.config_common.user_roles.TRAFFIC_DRIVER_PRIVATE) {
                            return cb('invalid_format');
                        }
                    }
                    if (user.role === global.config_common.user_roles.TRAFFIC_ADMIN) {
                        if (req.body.role !== global.config_common.user_roles.TRAFFIC_ADMIN &&
                            req.body.role !== global.config_common.user_roles.TRADE_STORAGE &&
                            req.body.role !== global.config_common.user_roles.TRAFFIC_DRIVER_PRIVATE) {
                            return cb('invalid_format');
                        }
                    }
                }
                cb();
            },
            function (cb) {
                global.lib_http.sendTradeServer({
                    method: 'getList',
                    cond: {find: {lev: 0}},
                    model: 'Classify'
                }, global.config_api_url.trade_server_get_hanzi, cb);
            },
            function (hanzi, cb) {
                hanZi = global.lib_util.transObjArrToObj(hanzi, 'eng');
                //遍历邀请人数
                async.eachSeries(req.body.users, function (invite, callback) {
                    //检查邀请的手机号是否有效
                    if (!global.config_common.checkPhone(invite.phone)) {
                        return callback();
                    }
                    async.waterfall([
                        function (cbk) {
                            invite_lixian_data = invite;
                            global.lib_user.getListAll({
                                find: {
                                    _id: {$ne: req.decoded.id},
                                    phone: invite.phone,
                                    source: {$ne: "remark"}
                                }
                            }, cbk);
                        },
                        function (users, cbk) {
                            var data = {type: req.body.type};
                            if (req.body.group_id && global.config_common.relation_group_type[req.body.group_type]) {
                                data.group_type = global.config_common.relation_group_type[req.body.group_type];
                                data.group_id = req.body.group_id;
                            }
                            //在线用户
                            if (users.length) {
                                async.eachSeries(users, function (user, cbk02) {
                                    users_data.push(user);
                                    //将用户头像图片地址进行收集
                                    photoUrls.push(user.photo_url);
                                    //将用户的信息收集
                                    var obj_data1 = {};
                                    if (_.indexOf(invite_ids, user) !== -1) {
                                        obj_data1 = {_id: user._id, phone: user.phone, friend: true}
                                        //inviteData1.push({_id: user._id, phone: user.phone, friend: true});
                                    }
                                    obj_data1.reg = true;
                                    inviteData1.push(obj_data1);
                                    //判断用户类型，跳转不同页面；
                                    var role;
                                    if (global.config_common.checkTradeCompanyByRole(user.role)) {
                                        role = 'rsc.new_relation';
                                    } else {
                                        role = 'rsc.new_relation';
                                    }
                                    if (req.body.type === global.config_common.relation_style.FRIEND) {
                                        data.user_id = user._id.toString();             //自己id
                                        data.other_user_id = req.decoded.id;            //对方id
                                        if (global.config_common.checkUserCompany(userData) && userData.role !== global.config_common.user_roles.TRAFFIC_DRIVER_PRIVATE) {
                                            global.lib_company.getOne({
                                                find: {_id: userData.company_id},
                                                select: 'nick_name'
                                            }, function (err, company) {
                                                if (!err && company) {
                                                    global.lib_http.sendMsgServerNoToken({
                                                        title: '互联网+',
                                                        user_ids: JSON.stringify([user._id.toString()]),
                                                        content: '' + company.nick_name + '' + userData.real_name + '向您申请成为好友，请点击查看',
                                                        data: JSON.stringify({
                                                            params: {
                                                                id: req.decoded.id,
                                                                type: "rsc.new_relation"
                                                            }, url: role
                                                        })
                                                    }, global.config_api_url.msg_server_push);
                                                }
                                            });
                                        } else {
                                            global.lib_http.sendMsgServerNoToken({
                                                title: '互联网+',
                                                user_ids: JSON.stringify([user._id.toString()]),
                                                content: '' + '' + userData.real_name + '向您申请成为好友，请点击查看',
                                                data: JSON.stringify({
                                                    params: {
                                                        id: req.decoded.id,
                                                        type: "rsc.new_relation"
                                                    }, url: role
                                                })
                                            }, global.config_api_url.msg_server_push);
                                        }
                                        data.extend = req.body.role;
                                        global.lib_apply_relation.add(data, function (err) {
                                            if (err) {
                                                return cbk(err);
                                            }
                                            cbk02();
                                        });
                                    } else {
                                        if ((global.config_common.checkTradeCompanyByRole(userData.role) &&
                                                global.config_common.checkTradeCompanyByRole(user.role) &&
                                                !global.config_common.checkUserCompany(user)) ||
                                            (global.config_common.checkTrafficCompanyByRole(userData.role) &&
                                                user.role === global.config_common.user_roles.TRAFFIC_ADMIN &&
                                                !global.config_common.checkUserCompany(user)) ||
                                            (global.config_common.checkTrafficCompanyByRole(userData.role) &&
                                                user.role === global.config_common.user_roles.TRAFFIC_DRIVER_PRIVATE) ||
                                            (user.role === global.config_common.user_roles.TRADE_STORAGE &&
                                                userData.role === global.config_common.user_roles.TRAFFIC_ADMIN)) {
                                            data.user_id = user._id.toString();             //自己id
                                            data.other_user_id = req.decoded.id;            //对方id
                                            data.other_company_id = req.decoded.company_id; //对方公司id
                                            data.extend = req.body.role;                    //根据type扩展此字段内容
                                            global.lib_company.getOne({
                                                find: {_id: userData.company_id},
                                                select: 'nick_name'
                                            }, function (err, company) {
                                                if (!err && company) {
                                                    global.lib_http.sendMsgServerNoToken({
                                                        title: '互联网+',
                                                        user_ids: JSON.stringify([user._id.toString()]),
                                                        content: '' + company.nick_name + '' + userData.real_name + '邀请您成为同事-' + global.config_common.user_roles_chn[req.body.role] + '，请点击查看',
                                                        data: JSON.stringify({
                                                            params: {
                                                                id: req.decoded.id,
                                                                type: "rsc.new_relation"
                                                            }, url: role
                                                        })
                                                    }, global.config_api_url.msg_server_push);
                                                }
                                            });
                                            global.lib_apply_relation.add(data, function (err) {
                                                if (err) {
                                                    return cbk(err);
                                                }
                                                cbk02();
                                            });
                                        } else {
                                            cbk02();
                                        }
                                    }
                                    global.lib_http.sendMsgServerNoToken({
                                        from: req.decoded.id,
                                        to: user._id.toString(),
                                        type: global.config_common.socket_push.new_relation,
                                        value: 1
                                    }, global.config_api_url.msg_server_socket_push);
                                }, cbk);
                            } else {
                                //离线用户：这里是发送短信
                                inviteData1.push({phone: invite.phone, friend: false, res: false}); //增加字段判断上线与好友关系
                                //（1）给好友发送短信
                                if (req.body.type === global.config_common.relation_style.FRIEND) {
                                    //判断此人是否拥有公司（交易、物流）
                                    var conpanyPanDuan = false;
                                    if (_.isArray(req.body.company_id)) {
                                        if (req.body.company_id.length) {
                                            conpanyPanDuan = true;
                                        }
                                    } else {
                                        if (req.body.company_id) {
                                            conpanyPanDuan = true;
                                        }
                                    }
                                    if (conpanyPanDuan) {
                                        if (global.config_common.checkTradeCompanyByRole(req.decoded.role)) {
                                            data.phone = invite.phone;
                                            data.real_name = invite.real_name;
                                            data.user_id = req.decoded.id;
                                            if (_.size(userData.sell) && !_.size(userData.buy)) {
                                                async.waterfall([
                                                    function (cb) {
                                                        var arrSell = _.map(userData.sell, function (num) {
                                                            return hanZi[num].chn;
                                                        }).join("-");
                                                        global.lib_http.sendMsgServerSMS1(req, 'GBK', {
                                                            template_id: 'invite_friend_company_sell',
                                                            content: [invite_lixian_data.real_name, req.decoded.company_name, req.decoded.user_name, arrSell],
                                                            phone_list: [invite.phone]
                                                        });
                                                    }
                                                ], function (err) {
                                                    if (err) {
                                                        return next(err);
                                                    }
                                                });
                                            } else if (!_.size(userData.sell) && _.size(userData.buy)) {
                                                async.waterfall([
                                                    function (cb) {
                                                        var arrBuy = _.map(userData.buy, function (num) {
                                                            return hanZi[num].chn;
                                                        }).join("-");
                                                        global.lib_http.sendMsgServerSMS1(req, 'GBK', {
                                                            template_id: 'invite_friend_company_buy',
                                                            content: [invite_lixian_data.real_name, req.decoded.company_name, req.decoded.user_name, arrBuy],
                                                            phone_list: [invite.phone]
                                                        });
                                                    }
                                                ], function (err) {
                                                    if (err) {
                                                        return next(err);
                                                    }
                                                })
                                            } else if (_.size(userData.sell) && _.size(userData.buy)) {
                                                async.waterfall([
                                                    function (cb) {
                                                        var arrSell = _.map(userData.sell, function (num) {
                                                            return hanZi[num].chn;
                                                        }).join("-");
                                                        var arrBuy = _.map(userData.buy, function (num) {
                                                            return hanZi[num].chn;
                                                        }).join("-");
                                                        global.lib_http.sendMsgServerSMS1(req, 'GBK', {
                                                            template_id: 'invite_friend_company_all',
                                                            content: [req.decoded.company_name, arrSell, arrBuy],
                                                            phone_list: [invite.phone]
                                                        });
                                                    }
                                                ], function (err) {
                                                    if (err) {
                                                        return next(err);
                                                    }
                                                });
                                            }
                                        } else if (req.decoded.role === global.config_common.user_roles.TRAFFIC_ADMIN) {
                                            data.phone = invite.phone;
                                            data.real_name = invite.real_name;
                                            data.user_id = req.decoded.id;
                                            async.waterfall([
                                                function (cb) {
                                                    var transport = _.map(userData.transport, function (num) {
                                                        return hanZi[num].chn;
                                                    }).join("-");
                                                    global.lib_http.sendMsgServerSMS1(req, 'GBK', {
                                                        template_id: 'invite_friend_company_traffic',
                                                        content: [req.decoded.company_name, transport],
                                                        phone_list: [invite.phone]
                                                    });

                                                }
                                            ], function (err) {
                                                if (err) {
                                                    return next(err);
                                                }
                                            });
                                        } else {
                                            data.phone = invite.phone;
                                            data.real_name = invite.real_name;
                                            data.user_id = req.decoded.id;
                                            async.waterfall([
                                                function (cb) {
                                                    global.lib_http.sendMsgServerSMS1(req, 'GBK', {
                                                        template_id: 'invite_friend',
                                                        content: [req.decoded.user_name],
                                                        phone_list: [invite.phone]
                                                    });
                                                }
                                            ], function (err) {
                                                if (err) {
                                                    return next(err);
                                                }
                                            });
                                        }
                                    } else {
                                        //这里是个人
                                        if (_.size(userData.sell) && !_.size(userData.buy)) {
                                            data.phone = invite.phone;
                                            data.real_name = invite.real_name;
                                            data.user_id = req.decoded.id;
                                            async.waterfall([
                                                function (cb) {
                                                    var arrSell = _.map(userData.sell, function (num) {
                                                        return hanZi[num].chn;
                                                    }).join("-");
                                                    global.lib_http.sendMsgServerSMS1(req, 'GBK', {
                                                        template_id: 'invite_friend_sell',
                                                        content: [req.decoded.user_name, arrSell],
                                                        phone_list: [invite.phone]
                                                    });

                                                }
                                            ], function (err) {
                                                if (err) {
                                                    return next(err);
                                                }
                                            });
                                        } else if (!_.size(userData.sell) && _.size(userData.buy)) {
                                            data.phone = invite.phone;
                                            data.real_name = invite.real_name;
                                            data.user_id = req.decoded.id;
                                            async.waterfall([
                                                function (cb) {
                                                    var arrBuy = _.map(userData.buy, function (num) {
                                                        return hanZi[num].chn;
                                                    }).join("-");
                                                    global.lib_http.sendMsgServerSMS1(req, 'GBK', {
                                                        template_id: 'invite_friend_buy',
                                                        content: [req.decoded.user_name, arrBuy],
                                                        phone_list: [invite.phone]
                                                    });
                                                }
                                            ], function (err) {
                                                if (err) {
                                                    return next(err);
                                                }
                                            });
                                        } else if (_.size(userData.sell) && _.size(userData.buy)) {
                                            data.phone = invite.phone;
                                            data.real_name = invite.real_name;
                                            data.user_id = req.decoded.id;
                                            async.waterfall([
                                                function (cb) {
                                                    var arrSell = _.map(userData.sell, function (num) {
                                                        return hanZi[num].chn;
                                                    }).join("-");
                                                    var arrBuy = _.map(userData.buy, function (num) {
                                                        return hanZi[num].chn;
                                                    }).join("-");
                                                    global.lib_http.sendMsgServerSMS1(req, 'GBK', {
                                                        template_id: 'invite_friend_all',
                                                        content: [req.decoded.user_name, arrSell, arrBuy],
                                                        phone_list: [invite.phone]
                                                    });
                                                }
                                            ], function (err) {
                                                if (err) {
                                                    return next(err);
                                                }
                                            });
                                        } else if (req.decoded.role === global.config_common.user_roles.TRAFFIC_ADMIN) {
                                            data.phone = invite.phone;
                                            data.real_name = invite.real_name;
                                            data.user_id = req.decoded.id;
                                            var transport = [];
                                            async.waterfall([
                                                function (cb) {
                                                    var transport = _.map(userData.transport, function (num) {
                                                        return hanZi[num].chn;
                                                    }).join("-");
                                                    global.lib_http.sendMsgServerSMS1(req, 'GBK', {
                                                        template_id: 'invite_friend_traffic',
                                                        content: [req.decoded.user_name, transport],
                                                        phone_list: [invite.phone]
                                                    });
                                                }
                                            ], function (err) {
                                                if (err) {
                                                    return next(err);
                                                }
                                            });
                                        } else {
                                            data.phone = invite.phone;
                                            data.real_name = invite.real_name;
                                            data.user_id = req.decoded.id;
                                            async.waterfall([
                                                function (cb) {
                                                    global.lib_http.sendMsgServerSMS1(req, 'GBK', {
                                                        template_id: 'invite_friend',
                                                        content: [req.decoded.user_name],
                                                        phone_list: [invite.phone]
                                                    });
                                                }
                                            ], function (err) {
                                                if (err) {
                                                    return next(err);
                                                }
                                            });
                                        }
                                    }
                                } else {
                                    //给公司同事发送短信
                                    data.phone = invite.phone;
                                    data.real_name = invite.real_name;
                                    data.user_id = req.decoded.id;
                                    data.role = req.body.role;
                                    data.company_id = req.decoded.company_id;
                                    global.lib_http.sendMsgServerSMS1(req, 'GBK', {
                                        template_id: 'invite_college',
                                        content: [req.decoded.company_name, req.decoded.user_name, global.config_common.user_roles_chn[req.body.role]],
                                        phone_list: [invite.phone]
                                    });
                                }
                                global.lib_invitation_user.add(data, function (err, invitation) {
                                    if (err) {
                                        return cbk(err);
                                    }
                                    if (req.body.group_id && global.config_common.relation_group_type[req.body.group_type]) {
                                        var groupUserData = {
                                            invite_id: invitation._id.toString(),   //组员id
                                            type: global.config_common.relation_group_type[req.body.group_type],        //类型跟组类型一致
                                            group_id: req.body.group_id    //所属公司id
                                        };
                                        if (req.body.group_type === global.config_common.relation_group_type.COLLEAGUE ||
                                            req.body.group_type === global.config_common.relation_group_type.DRIVER) {
                                            groupUserData.company_id = req.decoded.company_id.toString();
                                        } else {
                                            groupUserData.user_id = req.decoded.id;
                                        }
                                        global.lib_relation_group.addGroupUser(groupUserData, cbk);
                                    } else {
                                        cbk();
                                    }
                                });
                            }
                        }
                    ], callback);
                }, cb);
            }
        ], function (err) {
            if (err) {
                return next(err);
            }

            //调用云信发送短信
            if (req.body.type === 'FRIEND' && req.decoded.role === global.config_common.user_roles.TRAFFIC_DRIVER_PRIVATE) {
                global.lib_common.checkMsgForFriend(req, selfData01, req.body.friend_extend, _.pluck(inviteData1, 'phone'));
            }

            //users_data = lib_util.transObjArrToObj(users_data, 'phone');
            global.config_common.sendData(req, {
                list: photoUrls,
                users: inviteData1,
                inviteList: users_data,
                type: req.body.type,
                role: req.body.role
            }, next);
        });
    });

    /**
     * 功能：邀请好友或同事(1)在线则直接发送好友/同事邀请(2)离线则发送短信并计入已邀请未上线中
     * 参数：users:[{phone:'135xxx',real_name:'王某某'}]//邀请人的电话和姓名
     *        role:邀请的哪一种角色(一个手机号可以在平台注册多个角色)
     *        type:FRIEND/COMPANY_INVITE //好友邀请还是同事邀请
     *        friend_extend:好友类型(type:FRIEND)需要添加friend_extend参数(小写类型)
     *        选传参数：group_type、group_id；
     */
    api.post('/invite_new', function (req, res, next) {
        //参数判断
        if (!req.body.role || !_.isArray(req.body.users) ||
            (req.body.type !== global.config_common.relation_style.FRIEND &&
                req.body.type !== global.config_common.relation_style.COMPANY_INVITE)) {
            return next('invalid_format');
        }
        //剔除无效手机号码
        req.body.users = _.filter(req.body.users, function (num) {
            return global.config_common.checkPhone(num.phone);
        });
        if (req.body.type === global.config_common.relation_style.FRIEND) {
            if (!req.body.friend_extend) {
                return next('invalid_format:friend_extend');
            }
            if (req.body.friend_extend === 'trade') {
                req.body.friend_extend = 'purchase';
            }
        }
        if (req.body.type === global.config_common.relation_style.COMPANY_INVITE) {
            if (!req.body.role) {
                return next('invalid_format:role');
            }
        }
        //业务逻辑开始
        var selfData = {}; //个人信息和公司信息
        async.waterfall([
            function (cb) {
                //查询需要的基本数据(1)个人信息
                global.lib_user.getOne({
                    find: {_id: req.decoded.id},
                    select: 'company_id role sell buy transport real_name'
                }, cb);
            },
            function (user, cb) {
                selfData.user = user;
                if (user.company_id) {
                    //存在公司的话将公司数据也收集到一下
                    global.lib_company.getOne({
                        find: {_id: user.company_id},
                        select: 'type vip nick_name sell buy transport',
                    }, function (err, company) {
                        if (err) {
                            return next(err);
                        }
                        selfData.company = company;
                        cb();
                    });
                } else {
                    cb();
                }
            },
            function (cb) {
                global.lib_user.getListAll({
                    find: {
                        _id: {$ne: req.decoded.id},
                        phone: {$in: _.pluck(req.body.users, 'phone')},
                        source: {$ne: "remark"}
                    }
                }, cb);
            },
            function (users, cb) {
                var ids = _.pluck(users, '_id');
                if (req.body.type === 'COMPANY_INVITE') {
                    users = _.reject(users, function (num) {
                        return num.company_id === [];
                    });
                    ids = _.pluck(users, '_id');
                }
                var phones = _.difference(_.pluck(req.body.users, 'phone'), _.uniq(_.pluck(users, 'phone')));
                //整理取出建号时间小于一星期的人
                var userPhones = _.pluck(_.filter(users, function (num) {
                    return num.time_creation.getTime() < new Date().getTime() + 7 * 24 * 60 * 60 * 1000;
                }), 'phone');
                //分别给已上线和未上线的人加入不同的表并发送不同的推送和短信
                // (1-1)确定上线人员的id
                // (1-2)确定未上线人员的电话
                // (2-1)确定上线人员的推送内容
                // (2-2)确定邀请价位好友的信息
                // (3-1)确定未上线人员的短信内容
                // (3-2)确定未上线人员的电话号码列表

                async.parallel({
                    //这一步区分了线上线下
                    online: function (cbk) {
                        //根据不同类型确定不同的内容,然后直接调用发送推送接口
                        var str1 = (selfData.company ? selfData.company.nick_name : '') + selfData.user.real_name;
                        var str2;
                        if (req.body.type === 'FRIEND') {
                            str2 = '向您申请成为好友，请点击查看';
                        } else {
                            str2 = '邀请您成为同事-' + global.config_common.user_roles_chn[req.body.role] + '，请点击查看';
                        }
                        global.lib_http.sendMsgServerNoToken({
                            title: '互联网+',
                            user_ids: JSON.stringify(ids),
                            content: str1 + str2,
                            data: JSON.stringify({
                                params: {
                                    id: req.decoded.id,
                                    type: "rsc.new_relation"
                                }, url: "rsc.new_relation"
                            })
                        }, global.config_api_url.msg_server_push);
                        //收集向邀请列表中添加的数据,调用添加好友邀请/同事邀请的接口

                        var data = {type: req.body.type};
                        if (req.body.group_id && global.config_common.relation_group_type[req.body.group_type]) {
                            data.group_type = global.config_common.relation_group_type[req.body.group_type];
                            data.group_id = req.body.group_id;
                        }
                        var arr;
                        if (req.body.type === 'FRIEND') {
                            arr = _.map(ids, function (id) {
                                return {
                                    user_id: id,
                                    other_user_id: selfData.user.id,
                                    type: req.body.type,
                                    data: JSON.stringify({url: "rsc.new_relation"}),
                                    friend_extend: req.body.friend_extend,
                                    group_type: (global.config_common.relation_group_type[req.body.group_type] ? global.config_common.relation_group_type[req.body.group_type] : ''),
                                    group_id: (req.body.group_id ? req.body.group_id : '')
                                };
                            });
                        } else {
                            arr = _.map(ids, function (id) {
                                return {
                                    user_id: id,
                                    other_user_id: selfData.user.id,
                                    other_company_id: selfData.user.company_id,
                                    type: req.body.type,
                                    data: JSON.stringify({url: "rsc.new_relation"}),
                                    group_type: (global.config_common.relation_group_type[req.body.group_type] ? global.config_common.relation_group_type[req.body.group_type] : ''),
                                    group_id: (req.body.group_id ? req.body.group_id : ''),
                                    extend: req.body.role
                                };
                            });
                        }
                        global.lib_apply_relation.addList(arr, function (err) {
                            if (err) {
                                return cb(err);
                            }
                        });
                        if (userPhones.length) {
                            //调用云信发送短信
                            if (req.body.type === 'FRIEND') {
                                global.lib_common.checkMsgForFriend(req, selfData, req.body.friend_extend, userPhones);
                            } else {
                                global.lib_common.checkMsgForColleague(req, selfData, req.body.role, userPhones);
                            }
                        }
                        //for循环添加上线的人的数据
                        global.lib_user.getListAll({find: {_id: {$in: ids}}}, cbk);
                    },
                    offline: function (cbk) {
                        //根据不同类型确定不同的内容,然后直接调用发送短信接口
                        var obj;
                        if (req.body.type === 'FRIEND') {
                            obj = {
                                template_id: 'invite_friend',
                                content: [req.decoded.user_name],
                                phone_list: phones
                            }
                        } else {
                            obj = {
                                template_id: 'invite_college',
                                content: [selfData.company.nick_name, req.decoded.user_name, global.config_common.user_roles_chn[req.body.role]],
                                phone_list: phones
                            }
                        }
                        global.lib_http.sendMsgServerSMS1(req, 'GBK', obj);
                        //封装一个关于添加好友邀请/同事邀请的未上线的接口
                        var invites = _.filter(req.body.users, function (num) {
                            return _.indexOf(phones, num.phone) !== -1;
                        });
                        var arr;
                        if (req.body.type === 'FRIEND') {
                            arr = _.map(invites, function (num) {
                                return {
                                    phone: num.phone,
                                    real_name: num.real_name,
                                    user_id: req.decoded.id,
                                    extend: req.body.friend_extend,
                                    type: req.body.type
                                };
                            });
                        } else {
                            arr = _.map(invites, function (num) {
                                return {
                                    phone: num.phone,
                                    real_name: num.real_name,
                                    user_id: req.decoded.id,
                                    role: req.body.role,
                                    company_id: selfData.user.company_id,
                                    type: req.body.type
                                };
                            });
                        }
                        global.lib_invitation_user.addList(arr, req, function (err) {
                            if (err) {
                                return cb(err);
                            }
                        });
                        //调用云信发送短信
                        if (req.body.type === 'FRIEND') {
                            global.lib_common.checkMsgForFriend(req, selfData, req.body.friend_extend, phones);
                        } else {
                            global.lib_common.checkMsgForColleague(req, selfData, req.body.role, phones);
                        }
                        //for循环添加未上线的人的数据
                        cbk(null, invites);
                    }
                }, cb)
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            //返回时需要邀请已上线的人和邀请未上线的人
            global.config_common.sendData(req, result, next);
        })
    });

    //个人主页加关系
    api.post('/homepage_supply', function (req, res, next) {
        if (!req.body.user_id ||
            (!global.config_common.user_homepage_status[req.body.status] &&
                !req.body.friend)) {
            return next('invalid_format');
        }
        var role;
        async.waterfall([
            function (cb) {
                global.lib_user.getOne({find: {_id: req.body.user_id}}, cb);
            },
            function (user, cb) {
                if (!user) {
                    return cb('user_not_found');
                }
                //判断用户类型，跳转不同页面；
                role = 'rsc.new_relation';
                //修正司机发来的friend参数
                if (!_.isBoolean(req.body.friend)) {
                    req.body.friend = req.body.friend == 'false' ? false : true;
                }
                if (req.body.friend) {
                    var content;
                    if (req.decoded.role === global.config_common.user_roles.TRAFFIC_DRIVER_PRIVATE) {
                        content = '挂靠司机' + req.decoded.user_name + '向您申请成为好友，请点击查看';
                    } else if (req.decoded.company_name) {
                        content = '' + req.decoded.company_name + '' + req.decoded.user_name + '向您申请成为好友，请点击查看';
                    } else {
                        content = '' + req.decoded.user_name + '向您申请成为好友，请点击查看';
                    }
                    global.lib_http.sendMsgServerNoToken({
                        title: '互联网+',
                        user_ids: JSON.stringify([req.body.user_id]),
                        content: content,
                        data: JSON.stringify({params: {id: req.decoded.id, type: role}, url: role})
                    }, global.config_api_url.msg_server_push);
                    var addData = {
                        user_id: req.body.user_id,
                        other_user_id: req.decoded.id,
                        type: global.config_common.relation_style.FRIEND,
                        data: JSON.stringify({url: role})
                    };
                    if (req.decoded.role === global.config_common.user_roles.TRAFFIC_DRIVER_PRIVATE && user.role === global.config_common.user_roles.TRAFFIC_ADMIN) {
                        addData.extend = global.config_common.user_roles.TRAFFIC_ADMIN;
                    }
                    if (req.body.status === 'TRADE_TRAFFIC') {
                        addData.extend = 'TRAFFIC';
                    }
                    //确定好友类型
                    if (req.body.friend_extend) {
                        addData.friend_extend = req.body.friend_extend.split('_')[1];
                    }
                    global.lib_apply_relation.getOne({
                        find: {
                            user_id: req.body.user_id,
                            other_user_id: req.decoded.id,
                            type: global.config_common.relation_style.FRIEND
                        }
                    }, function (err, relationData) {
                        if (!relationData) {
                            global.lib_apply_relation.add(addData, cb);
                        } else {
                            relationData.time_creation = new Date();
                            if (req.decoded.role === global.config_common.user_roles.TRAFFIC_DRIVER_PRIVATE && user.role == global.config_common.user_roles.TRAFFIC_ADMIN) {
                                relationData.extend = global.config_common.user_roles.TRAFFIC_ADMIN;
                            }
                            //确定好友类型
                            relationData.friend_extend = addData.friend_extend;
                            relationData.save(cb);
                        }
                    })
                } else {
                    cb(null, null, null);
                }
            },
            function (relation, count, cb) {
                switch (req.body.status) {
                    case global.config_common.user_homepage_status.STORE_TRAFFIC:
                        global.lib_apply_relation.addStoreToTraffic(req.decoded.id, req.body.user_id, cb);
                        break;
                    case global.config_common.user_homepage_status.TRAFFIC_STORE:
                        global.lib_apply_relation.addTrafficToStore(req.decoded.id, req.body.user_id, cb);
                        break;
                    case global.config_common.user_homepage_status.STORE_TRADE:
                        global.lib_apply_relation.addStoreToTrade(req.decoded.id, req.body.user_id, cb);
                        break;
                    case global.config_common.user_homepage_status.TRADE_STORE:
                        global.lib_apply_relation.addTradeToStore(req.decoded.id, req.body.user_id, cb);
                        break;
                    case global.config_common.user_homepage_status.DRIVER_TRAFFIC:
                        global.lib_apply_relation.addDriverToTraffic(req.decoded.id, req.body.user_id, cb);
                        break;
                    case global.config_common.user_homepage_status.TRAFFIC_DRIVER:
                        global.lib_apply_relation.addTrafficToDriver(req.decoded.id, req.body.user_id, cb);
                        break;
                    case global.config_common.user_homepage_status.TRAFFIC_TRADE:
                        global.lib_apply_relation.addTrafficToTrade(req.decoded.id, req.body.user_id, cb);
                        break;
                    case global.config_common.user_homepage_status.TRADE_TRAFFIC:
                        global.lib_apply_relation.addTradeToTraffic(req.decoded.id, req.body.user_id, cb);
                        break;
                    case global.config_common.user_homepage_status.PURCHASE_SALE:
                        global.lib_apply_relation.addPurchaseToSale(req.decoded.id, req.body.user_id, cb);
                        break;
                    case global.config_common.user_homepage_status.SALE_PURCHASE:
                        global.lib_apply_relation.addSaleToPurchase(req.decoded.id, req.body.user_id, cb);
                        break;
                    default:
                        cb();
                        break;
                }
            }
        ], function (err) {
            if (err) {
                return next(err);
            }
            if (req.body.status && req.decoded.role !== global.config_common.user_roles.TRAFFIC_DRIVER_PRIVATE) {
                var content;
                if (req.decoded.company_name) {
                    content = '' + req.decoded.company_name + '' + req.decoded.user_name + '向您申请成为合作企业，请点击查看';
                } else {
                    content = '' + req.decoded.user_name + '向您申请成为合作企业，请点击查看';
                }
                global.lib_http.sendMsgServerNoToken({
                    title: '互联网+',
                    user_ids: JSON.stringify([req.body.user_id]),
                    content: content,
                    data: JSON.stringify({params: {id: req.decoded.id, type: "rsc.new_relation"}, url: role})
                }, global.config_api_url.msg_server_push);
            }
            global.config_common.sendData(req, {}, next);
        });
    });

    //处理各种申请的接口
    api.post('/deal', function (req, res, next) {
        if (!req.body.apply_id) {
            return next('invalid_format');
        }
        var applyData;
        async.waterfall([
            function (cb) {
                global.lib_apply_relation.getOne({
                    find: {
                        _id: req.body.apply_id,
                        user_id: req.decoded.id,
                        status: global.config_common.relation_status.WAIT
                    }
                }, cb);
            },
            function (apply, cb) {
                if (!apply) {
                    return cb('apply_relation_not_found');
                }
                if (apply.type === global.config_common.relation_style.COMPANY_SUPPLY) {
                    global.lib_user.getOne({
                        find: {_id: apply.other_user_id}
                    }, function (err, user) {
                        if (err) {
                            return cb(err);
                        }
                        if (!user) {
                            return next('invalid_format');
                        }
                        if (global.config_common.checkUserCompany(user)) {
                            global.lib_company.getOne({find: {_id: user.company_id}}, function (err, company) {
                                if (err) {
                                    return cb(err);
                                }
                                //查看此人是不是挂靠司机
                                if (user.role === global.config_common.user_roles.TRAFFIC_DRIVER_PRIVATE) {
                                    cb(null, apply);
                                    //检查此人是否可以加入其它公司
                                } else if (!global.config_common.checkUserCanJoinCompany(user, company)) {
                                    return cb('not_allow');
                                } else {
                                    cb(null, apply);
                                }
                            });
                        } else {
                            cb(null, apply);
                        }
                    });
                } else {
                    cb(null, apply);
                }
            },
            function (apply, cb) {
                applyData = apply;
                //判断申请类型
                switch (apply.type) {
                    //处理公司邀请
                    case global.config_common.relation_style.COMPANY_INVITE:
                        global.lib_apply_relation.agreeCompanyInvite(apply, cb);
                        break;
                    //处理公司申请
                    case global.config_common.relation_style.COMPANY_SUPPLY:
                        //新增！如果没有角色默认为物流管理员
                        if (apply.extend) {
                            req.body.role = apply.extend;
                        }
                        if (!req.body.role) {
                            return cb('invalid_format');
                        }
                        if (global.config_common.checkTrafficCompanyByRole(req.decoded.role)) {
                            if (req.body.role !== global.config_common.user_roles.TRAFFIC_ADMIN &&
                                req.body.role !== global.config_common.user_roles.TRADE_STORAGE &&
                                req.body.role !== global.config_common.user_roles.TRAFFIC_DRIVER_PRIVATE &&
                                req.body.role !== global.config_common.user_roles.TRAFFIC_EMPLOYEE &&
                                req.body.role !== global.config_common.user_roles.TRAFFIC_CAPTAIN) {
                                return cb('not_allow');
                            }
                        } else {
                            if (req.body.role !== global.config_common.user_roles.TRADE_ADMIN &&
                                req.body.role !== global.config_common.user_roles.TRADE_STORAGE &&
                                req.body.role !== global.config_common.user_roles.TRADE_PURCHASE &&
                                req.body.role !== global.config_common.user_roles.TRADE_SALE) {
                                return cb('not_allow');
                            }
                        }
                        apply.extend = req.body.role;
                        global.lib_apply_relation.agreeCompanySupply(apply, cb);
                        break;
                    //处理好友申请
                    case global.config_common.relation_style.FRIEND:
                        global.lib_apply_relation.agreeFriend2(apply, req.body.friend_extend, cb);
                        // global.lib_apply_relation.agreeFriend(apply, cb);
                        break;
                    //处理合作关系
                    case global.config_common.relation_style.WORK:
                        global.lib_apply_relation.agreeWork(apply, cb);
                        break;
                }
            },
            function (cb) {
                applyData.status = global.config_common.relation_status.ACCEPT;
                applyData.save(cb);
            },
            function (apply, count, cb) {
                //处理人加组
                if (req.body.group_id && global.config_common.relation_group_type[req.body.group_type]) {
                    var groupUserData = {
                        member_id: applyData.other_user_id,   //组员id
                        type: global.config_common.relation_group_type[req.body.group_type],        //类型跟组类型一致
                        group_id: req.body.group_id    //所属公司id
                    };
                    if (req.body.group_type === global.config_common.relation_group_type.DRIVER ||
                        req.body.group_type === global.config_common.relation_group_type.COLLEAGUE) {
                        groupUserData.company_id = req.decoded.company_id.toString();
                    } else {
                        groupUserData.user_id = req.decoded.id;
                    }
                    global.lib_relation_group.addGroupUser(groupUserData, cb);
                } else {
                    cb(null, null, null);
                }
            },
            function (data, count, cb) {
                //申请人加组
                if (applyData.group_id) {
                    var groupUserData = {
                        member_id: applyData.user_id,   //组员id
                        type: applyData.group_type,        //类型跟组类型一致
                        group_id: applyData.group_id    //所属公司id
                    };
                    if (req.body.group_type === global.config_common.relation_group_type.DRIVER ||
                        req.body.group_type === global.config_common.relation_group_type.COLLEAGUE) {
                        groupUserData.company_id = applyData.other_company_id;
                    } else {
                        groupUserData.user_id = applyData.other_user_id;
                    }
                    global.lib_relation_group.addGroupUser(groupUserData, cb);
                } else {
                    cb(null, null, null);
                }
            },
            function (data, count, cb) {
                if (data && data.type === global.config_common.relation_group_type.COLLEAGUE) {
                    global.lib_team.getOne({find: {group_id: applyData.group_id}}, function (err, teamData) {
                        teamData.user_ids = teamData.user_ids.push(applyData.user_id);
                        teamData.save();
                        var arr = [];
                        arr.push(applyData.user_id.toString());
                        var arr2 = JSON.stringify(arr);
                        sdk_im_wangyiyunxin.teamAdd({
                            tid: teamData.team_id,
                            owner: teamData.user_id.toString(),
                            members: arr2,
                            magree: 0,
                            msg: '您已成功加入群'
                        });
                    });
                }
                cb();
            },
            function (cb) {
                //检查是否为第一次与此人加关系，如果是第一次加关系，则返回具体数据
                if (applyData.type === global.config_common.relation_style.FRIEND) {
                    global.lib_work_relation.getCount({
                        user_id: applyData.user_id,
                        other_user_id: applyData.other_user_id
                    }, cb);
                } else if (applyData.type === global.config_common.relation_style.WORK) {
                    global.lib_user_relation.getCount({
                        user_id: applyData.user_id,
                        other_id: applyData.other_user_id
                    }, cb);
                } else {
                    cb(null, null);
                }
            },
            function (count, cb) {
                if (_.isNumber(count) && !count) {
                    global.lib_user.getOneData(applyData.user_id, cb);
                } else {
                    cb(null, null)
                }
            }
        ], function (err, data) {
            if (err) {
                return next(err);
            }
            global.config_common.sendData(req, data, next);
        });
    });

    /**
     * 功能：处理司机直接挂靠为物流负责人的司机
     * 参数：(1):group_id;组id(2):user_ids;司机的id数组
     */
    api.post('/deal_driver', function (req, res, next) {
        if (!req.body.user_ids) {
            return next('invalid_format');
        }
        var success_count = 0;
        var failed_count = 0;
        var data_g;
        var wuLiuData2;
        var phone = [];
        async.waterfall([
            function (cb) {
                global.lib_user.getOneEasy({find: {_id: req.decoded.id}}, cb);
            },
            function (wuLiuData, cb) {
                wuLiuData2 = wuLiuData;
                if (wuLiuData.company_id.length) {
                    async.eachSeries(req.body.user_ids, function (id, callback) {
                        var verify = {
                            user_id: id.toString(),
                            company_id: wuLiuData.company_id[0],
                            approve_id: req.decoded.id
                        };
                        var success = false;
                        async.waterfall([
                            function (cbk) {
                                //检查是否存在人
                                global.lib_user.getOneEasy({
                                    find: {
                                        _id: id.toString(),
                                        role: global.config_common.user_roles.TRAFFIC_DRIVER_PRIVATE
                                    }
                                }, cbk);
                            },
                            function (user, cbk) {
                                if (!user) {
                                    cbk(null, null);
                                } else {
                                    global.lib_http.sendTrafficServer({
                                        company_id: req.decoded.company_id,
                                        user_id: user._id.toString(),
                                        user_phone: user.phone
                                    }, '/api/server/common/depend_red_card', function (a, b) {
                                        cbk(null, user);
                                    })
                                }
                            },
                            function (user, cbk) {
                                if (!user) {
                                    failed_count += 1;
                                }
                                phone.push(user.phone);
                                //给司机加上物流公司
                                user.company_id = _.uniq(user.company_id.push(wuLiuData.company_id[0]));
                                global.lib_driver_verify.getCount(verify, cbk);
                            },
                            function (count, cbk) {
                                if (count) {
                                    callback(null, null, null);
                                } else {
                                    success_count += 1;
                                    success = true;
                                    global.lib_driver_verify.add(verify, cbk);
                                }
                            },
                            function (content, count, cbk) {
                                if (success && req.body.group_id) {
                                    data_g = {
                                        "member_id": id,
                                        "type": "DRIVER",
                                        "group_id": req.body.group_id,
                                        "company_id": wuLiuData.company_id[0],
                                    }
                                    global.lib_relation_group.getOneGroupUser({find: data_g}, cbk);
                                } else {
                                    cbk(null, null);
                                }
                            },
                            function (count, cbk) {
                                if (count) {
                                    return cbk();
                                } else {
                                    global.lib_relation_group.addGroupUser(data_g, cbk);
                                }
                            }
                        ], callback)
                    }, cb)
                } else {
                    return cb('no_company');
                }
            }
        ], function (err) {
            if (err) {
                return next(err);
            }
            //加推送
            // global.lib_company.getOne({find: {_id: wuLiuData2.company_id[0]}}, function (err, data) {
            //     global.lib_http.sendMsgServerNoToken({
            //         title: '互联网+',
            //         user_ids: JSON.stringify(req.body.user_ids),
            //         content: '' + data.nick_name + '' + wuLiuData2.real_name + '已邀请您成为合作车辆，解决司机找货难问题，海量货源请点击查看vehicles.e-wto.com，退订回T',
            //         data: JSON.stringify({
            //             params: {
            //                 id: req.decoded.id
            //             },
            //         })
            //     }, global.config_api_url.msg_server_push);
            // });

            //6.0.7新！
            global.lib_company.getOne({find: {_id: wuLiuData2.company_id[0]}}, function (err, data) {
                global.lib_http.sendTrafficServer({
                    method: 'getCount',
                    cond: {company_id: data._id.toString()},
                    model: 'TrafficLine'
                }, global.config_api_url.server_common_get, function (err, count) {
                    global.lib_http.sendTrafficServer({
                        method: 'getOne',
                        cond: {find: {company_id: data._id.toString(), status: 'effective'}},
                        model: 'RedCard'
                    }, global.config_api_url.server_common_get, function (err, redData) {
                        if (redData) {
                            var str = '24小时内登录赠送' + redData.money + '元现金红包'
                            //切换短信为网易云短信，模板
                            global.lib_http.sendMsgServerSMSNew(req, {
                                phone: JSON.stringify(phone),
                                params: JSON.stringify([data.nick_name, count, str, 'vehicles.e-wto.com']),
                                templateid: '3942839'
                            }, '/msg/send_driver_sms', function (err) {
                                console.log('err:', err)
                            });
                        } else {
                            //切换短信为网易云短信，模板
                            global.lib_http.sendMsgServerSMSNew(req, {
                                phone: JSON.stringify(phone),
                                params: JSON.stringify([data.nick_name, count, 'vehicles.e-wto.com']),
                                templateid: '3902721'
                            }, '/msg/send_driver_sms', function (err) {
                                console.log('err:', err)
                            });
                        }
                    });
                    // global.lib_http.sendMsgServerNoToken({
                    //     title: '司机中心',
                    //     user_ids: JSON.stringify(req.body.user_ids),
                    //     content: '' + data.nick_name + '发布了' + count + '条运输线路，邀请您成为合作车辆，货源紧张！请点击查看vehicles.e-wto.com,^^',
                    //     data: JSON.stringify({
                    //         params: {
                    //             id: req.decoded.id
                    //         },
                    //     })
                    // }, global.config_api_url.msg_server_push);
                });
            });


            global.config_common.sendData(req, {
                success: success_count,
                failed: failed_count
            }, next);
        })
    });

    /**
     * 功能：再次发起申请
     * 参数：id
     */
    api.post('/again_apply', function (req, res, next) {
        if (!req.body.id) {
            return next('invalid_format');
        }
        global.lib_apply_relation.update({
            find: {_id: req.body.id},
            set: {time_creation: new Date()}
        }, function (err, data) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, data, next);
        });
    });

    /**
     * 功能:立即提醒-->再次邀请未上线用户
     */
    api.post('/again_remind', function (req, res, next) {
        if (!req.body.id) {
            return next('invalid_format');
        }
        var selfData = {};
        async.waterfall([
            function (cb) {
                global.lib_invitation_user.getOne({
                    find: {_id: req.body.id}
                }, cb);
            },
            function (data, cb) {
                selfData.data = data;
                data.time_creation = new Date();
                data.save();
                global.lib_user.getOneEasy({find: {_id: data.user_id}}, cb);
            },
            function (user, cb) {
                selfData.user = user;
                global.lib_company.getOne({find: {_id: selfData.data.company_id}}, cb);
            },
            function (company, cb) {
                selfData.company = company;
                var obj = {
                    template_id: 'invite_college',
                    content: [selfData.company.nick_name, selfData.user.real_name, global.config_common.user_roles_chn[selfData.data.role]],
                    phone_list: [selfData.data.phone]
                }
                global.lib_http.sendMsgServerSMS1(req, 'GBK', obj);
                cb();
            }
        ], function (err) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, {}, next);
        })
    });

    return api;

};
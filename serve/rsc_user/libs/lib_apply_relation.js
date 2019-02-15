/**
 * Created by Administrator on 2017/6/21.
 */
var _ = require('underscore');
var async = require('async');
var lib_util = require('./lib_util');
var lib_http = require('./lib_http');
var lib_user = require('./lib_user');
var lib_company = require('./lib_company');
var addressDB = require('../dbs/db_base')('Address');
var driverVerifyDB = require('../dbs/db_base')('Driver_verify');
var companyRelationDB = require('../dbs/db_base')('Company_relation');
var userRelationDB = require('../dbs/db_base')('User_relation');
var workRelationDB = require('../dbs/db_base')('Work_relation');
var applyRelationOnlineDB = require('../dbs/db_base')('Apply_relation_online');
var invitationUserDB = require('../dbs/db_base')('Invitation_user');
var config_api_url = require('../configs/config_api_url');
var config_common = require('../configs/config_common');

var sdk_im_wangyiyunxin = require('../sdks/im_wangyiyunxin/sdk_im_wangyiyunxin');
var lib_team = require('../libs/lib_team');


exports.getOne = function (data, cb) {
    applyRelationOnlineDB.getOne(data, cb);
};

//增加的方法
var add = function (data, cb) {
    async.waterfall([
        function (callback) {
            applyRelationOnlineDB.getOne({find: data}, callback);
        },
        function (relation, callback) {
            if (!relation) {
                applyRelationOnlineDB.add(data, callback);
            } else {
                if (relation.type == 'FRIEND') {
                    relation.friend_extend = data.friend_extend;
                }
                relation.time_creation = new Date();
                relation.save(callback);
            }
        }
    ], cb);
};
exports.add = add;

exports.getCount = function (data, cb) {
    applyRelationOnlineDB.getCount(data, cb);
};

exports.getList = function (data, cb) {
    applyRelationOnlineDB.getList(data, cb);
};

exports.update = function (data, cb) {
    applyRelationOnlineDB.update(data, cb);
};

exports.del = function (cond, callback) {
    applyRelationOnlineDB.del(cond, callback);
};

exports.addList = function (arr, callback) {
    async.eachSeries(arr, function (data, cb) {
        async.waterfall([
            function (cbk) {
                applyRelationOnlineDB.getOne({
                    find: {
                        user_id: data.user_id,
                        other_user_id: data.other_user_id,
                        type: data.type
                    }
                }, cbk);
            },
            function (relation, cbk) {
                if (!relation) {
                    applyRelationOnlineDB.add(data, callback);
                } else {
                    if (relation.type == 'FRIEND') {
                        relation.friend_extend = data.friend_extend;
                    }
                    relation.time_creation = new Date();
                    relation.save(callback);
                }
            }
        ], cb);
    }, callback);
};

//同意公司邀请
exports.agreeCompanyInvite = function (data, callback) {
    var userData;
    var count;
    var company;
    var userData2;
    async.waterfall([
        //判断公司是否为vip并限制人数-->开始
        function (cb) {
            lib_user.getList({
                find: {company_id: data.other_company_id}
            }, cb);
        },
        function (users, cb) {
            count = users.length;
            lib_company.getOne({
                find: {_id: data.other_company_id}
            }, cb);
        },
        function (companydata, cb) {
            company = companydata;
            //判断vip公司人数限制
            if (company.type === config_common.company_category.TRADE) {
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
            //判断公司是否为vip并限制人数-->结束
            lib_user.getOneEasy({find: {_id: data.user_id}}, cb);
        },
        function (user, cb) {
            userData = user;
            // invitationUserDB.del({
            //     phone: user.phone,
            //     company_id: data.other_company_id,
            //     user_id: data.other_user_id
            // }, function () {
            // });
            if (userData.role === config_common.user_roles.TRAFFIC_DRIVER_PRIVATE) {
                user.company_id.push(data.other_company_id);
                user.company_id = _.uniq(user.company_id);
                user.save(function (err) {
                    if (err) {
                        return cb(err);
                    }
                    var cond = {
                        user_id: userData._id.toString(),
                        company_id: data.other_company_id,
                        approve_id: data.other_user_id
                    };
                    async.waterfall([
                        function (callback) {
                            driverVerifyDB.getCount(cond, callback);
                        },
                        function (count, callback) {
                            if (count) {
                                callback();
                            } else {
                                driverVerifyDB.add(cond, callback);
                            }
                        }
                    ], function (err) {
                        if (err) {
                            return cb(err);
                        }
                        cb();
                    });
                });
            } else {
                //1,先判断是否是同一家公司 2，在判断是否有公司 3，没有正常走，有的话不允许；
                if (data.other_company_id === user.company_id) {
                    if ((config_common.checkTradeCompanyByRole(user.role) && config_common.checkTradeCompanyByRole(data.extend)) ||
                        (config_common.checkTrafficCompanyByRole(user.role) && config_common.checkTrafficCompanyByRole(data.extend))) {
                        user.free = false;
                        user.role = data.extend;
                        user.company_id = data.other_company_id;
                        user.save(function (err) {
                            if (err) {
                                return cb(err);
                            }
                            cb();
                        });
                    } else {
                        var newUser = lib_util.clone(user);
                        delete newUser._id;
                        newUser.free = false;
                        newUser.role = data.extend;
                        newUser.company_id = data.other_company_id;
                        lib_user.add(newUser, function (err, cb) {
                            if (err) {
                                return cb(err);
                            }
                            userData.remove(function (err) {
                                if (err) {
                                    return cb(err);
                                }
                                cb();
                            });
                        });
                    }
                } else if (!config_common.checkUserCompany(user)) {
                    if ((config_common.checkTradeCompanyByRole(user.role) && config_common.checkTradeCompanyByRole(data.extend)) ||
                        (config_common.checkTrafficCompanyByRole(user.role) && config_common.checkTrafficCompanyByRole(data.extend))) {
                        user.free = false;
                        //user.role = data.extend;
                        user.role = data.extend;
                        user.company_id = data.other_company_id;
                        user.save(function (err) {
                            if (err) {
                                return cb(err);
                            }
                            cb();
                        });
                    } else {
                        var newUser = lib_util.clone(user);
                        delete newUser._id;
                        newUser.free = false;
                        newUser.role = data.extend;
                        //newUser.post = global.config_common.user_roles_chn[data.extend];
                        newUser.company_id = data.other_company_id;
                        lib_user.add(newUser, function (err, cb) {
                            if (err) {
                                return cb(err);
                            }
                            userData.remove(function (err) {
                                if (err) {
                                    return cb(err);
                                }
                                cb();
                            });
                        });
                    }
                } else {
                    return cb('not_allow');
                }
                // if (config_common.checkUserCompany(user)) {
                //     //这里再判断一次，如果公司id = 传进来的id，继续往下走
                //     if (data.other_company_id == user.company_id) {
                //         if ((config_common.checkTradeCompanyByRole(user.role) && config_common.checkTradeCompanyByRole(data.extend)) ||
                //             (config_common.checkTrafficCompanyByRole(user.role) && config_common.checkTrafficCompanyByRole(data.extend))) {
                //             user.role = data.extend;
                //             user.company_id = data.other_company_id;
                //             user.save(cb);
                //         } else {
                //             user.role = data.extend;
                //             user.company_id = data.other_company_id;
                //             lib_user.add(user, function (err, cb) {
                //                 if (err) {
                //                     return cb(err);
                //                 }
                //                 userData.remove(cb);
                //             });
                //         }
                //     } else {
                //         return cb('not_allow');
                //     }
                // }else {
                //     return cb('not_allow');
                // }
            }
        },
        function (cb) {
            if (userData.role === config_common.user_roles.TRADE_STORAGE) {
                addressDB.update({
                    find: {user_ids: userData._id.toString()},
                    set: {company_id: data.other_company_id}
                }, cb);
            } else {
                cb(null, 0);
            }
        },
        function (count, cb) {
            //如果以上操作都没有问题那么让这个人加入公司群组
            global.lib_user.getOne({find: {phone: userData.phone}}, cb);
        },
        function (user, cb) {
            if (userData.role === config_common.user_roles.TRAFFIC_DRIVER_PRIVATE) {
                cb(null, null);
            } else {
                userData2 = user;
                lib_team.getOne({
                    find: {company_id: user.company_id}
                }, cb)
            }
        },
        function (team, cb) {
            if (team) {
                var arr = [];
                arr.push(userData._id.toString());
                var arr2 = JSON.stringify(arr);
                sdk_im_wangyiyunxin.teamAdd({
                    tid: team.team_id,
                    owner: team.user_ids[0].toString(),
                    members: arr2,
                    magree: 0,
                    msg: '您已成功加入公司群'
                });
            }
            cb();
        }
    ], function (err) {
        if (err) {
            return callback(err);
        }
        callback();
    });
};

//同意公司申请
exports.agreeCompanySupply = function (data, callback) {
    var userData;
    var count;
    var company;
    var userData2;
    async.waterfall([
        //判断公司是否为vip并限制人数-->开始
        function (cb) {
            lib_user.getList({
                find: {company_id: data.company_id}
            }, cb);
        },
        function (users, cb) {
            count = users.length;
            lib_company.getOne({
                find: {_id: data.company_id}
            }, cb);
        },
        function (companydata, cb) {
            company = companydata;
            //判断vip公司人数限制
            if (company.type === config_common.company_category.TRADE) {
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
            //判断公司是否为vip并限制人数-->结束
            lib_user.getOneEasy({find: {_id: data.other_user_id}}, cb);
        },
        function (user, cb) {
            userData = user;
            if (userData.role === config_common.user_roles.TRAFFIC_DRIVER_PRIVATE) {
                user.company_id.push(data.company_id);
                user.company_id = _.uniq(user.company_id);
                user.save(function (err) {
                    if (err) {
                        return cb(err);
                    }
                    var verify = {
                        user_id: userData._id.toString(),
                        company_id: data.company_id,
                        approve_id: data.user_id
                    };
                    async.waterfall([
                        function (callback) {
                            driverVerifyDB.getCount(verify, callback);
                        },
                        function (count, callback) {
                            if (count) {
                                callback(null, null, null);
                            } else {
                                driverVerifyDB.add(verify, callback);
                            }
                        },
                        //加入公司群的操作
                        function (data1, data2, callback) {
                            callback();
                        },
                        //向物流服务器发送消息，用于优惠券！
                        function (callback) {
                            global.lib_http.sendTrafficServer({
                                company_id: company._id.toString(),
                                user_id: userData._id.toString(),
                                user_phone: userData.phone
                            }, '/api/server/common/depend_red_card', function (a, b) {
                                callback();
                            })
                        }
                    ], cb);

                });
            } else {
                // 有公司也可以加入别人公司
                // if (config_common.checkUserCompany(user)) {
                //     return cb('have_company');
                // }
                if ((config_common.checkTradeCompanyByRole(user.role) && config_common.checkTradeCompanyByRole(data.extend)) ||
                    (config_common.checkTrafficCompanyByRole(user.role) && config_common.checkTrafficCompanyByRole(data.extend))) {
                    user.free = false;
                    user.role = data.extend;
                    user.company_id = data.company_id;
                    user.save(function (err) {
                        if (err) {
                            return cb(err);
                        }
                        //在这里删除群聊
                        global.lib_team.getOne({find: {company_id: userData.company_id}}, function (err, team) {
                            if (err) {
                                console.log('err:', err);
                            }
                            if (team) {
                                //在这里删除群聊
                                sdk_im_wangyiyunxin.leaveTeam({
                                    tid: team.team_id,
                                    accid: userData._id.toString()
                                });
                            }
                        });
                        cb();
                    });
                } else {
                    var newUser = lib_util.clone(user);
                    delete newUser._id;
                    newUser.free = false;
                    newUser.role = data.extend;
                    newUser.company_id = data.company_id;
                    lib_user.add(newUser, function (err, cb) {
                        if (err) {
                            return cb(err);
                        }
                        //在这里删除群聊
                        global.lib_team.getOne({find: {company_id: userData.company_id}}, function (err, team) {
                            if (err) {
                                console.log('err:', err);
                            }
                            sdk_im_wangyiyunxin.leaveTeam({
                                tid: team.team_id,
                                accid: userData._id.toString()
                            });
                        })
                        userData.remove(function (err) {
                            if (err) {
                                return cb(err);
                            }
                            cb();
                        });
                    });
                }
            }
        },
        function (cb) {
            if (userData.role === config_common.user_roles.TRADE_STORAGE) {
                addressDB.update({find: {user_ids: userData._id.toString()}, set: {company_id: data.company_id}}, cb);
            } else {
                cb(null, 0);
            }
        },
        function (count, cb) {
            //如果以上操作都没有问题那么让这个人加入公司群组
            global.lib_user.getOne({find: {_id: userData._id.toString()}}, cb);
        },
        function (user, cb) {
            if (userData.role === config_common.user_roles.TRAFFIC_DRIVER_PRIVATE) {
                cb(null, null);
            } else {
                lib_team.getOne({
                    find: {company_id: user.company_id}
                }, cb);
            }
        },
        function (team, cb) {
            if (team) {
                var arr = [];
                arr.push(userData._id.toString());
                var arr2 = JSON.stringify(arr);
                sdk_im_wangyiyunxin.teamAdd({
                    tid: team.team_id,
                    owner: team.user_ids[0].toString(),
                    members: arr2,
                    magree: 0,
                    msg: '您已成功加入公司群'
                });
            }
            cb();
        },
        function (cb) {
            //判断申请人有无公司做不同处理
            if (company.verify_phase === config_common.verification_phase.SUCCESS) {
                userCompanySelfJoinCompany(userData, company, function (err) {
                    cb();
                });
            } else {
                userSelfJoinCompany(userData, function (err) {
                    cb();
                });
            }
        },
        function (cb) {
            //在这里查询到其他的公司申请，将其状态改为失败
            global.lib_apply_relation.update({
                find: {
                    other_user_id: userData._id.toString(),
                    status: global.config_common.relation_status.WAIT,
                    type: global.config_common.relation_style.COMPANY_SUPPLY,
                    company_id: {$nin: _.flatten([userData.company_id])}
                },
                set: {status: global.config_common.relation_status.REFUSE}
            }, cb);
        },
        function (data, cb) {
            //在这里查询到加入公司的其他申请，将其状态改为成功
            global.lib_apply_relation.update({
                find: {
                    other_user_id: userData._id.toString(),
                    status: global.config_common.relation_status.WAIT,
                    type: global.config_common.relation_style.COMPANY_SUPPLY,
                    company_id: {$in: _.flatten([userData.company_id])}
                },
                set: {status: global.config_common.relation_status.ACCEPT}
            }, cb);
        },
        function (data, cb) {
            //在这里查询到其他的公司邀请，将其状态改为失败
            global.lib_apply_relation.update({
                find: {
                    user_id: userData._id.toString(),
                    status: global.config_common.relation_status.WAIT,
                    type: global.config_common.relation_style.COMPANY_INVITE
                },
                set: {status: global.config_common.relation_status.REFUSE}
            }, cb);
        }
    ], function (err, result) {
        if (err) {
            return callback(err);
        }
        callback();
    });
};

//互发空消息-->理解跨服务器调取应用 --wly
exports.agreeFriend = function (data, callback) {
    async.waterfall([
        function (cb) {
            userRelationDB.getOne({find: {user_id: data.user_id, other_id: data.other_user_id}}, cb);
        },
        function (user, cb) {
            if (!user) {
                userRelationDB.add({
                    user_id: data.user_id,    //自己id
                    other_id: data.other_user_id   //对方id
                }, cb);
            } else {
                return cb(null, null, null)
            }
        },
        function (supply, count, cb) {
            userRelationDB.getOne({find: {user_id: data.other_user_id, other_id: data.user_id}}, cb);
        },
        function (user, cb) {
            if (!user) {
                userRelationDB.add({
                    user_id: data.other_user_id,    //自己id
                    other_id: data.user_id   //对方id
                }, cb);
            } else {
                return cb(null, null, null);
            }
        },
        function (supply, count, cb) {
            cb();
        },
    ], function (err) {
        if (err) {
            return callback(err);
        }
        callback();
    });
};

//互发空消息-->理解跨服务器调取应用 --wly
exports.agreeFriend2 = function (data, extend, callback) {
    async.waterfall([
        function (cb) {
            userRelationDB.getOne({find: {user_id: data.user_id, other_id: data.other_user_id}}, cb);
        },
        function (user, cb) {
            if (!user) {
                userRelationDB.add({
                    user_id: data.user_id,    //自己id
                    other_id: data.other_user_id,   //对方id
                    extend: extend ? extend : ''
                }, cb);
            } else {
                return cb(null, null, null);
            }
        },
        function (supply, count, cb) {
            userRelationDB.getOne({find: {user_id: data.other_user_id, other_id: data.user_id}}, cb);
        },
        function (user, cb) {
            if (!user) {
                userRelationDB.add({
                    user_id: data.other_user_id,    //自己id
                    other_id: data.user_id,         //对方id
                    extend: data.friend_extend
                }, cb);
            } else {
                return cb(null, null, null);
            }
        },
        function (supply, count, cb) {
            cb();
        },
    ], function (err) {
        if (err) {
            return callback(err);
        }
        callback();
    });
};

exports.agreeWork = function (data, callback) {
    var companyRelationData = {};
    var type;
    async.waterfall([
        function (cb) {
            switch (data.extend) {
                case config_common.company_type.STORE:
                    companyRelationData = {
                        self_id: data.company_id,
                        other_id: data.other_company_id,
                        other_type: config_common.company_category.STORE
                    };
                    companyRelationDB.getCount(companyRelationData, cb);
                    break;
                case config_common.company_type.TRAFFIC:
                    companyRelationData = {
                        self_id: data.company_id,
                        other_id: data.other_company_id,
                        other_type: config_common.company_category.TRAFFIC
                    };
                    companyRelationDB.getCount(companyRelationData, cb);
                    break;
                case config_common.company_type.SALE:
                    companyRelationData = {
                        self_id: data.company_id,
                        other_id: data.other_company_id,
                        other_type: config_common.company_category.TRADE
                    };
                    companyRelationDB.getCount(companyRelationData, cb);
                    break;
                case config_common.company_type.PURCHASE:
                    companyRelationData = {
                        self_id: data.other_company_id,
                        other_id: data.company_id
                    };
                    lib_company.getOne({
                        find: {_id: data.company_id}
                    }, function (err, company) {
                        if (err) {
                            return cb(err);
                        }
                        // if (company.type === config_common.company_category.TRADE) {
                        //     companyRelationData.other_type = config_common.company_category.TRADE;
                        // } else if(company.type === config_common.company_category.STORE){
                        //     companyRelationData.other_type = config_common.company_category.STORE;
                        // }else {
                        //     companyRelationData.other_type = config_common.company_category.TRAFFIC;
                        // }
                        companyRelationData.other_type = company.type;
                        companyRelationDB.getCount(companyRelationData, cb);
                    });
                    break;
            }
        },
        function (count, cb) {
            if (count) {
                cb(null, null, 0);
            } else {
                companyRelationDB.add(companyRelationData, cb);
            }
        },
        function (companyRelation, count, cb) {
            workRelationDB.getCount({
                user_id: data.user_id,                  //自己id
                company_id: data.company_id,            //自己公司id
                other_user_id: data.other_user_id,      //对方id
                other_company_id: data.other_company_id,//对方公司id
                type: data.extend
            }, cb);
        },
        function (count, cb) {
            if (count) {
                cb(null, null, null);
            } else {
                workRelationDB.add({
                    user_id: data.user_id,                  //自己id
                    company_id: data.company_id,            //自己公司id
                    other_user_id: data.other_user_id,      //对方id
                    other_company_id: data.other_company_id,//对方公司id
                    type: data.extend
                }, cb);
            }
        },
        function (supply, count, cb) {
            if (data.extend === config_common.company_type.TRAFFIC ||
                data.extend === config_common.company_type.STORE) {
                type = config_common.company_type.PURCHASE;
            } else if (data.extend === config_common.company_type.PURCHASE) {
                if (companyRelationData.other_type === config_common.company_category.TRAFFIC) {
                    type = config_common.company_type.TRAFFIC;
                } else if (companyRelationData.other_type === config_common.company_category.STORE) {
                    type = config_common.company_type.STORE;
                } else {
                    type = config_common.company_type.SALE;
                }
            } else {
                type = config_common.company_type.PURCHASE;
            }
            workRelationDB.getCount({
                user_id: data.other_user_id,            //自己id
                company_id: data.other_company_id,      //自己公司id
                other_user_id: data.user_id,            //对方id
                other_company_id: data.company_id,      //对方公司id
                type: type
            }, cb);
        },
        function (count, cb) {
            if (count) {
                cb();
            } else {
                workRelationDB.add({
                    user_id: data.other_user_id,            //自己id
                    company_id: data.other_company_id,      //自己公司id
                    other_user_id: data.user_id,            //对方id
                    other_company_id: data.company_id,      //对方公司id
                    type: type
                }, cb);
            }
        }
    ], function (err) {
        if (err) {
            return callback(err);
        }
        callback();
    });
};

exports.addDriverToTraffic = function (user_id, other_user_id, callback) {
    var userData;
    var otherData;
    async.waterfall([
        function (cb) {
            lib_user.getListAll({find: {_id: {$in: [user_id, other_user_id]}}}, cb);
        },
        function (users, cb) {
            if (users.length !== 2) {
                return cb('user_not_found');
            } else {
                if (users[0]._id.toString() === user_id) {
                    userData = users[0];
                    otherData = users[1];
                } else {
                    otherData = users[0];
                    userData = users[1];
                }
            }
            if (userData.role !== (config_common.user_roles.TRAFFIC_DRIVER_PRIVATE ||
                    config_common.user_roles.TRAFFIC_ADMIN ||
                    config_common.user_roles.TRAFFIC_CAPTAIN ||
                    config_common.user_roles.TRAFFIC_EMPLOYEE) ||
                !config_common.checkUserCompany(otherData)) {
                return cb('not_allow');
            }
            driverVerifyDB.getCount({
                user_id: userData._id.toString(),
                approve_id: otherData._id.toString(),
                company_id: otherData.company_id[0]
            }, cb);
        },
        function (count, cb) {
            if (count) {
                return cb('not_allow');
            }
            add({
                user_id: otherData._id.toString(),        //自己id
                company_id: otherData.company_id[0],      //自己公司id
                other_user_id: userData._id.toString(),   //对方id
                type: config_common.relation_style.COMPANY_SUPPLY,            //好友、公司邀请、公司申请、合作
                extend: config_common.user_roles.TRAFFIC_DRIVER_PRIVATE          //根据type扩展此字段内容
            }, cb);
        }
    ], function (err) {
        if (err) {
            return callback(err);
        }
        //判断用户类型，跳转不同页面；
        var role;
        if (config_common.checkTradeCompanyByRole(userData.role)) {
            role = 'trade.new_message';
        } else {
            role = 'rsc.new_relation';
        }
        lib_http.sendMsgServerNoToken({
            title: '互联网+',
            user_ids: JSON.stringify([other_user_id]),
            content: '挂靠司机' + userData.real_name + '向您申请挂靠，请点击查看',
            data: JSON.stringify({
                params: {id: userData._id, url: role, type: "rsc.new_relation"},
                url: role
            })
        }, config_api_url.msg_server_push);
        callback();
    });
};

exports.addTrafficToDriver = function (user_id, other_user_id, callback) {
    var userData;
    var otherData;
    async.waterfall([
        function (cb) {
            lib_user.getListAll({find: {_id: {$in: [user_id, other_user_id]}}}, cb);
        },
        function (users, cb) {
            if (users.length !== 2) {
                return cb('user_not_found');
            } else {
                if (users[0]._id.toString() == user_id) {
                    userData = users[0];
                    otherData = users[1];
                } else {
                    otherData = users[0];
                    userData = users[1];
                }
            }
            if (userData.role !== config_common.user_roles.TRAFFIC_ADMIN || !config_common.checkUserCompany(userData)) {
                return cb('not_allow');
            }
            if (otherData.role == config_common.user_roles.TRAFFIC_DRIVER_PRIVATE) {
                driverVerifyDB.getCount({
                    user_id: otherData._id.toString(),
                    company_id: userData.company_id[0]
                }, cb);
            } else {
                return cb('not_allow');
            }
        },
        function (count, cb) {
            if (count) {
                return cb('not_allow');
            } else {
                add({
                    user_id: otherData._id.toString(),        //自己id
                    other_user_id: userData._id.toString(),   //对方id
                    other_company_id: userData.company_id,
                    type: config_common.relation_style.COMPANY_INVITE,            //好友、公司邀请、公司申请、合作
                    extend: config_common.user_roles.TRAFFIC_DRIVER_PRIVATE          //根据type扩展此字段内容
                }, cb);
            }
        }
    ], function (err) {
        if (err) {
            return callback(err);
        }
        //判断用户类型，跳转不同页面；
        var role;
        if (config_common.checkTradeCompanyByRole(userData.role)) {
            role = 'trade.new_message';
        } else {
            role = 'traffic.new_message';
        }
        lib_company.getOneTraffic({
            find: {_id: otherData.company_id},
            select: 'nick_name'
        }, function (err, company) {
            if (!err && company) {
                lib_http.sendMsgServerNoToken({
                    title: '互联网+',
                    user_ids: JSON.stringify([other_user_id]),
                    content: company.nick_name + otherData.real_name + '向您申请合作，请点击查看',
                    data: JSON.stringify({params: {id: userData._id, url: role, type: "rsc.new_relation"}})
                }, config_api_url.msg_server_push);
            }
        });
        callback();
    });
};

exports.addStoreToTrade = function (user_id, other_user_id, callback) {
    var userData;
    var otherData;
    async.waterfall([
        function (cb) {
            lib_user.getListAll({find: {_id: {$in: [user_id, other_user_id]}}}, cb);
        },
        function (users, cb) {
            if (users.length !== 2) {
                return cb('user_not_found');
            } else {
                if (users[0]._id.toString() === user_id) {
                    userData = users[0];
                    otherData = users[1];
                } else {
                    otherData = users[0];
                    userData = users[1];
                }
            }
            if (userData.role !== config_common.user_roles.TRADE_STORAGE || !config_common.checkUserCompany(userData)) {
                return cb('not_allow');
            }
            if (config_common.checkTradeCompanyByRole(otherData.role) && config_common.checkUserCompany(otherData)) {
                // companyRelationDB.getCount({
                //     self_id: otherData.company_id,            //自己公司id
                //     other_id: userData.company_id,     //对方公司id
                //     other_type: config_common.company_type.STORE   //other_user_id是user_id的type
                // }, cb);
                workRelationDB.getCount({
                    user_id: userData._id.toString(),           //自己id
                    company_id: userData.company_id,            //自己公司id
                    other_user_id: otherData._id.toString(),    //对方id
                    other_company_id: otherData.company_id,     //对方公司id
                    type: config_common.company_type.PURCHASE   //other_user_id是user_id的type
                }, cb);
            } else {
                return cb('not_allow');
            }
        },
        function (count, cb) {
            if (count) {
                return cb('not_allow');
            } else {
                add({
                    user_id: otherData._id.toString(),        //自己id
                    company_id: otherData.company_id.toString(),      //自己公司id
                    other_user_id: userData._id.toString(),   //对方id
                    other_company_id: userData.company_id,
                    type: config_common.relation_style.WORK,            //好友、公司邀请、公司申请、合作
                    extend: config_common.company_type.STORE            //根据type扩展此字段内容
                }, cb);
            }
        }
    ], function (err) {
        if (err) {
            return callback(err);
        }
        //判断用户类型，跳转不同页面；
        var role;
        // if (config_common.checkTradeCompanyByRole(userData.role)) {
        //     role = 'trade.new_message';
        // } else {
        //     role = 'traffic.new_message';
        // }
        // lib_company.getOneTraffic({
        //     find: {_id: otherData.company_id},
        //     select: 'nick_name'
        // }, function (err, company) {
        //     if (!err && company) {
        //         lib_http.sendMsgServerNoToken({
        //             title: '互联网+',
        //             user_ids: JSON.stringify([other_user_id]),
        //             content: company.nick_name + otherData.real_name + '向您申请合作，请点击查看',
        //             data: JSON.stringify({params: {id: userData._id, url: role}})
        //         }, config_api_url.msg_server_push);
        //     }
        // });
        callback();
    });
};

exports.addTradeToStore = function (user_id, other_user_id, callback) {
    var userData;
    var otherData;
    async.waterfall([
        function (cb) {
            lib_user.getListAll({find: {_id: {$in: [user_id, other_user_id]}}}, cb);
        },
        function (users, cb) {
            if (users.length !== 2) {
                return cb('user_not_found');
            } else {
                if (users[0]._id.toString() === user_id) {
                    userData = users[0];
                    otherData = users[1];
                } else {
                    otherData = users[0];
                    userData = users[1];
                }
            }
            if (!config_common.checkTradeCompanyByRole(userData.role) || !config_common.checkUserCompany(userData)) {
                return cb('not_allow');
            }
            if (otherData.role === config_common.user_roles.TRADE_STORAGE && config_common.checkUserCompany(otherData)) {
                // companyRelationDB.getCount({
                //     self_id: userData.company_id,            //自己公司id
                //     other_id: otherData.company_id,     //对方公司id
                //     other_type: config_common.company_type.STORE   //other_user_id是user_id的type
                // }, cb);
                workRelationDB.getCount({
                    user_id: userData._id.toString(),           //自己id
                    company_id: userData.company_id,            //自己公司id
                    other_user_id: otherData._id.toString(),    //对方id
                    other_company_id: otherData.company_id,     //对方公司id
                    type: config_common.company_type.STORE      //other_user_id是user_id的type
                }, cb);
            } else {
                return cb('not_allow');
            }
        },
        function (count, cb) {
            if (count) {
                return cb('not_allow');
            } else {
                add({
                    user_id: otherData._id.toString(),        //自己id
                    company_id: otherData.company_id,      //自己公司id
                    other_user_id: userData._id.toString(),   //对方id
                    other_company_id: userData.company_id,
                    type: config_common.relation_style.WORK,            //好友、公司邀请、公司申请、合作
                    extend: config_common.company_type.PURCHASE          //根据type扩展此字段内容
                }, cb);
            }
        }
    ], function (err) {
        if (err) {
            return callback(err);
        }
        //判断用户类型，跳转不同页面；
        // var role;
        // if (config_common.checkTradeCompanyByRole(userData.role)) {
        //     role = 'trade.new_message';
        // } else {
        //     role = 'traffic.new_message';
        // }
        // lib_company.getOneTraffic({
        //     find: {_id: otherData.company_id},
        //     select: 'nick_name'
        // }, function (err, company) {
        //     if (!err && company) {
        //         lib_http.sendMsgServerNoToken({
        //             title: '互联网+',
        //             user_ids: JSON.stringify([other_user_id]),
        //             content: company.nick_name + otherData.real_name + '向您申请合作，请点击查看',
        //             data: JSON.stringify({params: {id: userData._id, url: role}})
        //         }, config_api_url.msg_server_push);
        //     }
        // });
        callback();
    });
};

exports.addTrafficToTrade = function (user_id, other_user_id, callback) {
    var userData;
    var otherData;
    async.waterfall([
        function (cb) {
            lib_user.getListAll({find: {_id: {$in: [user_id, other_user_id]}}}, cb);
        },
        function (users, cb) {
            if (users.length !== 2) {
                return cb('user_not_found');
            } else {
                if (users[0]._id.toString() == user_id) {
                    userData = users[0];
                    otherData = users[1];
                } else {
                    otherData = users[0];
                    userData = users[1];
                }
            }


            if ((userData.role !== config_common.user_roles.TRAFFIC_ADMIN &&
                    userData.role !== config_common.user_roles.TRAFFIC_EMPLOYEE &&
                    userData.role !== config_common.user_roles.TRAFFIC_CAPTAIN) ||
                !config_common.checkUserCompany(userData)) {
                return cb('not_allow');
            }
            if (config_common.checkTradeCompanyByRole(otherData.role) && config_common.checkUserCompany(otherData)) {
                workRelationDB.getCount({
                    user_id: userData._id.toString(),           //自己id
                    company_id: userData.company_id,            //自己公司id
                    other_user_id: otherData._id.toString(),    //对方id
                    other_company_id: otherData.company_id,     //对方公司id
                    type: config_common.company_type.PURCHASE   //other_user_id是user_id的type
                }, cb);
            } else {
                return cb('not_allow');
            }
        },
        function (count, cb) {
            if (count) {
                return cb('not_allow');
            } else {
                add({
                    user_id: otherData._id.toString(),        //自己id
                    company_id: otherData.company_id.toString(),      //自己公司id
                    other_user_id: userData._id.toString(),   //对方id
                    other_company_id: userData.company_id,
                    type: config_common.relation_style.WORK,            //好友、公司邀请、公司申请、合作
                    extend: config_common.company_type.TRAFFIC          //根据type扩展此字段内容
                }, cb);
            }
        }
    ], function (err) {
        if (err) {
            return callback(err);
        }
        //判断用户类型，跳转不同页面；
        var role;
        if (config_common.checkTradeCompanyByRole(userData.role)) {
            role = 'trade.new_message';
        } else {
            role = 'traffic.new_message';
        }
        lib_company.getOneTraffic({
            find: {_id: otherData.company_id},
            select: 'nick_name'
        }, function (err, company) {
            if (!err && company) {
                lib_http.sendMsgServerNoToken({
                    title: '互联网+',
                    user_ids: JSON.stringify([other_user_id]),
                    content: company.nick_name + otherData.real_name + '向您申请合作，请点击查看',
                    data: JSON.stringify({params: {id: userData._id, url: role, type: "rsc.new_relation"}})
                }, config_api_url.msg_server_push);
            }
        });
        callback();
    });
};

exports.addTradeToTraffic = function (user_id, other_user_id, callback) {
    var userData;
    var otherData;
    async.waterfall([
        function (cb) {
            lib_user.getListAll({find: {_id: {$in: [user_id, other_user_id]}}}, cb);
        },
        function (users, cb) {
            if (users.length !== 2) {
                return cb('user_not_found');
            } else {
                if (users[0]._id.toString() == user_id) {
                    userData = users[0];
                    otherData = users[1];
                } else {
                    otherData = users[0];
                    userData = users[1];
                }
            }
            if (!config_common.checkTradeCompanyByRole(userData.role) || !config_common.checkUserCompany(userData)) {
                return cb('not_allow');
            }
            if (config_common.checkTrafficCompanyByRole(otherData.role) && config_common.checkUserCompany(otherData)) {
                workRelationDB.getCount({
                    user_id: userData._id.toString(),           //自己id
                    company_id: userData.company_id,            //自己公司id
                    other_user_id: otherData._id.toString(),    //对方id
                    other_company_id: otherData.company_id,     //对方公司id
                    type: config_common.company_type.TRAFFIC   //other_user_id是user_id的type
                }, cb);
            } else {
                return cb('not_allow');
            }
        },
        function (count, cb) {
            if (count) {
                return cb('not_allow');
            } else {
                add({
                    user_id: otherData._id.toString(),        //自己id
                    company_id: otherData.company_id[0],      //自己公司id
                    other_user_id: userData._id.toString(),   //对方id
                    other_company_id: userData.company_id,
                    type: config_common.relation_style.WORK,            //好友、公司邀请、公司申请、合作
                    extend: config_common.company_type.PURCHASE          //根据type扩展此字段内容
                }, cb);
            }
        }
    ], function (err) {
        if (err) {
            return callback(err);
        }
        //判断用户类型，跳转不同页面；
        var role;
        if (config_common.checkTradeCompanyByRole(userData.role)) {
            role = 'trade.new_message';
        } else {
            role = 'traffic.new_message';
        }
        lib_company.getOneTraffic({
            find: {_id: otherData.company_id},
            select: 'nick_name'
        }, function (err, company) {
            if (!err && company) {
                lib_http.sendMsgServerNoToken({
                    title: '互联网+',
                    user_ids: JSON.stringify([other_user_id]),
                    content: company.nick_name + otherData.real_name + '向您申请合作，请点击查看',
                    data: JSON.stringify({params: {id: userData._id, url: role, type: "rsc.new_relation"}})
                }, config_api_url.msg_server_push);
            }
        });
        callback();
    });
};

exports.addPurchaseToSale = function (user_id, other_user_id, callback) {
    var userData;
    var otherData;
    async.waterfall([
        function (cb) {
            lib_user.getListAll({find: {_id: {$in: [user_id, other_user_id]}}}, cb);
        },
        function (users, cb) {
            if (users.length !== 2) {
                return cb('user_not_found');
            } else {
                if (users[0]._id.toString() == user_id) {
                    userData = users[0];
                    otherData = users[1];
                } else {
                    otherData = users[0];
                    userData = users[1];
                }
            }
            if ((userData.role !== config_common.user_roles.TRADE_PURCHASE && userData.role !== config_common.user_roles.TRADE_ADMIN) ||
                !config_common.checkUserCompany(userData) ||
                (otherData.role !== config_common.user_roles.TRADE_SALE && otherData.role !== config_common.user_roles.TRADE_ADMIN) ||
                !config_common.checkUserCompany(otherData)) {
                return cb('not_allow');
            }
            workRelationDB.getCount({
                user_id: userData._id.toString(),           //自己id
                company_id: userData.company_id,            //自己公司id
                other_user_id: otherData._id.toString(),    //对方id
                other_company_id: otherData.company_id,     //对方公司id
                type: config_common.company_type.SALE            //other_user_id是user_id的type
            }, cb);
        },
        function (count, cb) {
            if (count) {
                return cb('not_allow');
            }
            add({
                user_id: otherData._id.toString(),        //自己id
                company_id: otherData.company_id,      //自己公司id
                other_user_id: userData._id.toString(),   //对方id
                other_company_id: userData.company_id,
                type: config_common.relation_style.WORK,            //好友、公司邀请、公司申请、合作
                extend: config_common.company_type.PURCHASE          //根据type扩展此字段内容
            }, cb);
        }
    ], function (err) {
        if (err) {
            return callback(err);
        }
        //判断用户类型，跳转不同页面；
        var role;
        if (config_common.checkTradeCompanyByRole(userData.role)) {
            role = 'trade.new_message';
        } else {
            role = 'traffic.new_message';
        }
        lib_company.getOneTraffic({
            find: {_id: otherData.company_id},
            select: 'nick_name'
        }, function (err, company) {
            if (!err && company) {
                lib_http.sendMsgServerNoToken({
                    title: '互联网+',
                    user_ids: JSON.stringify([other_user_id]),
                    content: company.nick_name + otherData.real_name + '向您申请合作，请点击查看',
                    data: JSON.stringify({params: {id: userData._id, url: role, type: "rsc.new_relation"}})
                }, config_api_url.msg_server_push);
            }
        });
        callback();
    });
};

exports.addSaleToPurchase = function (user_id, other_user_id, callback) {
    var userData;
    var otherData;
    async.waterfall([
        function (cb) {
            lib_user.getListAll({find: {_id: {$in: [user_id, other_user_id]}}}, cb);
        },
        function (users, cb) {
            if (users.length !== 2) {
                return cb('user_not_found');
            } else {
                if (users[0]._id.toString() == user_id) {
                    userData = users[0];
                    otherData = users[1];
                } else {
                    otherData = users[0];
                    userData = users[1];
                }
            }
            if ((userData.role !== config_common.user_roles.TRADE_SALE && userData.role !== config_common.user_roles.TRADE_ADMIN) ||
                !config_common.checkUserCompany(userData) ||
                (otherData.role !== config_common.user_roles.TRADE_PURCHASE && otherData.role !== config_common.user_roles.TRADE_ADMIN) ||
                !config_common.checkUserCompany(otherData)) {
                return cb('not_allow');
            }
            workRelationDB.getCount({
                user_id: userData._id.toString(),           //自己id
                company_id: userData.company_id,            //自己公司id
                other_user_id: otherData._id.toString(),    //对方id
                other_company_id: otherData.company_id,     //对方公司id
                type: config_common.company_type.PURCHASE            //other_user_id是user_id的type
            }, cb);
        },
        function (count, cb) {
            if (count) {
                return cb('not_allow');
            }
            add({
                user_id: otherData._id.toString(),        //自己id
                company_id: otherData.company_id,      //自己公司id
                other_user_id: userData._id.toString(),   //对方id
                other_company_id: userData.company_id,
                type: config_common.relation_style.WORK,            //好友、公司邀请、公司申请、合作
                extend: config_common.company_type.SALE          //根据type扩展此字段内容
            }, cb);
        }
    ], function (err) {
        if (err) {
            return callback(err);
        }
        //判断用户类型，跳转不同页面；
        var role;
        if (config_common.checkTradeCompanyByRole(userData.role)) {
            role = 'trade.new_message';
        } else {
            role = 'traffic.new_message';
        }
        lib_company.getOneTraffic({
            find: {_id: otherData.company_id},
            select: 'nick_name'
        }, function (err, company) {
            if (!err && company) {
                lib_http.sendMsgServerNoToken({
                    title: '互联网+',
                    user_ids: JSON.stringify([other_user_id]),
                    content: company.nick_name + otherData.real_name + '向您申请合作，请点击查看',
                    data: JSON.stringify({params: {id: userData._id, url: role, type: "rsc.new_relation"}})
                }, config_api_url.msg_server_push);
            }
        });
        callback();
    });
};

exports.addStoreToTraffic = function (user_id, other_user_id, callback) {
    var userData;
    var otherData;
    async.waterfall([
        function (cb) {
            lib_user.getListAll({find: {_id: {$in: [user_id, other_user_id]}}}, cb);
        },
        function (users, cb) {
            if (users.length !== 2) {
                return cb('user_not_found');
            } else {
                if (users[0]._id.toString() === user_id) {
                    userData = users[0];
                    otherData = users[1];
                } else {
                    otherData = users[0];
                    userData = users[1];
                }
            }
            if (userData.role !== config_common.user_roles.TRADE_STORAGE || !config_common.checkUserCompany(userData)) {
                return cb('not_allow');
            }
            if (config_common.checkTrafficCompanyByRole(otherData.role) && config_common.checkUserCompany(otherData)) {
                workRelationDB.getCount({
                    user_id: userData._id.toString(),           //自己id
                    company_id: userData.company_id,            //自己公司id
                    other_user_id: otherData._id.toString(),    //对方id
                    other_company_id: otherData.company_id[0],     //对方公司id
                    type: config_common.company_type.PURCHASE   //other_user_id是user_id的type
                }, cb);
            } else {
                return cb('not_allow');
            }
        },
        function (count, cb) {
            if (count) {
                return cb('not_allow');
            } else {
                add({
                    user_id: otherData._id.toString(),        //自己id
                    company_id: otherData.company_id[0],      //自己公司id
                    other_user_id: userData._id.toString(),   //对方id
                    other_company_id: userData.company_id,
                    type: config_common.relation_style.WORK,            //好友、公司邀请、公司申请、合作
                    extend: config_common.company_type.STORE            //根据type扩展此字段内容
                }, cb);
            }
        }
    ], function (err) {
        if (err) {
            return callback(err);
        }
        callback();
    });
};

exports.addTrafficToStore = function (user_id, other_user_id, callback) {
    var userData;
    var otherData;
    async.waterfall([
        function (cb) {
            lib_user.getListAll({find: {_id: {$in: [user_id, other_user_id]}}}, cb);
        },
        function (users, cb) {
            if (users.length !== 2) {
                return cb('user_not_found');
            } else {
                if (users[0]._id.toString() === user_id) {
                    userData = users[0];
                    otherData = users[1];
                } else {
                    otherData = users[0];
                    userData = users[1];
                }
            }
            if (!config_common.checkTrafficCompanyByRole(userData.role) || !config_common.checkUserCompany(userData)) {
                return cb('not_allow');
            }
            if (otherData.role === config_common.user_roles.TRADE_STORAGE && config_common.checkUserCompany(otherData)) {
                workRelationDB.getCount({
                    user_id: userData._id.toString(),           //自己id
                    company_id: userData.company_id[0],            //自己公司id
                    other_user_id: otherData._id.toString(),    //对方id
                    other_company_id: otherData.company_id,     //对方公司id
                    type: config_common.company_type.STORE      //other_user_id是user_id的type
                }, cb);
            } else {
                return cb('not_allow');
            }
        },
        function (count, cb) {
            if (count) {
                return cb('not_allow');
            } else {
                add({
                    user_id: otherData._id.toString(),        //自己id
                    company_id: otherData.company_id,      //自己公司id
                    other_user_id: userData._id.toString(),   //对方id
                    other_company_id: userData.company_id[0],
                    type: config_common.relation_style.WORK,            //好友、公司邀请、公司申请、合作
                    extend: config_common.company_type.PURCHASE          //根据type扩展此字段内容
                }, cb);
            }
        }
    ], function (err) {
        if (err) {
            return callback(err);
        }
        callback();
    });
};

//个人用户加入
function userSelfJoinCompany(user, cb) {
    if (user.role === config_common.user_roles.TRADE_PURCHASE ||
        user.role === config_common.user_roles.TRADE_SALE ||
        user.role === config_common.user_roles.TRADE_ADMIN) {
        async.waterfall([
            function (cbk) {
                lib_http.sendTradeServer({user_id: user._id.toString()}, config_api_url.trade_server_update_send_history_status, cbk);
            }
        ], cb);
    } else {
        cb();
    }
};

//企业身份用户加入
function userCompanySelfJoinCompany(user, company, cb) {
    if (user.role === config_common.user_roles.TRADE_PURCHASE ||
        user.role === config_common.user_roles.TRADE_SALE ||
        user.role === config_common.user_roles.TRADE_ADMIN) {
        async.waterfall([
            function (cbk) {
                lib_http.sendTradeServer({user_id: user._id.toString()}, config_api_url.trade_server_update_send_history_status, cbk);
            },
            function (count, cbk) {
                lib_http.sendTradeServer({
                    user_id: user._id.toString(),
                    company_id: company._id.toString(),
                    company_name: company.nick_name
                }, config_api_url.trade_server_update_partake_company, cbk);
            }
        ], cb);
    } else {
        cb();
    }
};

//根据双方的数据查询双方friend存在的类型
exports.checkFriendStatus = function (selfData, otherData, callback) {
    async.waterfall([
        function (cb) {
            switch (selfData.role) {
                case config_common.user_roles.TRADE_ADMIN:
                case config_common.user_roles.TRADE_PURCHASE:
                case config_common.user_roles.TRADE_SALE:
                    //自己是交易角色
                    cb(null, 'trade');
                    break;
                case config_common.user_roles.TRAFFIC_ADMIN:
                    //自己是物流角色
                    cb(null, 'traffic');
                    break;
                case config_common.user_roles.TRAFFIC_DRIVER_PRIVATE:
                    //自己是司机角色
                    cb(null, 'driver');
                    break;
                default :
                    console.log('角色不够用了，请添加新的角色分类!!!')
                    cb(null, null);
                    break;
            }
        },
        function (role, cb) {
            switch (otherData.role) {
                case config_common.user_roles.TRADE_ADMIN:
                case config_common.user_roles.TRADE_PURCHASE:
                case config_common.user_roles.TRADE_SALE:
                    //自己是交易角色
                    cb(null, role + '_trade');
                    break;
                case config_common.user_roles.TRAFFIC_ADMIN:
                    //自己是物流角色
                    cb(null, role + '_traffic');
                    break;
                case config_common.user_roles.TRAFFIC_DRIVER_PRIVATE:
                    //自己是司机角色
                    cb(null, role + '_driver');
                    break;
                default :
                    console.log('角色不够用了，请添加新的角色分类!!!')
                    cb(null, null);
                    break;
            }
        }
    ], callback);
};
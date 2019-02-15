/**
 * Created by Administrator on 2017/12/5.
 */
var _ = require('underscore');
var async = require('async');
var express = require('express');
var sdk_im_wangyiyunxin = require('../../sdks/im_wangyiyunxin/sdk_im_wangyiyunxin');

module.exports = function () {
    var api = express.Router();

    api.use(require('../../middlewares/mid_verify_user')());

    api.post('/add', function (req, res, next) {
        if (!req.body.name ||
            (!_.isArray(req.body.user_ids) && !_.isArray(req.body.invite_ids)) ||
            !global.config_common.relation_group_type[req.body.type]
        ) {
            return next('invalid_format');
        }
        var new_group_id;
        async.waterfall([
            function (cb) {
                if (req.body.user_ids.length) {
                    global.lib_user.getCountAll({
                        _id: {$in: req.body.user_ids}
                    }, cb);
                } else {
                    cb(null, 0);
                }
            },
            function (count, cb) {
                if (count !== req.body.user_ids.length) {
                    return cb('not_found');
                }
                if (req.body.invite_ids.length) {
                    global.lib_invitation_user.getCount({
                        _id: {$in: req.body.invite_ids}
                    }, cb);
                } else {
                    cb(null, 0);
                }
            },
            function (count, cb) {
                if (count !== req.body.invite_ids.length) {
                    return cb('not_found');
                }
                var data = {
                    name: req.body.name,
                    type: req.body.type
                };
                if (req.body.type === global.config_common.relation_group_type.DRIVER) {
                    data.company_id = req.decoded.company_id.toString();
                    data.user_id = req.decoded.id;
                } else if (req.body.type === global.config_common.relation_group_type.COLLEAGUE) {
                    data.company_id = req.decoded.company_id.toString();
                } else {
                    data.user_id = req.decoded.id;
                }
                global.lib_relation_group.addGroup(data, cb);
            },
            function (group, count, cb) {
                var arr = [];
                new_group_id = group._id.toString();
                if (req.body.user_ids.length) {
                    for (var i = 0; i < req.body.user_ids.length; i++) {
                        var member_id = req.body.user_ids[i];
                        var data1 = {
                            member_id: member_id,           //组员id
                            type: req.body.type,            //类型跟组类型一致
                            group_id: group._id.toString()  //所属公司id
                        };
                        if (req.body.type === global.config_common.relation_group_type.DRIVER) {
                            data1.company_id = req.decoded.company_id.toString();
                            data1.user_id = req.decoded.id;
                        } else if (req.body.type === global.config_common.relation_group_type.COLLEAGUE) {
                            data1.company_id = req.decoded.company_id.toString();
                        } else {
                            data1.user_id = req.decoded.id;
                        }
                        arr.push(data1);
                    }
                }
                if (req.body.invite_ids.length) {
                    for (var j = 0; j < req.body.invite_ids.length; j++) {
                        var invite_id = req.body.invite_ids[j];
                        var data2 = {
                            invite_id: invite_id,       //组员id
                            type: req.body.type,        //类型跟组类型一致
                            group_id: group._id.toString()     //所属公司id
                        };
                        if (req.body.type === global.config_common.relation_group_type.DRIVER) {
                            data2.user_id = req.decoded.id;
                            data2.company_id = req.decoded.company_id;
                        }
                        if (req.body.type === global.config_common.relation_group_type.COLLEAGUE) {
                            data2.user_id = req.decoded.id;
                        } else {
                            data2.company_id = req.decoded.company_id;
                        }
                        arr.push(data2);
                    }
                }
                global.lib_relation_group.addGroupUsers(arr, cb);
            }
        ], function (err) {
            if (err) {
                return next(err);
            }
            if (req.body.type === global.config_common.relation_group_type.COLLEAGUE) {
                req.body.user_ids = _.uniq(req.body.user_ids.push(req.decoded.id));
                async.waterfall([
                    function (cb) {
                        var arr = JSON.stringify(req.body.user_ids);
                        sdk_im_wangyiyunxin.createTeam({
                            tname: req.body.name,
                            owner: req.decoded.id,
                            members: arr,
                            msg: '您已加入' + req.body.name + "群组",
                            magree: 0,
                            joinmode: 0,
                            icon: '',
                            intro: '同事群',
                            beinvitemode: 1
                        }, cb);
                    },
                    function (tids, cb) {
                        var tid = JSON.parse(tids)
                        global.lib_team.add({
                            team_id: tid.tid,
                            user_id: req.decoded.id,
                            user_ids: req.body.user_ids,
                            type: req.body.type,
                            group_id: new_group_id
                        }, cb);
                    }
                ], function (err) {
                    if (err) {
                        return next(err);
                    }
                    global.config_common.sendData(req, new_group_id, next);
                })
            } else {
                global.config_common.sendData(req, new_group_id, next);
            }
        });
    });

    api.post('/del', function (req, res, next) {
        if (!_.isArray(req.body.group_id)) {
            return next('invalid_format');
        }
        async.waterfall([
            function (cb) {
                var data = {_id: {$in: req.body.group_id}};
                if (req.body.type === global.config_common.relation_group_type.COLLEAGUE ||
                    req.body.type === global.config_common.relation_group_type.DRIVER) {
                    data.type = {$in: [global.config_common.relation_group_type.DRIVER, global.config_common.relation_group_type.COLLEAGUE]};
                    data.company_id = req.decoded.company_id.toString();
                } else {
                    data.type = req.body.type;
                    data.user_id = req.decoded.id;
                }
                global.lib_relation_group.delGroup(data, cb);
            },
            function (count, cb) {
                global.lib_relation_group.delGroupUser({
                    group_id: {$in: req.body.group_id}
                }, cb);
            }
        ], function (err) {
            if (err) {
                return next(err);
            }
            global.lib_team.delGroup(req, req.body.group_id, function (err, data) {
                if (data.length) {
                    global.config_common.sendData(req, data, next);
                } else {
                    global.config_common.sendData(req, {}, next);
                }
            });
        });
    });

    api.post('/add_user', function (req, res, next) {
        if (!req.body.group_id ||
            !req.body.user_id ||
            !global.config_common.relation_group_type[req.body.group_type]
        ) {
            return next('invalid_format');
        }
        var data1;
        async.waterfall([
            function (cb) {
                var data = {type: req.body.group_type, _id: req.body.group_id};
                if (req.body.group_type === global.config_common.relation_group_type.DRIVER ||
                    req.body.group_type === global.config_common.relation_group_type.COLLEAGUE) {
                    data.company_id = req.decoded.company_id.toString();
                } else {
                    data.user_id = req.decoded.id;
                }
                global.lib_relation_group.getCountGroup(data, cb);
            },
            function (count, cb) {
                if (!count) {
                    return cb('not_allow');
                }
                data1 = {
                    member_id: req.body.user_id,        //组员id
                    type: global.config_common.relation_group_type[req.body.group_type],                //类型跟组类型一致
                    group_id: req.body.group_id         //所属公司id
                };
                if (req.body.group_type === global.config_common.relation_group_type.DRIVER ||
                    req.body.group_type === global.config_common.relation_group_type.COLLEAGUE) {
                    data1.company_id = req.decoded.company_id.toString();
                } else {
                    data1.user_id = req.decoded.id;
                }
                global.lib_relation_group.getOneGroupUser({find: data1}, cb);
            },
            function (count, cb) {
                if (count) {
                    return cb();
                } else {
                    global.lib_relation_group.addGroupUser(data1, cb);
                }
            }
        ], function (err) {
            if (err) {
                return next(err);
            }
            global.config_common.sendData(req, {}, next);
        });
    });

    api.post('/get_list_group', function (req, res, next) {
        if (!global.config_common.relation_group_type[req.body.type]) {
            return next('invalid_format');
        }
        async.waterfall([
            function (cb) {
                var data = {type: req.body.type};
                if (//req.body.type === global.config_common.relation_group_type.DRIVER ||
                req.body.type === global.config_common.relation_group_type.COLLEAGUE) {
                    data.company_id = req.decoded.company_id.toString();
                } else {
                    data.user_id = req.decoded.id;
                }
                global.lib_relation_group.getListGroup({
                    find: data,
                    select: 'name',
                    sort: {time_creation: -1}
                }, cb);
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            //再去查询群组中人的个数
            var list = [];
            async.eachSeries(result, function (oneData, callback) {
                global.lib_relation_group.getCountUser({group_id: oneData._id.toString()}, function (err, count) {
                    if (err) {
                        return next(err);
                    }
                    oneData = JSON.parse(JSON.stringify(oneData));
                    oneData.count = count;
                    list.push(oneData);
                    callback();
                })
            }, function (err) {
                if (err) {
                    return next(err);
                }
                global.config_common.sendData(req, list, next);
            })
        });
    });

    api.post('/get_list_group_user', function (req, res, next) {
        if (!req.body.group_id) {
            return next('invalid_format');
        }
        var memberDatas;
        var userDatas;
        var inviteDatas;
        async.waterfall([
            function (cb) {
                global.lib_relation_group.getOneGroup({find: {_id: req.body.group_id}}, cb);
            },
            function (group, cb) {
                if (!group) {
                    return cb('group_not_found');
                }
                if (group.type === global.config_common.relation_group_type.DRIVER ||
                    group.type === global.config_common.relation_group_type.COLLEAGUE) {
                    if (group.company_id !== req.decoded.company_id.toString()) {
                        return cb('not_allow');
                    }
                } else {
                    if (group.user_id !== req.decoded.id) {
                        return cb('not_allow');
                    }
                }
                global.lib_relation_group.getListGroupUser({
                    find: {group_id: req.body.group_id},
                    sort: {time_creation: -1}
                }, cb);
            },
            function (users, cb) {
                memberDatas = users;
                var user_ids = global.lib_util.transObjArrToSigArr(users, 'invite_id');
                global.lib_invitation_user.getList({find: {_id: {$in: user_ids}}, select: 'real_name role'}, cb);
            },
            function (invitations, cb) {
                inviteDatas = invitations;
                var user_ids = global.lib_util.transObjArrToSigArr(memberDatas, 'member_id');
                global.lib_user.getListAll({find: {_id: {$in: user_ids}}, select: 'real_name role photo_url'}, cb);
            },
            function (users, cb) {
                userDatas = users;
                var company_ids = global.lib_util.transObjArrToSigArr(users, 'company_id');
                global.lib_company.getListAll({find: {_id: {$in: company_ids}}, select: 'nick_name verify_phase'}, cb);
            },
            function (companies, cb) {
                var arr = [];
                var companyObj = global.lib_util.transObjArrToObj(companies, '_id');
                var userObj = global.lib_util.transObjArrToObj(userDatas, '_id');
                var inviteObj = global.lib_util.transObjArrToObj(inviteDatas, '_id');
                for (var i = 0; i < memberDatas.length; i++) {
                    var user_id = memberDatas[i].member_id;
                    var invite_id = memberDatas[i].invite_id;
                    if (user_id) {
                        var user = userObj[user_id];
                        if (user) {
                            var company = companyObj[user.company_id];
                            arr.push({
                                status: true,
                                _id: user_id,
                                user_id: user_id,
                                name: user.real_name,
                                real_name: user.real_name,
                                role: user.role,
                                img: user.photo_url,
                                photo_url: user.photo_url,
                                company_name: company ? company.nick_name : '',
                                verify_phase: company ? company.verify_phase : ''
                            });
                        }
                    } else if (invite_id) {
                        var invite = inviteObj[invite_id];
                        arr.push({
                            _id: invite_id,
                            status: false,
                            name: invite.real_name,
                            real_name: invite.real_name,
                            role: invite.role
                        });
                    }
                }
                cb(null, arr);
            },
            function (list, cb) {
                //循环数据，将相关状态加入数据中
                global.lib_common.editTeamUserData(req, list, cb);
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            global.config_common.sendData(req, result, next);
        });
    });

    //根据人id获取组可分配组列表
    api.post('/get_user_homepage_group', function (req, res, next) {
        if (!req.body.user_id) {
            return next('invalid_format');
        }
        async.waterfall([
            function (cb) {
                global.lib_user.getOne({
                    find: {_id: req.body.user_id}
                }, cb);
            },
            function (user, cb) {
                async.parallel({
                    COLLEAGUE: function (cb) {
                        if (req.decoded.company_id === user.company_id && user.role !== global.config_common.user_roles.TRAFFIC_DRIVER_PRIVATE) {
                            global.lib_relation_group.getListGroup({
                                find: {
                                    type: global.config_common.relation_group_type.COLLEAGUE,
                                    company_id: req.decoded.company_id
                                },
                                select: 'name',
                                sort: {time_creation: -1}
                            }, cb);
                        } else {
                            cb(null, []);
                        }
                    },
                    DRIVER: function (cb) {
                        if (req.decoded.role === global.config_common.user_roles.TRAFFIC_ADMIN &&
                            user.role === global.config_common.user_roles.TRAFFIC_DRIVER_PRIVATE) {
                            global.lib_driver_verify.getCount({
                                user_id: req.body.user_id,
                                company_id: req.decoded.company_id[0]
                            }, function (err, count) {
                                if (err) {
                                    return cb(err);
                                }
                                if (count) {
                                    global.lib_relation_group.getListGroup({
                                        find: {
                                            type: global.config_common.relation_group_type.DRIVER,
                                            company_id: req.decoded.company_id
                                        },
                                        select: 'name',
                                        sort: {time_creation: -1}
                                    }, cb);
                                } else {
                                    cb(null, []);
                                }
                            });
                        } else {
                            cb(null, []);
                        }
                    },
                    FRIEND: function (cb) {
                        global.lib_user_relation.getCount({
                            user_id: req.decoded.id,
                            other_id: req.body.user_id,
                            type: global.config_common.relation_style.FRIEND
                        }, function (err, count) {
                            if (err) {
                                return cb(err);
                            }
                            if (count) {
                                global.lib_relation_group.getListGroup({
                                    find: {
                                        type: global.config_common.relation_group_type.FRIEND,
                                        user_id: req.decoded.id
                                    },
                                    select: 'name',
                                    sort: {time_creation: -1}
                                }, cb);
                            } else {
                                cb(null, []);
                            }
                        });
                    },
                    PURCHASE: function (cb) {
                        global.lib_work_relation.getCount({
                            user_id: req.decoded.id,
                            other_user_id: req.body.user_id,
                            type: global.config_common.company_type.PURCHASE
                        }, function (err, count) {
                            if (err) {
                                return cb(err);
                            }
                            if (count) {
                                global.lib_relation_group.getListGroup({
                                    find: {
                                        type: global.config_common.relation_group_type.PURCHASE,
                                        user_id: req.decoded.id
                                    },
                                    select: 'name',
                                    sort: {time_creation: -1}
                                }, cb);
                            } else {
                                cb(null, []);
                            }
                        });
                    },
                    SALE: function (cb) {
                        global.lib_work_relation.getCount({
                            user_id: req.decoded.id,
                            other_user_id: req.body.user_id,
                            type: global.config_common.company_type.SALE
                        }, function (err, count) {
                            if (err) {
                                return cb(err);
                            }
                            if (count) {
                                global.lib_relation_group.getListGroup({
                                    find: {
                                        type: global.config_common.relation_group_type.SALE,
                                        user_id: req.decoded.id
                                    },
                                    select: 'name',
                                    sort: {time_creation: -1}
                                }, cb);
                            } else {
                                cb(null, []);
                            }
                        });
                    },
                    TRAFFIC: function (cb) {
                        global.lib_work_relation.getCount({
                            user_id: req.decoded.id,
                            other_user_id: req.body.user_id,
                            type: global.config_common.company_type.TRAFFIC
                        }, function (err, count) {
                            if (err) {
                                return cb(err);
                            }
                            if (count) {
                                global.lib_relation_group.getListGroup({
                                    find: {
                                        type: global.config_common.relation_group_type.TRAFFIC,
                                        user_id: req.decoded.id
                                    },
                                    select: 'name',
                                    sort: {time_creation: -1}
                                }, cb);
                            } else {
                                cb(null, []);
                            }
                        });
                    }
                }, cb);
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            global.config_common.sendData(req, result, next);
        });
    });

    return api;
};
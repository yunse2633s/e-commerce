/**
 * Created by Administrator on 2017/3/24.
 */
var async = require('async');
var _ = require('underscore');
var lib_apply_relation = require('./lib_apply_relation');
var lib_relation_group = require('./lib_relation_group');
var lib_user = require('./lib_user');
var invitationUserDB = require('../dbs/db_base')('Invitation_user');
var relationGroupUserDB = require('../dbs/db_base')('Relation_group_user');

var config_common = require('../configs/config_common');

//获取邀请列表
exports.signup = function (user, callback) {
    var friend_extend;
    async.waterfall([
        function (cb) {
            var cond = {phone: user.phone};
            var role;
            if (config_common.checkTradeCompanyByRole(user.role)) {
                role = {
                    $in: [
                        config_common.user_roles.TRADE_ADMIN,
                        config_common.user_roles.TRADE_PURCHASE,
                        config_common.user_roles.TRADE_SALE,
                        config_common.user_roles.TRADE_STORAGE
                    ]
                };
            } else if (user.role === config_common.user_roles.TRADE_STORAGE) {
                role = config_common.user_roles.TRADE_STORAGE;
            } else if (user.role === config_common.user_roles.TRAFFIC_DRIVER_PRIVATE) {
                role = config_common.user_roles.TRAFFIC_DRIVER_PRIVATE;
            } else {
                role = {
                    $in: [
                        config_common.user_roles.TRAFFIC_ADMIN,
                        config_common.user_roles.TRAFFIC_EMPLOYEE,
                        config_common.user_roles.TRAFFIC_CAPTAIN
                    ]
                };
            }
            invitationUserDB.getList({find: cond}, cb);
        },
        function (invites, cb) {
            async.eachSeries(invites, function (invite, cbk) {
                var otherUser;
                async.waterfall([
                    function (callback) {
                        lib_user.getOne({find: {_id: invite.user_id}}, callback);
                    },
                    function (inviteUser, callback) {
                        otherUser = inviteUser;
                        if (invite.type === config_common.relation_style.COMPANY_INVITE) {
                            if (user.role && inviteUser.role && config_common.checkTradeCompanyByRole(user.role) &&
                                config_common.checkTradeCompanyByRole(inviteUser.role)) {
                                invite.status = 'SUCCESS';
                                invite.save(callback);
                            } else if (user.role === config_common.user_roles.TRAFFIC_DRIVER_PRIVATE &&
                                inviteUser.role === config_common.user_roles.TRAFFIC_DRIVER_PRIVATE) {
                                invite.status = 'SUCCESS';
                                invite.save(callback);
                            } else if ((user.role === config_common.user_roles.TRAFFIC_ADMIN ||
                                    user.role === config_common.user_roles.TRAFFIC_EMPLOYEE ||
                                    user.role === config_common.user_roles.TRAFFIC_CAPTAIN) &&
                                (inviteUser.role === config_common.user_roles.TRAFFIC_ADMIN ||
                                    inviteUser.role === config_common.user_roles.TRAFFIC_EMPLOYEE ||
                                    inviteUser.role === config_common.user_roles.TRAFFIC_CAPTAIN )) {
                                invite.status = 'SUCCESS';
                                invite.save(callback);
                            } else if (user.role === config_common.user_roles.TRADE_STORAGE && inviteUser.role === config_common.user_roles.TRAFFIC_ADMIN) {
                                invite.status = 'SUCCESS';
                                invite.save(callback);
                            } else if (user.role === config_common.user_roles.TRADE_STORAGE && inviteUser.role === config_common.user_roles.TRADE_STORAGE) {
                                invite.status = 'SUCCESS';
                                invite.save(callback);
                            } else {
                                callback(null, null, null);
                            }
                        } else {
                            invite.status = 'SUCCESS';
                            invite.save(callback);
                        }
                    },
                    function (data, count, callback) {
                        relationGroupUserDB.getOne({
                            find: {invite_id: invite._id.toString()}
                        }, callback);
                    },
                    function (groupUser, callback) {
                        var role;
                        if (global.config_common.checkTradeCompanyByRole(user.role)) {
                            role = 'trade.new_message';
                        } else {
                            role = 'traffic.new_message';
                        }
                        global.lib_http.sendMsgServerNoToken({
                            title: '邀请成功',
                            user_ids: JSON.stringify([invite.user_id.toString()]),
                            content: '您邀请的' + user.real_name + '已上线,快来开始愉快的交易之旅吧',
                            data: JSON.stringify({
                                params: {id: user._id.toString()},
                                url: role,
                                type: "rsc.new_relation"
                            })
                        }, global.config_api_url.msg_server_push);
                        //发推送结束
                        var data = {};
                        if (invite.type === config_common.relation_style.COMPANY_INVITE) {
                            if (groupUser) {
                                data.group_type = groupUser.type;
                                data.group_id = groupUser.group_id;
                                groupUser.remove();
                            }
                            lib_apply_relation.add(_.extend(data, {
                                user_id: user._id.toString(),       //自己id
                                other_user_id: invite.user_id,      //对方id
                                other_company_id: invite.company_id,//对方公司id
                                type: invite.type,                  //好友、公司邀请、公司申请、合作
                                extend: invite.role                 //根据type扩展此字段内容
                            }), callback);
                        } else {
                            if (groupUser) {
                                data.group_type = groupUser.type;
                                data.group_id = groupUser.group_id;
                                groupUser.remove();
                            }
                            lib_apply_relation.add(_.extend(data, {
                                user_id: user._id.toString(),       //自己id
                                other_user_id: invite.user_id,      //对方id
                                type: invite.type,                  //好友、公司邀请、公司申请、合作
                                extend: invite.extend               //根据type扩展此字段内容
                            }), callback);
                            // lib_apply_relation.agreeFriend2({
                            //     user_id: user._id.toString(),
                            //     other_user_id: invite.user_id,
                            //     friend_extend: invite.extend
                            // }, friend_extend, function (err) {
                            //     if (err) {
                            //         return callback(err);
                            //     }
                            //     if (groupUser) {
                            //         var groupUserData = {
                            //             member_id: user._id.toString(),     //组员id
                            //             type: groupUser.type,               //类型跟组类型一致
                            //             group_id: groupUser.group_id        //所属公司id
                            //         };
                            //         groupUserData.user_id = groupUser.user_id;
                            //         groupUser.remove();
                            //         lib_relation_group.addGroupUser(groupUserData, callback);
                            //     } else {
                            //         callback();
                            //     }
                            // });
                        }
                    }
                ], cbk);

            }, cb);
        }
    ], callback);
};

//增加邀请
var add = function (data, cb) {
    async.waterfall([
        function (callback) {
            invitationUserDB.getOne({find: data}, callback);
        },
        function (relation, callback) {
            if (!relation) {
                invitationUserDB.add(data, callback);
            } else {
                callback(null, relation, 1);
            }
        }
    ], cb);
};
exports.add = add;

//增加邀请列表
exports.addList = function (arr, req, callback) {
    async.eachSeries(arr, function (data, cb) {
        async.waterfall([
            function (cbk) {
                add(data, cbk);
            },
            function (invitation, count, cbk) {
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
            }
        ], cb);
    }, callback);
};


//获取邀请列表
exports.getList = function (data, callback) {
    async.waterfall([
        function (cb) {
            invitationUserDB.getList(data, cb);
        }
    ], callback);
};
//获取邀请列表
exports.getOne = function (data, callback) {
    async.waterfall([
        function (cb) {
            invitationUserDB.getOne(data, cb);
        }
    ], callback);
};

//获取邀请列表
exports.getCount = function (data, callback) {
    async.waterfall([
        function (cb) {
            invitationUserDB.getCount(data, cb);
        }
    ], callback);
};

exports.edit = function (data, callback) {
    async.waterfall([
        function (cb) {
            invitationUserDB.edit(data, cb);
        }
    ], callback);
};

exports.update = function (data, callback) {
    async.waterfall([
        function (cb) {
            invitationUserDB.update(data, cb);
        }
    ], callback);
};

exports.del = function (data, callback) {
    async.waterfall([
        function (cb) {
            invitationUserDB.del(data, cb);
        }
    ], callback);
};
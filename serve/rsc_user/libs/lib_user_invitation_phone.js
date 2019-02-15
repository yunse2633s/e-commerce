/**
 * Created by Administrator on 2017/3/29.
 */

//var userInvitationPhoneDBService = require('../dbs/db_base')('User_invitation_phone');
var async = require('async');
var config_common = require('../configs/config_common');
var userService = require('../libs/lib_user');

// adduserinvitationphone:function(req,phone,company_id,user_id,type,other_type,next) {
//     User_invitation_phone.find({phone:phone,type:type},function (err,userlist) {
//         if(err) next('err');
//         if(userlist.length == 0){

//             entry.save(function (err) {
//                 if(err) next('err');
//             });
//         }
//     });
// },
//
// deleteuserinvitationphone:function(req, phone, type, user_id, next) {
//     User_invitation_phone.remove({phone:phone,type:type, user_id: user_id},function (err) {
//         if(err) next('err');
//     });
// },

//增加关系
exports.add = function (data, next) {
    async.waterfall([
        function (cb) {
            userInvitationPhoneDBService.getOne({find: data}, cb)
        },
        function (userInvitationPhone, cb) {
            if (!userInvitationPhone) {
                userInvitationPhoneDBService.add(data, cb);
            } else {
                cb(null, userInvitationPhone, null);
            }
        }
    ], next);
};

//删除
exports.del = function (data, next) {
    async.waterfall([
        function (count, cb) {
            if (!count) return next('not_fount');
            userInvitationPhoneDBService.del(data, cb);
        }
    ], function (err) {
        if (err) return next(err);
    });
};
exports.delOne = function (data, callback) {
    async.waterfall([
        function (cb) {
            userInvitationPhoneDBService.getCount(data, cb)
        },
        function (count, cb) {
            if (!count) cb('not_fount');
            userInvitationPhoneDBService.del(data, cb);
        }
    ], callback);
};

//获取表数量
exports.getCount = function (data, callback) {
    userInvitationPhoneDBService.getCount(data, callback);
};
//获取列表
exports.getList = function (data, callback) {
    userInvitationPhoneDBService.getCount(data.find, function (err, count) {
        if (err) {
            return callback(err);
        }
        userInvitationPhoneDBService.getList(data, function (err, orders) {
            if (err) {
                return callback(err);
            }
            callback(null, {
                invitation: orders,
                exist: count > data.page * config_common.entry_per_page,
                count: count
            });
        });
    });
};
exports.onlyList = function (data, callback) {
    userInvitationPhoneDBService.getList(data, callback);
};
exports.invCompList = function (data, cb) {
    var invCompTmp = {invitation: [], count: 0};
    async.waterfall([function (waterCb) {
        userInvitationPhoneDBService.getCount(data.find, waterCb);
    }, function (listNum, waterCb) {
        userInvitationPhoneDBService.getList(data, function (err, orders) {
            if (err) {
                return callback(err);
            }
            waterCb(null, {
                invitation: orders,
                count: listNum
            });
        });
    }, function (invCompany, waterCb) {
        invCompTmp.count = invCompany.count;
        async.eachSeries(invCompany.invitation, function (invComp, eachcb) {
            userService.getOne({_id: invComp.user_id}, function (err, user) {
                if (err) {
                    return eachcb(err)
                }
                invComp = invComp.toObject();
                invComp['real_name'] = user.real_name;
                invComp['role'] = user.role;
                invCompTmp['invitation'].push(invComp);//将邀请的电话号码插入到公司关系列表中....
                eachcb();
            })
        }, function () {
            waterCb(null, invCompTmp);
        })
    }], cb);
};

//tmp 待删除
exports.addOne = function (data, callback) {
    async.waterfall([
        function (cb) {
            userInvitationPhoneDBService.getOne({find: data}, cb)
        },
        function (userInvitationPhone, cb) {
            if (!userInvitationPhone) {
                userInvitationPhoneDBService.add(data, cb);
            } else {
                return cb('already_exists')
            }
        }
    ], callback);
};
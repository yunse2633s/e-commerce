var async = require('async');
var _ = require('underscore');

//添加一个角色
//{phone: x,type: x}
exports.add = function (data, callback) {
    var userData;
    async.waterfall([
        //判断人存不存在
        function (cb) {
            global.lib_user_new.getOne({find: {phone: data.phone}}, cb);
        },
        function (user, cb) {
            if(!user){
                global.lib_user_new.add(data, cb);
            }else{
                cb(null, user, 1);
            }
        },
        //判断角色存不存在
        function (user, count, cb) {
            userData = user;
            var cond = {user_id: user._id.toString()};
            switch (data.type){
                case global.config_common.user_type.DRIVER:
                    cond.role = global.config_common.user_roles.TRAFFIC_DRIVER_PRIVATE;
                    data.role = cond.role;
                    break;
                case global.config_common.user_type.TRAFFIC:
                    cond.role = global.config_common.user_roles.TRAFFIC_ADMIN;
                    data.role = cond.role;
                    break;
                case global.config_common.user_type.TRADE:
                    cond.role = {$in: [
                        global.config_common.user_roles.TRADE_ADMIN,
                        global.config_common.user_roles.TRADE_PURCHASE,
                        global.config_common.user_roles.TRADE_SALE
                    ]};
                    data.role = global.config_common.user_roles.TRADE_ADMIN;
                    break;
                case global.config_common.user_type.STORE:
                    cond.role = global.config_common.user_roles.TRADE_STORAGE;
                    data.role = cond.role;
                    break;
                case global.config_common.user_type.OFFICE:
                    cond.role = {$in: [
                        global.config_common.user_roles.OFFICE_ADMIN,
                        global.config_common.user_roles.OFFICE_EMPLOYEE
                    ]};
                    data.role = global.config_common.user_roles.OFFICE_ADMIN;
                    break;
            }
            global.lib_user.getOne({find: cond}, cb);
        },
        function (role, cb) {
            if(!role){
                //继续创建角色
                data.user_id = userData._id.toString();
                global.lib_user.add(data, cb);
            }else{
                cb(null, role, 1, null);
            }
        },
        function (role, count, data, cb) {
            cb(null, _.extend(userData, role));
        }
    ], callback);
};

exports.addRoleCompanyId = function (company_type_id, user_role_id, callback) {
    var userData;
    async.waterfall([
        //判断人存不存在
        function (cb) {
            global.lib_user.getOne({find: {_id: user_role_id}}, cb);
        },
        function (user, cb) {
            if(!user){
                return cb('user_not_found');
            }else{
                user.company_id = company_type_id;
                user.save(cb);
            }
        },
        function (role, count, cb) {
            cb();
        }
    ], callback);
};

exports.getRoleByTerminal= function (type) {
    var role;
    switch (type){
        case global.config_common.user_type.DRIVER:
            role = global.config_common.user_roles.TRAFFIC_DRIVER_PRIVATE;
            break;
        case global.config_common.user_type.TRAFFIC:
            role = global.config_common.user_roles.TRAFFIC_ADMIN;
            break;
        case global.config_common.user_type.TRADE:
            role = [
                global.config_common.user_roles.TRADE_ADMIN,
                global.config_common.user_roles.TRADE_PURCHASE,
                global.config_common.user_roles.TRADE_SALE
            ];
            break;
        case global.config_common.user_type.STORE:
            role = global.config_common.user_roles.TRADE_STORAGE;
            break;
        case global.config_common.user_type.OFFICE:
            role = [
                global.config_common.user_roles.OFFICE_ADMIN,
                global.config_common.user_roles.OFFICE_EMPLOYEE
            ];
            break;
    }
    return role;
};

exports.getRoleCondByTerminal= function (type) {
    var role = this.getRoleByTerminal(type);
    if(_.isArray(role)){
        return {$in: role};
    }else{
        return role;
    }
};
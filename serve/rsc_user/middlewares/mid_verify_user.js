/**
 * Created by Administrator on 2015/11/18.
 */
//通过token进行验证用户登录等信息
var jwt = require('jsonwebtoken');
var config_common = require('../configs/config_common');
var config_version = require('../configs/config_version');
var lib_user = require('../libs/lib_user');

module.exports = function () {
    return function (req, res, next) {
        var token = req.body['x-access-token'] || req.headers['x-access-token'];
        if (token) {
            jwt.verify(token, config_common.secret_keys.user, function (err, decoded) {
                if (err && err.message === 'jwt expired') {
                    return next('jwt_expired');
                } else if (err) {
                    return next('auth_failed_user');
                }
                lib_user.getOne({find: {_id: decoded.id}}, function (err, user) {
                    if (err) {
                        return next('no_token');
                    }
                    if (!user) {
                        return next('user_not_found');
                    }
                    if (user.role === global.config_common.user_roles.TRAFFIC_DRIVER_PRIVATE) {
                        req.decoded = decoded;
                        next();
                    } else if (user.role !== decoded.role) {
                        var a = 'token_change:' + user.role.toString();
                        return next(a);
                    } else if (user.company_id.toString() !== decoded.company_id.toString()) {
                        var a = 'token_change:' + 'company';
                        return next(a);
                    } else {
                        req.decoded = decoded;
                        next();
                    }
                })
            });
        } else {
            next('no_token');
        }
    }
};

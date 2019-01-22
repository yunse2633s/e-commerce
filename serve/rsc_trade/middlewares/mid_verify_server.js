/**
 * Created by Administrator on 2017/4/10.
 */
var jwt = require('jsonwebtoken');
var config_common = require('../configs/config_common');

module.exports = function(){
    return function(req, res, next) {
        var token = req.body['token'];
        if(token) {
            jwt.verify(token, config_common.secret_keys.trade, function(err, decoded) {
                if(err) {
                    return next('auth_failed_server');
                }
                req.body = decoded;
                next();
            });
        } else {
            next('no_token');
        }
    }
};
/**
 * Created by Administrator on 2015/11/18.
 */
var jwt = require('jsonwebtoken');

var config_common = require('../configs/config_common');

module.exports = function(){
    return function(req, res, next) {
        var token = req.body['x-access-token'] || req.headers['x-access-token'];
        if(token) {
            jwt.verify(token, config_common.secret_keys.user, function(err, decoded) {
                if(err) {
                    return next('auth_failed');
                }
                req.decoded = decoded;
                next();
            });
        } else {
            next('no_token');
        }
    }
};

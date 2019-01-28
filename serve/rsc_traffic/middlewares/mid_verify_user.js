/**
 * Created by Administrator on 2015/11/18.
 */
var jwt = require('jsonwebtoken');
var config_common = require('../configs/config_common');

module.exports = function(x){
    return function(req, res, next) {
        var token = req.headers['x-access-token'];
        if(token) {
            jwt.verify(token, config_common.secret_keys.user, function(err, decoded) {
                if(err) {
                    // return next('auth_failed');
                    return next({dev:'token过期', pro: '000001'});
                }
                req.decoded = decoded;
                next();
            });
        } else {
            // next('no_token');
            if(x){
                next();
            }else{
                next({dev:'没带token', pro: '000000'});
            }

        }
    }
};

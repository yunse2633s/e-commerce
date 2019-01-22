/**
 * Created by Administrator on 2015/11/16.
 */
var config_server = require('../configs/config_server');
var _ = require('underscore');

module.exports = function () {
    return function (req, res, next) {
        if (req.body && req.body.serverTransData) {
            req.body = JSON.parse(req.body.serverTransData);
        }
        if (!(_.isObject(req.body) && !_.isArray(req.body))) {
            return res.send({status: 'err', msg: '无效键值对'});
        }
        if (config_server.env == 'dev') {
            next();
        } else {
            next();
        }
    }
};
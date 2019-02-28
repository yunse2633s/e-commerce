/**
 * Created by Administrator on 2015/11/6 0006.
 */
var _ = require('underscore');
var jwt = require('jsonwebtoken');

module.exports = {

    secret_keys: {
        user: 'user',
        trade: 'trade',
        traffic: 'traffic',
        invite: 'invite',
        dynamic: 'dynamic',
        admin: 'admin',
        phone: 'phone'
    },

    config_type: {
        app: 'app',
        web: 'web'
    },

    sendData: function (req, data, next) {
        req.result = data;
        next('success');
    }
};
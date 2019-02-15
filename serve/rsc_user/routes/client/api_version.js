/**
 * Created by Administrator on 2016/5/27.
 */
var express = require('express');
var config_common = require('../../configs/config_common');
var config_version = require('../../configs/config_version');
var _ = require('underscore');

module.exports = function () {
    var api = express.Router();

    api.post('/check_version', function (req, res, next) {
        config_common.sendData(req, _.extend(config_version, {alert: config_version.version === req.body.version ? 0 : 1}), next);
    });

    return api;
};
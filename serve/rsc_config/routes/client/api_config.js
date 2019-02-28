/**
 * Created by Administrator on 2016/11/7.
 */
var express = require('express');
var _ = require('underscore');

module.exports = function () {
    var api = express.Router();

    //api.use(require('../../middlewares/mid_verify_user')());

    //获取登录背景图
    api.post('/get_login_background', function (req, res, next) {
        //客户端传type:isweb/isapp
        if (!req.body.type) {
            return next('invalid_format');
        }
        req.body.type = req.body.type.substr(2);
        if (!global.config_package[req.body.name] ||
            !global.config_common.config_type[req.body.type]) {
            return next('invalid_format');
        }
        var result = global.config_package[req.body.name].background_login[req.body.type];
        global.config_common.sendData(req, result, next);
    });

    //获取banner图
    api.post('/get_banner', function (req, res, next) {
        //客户端传type:isweb/isapp
        if (!req.body.type) {
            return next('invalid_format');
        }
        req.body.type = req.body.type.substr(2);
        if (!global.config_package[req.body.name] ||
            !global.config_common.config_type[req.body.type]) {
            return next('invalid_format');
        }
        var result = global.config_package[req.body.name].banner[req.body.type];
        global.config_common.sendData(req, result, next);
    });

    //检查版本号和跟新信息
    api.post('/check_version', function (req, res, next) {
        config_common.sendData(req, _.extend(global.config_version_storage, {alert: global.config_version_storage.version === req.body.version ? 0 : 1}), next);
    });
    /**
     * 检查版本号与更新信息
     * 参数：version版本号；pack_name包名；type:应用类型；
     */
    api.post('/check_version_new', function (req, res, next) {
        if (!req.body.version || !req.body.package_name) {
            return next('invalid_format');
        }
        var version = global.config_version[req.body.package_name]();
        config_common.sendData(req, _.extend(version, {alert: global.config_version.version === req.body.version ? 0 : 1}), next);
    });

    return api;
};
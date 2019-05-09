/**
 * Created by Administrator on 2017/4/18.
 */
var _ = require('underscore');
var express = require('express');
var async = require('async');

var lib_push = require('../lib/lib_push');
var lib_http = require('../lib/lib_http');

var config_common = require('../configs/config_common');

module.exports = function () {

    var api = express.Router();

    //推送消息
    api.post('/push', function (req, res, next) {
        if (_.isString(req.body.user_ids)) {
            req.body.user_ids = JSON.parse(req.body.user_ids);
        }
        if (!req.body.title || !req.body.content || !_.isArray(req.body.user_ids)) {
            return next('invalid_format');
        }
        //向动态服务器发送推送内容相关
        lib_http.sendDynamicServer({
                user_ids: req.body.user_ids,
                content: req.body.content,
                title: req.body.title,
                data: req.body.data
            }, '/api/server/push_content/add', function (err) {
                if (err) {
                    console.log('err:', err);
                }
            }
        )
        lib_push.push(req.body, function (err, result) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, result, next);
        }, req);
    });

    api.use(require('../middlewares/mid_verify_user')());

    //增加设备号
    api.post('/add', function (req, res, next) {
        if (!req.body.uuid ||
            !req.body.package_name) {
            return next('invalid_format');
        }
        lib_push.add({
            user_id: req.decoded.id,
            uuid: req.body.uuid,
            package_name: req.body.package_name
        }, function (err, result) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, result, next);
        });
    });

    //移除设备号
    api.post('/dec', function (req, res, next) {
        lib_push.del({user_id: req.decoded.id}, function (err) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, {}, next);
        });
    });

    //查询设备号
    api.post('/get_one', function (req, res, next) {
        if (!req.body.user_id) {
            return next('invalid_format');
        }
        lib_push.getOne({
            find: {
                user_id: req.body.user_id
            }
        }, function (err, result) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, result, next);
        });
    });

    return api;

};
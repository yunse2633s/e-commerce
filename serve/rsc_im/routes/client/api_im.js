/**
 * Created by Administrator on 2016/11/7.
 */
var async = require('async');
var _ = require('underscore');
var express = require('express');
var lib_im = require('../../libs/lib_im');

var config_common = require('../../configs/config_common');

module.exports = function () {

    var api = express.Router();


    /**
     * 增加未读条数
     *
     * user_id
     */
    api.post('/add', function (req, res, next) {
        if (!req.body.to ||
            !req.body.fromNick) {
            return next('invalid_format');
        }
        async.waterfall([
            function (cb) {
                lib_im.add({user_id: req.body.to}, cb);
            }
        ], function (err) {
            if (err) return next(err);
            config_common.sendData(req, {}, next);
        });
    });

    api.use(require('../../middlewares/mid_verify_user')());

    /**
     * 清空未读条数
     *
     * user_id
     */
    api.post('/read', function (req, res, next) {
        if (!req.body['number']) {
            return next('invalid_format');
        }
        async.waterfall([
            function (cb) {
                lib_im.getOne({
                    find: {user_id: req.decoded.id}
                }, cb);
            },
            function (result, cb) {
                if (!result)return config_common.sendData(req, {}, next);
                if (result && result.count) {
                    result.count -= Number(req.body['number']);
                    if (result.count < 0) result.count = 0;
                }
                lib_im.edit(result, cb);
            }
        ], function (err) {
            if (err) return next(err);
            config_common.sendData(req, {}, next);
        });
    });

    api.post('/getList',function(req, res, next){
        if(!req.body.fromAccount){
            return next('invalid_format');
        }
        global.lib_session.getList({
            find:{user_id:req.body.fromAccount.toString()}
        },function(err,result){
            if (err) return next(err);
            config_common.sendData(req, result, next);
        })
    });

    return api;

};
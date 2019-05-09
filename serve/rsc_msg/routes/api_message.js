/**
 * Created by Administrator on 2017/3/14.
 */
var async = require('async');
var _ = require('underscore');
var express = require('express');

var utilService = require('../lib/lib_util');
var messageService = require('../lib/lib_message');

var config_common = require('../configs/config_common');

module.exports = function() {

    var api = express.Router();

    //增加单个消息
    api.post('/add', function(req, res, next) {
        if(_.isString(req.body.content)){
            req.body.content = JSON.parse(req.body.content);
        }
        if(!req.body.receive_id ||
            !_.isArray(req.body.content) ||
            messageService.checkContent(req.body.content, req.body.template_id)){
            return next('invalid_format');
        }
        messageService.add(req.body, function (err) {
            if(err){
                return next(err);
            }
            config_common.sendData(req, {}, next);
        });
    });

    api.use(require('../middlewares/mid_verify_user')());

    //获取未知消息个数（就是不知道有人给我发消息的个数）
    api.post('/get_unknow_count', function(req, res, next){
        async.waterfall([
            function(cb){
                messageService.getOneGetTime({user_id: req.decoded.id}, cb);
            },
            function (getTime, cb) {
                var cond = {read: false};
                if(getTime){
                    cond.time_creation = {$gt: getTime.get_time};
                }
                messageService.getCount(cond, cb);
            }
        ], function (err, result) {
            if(err){
                return next(err);
            }
            config_common.sendData(req, result, next);
        });
    });

    //获取最新消息
    api.post('/get_one_newest', function(req, res, next) {
        messageService.getList({
            find: {receive_id: req.decoded.id},
            sort: {time_creation: -1},
            limit: 1
        }, function (err, result) {
            if (err) {
                return next(err);
            }
            var data;
            if(result[0]){
                data = result[0].toObject();
                data.type = 'msg';  //给客户端显示使用
                data.time_long = utilService.getTimeLongStr(data.time_creation);
            }
            config_common.sendData(req, data, next);
        });
    });

    //按页获取消息
    api.post('/get', function(req, res, next) {
        req.body.page = !req.body.page ? 1 : req.body.page;
        var data = {};
        async.waterfall([
            function (cb) {
                messageService.getCount({receive_id: req.decoded.id}, cb);
            },
            function (count, cb) {
                data.count = count;
                messageService.getList({
                    find: {receive_id: req.decoded.id},
                    sort: {time_creation: -1},
                    limit: config_common.msg_per_page,
                    skip: config_common.msg_per_page * (req.body.page - 1)
                }, cb);
            },
            function (msgs, cb) {
                data.msgs = msgs;
                data.exists = data.count > (config_common.msg_per_page * req.body.page);
                messageService.updateGetTime({user_id: req.decoded.id}, function () {});
                cb(null, data);
            }
        ], function (err, result) {
            if(err){
                return next(err);
            }
            config_common.sendData(req, result, next);
        });
    });

    //获取单个消息
    api.post('/get_one', function(req, res, next) {
        if(!req.body.msg_id){
            return next('invalid_format');
        }
        async.waterfall([
            function (cb) {
                messageService.getOne({_id: req.body.msg_id}, cb);
            },
            function (msg, cb) {
                if(!msg){
                    return cb('not_found');
                }
                messageService.editOne(msg, {read: true}, cb);
            }
        ], function (err, msg) {
            if(err){
                return next(err);
            }
            config_common.sendData(req, msg, next);
        });
    });

    return api;
};

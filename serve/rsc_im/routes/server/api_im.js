/**
 * Created by Administrator on 2017/7/12.
 */
//这里写首次加好友，增加一条默认历史记录

var async = require('async');
var _ = require('underscore');
var express = require('express');

module.exports = function () {

    var api = express.Router();

    api.use(require('../../middlewares/mid_verify_server')());

    //删除群聊天记录
    api.post('/remove', function (req, res, next) {
        async.waterfall([
            function (cb) {
                global.lib_session.getList({find: {other_user_id: req.body.tid}}, cb);
            },
            function (data, cb) {
                if(data){
                    for(var i=0;i<data.length;i++){
                        data[i].remove();
                    }
                }
                cb()
            }
        ], function (err) {
            if (err) {
                return next(err);
            }
            global.config_common.sendData(req, {}, next);
        });
    });

    return api;
};

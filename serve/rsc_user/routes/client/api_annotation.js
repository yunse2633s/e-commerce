/**
 * Created by Administrator on 2018\6\5 0005.
 */
var async = require('async');
var express = require('express');

module.exports = function () {
    var api = express.Router();

    api.use(require('../../middlewares/mid_verify_user')());

    /**
     * 功能：设置备注
     * 参数：user_id:查看的个人主页的人的id
     *       content:备注内容
     */
    api.post('/set_annotation', function (req, res, next) {
        if (!req.body.user_id || !req.body.content) {
            return next('invalid_format');
        }
        async.waterfall([
            function (cb) {
                global.lib_annotation.getOne({
                    find: {
                        user_id: req.decoded.id,
                        other_id: req.body.user_id
                    }
                }, cb);
            },
            function (annotation, cb) {
                if (!annotation) {
                    global.lib_annotation.add({
                        user_id: req.decoded.id,
                        other_id: req.body.user_id,
                        content: req.body.content
                    }, cb);
                } else {
                    annotation.content = req.body.content;
                    annotation.save(cb);
                }
            }
        ], function (err, content, count) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, content, next);
        });
    });

    return api;
};
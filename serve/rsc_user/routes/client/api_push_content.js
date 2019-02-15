/**
 * Created by Administrator on 2018\4\18 0018.
 */
var async = require('async');
var express = require('express');
module.exports = function () {
    var api = express.Router();

    api.use(require('../../middlewares/mid_verify_user')());

    /**
     * 功能:根据自己的id得到自己应该知道的消息推送列表
     * 参数：page
     */
    api.post('/get_list', function (req, res, next) {
        var result = {};
        var page = req.body.page || 1;
        async.waterfall([
            function (cb) {
                global.lib_push_content.getCount({user_ids: {$in: [req.decoded.id]}}, cb);
            },
            function (count, cb) {
                result.count = count;
                result.exist = count > page * global.config_common.entry_per_page;
                global.lib_push_content.getList({
                    find: {user_ids: {$in: [req.decoded.id]}},
                    skip: (page - 1) * global.config_common.entry_per_page,
                    limit: global.config_common.entry_per_page
                }, cb);
            }
        ], function (err, data) {
            if (err) {
                return next(err);
            }
            result.list = data;
            global.config_common.sendData(req, result, next);
        });
    });

    return api;
};
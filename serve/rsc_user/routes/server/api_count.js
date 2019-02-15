/**
 * Created by Administrator on 2017/6/10.
 */

var async = require('async');
var _ = require('underscore');
var express = require('express');

module.exports = function () {

    var api = express.Router();

    api.use(require('../../middlewares/mid_verify_server')());

    api.post('/get', function (req, res, next) {
        async.waterfall([
            function (cb) {
                global.lib_count.get(req, cb);
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            global.config_common.sendData(req, result, next);
        });
    });

    /**
     * 得到公共部分角标相关数字
     */
    api.post('/get_corner_mark', function (req, res, next) {
        async.waterfall([
            function (cb) {
                global.lib_tip.getOne({
                    find: {
                        user_id: req.body.id,
                        type: global.config_common.tip_type.linkman
                    }
                }, cb);
            },
            function (tip, cb) {
                var cond = {
                    user_id: req.body.id,
                    status: global.config_common.relation_status.WAIT
                };
                if (tip) {
                    cond.time_creation = {$gt: tip.update_time};
                }
                global.lib_apply_relation.getCount(cond, cb);
            }
        ], function (err, count) {
            if (err) {
                return next(err);
            }
            global.config_common.sendData(req, count, next);
        });
    });

    return api;
};
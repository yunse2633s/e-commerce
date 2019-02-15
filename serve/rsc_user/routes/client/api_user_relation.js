/**
 * Created by Administrator on 2017/6/22.
 */
var async = require('async');
var express = require('express');

module.exports = function () {

    var api = express.Router();

    api.use(require('../../middlewares/mid_verify_user')());

    api.post('/del', function (req, res, next) {
        if (!req.body.user_id) {
            return next('invalid_format');
        }
        async.waterfall([
            function (cb) {
                global.lib_user_relation.del({
                    user_id: req.decoded.id,
                    other_id: req.body.user_id
                }, cb);
            },
            function (count, cb) {
                global.lib_user_relation.del({
                    user_id: req.body.user_id,
                    other_id: req.decoded.id
                }, cb);
            },
            function (count, cb) {
                global.lib_apply_relation.del({
                    user_id: req.body.user_id,
                    other_user_id: req.decoded.id,
                    type: global.config_common.relation_style.FRIEND,
                    status: "ACCEPT"
                }, cb);
            },
            function (data, cb) {
                global.lib_apply_relation.del({
                    user_id: req.decoded.id,
                    other_user_id: req.body.user_id,
                    type: global.config_common.relation_style.FRIEND,
                    status: "ACCEPT"
                }, cb);
            },
            function (data, cb) {
                global.lib_relation_group.delGroupUser({
                    user_id: req.decoded.id,
                    member_id: req.body.user_id,
                    type: global.config_common.relation_style.FRIEND
                }, cb)
            }
        ], function (err) {
            if (err) {
                return next(err);
            }
            global.config_common.sendData(req, {}, next);
        });
    });

    /**
     * 功能:得到自己可以分类的好友分类
     */
    api.post('/get_friend_type', function (req, res, next) {
        switch (req.decoded.role) {
            case global.config_common.user_roles.TRADE_ADMIN:
            case global.config_common.user_roles.TRADE_PURCHASE:
            case global.config_common.user_roles.TRADE_SALE:
                global.config_common.sendData(req, {
                    type: [
                        {chn: '销售', eng: 'sale'},
                        {chn: '采购', eng: 'purchase'},
                        {chn: '物流', eng: 'traffic'}
                       // {chn: '司机', eng: 'driver'}
                    ]
                }, next);
                break;
            case global.config_common.user_roles.TRAFFIC_ADMIN:
            case global.config_common.user_roles.TRAFFIC_EMPLOYEE:
            case global.config_common.user_roles.TRAFFIC_CAPTAIN:
                global.config_common.sendData(req, {
                    type: [{chn: '货源方', eng: 'purchase'},
                        {chn: '司机', eng: 'driver'}]
                }, next);
                break;
            default:
                return next('err:role');
                break;
        }
    });

    /**
     * 功能:修改好友type类型
     * 参数:user_id;type
     */
    api.post('/edit_type', function (req, res, next) {
        if (!req.body.user_id || !req.body.type) {
            return next('invalid_format')
        }
        async.waterfall([
            function (cb) {
                //查询到好友关系中的
                global.lib_user_relation.getOne({
                    find: {
                        user_id: req.decoded.id,
                        other_id: req.body.user_id
                    },
                }, cb);
            },
            function (data, cb) {
                if (!data) {
                    return cb('err:not_have_relation');
                }
                data.extend = req.body.type;
                data.save(cb);
            }
        ], function (err, content, count) {
            if (err) {
                return next(err);
            }
            global.config_common.sendData(req, content, next);
        })
    });

    return api;

};
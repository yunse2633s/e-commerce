/**
 * Created by Administrator on 2017/7/5.
 */
var async = require('async');
var _ = require('underscore');
var express = require('express');

module.exports = function () {

    var api = express.Router();

    api.use(require('../../middlewares/mid_verify_server')());

    //生意圈显示的人id
    api.post('/get_trade_circle', function (req, res, next) {
        if (!req.body.user_id ||
            !req.body.type) {
            return next('invalid_format');
        }
        var userRelations;
        async.waterfall([
            function (cb) {
                global.lib_user_relation.getList({
                    find: {user_id: req.body.user_id, type: global.config_common.relation_style.FRIEND},
                    select: 'other_id'
                }, cb);
            },
            function (relations, cb) {
                userRelations = relations;
                global.lib_work_relation.getList({
                    find: {user_id: req.body.user_id, type: req.body.type},
                    select: 'other_user_id'
                }, cb);
            },
            function (relations, cb) {
                var user_relation_ids = global.lib_util.transObjArrToSigArr(userRelations, 'other_id');
                var work_relation_ids = global.lib_util.transObjArrToSigArr(relations, 'other_user_id');
                cb(null, user_relation_ids);
                // cb(null, _.difference(user_relation_ids, work_relation_ids));
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            global.config_common.sendData(req, result, next);
        });
    });


    /**
     * 根据角色查询要推送的好友和合作人
     */
    api.post('/get_push_user', function (req, res, next) {
        var WorkRelations;
        async.waterfall([
            function (cb) {
                global.lib_work_relation.getList({
                    find: {user_id: req.body.user_id, type: req.body.type},
                    select: 'other_user_id'
                }, cb);

            },
            function (relations, cb) {
                WorkRelations = relations;
                global.lib_user_relation.getList({
                    find: {user_id: req.body.user_id, type: global.config_common.relation_style.FRIEND},
                    select: 'other_id'
                }, cb);
            },
            function (relations, cb) {
                var user_relation_ids = global.lib_util.transObjArrToSigArr(relations, 'other_id');
                var work_relation_ids = global.lib_util.transObjArrToSigArr(WorkRelations, 'other_user_id');
                cb(null, _.difference(user_relation_ids, work_relation_ids));
            },
            function (result, cb) {
                async.parallel({
                    relation: function (callback) {
                        global.lib_user.getList({
                            find: {
                                _id: {$in: global.lib_util.transObjArrToSigArr(WorkRelations, 'other_user_id')},
                                role: {$in: [global.config_common.user_roles.TRADE_PURCHASE, global.config_common.user_roles.TRADE_ADMIN, global.config_common.user_roles.TRADE_SALE]}
                            },
                            select: 'photo_url'
                        }, callback);
                    },
                    friend: function (callback) {
                        global.lib_user.getList({
                            find: {
                                _id: {$in: result},
                                role: {$in: [global.config_common.user_roles.TRADE_PURCHASE, global.config_common.user_roles.TRADE_ADMIN, global.config_common.user_roles.TRADE_SALE]}
                            },
                            select: 'photo_url'
                        }, callback);
                    }
                }, cb);
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            global.config_common.sendData(req, result, next);
        });
    });

    //得到所有的好友
    api.post('/get_list', function (req, res, next) {
        if (!req.body.cond) {
            return next('invalid_format');
        }
        async.waterfall([
            function (cb) {
                global.lib_user_relation.getList(req.body.cond, cb);
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            global.config_common.sendData(req, result, next);
        });
    });


    return api;
};
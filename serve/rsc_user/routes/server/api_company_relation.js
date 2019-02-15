/**
 * Created by Administrator on 2017/4/18.
 */
var async = require('async');
var _ = require('underscore');
var express = require('express');
var companyRelation = require('../../libs/lib_company_relation');
var config_common = global.config_common;
var util = global.lib_util;
module.exports = function () {

    var api = express.Router();

    api.use(require('../../middlewares/mid_verify_server')());

    //获取公司的关系商,type是对方公司类型
    // api.post('/get_sms_users', function (req, res, next) {
    //     if (!global.config_common.checkCompanyDetailType(req.body.type) || !req.body.user_id || !req.body.company_id) {
    //         return next('invalid_format');
    //     }
    //     var user_id_key = '';
    //     var data = {phone_list: []};
    //     async.waterfall([
    //         function (cb) {
    //             //获取已经认证公司的负责人
    //             var cond = {type: global.config_common.relation_type.ACCEPT};
    //             switch (req.body.type) {
    //                 case global.config_common.company_type.TRAFFIC:
    //                     cond.other_type = global.config_common.company_category.TRAFFIC;
    //                     cond.self_id = req.body.company_id;
    //                     cond.self_user_id = req.body.user_id;
    //                     user_id_key = 'other_user_id';
    //                     break;
    //                 case global.config_common.company_type.SALE:
    //                     cond.other_type = global.config_common.company_category.TRADE;
    //                     cond.self_id = req.body.company_id;
    //                     cond.self_user_id = req.body.user_id;
    //                     user_id_key = 'other_user_id';
    //                     break;
    //                 case global.config_common.company_type.PURCHASE:
    //                     //cond.other_type = config_common.company_category.TRADE;
    //                     //这个地方不能加other_type，因为物流公司获取认证自己的公司也是发PURCHASE
    //                     cond.other_id = req.body.company_id;
    //                     cond.other_user_id = req.body.user_id;
    //                     user_id_key = 'self_user_id';
    //                     break;
    //             }
    //             global.lib_company_relation.getList({
    //                 find: cond,
    //                 select: user_id_key
    //             }, cb);
    //         },
    //         function (relations, cb) {
    //             //获取认证公司负责人姓名电话
    //             var user_ids = global.lib_util.transObjArrToSigArr(relations, user_id_key);
    //             global.lib_user.getList({
    //                 find: {_id: {$in: user_ids}},
    //                 select: 'phone real_name'
    //             }, cb);
    //         },
    //         function (users, cb) {
    //             //获取短信邀请关系商姓名电话
    //             for (var i = 0; i < users.length; i++) {
    //                 data.phone_list.push({name: users[i].real_name, phone: users[i].phone});
    //             }
    //             global.lib_user_invitation_phone.onlyList({
    //                 find: {user_id: req.body.user_id, company_id: req.body.company_id},
    //                 select: 'name phone'
    //             }, cb);
    //         },
    //         function (phones, cb) {
    //             for (var i = 0; i < phones.length; i++) {
    //                 data.phone_list.push({name: phones[i].name, phone: phones[i].phone});
    //             }
    //             global.lib_user.getOne({
    //                 find: {_id: req.body.user_id},
    //                 select: 'phone real_name company_id'
    //             }, cb);
    //         },
    //         function (user, cb) {
    //             data.user_name = user.real_name;
    //             global.lib_company.getOne({
    //                 find: {_id: user.company_id},
    //                 select: 'verify_phase full_name nick_name'
    //             }, cb);
    //         },
    //         function (company, cb) {
    //             data.company_name = global.config_common.getCompanyName(company);
    //             cb();
    //         }
    //     ], function (err) {
    //         if (err) {
    //             return next(err);
    //         }
    //         global.config_common.sendData(req, data, next);
    //     });
    //
    // });

    //通过类型获取关系-2.0.0-2017/1/23
    api.post('/get_arr_by_type', function (req, res, next) {
        // console.log(req.decoded);
        // if (req.decoded.role !== config_common.user_roles.TRADE_ADMIN &&
        //     req.decoded.role !== config_common.user_roles.TRAFFIC_ADMIN &&
        //     req.decoded.role !== config_common.user_roles.TRADE_PURCHASE &&
        //     req.decoded.role !== config_common.user_roles.TRADE_SALE) {
        //     return next('not_allow');
        // }
        var cond = {};
        var key;
        var user_id;
        if (req.body.role == config_common.user_roles.TRAFFIC_ADMIN) {
            cond.other_id = req.body.company_id;
            cond.other_type = config_common.company_category.TRAFFIC;
            key = 'self_id';
            user_id = 'self_user_id';
        } else if (req.body.type == 'PURCHASE') {
            cond.other_id = req.body.company_id;

            cond.other_type = config_common.company_category.TRADE;
            if (req.body.role !== config_common.user_roles.TRADE_ADMIN) {
                cond.other_user_id = req.body.id;
            }
            key = 'self_id';
            user_id = 'self_user_id';
        } else {
            cond.self_id = req.body.company_id;
            cond.other_type = config_common.company_category.TRADE;
            if (req.body.role !== config_common.user_roles.TRADE_ADMIN) {
                cond.self_user_id = req.body.id;
            }
            key = 'other_id';
            user_id = 'other_user_id';
        }
        cond.type = config_common.relation_type.ACCEPT;
        companyRelation.getList({
            find: cond
        }, function (err, company) {
            if (err) {
                return next(err);
            }
            var arr = [];

            var company_ids = util.transObjArrToSigArr(company, key);
            var user_ids = util.transObjArrToSigArr(company, user_id);
            for (var i = 0; i < company_ids.length; i++) {
                arr.push({company_id: company_ids[i], user_id: user_ids[i]});
            }
            config_common.sendData(req, arr, next);
        });
    });

    return api;
};

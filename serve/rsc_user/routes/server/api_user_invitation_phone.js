/**
 * Created by Administrator on 2017/4/17.
 */
var async = require('async');
var _ = require('underscore');
var express = require('express');

module.exports = function () {

    var api = express.Router();

    api.use(require('../../middlewares/mid_verify_server')());

    // api.post('/add_one', function (req, res, next) {
    //     if (!global.config_common.checkPhone(req.body.phone) ||
    //         !global.config_common.company_type[req.body.other_type] ||
    //         !req.body.name ||
    //         !req.body.company_id ||
    //         !req.body.user_id
    //     ) {
    //         return next('invalid_format');
    //     }
    //     var data = {
    //         company_id: req.body.company_id,
    //         user_id: req.body.user_id,
    //         phone: req.body.phone,
    //         company_name: req.body.company_name,
    //         other_type: req.body.other_type,
    //         name: req.body.phone
    //     };
    //     async.waterfall([
    //         function (cb) {
    //             global.lib_verify_code.getCount({phone: req.body.phone}, cb);
    //         },
    //         function (count, cb) {
    //             if(count){
    //                 return cb('not_allow');
    //             }
    //             global.lib_user_invitation_phone.add(data, cb);
    //         }
    //     ], function (err) {
    //         if (err) {
    //             return next(err);
    //         }
    //         global.config_common.sendData(req, {}, next);
    //     });
    // });

    return api;
};
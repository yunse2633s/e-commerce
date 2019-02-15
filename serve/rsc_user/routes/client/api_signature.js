var async = require('async');
var _ = require('underscore');
var express = require('express');

module.exports = function () {

    var api = express.Router();

    api.use(require('../../middlewares/mid_verify_user')());

    api.post('/add', function (req, res, next) {
        if (!req.body.name) {
            return next('invalid_format');
        }
        global.lib_signature.update({
            find: {user_id: req.decoded.id},
            set: {user_id: req.decoded.id, name: req.body.name},
            options: {upsert: true}
        }, function (err, result) {
            if (err) {
                return next(err);
            }
            global.config_common.sendData(req, result, next);
        });
    });

    api.post('/get_one', function (req, res, next) {
        global.lib_signature.getOne({
            find: {user_id: req.decoded.id}
        }, function (err, result) {
            if (err) {
                return next(err);
            }
            global.config_common.sendData(req, result, next);
        });
    });

    return api;

};
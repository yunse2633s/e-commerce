/**
 * Created by Administrator on 17/4/27.
 */
var async = require('async');
var _ = require('underscore');
var express = require('express');

var obj = {
    getOne: 'getOne',
    getCount: 'getCount',
    getList: 'getList'
};

module.exports = function () {

    var api = express.Router();

    api.use(require('../../middlewares/mid_verify_server')());

    api.post('/get', function (req, res, next) {
        if (!obj[req.body.method] || !req.body.cond || !req.body.model) {
            return next('invalid_format');
        }
        var model = require('../../dbs/db_base')(req.body.model);
        async.waterfall([
            function (cb) {
                model[req.body.method](req.body.cond, cb);
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            global.config_common.sendData(req, result, next);
        });
    });

    api.post('/gets', function (req, res, next) {
        if (!obj[req.body.method] || !_.isArray(req.body.conds) || !req.body.model) {
            return next('invalid_format');
        }
        var model = require('../../dbs/db_base')(req.body.model);
        async.mapSeries(req.body.conds, function(cond, cb){
            model[req.body.method](cond, cb);
        }, function (err, result) {
            if (err) {
                return next(err);
            }
            global.config_common.sendData(req, result, next);
        });
    });

    return api;
};

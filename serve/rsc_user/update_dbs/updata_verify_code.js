/**
 * Created by Administrator on 2018\1\17 0017.
 */
var mongoose = require('mongoose');
var config_server = require('../configs/config_server');

var dbUrl = config_server.mongodb;
mongoose.Promise = global.Promise;
mongoose.connect(dbUrl);
mongoose.connection.on('connected', function () {
});
mongoose.connection.on('error', function () {
    mongoose.connection.close();
});
mongoose.connection.on('disconnected', function () {
    mongoose.connect(dbUrl);
});

var _ = require('underscore');
var async = require('async');

var lib_user = require('../libs/lib_user');
var lib_verify_code = require('../libs/lib_verify_code');
var config_common = require('../configs/config_common');
async.waterfall([
    function (cb) {
        lib_verify_code.getList({}, cb);
    },
    function (data, cb) {
        async.eachSeries(data, function (one_data, callback) {
            async.waterfall([
                function (cbk) {
                    lib_user.getOne({find: {phone: one_data.phone}}, cbk);
                },
                function (user, cbk) {
                    if(user){
                        switch (user.role) {
                            case config_common.user_roles.TRADE_ADMIN:
                            case config_common.user_roles.TRADE_PURCHASE:
                            case config_common.user_roles.TRADE_SALE:
                                lib_verify_code.getOne({find:{_id: one_data._id}}, function (err, codeData) {
                                    codeData.type = 'trade';
                                    codeData.save();
                                    cbk();
                                })
                                break;
                            case config_common.user_roles.TRADE_STORAGE:
                                lib_verify_code.getOne({find:{_id: one_data._id}}, function (err, codeData) {
                                    codeData.type = 'store';
                                    codeData.save();
                                    cbk();
                                })
                                break;
                            case config_common.user_roles.TRAFFIC_ADMIN:
                                lib_verify_code.getOne({find:{_id: one_data._id}}, function (err, codeData) {
                                    codeData.type = 'traffic';
                                    codeData.save();
                                    cbk();
                                })
                                break;
                            case config_common.user_roles.TRAFFIC_DRIVER_PRIVATE:
                                lib_verify_code.getOne({find:{_id: one_data._id}}, function (err, codeData) {
                                    codeData.type = 'driver';
                                    codeData.save();
                                    cbk();
                                })
                                break;
                            default :
                                one_data.type = 'err'
                                one_data.save();
                                cbk();
                                break;
                        }
                    }else {
                        one_data.type = 'err'
                        one_data.save();
                        cbk();
                    }
                },
                function (cbk) {
                    cbk();
                }
            ], callback)
        }, cb);
    }
], function (err) {
    if (err) {
        console.log(err);
    }
    console.log('update success!');
});





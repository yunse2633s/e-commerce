/**
 * Created by Administrator on 2017/7/7.
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


var async = require('async');
var db_company_trade = require('../dbs/db_base')('Company_trade');
var db_company_traffic = require('../dbs/db_base')('Company_traffic');
var lib_util = require('../libs/lib_util');


async.waterfall([
    function (cb) {
        db_company_trade.update({
            find: {verify_phase:'NO'},
            set: {verify_phase:'PROCESSING'}
        }, cb);
    },
    function (count, cb) {
        db_company_traffic.update({
            find: {verify_phase:'NO'},
            set: {verify_phase:'PROCESSING'}
        }, cb);
    }
], function (err) {
    if (err) {
        console.log(err);
    }
    console.log('update success!');
});
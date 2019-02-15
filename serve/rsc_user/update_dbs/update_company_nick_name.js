/**
 * Created by Administrator on 2017/7/3.
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
var lib_company = require('../libs/lib_company');
var lib_util = require('../libs/lib_util');
var sdk_map_gaode = require('../sdks/map_gaode/sdk_map_gaode');

async.waterfall([
    function (cb) {
        lib_company.getListAll({
            find: {nick_name: ''},
            select: 'nick_name full_name'
        }, cb);
    },
    function (companies, cb) {
        async.eachSeries(companies, function (company, callback) {
            company.nick_name = company.full_name;
            company.save(callback);
        }, cb);
    }
], function (err) {
    if (err) {
        console.log(err);
    }
    console.log('update success!');
});
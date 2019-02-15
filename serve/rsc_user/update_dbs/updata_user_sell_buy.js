/**
 * Created by Administrator on 2017\10\30 0030.
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
//gangtie->steel meijiao->coal
var oldArr = ["alloy", "coal", "powder", "steel"]
var newArr = ['gangtie', 'kuangshi', 'meijiao']


async.waterfall([
    function (cb) {
        lib_user.getListAll({find: {}}, cb);
    },
    function (companies, cb) {
        async.eachSeries(companies, function (company, callback) {
            if (!_.intersection(company.buy, newArr).length) {
                company.buy = _.compact(_.map(company.buy, function (oneDat) {
                    var a
                    if (oneDat == 'steel') {
                        a = 'gangtie'
                    }
                    if (oneDat == 'coal') {
                        a = 'meijiao'
                    }
                    return a
                }))
            }
            if (!_.intersection(company.sell, newArr).length) {
                company.sell = _.compact(_.map(company.sell, function (oneDat) {
                    var a
                    if (oneDat == 'steel') {
                        a = 'gangtie'
                    }
                    if (oneDat == 'coal') {
                        a = 'meijiao'
                    }
                    return a
                }))
            }
            if (!_.intersection(company.transport, newArr).length) {
                company.transport = _.compact(_.map(company.transport, function (oneDat) {
                    var a
                    if (oneDat == 'steel') {
                        a = 'gangtie'
                    }
                    if (oneDat == 'coal') {
                        a = 'meijiao'
                    }
                    return a
                }))
            }
            company.save(callback);
        }, cb);
    }
], function (err) {
    if (err) {
        console.log(err);
    }
    console.log('update success!');
});


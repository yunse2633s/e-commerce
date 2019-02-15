/**
 * Created by Administrator on 2017/6/15.
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
var lib_address = require('../libs/lib_address');
var lib_util = require('../libs/lib_util');
var sdk_map_gaode = require('../sdks/map_gaode/sdk_map_gaode');

async.waterfall([
    function (cb) {
        lib_address.getList({
            find: {province: {$exists: true}, location: {$exists: false}},
            select: '_id province city district addr'
        }, cb);
    },
    function (companies, cb) {
        async.eachSeries(companies, function (company, callback) {
            var address = company.province+company.city+company.district+company.addr;
            sdk_map_gaode.getCoordinate(address, function (err, coordinate) {
                if(err){
                    return callback(err);
                }
                if(coordinate && coordinate.geocodes && coordinate.geocodes[0]){
                    company.location = coordinate.geocodes[0].location.split(',');
                }
                company.save(callback);
            });
        }, cb);
    }
], function (err) {
    if (err) {
        console.log(err);
    }
    console.log('update success!');
});


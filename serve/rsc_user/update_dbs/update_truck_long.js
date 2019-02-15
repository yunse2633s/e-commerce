/**
 * Created by Administrator on 2017/7/3.
 */
var mongoose = require('mongoose');
var config_server = require('../configs/config_server');

var dbUrl = config_server.mongodb;
mongoose.Promise = global.Promise;
mongoose.connect(dbUrl);
mongoose.connection.on('connected',function() {
});
mongoose.connection.on('error',function() {
    mongoose.connection.close();
});
mongoose.connection.on('disconnected',function() {
    mongoose.connect(dbUrl);
});


var async = require('async');
var db_truck = require('../dbs/db_base')('Truck');
var lib_util = require('../libs/lib_util');

async.waterfall([
    function (cb) {
        db_truck.update({
            find: {},
            set: {long: '17.5'}
        }, cb);
    }
], function (err) {
    if(err){
        console.log(err);
    }
    console.log('update success!');
});
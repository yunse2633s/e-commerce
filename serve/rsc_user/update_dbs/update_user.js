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
var db_user = require('../dbs/db_base')('User');
var db_user_trade = require('../dbs/db_base')('User_trade');
var db_user_traffic = require('../dbs/db_base')('User_traffic');

var arr;
var cond = {user_id: {$exists:false}, source: {$exists:false}};
async.waterfall([
    function (cb) {
        db_user_trade.getList({find: cond}, cb);
    },
    function (roles, cb) {
        arr = roles;
        db_user_traffic.getList({find: cond}, cb);
    },
    function (roles, cb) {
        arr = arr.concat(roles);
        async.eachSeries(arr, function(role, callback){
            async.waterfall([
                function (cbk) {
                    db_user.getOne({find: {phone: role.phone}}, cbk);
                },
                function (user, cbk) {
                    if(!user){
                        db_user.add({
                            phone: role.phone,
                            real_name: role.real_name,
                            gender: role.gender,
                            photo_url: role.photo_url,
                            time_creation: role.time_creation
                        }, cbk);
                    }else{
                        cbk(null, user, 1);
                    }
                },
                function (user, count, cbk) {
                    role.user_id = user._id.toString();
                    role.save(cbk);
                }
            ], callback);
        }, cb);
    }
], function (err) {
    if(err){
        console.log(err);
    }
    console.log('update success!');
});




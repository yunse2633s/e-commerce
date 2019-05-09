/**
 * Created by Administrator on 2015/11/16 0016.
 */
//给没有审批人的司机增加默认审批人


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
var db_driver_verify = require('../dbs/db_base')('Driver_verify');
var db_user_traffic = require('../dbs/db_base')('User_traffic');
var lib_util = require('../libs/lib_util');

var verifyDatas;
async.waterfall([
    function (cb) {
        db_driver_verify.getList({
            find: {approve_id: {$exists: false}, status: 'SUCCESS'}
        }, cb);
    },
    function (verifies, cb) {
        verifyDatas = verifies;
        var company_ids = lib_util.transObjArrToSigArr(verifies, 'company_id');
        db_user_traffic.getList({
            find: {company_id: {$in: company_ids}, role: 'TRAFFIC_ADMIN'},
            select: '_id company_id'
        }, cb);
    },
    function (users, cb) {
        var userObj = lib_util.transObjArrToObj(users, 'company_id');
        // console.log(userObj);
        // console.log(verifyDatas.length);
        async.eachSeries(verifyDatas, function (verify, cbk) {
            verify.approve_id = userObj[verify.company_id]._id.toString();
            verify.save(cbk);
        }, cb);
    }
], function (err) {
    if(err){
        console.log(err);
    }
    console.log('update success!');
});


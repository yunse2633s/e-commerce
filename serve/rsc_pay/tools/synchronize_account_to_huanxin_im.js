/**
 * Created by Administrator on 2017/5/18.
 */
//同步账号到环信聊天账号


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



var db_user_trade = require('../dbs/db_base')('User_trade');
var db_user_traffic = require('../dbs/db_base')('User_traffic');
var lib_util = require('../libs/lib_util');
var sdk_im_huanxin = require('../sdks/im_huanxin/sdk_im_huanxin');

db_user_trade.getList({
    find:{},
    select:'_id'
}, function (err, users) {
    if(!err){
        var arr = lib_util.transObjArrToSigArr(users, '_id');
        sdk_im_huanxin.createUsers(arr);
    }
});

db_user_traffic.getList({
    find:{},
    select:'_id'
}, function (err, users) {
    if(!err){
        var arr = lib_util.transObjArrToSigArr(users, '_id');
        sdk_im_huanxin.createUsers(arr);
    }
});
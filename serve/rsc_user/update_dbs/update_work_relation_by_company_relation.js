/**
 * Created by Administrator on 2017/6/28.
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
var db_work_relation = require('../dbs/db_base')('Work_relation');
var db_company_relation = require('../dbs/db_base')('Company_relation');
var lib_util = require('../libs/lib_util');
var config_common = require('../configs/config_common');

async.waterfall([
    function (cb) {
        db_company_relation.del({
            find: {type:'WAIT'}
        }, cb);
    },
    function (count, cb) {
        db_company_relation.getList({
            find: {type:'ACCEPT'}
            // find: {"_id" : "58ba6888293beba14de4a8aa"}
        }, cb);
    },
    function (relations, cb) {
        async.eachSeries(relations, function (relation, callback) {
            if(relation.self_user_id && relation.other_user_id && relation.other_type){
                var data1 = {};
                var data2 = {};
                data1.user_id = relation.self_user_id;          //自己id
                data1.company_id = relation.self_id;            //自己公司id
                data1.other_user_id = relation.other_user_id;   //对方id
                data1.other_company_id = relation.other_id;//对方公司id
                data2.user_id = relation.other_user_id;             //自己id
                data2.company_id = relation.other_id;            //自己公司id
                data2.other_user_id = relation.self_user_id;        //对方id
                data2.other_company_id = relation.self_id;          //对方公司id
                data2.type = config_common.company_type.PURCHASE;            //other_user_id是user_id的type
                if(relation.other_type == config_common.company_category.TRADE){
                    data1.type = config_common.company_type.SALE;            //other_user_id是user_id的type
                }else{
                    data1.type = config_common.company_type.TRAFFIC;            //other_user_id是user_id的type
                }
                async.waterfall([
                    function (cb) {
                        db_work_relation.add(data1, cb);
                    },
                    function (relation, count, cb) {
                        db_work_relation.add(data2, cb);
                    }
                ], callback);
            }else{
                callback();
            }
        }, cb);
    }
], function (err) {
    if(err){
        console.log(err);
    }
    console.log('update success!');
});
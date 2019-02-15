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
var db_user = require('../dbs/db_base')('Company');
var db_user_trade = require('../dbs/db_base')('Company_trade');
var db_user_traffic = require('../dbs/db_base')('Company_traffic');

var arr;
var cond = {};
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
                    if(role.company_id){
                        db_user.getOne({find: {_id: role.company_id}}, cbk);
                    }else{
                        cbk(null, null);
                    }
                },
                function (user, cbk) {
                    if(!user){
                        db_user.add({
                            nick_name: role.nick_name,              //正经公司名
                            currency: role.currency,
                            verify_phase: role.verify_phase,        //认证状态
                            url_yingyezhizhao: role.url_yingyezhizhao,
                            url_logo: role.url_logo,
                            url_company_bg_img: role.url_company_bg_img,      //企业背景图
                            url_honor: role.url_honor,              //荣誉图
                            province: role.province,                //省
                            city: role.city,                        //市
                            district: role.district,                //区县
                            addr: role.addr,                        //详细
                            location: role.location,                //经纬度
                            person_count: role.person_count,        //公司人数
                            des: role.des,                          //公司描述
                            phone_creator: role.phone_creator,              //公司创建人电话（第一个）
                            time_creation: role.time_creation
                        }, cbk);
                    }else{
                        cbk(null, user, 1);
                    }
                },
                function (user, count, cbk) {
                    role.company_id = user._id.toString();
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
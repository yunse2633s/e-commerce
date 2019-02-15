var mongoose = require('mongoose');
var _ = require('underscore');
var config_server = require('../configs/config_server');
var config_common = require('../configs/config_common');

var config_api_url = require('../configs/config_api_url');
var async = require('async');
var db = require('../dbs/db_base')('Address');
var user_traffic = require('../dbs/db_base')('User_traffic')
//
mongoose.Promise = global.Promise;
console.log('config_server.mongodb', config_server.mongodb)
mongoose.connect(config_server.mongodb);

mongoose.connection.on('connected',function() {
    var date_string = new Date().toString();
    console.log('mongodb connection established: ' + date_string);
});

mongoose.connection.on('error',function() {
    var date_string = new Date().toString();
    console.log('mongodb error: ' + date_string + '. Closing....');
    mongoose.connection.close();
});
/*

async.waterfall([
    function (cb) {
        db.getList({find: {}}, cb)
    }, function (lists, cb) {
        async.eachSeries(lists, function(list, cb1){
            console.log('list.province', list.province)
            list.province = list.province.replace('省', '');
            list.city = list.city.replace('市', '');
            list.save(function(){cb1()});
        }, cb)
    }
], function (x, y) {
    console.log('x', x, y)
})*/


/*
async.waterfall([
    function (cb) {
        user_traffic.getOne({find: {phone: '18931602876'}}, cb)
    }, function (user, cb) {
        var ccc = _.extend({}, JSON.parse(JSON.stringify(user)));
        delete ccc._id;
        delete ccc.__v;
        for(var i=0; i<1; i++){
            console.log(i)
            ccc.phone = '189000000' + Math.ceil(Math.random() * 100);
            ccc.input_name = 'sujian';
            ccc.time_creation = new Date();
            user_traffic.add(ccc, function(x,y){
                console.log(x,y)
                // if(i==10000){
                //     cb(null, y)
                // }
            })
            
        }
        cb(null, ccc)
    }
], function (x, y) {
    console.log(x,y)
})*/
/*
async.waterfall([
    function (cb) {
        user_traffic.getList({find: {real_name: /张测/}}, cb)
    }, function (lists, cb) {
        async.eachOfSeries(lists, function (x, y, cb1) {
            // console.log(key,value, cb1)
            x.real_name = x.real_name + '_'+y;
            x.save(cb1)
            
        }, cb)
    }
], function (x, y) {
    console.log(x, y)
})
*/

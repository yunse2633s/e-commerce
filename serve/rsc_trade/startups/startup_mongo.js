/**
 * Created by Administrator on 2016/6/28.
 */
var mongoose = require('mongoose');
var config_server = require('../configs/config_server');
mongoose.Promise = global.Promise;

module.exports = function(){
    console.log(new Date().toString() + ' ok! env: ' + config_server['env']);
    mongoose.connect(config_server['mongodb'], {useMongoClient: true});
    mongoose.connection.on('connected',function() {
        console.log(new Date().toString() + ' ok! ' + __filename.split('/').pop());
    });
    mongoose.connection.on('error',function() {
        var date_string = new Date().toString();
        console.log('mongodb error: ' + date_string + '. Closing....');
        mongoose.connection.close();
    });
    mongoose.connection.on('disconnected',function() {
        var date_string = new Date().toString();
        console.log('mongodb disconnected: ' + date_string + '. Re connecting....');
        mongoose.connect(config_server['mongodb']);
    });
    mongoose.connection.on('close',function() {
        mongoose.connect(config_server['mongodb']);
    });

};

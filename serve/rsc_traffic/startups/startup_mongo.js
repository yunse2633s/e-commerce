/**
 * Created by Administrator on 2018/1/2.
 */
var mongoose = require('mongoose');
var config_server = require('../configs/config_server');
mongoose.Promise = global.Promise;

module.exports = function () {
    mongoose.connect(config_server.mongodb, {useMongoClient: true});
    // mongoose.connect(config_server['mongodb']);

    mongoose.connection.on('connected', function () {
       console.log(new Date().toString() + 'ok!' + __filename.split('/').pop());
    });

    mongoose.connection.on('error', function(){
        var date_string = new Date().toString();
        console.log('mongoose error: ' + date_string + '. Closing');
        mongoose.connection.close();
    });

    mongoose.connection.on('disconnected', function () {
        var date_string = new Date().toString();
        console.log('mongodb disconnected: ' + date_string + '. Re connection');
        mongoose.connect(config_server['mongodb']);
    });
    
    mongoose.connection.on('close', function () {
       mongoose.connect(config_server['mongodb']); 
    });
};
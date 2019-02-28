/**
 * Created by Administrator on 2016/6/28.
 */
var mongoose = require('mongoose');

var config_server = require('../configs/config_server');


module.exports = function(){

    mongoose.Promise = global.Promise;//不加这句话，会报错Mongoose: mpromise (mongoose's default promise library) is deprecated, plug in your own promise library instead: http://mongoosejs.com/docs/promises.html
    mongoose.connect(config_server.mongodb, {useMongoClient: true});

    mongoose.connection.on('connected',function() {
        var date_string = new Date().toString();
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
        mongoose.connect(config_server.mongodb);
    });

    mongoose.connection.on('close',function() {
        mongoose.connect(config_server.mongodb);
    });

};

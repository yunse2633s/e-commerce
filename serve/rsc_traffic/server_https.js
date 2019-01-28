/**
 * Created by Administrator on 2015/11/6 0006.
 */
 require('./startups/startup_global_load')();
 require('./startups/startup_mongo')();
 require('./startups/startup_timer')();
 require('./startups/startup_express_https')();

/*

var fs = require('fs');
var https = require('https');
var morgan = require('morgan');
var express = require('express');
var mongoose = require('mongoose');
var CronJob = require('cron').CronJob;
var body_parser = require('body-parser');
var config_server = require('./configs/config_server');
var responseTime = require('response-time');

mongoose.Promise = global.Promise;
mongoose.connect(config_server.mongodb, {useMongoClient: true});

mongoose.connection.on('connected',function() {
    var date_string = new Date().toString();
    console.log('mongodb connection established: ' + date_string);
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

var app = express();

app.all("*", function(req, res, next){
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "x-access-token, Origin, X-Requested-With, Content-Type, Content-Length, Accept,version, package-name");
    res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
    next();
});

app.use(express.static(__dirname + '/temp'));
app.use(body_parser.urlencoded({extended:true}));
app.use(body_parser.json());
app.use(morgan('tiny'));
app.use(require('./middlewares/mid_receive')());
//记录接口压力情况
app.use(responseTime(function (req, res, time) {
  require('./lib/lib_pressure').save(req, time);
}));

app.use('/api/demand_c', require('./routes/client/api_demand')());
app.use('/api/offer_c', require('./routes/client/api_offer')());
app.use('/api/order_c', require('./routes/client/api_order')());
app.use('/api/plan_c', require('./routes/client/api_plan')());
app.use('/api/stat_c', require('./routes/client/api_user_stat')());

app.use('/api/driver_demand_c', require('./routes/client/api_driver_demand')());
app.use('/api/driver_offer_c', require('./routes/client/api_driver_offer')());
app.use('/api/driver_order_c', require('./routes/client/api_driver_order')());
app.use('/api/driver_plan_c', require('./routes/client/api_driver_plan')());

app.use('/api/line_c', require('./routes/client/api_line')());

// app.use('/api/server/demand', require('./routes/server/api_demand')());
app.use('/api/server/offer', require('./routes/server/api_offer')());
app.use('/api/server/common', require('./routes/server/api_common')());
app.use('/api/server/driver_order', require('./routes/server/api_driver_order')());

app.use(require('./middlewares/mid_send')());

app.get('/',function(req,res) {
    res.send({status:'success',msg:'Welcome to the TRAFFIC module of RSC system.'});
});

app.use('*',function(req, res) {
    res.send({status:'not_found'});
});
var options = {
   // key: fs.readFileSync('./privatekey.pem'),
   // cert: fs.readFileSync('./certificate.pem')
    pfx:fs.readFileSync('./keys/server.pfx'),
    passphrase:'a11111'
};
https.createServer(options, app).listen(config_server.https_port, function (err) {
    console.log('=================================================');
    if(err) {
        console.log('Error Occurred When Starting Server, ' + new Date().toString());
    } else {
        
        console.log('Server Started. ' + new Date().toString());
        console.log('===================config========================');
        console.log(config_server);
    }
});


*/

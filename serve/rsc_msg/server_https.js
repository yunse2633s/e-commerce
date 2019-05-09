/**
 * Created by Administrator on 2015/11/6 0006.
 */
global.https_server = true;
var fs = require('fs');
var https = require('https');
var express = require('express');
var mongoose = require('mongoose');
var morgan = require('morgan');
var node_schedule = require('node-schedule');
var body_parser = require('body-parser');
var config_common = require('./configs/config_common');
var config_server = require('./configs/config_server');
var schedule = require('./configs/schedule');


// 日常安排
var daily_rule = new node_schedule.RecurrenceRule();
daily_rule.hour = 0;
daily_rule.minute = 1;
var run_daily_schedule = node_schedule.scheduleJob(daily_rule, function()
{
    schedule.removeAllReadMsg();
});

// 每月安排
var monthly_rule = new node_schedule.RecurrenceRule();
monthly_rule.date = 1;
var run_monthly_schedule = node_schedule.scheduleJob(monthly_rule, function()
{
    schedule.removeOldMsg();
});

var app = express();
mongoose.Promise = global.Promise;
mongoose.connect(config_server.mongodb);
mongoose.connection.on('connected',function()
{
    var date_string = new Date().toString();
    console.log('DB connection established: ' + date_string);
});
mongoose.connection.on('error',function()
{
    var date_string = new Date().toString();
    console.log('DB error: ' + date_string + '. Closing....');
    mongoose.connection.close();
});
mongoose.connection.on('disconnected',function()
{
    var date_string = new Date().toString();
    console.log('DB disconnected: ' + date_string + '. Re connecting....');
    mongoose.connect(config_server.mongodb);
});
mongoose.connection.on('close',function()
{
    mongoose.connect(config_server.mongodb);
});

//var log_stream = fs.createWriteStream('./log.txt',{flags:'a'});
//app.use(morgan('combined',{stream:log_stream}));
app.use(morgan('tiny'));
app.use(body_parser.json());
app.use(body_parser.urlencoded({extended:true}));

app.all("*", function(req, res, next){
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, x-access-token, Content-Type, Content-Length, Accept,version, package-name");
    res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
    next();
});

app.use(require('./middlewares/mid_receive')());

app.use('/msg',require('./routes/api_msg')(app,express));
app.use('/api/message', require('./routes/api_message')());
app.use('/api/push', require('./routes/api_push')());

app.use(require('./middlewares/mid_send')());

app.get('/',function(req,res)
{
    res.send({status:'success',msg:'WELCOME. This is the msg server for RSC'});
});

app.use('*',function(req,res)
{
    res.send({status:'not_found'});
});
var options = {
   // key: fs.readFileSync('./privatekey.pem'),
   // cert: fs.readFileSync('./certificate.pem')
    pfx:fs.readFileSync('./keys/server.pfx'),
    passphrase:'a11111'
};


https.createServer(options, app).listen(config_server.port_https, function (err) {
    console.log('=================================================');
    if(err) {
        console.error('Error Occurred When Starting Server, ' + new Date().toString());
    } else {
        console.log('Https Server Started. ' + new Date().toString());
        //new CronJob('0 0 3 * * *', function() {
        //    require('./setup/setup_SMS').clearLastDayLog();
        //    require('./setup/setup_Invitation').clearBeforeYestdayInvitation();
        //}, null, true);
        console.log('===================config========================');
    }
});



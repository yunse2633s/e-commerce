/**
 * Created by Administrator on 2015/11/6 0006.
 */
 require('./startups/startup_global_load')();
 require('./startups/startup_mongo')();
 require('./startups/startup_timer')();
 require('./startups/startup_express_http')();

/*

var morgan = require('morgan');
var express = require('express');
var mongoose = require('mongoose');
var CronJob = require('cron').CronJob;
var body_parser = require('body-parser');
var config_server = require('./configs/config_server');
var scheduler = require('node-schedule');
var setup_demand = require('./setup/setup_demand');
// var responseTime = require('response-time');


// 每15分进行一次
// var schedule_rule_min_5 = new scheduler.RecurrenceRule();
// schedule_rule_min_5.minute = [0,10,20,30,40,50];
// scheduler.scheduleJob(schedule_rule_min_5,function()
// {
    // setup_demand.offersendsmsthirtymin(null,null,null);
    // setup_demand.offersendsmstwelvehours();
// });

// config_server = config_server[config_server.env];
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



var app = express();
app.all("*", function(req, res, next){
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "x-access-token, Origin, X-Requested-With, Content-Type, Content-Length, Accept,version, package-name");
    res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
    next();
});
// app.use(require('express-status-monitor')());
app.use(express.static(__dirname + '/temp'));
app.use(body_parser.urlencoded({extended:true}));
app.use(body_parser.json());
app.use(morgan('tiny'));
app.use(require('./middlewares/mid_receive')());
//记录接口压力情况
// app.use(responseTime(function (req, res, time) {
//   require('./lib/lib_pressure').save(req, time);
// }));

app.use('/api/demand_c', require('./routes/client/api_demand')());
app.use('/api/offer_c', require('./routes/client/api_offer')());
app.use('/api/order_c', require('./routes/client/api_order')());
app.use('/api/plan_c', require('./routes/client/api_plan')());
// app.use('/api/stat_c', require('./routes/client/api_user_stat')());
app.use('/api/stat_c', require('./routes/client/api_stat')());

app.use('/api/driver_demand_c', require('./routes/client/api_driver_demand')());
app.use('/api/driver_offer_c', require('./routes/client/api_driver_offer')());
app.use('/api/driver_order_c', require('./routes/client/api_driver_order')());
app.use('/api/driver_plan_c', require('./routes/client/api_driver_plan')());

app.use('/api/line_c', require('./routes/client/api_line')());

app.use('/api/server/order', require('./routes/server/api_order')());
app.use('/api/server/offer', require('./routes/server/api_offer')());
app.use('/api/server/common', require('./routes/server/api_common')());
app.use('/api/server/driver_order', require('./routes/server/api_driver_order')());

app.use(require('./middlewares/mid_send')());

app.get('/',function(req,res) {
    if(req.hostname == '192.168.3.100'){
        var spawn=require('child_process').spawn;
        var ping=spawn('d:/work/rsc-client/runWinScp.bat');
        ping.stdout.setEncoding('utf8')
        ping.stdout.on('data', function(data){
            console.log(data)
        })
        ping.on('exit',function(){
            console.log("jinchengtuichu")
            res.send({status:'success',msg:'Welcome to the TRAFFIC module of RSC system.'});
        })
    }else{
        res.send({status:'success',msg:'Welcome to the TRAFFIC module of RSC system.'});
    }



});

app.use('*',function(req, res) {
    res.send({status:'not_found'});
});

app.listen(config_server.port,function(err) {
    console.log('=================================================');
    if(err) {
        console.log('Error Occurred When Starting Server, ' + new Date().toString());
    } else {
        new CronJob('0 *!/1 * * * *', function() {
            require('./setup/setup_demand').close_validty_demand();  //处理物流需求单
        }, null, true);

        new CronJob('20 *!/1 * * * *', function() {
            require('./setup/setup_driver_demand').close_validty_demand(); //处理过期司机需求单
        }, null, true);

        new CronJob('20 *!/1 * * * *', function() {
            require('./setup/setup_driver_order').close_validty_order(); //处理过期司机需求单
        }, null, true);

        //每天12点 发短信
        new CronJob('0 1 12 * * *', function() {
            require('./setup/setup_driver_order').msg_noon_order(); //处理过期司机需求单
        }, null, true);
        //每天24点 费用转账
        new CronJob('0 30 23 * * *', function() {
            require('./setup/setup_driver_order').pay_zero_order(); //处理过期司机需求单
        }, null, true);

        console.log('Server Started. ' + new Date().toString());
        console.log('===================config========================');
        console.log(config_server);
    }
});
*/

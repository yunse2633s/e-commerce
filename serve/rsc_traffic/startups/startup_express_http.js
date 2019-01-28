/**
 * Created by Administrator on 2018/1/2.
 */
/**
 *
 */
var fs = require('fs');
var morgan = require('morgan');
var express = require('express');
var body_parser = require('body-parser');
var config_server = require('../configs/config_server');
var responseTime = require('response-time');

module.exports = function () {
    var app = express();
    app.all('*', function (req, res, next) {
        res.header('Access-Control-Allow-Origin', '*');
        res.header("Access-Control-Allow-Headers", "x-access-token, Origin, X-Requested-With, Content-Type, Content-Length, Accept,version, package-name");
        res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
        next();
    });
    app.use(morgan('tiny'));    //输出接口响应时间
    app.use(express.static(__dirname.replace('/startups', config_server['file_path'])));
    //解析客户端参数
    app.use(body_parser.urlencoded({extended: true}));
    app.use(body_parser.json());
    app.use(require('../middlewares/mid_receive')());
    
    //记录接口压力情况
    app.use(responseTime(function (req, res, time) {
      require('../lib/lib_pressure').save(req, time);
    }));
    
    //客户端业务逻辑
    var fileArr = fs.readdirSync(__dirname.replace('startups', 'routes/client'));
    for(var i = 0; i < fileArr.length; i++){
        var fileName1 = fileArr[i];
        var fileName2 = fileName1.split('.')[0];
        var fileName3 = fileName2.split('api_')[1];
        if(fileName3 && fileName2){
            app.use('/api/' + fileName3 + '_c', require('../routes/client/' + fileName2)(app, express));
        }
    }
    //服务端业务逻辑
    fileArr = fs.readdirSync(__dirname.replace('startups', 'routes/server'));
    for(var j = 0; j < fileArr.length; j++){
        fileName1 = fileArr[j];
        fileName2 = fileName1.split('.')[0];
        fileName3 = fileName2.split('api_')[1];
        if(fileName3 && fileName2){
            app.use('/api/server/' + fileName3, require('../routes/server/' + fileName2)(app, express))
        }
    }
    //向请求方发送数据
    app.use(require('../middlewares/mid_send')());
    //默认访问时的结果
    app.get('/', function (req, res) {
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
    //无匹配路由返回错误状态
    app.use('*', function (req, res) {
        res.send({status: 'url_not_found'});
    });
    //监听端口
    app.listen(config_server['port'], function (err) {
        if(err){
            console.log(new Date().toString() + ' err! ' + __filename.split('/').pop());
        }else{
            console.log(new Date().toString() + ' ok! ' + __filename.split('/').pop());
        }
    });

};
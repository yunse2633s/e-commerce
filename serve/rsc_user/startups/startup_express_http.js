/**
 * Created by Administrator on 2017/4/9.
 */
var fs = require('fs');
var morgan = require('morgan');
var express = require('express');
var body_parser = require('body-parser');
var responseTime = require('response-time');

var config_common = require('../configs/config_common');
var config_server = require('../configs/config_server');

module.exports = function () {

    var app = express();

    //所有请求可以跨域访问，允许请求方式，heeaders允许的字段
    app.all("*", function (req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Content-Length, Accept, User-Agent, x-access-token, version, package-name");
        res.header("Access-Control-Allow-Methods", "PUT, POST, GET, DELETE, OPTIONS");
        next();
    });

    app.use(morgan('tiny'));    //输出请求接口响应时间
    app.use(express.static(__dirname.replace('/startups', config_common.file_path)));   //此目录可以直接浏览器访问,开发版存储图片的路径

    //解析客户端传参
    app.use(body_parser.urlencoded({extended: true}));
    app.use(body_parser.json());

    app.use(require('../middlewares/mid_receive')());   //中间件统一处理接收数据
    //记录接口压力情况
    app.use(responseTime(function (req, res, time) {
        global.lib_pressure.save(req, time);
    }));

    var fileArr;
    var fileName1;
    var fileName2;
    var fileName3;

    //客户端业务逻辑
    fileArr = fs.readdirSync(__dirname.replace('startups', 'routes/client'));
    for (var i = 0; i < fileArr.length; i++) {
        fileName1 = fileArr[i];                     //包括api名,包括扩展名      api_truck.js
        fileName2 = fileName1.split('.')[0];        //包括api名,不包括扩展名    api_truck
        fileName3 = fileName2.split('api_')[1];     //不包括api名,            truck
        if (fileName2 && fileName3) {
            app.use('/api/' + fileName3, require('../routes/client/' + fileName2)());
        }
    }

    //服务器业务逻辑
    fileArr = fs.readdirSync(__dirname.replace('startups', 'routes/server'));
    for (var j = 0; j < fileArr.length; j++) {
        fileName1 = fileArr[j];                     //包括api名,包括扩展名      api_truck.js
        fileName2 = fileName1.split('.')[0];        //包括api名,不包括扩展名    api_truck
        fileName3 = fileName2.split('api_')[1];     //不包括api名,            truck
        if (fileName2 && fileName3) {
            app.use('/api/server/' + fileName3, require('../routes/server/' + fileName2)());
        }
    }

    app.use(require('../middlewares/mid_send')());  //统一发送数据中间件

    //浏览器默认访问显示数据表示服务启动成功
    app.get('/', function (req, res) {
        res.send({status: 'success', msg: 'Welcome to the USER module of RSC system.'});
    });

    //无匹配路由回错误状态
    app.use('*', function (req, res) {
        res.send({status: 'not_found'});
    });

    //监听端口
    app.listen(config_server.port, function (err) {
        if (err) {
            console.log(new Date().toString() + ' err! ' + __filename.split('/').pop());
        } else {
            console.log(new Date().toString() + ' ok! ' + __filename.split('/').pop());
        }
    });

};

/**
 * Created by Administrator on 2018/4/4.
 */
var https = require('https');
var http = require('http');
var async = require('async');
var fs = require('fs');
var path = require('path');
var querystring = require('querystring')

//baidu id
var team = 'rsc'
var App_ID = 'App_ID'; //App_ID
var client_id = 'API_Key'; //API_Key
var client_secret = 'Secret_Key'; //Secret_Key
var data = {}
//换取token
// https://openapi.baidu.com/oauth/2.0/token
var hostname = 'openapi.baidu.com',
    hostpath = '/oauth/2.0/token?grant_type=client_credentials&client_id=' +client_id+ '&client_secret=' + client_secret;

async.waterfall([
    function(cb){
        //获取token
        var req2 = http.request({
            hostname: hostname,
            port: 80,
            path: hostpath,
            method:'GET'
        }, function(res){
            var chunks = [];
            res.on('data', function(chunk){
                chunks.push(chunk);
            });
            res.on('end', function(){
                var body = Buffer.concat(chunks);
                cb(null, body.toString());
            })
        });
        req2.on('error', function(e) {
            return cb(e.message);
        });
        req2.write('');
        req2.end();
    }, function(token, cb){
        if(token){
            var tok = JSON.parse(token).access_token;
        }        
        var now = (new Date()).getTime();
        data.order_id = now;
        data.text = '老司机,梓朦物流货运发布邯郸到海口的运输再生资源110吨,快来接单'
        var postData = querystring.stringify({
            //选填
            "spd": 5,   // 表示朗读的语速，9代表最快，1是最慢（撩妹请用2，绕口令请用9）
            "per": 0,   //0,1,3,4 发音选择
            "vol": 10,  //0-15 音量
            "pit": 9,   //0-9音调
            //必填
            "tex": data.text,// 这句话就是要转换为语音的
            'tok': tok,//token.access_token,
            'cuid': team + App_ID,
            'ctp': 1 ,
            "lan": "zh",    // zh表示中文
        });

        var options = {
            hostname: "tsn.baidu.com",
            port: 80,
            path: "/text2audio?" + postData,
            method: 'POST',
        };
        if(!cb){
            cb = function(){};
        }
        var fileArr = __dirname.replace('lib', 'temp');
        var filePath = path.normalize(fileArr + '/' + data.order_id +'.mp3');

        fs.exists(filePath, function(exists){
            if(exists){
                cb(null, data.order_id +'.mp3')
            }else{
                var request = http.request(options, function(res) {
                    var chunks = [];
                    res.on("data", function (chunk) {
                        chunks.push(chunk);   // 获取到的音频文件数据暂存到chunks里面
                    });

                    res.on("end", function () {
                        var body = Buffer.concat(chunks);
                        fs.writeFileSync(filePath, body);
                        cb(null, data.order_id +'.mp3');
                    });
                });
                request.on('error', function(e) {
                    return cb(e.message);
                });
                request.write(postData);
                request.end();
            }
        });
    }
], function(x, y){
    console.log(x, y)
})

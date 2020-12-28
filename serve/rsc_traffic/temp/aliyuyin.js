var fs = require('fs');
var http = require('http');
var https = require('https');
var querystring = require('querystring');
var crypto = require('crypto');
var path = require('path');
var postfix = 'mp3';

// String stringToSign = method + "\n" + accept + "\n" + bodyMd5 + "\n" + content_type + "\n" + date;
// 拼装stringToSign的值为：“POST\napplication/json\nAsdYv2nI4ijTfKYmKX4h/Q==\napplication/json\nWed, 31 May 2017 08:51:26 GMT”。
var method = 'POST', 
    access_key='access_key', 
    accept = 'audio/'+ postfix + ', application/json', 
    content_type='text/plain',
    Access_Key_ID = 'Access_Key_ID',
    Access_Key_Secret = 'Access_Key_Secret',
    date = (new Date()).toUTCString(),
    text = '"我爱你"';

var bodyMd5=crypto.createHash("md5").update(text).digest().toString('base64');

var signature_content = method + "\n" + accept + "\n" + bodyMd5 + "\n" + content_type + "\n" + date,
    
    signature = crypto.createHmac('sha1', Access_Key_Secret).update(signature_content).digest().toString('base64');

//https://nlsapi.aliyun.com/recognize?model=chat, 一句话识别
var options = {
    hostname: 'nlsapi.aliyun.com', //'http://nlsapi.aliyun.com/speak?encode_type=pcm&voice_name=xiaoyun&volume=50'
    port: 443,
    path: "/speak?encode_type="+ postfix +"&voice_name=xiaoyun&volume=50",
    // url: 'http://nlsapi.aliyun.com/speak?encode_type=pcm&voice_name=xiaoyun&volume=50',
    method: 'POST',
    headers: {
        "Authorization": 'Dataplus '+ Access_Key_ID + ':'+ signature,
        "Content-Type": content_type,
        "Accept": accept,
        "Date": date
    },
    body: encodeURI(encodeURI(text))
};
console.log('headers',options)

    var request = https.request(options, function(res) {
        var chunks = [];
        res.on("data", function (chunk) {
            console.log('chunk', chunk)
            chunks.push(chunk);   // 获取到的音频文件数据暂存到chunks里面
        });

        res.on("end", function () {
            // 这里用到了Buffer模块，大概意思就是把获取到的语音文件流存入到body里面，body是一个Buffer
            var body = Buffer.concat(chunks);
            console.log('body', body.toString())
        });
    });
    request.on('error', function(e) {
        console.log('aliyuyin', e)
        return e;
        // return cb(e.message);
    });
    request.write('end');
    request.end();

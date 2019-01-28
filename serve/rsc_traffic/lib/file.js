/**
 * Created by Administrator on 2016/4/9.
 */
var fs = require('fs');
var crypto = require('crypto');
var request = require('request');
var config_server = require('../configs/config_server');

// 从阿里云上删除一个文件
exports.deleteImgFromAliyun = function (url) {
    var file_name = url.split('/').pop();
    var CanonicalizedOSSHeaders = '';
    var CanonicalizedResource = '/' + config_server.OSS.bucket_img + '/' + file_name;
    var requestDate = new Date().toUTCString();
    var VERB = 'DELETE';
    var signature_content = VERB + '\n\n' + 'application/octet-stream\n' + requestDate + '\n' + CanonicalizedOSSHeaders + CanonicalizedResource;
    var signature = crypto.createHmac('sha1',config_server.OSS.access_key).update(signature_content).digest().toString('base64');

    var header_authorization = 'OSS ' + config_server.OSS.access_id + ':' + signature;

    var headers =
    {
        'Authorization':header_authorization,
        'Cache-Control':'no-cache',
        'Content-Length':0,
        'Content-Type':'application/octet-stream',
        'Date':requestDate,
        'Host':config_server.OSS.bucket_img_url
    };

    var option =
    {
        'method':'DELETE',
        'headers':headers,
        'url':'http://' + config_server.OSS.bucket_img_url + '/' + file_name
    };

    request(option, function(err,res_header,res_body)
    {
        if(err || res_header.statusCode != 204)
        {
            var msg = 'Failed to DELETE FILE: ' + file_name + ' | AT: ' + new Date().toLocaleString();
            console.log(msg);
        }
    });
};

// 从本地删除一个文件
exports.deleteImgFromLocal = function(url){
    try{
        var arr = url.split('/');
        var dir = __dirname.replace('/lib', config_server.file_path);
        fs.unlinkSync(dir+arr[arr.length-1]);
    }catch(err){}
};
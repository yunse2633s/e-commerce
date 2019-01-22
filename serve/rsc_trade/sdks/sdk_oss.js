/**
 * Created by Administrator on 2017/10/23.
 */
var crypto = require('crypto');
var request = require('request');
var config_common = global.config_common;

// 从阿里云上删除一个文件
exports.deleteImgFromAliyun = function (url) {
    if(!url){
        return;
    }
    var file_name = url.split('/').pop();
    var CanonicalizedOSSHeaders = '';
    var bucket = '';
    if (process.env.node_env && process.env.node_env !== 'dev') {
        bucket = config_common.OSS.bucket_img;
    }else{
        bucket = config_common.OSS_DEV.bucket_img;
    }
    var CanonicalizedResource = '/' + bucket + '/' + file_name;
    var requestDate = new Date().toUTCString();
    var VERB = 'DELETE';
    var signature_content = VERB + '\n\n' + 'application/octet-stream\n' + requestDate + '\n' + CanonicalizedOSSHeaders + CanonicalizedResource;
    var signature = crypto.createHmac('sha1',config_common.OSS.access_key).update(signature_content).digest().toString('base64');

    var header_authorization = 'OSS ' + config_common.OSS.access_id + ':' + signature;

    var bucket_url = '';
    if (process.env.node_env && process.env.node_env !== 'dev') {
        bucket_url = config_common.OSS.bucket_img_url;
    }else{
        bucket_url = config_common.OSS_DEV.bucket_img_url;
    }

    var headers =
        {
            'Authorization': header_authorization,
            'Cache-Control': 'no-cache',
            'Content-Length': 0,
            'Content-Type': 'application/octet-stream',
            'Date': requestDate,
            'Host': bucket_url
        };

    var option =
        {
            'method': 'DELETE',
            'headers': headers,
            'url': 'http://' + bucket_url + '/' + file_name
        };

    request(option, function (err, res_header, res_body) {
        if (err || res_header.statusCode !== 204) {
            var msg = 'Failed to DELETE FILE: ' + file_name + ' | AT: ' + new Date().toLocaleString();
            console.log(msg);
        }
    });
};
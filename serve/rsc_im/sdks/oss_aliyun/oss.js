/**
 * Created by Administrator on 2017/5/24.
 */
/**
 * Created by Administrator on 2016/4/9.
 */
var fs = require('fs');
var async = require('async');
var crypto = require('crypto');
var request = require('request');

var config = require('./config');
var config_server = require('../../configs/config_server');

// 从阿里云上删除一个文件
exports.deleteImgFromAliyun = function (url) {
    var file_name = url.split('/').pop();
    var CanonicalizedOSSHeaders = '';
    var CanonicalizedResource = '/' + config_common.OSS.bucket_img + '/' + file_name;
    var requestDate = new Date().toUTCString();
    var VERB = 'DELETE';
    var signature_content = VERB + '\n\n' + 'application/octet-stream\n' + requestDate + '\n' + CanonicalizedOSSHeaders + CanonicalizedResource;
    var signature = crypto.createHmac('sha1', config_common.OSS.access_key).update(signature_content).digest().toString('base64');

    var header_authorization = 'OSS ' + config_common.OSS.access_id + ':' + signature;

    var headers =
        {
            'Authorization': header_authorization,
            'Cache-Control': 'no-cache',
            'Content-Length': 0,
            'Content-Type': 'application/octet-stream',
            'Date': requestDate,
            'Host': config_common.OSS.bucket_img_url
        };

    var option =
        {
            'method': 'DELETE',
            'headers': headers,
            'url': 'http://' + config_common.OSS.bucket_img_url + '/' + file_name
        };

    request(option, function (err, res_header, res_body) {
        if (err || res_header.statusCode != 204) {
            var msg = 'Failed to DELETE FILE: ' + file_name + ' | AT: ' + new Date().toLocaleString();
            console.log(msg);
        }
    });
};


// 上传一个文件到阿里云
exports.upload = function (path, file_name, cb) {
    var url = 'http://' + config[config_server.env].bucket_img_url + '/' + file_name;
    var file_data = fs.readFileSync(path + file_name);
    // 上传至阿里云OSS，并删除本地文件
    fs.unlinkSync(path + file_name);
    var CanonicalizedOSSHeaders = '';
    var CanonicalizedResource = '/' + config[config_server.env].bucket_img + '/' + file_name;
    var requestDate = new Date().toUTCString();
    var VERB = 'PUT';
    var signature_content = VERB + '\n\n' + 'application/octet-stream\n' + requestDate + '\n' + CanonicalizedOSSHeaders + CanonicalizedResource;
    var signature = crypto.createHmac('sha1', config[config_server.env].access_key).update(signature_content).digest().toString('base64');
    var header_authorization = 'OSS ' + config[config_server.env].access_id + ':' + signature;
    var headers = {
        'Authorization': header_authorization,
        'Cache-Control': 'no-cache',
        'Content-Disposition': 'attachment;filename=' + file_name,
        'Content-Length': file_data.length,
        'Content-Type': 'application/octet-stream',
        'Date': requestDate,
        'Host': config[config_server.env].bucket_img_url
    };
    var option = {
        'method': 'PUT',
        'headers': headers,
        'url': 'http://' + config[config_server.env].bucket_img_url + '/' + file_name,
        'body': file_data
    };
    request(option, function (err, http_req, http_res) {
        if (err) {
            return cb(err);
        }
        if (http_req.statusCode == '200') {
            cb(null, url);
        } else {
            cb(http_res);
        }
    });
};
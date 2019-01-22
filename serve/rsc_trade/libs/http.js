/**
 * Created by Administrator on 2015/12/7.
 */
var jwt = require('jsonwebtoken');
var request = require('request');
var querystring = require('querystring');
var config_common = global.config_common;
var config_server = global.config_server;
var mw = require('../libs/middleware');
var fs = require('fs');
var crypto = require('crypto');
var http = require('http');

exports.sendUserServerNotToken = function (req, data, url, cb) {
    if (!cb) {
        cb = function () {
        };
    }
    data = querystring.stringify(data);
    var headers;
    if (req) {
        headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'x-access-token': req.headers['x-access-token']
        }
    } else {
        headers = {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    }
    var option = {
        body: data,
        url: 'http://' + config_server.user_server_ip + ':' + config_server.user_server_port + url,
        method: 'POST',
        headers: headers
    };
    request(option, function (err, http_res, http_req) {
        if (err) return cb(err);
        if (JSON.parse(http_req).status === 'success') {
            cb(null, JSON.parse(http_req).data)
        } else {
            cb(JSON.parse(http_req).msg);
        }
    });
};
exports.sendMsgServerNotToken = function (req, data, url, cb) {
    if (!cb) {
        cb = function () {
        };
    }
    data = querystring.stringify(data);
    var headers;
    if (req) {
        headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'x-access-token': req.headers['x-access-token'],
            'package-name': req.headers['package-name']
        }
    } else {
        headers = {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    }
    var option = {
        body: data,
        url: 'http://' + config_server.msg_server_ip + ':' + config_server.msg_server_port + url,
        method: 'POST',
        headers: headers
    };
    request(option, function (err, http_res, http_req) {
        if (err) return cb(err);
        if (JSON.parse(http_req).status === 'success') {
            cb(null, JSON.parse(http_req).data);

        } else {
            cb(JSON.parse(http_req).status);
        }
    });
};

exports.sendStoreServer = function (data, url, cb) {
    if (!cb) {
        cb = function () {
        };
    }
    request({
        body: querystring.stringify({token: jwt.sign(data, config_common.secret_keys.store, {expiresIn: config_common.token_server_timeout})}),
        url: 'http://' + config_server.store_server_ip + ':' + config_server.store_server_port + url,
        method: 'POST',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'}
    }, function (err, http_res, http_req) {
        if (err) return cb(err);
        if (JSON.parse(http_req).status === 'success') {
            cb(null, JSON.parse(http_req).data)
        } else {
            cb(JSON.parse(http_req).msg);
        }
    });
};

exports.sendUserServer = function (data, url, cb) {
    if (!cb) {
        cb = function () {
        };
    }
    request({
        body: querystring.stringify({token: jwt.sign(data, config_common.secret_keys.user, {expiresIn: config_common.token_server_timeout})}),
        url: 'http://' + config_server.user_server_ip + ':' + config_server.user_server_port + url,
        method: 'POST',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'}
    }, function (err, http_res, http_req) {
        if (err) return cb(err);
        if (JSON.parse(http_req).status === 'success') {
            cb(null, JSON.parse(http_req).data)
        } else {
            cb(JSON.parse(http_req).msg);
        }
    });
};

//跨服务器请求信用中心信息
exports.sendCreditServer = function (data, url, cb) {
    if (!cb) {
        cb = function () {
        };
    }
    request({
        body: querystring.stringify({token: jwt.sign(data, config_common.secret_keys.credit, {expiresIn: config_common.token_server_timeout})}),
        url: 'http://' + config_server.credit_server_ip + ':' + config_server.credit_server_port + url,
        method: 'POST',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'}
    }, function (err, http_res, http_req) {
        if (err) return cb(err);
        if (JSON.parse(http_req).status === 'success') {
            cb(null, JSON.parse(http_req).data)
        } else {
            cb(JSON.parse(http_req).msg);
        }
    });
};



exports.sendAdminServer = function (data, url, cb) {
    if (!cb) {
        cb = function () {
        };
    }
    request({
        body: querystring.stringify({token: jwt.sign(data, config_common.secret_keys.admin, {expiresIn: config_common.token_server_timeout})}),
        url: 'http://' + config_server.admin_server_ip + ':' + config_server.admin_server_port + url,
        method: 'POST',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'}
    }, function (err, http_res, http_req) {
        if (err) return cb(err);
        if (JSON.parse(http_req).status === 'success') {
            cb(null, JSON.parse(http_req).data)
        } else {
            cb(JSON.parse(http_req).msg);
        }
    });
};
exports.sendTrafficServer = function (data, url, cb) {
    if (!cb) {
        cb = function () {
        };
    }
    request({
        body: querystring.stringify({token: jwt.sign(data, config_common.secret_keys.traffic, {expiresIn: config_common.token_server_timeout})}),
        url: 'http://' + config_server.traffic_server_ip + ':' + config_server.traffic_server_port + url,
        method: 'POST',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'}
    }, function (err, http_res, http_req) {
        if (err) return cb(err);
        if (JSON.parse(http_req).status === 'success') {
            cb(null, JSON.parse(http_req).data)
        } else {
            cb(JSON.parse(http_req).msg);
        }
    });
};
exports.sendMsgServer = function (data, url, cb) {
    if (!cb) {
        cb = function () {
        };
    }
    var option = {
        body: querystring.stringify({token: jwt.sign(data, config_common.secret_keys.msg, {expiresIn: config_common.token_server_timeout})}),
        url: 'http://' + config_server.msg_server_ip + ':' + config_server.msg_server_port + url,
        method: 'POST',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'}
    };
    request(option, function (err, http_res, http_req) {
        if (err) return cb(err);
        if (JSON.parse(http_req).status === 'success') {
            cb(null, JSON.parse(http_req).data)

        } else {
            cb(JSON.parse(http_req).status);
        }
    });
};

exports.short_url = function (url, cb) {
    var option = {
        'method': 'GET',
        'headers': {'Content-Type': 'application/x-www-form-urlencoded'},
        'url': 'https://api.weibo.com/2/short_url/shorten.json?access_token=2.00OzYsiGQhK49C8318ab514486GjLD&&url_long=' + url
    };
    request(option, function (err, http_res, http_req) {
        if (err) return cb(err);
        var data = JSON.parse(http_req)['urls'];
        if (!data[0] || !data[0]['url_short']) {
            data = url;
        } else {
            data = data[0]['url_short'];
        }
        cb(null, data);
    });
};
exports.uploadImg = function (data, cb) {
    // 上传至阿里云OSS，并删除本地文件
    var file_data = fs.readFileSync(data.file.path);
    fs.unlinkSync(data.file.path);
    var OSSHeaders = '';
    var Resource = '/' + (process.env.node_env !== 'dev' ? config_common.OSS.bucket_img : config_common.OSS_DEV.bucket_img) + '/' + data.file_name;
    var requestDate = new Date().toUTCString();
    var VERB = 'PUT';
    var signature_content = VERB + '\n\n' + 'application/octet-stream\n' + requestDate + '\n' + OSSHeaders + Resource;
    var signature = crypto.createHmac('sha1', config_common.OSS.access_key).update(signature_content).digest().toString('base64');
    var header_authorization = 'OSS ' + config_common.OSS.access_id + ':' + signature;
    var headers = {
        'Authorization': header_authorization,
        'Cache-Control': 'no-cache',
        'Content-Disposition': 'attachment;filename=' + data.file_name,
        'Content-Length': file_data.length,
        'Content-Type': 'application/octet-stream',
        'Date': requestDate,
        'Host': process.env.node_env !== 'dev' ? config_common.OSS.bucket_img_url : config_common.OSS_DEV.bucket_img_url
    };
    var option = {
        'method': 'PUT',
        'headers': headers,
        'url': 'http://' + (process.env.node_env !== 'dev' ? config_common.OSS.bucket_img_url : config_common.OSS_DEV.bucket_img_url) + '/' + data.file_name,
        'body': file_data
    };
    request(option, function (err) {
        if (err) return cb(err);
        cb(null, data.url);
    });
};
exports.uploadVideo = function (data, cb) {
    // 上传至阿里云OSS，并删除本地文件
    var file_data = fs.readFileSync(data.file.path);
    fs.unlinkSync(data.file.path);
    var OSSHeaders = '';
    var Resource = '/' + (process.env.node_env !== 'dev' ? config_common.VIDEO_OSS.bucket_video : config_common.OSS_DEV.bucket_img) + '/' + data.file_name;
    var requestDate = new Date().toUTCString();
    var VERB = 'PUT';
    var signature_content = VERB + '\n\n' + 'application/octet-stream\n' + requestDate + '\n' + OSSHeaders + Resource;
    var signature = crypto.createHmac('sha1', config_common.OSS.access_key).update(signature_content).digest().toString('base64');
    var header_authorization = 'OSS ' + config_common.OSS.access_id + ':' + signature;
    var headers = {
        'Authorization': header_authorization,
        'Cache-Control': 'no-cache',
        'Content-Disposition': 'attachment;filename=' + data.file_name,
        'Content-Length': file_data.length,
        'Content-Type': 'application/octet-stream',
        'Date': requestDate,
        'Host': process.env.node_env !== 'dev' ? config_common.VIDEO_OSS.bucket_video_url : config_common.OSS_DEV.bucket_img_url
    };
    var option = {
        'method': 'PUT',
        'headers': headers,
        'url': 'http://' + (process.env.node_env !== 'dev' ? config_common.VIDEO_OSS.bucket_video_url : config_common.OSS_DEV.bucket_img_url) + '/' + data.file_name,
        'body': file_data
    };
    request(option, function (err) {
        if (err) return cb(err);
        cb(null, data.url);
    });
};
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
        if (err || res_header.statusCode !== 204) {
            var msg = 'Failed to DELETE FILE: ' + file_name + ' | AT: ' + new Date().toLocaleString();
            console.log(msg);
        }
    });
};
// 从本地删除一个文件
exports.deleteImgFromLocal = function (url) {
    try {
        var arr = url.split('/');
        var dir = __dirname.replace('/libs', config_common.file_path);
        fs.unlinkSync(dir + arr[arr.length - 1]);
    } catch (err) {

    }
};
//发短信
exports.sendMsgServerSMS1 = function (req, type, data, cb) {
    if (!cb) {
        cb = function () {
        };
    }
    //if (!config_server.is_sms) {
    //    return cb();
    //}
    if (data && data.content) {
        data.content = JSON.stringify(data.content);
    }
    if (data && data.phone_list) {
        data.phone_list = JSON.stringify(data.phone_list);
    }
    var postData = querystring.stringify(data || {});
    var options = {
        hostname: config_server.msg_server_ip,
        port: config_server.msg_server_port,
        path:'/msg/send_sms1' + '/template' + '/' + type,
        method: 'POST',
        rejectUnauthorized: false,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'x-access-token': req.headers['x-access-token'] || 'xxx',
            'package-name':req.headers['package-name'] || 'xxx'
        }
    };
    var request = http.request(options, function (result) {
        result.setEncoding('utf8');
        var str = '';
        result.on('data', function (chunk) {
            str += chunk;
        });
        result.on('end', function () {
            try {
                if (JSON.parse(str).status == 'success') {
                    return cb(null, JSON.parse(str).data);
                } else {
                    return cb(JSON.parse(str).msg || JSON.parse(str).status);
                }
            } catch (err) {
                console.error('msg_server_http_err!!!\n', str, JSON.stringify(err));
            }
        });
    });
    request.on('error', function (e) {
        return cb(e.message);
    });
    request.write(postData);
    request.end();
};


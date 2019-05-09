/**
 * Created by Administrator on 2015/12/7.
 */
var http = require('http');
var jwt = require('jsonwebtoken');
var querystring = require('querystring');

var config_server = require('../configs/config_server');
var config_common = require('../configs/config_common');

exports.sendUserServer = function (data, path, cb) {
    var postData = querystring.stringify({
        token: jwt.sign(data, config_common.secret_keys.user, {expiresIn: config_common.token_server_timeout})
    });
    var options = {
        hostname: config_server.user_server_ip,
        port: config_server.user_server_port,
        path: path,
        method: 'POST',
        rejectUnauthorized: false,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    };
    if (!cb) {
        cb = function () {};
    }
    var request = http.request(options, function (result) {
        result.setEncoding('utf8');
        var str = '';
        result.on('data', function (chunk) {
            str += chunk;
        });
        result.on('end', function () {
            if (JSON.parse(str).status == 'success') {
                return cb(null, JSON.parse(str).data);
            } else {
                return cb(JSON.parse(str).msg);
            }
        });
    });
    request.on('error', function (e) {
        return cb(e.message);
    });
    request.write(postData);
    request.end();
};

exports.sendMsgServerNoToken = function (data, path, cb) {
    var postData = querystring.stringify(data);
    var options = {
        hostname: config_server.msg_server_ip,
        port: config_server.msg_server_port,
        path: path,
        method: 'POST',
        rejectUnauthorized: false,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    };
    if (!cb) {
        cb = function () {
        };
    }
    var request = http.request(options, function (result) {
        result.setEncoding('utf8');
        var str = '';
        result.on('data', function (chunk) {
            str += chunk;
        });
        result.on('end', function () {
            if (JSON.parse(str).status == 'success') {
                return cb(null, JSON.parse(str).data);
            } else {
                return cb(JSON.parse(str).msg);
            }
        });
    });
    request.on('error', function (e) {
        return cb(e.message);
    });
    request.write(postData);
    request.end();
};

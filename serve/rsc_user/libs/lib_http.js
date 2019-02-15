/**
 * Created by Administrator on 2015/12/7.
 */
var request = require('request');
var jwt = require('jsonwebtoken');
var querystring = require('querystring');
var config_server = require('../configs/config_server');
var config_common = require('../configs/config_common');
var config_api_url = require('../configs/config_api_url');
var http = require('http');

function createTokenServer(data) {
    return jwt.sign(data, config_common.secret_keys.user,
        {
            expiresIn: config_common.token_server_timeout
        });
}

exports.createTokenPhoneServer = function (data) {
    return jwt.sign(data, config_common.secret_keys.phone,
        {
            expiresIn: config_common.token_server_timeout
        });
};

exports.createTokenAdminServer = function (data) {
    return jwt.sign(data, config_common.secret_keys.admin,
        {
            expiresIn: config_common.token_server_timeout
        });
};

exports.sendPhoneServer = function (data, path, cb, extData) {
    var token = this.createTokenPhoneServer(data);
    if (extData) {
        extData.token = token;
    } else {
        extData = {token: token};
    }
    var postData = querystring.stringify(extData);
    var options = {
        hostname: config_server.phone_server_ip,
        port: config_server.phone_server_port,
        path: path,
        method: 'POST',
        rejectUnauthorized: false,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
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
            try {
                if (JSON.parse(str).status == 'success') {
                    return cb(null, JSON.parse(str).data);
                } else {
                    return cb(JSON.parse(str).data);
                }
            } catch (err) {
                console.error('admin_server_http_err!!!\n', str, JSON.stringify(err), options);
            }
        });
    });
    request.on('error', function (e) {
        return cb(e.message);
    });
    request.write(postData);
    request.end();
};

// exports.sendAdminServer = function (req, data, path, cb, extData) {
//     var token = this.createTokenAdminServer(data);
//     if (extData) {
//         extData.token = token;
//     } else {
//         extData = {token: token};
//     }
//     var postData = querystring.stringify(extData);
//     var options = {
//         hostname: config_server.admin_server_ip,
//         port: config_server.admin_server_port,
//         path: path,
//         method: 'POST',
//         rejectUnauthorized: false,
//         headers: {
//             'Content-Type': 'application/x-www-form-urlencoded',
//             'x-access-token': req.headers['x-access-token']
//         }
//     };
//     if (!cb) {
//         cb = function () {
//         };
//     }
//     var request = http.request(options, function (result) {
//         result.setEncoding('utf8');
//         var str = '';
//         result.on('data', function (chunk) {
//             str += chunk;
//         });
//         result.on('end', function () {
//             try {
//                 if (JSON.parse(str).status == 'success') {
//                     return cb(null, JSON.parse(str).data);
//                 } else {
//                     return cb(JSON.parse(str).data);
//                 }
//             } catch (err) {
//                 console.error('admin_server_http_err!!!\n', str, JSON.stringify(err), options);
//             }
//         });
//     });
//     request.on('error', function (e) {
//         return cb(e.message);
//     });
//     request.write(postData);
//     request.end();
// };
exports.sendAdminServer = function (data, path, cb) {
    var postData = querystring.stringify({
        token: jwt.sign(data, config_common.secret_keys.admin, {expiresIn: config_common.token_server_timeout})
    });
    var options = {
        hostname: config_server.admin_server_ip,
        port: config_server.admin_server_port,
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
exports.sendAdminServerNoToken = function (req, data, path, cb) {
    var postData = querystring.stringify(data);
    var options = {
        hostname: config_server.admin_server_ip,
        port: config_server.admin_server_port,
        path: path,
        method: 'POST',
        rejectUnauthorized: false,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'x-access-token': req.headers['x-access-token'] || 'xxx'
        }
    };
    if (!cb) {
        cb = function () {
        };
    }
    var request = http.request(options, function (result) {
        result.setEncoding('utf8');
        //result.on('data', function (chunk) {
        //    if(JSON.parse(chunk).status == 'success'){
        //        return cb(null, JSON.parse(chunk).data);
        //    }else{
        //        return cb(JSON.parse(chunk).msg);
        //    }
        //});
        var str = '';
        result.on('data', function (chunk) {
            str += chunk;
        });
        result.on('end', function () {
            try {
                if (JSON.parse(str).status == 'success') {
                    return cb(null, JSON.parse(str).data);
                } else {
                    return cb(JSON.parse(str).msg);
                }
            } catch (err) {
                console.error('admin_server_http_err!!!\n', str, JSON.stringify(err));
            }
        });
    });
    request.on('error', function (e) {
        return cb(e.message);
    });
    request.write(postData);
    request.end();
};

exports.sendTradeServer = function (data, path, cb) {
    var postData = querystring.stringify({
        token: jwt.sign(data, config_common.secret_keys.trade, {expiresIn: config_common.token_server_timeout})
    });
    var options = {
        hostname: config_server.trade_server_ip,
        port: config_server.trade_server_port,
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
            if (JSON.parse(str).status === 'success') {
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

exports.sendTrafficServer = function (data, path, cb) {
    var postData = querystring.stringify({
        token: jwt.sign(data, config_common.secret_keys.traffic, {expiresIn: config_common.token_server_timeout})
    });
    var options = {
        hostname: config_server.traffic_server_ip,
        port: config_server.traffic_server_port,
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
            if (JSON.parse(str).status === 'success') {
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

exports.sendDynamicServer = function (data, path, cb) {
    var postData = querystring.stringify({
        token: jwt.sign(data, config_common.secret_keys.dynamic, {expiresIn: config_common.token_server_timeout})
    });
    var options = {
        hostname: config_server.dynamic_server_ip,
        port: config_server.dynamic_server_port,
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
//给 聊天服务器（im）发消息 --wly
exports.sendImServer = function (data, path, cb) {
    var postData = querystring.stringify({
        token: jwt.sign(data, config_common.secret_keys.im, {expiresIn: config_common.token_server_timeout})
    });
    var options = {
        //修改为im的端口号和服务器号
        hostname: config_server.im_server_ip,
        port: config_server.im_server_port,
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

exports.sendStatisticalServer = function (data, path, cb) {
    var postData = querystring.stringify({
        token: jwt.sign(data, config_common.secret_keys.statistical, {expiresIn: config_common.token_server_timeout})
    });
    var options = {
        hostname: config_server.statistical_server_ip,
        port: config_server.statistical_server_port,
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

exports.sendTrafficServerNoToken = function (req, data, path, cb) {
    var postData = querystring.stringify(data);
    var options = {
        hostname: config_server.traffic_server_ip,
        port: config_server.traffic_server_port,
        path: path,
        method: 'POST',
        rejectUnauthorized: false,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'x-access-token': req.headers['x-access-token'] || 'xxx'
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
            try {
                if (JSON.parse(str).status == 'success') {
                    return cb(null, JSON.parse(str).data);
                } else {
                    return cb(JSON.parse(str).msg);
                }
            } catch (err) {
                console.error('traffic_server_http_err!!!\n', str, JSON.stringify(err));
            }
        });
    });
    request.on('error', function (e) {
        return cb(e.message);
    });
    request.write(postData);
    request.end();
};

exports.sendUserServerNoToken = function (req, data, path, cb) {
    var postData = querystring.stringify(data);
    var options = {
        hostname: config_server.user_server_ip,
        port: config_server.port,
        path: path,
        method: 'POST',
        rejectUnauthorized: false,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'x-access-token': req.headers['x-access-token']
        }
    };
    if (!cb) {
        cb = function () {
        };
    }
    var request = http.request(options, function (result) {
        result.setEncoding('utf8');
        //result.on('data', function (chunk) {
        //    if(JSON.parse(chunk).status == 'success'){
        //        return cb(null, JSON.parse(chunk).data);
        //    }else{
        //        return cb(JSON.parse(chunk).msg);
        //    }
        //});
        var str = '';
        result.on('data', function (chunk) {
            str += chunk;
        });
        result.on('end', function () {
            try {
                if (JSON.parse(str).status == 'success') {
                    return cb(null, JSON.parse(str).data);
                } else {
                    return cb(JSON.parse(str).msg);
                }
            } catch (err) {
                console.error('user_server_http_err!!!\n', str, JSON.stringify(err), options);
            }
        });
    });
    request.on('error', function (e) {
        return cb(e.message);
    });
    request.write(postData);
    request.end();
};

exports.sendTradeServerNoToken = function (req, data, path, cb) {
    var postData = querystring.stringify(data);
    var options = {
        hostname: config_server.trade_server_ip,
        port: config_server.trade_server_port,
        path: path,
        method: 'POST',
        rejectUnauthorized: false,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'x-access-token': req.headers['x-access-token']
        }
    };
    if (!cb) {
        cb = function () {
        };
    }
    var request = http.request(options, function (result) {
        result.setEncoding('utf8');
        //result.on('data', function (chunk) {
        //    if(JSON.parse(chunk).status == 'success'){
        //        return cb(null, JSON.parse(chunk).data);
        //    }else{
        //        return cb(JSON.parse(chunk).msg);
        //    }
        //});
        var str = '';
        result.on('data', function (chunk) {
            str += chunk;
        });
        result.on('end', function () {
            try {
                if (JSON.parse(str).status == 'success') {
                    return cb(null, JSON.parse(str).data);
                } else {
                    return cb(JSON.parse(str).msg);
                }
            } catch (err) {
                console.error('sendTradeServerNoToken!!!\n', str, JSON.stringify(err), options);
            }
        });
    });
    request.on('error', function (e) {
        return cb(e.message);
    });
    request.write(postData);
    request.end();
};

exports.sendTradeServerNoTokenGet = function (req, data, path, cb) {
    var postData = querystring.stringify({});
    var options = {
        hostname: config_server.trade_server_ip,
        port: config_server.trade_server_port,
        path: path,
        method: 'GET',
        rejectUnauthorized: false,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'x-access-token': req.headers['x-access-token']
        }
    };
    if (!cb) {
        cb = function () {
        };
    }
    var request = http.request(options, function (result) {
        result.setEncoding('utf8');
        //result.on('data', function (chunk) {
        //    if(JSON.parse(chunk).status == 'success'){
        //        return cb(null, JSON.parse(chunk).data);
        //    }else{
        //        return cb(JSON.parse(chunk).msg);
        //    }
        //});
        var str = '';
        result.on('data', function (chunk) {
            str += chunk;
        });
        result.on('end', function () {
            try {
                if (JSON.parse(str).status == 'success') {
                    return cb(null, JSON.parse(str).data);
                } else {
                    return cb(JSON.parse(str).msg);
                }
            } catch (err) {
                console.error('trade_server_http_err!!!\n', str, JSON.stringify(err));
            }
        });
    });
    request.on('error', function (e) {
        return cb(e.message);
    });
    request.write(postData);
    request.end();
};

exports.sendMsgServerMSG = function (operator, target_list, template_id, content, url) {
    if (!operator) {
        operator = config_common.system_id || '000000000000000000000000';
    }
    content = content || [];
    if (!template_id || !target_list ||
        target_list.length == 0 || !template_id ||
        template_id === '' || !content) {
        return console.log('Sending NULL MSG at ' + new Date().toString());
    }
    var req_body = '{';
    req_body += '"operator":"' + operator + '",';
    req_body += '"target_list":[';
    for (var i = 0; i < target_list.length; i++) {
        req_body += '"' + target_list[i] + '"';
        if (i < target_list.length - 1) {
            req_body += ',';
        }
    }
    req_body += '],';
    req_body += '"template_id":"' + template_id + '",';
    req_body += '"content":[';
    for (var i = 0; i < content.length; i++) {
        req_body += '"' + content[i] + '"';
        if (i < content.length - 1) {
            req_body += ',';
        }
    }
    req_body += '],';
    req_body += '"url":"' + url + '"}';
    var headers = {
        'Content-Type': 'application/json'
    };
    var options = {
        'method': 'POST',
        'headers': headers,
        rejectUnauthorized: false,
        'url': 'http://' + config_server.msg_server_ip + ':' + config_server.msg_server_port + '/msg/send_notice',
        'body': req_body
    };
    request(options, function (err, http_req, http_res) {
        if (err) {
            console.log('Sending MSG failed at ' + new Date().toString());
        }
    });
};

exports.sendMsgServerSMS = function (req, type, data, cb) {
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
        path: config_api_url.msg_server_send_sms + '/template' + '/' + type,
        method: 'POST',
        rejectUnauthorized: false,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'x-access-token': req.headers['x-access-token'] || 'xxx',
            'package-name':req.headers['package-name'] || 'xxx'
        }
    };
    if (!cb) {
        cb = function () {
        };
    }
    var request = http.request(options, function (result) {
        result.setEncoding('utf8');
        //result.on('data', function (chunk) {
        //    if(JSON.parse(chunk).status == 'success'){
        //        return cb(null, JSON.parse(chunk).data);
        //    }else{
        //        return cb(JSON.parse(chunk).msg || JSON.parse(chunk).status);
        //    }
        //});
        var str = '';
        result.on('data', function (chunk) {
            str += chunk;
        });
        result.on('end', function () {
            try {
                if (JSON.parse(str).status == 'success') {
                    return cb(null, JSON.parse(str).data);
                } else {
                    return cb(JSON.parse(str).msg || JSON.parse(chunk).status);
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

exports.sendMsgServerSMS1 = function (req, type, data, cb) {
    if (!cb) {
        cb = function () {
        };
    }
    if (!config_server.is_sms) {
        return cb();
    }
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
        path: config_api_url.msg_server_send_sms1 + '/template' + '/' + type,
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
        //result.on('data', function (chunk) {
        //    if(JSON.parse(chunk).status == 'success'){
        //        return cb(null, JSON.parse(chunk).data);
        //    }else{
        //        return cb(JSON.parse(chunk).msg || JSON.parse(chunk).status);
        //    }
        //});
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

exports.sendMsgServerBatchMsg = function (req_list) {
    if (!req_list || req_list.length == 0) {
        return;
    }
    var req_body = {
        req_list: JSON.stringify(req_list)
    };
    var headers = {
        'Content-Type': 'application/json'//'application/x-www-form-urlencoded'
    };
    var options = {
        'method': 'POST',
        json: true,
        'headers': headers,
        rejectUnauthorized: false,
        'url': 'http://' + config_server.msg_server_ip + ':' + config_server.msg_server_port + '/msg/batch_send_notice',
        'body': req_body
    };
    request(options, function (err, http_req, http_res) {
        if (err || http_res.status !== 'success') {
            console.log('Sending Batched MSG failed at ' + new Date().toString());
        }
    });
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
            if (JSON.parse(str).status === 'success') {
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

exports.sendMsgServerSMSNew = function (req, data, path, cb) {
    if (!cb) {
        cb = function () {
        };
    }
    if (!config_server.is_sms) {
        return cb();
    }
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
        path: path,
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
        //result.on('data', function (chunk) {
        //    if(JSON.parse(chunk).status == 'success'){
        //        return cb(null, JSON.parse(chunk).data);
        //    }else{
        //        return cb(JSON.parse(chunk).msg || JSON.parse(chunk).status);
        //    }
        //});
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
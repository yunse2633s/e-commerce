/**
 * Created by Administrator on 2015/12/7.
 */
var http = require('http');
var request = require('request');
var jwt = require('jsonwebtoken');
var querystring = require('querystring');
var config_server = require('../configs/config_server');
var config_common = require('../configs/config_common');
var config_api_url = require('../configs/config_api_url');
var fs = require('fs');
var path = require('path');
var async = require('async');


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
            'x-access-token': req.headers['x-access-token']
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

function createTokenServer(data) {
    return jwt.sign(data, config_common.secret_keys.traffic,
        {
            expiresIn: config_common.token_server_timeout
        });
}
function createTokenUserServer(data) {
    return jwt.sign(data, config_common.secret_keys.user,
        {
            expiresIn: config_common.token_server_timeout
        });
}
function createTokenStatiServerNew(data) {
    return jwt.sign(data, config_common.secret_keys.statistical,
        {
            expiresIn: config_common.token_server_timeout
        });
}
function createTokenTradeServer(data) {
    return jwt.sign(data, config_common.secret_keys.trade,
        {
            expiresIn: config_common.token_server_timeout
        });
}
function createTokenDynamicServer(data) {
    return jwt.sign(data, config_common.secret_keys.dynamic,
        {
            expiresIn: config_common.token_server_timeout
        });
}
function createTokenStoreServer(data) {
    return jwt.sign(data, config_common.secret_keys.store,
        {
            expiresIn: config_common.token_server_timeout
        });
}

function createTokenPayServer(data) {
    return jwt.sign(data, config_common.secret_keys.pay,
        {
            expiresIn: config_common.token_server_timeout
        });
}

exports.createTokenTradeServer = function (data) {
    return jwt.sign(data, config_common.secret_keys.trade,
        {
            expiresIn: config_common.token_server_timeout
        });
};
exports.createTokenDynamicServer = createTokenDynamicServer;
exports.createTokenAdminServer = function (data) {
    return jwt.sign(data, config_common.secret_keys.admin,
        {
            expiresIn: config_common.token_server_timeout
        });
};

exports.sendTrafficServer = function(req, data, path, cb) {
    console.log('11',data)
    var postData = querystring.stringify(data);

    var options = {
        hostname: config_server.traffic_server_ip,
        port: config_server.traffic_server_port,
        path: path,
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'x-access-token': req.headers['x-access-token']
        }
    };
    console.log('path', options.hostname+options.port+options.path)
    if(!cb){
        cb = function(){};
    }
    var request = http.request(options, function(result) {
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
        result.on('end', function(){
            try{
                if(JSON.parse(str).status == 'success'){
                    return cb(null, JSON.parse(str).data);
                }else{
                    return cb(JSON.parse(str).msg);
                }
            }catch(err){
                console.error('user_server_http_err!!!\n',str,JSON.stringify(err),options);
            }
        });
    });
    request.on('error', function(e) {
        return cb(e.message);
    });
    request.write(postData);
    request.end();
};



exports.sendUserServerNoToken = function(req, data, path, cb) {
    var postData = querystring.stringify(data);
    var headers = {};
    if(req){
        headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'x-access-token':req.headers['x-access-token']
        };
    }else {
        headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
        };
    }
    var options = {
        hostname: config_server.user_server_ip,
        port: config_server.user_server_port,
        path: path,
        method: 'POST',
        headers: headers
    };
    if(!cb){
        cb = function(){};
    }
    var request = http.request(options, function(result) {
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
        result.on('end', function(){
            //try{
                if(JSON.parse(str).status == 'success'){
                    return cb(null, JSON.parse(str).data);
                }else{
                    return cb(JSON.parse(str).msg);
                }
            //}catch(err){
            //    console.error('user_server_http_err!!!\n',str,JSON.stringify(err),options);
            //}
        });
    });
    request.on('error', function(e) {
        return cb(e.message);
    });
    request.write(postData);
    request.end();
};

exports.sendUserServerNoTokenGet = function(req, data, path, cb) {
    var postData = querystring.stringify(data);
    var options = {
        hostname: config_server.user_server_ip,
        port: config_server.user_server_port,
        path: path,
        method: 'GET',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'x-access-token': req.headers['x-access-token']
        }
    };
    if(!cb){
        cb = function(){};
    }
    var request = http.request(options, function(result) {
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
        result.on('end', function(){
            try{
                if(JSON.parse(str).status == 'success'){
                    return cb(null, JSON.parse(str).data);
                }else{
                    return cb(JSON.parse(str).msg);
                }
            }catch(err){
                console.error('user_server_http_err!!!\n',str,JSON.stringify(err),options);
            }
        });
    });
    request.on('error', function(e) {
        return cb(e.message);
    });
    request.write(postData);
    request.end();
};

exports.sendLogServer = function(req, data, path, cb) {
    var postData = querystring.stringify(data);
    var options = {
        hostname: config_server.log_server_ip,
        port: config_server.log_server_port,
        path: path,
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'x-access-token': req.headers['x-access-token']
        }
    };
    if(!cb){
        cb = function(){};
    }
    var request = http.request(options, function(result) {
        result.setEncoding('utf8');
        var str = '';
        result.on('data', function (chunk) {
            str += chunk;
        });
        result.on('end', function(){
            try{
                if(JSON.parse(str).status == 'success'){
                    return cb(null, JSON.parse(str).data);
                }else{
                    return cb(JSON.parse(str).msg);
                }
            }catch(err){
                console.error('log_server_http_err!!!\n',str,JSON.stringify(err),options);
            }
        });
    });
    request.on('error', function(e) {
        return cb(e.message);
    });
    request.write(postData);
    request.end();
};

exports.sendFinanceServer = function(req, data, path, cb) {
    var postData = querystring.stringify(data);
    var options = {
        hostname: config_server.finance_server_ip,
        port: config_server.finance_server_port,
        path: path,
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'x-access-token': req.headers['x-access-token'] || ''
        }
    };
    if(!cb){
        cb = function(){};
    }
    var request = http.request(options, function(result) {
        result.setEncoding('utf8');
        //result.on('data', function (chunk) {
        //    if(JSON.parse(chunk).status == 'success'){
        //        return cb(null, JSON.parse(chunk).data);
        //    }else if(JSON.parse(chunk).status == 'wait_for_approval'){
        //        return cb(null, JSON.parse(chunk));
        //    }else{
        //        return cb(JSON.parse(chunk).msg);
        //    }
        //});
        var str = '';
        result.on('data', function (chunk) {
            str += chunk;
        });
        result.on('end', function(){
            try{
                if(JSON.parse(str).status == 'success'){
                    return cb(null, JSON.parse(str).data);
                }else if(JSON.parse(str).status == 'wait_for_approval'){
                    return cb(null, JSON.parse(str));
                }else{
                    return cb(JSON.parse(str).msg);
                }
            }catch(err){
                console.error('finance_server_http_err!!!\n',str,JSON.stringify(err),options);
            }
        });
    });
    request.on('error', function(e) {
        return cb(e.message);
    });
    request.write(postData);
    request.end();
};

//跨服务器请求信用中心信息--wly
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

exports.sendAdminServer = function(req, data, path, cb) {
    var token = this.createTokenAdminServer(data);
    var postData = querystring.stringify({token:token});
    var options = {
        hostname: config_server.admin_server_ip,
        port: config_server.admin_server_port,
        path: path,
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'x-access-token': req.headers['x-access-token']
        }
    };
    if(!cb){
        cb = function(){};
    }
    var request = http.request(options, function(result) {
        result.setEncoding('utf8');
        var str = '';
        result.on('data', function (chunk) {
            str += chunk;
        });
        result.on('end', function(){
            try{
                if(JSON.parse(str).status == 'success'){
                    return cb(null, JSON.parse(str).data);
                }else{
                    return cb(JSON.parse(str).data);
                }
            }catch(err){
                console.error('admin_server_http_err!!!\n',str,JSON.stringify(err),options);
            }
        });
    });
    request.on('error', function(e) {
        return cb(e.message);
    });
    request.write(postData);
    request.end();
};

exports.sendTradeServer = function(req, data, path, cb) {
    var postData = querystring.stringify({});
    var token = this.createTokenTradeServer(data);
    var options = {
        hostname: config_server.trade_server_ip,
        port: config_server.trade_server_port,
        path: path+token,
        method: 'GET',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'x-access-token': req.headers['x-access-token']
        }
    };
    if(!cb){
        cb = function(){};
    }
    var request = http.request(options, function(result) {
        result.setEncoding('utf8');
        //result.on('data', function (chunk) {
        //    if(JSON.parse(chunk).status == 'success'){
        //        return cb(null, JSON.parse(chunk).data);
        //    }else{
        //        return cb(JSON.parse(chunk).data);
        //    }
        //});
        var str = '';
        result.on('data', function (chunk) {
            str += chunk;
        });
        result.on('end', function(){
            try{
                if(JSON.parse(str).status == 'success'){
                    return cb(null, JSON.parse(str).data);
                }else{
                    return cb(JSON.parse(str).data || JSON.parse(str).status);
                }
            }catch(err){
                console.error('trade_server_http_err!!!\n',str,JSON.stringify(err),options);
            }
        });
    });
    request.on('error', function(e) {
        return cb(e.message);
    });
    request.write(postData);
    request.end();
};

exports.sendTradeServerNoReq = function(data, path, cb) {
    var postData = querystring.stringify({});
    var token = this.createTokenTradeServer(data);
    var options = {
        hostname: config_server.trade_server_ip,
        port: config_server.trade_server_port,
        path: path+token,
        method: 'GET',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    };
    if(!cb){
        cb = function(){};
    }
    var request = http.request(options, function(result) {
        result.setEncoding('utf8');
        var str = '';
        result.on('data', function (chunk) {
            str += chunk;
        });
        result.on('end', function(){
            try{
                if(JSON.parse(str).status == 'success'){
                    return cb(null, JSON.parse(str).data);
                }else{
                    return cb(JSON.parse(str).data || JSON.parse(str).status);
                }
            }catch(err){
                console.error('trade_server_http_err!!!\n',str,JSON.stringify(err),options);
            }
        });
    });
    request.on('error', function(e) {
        return cb(e.message);
    });
    request.write(postData);
    request.end();
};

exports.sendTradeServerNoToken = function(req, data, path, cb) {
    var postData = querystring.stringify({});
    var options = {
        hostname: config_server.trade_server_ip,
        port: config_server.trade_server_port,
        path: path,
        method: 'GET',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'x-access-token': req.headers['x-access-token']
        }
    };
    if(!cb){
        cb = function(){};
    }
    var request = http.request(options, function(result) {
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
        result.on('end', function(){
            //try{
                if(JSON.parse(str).status == 'success'){
                    return cb(null, JSON.parse(str).data);
                }else{
                    return cb(JSON.parse(str).data || JSON.parse(str).status);
                }
            //}catch(err){
            //    console.error('trade_server_http_err!!!\n',str,JSON.stringify(err), options);
            //}
        });
    });
    request.on('error', function(e) {
        return cb(e.message);
    });
    request.write(postData);
    request.end();
};

exports.sendTradeServerNoTokenPost = function(req, data, path, cb) {

    var postData = querystring.stringify(data);
    var options = {
        hostname: config_server.trade_server_ip,
        port: config_server.trade_server_port,
        path: path,
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'x-access-token': req.headers['x-access-token']
        }
    };
    if(!cb){
        cb = function(){};
    }
    var request = http.request(options, function(result) {
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
        result.on('end', function(){
            //try{
                if(JSON.parse(str).status == 'success'){
                    return cb(null, JSON.parse(str).data);
                }else{
                    return cb(JSON.parse(str).data || JSON.parse(str).status);
                }
            //}catch(err){
            //    console.error('trade_server_http_err!!!\n',str,JSON.stringify(err),options);
            //}
        });
    });
    request.on('error', function(e) {
        return cb(e.message);
    });
    request.write(postData);
    request.end();
};

exports.sendMsgServerSMS = function(req, type, data, cb) {
    if(data && data.content){
        data.content = JSON.stringify(data.content);
    }
    if(data && data.phone_list){
        data.phone_list = JSON.stringify(data.phone_list);
    }
    var postData = querystring.stringify(data || {});
    var options = {
        hostname: config_server.msg_server_ip,
        port: config_server.msg_server_port,
        path: config_api_url.msg_server_send_sms+'/template'+'/'+type,
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'x-access-token': req.headers['x-access-token'] || 'xxx'
        }
    };
    if(!cb){
        cb = function(){};
    }
    var request = http.request(options, function(result) {
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
        result.on('end', function(){
            try{
                if(JSON.parse(str).status == 'success'){
                    return cb(null, JSON.parse(str).data);
                }else{
                    return cb(JSON.parse(str).msg || JSON.parse(chunk).status);
                }
            }catch(err){
                console.error('msg_server_http_err!!!\n',str,JSON.stringify(err));
            }
        });
    });
    request.on('error', function(e) {
        return cb(e.message);
    });
    request.write(postData);
    request.end();
};

exports.sendMsgServerMSG = function(operator, target_list, template_id, content, url) {
    if(!operator) {
        operator = config_common.system_id || '000000000000000000000000';
    }
    content = content || [];
    if(!template_id ||
        !target_list ||
        target_list.length == 0 ||
        !template_id ||
        template_id === '' ||
        !content) {
        return console.log('Sending NULL MSG at ' + new Date().toString());
    }
    var req_body = '{';
    req_body +='"operator":"' + operator + '",';
    req_body += '"target_list":[';
    for(var i = 0; i < target_list.length; i++) {
        req_body += '"' + target_list[i] + '"';
        if(i < target_list.length - 1) {
            req_body += ',';
        }
    }
    req_body += '],';
    req_body += '"template_id":"' + template_id + '",';
    req_body += '"content":[';
    for(var i = 0; i < content.length; i++) {
        req_body += '"' + content[i] + '"';
        if(i < content.length - 1) {
            req_body += ',';
        }
    }
    req_body += '],';
    req_body += '"url":"' + url + '"}';
    var headers = {
        'Content-Type':'application/json'
    };
    var options = {
        'method':'POST',
        'headers':headers,
        'url': 'http://'+config_server.msg_server_ip+':'+config_server.msg_server_port + '/msg/send_notice',
        'body':req_body
    };
    request(options,function(err, http_req, http_res) {
        if(err) {
            console.log('Sending MSG failed at ' + new Date().toString());
        }
    });
};

exports.sendMsgServerBatchMsg = function(req_list) {
    if(!req_list || req_list.length == 0) {
        return;
    }
    var req_body = {
        req_list:JSON.stringify(req_list)
    };
    var headers = {
        'Content-Type':'application/json'//'application/x-www-form-urlencoded'
    };
    var options = {
        'method':'POST',
        json:true,
        'headers':headers,
        'url': 'http://'+config_server.msg_server_ip+':'+config_server.msg_server_port + '/msg/batch_send_notice',
        'body':req_body
    };
    request(options,function(err,http_req,http_res) {
        if(err || http_res.status != 'success') {
            console.log('Sending Batched MSG failed at ' + new Date().toString());
        }
    });
};



exports.deleteorderlogistic = function (req,index_trade,order,path) {
    var headers =
    {
        'Content-Type': 'application/x-www-form-urlencoded',
        'x-access-token':req.headers['x-access-token']
    };
    var data = {
        index_trade:index_trade,
        order:order
    };
    data = querystring.stringify(data);
    var option =
    {
        'method': 'POST',
        'url': 'http://'+config_server.trade_server_ip+':'+config_server.trade_server_port + path,
        'headers': headers,
        'body':data
    };

    return option;
};

exports.get_steel_weigh_liji_for_traffic = function (req,products,company_id,path) {
    var headers =
    {
        'Content-Type': 'application/x-www-form-urlencoded',
        'x-access-token':req.headers['x-access-token']
    };
    var data = {
        products:products,
        company_id:company_id
    };
    data = querystring.stringify(data);
    var option =
    {
        'method': 'POST',
        'url': 'http://'+config_server.trade_server_ip+':'+config_server.trade_server_port + path,
        'headers': headers,
        'body':data
    };

    return option;
};

exports.requestsendUser= function(req, data, url) {
    data = querystring.stringify(data);
    var option = {
        body:data,
        url:'http://' + config_server.user_server_ip + ':' + config_server.user_server_port + url,
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'x-access-token': req.headers['x-access-token']
        }
    }
    return option;
};

exports.requestsendTrade= function(req, data, url) {
    data = querystring.stringify(data);
    var option = {
        body:data,
        url:'http://' + config_server.trade_server_ip + ':' + config_server.trade_server_port + url,
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'x-access-token': req.headers['x-access-token']
        }
    }
    return option;
};
/**
 *   su
 **/
exports.sendUserServerNew = function(req, data, path, cb) {
    var postData = querystring.stringify({
        token: createTokenUserServer(data)
    });
    var options = {
        hostname: config_server.user_server_ip,
        port: config_server.user_server_port,
        path: path,
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            // 'x-access-token': req.headers['x-access-token']
        }
    };
    if(!cb){
        cb = function(){};
    }
    var request = http.request(options, function(result) {
        result.setEncoding('utf8');
        var str = '';
        result.on('data', function (chunk) {
            str += chunk;
        });
        result.on('end', function(){
            if(JSON.parse(str).status == 'success'){
                return cb(null, JSON.parse(str).data);
            }else{
                return cb(JSON.parse(str).msg);
            }
        });
    });
    request.on('error', function(e) {
        return cb(e.message);
    });
    request.write(postData);
    request.end();
};
/**
 *   su
 **/
exports.sendTradeServerNew = function(req, data, path, cb) {
    var postData = querystring.stringify({
        token: createTokenTradeServer(data)
    });
    var options = {
        hostname: config_server.trade_server_ip,
        port: config_server.trade_server_port,
        path: path,
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            // 'x-access-token': req.headers['x-access-token']
        }
    };
    if(!cb){
        cb = function(){};
    }
    var request = http.request(options, function(result) {
        result.setEncoding('utf8');
        var str = '';
        result.on('data', function (chunk) {
            str += chunk;
        });
        result.on('end', function(){
            if(JSON.parse(str).status == 'success'){
                return cb(null, JSON.parse(str).data);
            }else{
                return cb(JSON.parse(str).msg);
            }
        });
    });
    request.on('error', function(e) {
        return cb(e.message);
    });
    request.write(postData);
    request.end();
};

exports.sendDynamicServer = function (data, path, cb) {
    var postData = querystring.stringify({
        token: createTokenDynamicServer(data)
    });
    var options = {
        hostname: config_server.dynamic_server_ip,
        port: config_server.dynamic_server_port,
        path: path,
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    };
    if(!cb){
        cb = function(){};
    }
    var request = http.request(options, function(result) {
        result.setEncoding('utf8');
        var str = '';
        result.on('data', function (chunk) {
            str += chunk;
        });
        result.on('end', function(){
            if(JSON.parse(str).status == 'success'){
                return cb(null, JSON.parse(str).data);
            }else{
                return cb(JSON.parse(str).msg);
            }
        });
    });
    request.on('error', function(e) {
        return cb(e.message);
    });
    request.write(postData);
    request.end();
};

exports.sendStoreServer = function (data, path, cb) {
    var postData = querystring.stringify({
        token: createTokenStoreServer(data)
    });
    var options = {
        hostname: config_server.store_server_ip,
        port: config_server.store_server_port,
        path: path,
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    };
    if(!cb){
        cb = function(){};
    }
    var request = http.request(options, function(result) {
        result.setEncoding('utf8');
        var str = '';
        result.on('data', function (chunk) {
            str += chunk;
        });
        result.on('end', function(){
            if(JSON.parse(str).status === 'success'){
                return cb(null, JSON.parse(str).data);
            }else{
                return cb(JSON.parse(str).msg);
            }
        });
    });
    request.on('error', function(e) {
        return cb(e.message);
    });
    request.write(postData);
    request.end();
};
exports.sendStoreServerNew = function (req, data, url, cb) {
    if (!cb) {
        cb = function () {};
    }
    data = querystring.stringify(data);

    var headers;
    if (req) {
        headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'x-access-token': req.headers['x-access-token'] || 'xxx'
        }
    } else {
        headers = {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    }
    var option = {
        body: data,
        url: 'http://' + config_server.store_server_ip + ':' + config_server.store_server_port + url,
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
/**
 *  su
 **/
exports.sendMsgServerNew = function (req, data, url, cb) {
    if (!cb) {
        cb = function () {};
    }
    data = querystring.stringify(data);
    var headers;
    if (req && req.headers) {
        headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'x-access-token': req.headers['x-access-token'] || 'xxx',
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
/**
 * su
 **/
exports.sendAmapServer = function(data, url, cb){
    if (!cb) {
        cb = function () {
        };
    }
    var str = '';
    for(var i=0; i<data.address.length;i++){
        str += encodeURIComponent(data.address[i]);
        if(i+1<data.address.length){
            str += '|';
        }
    }
    var option = {
        url: config_server.amapUrl + url + '?address=' + str +'&batch=true&output=JSON&key='+config_server.amapKey,
        method: 'GET'
    };
    request(option, function (err, http_res, http_req) {
        if (err) return cb(err);
        if (JSON.parse(http_req).status == '1') {
            var tmp = JSON.parse(http_req).geocodes, arr_tmp =[];
            for(var i=0; i<tmp.length;i++){
                if(tmp[i] && tmp[i]['location']){
                    arr_tmp.push(tmp[i]['location'].split(','));
                }
            }
            cb(null, arr_tmp);
        } else {
            cb(JSON.parse(http_req).status);
        }
    });

};

/**
 *  su baidu 语音
 **/
exports.sendBaiDuTTs = function(data, callback){
    var team = 'rsc';
    var App_ID = '9917247'; //App_ID
    var client_id = 'bYOnmCXTbo6E8tlh3YufurXQ'; //API_Key
    var client_secret = '4CyAK9O91wEGDQVelIiRcemeKGs9G1nC'; //Secret_Key
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
                method: 'POST'
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
        callback(x,y);
    })

};
/**
 *  su 金融服务 ，统计
 */
exports.sendStatisticServerNew = function(req, data, path, cb) {
    if(!cb){
        var cb = function(){};
    }
    var postData = querystring.stringify({
        token: createTokenStatiServerNew(data)
    });
    var options = {
        hostname: config_server.statistical_server_ip,
        port: config_server.statistical_server_port,
        path: path,
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    };
    if(!cb){
        cb = function(){};
    }
    var request = http.request(options, function(result) {
        result.setEncoding('utf8');
        var str = '';
        result.on('data', function (chunk) {
            str += chunk;
        });
        result.on('end', function(){
            if(JSON.parse(str).status == 'success'){
                return cb(null, JSON.parse(str).data);
            }else{
                return cb(JSON.parse(str).msg);
            }
        });
    });
    request.on('error', function(e) {
        return cb(e.message);
    });
    request.write(postData);
    request.end();
};
/**
 *  短链接
 * */
exports.getShortUrl = function(req, user_id, role, cb){
    var package = '.com.rsc.tradecenter';//com.rsc.tradecenter, com.rsc.dispatcenter, com.rsc.drivercenter,
    if(role=='trade'){
        package = '.com.rsc.tradecenter';
    }
    if(role == 'traffic'){
        package = '.com.rsc.dispatcenter';
    }
    if(role == 'driver'){
        package = '.com.rsc.drivercenter';
    }
    var headers =
    {
        'Content-Type': 'application/x-www-form-urlencoded'
    };
    var options =
    {
        'method': 'GET',
        'headers': headers,
        'url': 'https://api.weibo.com/2/short_url/shorten.json?access_token=2.00OzYsiGQhK49C8318ab514486GjLD&&url_long=' + config_server.share_url + config_common.nodePushUrl.person + user_id + package, //com.rsc.tradecenter, com.rsc.dispatcenter, com.rsc.drivercenter,
    };
    if(!cb){
        cb = function(){};
    }
    request(options, function (err, http_req, http_res) {

        if(err){
            cb(err);
        }
        if(http_res){
            var data = JSON.parse(http_res);
            data = data.urls;
            data = data && data[0] ? data[0].url_short : '';
            cb(null, data);
        }
    });
};
/**
 * 管理平台
 */
exports.sendAdminServerNew = function (req, data, path, cb) {
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

/**
 *  支付服务
 */
exports.sendPayServerNew = function(req, data, path, cb) {
    if(!cb){
        var cb = function(){};
    }
    var postData = querystring.stringify({
        token: createTokenPayServer(data)
    });
    var options = {
        hostname: config_server.pay_server_ip,
        port: config_server.pay_server_port,
        path: path,
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        }
    };
    if(!cb){
        cb = function(){};
    }
    var request = http.request(options, function(result) {
        result.setEncoding('utf8');
        var str = '';
        result.on('data', function (chunk) {
            str += chunk;
        });
        result.on('end', function(){
            if(JSON.parse(str).status == 'success'){
                return cb(null, JSON.parse(str).data);
            }else{
                return cb(JSON.parse(str).msg);
            }
        });
    });
    request.on('error', function(e) {
        return cb(e.message);
    });
    request.write(postData);
    request.end();
};
exports.sendPayClientNew = function (req, data, url, cb) {
    if (!cb) {
        cb = function () {};
    }
    data = querystring.stringify(data);
    var headers;
    if (req && req.headers) {
        headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'x-access-token': req.headers['x-access-token'] || 'xxx',
            'package-name': req.headers['package-name']
        }
    } else {
        headers = {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    }
    var option = {
        body: data,
        url: 'http://' + config_server.pay_server_ip + ':' + config_server.pay_server_port + url,
        method: 'POST',
        headers: headers
    };
    request(option, function (err, http_res, http_req) {
        if (err) return cb(err);
        if (JSON.parse(http_req).status === 'success') {
            cb(null, JSON.parse(http_req).data);
        } else {
            cb(JSON.parse(http_req).msg);
        }
    });
};
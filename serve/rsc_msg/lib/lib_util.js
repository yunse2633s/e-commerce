/**
 * Created by Administrator on 2015/12/25.
 */
var _ = require('underscore');
var request = require('request');
var utf8 = require('utf8');
var buffer = require('buffer');
var crypto = require('crypto');
var querystring = require('querystring');
var MSG = require('../models/MSG');
var Notice = require('../models/Notice');
var config_common = require('../configs/config_common');
var mw = require('../configs/middleware');
var tpl = require('../configs/templates');
var config_server = require('../configs/config_server');


exports.isSameDay = function (date1, data2) {
    return (date1.toLocaleDateString() == data2.toLocaleDateString());
};

exports.isSameWeek = function (date1, data2) {
    var day1 = date1.getDay();
    var day2 = data2.getDay();
    if (day1 == 0) {
        day1 = 7;
    }
    if (day2 == 0) {
        day2 = 7;
    }
    var week1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate() - day1);
    var week2 = new Date(data2.getFullYear(), data2.getMonth(), data2.getDate() - day2);
    return this.isSameDay(week1, week2);
};

exports.isSameMonth = function (date1, data2) {
    return (date1.getMonth() == data2.getMonth() && date1.getFullYear() == data2.getFullYear());
};

//从对象数组中取某个字段变成数组   field:a [{a:1,b:2},{a:3,b:4}]=>[1,3]    notToString：false转,true不转
exports.transObjArrToSigArr = function (arr, field, notToString) {
    var newArr = [];
    if (!arr || arr.length == 0) {
        return newArr;
    }
    for (var i = 0; i < arr.length; i++) {
        var data = arr[i][field];
        if (data) {
            if (_.isArray(data)) {
                newArr = newArr.concat(data);
            } else {
                if (!notToString) {
                    newArr.push(data.toString());
                } else {
                    newArr.push(data);
                }
            }
        }
    }
    return newArr;
};

exports.transObjArrToObj = function (arr, field) {
    var newArr = {};
    if (!arr || arr.length == 0) {
        return newArr;
    }
    for (var i = 0; i < arr.length; i++) {
        var data = arr[i][field];
        if (data) {
            newArr[data] = arr[i].toObject ? arr[i].toObject() : arr[i];
        }
    }
    return newArr;
};

exports.shortenurl = function (url) {
    var headers =
        {
            'Content-Type': 'application/x-www-form-urlencoded'
        };
    var options =
        {
            'method': 'GET',
            'headers': headers,
            'url': 'https://api.weibo.com/2/short_url/shorten.json?access_token=2.00OzYsiGQhK49C8318ab514486GjLD&&url_long=' + url,
        };
    return options;
};

//获取两个时间之间时间字符串
exports.getTimeLongStr = function (time1, time2) {
    if (!time2) {
        time2 = new Date();
    }
    var milliseconds = Math.abs(time1.getTime() - time2.getTime());
    var seconds = Math.ceil(milliseconds / 1000);
    var minutes = Math.ceil(seconds / 60);
    if (minutes < 60) {
        return minutes + '分钟前';
    }
    var hours = Math.ceil(minutes / 60);
    if (hours < 24) {
        return hours + '小时前';
    }
    var days = Math.ceil(hours / 24);
    if (days < 30) {
        return days + '天前';
    }
    var months = Math.ceil(days / 30);
    if (months < 12) {
        return months + '个月前';
    }
    var years = Math.ceil(months / 12);
    return years + '年前';
};

exports.send_sms = function (req, callback) {
    if (!callback) callback = function () {
    };
    if (process.env.node_env == 'dev') {
        return callback(null, 'success', {});
    }
    if (!config_server.is_sms) return callback(null, 'success', {});
    var result = '';
    // 以模版方式发送短信
    if (req.params.method == 'template') {
        if (tpl.sms_templates[req.body.template_id] === undefined) {
            return callback('invalid_format', {msg: 'No such template.'});
        }
        if (typeof(req.body.content) == 'string') {
            if (req.body.content && !_.isArray(req.body.content)) {
                req.body.content = JSON.parse(req.body.content);
            }
        }
        req.body.content = !req.body.content ? [] : req.body.content;
        var length = req.body.content.length;
        if (length != tpl.sms_templates[req.body.template_id].count_elements) {
            return callback('invalid_format', {msg: 'Length of content is invalid'});
        }
        result = mw.encodeActualSMS(req.body.template_id, req.body.content, req);
    }
    // 自定义内容发送短信
    else {
        if (req.body.sms === undefined || req.body.sms == '') {
            return callback('invalid_format', 'The content of sms is not defined or it is an empty string.');
        }
        result = utf8.encode(req.body.sms);
    }
    if (typeof(req.body.phone_list) == 'string') {
        req.body.phone_list = [JSON.parse(req.body.phone_list)];
    }
    var phoneString = req.body.phone_list.join(',');
    var final_phone_list = '';
    var invalid_phone_list = [];
    var success_count = 0;
    var req_phone_length = req.body.phone_list.length;
    for (var index in req.body.phone_list) {
        if (mw.checkPhoneString(req.body.phone_list[index])) {
            final_phone_list += req.body.phone_list[index];
            success_count += 1;
            final_phone_list += ','
        }
        else {
            invalid_phone_list.push(req.body.phone_list[index]);
        }
    }
    final_phone_list = final_phone_list.substring(0, final_phone_list.length - 1);
    if (final_phone_list == '') {
        return callback('invalid_phone_number', {msg: 'No phone number is valid.'})
    }

    // 发送短信
    var send_url = '';
    if (req.params.type == 'GBK') {
        send_url = config_common.sms_GBK.url_send;
    }
    var post_data = {
        username: config_common.sms_GBK.username,
        password: crypto.createHash("md5").update(config_common.sms_GBK.password).digest("hex").toUpperCase(),
        gwid: config_common.sms_GBK.gwid,
        mobile: phoneString,
        message: result
    };
    post_data = querystring.stringify(post_data);
    var headers = {'Content-Type': 'application/x-www-form-urlencoded',};
    var option = {
        'method': 'POST',
        'headers': headers,
        'url': send_url,
        'body': post_data
    };
    request(option, function (err, http_req, http_res) {
        if (err) {
            return callback('err', err);
        }
        try {
            http_res = JSON.parse(http_res);
            if (http_res.CODE == '1') {
                callback(null, 'success', {
                    total_count: req_phone_length,
                    success_count: success_count,
                    failed_to_sms: invalid_phone_list
                });
            }
            else {
                callback(null, 'req_failed', {res: http_res, code: http_res.CODE, option: option});
            }
        } catch (err) {
            console.error('server_http_err!!!\n', http_res, JSON.stringify(err), option);
        }
    });
};

//短信进行SHA1哈希计算
exports.getCheckSum = function (parmas) {
    return crypto.createHash('sha1').update(parmas, 'utf8').digest('hex').toLowerCase();
};
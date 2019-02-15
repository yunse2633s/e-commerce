/**
 * Created by Administrator on 2015/12/25.
 */
var _ = require('underscore');
var config_version = require('../configs/config_version');

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

exports.clone = function (data) {
    return JSON.parse(JSON.stringify(data));
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

exports.geturl = function (data, url) {
    data = JSON.parse(data);
    data = data.urls;
    if (!data[0] || !data[0].url_short) {
        data = url;
    } else {
        data = data[0].url_short;
    }
    return data;
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

//比较本版和服务器当前版本 1比较版本高 -1服务器版本高 0版本相同
exports.versionCompare = function (version) {
    var current = version.split('.');
    var server = config_version.version.split('.');
    for (var i = 0; i < server.length; i++) {
        if (current[i] > server[i]) {
            return 1;
        } else if (current[i] < server[i]) {
            return -1;
        }
    }
    return 0;
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

// 数组根据特定字段分组
exports.getGroupByParam = function (list, param) {
    var Obj = {};
    for (var i = 0; i < list.length; i++) {
        var obj = list[i];
        if (!Obj[obj[param]]) {
            Obj[obj[param]] = {
                name: param,
                value: obj[param],
                array: []
            };
        }
        Obj[obj[param]].array.push(obj);
    }
    return Obj;
};

/**
 * 检查传入的id时候是数据库自己生成的id
 * id : mongodb 自己生成的id
 */
exports.checkID = function (id) {
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
        return true;
    } else {
        return false;
    }
};
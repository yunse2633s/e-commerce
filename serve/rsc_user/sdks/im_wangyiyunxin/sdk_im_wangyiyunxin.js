/**
 * Created by Administrator on 17/8/9.
 */

var sha1 = require('sha1');
var request = require('request');
var querystring = require('querystring');

var AppKey = '34933ec0c6e6d8add0129e8177d39b41';
var AppSecret = '1602955c262e';

// 批量发送点对点自定义系统通知
exports.sendBatchMsg = function (data, cb) {
    if (!cb) cb = function () {
    };
    var a = Math.random();
    var Nonce = a * Math.pow(10, a.toString().split('.')[1].length);
    var CurTime = ((new Date()).getTime() / 1000 - 100).toString().split('.')[0];
    var CheckSum = sha1(AppSecret + Nonce + CurTime);
    var options = {
        url: 'https://api.netease.im/nimserver/msg/sendBatchMsg.action',
        body: querystring.stringify(data),
        method: 'POST',
        headers: {
            AppKey: AppKey,
            Nonce: Nonce,
            CurTime: CurTime,
            CheckSum: CheckSum,
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    };
    request(options, function (err, http_req, http_res) {
        if (err) return cb(err);
        if (http_req.statusCode === 200) {
            cb(null, http_res);
        } else {
            cb(http_req.statusCode);
        }
    });
};

// 注册
exports.createUser = function (data, cb) {
    if (!cb) cb = function () {
    };
    var a = Math.random();
    var Nonce = a * Math.pow(10, a.toString().split('.')[1].length);
    var CurTime = ((new Date()).getTime() / 1000 - 100).toString().split('.')[0];
    var CheckSum = sha1(AppSecret + Nonce + CurTime);
    var options = {
        url: 'https://api.netease.im/nimserver/user/create.action',
        body: querystring.stringify(data),
        method: 'POST',
        headers: {
            AppKey: AppKey,
            Nonce: Nonce,
            CurTime: CurTime,
            CheckSum: CheckSum,
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    };
    request(options, function (err, http_req, http_res) {
        if (err) return cb(err);
        if (http_req.statusCode === 200) {
            cb(null, http_res);
        } else {
            cb(http_req.statusCode);
        }
    });
};

// 修改
exports.updateUser = function (data, cb) {
    if (!cb) cb = function () {
    };
    var a = Math.random();
    var Nonce = a * Math.pow(10, a.toString().split('.')[1].length);
    var CurTime = ((new Date()).getTime() / 1000 - 100).toString().split('.')[0];
    var CheckSum = sha1(AppSecret + Nonce + CurTime);
    var options = {
        url: 'https://api.netease.im/nimserver/user/updateUinfo.action',
        body: querystring.stringify(data),
        method: 'POST',
        headers: {
            AppKey: AppKey,
            Nonce: Nonce,
            CurTime: CurTime,
            CheckSum: CheckSum,
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    };
    request(options, function (err, http_req, http_res) {
        if (err) return cb(err);
        if (http_req.statusCode === 200) {
            cb(null, http_res);
        } else {
            cb(http_req.statusCode);
        }
    });
};

//检验在线人员
exports.checkUser = function (data, cb) {
    if (!cb) cb = function () {
    };
    var a = Math.random();
    var Nonce = a * Math.pow(10, a.toString().split('.')[1].length);
    var CurTime = ((new Date()).getTime() / 1000 - 100).toString().split('.')[0];
    var CheckSum = sha1(AppSecret + Nonce + CurTime);
    var options = {
        url: 'https://api.netease.im/nimserver/event/subscribe/add.action',
        body: querystring.stringify(data),
        method: 'POST',
        headers: {
            AppKey: AppKey,
            Nonce: Nonce,
            CurTime: CurTime,
            CheckSum: CheckSum,
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    };
    request(options, function (err, http_req, http_res) {
        if (err) return cb(err);
        if (http_req.statusCode === 200) {
            cb(null, http_res);
        } else {
            cb(http_req.statusCode);
        }
    });
};

//群加人
exports.teamAdd = function (data, cb) {
    if (!cb) cb = function () {
    };
    var a = Math.random();
    var Nonce = a * Math.pow(10, a.toString().split('.')[1].length);
    var CurTime = ((new Date()).getTime() / 1000 - 100).toString().split('.')[0];
    var CheckSum = sha1(AppSecret + Nonce + CurTime);
    var options = {
        url: 'https://api.netease.im/nimserver/team/add.action',
        body: querystring.stringify(data),
        method: 'POST',
        headers: {
            AppKey: AppKey,
            Nonce: Nonce,
            CurTime: CurTime,
            CheckSum: CheckSum,
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    };
    request(options, function (err, http_req, http_res) {
        if (err) return cb(err);
        if (http_req.statusCode === 200) {
            cb(null, http_res);
        } else {
            cb(http_req.statusCode);
        }
    });
};

//获取群信息
exports.teamQuery = function (data, cb) {
    if (!cb) cb = function () {
    };
    var a = Math.random();
    var Nonce = a * Math.pow(10, a.toString().split('.')[1].length);
    var CurTime = ((new Date()).getTime() / 1000 - 100).toString().split('.')[0];
    var CheckSum = sha1(AppSecret + Nonce + CurTime);
    var options = {
        url: 'https://api.netease.im/nimserver/team/query.action',
        body: querystring.stringify(data),
        method: 'POST',
        headers: {
            AppKey: AppKey,
            Nonce: Nonce,
            CurTime: CurTime,
            CheckSum: CheckSum,
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    };
    request(options, function (err, http_req, http_res) {
        if (err) return cb(err);
        if (http_req.statusCode === 200) {
            cb(null, http_res);
        } else {
            cb(http_req.statusCode);
        }
    });
};

//创建群
exports.createTeam = function (data, cb) {
    if (!cb) cb = function () {
    };
    var a = Math.random();
    var Nonce = a * Math.pow(10, a.toString().split('.')[1].length);
    var CurTime = ((new Date()).getTime() / 1000 - 100).toString().split('.')[0];
    var CheckSum = sha1(AppSecret + Nonce + CurTime);
    var options = {
        url: 'https://api.netease.im/nimserver/team/create.action',
        body: querystring.stringify(data),
        method: 'POST',
        headers: {
            AppKey: AppKey,
            Nonce: Nonce,
            CurTime: CurTime,
            CheckSum: CheckSum,
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    };
    request(options, function (err, http_req, http_res) {
        if (err) return cb(err);
        if (http_req.statusCode === 200) {
            cb(null, http_res);
        } else {
            cb(http_req.statusCode);
        }
    });
};

//解散群
exports.removeTeam = function (data, cb) {
    if (!cb) cb = function () {
    };
    var a = Math.random();
    var Nonce = a * Math.pow(10, a.toString().split('.')[1].length);
    var CurTime = ((new Date()).getTime() / 1000 - 100).toString().split('.')[0];
    var CheckSum = sha1(AppSecret + Nonce + CurTime);
    var options = {
        url: 'https://api.netease.im/nimserver/team/remove.action',
        body: querystring.stringify(data),
        method: 'POST',
        headers: {
            AppKey: AppKey,
            Nonce: Nonce,
            CurTime: CurTime,
            CheckSum: CheckSum,
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    };
    request(options, function (err, http_req, http_res) {
        if (err) return cb(err);
        if (http_req.statusCode === 200) {
            //解散群成功后将消息服务器的群信息删除掉
            global.lib_http.sendImServer(data, '/api/server/im/remove', function (err) {
            })
            cb(null, http_res);
        } else {
            cb(http_req.statusCode);
        }
    });
};

//主动退群
exports.leaveTeam = function (data, cb) {
    if (!cb) cb = function () {
    };
    var a = Math.random();
    var Nonce = a * Math.pow(10, a.toString().split('.')[1].length);
    var CurTime = ((new Date()).getTime() / 1000 - 100).toString().split('.')[0];
    var CheckSum = sha1(AppSecret + Nonce + CurTime);

    var options = {
        url: 'https://api.netease.im/nimserver/team/leave.action',
        body: querystring.stringify(data),
        method: 'POST',
        headers: {
            AppKey: AppKey,
            Nonce: Nonce,
            CurTime: CurTime,
            CheckSum: CheckSum,
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    };
    request(options, function (err, http_req, http_res) {
        if (err) return cb(err);
        if (http_req.statusCode === 200) {
            cb(null, http_res);
        } else {
            cb(http_req.statusCode);
        }
    });
};

//获取自己加入的群
exports.joinTeams = function (data, cb) {
    if (!cb) cb = function () {
    };
    var a = Math.random();
    var Nonce = a * Math.pow(10, a.toString().split('.')[1].length);
    var CurTime = ((new Date()).getTime() / 1000 - 100).toString().split('.')[0];
    var CheckSum = sha1(AppSecret + Nonce + CurTime);
    var options = {
        url: 'https://api.netease.im/nimserver/team/joinTeams.action',
        body: querystring.stringify(data),
        method: 'POST',
        headers: {
            AppKey: AppKey,
            Nonce: Nonce,
            CurTime: CurTime,
            CheckSum: CheckSum,
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    };
    request(options, function (err, http_req, http_res) {
        if (err) return cb(err);
        if (http_req.statusCode === 200) {
            cb(null, http_res);
        } else {
            cb(http_req.statusCode);
        }
    });
};

//发送自定义系统通知
exports.sendAttachMsg = function (data, cb) {
    if (!cb) cb = function () {
    };
    data.msgtype = 0;
    data.attach = JSON.stringify({server_push_msg: data.data});
    var a = Math.random();
    var Nonce = a * Math.pow(10, a.toString().split('.')[1].length);
    var CurTime = ((new Date()).getTime() / 1000 - 100).toString().split('.')[0];
    var CheckSum = sha1(AppSecret + Nonce + CurTime);
    var options = {
        url: 'https://api.netease.im/nimserver/msg/sendAttachMsg.action',
        body: querystring.stringify(data),
        method: 'POST',
        headers: {
            AppKey: AppKey,
            Nonce: Nonce,
            CurTime: CurTime,
            CheckSum: CheckSum,
            'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
        }
    };
    request(options, function (err, http_req, http_res) {
        if (err) return cb(err);
        if (http_req.statusCode === 200) {
            cb(null, http_res);
        } else {
            cb(http_req.statusCode);
        }
    });
};
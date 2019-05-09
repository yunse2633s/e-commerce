/**
 * Created by Administrator on 2015/12/11 0011.
 */
var request = require('request');
var async = require('async');
var utf8 = require('utf8');
var buffer = require('buffer');
var crypto = require('crypto');
var querystring = require('querystring');
var MSG = require('../models/MSG');
var Notice = require('../models/Notice');
var config_common = require('../configs/config_common');
var mw = require('../configs/middleware');
var tpl = require('../configs/templates');
var lib_util = require('../lib/lib_util');
var randomstring = require("randomstring");//获取随机数


module.exports = function (app, express) {
    var api = express.Router();

    // ###### 测试，查找相应的信息列表 ######
    api.post('/test_list', function (req, res) {
        var query = {};
        if (req.body.operator && mw.checkIDString(req.body.operator)) {
            query.operator = req.body.operator;
        }
        if (req.body.target && mw.checkIDString(req.body.target)) {
            query.target = req.body.target;
        }
        if (req.body.template_id && tpl.msg_templates[req.body.template_id] !== undefined) {
            query.template_id = req.body.template_id;
        }

        if (req.body.been_read === true || req.body.been_read === 'true') {
            query.been_read = true;
        }
        else if (req.body.been_read === false || req.body.been_read === 'false') {
            query.been_read = false;
        }

        if (req.body.time_start && mw.checkDateString(req.body.time_start) && req.body.time_end && mw.checkDateString(req.body.time_end)) {
            var time_s = new Date(req.body.time_start);
            var time_e = new Date(req.body.time_end);
            query.time_creation = {'$gte': time_s, '$lte': time_e};
        }
        else if (req.body.time_start && mw.checkDateString(req.body.time_start)) {
            var time_s = new Date(req.body.time_start);
            query.time_creation = {'$gte': time_s};
        }
        else if (req.body.time_end && mw.checkDateString(req.body.time_end)) {
            var time_e = new Date(req.body.time_end);
            query.time_creation = {'$gte': time_e};
        }

        MSG.find(query, function (err, list) {
            if (err) {
                return mw.sendData(res, 'err', err);
            }
            mw.sendData(res, 'success', list);
        });
    });

    // 生成系统通知 -- 可对多用户生成同一个消息
    api.post('/send_notice', function (req, res) {
        if (typeof(req.body) == 'string') {
            req.body = JSON.parse(req.body);
        }
        req.body.operator = !req.body.operator ? config_common.system_id : req.body.operator;
        if (req.body.template_id === undefined || tpl.msg_templates[req.body.template_id] === undefined || req.body.target_list === undefined ||
            !mw.checkIDString(req.body.operator)) {
            var msg = '';
            if (req.body.template_id === undefined) {
                msg += '| Template ID undefined ';
            }
            if (tpl.msg_templates[req.body.template_id] === undefined) {
                msg += '| Template ID invalid ';
            }
            if (req.body.target_list === undefined) {
                msg += '| Target List undefined ';
            }
            if (!mw.checkIDString(req.body.operator)) {
                msg += '| operator ID invalid ';
            }

            msg += '|';
            return mw.sendData(res, 'invalid_format', {msg: msg});
        }
        if (typeof(req.body.content) == 'string') {
            req.body.content = JSON.parse(req.body.content);
        }
        req.body.content = !req.body.content ? [] : req.body.content;
        var length = req.body.content.length;
        if (length != tpl.msg_templates[req.body.template_id].count_elements) {
            return mw.sendData(res, 'invalid_format', {msg: 'content count is invalid'});
        }

        var target_list = [];
        var entry_list = [];

        if (typeof(req.body.target_list) == 'string') {
            req.body.target_list = JSON.parse(req.body.target_list);
        }

        for (var index in req.body.target_list) {
            target_list.push(req.body.target_list[index]);
        }

        // 生成信息数据
        for (var index in target_list) {
            var entry = {
                operator: req.body.operator,
                target: target_list[index],
                template_id: req.body.template_id,
                theme: tpl.msg_templates[req.body.template_id].theme,
                content: req.body.content,
                url: req.body.url,
                been_read: false,
                time_creation: new Date()
            };
            entry_list.push(entry);
        }
        MSG.create(entry_list, function (err) {
            if (err) {

                mw.sendData(res, 'err', err);
            }
            mw.sendData(res, 'success', {count: entry_list.length});
        });
    });

    // 批量生成多个消息 -- 可对多个用户生成不同的消息
    api.post('/batch_send_notice', function (req, res) {
        // req_list中的格式必须按照msg数据定义来走！
        if (req.body.req_list === undefined) {
            return mw.sendData(res, 'invalid_format', 'no req_list posted');
        }

        if (typeof(req.body.req_list) == 'string') {
            req.body.req_list = JSON.parse(req.body.req_list);
        }

        var msg_list = [];
        var count_total = req.body.req_list.length;
        var count_valid = 0;

        for (var i = 0; i < count_total; i++) {
            if (req.body.req_list[0].length > 5 || req.body.req_list[0].operator === undefined || req.body.req_list[0].target === undefined ||
                req.body.req_list[0].template_id === undefined || tpl.msg_templates[req.body.req_list[0].template_id] === undefined ||
                req.body.req_list[0].content.length != tpl.msg_templates[req.body.req_list[0].template_id].count_elements) {
                // 该请求无效，直接shift掉
                req.body.req_list.shift();
            }
            else    // 请求有效，将该元素从req_list中加入msg_list队列
            {
                if (!req.body.req_list[0]) continue; // 如果判断出来此处为undefined或者null，自动跳转到下一个循环段
                var entry = req.body.req_list.shift();
                entry.theme = tpl.msg_templates[entry.template_id].theme;
                entry.time_creation = new Date();
                msg_list.push(entry);
                count_valid += 1;
            }
        }
        // 生成新的MSG entry
        MSG.create(msg_list, function (err) {
            if (err) {
                mw.sendData(res, 'err', err);
            }
            mw.sendData(res, 'success', {total: count_total, valid: count_valid});
        });
    });

    // 发送短信 -- 模版方式或者自定义内容
    api.post('/send_sms/:method/:type', function (req, res) {
        if (process.env.node_env == 'dev') {
            return mw.sendData(res, 'success', {});
        }
        var result = '';
        // 以模版方式发送短信
        if (req.params.method == 'template') {
            if (tpl.sms_templates[req.body.template_id] === undefined) {
                return mw.sendData(res, 'invalid_format', {msg: 'No such template.'});
            }
            if (typeof(req.body.content) == 'string') {
                req.body.content = JSON.parse(req.body.content);
            }
            req.body.content = !req.body.content ? [] : req.body.content;
            var length = req.body.content.length;
            if (length != tpl.sms_templates[req.body.template_id].count_elements) {
                return mw.sendData(res, 'invalid_format', {msg: 'Length of content is invalid'});
            }
            result = utf8.encode(mw.encodeActualSMS(req.body.template_id, req.body.content, req));
        }
        // 自定义内容发送短信
        else {
            if (req.body.sms === undefined || req.body.sms == '') {
                return mw.sendData(res, 'invalid_format', 'The content of sms is not defined or it is an empty string.');
            }
            result = utf8.encode(req.body.sms);
        }
        if (typeof(req.body.phone_list) == 'string') {
            req.body.phone_list = JSON.parse(req.body.phone_list);
        }
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
            return mw.sendData(res, 'invalid_phone_number', {msg: 'No phone number is valid.'})
        }
        // 发送短信
        var headers =
            {
                //'Content-Type':'application/octet-stream;charset=utf-8'
                //'Content-Type':'application/json'
            };
        //var post_data = '"account":"' + config_common.sms_username + '",';
        //post_data += '"pswd":"' + config_common.sms_password + '",';
        //post_data += '"msg":"' + result + '",';
        //post_data += '"mobile":"' + final_phone_list + '",';
        //post_data += '"needstatus":true';

        //var post_data =
        //{
        //    account:config_common.sms_username,
        //    pswd:config_common.sms_password,
        //    msg:result,
        //    mobile:final_phone_list,
        //    needstatus:true
        //};

        var send_url = '';
        if (req.params.type == 'operation') {
            send_url = config_common.sms_operation.url_send + 'account=' + config_common.sms_operation.username + '&pswd=' + config_common.sms_operation.password;
        }
        else {
            send_url = config_common.sms_regular.url_send + 'account=' + config_common.sms_regular.username + '&pswd=' + config_common.sms_regular.password;
        }
        send_url += '&mobile=' + final_phone_list + '&msg=' + result + '&needstatus=true';
        var option = {
            'method': 'GET',
            //'json':true,
            'headers': headers,
            'url': send_url
            //'body':post_data
        };
        request(option, function (err, http_req, http_res) {
                if (err) {
                    return mw.sendData(res, 'err', err);
                }
                var first_line = http_res.split('\n').shift();
                var status_code = first_line.split(',').pop();
                if (status_code == '0') {
                    mw.sendData(res, 'success',
                        {
                            total_count: req_phone_length,
                            success_count: success_count,
                            failed_to_sms: invalid_phone_list
                            //status_code:status_code,
                            //msg_content:result,
                            //option:option
                        });
                }
                else {
                    mw.sendData(res, 'req_failed', {res: http_res, option: option});
                }
            }
        )
        ;
        //mw.sendData(res,'success',{url:option.url,phone:final_phone_list});
    });

    api.post('/send_sms1/:method/:type', function (req, res) {
        lib_util.send_sms(req, function (err, status, result) {
            if (err) return mw.sendData(res, 'err', err);
            mw.sendData(res, status, result);
        });
    });
    // 查询当前用户总共有多少条信息
    api.get('/get_msg_count/:target', function (req, res) {
        MSG.count({target: req.params.target}, function (err, count) {
            if (err) {
                return mw.sendData(res, 'err', err);
            }
            mw.sendData(res, 'success', count);
        });
    });

    // 查询当前用户在某个主题下总共有多少条未读信息 -- 按照主题分别计算
    api.post('/get_msg_unread_count', function (req, res) {
        if (!req.body.theme || !req.body.target) return mw.sendData(res, 'invalid_format', 'no theme or target');
        if (req.body.theme == 'all') {
            MSG.count({target: req.body.target, been_read: false}, function (err, count) {
                if (err) return mw.sendData(res, 'err', err);
                mw.sendData(res, 'success', count);
            });
        }
        else {
            if (typeof(req.body.theme) == 'string') req.body.theme = JSON.parse(req.body.theme);
            MSG.count({
                target: req.body.target,
                theme: {'$in': req.body.theme},
                been_read: false
            }, function (err, count) {
                if (err) return mw.sendData(res, 'err', err);
                mw.sendData(res, 'success', count);
            });
        }

    });

    // 查询当前用户某个主题下有多少条消息 -- 不分已读未读
    api.post('/get_msg_count', function (req, res) {
        if (!req.body.theme || !req.body.target) return mw.sendData(res, 'invalid_format', 'no theme or target');
        if (typeof(req.body.theme) == 'string') req.body.theme = JSON.parse(req.body.theme);
        MSG.count({target: req.body.target, theme: {'$in': req.body.theme}}, function (err, count) {
            if (err) return mw.sendData(res, 'err', err);
            var page_count = Math.ceil(count / config_common.msg_per_page);
            mw.sendData(res, 'success', {count_msg: count, count_page: page_count});
        });
    });

    api.post('/get_msg_list_for_user', function (req, res) {
        var page_num = parseInt(req.body.page);
        MSG.find({target: req.body.target})
            .sort({time_creation: -1})
            .skip((page_num - 1) * config_common.msg_per_page).limit(config_common.msg_per_page)
            .exec(function (err, list) {
                if (err) return mw.sendData(res, 'err', err);
                var results = [];
                if (list === undefined || list.length == 0) {
                    return mw.sendData(res, 'success', []);
                }
                for (var index in list) {
                    if (tpl.msg_templates[list[index].template_id] === undefined) continue;
                    results.push(
                        {
                            _id: list[index]._id,
                            msg: mw.encodeActualMSG(list[index].template_id, list[index].content),
                            theme: list[index].theme,
                            been_read: list[index].been_read,
                            url: list[index].url,
                            time: list[index].time_creation
                        });
                }
                mw.sendData(res, 'success', results);
            });
    });

    // 按照邮箱的方式收取信息 -- 不分已读未读
    api.get('/get_msg/:theme/:target/:page', function (req, res) {
        var page_num = parseInt(req.params.page);
        if (isNaN(page_num)) {
            return mw.sendData(res, 'invalid_format', 'invalid page number');
        }
        MSG.find({target: req.params.target, theme: req.params.theme})
            .sort({time_creation: -1})
            .skip((page_num - 1) * config_common.msg_per_page).limit(config_common.msg_per_page)
            .select('template_id content been_read url time_creation theme')
            .exec(function (err, list) {
                if (err) {
                    return mw.sendData(res, 'err', err);
                }
                //var arr_id = [];
                var results = [];
                if (list === undefined || list.length == 0) {
                    return mw.sendData(res, 'success', []);
                }
                for (var index in list) {
                    if (tpl.msg_templates[list[index].template_id] === undefined) continue;
                    //arr_id.push(list[index]._id);
                    results.push(
                        {
                            _id: list[index]._id,
                            msg: mw.encodeActualMSG(list[index].template_id, list[index].content),
                            theme: list[index].theme,
                            been_read: list[index].been_read,
                            url: list[index].url,
                            time: list[index].time_creation
                        });
                }
                mw.sendData(res, 'success', results);
                //MSG.update({_id:{'$in':arr_id}, been_read:false},{been_read:true},{multi:true},function(err)
                //{
                //    if(err)
                //    {
                //        return mw.sendData(res,'err',err);
                //    }
                //
                //});
            });
    });

    // 将某条信息置为已读
    api.get('/set_msg_read/:id', function (req, res) {
        MSG.update({_id: req.params.id, been_read: false}, {been_read: true}, function (err) {
            if (err) {
                return mw.sendData(res, 'err', err);
            }
            mw.sendData(res, 'success');
        });
    });

    // 将某人的某个种类的信息全部置为已读
    api.get('/set_all_msg_read/:theme/:id', function (req, res) {
        var query = {target: req.params.id, been_read: false};
        if (req.params.theme != 'all') {
            //if(config_common.msg_theme[req.params.theme] === undefined) return mw.sendData(res,'invalid_format','non-exist theme');
            query.theme = req.params.theme;
        }
        MSG.update(query, {been_read: true}, {multi: true}, function (err) {
            if (err) {
                return mw.sendData(res, 'err', err);
            }
            mw.sendData(res, 'success');
        });
    });

    // 获取系统消息个数
    api.get('/notice_count/:side', function (req, res) {
        Notice.count({side: req.params.side})
            .exec(function (err, count) {
                if (err) return mw.sendData(res, 'err', err);
                mw.sendData(res, 'success', count);
            });
    });

    // 获取系统消息
    api.get('/notice_list/:side', function (req, res) {
        Notice.find({side: req.params.side})
            .sort({'time_creation': -1})
            .select('content time_creation')
            .exec(function (err, list) {
                if (err) return mw.sendData(res, 'err', err);
                mw.sendData(res, 'success', list);
            });
    });

    //发送司机中心新增的4条短信
    api.post('/send_driver_sms', function (req, res, next) {
        if (!req.body.phone && !req.body.params && !req.body.templateid) {
            return next('invalid_format');
        }

        console.log('123123123123', req.body);

        async.waterfall([
            function (cb) {
                var Nonce = randomstring.generate(30);
                var CurTime = (new Date()).getTime() / 1000;
                var Str = '89c66da719a4' + Nonce + CurTime
                var CheckSum = lib_util.getCheckSum(Str);
                var data = {
                    templateid: req.body.templateid,
                    mobiles: req.body.phone,
                    params: req.body.params,
                    needUp: 'false'
                };
                request({
                    url: "https://api.netease.im/sms/sendtemplate.action",
                    // url: "https://api.netease.im/sms/sendcode.action?mobile=15210112715&needUp=false",
                    body: querystring.stringify(data),
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'AppKey': '14bffdae30502ad11e1a9bc2734e8e6d',
                        'Nonce': Nonce,
                        'CurTime': CurTime,
                        'CheckSum': CheckSum
                    }
                }, cb);
            },
            function (response, request, cb) {
                if (request.code === '200') {
                    cb();
                } else {
                    cb(request);
                }
            }
        ], function (err) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, {}, next);
        })
    });

    //发送rsc系列短信
    api.post('/send_rsc_sms', function (req, res, next) {
        if (!req.body.phone && !req.body.params && !req.body.templateid) {
            return next('invalid_format');
        }
        async.waterfall([
            function (cb) {
                var Nonce = randomstring.generate(30);
                var CurTime = (new Date()).getTime() / 1000;
                var Str = '1602955c262e' + Nonce + CurTime
                var CheckSum = lib_util.getCheckSum(Str);
                var data = {
                    templateid: req.body.templateid,
                    mobiles: req.body.phone,
                    params: req.body.params,
                    needUp: 'false'
                };
                request({
                    url: "https://api.netease.im/sms/sendtemplate.action",
                    // url: "https://api.netease.im/sms/sendcode.action?mobile=15210112715&needUp=false",
                    body: querystring.stringify(data),
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'AppKey': '34933ec0c6e6d8add0129e8177d39b41',
                        'Nonce': Nonce,
                        'CurTime': CurTime,
                        'CheckSum': CheckSum
                    }
                }, cb);
            },
            function (response, request, cb) {
                if (request.code === '200') {
                    cb();
                } else {
                    cb(request);
                }
            }
        ], function (err) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, {}, next);
        })
    })

    return api;
};

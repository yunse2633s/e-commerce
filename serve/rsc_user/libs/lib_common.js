/**
 * Created by Administrator on 2018\6\7 0007.
 */
var async = require('async');
var urlencode = require('urlencode');
var _ = require('underscore');
var request = require('request');

/**
 * 功能:用于信息客户列表的信息整理修改添加
 * 参数：list:这个是
 */
exports.editUserData = function (req, list, tag, callback) {
    var endList = [];
    async.waterfall([
        function (cb) {
            async.eachSeries(list, function (oneData, cbk) {
                var obj = {tag: tag};
                async.waterfall([
                    function (cbk2) {
                        global.lib_user.getOne({
                            find: {_id: oneData.other_user_id}
                        }, cbk2);
                    },
                    function (user, cbk2) {
                        if (user) {
                            obj._id = user._id.toString();
                            obj.status = true;
                            obj.real_name = user.real_name;
                            obj.role = user.role;
                            obj.photo_url = user.photo_url;
                            obj.phone = user.phone;
                            obj.post = user.post;
                            global.lib_company.getOne({
                                find: {_id: oneData.other_company_id}
                            }, cbk2);
                        } else {
                            cbk2(null, null);
                        }
                    },
                    function (company, cbk2) {
                        if (company) {
                            obj.company_name = company.nick_name ? company.nick_name : company.full_name;
                            obj.verify_phase = company.verify_phase ? company.verify_phase : company.verify_phase;
                            global.lib_user_relation.getOne({
                                find: {
                                    user_id: req.decoded.id,
                                    other_id: obj._id
                                }
                            }, cbk2);
                        } else {
                            cbk(null, null);
                        }
                    },
                    function (relation, cbk2) {
                        if (relation) {
                            obj.friend = true;
                        } else {
                            obj.friend = false;
                        }
                        if (obj._id) {
                            endList.push(obj);
                        }
                        cbk2();
                    }
                ], cbk);
            }, cb);
        },
        function (cb) {
            cb(null, endList);
        }
    ], callback);
};

/**
 * 功能:循环人的信息添加上和自己的关系
 */
exports.editTeamUserData = function (req, list, callback) {
    var endList = [];
    async.waterfall([
        function (cb) {
            async.eachSeries(list, function (oneData, cbk) {
                var obj = {tag: 'work'};
                async.waterfall([
                    function (cbk2) {
                        //查询合作关系
                        global.lib_work_relation.getCount({
                            user_id: req.decoded.id,
                            other_user_id: oneData._id
                        }, cbk2);
                    },
                    function (work, cbk2) {
                        if (work) {
                            oneData.tag = 'work';
                        }
                        //查询合作申请中的关系
                        global.lib_apply_relation.getCount({
                            status: 'WAIT',
                            type: 'WORK',
                            other_user_id: req.decoded.id,
                            user_id: oneData._id
                        }, cbk2);
                    },
                    function (data, cbk2) {
                        if (data) {
                            oneData.tag = 'working';
                        }
                        global.lib_user_relation.getOne({
                            find: {
                                user_id: req.decoded.id,
                                other_id: oneData._id
                            }
                        }, cbk2);
                    },
                    function (relation, cbk2) {
                        if (relation) {
                            oneData.friend = true;
                        } else {
                            oneData.friend = false;
                        }
                        endList.push(oneData);
                        cbk2();
                    }
                ], cbk);
            }, cb);
        },
        function (cb) {
            cb(null, endList);
        }
    ], callback);
};

/**
 * 功能:根据role等条件确认短信模板并发送短信（）
 */
exports.checkMsgForFriend = function (req, selfData, friend_extend, phones, callback) {
    var templateid;
    var params = [];
    if (!selfData.company) {
        selfData.company = {nick_name: ''};
    }
    async.waterfall([
        function (cb) {
            switch (selfData.user.role) {
                //交易邀请他人
                case config_common.user_roles.TRADE_ADMIN:
                case config_common.user_roles.TRADE_PURCHASE:
                case config_common.user_roles.TRADE_SALE:
                    //根据传入的好友类型确定邀请的什么人
                    switch (friend_extend) {
                        //(1-1)邀请采购商
                        case 'purchase':
                            var Number;
                            async.waterfall([
                                function (cbk) {
                                    //查询是否发过报价
                                    global.lib_http.sendTradeServer({
                                        method: 'getCount',
                                        cond: {
                                            user_id: req.decoded.id,
                                            company_id: selfData.user.company_id,
                                            type: 'DJ'
                                        },
                                        model: 'PriceOffer'
                                    }, global.config_api_url.server_common_get, cbk);
                                },
                                function (count, cbk) {
                                    //查询是否发过报价
                                    if (count) {
                                        Number = count;
                                        global.lib_http.sendTradeServer({
                                            method: 'getOne',
                                            cond: {
                                                find: {user_id: req.decoded.id, company_id: selfData.user.company_id},
                                                sort: {_id: -1}
                                            },
                                            model: 'PriceOffer'
                                        }, global.config_api_url.server_common_get, cbk);
                                    } else {
                                        cbk(null, null);
                                    }
                                },
                                function (data, cbk) {
                                    if (data) {
                                        //查询是否发过报价
                                        global.lib_http.sendTradeServer({id: data._id}, global.config_api_url.trade_server_get_layer, cbk);
                                    } else {
                                        cbk(null, null);
                                    }
                                },
                                function (data, cbk) {
                                    if (data) {
                                        templateid = '4073146';
                                        params = [selfData.company.nick_name, selfData.user.real_name, Number, data];
                                    } else {
                                        templateid = '4073147';
                                        params = [selfData.company.nick_name, selfData.user.real_name];
                                    }
                                    shortUrlTrade(req.decoded.id, cbk);
                                },
                                function (status, url, cbk) {
                                    params.push(url);
                                    global.lib_msg.send_sms(req, phones, params, templateid, cbk);
                                }
                            ], cb);

                            break;
                        //(1-2)邀请销售商
                        case 'sale':
                            //(1)确定短信模板id
                            var Number;
                            async.waterfall([
                                function (cbk) {
                                    //查询是否发过报价
                                    global.lib_http.sendTradeServer({
                                        method: 'getCount',
                                        cond: {user_id: req.decoded.id, company_id: selfData.user.company_id},
                                        model: 'Demand'
                                    }, global.config_api_url.server_common_get, cbk);
                                },
                                function (count, cbk) {
                                    if (count) {
                                        Number = count;
                                        global.lib_http.sendTradeServer({
                                            method: 'getOne',
                                            cond: {
                                                find: {user_id: req.decoded.id, company_id: selfData.user.company_id},
                                                sort: {_id: -1}
                                            },
                                            model: 'Demand'
                                        }, global.config_api_url.server_common_get, cbk);
                                    } else {
                                        cbk(null, null);
                                    }
                                },
                                function (data, cbk) {
                                    if (data) {
                                        var layer = data.product_categories[0].layer;
                                        var str = '';
                                        var arr = [];
                                        for (var i = 0; i < _.keys(layer).length; i++) {
                                            var index = _.keys(layer)[i];
                                            index = index.replace('_chn', '').toString();
                                            arr[index.split('_')[1] - 1] = layer[index + '_chn'] + ';';
                                        }
                                        //keys顺序会变，从一级分类开始整理
                                        for (var j = 0; j < arr.length; j++) {
                                            str += arr[j];
                                        }
                                        str = str.substr(0, str.length - 1);
                                        var str2 = str.split(';')[str.split(';').length - 1];
                                        var str3 = str2 + '-' + data.product_categories[0].product_name[0].name + '等';
                                        cbk(null, str3)
                                    } else {
                                        cbk(null, null);
                                    }
                                },
                                function (str, cbk) {
                                    if (str) {
                                        templateid = '3913042';
                                        params = [selfData.company.nick_name, selfData.user.real_name, str];
                                    } else {
                                        templateid = '3913041';
                                        params = [selfData.company.nick_name, selfData.user.real_name];
                                    }
                                    shortUrlTrade(req.decoded.id, cbk);
                                },
                                function (status, url, cbk) {
                                    params.push(url);
                                    global.lib_msg.send_sms(req, phones, params, templateid, cbk);
                                }
                            ], cb);

                            break;
                        //(1-3)邀请物流方
                        case 'traffic':
                            //(1)确定短信模板id
                            templateid = '3923027';
                            params = [selfData.company.nick_name];
                            async.waterfall([
                                function (cbk) {
                                    shortUrlTrade(req.decoded.id, cbk);
                                },
                                function (status, url, cbk) {
                                    params.push(url);
                                    global.lib_msg.send_sms(req, phones, params, templateid, cbk);
                                }
                            ], cb);
                            break;
                    }
                    break;
                //物流邀请他人
                case config_common.user_roles.TRAFFIC_ADMIN:
                case config_common.user_roles.TRAFFIC_EMPLOYEE:
                case config_common.user_roles.TRAFFIC_CAPTAIN:
                    //根据传入的好友类型确定邀请的什么人
                    switch (friend_extend) {
                        //(1-1)邀请货源方
                        case 'trade':
                        case 'purchase':
                            //(1)确定短信模板id
                            templateid = '3923028';
                            params = [selfData.company.nick_name, selfData.user.real_name];
                            async.waterfall([
                                function (cbk) {
                                    //确定短连接
                                    shortUrlTraffic(req.decoded.id, cbk);
                                },
                                function (status, url, cbk) {
                                    params.push(url);
                                    global.lib_msg.send_sms(req, phones, params, templateid, cbk);
                                }
                            ], cb);
                            break;
                        //(1-1)邀请货源方
                        case 'driver':
                            //(1)确定短信模板id
                            templateid = '4132009';
                            params = [selfData.company.nick_name, selfData.user.real_name];
                            async.waterfall([
                                function (cbk) {
                                    //确定短连接
                                    shortUrlTraffic(req.decoded.id, cbk);
                                },
                                function (status, url, cbk) {
                                    params.push(url);
                                    global.lib_msg.send_sms(req, phones, params, templateid, cbk);
                                }
                            ], cb);
                            break;
                    }
                    break;
                //司机邀请他人
                case config_common.user_roles.TRAFFIC_DRIVER_PRIVATE:
                    //根据传入的好友类型确定邀请的什么人
                    switch (friend_extend) {
                        //(1-1)邀请物流方
                        case 'traffic':
                            //(1)确定短信模板id
                            templateid = '3923026';
                            params = [req.decoded.user_name];
                            async.waterfall([
                                function (cbk) {
                                    global.lib_truck.getOne({
                                        find: {user_id: {$in: [req.decoded.id]}}
                                    }, cbk);
                                },
                                function (truck, cbk) {
                                    params.push(truck.weight);
                                    params.push(truck.number);
                                    //确定短连接
                                    shortUrlDriver(req.decoded.id, cbk);
                                },
                                function (status, url, cbk) {
                                    params.push(url);
                                    global.lib_msg.send_sms(req, phones, params, templateid, cbk);
                                }
                            ], cb);
                            break;
                        //(1-2)邀请司机
                        case 'driver':
                            //(1)确定短信模板id
                            templateid = '4073148';
                            params = [req.decoded.user_name];
                            async.waterfall([
                                function (cbk) {
                                    //确定短连接
                                    shortUrlDriver(req.decoded.id, cbk);
                                },
                                function (status, url, cbk) {
                                    params.push(url);
                                    global.lib_msg.send_sms(req, phones, params, templateid, cbk);
                                }
                            ], cb);
                            break;
                    }
                    break;

                default :
                    callback('role_err');
                    break;
            }
        }
    ], callback);
};

/**
 * 功能:根据role等条件确认短信模板并发送短信（）
 */
exports.checkMsgForColleague = function (req, selfData, role, phones, callback) {
    var templateid;
    var params = [];
    async.waterfall([
        function (cb) {
            switch (selfData.user.role) {
                //交易邀请同事
                case config_common.user_roles.TRADE_ADMIN:
                case config_common.user_roles.TRADE_PURCHASE:
                case config_common.user_roles.TRADE_SALE:
                    //根据传入的角色类型确定邀请的什么人
                    //(1)确定短信模板id
                    templateid = '3963059';
                    params = [selfData.company.nick_name, selfData.user.real_name, global.config_common.user_roles_chn[role]];
                    async.waterfall([
                        function (cbk) {
                            shortUrlTrade(req.decoded.id, cbk);
                        },
                        function (status, url, cb) {
                            params.push(url);
                            global.lib_msg.send_sms(req, phones, params, templateid, cb);
                        }
                    ], callback);
                    break;
                //物流邀请同事
                case config_common.user_roles.TRAFFIC_ADMIN:
                case config_common.user_roles.TRAFFIC_EMPLOYEE:
                case config_common.user_roles.TRAFFIC_CAPTAIN:
                    //根据传入的角色类型确定邀请的什么人
                    //(1)确定短信模板id
                    templateid = '3913038';
                    params = [selfData.company.nick_name, selfData.user.real_name, global.config_common.user_roles_chn[role]];
                    async.waterfall([
                        function (cbk) {
                            shortUrlTraffic(req.decoded.id, cbk);
                        },
                        function (status, url, cb) {
                            params.push(url);
                            global.lib_msg.send_sms(req, phones, params, templateid, cb);
                        }
                    ], callback);
                    break;
                default :
                    callback('role_err');
                    break;
            }
        }
    ], callback);
};

/**
 * 功能:根据个人的id确定个人主页地址，并转化为短连接
 */
var shortUrlTrade = function (id, callback) {
    //确定短连接
    //内网
    //var url = 'http://192.168.3.248:3000/#/rsc/person_page?id=' + id;
    //验收
    //var url = 'http://dev.e-wto.com/zgy/trade/ts/index.html#/person_home/' + id;
    //正式
    var url = 'http://support.sinosteel.cc/ts-web/zgy-trade/index.html#/person_home/' + id;
    async.waterfall([
        function (cb) {
            var headers = {'Content-Type': 'application/x-www-form-urlencoded'};
            var options =
                {
                    'method': 'GET',
                    'headers': headers,
                    'url': 'http://suo.im/api.php?url=' + urlencode(url)
                };
            request(options, cb);
        }
    ], callback);
};
exports.shortUrlTrade = shortUrlTrade;
/**
 * 功能:根据个人的id确定个人主页地址，并转化为短连接
 */
var shortUrlTraffic = function (id, callback) {
    //确定短连接
    //内网
    //var url = 'http://192.168.3.248:3001/#/rsc/person_page?id=' + id;
    //验收
    //var url = 'http://dev.e-wto.com/rsc/traffic/ts/index.html#/person_home/' + id;
    //正式
    var url = 'http://support.e-wto.com/ts_web/traffic/index.html#/person_home/' + id;

    async.waterfall([
        function (cb) {
            var headers = {'Content-Type': 'application/x-www-form-urlencoded'};
            var options =
                {
                    'method': 'GET',
                    'headers': headers,
                    'url': 'http://suo.im/api.php?url=' + urlencode(url)
                };
            request(options, cb);
        }
    ], callback);
};
exports.shortUrlTraffic = shortUrlTraffic;
/**
 * 功能:根据个人的id确定个人主页地址，并转化为短连接
 */
var shortUrlDriver = function (id, callback) {
    //确定短连接
    //内网
    //var url = 'http://192.168.3.248:3001/#/rsc/person_page?id=' + id;
    //验收服
    //var url = 'http://dev.e-wto.com/rsc/driver/ts/index.html#/person_home/' + id;
    //正式
    var url = 'http://support.e-wto.com/ts_web/driver/index.html#/person_home/' + id;
    async.waterfall([
        function (cb) {
            var headers = {'Content-Type': 'application/x-www-form-urlencoded'};
            var options =
                {
                    'method': 'GET',
                    'headers': headers,
                    'url': 'http://suo.im/api.php?url=' + urlencode(url)
                };
            request(options, cb);
        }
    ], callback);
};
exports.shortUrlDriver = shortUrlDriver;

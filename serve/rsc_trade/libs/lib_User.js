/**
 * Created by Administrator on 17/4/21.
 */
var http = require('../libs/http');
var async = require('async');
var _ = require('underscore');
var jwt = require('jsonwebtoken');
var request = require('request');
var querystring = require('querystring');

var config_server = global.config_server;

var config_common = global.config_common;
var obj = {
    user_server_user_relation_get_trade_circle: '/api/server/user_relation/get_trade_circle',//生意圈显示的人id
    dynamic_server_company_dynamic_add: '/api/server/company_dynamic/add', // 添加动态
    user_server_common: '/api/server/common/get', // 自定义查询user
    user_server_get_push_user: '/api/server/user_relation/get_push_user'  //获取要推送的好友和合作人
};

/**
 * 生意圈显示的人id
 * @param data  {user_id,type}
 * @param callback
 */
exports.get_trade_circle = function (data, callback) {
    http.sendUserServer(data, obj.user_server_user_relation_get_trade_circle, callback);
};
/**
 * 推送的好友和合作人
 * @param data
 * @param callback
 */
exports.get_push_user = function (data, callback) {
    http.sendUserServer(data, obj.user_server_get_push_user, callback);
};

/**
 * 增加公司动态
 * @param data
 * @param callback
 */
exports.addCompanyDynamic = function (data, callback) {
    if (!callback) callback = function () {
    };
    sendDynamicServer(data, obj.dynamic_server_company_dynamic_add, callback);
};

/**
 * 得到仓库列表
 */
exports.getListStorage = function (data, callback) {
    if (!callback) callback = function () {
    };
    http.sendUserServer({
        cond: data,
        model: 'Address',
        method: 'getList'
    }, obj.user_server_common, callback);
};

/**
 * 获取公司合作人
 * @param req
 * @param  type
 * @param  isArr
 * @param callback
 */
exports.getWorkRelationList = function (req, type, callback, isArr) {
    var Arr = [];
    req.body.company_ids = req.body.company_ids && req.body.company_ids.length > 0 && !isArr ? req.body.company_ids : [req.body.company_id];
    async.eachSeries(req.body.company_ids, function (id, cb) {
        var cond = {};
        if (req.decoded.role === global.config_common.user_roles.TRADE_ADMIN) {
            cond = {find: {company_id: req.decoded.company_id, other_company_id: id, type: type}};
        } else {
            cond = {find: {user_id: req.decoded.id, other_company_id: id, type: type}};
        }
        http.sendUserServer({
            cond: cond,
            model: 'Work_relation',
            method: 'getList'
        }, obj.user_server_common, function (err, result) {
            if (err) return cb(err);
            Arr = Arr.concat(_.pluck(result, 'other_user_id'));
            cb();
        });
    }, function (err) {
        if (err) return callback(err);
        callback(null, _.uniq(Arr));
    });
};

/**
 * 新获取认证公司列表
 * @param req
 * @param  type
 * @param  isArr
 * @param callback
 */
exports.getWorkRelationCompanyList = function (req, type, callback, isArr) {
    var Arr = [];
    req.body.company_ids = req.body.company_ids && req.body.company_ids.length > 0 && !isArr ? req.body.company_ids : [req.body.company_id];
    async.eachSeries(req.body.company_ids, function (id, cb) {
        var cond = {find: {user_id: req.decoded.id, type: type}};
        http.sendUserServer({
            cond: cond,
            model: 'Work_relation',
            method: 'getList'
        }, obj.user_server_common, function (err, result) {
            if (err) return cb(err);
            Arr = Arr.concat(_.pluck(result, 'other_company_id'));
            cb();
        });
    }, function (err) {
        if (err) return callback(err);
        callback(null, _.compact(_.uniq(Arr)));
    });
};
/**
 * 获取所有公司合作人
 * @param req
 * @param  type
 * @param callback
 */
exports.getWorkRelationListAll = function (req, type, callback) {
    var Arr = [];
    var cond = {};
    if (req.decoded && req.decoded.role === global.config_common.user_roles.TRADE_ADMIN) {
        cond = {find: {company_id: req.body.company_id || req.decoded.company_id, type: type}};
    } else {
        cond = {find: {user_id: req.body.user_id || req.decoded.id, type: type}};
    }
    http.sendUserServer({
        cond: cond,
        model: 'Work_relation',
        method: 'getList'
    }, obj.user_server_common, function (err, result) {
        if (err) return callback(err);
        Arr = Arr.concat(_.pluck(result, 'other_user_id'));
        callback(null, Arr);
    });
};
exports.getWorkRelation = function (data, callback) {
    http.sendUserServer({
        cond: data,
        model: 'Work_relation',
        method: 'getList'
    }, obj.user_server_common, function (err, result) {
        if (err) return callback(err);
        callback(null, result);
    });
};

exports.getWorkRelationCount = function (req, callback) {
    var count = 0;
    req.body.company_ids = req.body.company_ids && req.body.company_ids.length > 0 ? req.body.company_ids : [req.body.company_id];
    async.eachSeries(req.body.company_ids, function (id, cb) {
        var cond = {};
        if (req.body.role === global.config_common.user_roles.TRADE_ADMIN) {
            cond = {find: {company_id: req.decoded.company_id, other_company_id: id}};
        } else {
            cond = {find: {user_id: req.decoded.user_id, other_company_id: id}};
        }
        http.sendUserServer({
            cond: cond,
            model: 'Work_relation',
            method: 'getCount'
        }, obj.user_server_common, function (err, result) {
            if (err) return cb(err);
            count += result;
            cb();
        });
    }, function (err) {
        if (err) return callback(err);
        callback(null, count);
    })
};

/**
 * 获取自己的好友
 * @param req
 * @param callback
 */
exports.getUserRelationList = function (req, callback) {
    http.sendUserServer({
        cond: {find: {user_id: req.decoded.id, type: 'FRIEND'}, select: 'other_id'},
        model: 'User_relation',
        method: 'getList'
    }, obj.user_server_common, function (err, result) {
        if (err) return callback(err);
        callback(null, _.pluck(result, 'other_id'));
    });
};

/**
 * 获取认证公司
 * @param data
 * @param callback
 */
exports.getCompanyRelationList = function (data, callback) {
    async.waterfall([
        function (cb) {
            http.sendUserServer({
                cond: data,
                model: 'Company_relation',
                method: 'getList'
            }, obj.user_server_common, cb);
        }
    ], callback);
};

/**
 * 获取认证公司长度
 * @param data
 * @param callback
 */
exports.getCompanyRelationCount = function (data, callback) {
    async.waterfall([
        function (cb) {
            http.sendUserServer({
                cond: data,
                model: 'Company_relation',
                method: 'getCount'
            }, obj.user_server_common, cb);
        }
    ], callback);
};

/**
 * 获取未上线的邀请人
 * @param data
 * @param callback
 */
exports.getUserInvitationPhoneList = function (data, callback) {
    async.waterfall([
        function (cb) {
            http.sendUserServer({
                cond: data,
                model: 'User_invitation_phone',
                method: 'getList'
            }, obj.user_server_common, cb);
        }
    ], callback);
};

/**
 * 地址
 * @param data
 * @param callback
 */
exports.getAddressList = function (data, callback) {
    async.waterfall([
        function (cb) {
            http.sendUserServer({
                cond: data,
                model: 'Address',
                method: 'getList'
            }, obj.user_server_common, cb);
        },
        function (result, cb) {
            if (result.length > 0) return cb(null, result);
            http.sendUserServer({
                cond: data,
                model: 'Address',
                method: 'getList'
            }, obj.user_server_common, cb);
        }
    ], callback);
};
exports.getAddressOne = function (data, callback) {
    async.waterfall([
        function (cb) {
            http.sendUserServer({
                cond: data,
                model: 'Address',
                method: 'getOne'
            }, obj.user_server_common, cb);
        },
        function (company, cb) {
            if (company) return cb(null, company);
            http.sendUserServer({
                cond: data,
                model: 'Address',
                method: 'getOne'
            }, obj.user_server_common, cb);
        }
    ], callback);
};
exports.defaultOne = function (data, callback) {
    async.waterfall([
        function (cb) {
            http.sendUserServer({
                cond: data,
                model: 'Default_store',
                method: 'getOne'
            }, obj.user_server_common, cb);
        }
    ], callback);
};
/**
 * 用户
 * @param data
 * @param callback
 */
exports.getUserList = function (data, callback) {
    async.waterfall([
        function (cb) {
            http.sendUserServer({
                cond: data,
                model: 'User_trade',
                method: 'getList'
            }, obj.user_server_common, cb);
        },
        function (result, cb) {
            if (result.length > 0) return cb(null, result);
            http.sendUserServer({
                cond: data,
                model: 'User_traffic',
                method: 'getList'
            }, obj.user_server_common, cb);
        }
    ], callback);
};
exports.getUserOne = function (data, callback) {
    async.waterfall([
        function (cb) {
            http.sendUserServer({
                cond: data,
                model: 'User_trade',
                method: 'getOne'
            }, obj.user_server_common, cb);
        },
        function (company, cb) {
            if (company) return cb(null, company);
            http.sendUserServer({
                cond: data,
                model: 'User_traffic',
                method: 'getOne'
            }, obj.user_server_common, cb);
        }
    ], callback);
};

/**
 * 公司
 * @param data
 * @param callback
 */
exports.getCompanyList = function (data, callback) {
    async.waterfall([
        function (cb) {
            http.sendUserServer({
                cond: data,
                model: 'Company_trade',
                method: 'getList'
            }, obj.user_server_common, cb);
        },
        function (result, cb) {
            if (result.length > 0) return cb(null, result);
            http.sendUserServer({
                cond: data,
                model: 'Company_traffic',
                method: 'getList'
            }, obj.user_server_common, cb);
        }
    ], callback);
};
exports.getCompanyOne = function (data, callback) {
    async.waterfall([
        function (cb) {
            http.sendUserServer({
                cond: data,
                model: 'Company_trade',
                method: 'getOne'
            }, obj.user_server_common, cb);
        },
        function (company, cb) {
            if (company) return cb(null, company);
            http.sendUserServer({
                cond: data,
                model: 'Company_traffic',
                method: 'getOne'
            }, obj.user_server_common, cb);
        }
    ], callback);
};
exports.checkCompanyVIP = function (data, callback) {
    async.waterfall([
        function (cb) {
            http.sendUserServer({
                cond: data,
                model: 'Company_trade',
                method: 'getOne'
            }, obj.user_server_common, cb);
        },
        function (company, cb) {
            if (company) {
                cb(null, company);
            } else {
                http.sendUserServer({
                    cond: data,
                    model: 'Company_traffic',
                    method: 'getOne'
                }, obj.user_server_common, cb);
            }
        },
        function (result, cb) {
            if (!result.VIP) {
                cb(global.config_error.invalid_VIP)
            } else {
                cb();
            }
        }
    ], callback);
};

/**
 * 功能：添加推送内容
 * @param data
 * @param callback
 */
exports.addPushContent = function (data, callback) {
    http.sendUserServer({
        cond: data,
        model: 'Push_content',
        method: 'add'
    }, obj.user_server_common, function (err, result,count) {
        if (err) return callback(err);
        callback(null, result);
    });
};

var createTokenDynamicServer = function (data) {
    return jwt.sign(data, config_common.secret_keys.dynamic, {
        expiresIn: config_common.token_server_timeout
    });
};
var sendDynamicServer = function (data, url, cb) {
    if (!cb) cb = function () {
    };
    data = createTokenDynamicServer(data);
    var headers = {
        'Content-Type': 'application/x-www-form-urlencoded'
    };
    var option = {
        body: querystring.stringify({token: data}),
        url: 'http://' + config_server.dynamic_server_ip + ':' + config_server.dynamic_server_port + url,
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

var checkTrafficCompanyByRole = function (role) {
    return role.indexOf(config_common.company_category.TRAFFIC) >= 0;
};

var checkTradeCompanyByRole = function (role) {
    return role.indexOf(config_common.company_category.TRADE) >= 0;
};

//检查个人公司是否存在
exports.checkUserCompany = function (user) {
    return !((checkTradeCompanyByRole(user.role) && !user.company_id) ||
    (checkTrafficCompanyByRole(user.role) && !user.company_id.length));
};




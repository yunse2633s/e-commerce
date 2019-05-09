/**
 * Created by Administrator on 2017/4/18.
 */
var async = require('async');
var _ = require('underscore');

var db_model = require('../db/db_base')('Uuid');

var sdk = require('../sdks/sdk_jiguang_push');

var lib_util = require('../lib/lib_util');
var lib_User = require('../lib/lib_User');


exports.push = function (data, cb, req) {
    async.waterfall([
        function (callback) {
            db_model.getList({
                find: {user_id: {$in: data.user_ids}}
            }, callback);
        },
        function (uuids, callback) {
            // 查询平台中的对应用户的手机号码
            lib_User.getUserList({
                find: {_id: {$in: _.difference(data.user_ids, lib_util.transObjArrToSigArr(uuids, 'user_id'))}} //返回不含uuid的用户
            }, function (err, result) {
                lib_util.send_sms({
                    headers: req ? req.headers : "",
                    body: {
                        phone_list: _.pluck(result, 'phone'),
                        content: [data.content],
                        template_id: 'custom'
                    }, params: {method: 'template', type: 'GBK'}
                });
            });
            if (lib_util.transObjArrToSigArr(uuids, 'uuid').length === 0) {
                return callback('no_reg_ids');
            } else {
                //若uuid不为空
                var apps = {};
                for (var i = 0; i < uuids.length; i++) {
                    var uuid = uuids[i];
                    if (!apps[uuid.package_name]) {
                        apps[uuid.package_name] = [];
                    }
                    apps[uuid.package_name].push(uuid.uuid);
                }
                if (data.content.substr(-2, 2) == "^^") {
                    function delfh(str) {
                        if (str.substr(-2, 2) == "^^") {
                            str2 = str.substring(0, str.length - 2);
                        }
                        return str2;
                    }
                    data.content = delfh(data.content);
                }
                for (var key in apps) {
                    sdk.push(data, key, apps[key]);
                }
            }
            callback();
        }
    ], cb);
};

exports.add = function (data, cb) {
    async.waterfall([
        function (callback) {
            db_model.getOne({find: {user_id: data.user_id}}, callback);
        },
        function (uuid, callback) {
            if (!uuid) {
                db_model.add(data, callback);
            } else {
                uuid.uuid = data.uuid;
                uuid.package_name = data.package_name;
                // uuid.time_creation = new Date();
                uuid.time_modify = new Date();
                db_model.edit(uuid, callback);
            }
        }
    ], cb);
};
exports.getOne = function (data, cb) {
    db_model.getOne(data, cb);
};

exports.del = function (data, cb) {
    async.waterfall([
        function (callback) {
            db_model.del(data, callback);
        }
    ], cb);
};
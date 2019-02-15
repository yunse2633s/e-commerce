var async = require('async');
var express = require('express');
var _ = require('underscore');
module.exports = function () {
    var api = express.Router();

    //通过电话获取人名
    api.post('/get_name_by_phone', function (req, res, next) {
        if (!global.config_common.checkPhone(req.body.phone)) {
            return next('invalid_format');
        }
        global.lib_user_new.getOne({
            find: {phone: req.body.phone},
            select: 'real_name'
        }, function (err, user) {
            if (err) {
                return next(err);
            }
            var name = user ? user.real_name : '';
            global.config_common.sendData(req, name, next);
        });
    });

    //通过电话获取人名
    api.post('/enter', function (req, res, next) {
        if (!global.config_common.checkPhone(req.body.phone) ||
            !global.config_common.checkRealName(req.body.name) ||
            !global.config_common.user_type[req.body.type] ||
            !req.body.verify_code) {
            return next('invalid_format');
        }
        var verifyCodeData;
        var companyType;
        var userData;
        var companyData;
        async.waterfall([
            function (cb) {
                global.lib_verify_code.getOne({
                    find: {phone: req.body.phone, type: global.config_common.user_type[req.body.type].toLowerCase()}
                }, cb);
            },
            function (code, cb) {
                if (req.body.verify_code === global.config_common.password && _.indexOf(global.config_common.phoneArr, req.body.phone) !== -1) {
                    cb();
                } else {
                    verifyCodeData = code;
                    global.lib_verify_code.check(code, req.body.verify_code, cb);
                }
            },
            function (cb) {
                if (req.body.verify_code === global.config_common.password && _.indexOf(global.config_common.phoneArr, req.body.phone) !== -1) {
                    cb(null, null, null);
                } else {
                    switch (req.body.type) {
                        case global.config_common.user_type.DRIVER:
                        case global.config_common.user_type.TRAFFIC:
                            companyType = global.config_common.company_category.TRAFFIC;
                            break;
                        default:
                            companyType = global.config_common.company_category.TRADE;
                            break;
                    }
                    verifyCodeData.companyType = companyType;
                    verifyCodeData.type = global.config_common.user_type[req.body.type].toLowerCase();
                    verifyCodeData.save(cb);
                }
            },
            function (v_code, count, cb) {
                //添加人和角色
                global.service_user.add({
                    phone: req.body.phone,
                    real_name: req.body.name,
                    type: req.body.type
                }, cb);
            },
            function (user, cb) {
                userData = user;
                //添加公司类型
                if (req.body.company_id) {
                    global.service_company.addById(req.body.company_id, req.body.type, cb);
                } else if (global.config_common.checkUserCompany(userData)) {
                    global.lib_company.getOne({find: {_id: userData.company_id}}, cb);
                } else {
                    cb(null, {});
                }
            },
            function (company, cb) {
                companyData = company;
                if (req.body.company_id) {
                    global.service_user.addRoleCompanyId(company._id.toString(), userData._id.toString(), cb);
                } else {
                    cb();
                }
            },
            function (cb) {
                //增加一个判断，根据包名查询和是否是vip公司 如果是的话，根据包名查询到这家公司并向公司超管发送好友申请
                if (req.body.package_name) {
                    //每一家不同的vip公司都有不同的包名！
                    global.lib_company.getOne({
                        find: {package_name: req.body.package_name}
                    }, cb);
                } else {
                    cb(null, null);
                }
            },
            function (company_package, cb) {
                //如果存在包名就继续判断是否是vip公司并且判断是否是自己的包
                if (company_package) {
                    if (company_package.package_name !== req.body.package_name || !company_package.vip) {
                        cb();
                    } else {
                        //继续判断 如果这个人 的公司 id 不等于这家公司 就给这家公司超管发送申请
                        if (userData.company_id === company_package._id.toString()) {
                            cb();
                        } else {
                            //经过一系列判断后，确定这个人需要给这个包所属的公司的超管 发送 好友申请 了
                            async.waterfall([
                                function (cbk) {
                                    global.lib_user.getList({
                                        find: {
                                            company_id: company_package._id.toString(),
                                            role: global.config_common.user_roles.TRADE_ADMIN
                                        }
                                    }, cbk);
                                },
                                function (users, cbk) {
                                    async.eachSeries(users, function (user, callback) {
                                        global.lib_http.sendMsgServerNoToken({
                                            title: '互联网+',
                                            user_ids: JSON.stringify([user._id.toString()]),
                                            content: '' + '' + userData.real_name + '向您申请成为好友，请点击查看',
                                            data: JSON.stringify({
                                                params: {id: userData._id},
                                                url: 'trade.new_message',
                                                type: "rsc.new_relation"
                                            })
                                        }, global.config_api_url.msg_server_push);
                                        var data = {
                                            type: global.config_common.relation_style.FRIEND,
                                            user_id: user._id.toString(),               //自己id
                                            other_user_id: userData._id.toString()      //对方id
                                        };
                                        global.lib_apply_relation.add(data, callback);
                                    }, cbk);
                                }
                            ], cb);
                        }
                    }
                } else {
                    cb();
                }
            }
        ], function (err) {
            if (err) {
                return next(err);
            }
            global.lib_invitation_user.signup(userData, function () {
            });
            global.config_common.sendData(req, {
                user: userData,
                company: companyData,
                token: global.config_common.createTokenUser(userData, companyData)
            }, next);
        });
    });

    return api;
};
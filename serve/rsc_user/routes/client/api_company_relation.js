/**
 * Created by Administrator on 2015/12/28.
 */
var async = require('async');
var _ = require('underscore');
var express = require('express');

var util = require('../../libs/lib_util');
var http = require('../../libs/lib_http');
var userService = require('../../libs/lib_user');
var companyService = require('../../libs/lib_company');
var companyRelation = require('../../libs/lib_company_relation');
// var userInvitationPhoneService = require('../../libs/lib_user_invitation_phone');


var TrafficCompany = require('../../models/Company_traffic');
var TradeCompany = require('../../models/Company_trade');
var CompanyRelation = require('../../models/Company_relation');
var config_common = require('../../configs/config_common');
var config_api_url = require('../../configs/config_api_url');

module.exports = function () {
    var api = express.Router();

    api.use(require('../../middlewares/mid_verify_user')());

    /**
     * 取消公司合作关系 --> 暂时取消
     * 参数（1）：company_id
     */
    // api.post('/del_company_relation', function (req, res, next) {
    //     if (!req.body.company_id) {
    //         return next('invalid_format');
    //     }
    //     if (req.decoded.role !== config_common.user_roles.TRAFFIC_ADMIN &&
    //         req.decoded.role !== config_common.user_roles.TRADE_ADMIN) {
    //         return next('not_allow');
    //     }
    //     //不能删除自己的
    //     if (req.body.company_id == req.decoded.company_id) {
    //         return next('not_del_self');
    //     }
    //     async.waterfall([
    //         function (cb) {
    //             //找到两家公司的合作关系删除掉
    //             global.lib_company_relation.getList({
    //                 find: {
    //                     $or: [{self_id: req.decoded.cpmpany_id, other_id: req.body.company_id},
    //                         {self_id: req.body.company_id, other_id: req.decoded.cpmpany_id}]
    //                 }
    //             }, cb);
    //         },
    //         function (data, cb) {
    //             if (data.length) {
    //                 for (var i = 0; i < data.length; i++) {
    //                     data[i].remove();
    //                     cb();
    //                 }
    //             } else {
    //                 return cb('not_found');
    //             }
    //         },
    //         function (count, cb) {
    //             global.lib_work_relation.getList({
    //                 find: {
    //                     $or: [{company_id: req.decoded.cpmpany_id, other_company_id: req.body.company_id},
    //                         {company_id: req.body.company_id, other_company_id: req.decoded.cpmpany_id}]
    //                 }
    //             }, cb)
    //         },
    //         function (datas, cb) {
    //             if (datas) {
    //                 for (var i = 0; i < datas.length; i++) {
    //                     datas[i].remove();
    //                     cb();
    //                 }
    //             } else {
    //                 cb();
    //             }
    //         }
    //     ], function (err) {
    //         if (err) {
    //             return next(err);
    //         }
    //         config_common.sendData(req, {}, next);
    //     })
    // });

    //申请认证
    api.post('/apply_verify', function (req, res, next) {
        if (!(req.body.company_id)) {
            return next('invalid_format');
        }
        if (req.decoded.role !== config_common.user_roles.TRAFFIC_ADMIN &&
            req.decoded.role !== config_common.user_roles.TRADE_ADMIN) {
            return next('not_allow');
        }
        //不能向自己申请认证
        if (req.body.company_id == req.decoded.company_id) {
            return next('not_verify_self');
        }
        async.waterfall([
            function (cb) {
                companyService.getOne({find: {_id: req.body.company_id}}, cb);
            },
            function (data, cb) {
                if (!data) {
                    return cb('not_found');
                }
                //物流不能向物流申请认证
                if (req.decoded.role == config_common.user_roles.TRAFFIC_ADMIN &&
                    data.type == config_common.company_category.TRAFFIC) {
                    return cb('not_allow');
                }
                req.body.other_type = data.type;//对方企业类型
                var cond;
                //交易向物流申请认证type传PURCHASE
                if (req.body.type == 'PURCHASE') {
                    cond = {self_id: req.decoded.company_id, other_id: req.body.company_id};
                } else {
                    cond = {self_id: req.body.company_id, other_id: req.decoded.company_id};
                }
                companyRelation.getOne({find: cond}, cb);
            },
            function (companyRelationData, cb) {
                if (companyRelationData) {
                    if (companyRelationData.type == companyRelation.relation_type.WAIT) {
                        return cb('wait_verify');
                    } else {
                        return cb('already_verify');
                    }
                } else {
                    if (req.body.type == 'PURCHASE') {
                        companyRelation.add({
                            apply_user_id: req.decoded.id,   //申请人id(一定是self_user_id和other_user_id中一个)
                            approve_user_id: req.body.user_id || '', //审批人id(一定是self_user_id和other_user_id中一个)
                            self_user_id: req.decoded.id,
                            self_id: req.decoded.company_id,
                            other_id: req.body.company_id,
                            other_user_id: req.body.user_id || '',
                            other_type: req.body.other_type,
                            type: companyRelation.relation_type.WAIT
                        }, cb);
                    } else {
                        companyRelation.add({
                            apply_user_id: req.decoded.id,   //申请人id(一定是self_user_id和other_user_id中一个)
                            approve_user_id: req.body.user_id || '', //审批人id(一定是self_user_id和other_user_id中一个)
                            self_id: req.body.company_id,
                            self_user_id: req.body.user_id || '',
                            other_user_id: req.decoded.id,
                            other_id: req.decoded.company_id,
                            other_type: req.body.other_type,
                            type: companyRelation.relation_type.WAIT
                        }, cb);
                    }
                }
            }
        ], function (err) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, {}, next);
        });
    });

    //给成员分配公司-2.0.0-2017/1/13
    api.post('/assign', function (req, res, next) {
        if (req.decoded.role !== config_common.user_roles.TRADE_ADMIN) {
            return next('not_allow');
        }
        if (!req.body.user_id || !req.body.company_id) {
            return next('invalid_format');
        }
        async.waterfall([
            function (cb) {
                if (req.body.type == 'PURCHASE') {
                    //给公司销售分配
                    CompanyRelation.findOne({
                        self_id: req.body.company_id,
                        other_id: req.decoded.company_id,
                        other_type: config_common.company_category.TRADE,
                        type: config_common.relation_type.ACCEPT
                    }, function (err, relation) {
                        if (err) {
                            return cb(err);
                        }
                        if (!relation) {
                            return cb('not_found');
                        }
                        relation.other_user_id = req.body.user_id;
                        relation.save(cb);
                    });
                } else {
                    //给公司采购分配
                    CompanyRelation.findOne({
                        self_id: req.decoded.company_id,
                        other_id: req.body.company_id,
                        other_type: config_common.company_category.TRADE,
                        type: config_common.relation_type.ACCEPT
                    }, function (err, relation) {
                        if (err) {
                            return cb(err);
                        }
                        if (!relation) {
                            return cb('not_found');
                        }
                        relation.self_user_id = req.body.user_id;
                        relation.save(cb);
                    });
                }
            }
        ], function (err, count) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, count, next);
        });
    });

    //获取自己与目标公司的认证状态
    api.post('/get_status_by_company_id', function (req, res, next) {
        if (req.decoded.role !== config_common.user_roles.TRADE_ADMIN &&
            req.decoded.role !== config_common.user_roles.TRAFFIC_ADMIN) {
            return next('not_allow');
        }
        //req.body.type目标公司是类型
        if (!req.body.type || !req.body.company_id) {
            return next('invalid_format');
        }
        var cond = {};
        switch (req.body.type) {
            case config_common.company_type.SALE:
                cond.self_id = req.decoded.company_id;
                cond.other_id = req.body.company_id;
                break;
            case config_common.company_type.PURCHASE:
                cond.self_id = req.body.company_id;
                cond.other_id = req.decoded.company_id;
                break;
            case config_common.company_type.TRAFFIC:
                cond.self_id = req.decoded.company_id;
                cond.other_id = req.body.company_id;
                break;
        }
        CompanyRelation.findOne(cond, function (err, companyRelation) {
            if (err) {
                return next(err);
            }
            var str = '';
            switch (req.decoded.role) {
                case config_common.user_roles.TRADE_ADMIN:
                    if (!companyRelation) {
                        if (req.body.type == config_common.company_type.TRAFFIC) {
                            str = '主动认证';
                        } else {
                            str = '申请认证';
                        }
                    } else {
                        if (companyRelation.type == config_common.relation_type.ACCEPT) {
                            str = '解除认证';
                        } else {
                            str = '再次申请';
                        }
                    }
                    break;
                case config_common.user_roles.TRAFFIC_ADMIN:
                    if (!companyRelation) {
                        if (req.body.type == config_common.company_type.SALE ||
                            req.body.type == config_common.company_type.PURCHASE) {
                            str = '申请认证';
                        }
                    } else {
                        if (companyRelation.type == config_common.relation_type.WAIT) {
                            str = '再次申请';
                        }
                    }
                    break;
            }
            config_common.sendData(req, str, next);
        });
    });

    //通过类型获取关系
    api.post('/get_by_type', function (req, res, next) {
        if (req.decoded.role !== config_common.user_roles.TRADE_ADMIN &&
            req.decoded.role !== config_common.user_roles.TRAFFIC_ADMIN &&
            req.decoded.role !== config_common.user_roles.TRADE_PURCHASE &&
            req.decoded.role !== config_common.user_roles.TRADE_SALE) {
            return next('not_allow');
        }
        var cond = {};
        if (req.decoded.role !== config_common.user_roles.TRAFFIC_ADMIN) {
            cond.self_id = req.decoded.company_id;
        } else {
            cond.other_id = req.decoded.company_id;
        }
        // if (req.body.status) {
        //     cond.type = req.body.status;
        // }
        if (req.body.type) {
            cond.other_type = req.body.type;
        }
        CompanyRelation.find(cond, function (err, companyRelation) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, companyRelation, next);
        });
    });

    //通过类型获取关系-2.0.0-2017/1/23
    api.post('/get_arr_by_type', function (req, res, next) {
        if (req.decoded.role !== config_common.user_roles.TRADE_ADMIN &&
            req.decoded.role !== config_common.user_roles.TRAFFIC_ADMIN &&
            req.decoded.role !== config_common.user_roles.TRADE_PURCHASE &&
            req.decoded.role !== config_common.user_roles.TRADE_SALE) {
            return next('not_allow');
        }
        var cond = {};
        var key;
        var user_id;
        if (req.decoded.role == config_common.user_roles.TRAFFIC_ADMIN) {
            cond.other_id = req.decoded.company_id;
            cond.other_type = config_common.company_category.TRAFFIC;
            key = 'self_id';
            user_id = 'self_user_id';
        } else if (req.body.type == 'PURCHASE') {
            cond.other_id = req.decoded.company_id;
            cond.other_type = config_common.company_category.TRADE;
            if (req.decoded.role !== config_common.user_roles.TRADE_ADMIN) {
                cond.other_user_id = req.decoded.id;
            }
            key = 'self_id';
            user_id = 'self_user_id';
        } else {
            cond.self_id = req.decoded.company_id;
            cond.other_type = config_common.company_category.TRADE;
            if (req.decoded.role !== config_common.user_roles.TRADE_ADMIN) {
                cond.self_user_id = req.decoded.id;
            }
            key = 'other_id';
            user_id = 'other_user_id';
        }
        cond.type = config_common.relation_type.ACCEPT;
        CompanyRelation.find(cond, function (err, companyRelation) {
            if (err) {
                return next(err);
            }
            var arr = [];
            var company_ids = util.transObjArrToSigArr(companyRelation, key);
            var user_ids = util.transObjArrToSigArr(companyRelation, user_id);
            for (var i = 0; i < company_ids.length; i++) {
                arr.push({company_id: company_ids[i], user_id: user_ids[i]});
            }
            config_common.sendData(req, arr, next);
        });
    });

    //通过类型获取关系-2.0.0-2017/1/14
    api.post('/get_company_ids_by_type', function (req, res, next) {
        if (req.decoded.role !== config_common.user_roles.TRADE_ADMIN &&
            req.decoded.role !== config_common.user_roles.TRAFFIC_ADMIN &&
            req.decoded.role !== config_common.user_roles.TRADE_PURCHASE &&
            req.decoded.role !== config_common.user_roles.TRADE_SALE) {
            return next('not_allow');
        }
        var cond = {};
        var key;
        if (req.decoded.role == config_common.user_roles.TRAFFIC_ADMIN) {
            cond.other_id = req.decoded.company_id;
            cond.other_type = config_common.company_category.TRAFFIC;
            key = 'self_id';
        } else if (req.body.type == 'PURCHASE') {
            cond.other_id = req.decoded.company_id;
            cond.other_type = config_common.company_category.TRADE;
            if (req.decoded.role !== config_common.user_roles.TRADE_ADMIN) {
                cond.other_user_id = req.decoded.id;
            }
            key = 'self_id';
        } else {
            cond.self_id = req.decoded.company_id;
            cond.other_type = config_common.company_category.TRADE;
            if (req.decoded.role !== config_common.user_roles.TRADE_ADMIN) {
                cond.self_user_id = req.decoded.id;
            }
            key = 'other_id';
        }
        cond.type = config_common.relation_type.ACCEPT;
        CompanyRelation.find(cond, function (err, companyRelation) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, util.transObjArrToSigArr(companyRelation, key), next);
        });
    });

    api.post('/get_by_company_id', function (req, res, next) {
        if (!req.body.self_id || !req.body.other_id) {
            return next('invalid_format');
        }
        CompanyRelation.findOne({
            self_id: req.body.self_id,
            other_id: req.body.other_id
        }, function (err, relation) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, relation, next);
        });
    });

    //获取本公司各个关系数量
    api.post('/get_relation_count', function (req, res, next) {
        if (req.decoded.role !== config_common.user_roles.TRADE_ADMIN &&
            req.decoded.role !== config_common.user_roles.TRAFFIC_ADMIN &&
            req.decoded.role !== config_common.user_roles.TRADE_PURCHASE &&
            req.decoded.role !== config_common.user_roles.TRADE_SALE) {
            return next('not_allow');
        }
        var data = {};
        async.waterfall([
            function (cb) {
                CompanyRelation.count({
                    self_id: req.decoded.company_id,
                    other_type: config_common.company_category.TRADE,
                    type: config_common.relation_type.ACCEPT
                }, cb);
            },
            function (count, cb) {
                data.sale = count || 0;
                CompanyRelation.count({
                    self_id: req.decoded.company_id,
                    other_type: config_common.company_category.TRAFFIC,
                    type: config_common.relation_type.ACCEPT
                }, cb);
            },
            function (count, cb) {
                data.traffic = count || 0;
                CompanyRelation.count({
                    other_id: req.decoded.company_id,
                    type: config_common.relation_type.ACCEPT
                }, cb);
            }
        ], function (err, count) {
            if (err) {
                return next(err);
            }
            data.purchase = count;
            config_common.sendData(req, data, next);
        });
    });

    //获取个人的认证公司个数-2.0.0-2017/1/13
    api.post('/get_user_relation_count', function (req, res, next) {
        if (req.decoded.role !== config_common.user_roles.TRADE_ADMIN &&
            req.decoded.role !== config_common.user_roles.TRADE_PURCHASE &&
            req.decoded.role !== config_common.user_roles.TRADE_SALE) {
            return next('not_allow');
        }
        if (!req.body.user_id) {
            return next('invalid_format');
        }
        async.waterfall([
            function (cb) {
                if (req.body.type == 'PURCHASE') {
                    //给公司销售
                    CompanyRelation.count({
                        other_user_id: req.body.user_id,
                        //other_id: req.body.company_id,
                        other_type: config_common.company_category.TRADE,
                        type: config_common.relation_type.ACCEPT
                    }, cb);
                } else {
                    //给公司采购
                    CompanyRelation.count({
                        self_user_id: req.body.user_id,
                        //self_id: req.body.company_id,
                        other_type: config_common.company_category.TRADE,
                        type: config_common.relation_type.ACCEPT
                    }, cb);
                }
            }
        ], function (err, count) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, count, next);
        });
    });

    //获取个人的认证公司-2.0.0-2017/1/13
    api.post('/get_user_relation', function (req, res, next) {
        if (req.decoded.role !== config_common.user_roles.TRADE_ADMIN &&
            req.decoded.role !== config_common.user_roles.TRADE_PURCHASE &&
            req.decoded.role !== config_common.user_roles.TRADE_SALE) {
            return next('not_allow');
        }
        if (!req.body.user_id) {
            return next('invalid_format');
        }
        async.waterfall([
            function (cb) {
                if (req.body.type == 'PURCHASE') {
                    //销售客户管理
                    CompanyRelation.find({
                        other_user_id: req.body.user_id,
                        //other_id: req.body.company_id,
                        other_type: config_common.company_category.TRADE,
                        type: config_common.relation_type.ACCEPT
                    }, cb);
                } else {
                    //采购客户管理
                    CompanyRelation.find({
                        self_user_id: req.body.user_id,
                        //self_id: req.body.company_id,
                        other_type: config_common.company_category.TRADE,
                        type: config_common.relation_type.ACCEPT
                    }, cb);
                }
            }
        ], function (err, count) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, count, next);
        });
    });

    //获取个人的认证公司-3.0.0-2017/3/30
    api.post('/get_user_company', function (req, res, next) {
        if (req.decoded.role !== config_common.user_roles.TRADE_ADMIN &&
            req.decoded.role !== config_common.user_roles.TRADE_PURCHASE &&
            req.decoded.role !== config_common.user_roles.TRADE_SALE) {
            return next('not_allow');
        }
        if (!req.body.user_id) {
            return next('invalid_format');
        }
        var company_id;
        async.waterfall([
            function (cb) {
                if (req.body.type == 'PURCHASE') {
                    //销售客户管理
                    company_id = 'self_id';
                    companyRelation.getList({
                        find: {
                            other_user_id: req.body.user_id,
                            //other_id: req.body.company_id,
                            other_type: config_common.company_category.TRADE,
                            type: config_common.relation_type.ACCEPT
                        }
                    }, cb);
                } else {
                    //采购客户管理
                    company_id = 'other_id';
                    companyRelation.getList({
                        find: {
                            self_user_id: req.body.user_id,
                            //self_id: req.body.company_id,
                            other_type: config_common.company_category.TRADE,
                            type: config_common.relation_type.ACCEPT
                        }
                    }, cb);
                }
            },
            function (relations, cb) {
                var company_ids = util.transObjArrToSigArr(relations, company_id);
                companyService.getList({
                    find: {_id: {$in: company_ids}},
                    select: 'verify_phase nick_name full_name url_logo'
                }, cb);
            }
        ], function (err, count) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, count, next);
        });
    });

    api.post('/get_verify_count', function (req, res, next) {
        if (req.decoded.role !== config_common.user_roles.TRADE_ADMIN &&
            req.decoded.role !== config_common.user_roles.TRAFFIC_ADMIN &&
            req.decoded.role !== config_common.user_roles.TRADE_SALE &&
            req.decoded.role !== config_common.user_roles.TRADE_PURCHASE) {
            return next('not_allow');
        }
        CompanyRelation.count({
            self_id: req.decoded.company_id,
            type: config_common.relation_type.ACCEPT
        }, function (err, count) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, count, next);
        });
    });

    //获取本公司已认证公司(主动推荐获取使用)
    api.post('/recommond_get_company_verify', function (req, res, next) {
        if (req.decoded.role !== config_common.user_roles.TRAFFIC_ADMIN &&
            req.decoded.role !== config_common.user_roles.TRADE_SALE &&
            req.decoded.role !== config_common.user_roles.TRADE_PURCHASE &&
            req.decoded.role !== config_common.user_roles.TRADE_ADMIN &&
            req.decoded.role !== config_common.user_roles.TRADE_STORAGE) {
            return next('not_allow');
        }
        if (!config_common.checkCompanyDetailType(req.body.subType)) {
            return next('invalid_format');
        }
        req.body.page = req.body.page || 1;
        var count = 0;
        var company_ids;
        var Company;
        async.waterfall([
            function (cb) {
                var cond = {type: config_common.relation_type.ACCEPT};
                switch (req.body.subType) {
                    case config_common.company_type.TRAFFIC:
                        cond.other_type = config_common.company_category.TRAFFIC;
                        cond.self_id = req.decoded.company_id;
                        break;
                    case config_common.company_type.SALE:
                        cond.other_type = config_common.company_category.TRADE;
                        cond.self_id = req.decoded.company_id;
                        break;
                    case config_common.company_type.PURCHASE:
                        cond.other_id = req.decoded.company_id;
                        break;
                }
                CompanyRelation.find(cond, cb);
            },
            function (verifies, cb) {
                switch (req.body.subType) {
                    case config_common.company_type.TRAFFIC:
                    case config_common.company_type.SALE:
                        company_ids = util.transObjArrToSigArr(verifies, 'other_id');
                        break;
                    case config_common.company_type.PURCHASE:
                        company_ids = util.transObjArrToSigArr(verifies, 'self_id');
                        break;
                    default :
                        company_ids = util.transObjArrToSigArr(verifies, 'other_id');
                        break;
                }
                var cond = {_id: {$in: company_ids}};
                if (req.body.subType == config_common.company_category.TRAFFIC) {
                    Company = TrafficCompany;
                } else {
                    Company = TradeCompany;
                }
                Company
                    .find(cond)
                    .skip((req.body.page - 1) * config_common.company_per_page)
                    .limit(config_common.company_per_page)
                    .select('_id full_name nick_name verify_phase url_logo type')
                    .exec(function (err, companies) {
                        if (err) {
                            return cb(err);
                        }
                        cb(null, cond, companies);
                    });
            },
            function (cond, companies, cb) {
                Company.count(cond, function (err, countres) {
                    if (err) {
                        return cb(err);
                    }
                    count = countres;
                    cb(null, companies);
                });
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, {
                count: count,
                total_page: Math.floor(count / config_common.company_per_page) + 1,
                current_page: req.body.page,
                company: result
            }, next);
        });
    });

    //个人主页需要的四个数字
    api.post('/recommond_get_company_verify_count', function (req, res, next) {
        if (!req.body.company_id) {
            return next('invalid_format');
        }
        async.parallel({
            TRAFFIC: function (cb) {
                global.lib_company_relation.getList({
                    find: {
                        self_id: req.body.company_id,
                        other_type: global.config_common.company_category.TRAFFIC
                    }
                }, cb)
            },
            SALE: function (cb) {
                global.lib_company_relation.getList({
                    find: {
                        self_id: req.body.company_id,
                        other_type: global.config_common.company_category.TRADE
                    }
                }, cb)
            },
            PURCHASE: function (cb) {
                global.lib_company_relation.getList({
                    find: {
                        other_id: req.body.company_id,
                        //other_type: global.config_common.company_category.TRADE
                    }
                }, cb)
            },
            colleague: function (cb) {
                if (req.decoded.role == global.config_common.user_roles.TRAFFIC_ADMIN) {
                    global.lib_user.getList({
                        find: {company_id: req.body.company_id, role: 'TRAFFIC_ADMIN'}
                    }, cb);
                } else {
                    global.lib_user.getList({
                        find: {company_id: req.body.company_id}
                    }, cb);
                }
            }
        }, function (err, result) {
            if (err) return next(err);
            result.PURCHASE = _.uniq(result.PURCHASE).length;
            result.TRAFFIC = _.uniq(result.TRAFFIC).length;
            result.SALE = _.uniq(result.SALE).length;
            result.colleague = _.uniq(result.colleague).length;
            config_common.sendData(req, result, next);
        });
    });

    //获取本公司已认证公司
    api.post('/get_company_verify', function (req, res, next) {
        if (req.decoded.role !== global.config_common.user_roles.TRAFFIC_ADMIN &&
            req.decoded.role !== global.config_common.user_roles.TRAFFIC_EMPLOYEE &&
            req.decoded.role !== global.config_common.user_roles.TRAFFIC_CAPTAIN &&
            req.decoded.role !== global.config_common.user_roles.TRADE_SALE &&
            req.decoded.role !== global.config_common.user_roles.TRADE_STORAGE &&
            req.decoded.role !== global.config_common.user_roles.TRADE_PURCHASE &&
            req.decoded.role !== global.config_common.user_roles.TRADE_ADMIN) {
            return next('not_allow');
        }
        if (!global.config_common.checkCompanyDetailType(req.body.subType)) {
            return next('invalid_format');
        }
        async.waterfall([
            function (cb) {
                if (req.decoded.role === global.config_common.user_roles.TRAFFIC_ADMIN ||
                    req.decoded.role === global.config_common.user_roles.TRAFFIC_EMPLOYEE ||
                    req.decoded.role === global.config_common.user_roles.TRAFFIC_CAPTAIN) {
                    global.lib_company_relation.getList({
                        find: {other_id: req.decoded.company_id},
                        select: 'self_id',
                        sort: {time_creation: -1}
                    }, cb);
                } else if (req.decoded.role === global.config_common.user_roles.TRADE_STORAGE &&
                    req.body.subType === global.config_common.company_type.TRADE) {  //仓库角色获取自己所属交易公司的认证交易公司列表
                    global.lib_company_relation.getList({
                        find: {
                            $or: [{other_id: req.decoded.company_id}, {
                                self_id: req.decoded.company_id,
                                other_type: global.config_common.company_type.SALE
                            }]
                        },
                        select: 'self_id other_id',
                        sort: {time_creation: -1}
                    }, cb);
                } else if (req.decoded.role === global.config_common.user_roles.TRADE_STORAGE &&
                    req.body.subType === global.config_common.company_type.PURCHASE) {   //仓库公司获取认证交易公司列表
                    global.lib_company_relation.getList({
                        find: {other_id: req.decoded.company_id},
                        select: 'self_id',
                        sort: {time_creation: -1}
                    }, cb);
                } else if (req.decoded.role === global.config_common.user_roles.TRADE_STORAGE &&
                    req.body.subType === global.config_common.company_type.TRAFFIC) {
                    global.lib_company_relation.getList({
                        find: {self_id: req.decoded.company_id, other_type: global.config_common.company_type.TRAFFIC},
                        select: 'other_id',
                        sort: {time_creation: -1}
                    }, cb);
                } else {
                    global.lib_work_relation.getList({
                        find: {user_id: req.decoded.id, type: req.body.subType},
                        select: 'other_company_id',
                        sort: {time_creation: -1}
                    }, cb);
                }
            },
            function (relations, cb) {
                var company_ids = [];
                if (req.decoded.role === global.config_common.user_roles.TRAFFIC_ADMIN||
                    req.decoded.role === global.config_common.user_roles.TRAFFIC_EMPLOYEE ||
                    req.decoded.role === global.config_common.user_roles.TRAFFIC_CAPTAIN) {
                    company_ids = global.lib_util.transObjArrToSigArr(relations, 'self_id');
                } else if (req.decoded.role === global.config_common.user_roles.TRADE_STORAGE &&
                    req.body.subType === global.config_common.company_type.TRADE) {
                    for (var i = 0; i < relations.length; i++) {
                        if (relations[i].self_id === req.decoded.company_id) {
                            company_ids.push(relations[i].other_id);
                        } else {
                            company_ids.push(relations[i].self_id);
                        }
                    }
                } else if (req.decoded.role === global.config_common.user_roles.TRADE_STORAGE &&
                    req.body.subType === global.config_common.company_type.PURCHASE) {
                    company_ids = global.lib_util.transObjArrToSigArr(relations, 'self_id');
                } else if (req.decoded.role === global.config_common.user_roles.TRADE_STORAGE &&
                    req.body.subType === global.config_common.company_type.TRAFFIC) {
                    company_ids = global.lib_util.transObjArrToSigArr(relations, 'other_id');
                } else {
                    company_ids = global.lib_util.transObjArrToSigArr(relations, 'other_company_id');
                }
                global.lib_company.getList({
                    find: {_id: {$in: company_ids}},
                    select: '_id nick_name url_logo'
                }, cb);
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            global.config_common.sendData(req, {
                exist: false,
                company: result,
                type: req.body.subType,
                count: result.length,
                boolean: result.length > 0
            }, next);
        });
    });

    /**
     * 获取物流公司认证的司机
     */
    api.post('/get_driver_verify', function (req, res, next) {
        if (!_.isNumber(req.body.page)) {
            req.body.page = 1;
        }
        var result = {};
        async.waterfall([
            function (cb) {
                global.lib_driver_verify.getList({find: {company_id: req.decoded.company_id}}, cb);
            },
            function (data, cb) {
                result.count = data.length;
                result.exist = data.length > req.body.page * global.config_common.entry_per_page;
                //查询到这个物流公司有关系的司机
                global.lib_driver_verify.getList({
                    find: {company_id: req.decoded.company_id},
                    skip: (req.body.page - 1) * global.config_common.entry_per_page,
                    limit: global.config_common.entry_per_page
                }, cb);
            },
            function (data, cb) {
                global.lib_user.getList({
                    find: {_id: _.pluck(data, 'user_id')},
                    select: 'real_name role photo_url'
                }, cb);
            }
        ], function (err, result2) {
            if (err) {
                return next(err);
            }
            result.list = result2;
            global.config_common.sendData(req, result, next);
        })
    });

    //获取本公司已认证公司-reload-3.0.0-2017/6/23
    api.post('/get_company_verify_new', function (req, res, next) {
        if (req.decoded.role !== global.config_common.user_roles.TRAFFIC_ADMIN &&
            req.decoded.role !== global.config_common.user_roles.TRADE_ADMIN &&
            req.decoded.role !== global.config_common.user_roles.TRADE_STORAGE) {
            return next('not_allow');
        }
        if (!global.config_common.checkCompanyDetailType(req.body.subType)) {
            return next('invalid_format');
        }
        var result = {no: [], yes: []};
        var types;
        var key_company_id;
        async.waterfall([
            function (cb) {
                if (req.decoded.company_id) {
                    cb();
                } else {
                    global.lib_user.getOne({
                        find: {_id: req.decoded.id},
                        select: 'company_id'
                    }, function (err, user) {
                        if (err) {
                            return cb(err);
                        }
                        req.decoded.company_id = _.isArray(user.company_id) ? user.company_id[0] : user.company_id;
                        cb();
                    });
                }
            },
            function (cb) {
                var cond = {};
                switch (req.body.subType) {
                    case global.config_common.company_type.TRAFFIC:
                        cond.other_type = global.config_common.company_category.TRAFFIC;
                        cond.self_id = req.decoded.company_id;
                        key_company_id = 'other_id';
                        types = [
                            // global.config_common.count_type.TRAFFIC_LINE,
                            global.config_common.count_type.TRAFFIC_ORDER
                        ];
                        break;
                    case global.config_common.company_type.SALE:
                        cond.other_type = global.config_common.company_category.TRADE;
                        cond.self_id = req.decoded.company_id;
                        key_company_id = 'other_id';
                        types = [
                            // global.config_common.count_type.TRADE_OFFER,
                            global.config_common.count_type.SALE
                        ];
                        break;
                    case global.config_common.company_type.PURCHASE:
                        cond.other_id = req.decoded.company_id;
                        key_company_id = 'self_id';
                        types = [
                            // global.config_common.count_type.TRADE_DEMAND,
                            global.config_common.count_type.PURCHASE
                            // global.config_common.count_type.TRAFFIC_DEMAND
                        ];
                        break;
                    // case global.config_common.company_type.TRADE://用户仓库看合同库的认证公司
                    //     cond['$or'] = [];
                    //     cond['$or'].push({other_id: req.decoded.company_id});
                    //     cond['$or'].push({self_id: req.decoded.company_id, other_type: global.config_common.company_category.TRADE});
                    //     // key_company_id = 'self_id';
                    //     types = [
                    //         global.config_common.count_type.SALE,
                    //         global.config_common.count_type.PURCHASE
                    //     ];
                    //     break;
                }
                global.lib_company_relation.getList({find: cond}, cb);
            },
            function (relations, cb) {
                async.eachSeries(relations, function (relation, callback) {
                    var data = {};
                    async.waterfall([
                        function (cbk) {
                            // if(req.body.subType === global.config_common.company_type.TRADE){
                            //     if(req.decoded.company_id === relation.self_id){
                            //         key_company_id = 'other_id';
                            //         req.body.subType = global.config_common.company_type.SALE;
                            //     }else{
                            //         key_company_id = 'self_id';
                            //         req.body.subType = global.config_common.company_type.PURCHASE;
                            //     }
                            // }
                            global.lib_work_relation.getList({
                                find: {
                                    company_id: req.decoded.company_id,
                                    user_id: {$exists: true},
                                    other_company_id: relation[key_company_id],
                                    type: req.body.subType
                                }
                            }, cbk);
                        },
                        function (works, cbk) {
                            if (works) {
                                var user_ids = global.lib_util.transObjArrToSigArr(works, 'user_id');
                                result.yes.push(data);
                                global.lib_user.getList({
                                    find: {_id: {$in: user_ids}},
                                    select: 'photo_url'
                                }, cbk);
                            } else {
                                result.no.push(data);
                                cbk(null, []);
                            }
                        },
                        function (users, cbk) {
                            data.user = users;
                            global.lib_company.getOne({
                                find: {_id: relation[key_company_id]},
                                select: 'nick_name url_logo verify_phase'
                            }, cbk);
                        },
                        function (company, cbk) {
                            data.company = company;
                            global.lib_count.get({
                                body: {
                                    company_ids: [relation[key_company_id]],
                                    types: types
                                }
                            }, cbk);
                        },
                        function (count, cbk) {
                            data.count = count[relation[key_company_id]];
                            cbk();
                        }
                    ], callback);
                }, cb);
            }
        ], function (err) {
            if (err) {
                return next(err);
            }
            global.config_common.sendData(req, result, next);
        });
    });

    //获取所有的认证公司--wly
    api.post('/get_company_verify_all', function (req, res, next) {
        //判断公司类型
        if (!req.body.type) {
            return next('invalid_format');
        }
        //下面的操作为，得到公司数据，然后输出
        var key_company_id;
        async.waterfall([
            //判断传入公司的类型,获得到查询的条件，得到self_id，这样确定用数据库的哪个字段进行判断
            function (cb) {
                var cond = {};
                switch (req.body.type) {
                    //物流公司
                    case global.config_common.company_type.TRAFFIC:
                        cond.other_type = global.config_common.company_category.TRAFFIC;
                        cond.self_id = req.decoded.company_id;
                        key_company_id = 'other_id';
                        break;
                    //销售公司
                    case global.config_common.company_type.SALE:
                        cond.other_type = global.config_common.company_category.TRADE;
                        cond.self_id = req.decoded.company_id;
                        key_company_id = 'other_id';
                        break;
                    //获取卖家公司
                    case global.config_common.company_type.PURCHASE:
                        cond.other_id = req.decoded.company_id;
                        key_company_id = 'self_id';
                        break;
                }
                global.lib_company_relation.getList({find: cond}, cb);
            },
            //将查询到的list中的id转换成数组
            function (ids, cb) {
                //将查询到的id转换成数组
                var company_ids = global.lib_util.transObjArrToSigArr(ids, key_company_id);
                global.lib_company.getList({
                    find: {_id: {$in: company_ids}},
                    select: 'nick_name'
                }, cb);
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            global.config_common.sendData(req, result, next);
        });

    });

    //获取已向本公司申请认证的公司(审核中)
    api.post('/get_company_apply', function (req, res, next) {
        if (req.decoded.role !== config_common.user_roles.TRAFFIC_ADMIN &&
            req.decoded.role !== config_common.user_roles.TRADE_SALE &&
            req.decoded.role !== config_common.user_roles.TRADE_PURCHASE &&
            req.decoded.role !== config_common.user_roles.TRADE_ADMIN) {
            return next('not_allow');
        }
        req.body.page = req.body.page || 1;
        if (!config_common.checkCompanyDetailType(req.body.subType)) {
            return next('invalid_format');
        }
        var count = 0;
        var company_ids, apply_companyObj;
        var Company;
        async.waterfall([
            function (cb) {
                var cond = {type: config_common.relation_type.WAIT};
                // var cond = {type: {$nin: [config_common.relation_type.ACCEPT]}};
                switch (req.body.subType) {
                    case config_common.company_type.TRAFFIC:
                        cond.other_type = config_common.company_category.TRAFFIC;
                        cond.self_id = req.decoded.company_id;
                        break;
                    case config_common.company_type.SALE:
                        cond.other_type = config_common.company_category.TRADE;
                        cond.self_id = req.decoded.company_id;
                        // cond.other_user_id = {$exists: true};
                        break;
                    case config_common.company_type.PURCHASE:
                        //cond.other_type = config_common.company_category.TRADE;
                        // cond.self_user_id = {$exists: true};
                        cond.other_id = req.decoded.company_id;
                        break;
                }
                CompanyRelation.find(cond, cb);
            },
            function (applies, cb) {
                switch (req.body.subType) {
                    case config_common.company_type.TRAFFIC:
                    case config_common.company_type.SALE:
                        company_ids = util.transObjArrToSigArr(applies, 'other_id');
                        apply_companyObj = util.transObjArrToObj(applies, 'other_id');
                        break;
                    case config_common.company_type.PURCHASE:
                        company_ids = util.transObjArrToSigArr(applies, 'self_id');
                        apply_companyObj = util.transObjArrToObj(applies, 'self_id');
                        break;
                    default :
                        company_ids = util.transObjArrToSigArr(applies, 'other_id');
                        apply_companyObj = util.transObjArrToObj(applies, 'other_id');
                        break;
                }
                //count = company_ids.length;
                var cond = {_id: {$in: company_ids}};
                if (req.body.name) {
                    cond['$or'] = [
                        {full_name: new RegExp(req.body.name)},
                        {nick_name: new RegExp(req.body.name)}
                    ];
                }
                if (req.body.type == config_common.company_category.TRADE) {
                    Company = TradeCompany;
                } else {
                    Company = TrafficCompany;
                }
                Company
                    .find(cond)
                    .skip((req.body.page - 1) * config_common.company_per_page)
                    .limit(config_common.company_per_page)
                    .select('_id full_name nick_name verify_phase url_logo type')
                    .exec(function (err, companies) {
                        if (err) {
                            return cb(err);
                        }
                        cb(null, cond, companies);
                    });
            },
            function (cond, companies, cb) {
                Company.count(cond, function (err, countres) {
                    if (err) {
                        return cb(err);
                    }
                    count = countres;
                    cb(null, companies);
                });
            },
            function (companies, cb) {
                var companyObj = util.transObjArrToObj(companies, '_id');
                CompanyRelation.find({
                    self_id: {$in: company_ids},
                    other_id: req.decoded.company_id
                }, function (err, relations) {
                    if (err) {
                        return cb(err);
                    }
                    for (var i = 0; i < relations.length; i++) {
                        var company_id = relations[i].self_id;
                        if (companyObj[company_id]) {
                            companyObj[company_id].apply = true;
                        }
                    }
                    for (var key in companyObj) {
                        if (apply_companyObj[key]) {
                            companyObj[key].time_apply = apply_companyObj[key].time_creation;
                            companyObj[key].apply_type = apply_companyObj[key].type;
                            companyObj[key].self_user_id = apply_companyObj[key].self_user_id;
                            companyObj[key].other_user_id = apply_companyObj[key].other_user_id;
                        }
                    }
                    cb(null, _.values(companyObj));
                });
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, {
                exist: count > req.body.page * config_common.company_per_page,
                company: result,
                count: count
            }, next);
        });
    });

    //获取已
    // api.post('/get_company_apply_new', function (req, res, next) {
    //     if (req.decoded.role !== config_common.user_roles.TRAFFIC_ADMIN &&
    //         req.decoded.role !== config_common.user_roles.TRADE_SALE &&
    //         req.decoded.role !== config_common.user_roles.TRADE_PURCHASE &&
    //         req.decoded.role !== config_common.user_roles.TRADE_ADMIN) {
    //         return next('not_allow');
    //     }
    //     req.body.page = req.body.page || 1;
    //     if (!config_common.checkCompanyDetailType(req.body.subType)) {
    //         return next('invalid_format');
    //     }
    //     var count = 0;
    //     var company_ids, apply_companyObj;
    //     var Company;
    //     async.waterfall([
    //         function (cb) {
    //             // var cond = {type:config_common.relation_type.WAIT};
    //             var cond = {type: {$nin: [config_common.relation_type.ACCEPT]}};
    //             switch (req.body.subType) {
    //                 case config_common.company_type.TRAFFIC:
    //                     cond.other_type = config_common.company_category.TRAFFIC;
    //                     cond.self_id = req.decoded.company_id;
    //                     break;
    //                 case config_common.company_type.SALE:
    //                     cond.other_type = config_common.company_category.TRADE;
    //                     cond.self_id = req.decoded.company_id;
    //                     // cond.other_user_id = {$exists: true};
    //                     break;
    //                 case config_common.company_type.PURCHASE:
    //                     //cond.other_type = config_common.company_category.TRADE;
    //                     // cond.self_user_id = {$exists: true};
    //                     cond.other_id = req.decoded.company_id;
    //                     break;
    //             }
    //             CompanyRelation.find(cond, cb);
    //         },
    //         function (applies, cb) {
    //             switch (req.body.subType) {
    //                 case config_common.company_type.TRAFFIC:
    //                 case config_common.company_type.SALE:
    //                     company_ids = util.transObjArrToSigArr(applies, 'other_id');
    //                     apply_companyObj = util.transObjArrToObj(applies, 'other_id');
    //                     break;
    //                 case config_common.company_type.PURCHASE:
    //                     company_ids = util.transObjArrToSigArr(applies, 'self_id');
    //                     apply_companyObj = util.transObjArrToObj(applies, 'self_id');
    //                     break;
    //                 default :
    //                     company_ids = util.transObjArrToSigArr(applies, 'other_id');
    //                     apply_companyObj = util.transObjArrToObj(applies, 'other_id');
    //                     break;
    //             }
    //             //count = company_ids.length;
    //             var cond = {_id: {$in: company_ids}};
    //             if (req.body.name) {
    //                 cond['$or'] = [
    //                     {full_name: new RegExp(req.body.name)},
    //                     {nick_name: new RegExp(req.body.name)}
    //                 ];
    //             }
    //             if (req.body.type == config_common.company_category.TRADE) {
    //                 Company = TradeCompany;
    //             } else {
    //                 Company = TrafficCompany;
    //             }
    //             Company
    //                 .find(cond)
    //                 .skip((req.body.page - 1) * config_common.company_per_page)
    //                 .limit(config_common.company_per_page)
    //                 .select('_id full_name nick_name verify_phase url_logo type')
    //                 .exec(function (err, companies) {
    //                     if (err) {
    //                         return cb(err);
    //                     }
    //                     cb(null, cond, companies);
    //                 });
    //         },
    //         function (cond, companies, cb) {
    //             Company.count(cond, function (err, countres) {
    //                 if (err) {
    //                     return cb(err);
    //                 }
    //                 count = countres;
    //                 cb(null, companies);
    //             });
    //         },
    //         function (companies, cb) {
    //             var companyObj = util.transObjArrToObj(companies, '_id');
    //             CompanyRelation.find({
    //                 self_id: {$in: company_ids},
    //                 other_id: req.decoded.company_id
    //             }, function (err, relations) {
    //                 if (err) {
    //                     return cb(err);
    //                 }
    //                 for (var i = 0; i < relations.length; i++) {
    //                     var company_id = relations[i].self_id;
    //                     if (companyObj[company_id]) {
    //                         companyObj[company_id].apply = true;
    //                     }
    //                 }
    //                 for (var key in companyObj) {
    //                     if (apply_companyObj[key]) {
    //                         companyObj[key].time_apply = apply_companyObj[key].time_creation;
    //                         companyObj[key].apply_type = apply_companyObj[key].type;
    //                         companyObj[key].self_user_id = apply_companyObj[key].self_user_id;
    //                         companyObj[key].other_user_id = apply_companyObj[key].other_user_id;
    //                     }
    //                 }
    //                 cb(null, _.values(companyObj));
    //             });
    //         },
    //         function (companyObj, cb) {
    //             userInvitationPhoneService.invCompList({
    //                 find: {
    //                     company_id: req.decoded.company_id,
    //                     user_id: {$nin: [req.decoded.id]},
    //                     // user_id: req.decoded.id,
    //                     other_type: req.body.subType
    //                 },
    //                 select: 'phone name user_id accept company_id',
    //                 skip: (req.body.page - 1) * config_common.company_per_page,
    //                 limit: config_common.company_per_page,
    //                 page: req.body.page
    //             }, function (err, invCompTmp) {
    //                 if (err) {
    //                     return cb(err);
    //                 }
    //                 companyObj = companyObj.concat(invCompTmp.invitation);
    //                 count = count + invCompTmp.count;
    //                 cb(null, companyObj);
    //             })
    //         }
    //     ], function (err, result) {
    //         if (err) {
    //             return next(err);
    //         }
    //         config_common.sendData(req, {
    //             exist: count > req.body.page * config_common.company_per_page,
    //             company: result,
    //             count: count
    //         }, next);
    //     });
    // });

    //获取向某公司申请认证的公司个数
    api.post('/get_company_apply_count', function (req, res, next) {
        if (req.decoded.role !== config_common.user_roles.TRADE_PURCHASE &&
            req.decoded.role !== config_common.user_roles.TRADE_SALE &&
            req.decoded.role !== config_common.user_roles.TRADE_ADMIN) {
            return next('not_allow');
        }
        if (!req.body.company_id) {
            return next('invalid_format');
        }
        async.waterfall([
            function (cb) {
                var cond = {
                    self_id: req.body.company_id,
                    type: config_common.relation_type.WAIT
                };
                if (req.body.type) {
                    cond.other_type = req.body.type;
                }
                CompanyRelation.count(cond, function (err, count) {
                    if (err) {
                        return cb(err);
                    }
                    cb(null, count);
                });
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, result, next);
        });
    });

    //获取向某人申请认证的公司个数-3.0.0-2017/5/11
    api.post('/get_user_apply_count', function (req, res, next) {
        if (req.decoded.role !== global.config_common.user_roles.TRAFFIC_ADMIN &&
            req.decoded.role !== global.config_common.user_roles.TRADE_PURCHASE &&
            req.decoded.role !== global.config_common.user_roles.TRADE_SALE &&
            req.decoded.role !== global.config_common.user_roles.TRADE_ADMIN) {
            return next('not_allow');
        }
        var result = {count: 0};
        var cond = {
            type: config_common.relation_type.WAIT,
            approve_user_id: req.decoded.id
        };
        var driverCond = {status: global.config_common.relation_type.WAIT};
        async.waterfall([
            function (cb) {
                global.lib_company_relation.getCount(cond, cb);
            },
            function (count, cb) {
                result.count = count;
                if (req.decoded.role == global.config_common.user_roles.TRAFFIC_ADMIN) {
                    global.lib_driver_verify.getCount(driverCond, cb);
                } else {
                    cb(null, 0);
                }
            },
            function (count, cb) {
                result.count += count;
                global.lib_company_relation.getList({
                    find: cond,
                    select: 'time_creation',
                    sort: {time_creation: -1},
                    limit: 1
                }, cb);
            },
            function (list, cb) {
                if (list[0]) {
                    result.time = list[0].time_creation;
                }
                if (req.decoded.role == global.config_common.user_roles.TRAFFIC_ADMIN) {
                    global.lib_driver_verify.getList({
                        find: driverCond,
                        select: 'time_creation',
                        sort: {time_creation: -1},
                        limit: 1
                    }, cb);
                } else {
                    cb(null, []);
                }
            },
            function (list, cb) {
                if (list[0] && (list[0].time_creation.getTime() > result.time.getTime())) {
                    result.time = list[0].time_creation;
                }
                cb();
            }
        ], function (err) {
            if (err) {
                return next(err);
            }
            global.config_common.sendData(req, result, next);
        });
    });

    //获取向某人申请认证的公司个数-3.0.0-2017/5/15
    api.post('/get_user_apply', function (req, res, next) {
        if (req.decoded.role !== global.config_common.user_roles.TRAFFIC_ADMIN &&
            req.decoded.role !== global.config_common.user_roles.TRADE_PURCHASE &&
            req.decoded.role !== global.config_common.user_roles.TRADE_SALE &&
            req.decoded.role !== global.config_common.user_roles.TRADE_ADMIN) {
            return next('not_allow');
        }
        var result = {companies: [], drivers: []};
        var company_ids = [];
        var user_ids = [];
        var relationDatas = [];
        var userDatas = [];
        var companyDatas = [];
        async.waterfall([
            function (cb) {
                var cond = {
                    type: config_common.relation_type.WAIT,
                    approve_user_id: req.decoded.id
                };
                global.lib_company_relation.getList({find: cond, sort: {time_creation: -1}}, cb);
            },
            function (relations, cb) {
                relationDatas = relations;
                for (var i = 0; i < relations.length; i++) {
                    var relation = relations[i];
                    if (relation.self_user_id == req.decoded.id) {
                        user_ids.push(relation.other_user_id);
                        company_ids.push(relation.other_id);
                    } else {
                        user_ids.push(relation.self_user_id);
                        company_ids.push(relation.self_id);
                    }
                }
                global.lib_user.getListAll({
                    find: {_id: {$in: user_ids}},
                    select: 'real_name photo_url'
                }, cb);
            },
            function (users, cb) {
                userDatas = users;
                global.lib_company.getListAll({
                    find: {_id: {$in: company_ids}},
                    select: 'full_name nick_name url_logo sell buy transport'
                }, cb);
            },
            function (companies, cb) {
                companyDatas = companies;
                global.lib_count.get({
                    body: {
                        company_ids: company_ids,
                        types: [
                            global.config_common.count_type.DJ,
                            global.config_common.count_type.JJ,
                            global.config_common.count_type.TRADE_DEMAND,
                            global.config_common.count_type.TRAFFIC_LINE
                        ]
                    }
                }, cb);
            },
            function (countObj, cb) {
                var userObj = global.lib_util.transObjArrToObj(userDatas, '_id');
                var companyObj = global.lib_util.transObjArrToObj(companyDatas, '_id');
                for (var i = 0; i < relationDatas.length; i++) {
                    var relation = relationDatas[i];
                    // if (relation.self_id == req.decoded.company_id) {
                    if (relation.other_user_id == req.decoded.id) {
                        result.companies.push({
                            user: userObj[relation.self_user_id],
                            company: companyObj[relation.self_id],
                            type: global.config_common.company_type.PURCHASE,
                            count: countObj[relation.self_id]
                        });
                    } else {
                        result.companies.push({
                            user: userObj[relation.other_user_id],
                            company: companyObj[relation.other_id],
                            type: global.config_common.company_type.SALE,
                            count: countObj[relation.other_id]
                        });
                    }
                }
                cb();
            },
            function (cb) {
                if (req.decoded.role == global.config_common.user_roles.TRAFFIC_ADMIN) {
                    var verifyDatas = [];
                    async.waterfall([
                        function (cbk) {
                            global.lib_driver_verify.getList({
                                find: {
                                    approve_id: req.decoded.id,
                                    status: global.config_common.relation_type.WAIT
                                }
                            }, cbk);
                        },
                        function (verifies, cbk) {
                            verifyDatas = verifies;
                            user_ids = global.lib_util.transObjArrToSigArr(verifies, 'user_id');
                            global.lib_user.getList({
                                find: {_id: {$in: user_ids}},
                                select: 'real_name photo_url'
                            }, cbk);
                        },
                        function (users, cbk) {
                            global.lib_truck.getList({
                                find: {create_user_id: {$in: user_ids}},
                                select: 'type long weight'
                            }, function (err, trucks) {
                                if (err) {
                                    return cbk(err);
                                }
                                var userObj = global.lib_util.transObjArrToObj(users, '_id');
                                var truckObj = global.lib_util.transObjArrToObj(trucks, 'create_user_id');
                                for (var i = 0; i < verifyDatas.length; i++) {
                                    var verify = verifyDatas[i];
                                    result.drivers.push({
                                        user: userObj[verify.user_id],
                                        truck: truckObj[verify.user_id]
                                    });
                                }
                                cbk();
                            });
                        }
                    ], cb);
                } else {
                    cb();
                }
            }
        ], function (err) {
            if (err) {
                return next(err);
            }
            global.config_common.sendData(req, result, next);
        });
    });

    //获取本公司未认证的公司
    api.post('/get_company_not_verify', function (req, res, next) {
        if (req.decoded.role !== config_common.user_roles.TRAFFIC_ADMIN &&
            req.decoded.role !== config_common.user_roles.TRADE_PURCHASE &&
            req.decoded.role !== config_common.user_roles.TRADE_SALE &&
            req.decoded.role !== config_common.user_roles.TRADE_ADMIN) {
            return next('not_allow');
        }
        req.body.page = req.body.page || 1;
        var count = 0;
        var company_ids = [];
        var Company;
        async.waterfall([
            function (cb) {
                var cond = {type: config_common.relation_type.ACCEPT};
                switch (req.body.subType) {
                    case config_common.company_type.TRAFFIC:
                        cond.other_type = config_common.company_category.TRAFFIC;
                        cond.self_id = req.decoded.company_id;
                        break;
                    case config_common.company_type.SALE:
                        cond.other_type = config_common.company_category.TRADE;
                        cond.self_id = req.decoded.company_id;
                        break;
                    case config_common.company_type.PURCHASE:
                        cond.other_id = req.decoded.company_id;
                        break;
                }
                CompanyRelation.find(cond, cb);
            },
            function (applies, cb) {
                switch (req.body.subType) {
                    case config_common.company_type.TRAFFIC:
                    case config_common.company_type.SALE:
                        company_ids = util.transObjArrToSigArr(applies, 'other_id');
                        break;
                    case config_common.company_type.PURCHASE:
                        company_ids = util.transObjArrToSigArr(applies, 'self_id');
                        break;
                    default :
                        company_ids = util.transObjArrToSigArr(applies, 'other_id');
                        break;
                }
                if (req.decoded.role == config_common.user_roles.TRAFFIC_ADMIN) {
                    company_ids.push(req.decoded.company_id[0]);
                } else {
                    company_ids.push(req.decoded.company_id);
                }
                if (req.body.type == config_common.company_category.TRADE) {
                    Company = TradeCompany;
                } else {
                    Company = TrafficCompany;
                }
                Company.find({
                    _id: {$nin: company_ids}
                }, cb);
            },
            function (companies, cb) {
                var all_company_ids = util.transObjArrToSigArr(companies, '_id');
                company_ids = _.difference(all_company_ids, company_ids);
                var cond = {_id: {$in: company_ids}};
                if (req.body.name) {
                    cond['$or'] = [
                        {full_name: new RegExp(req.body.name)},
                        {nick_name: new RegExp(req.body.name)}
                    ];
                }
                //count = company_ids.length;
                //var Company;
                //if(req.body.type == config_common.company_category.TRADE){
                //    Company = TradeCompany;
                //}else{
                //    Company = TrafficCompany;
                //}
                Company
                    .find(cond)
                    .skip((req.body.page - 1) * config_common.company_per_page)
                    .limit(config_common.company_per_page)
                    .select('_id full_name nick_name verify_phase url_logo type')
                    .exec(function (err, companies) {
                        if (err) {
                            return cb(err);
                        }
                        cb(null, cond, companies);
                    });
            },
            function (cond, companies, cb) {
                Company.count(cond, function (err, countres) {
                    if (err) {
                        return cb(err);
                    }
                    count = countres;
                    cb(null, companies);
                });
            },
            function (companies, cb) {
                var companyObj = util.transObjArrToObj(companies, '_id');
                var cond;
                var other_company_id;
                if (req.body.subType == config_common.company_type.SALE) {
                    cond = {
                        self_id: req.decoded.company_id,
                        other_id: {$in: company_ids}
                    };
                    other_company_id = 'other_id';
                } else {
                    cond = {
                        self_id: {$in: company_ids},
                        other_id: req.decoded.company_id
                    };
                    other_company_id = 'self_id';
                }
                CompanyRelation.find(cond, function (err, relations) {
                    if (err) {
                        return cb(err);
                    }
                    for (var i = 0; i < relations.length; i++) {
                        var company_id = relations[i][other_company_id];
                        if (companyObj[company_id]) {
                            companyObj[company_id].apply = true;
                        }
                    }
                    cb(null, _.values(companyObj));
                });
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, {
                exist: count > req.body.page * config_common.company_per_page,
                company: result,
                boolean: count > 0
            }, next);
        });
    });

    //判断两个公司是否有认证关系
    api.post('/get_verify_status_by_company_ids', function (req, res, next) {
        if (req.decoded.role !== config_common.user_roles.TRAFFIC_ADMIN &&
            req.decoded.role !== config_common.user_roles.TRADE_SALE &&
            req.decoded.role !== config_common.user_roles.TRADE_PURCHASE &&
            req.decoded.role !== config_common.user_roles.TRADE_ADMIN) {
            return next('not_allow');
        }
        if (!req.body.apply_company_id || !req.body.verify_company_id) {
            return next('invalid_format');
        }
        async.waterfall([
            function (cb) {
                CompanyRelation.findOne({
                    self_id: req.body.verify_company_id,
                    other_id: req.body.apply_company_id
                }, function (err, relation) {
                    if (err) {
                        return cb(err);
                    }
                    var flag = false;
                    if (relation) {
                        flag = relation.type == config_common.relation_type.ACCEPT;
                    }
                    cb(null, flag);
                });
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, result, next);
        });
    });

    //获取公司销售服责人  demand 对方是买方  supply 对方是卖方
    api.post('/get_user_for_company', function (req, res, next) {
        if (!req.body.type || !req.body.company_id) {
            return next('invalid_format');
        }
        var self_user_id = undefined;
        var other_user_id = undefined;
        async.waterfall([
            function (cb) {
                var query = {};
                if (req.body.type == 'demand') {
                    query.other_id = req.decoded.company_id;
                    query.self_id = req.body.company_id;
                } else {
                    query.self_id = req.decoded.company_id;
                    query.other_id = req.body.company_id;
                }
                CompanyRelation.findOne(query, cb);
            },
            function (companyrelation, cb) {
                var query = {};
                if (!companyrelation) {
                    return next('invalid_companyrelation');
                }
                if (req.body.type == 'demand') {
                    if (companyrelation.other_user_id) {
                        query._id = companyrelation.other_user_id;
                        other_user_id = companyrelation.other_user_id;
                    }
                } else {
                    if (companyrelation.self_user_id) {
                        query._id = companyrelation.self_user_id;
                        self_user_id = companyrelation.self_user_id;
                    }
                }
                if (!query._id) {
                    return next('invalid_companyrelation');
                }
                userService.getOne({find: query}, cb);
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            if (!result) {
                var query = {};
                query['$or'] = [
                    {self_user_id: self_user_id},
                    {other_user_id: other_user_id}
                ];
                if (self_user_id || other_user_id) {
                    CompanyRelation.remove(query, function (err) {
                        if (err) {
                            return next(err);
                        }
                        return config_common.sendData(req, {}, next);
                    });
                }
            }
            config_common.sendData(req, result, next);
        });
    });

    //获取认证公司的本公司负责人列表 type对方公司类型,reload-3.0.0-2017/4/27
    api.post('/get_users_verify', function (req, res, next) {
        if (req.decoded.role !== global.config_common.user_roles.TRADE_ADMIN) {
            return next('not_allow');
        }
        // if(!req.body.page){
        //     req.body.page = 1;
        // }
        if (!global.config_common.company_type[req.body.type]) {
            return next('invalid_format');
        }
        var user_id;
        async.waterfall([
            function (cb) {
                var cond = {type: global.config_common.relation_type.ACCEPT};
                switch (req.body.type) {
                    case global.config_common.company_type.TRAFFIC:
                        cond.self_id = req.decoded.company_id;
                        cond.other_type = global.config_common.company_category.TRAFFIC;
                        user_id = 'self_user_id';
                        break;
                    case global.config_common.company_type.SALE:
                        cond.self_id = req.decoded.company_id;
                        cond.other_type = global.config_common.company_category.TRADE;
                        user_id = 'self_user_id';
                        break;
                    case global.config_common.company_type.PURCHASE:
                        user_id = 'other_user_id';
                        cond.other_id = req.decoded.company_id;
                        break;
                }
                global.lib_company_relation.getList({
                    find: cond,
                    select: user_id
                }, cb);
            },
            function (relations, cb) {
                var userObj = {};
                for (var i = 0; i < relations.length; i++) {
                    var relation = relations[i];
                    if (!userObj[relation[user_id]]) {
                        userObj[relation[user_id]] = 0;
                    }
                    userObj[relation[user_id]]++;
                }
                var user_ids = _.keys(userObj);
                var roles = [];
                if (req.body.type == global.config_common.company_type.SALE) {
                    roles.push(global.config_common.user_roles.TRADE_PURCHASE);
                    roles.push(global.config_common.user_roles.TRADE_ADMIN);
                } else if (req.body.type == global.config_common.company_type.PURCHASE) {
                    roles.push(global.config_common.user_roles.TRADE_SALE);
                    roles.push(global.config_common.user_roles.TRADE_ADMIN);
                } else {
                    roles.push(global.config_common.user_roles.TRADE_PURCHASE);
                    roles.push(global.config_common.user_roles.TRADE_SALE);
                    roles.push(global.config_common.user_roles.TRADE_ADMIN);
                }
                global.lib_user.getList({
                    find: {_id: {$in: user_ids}, role: {$in: roles}},
                    select: 'photo_url real_name role',
                    sort: {real_name: -1}
                    // skip: (req.body.page-1) * config_common.entry_per_page,
                    // limit: config_common.entry_per_page
                }, function (err, users) {
                    if (err) {
                        return cb(err);
                    }
                    for (var j = 0; j < users.length; j++) {
                        var user = users[j].toObject();
                        users[j] = user;
                        user.count = userObj[user._id.toString()];
                    }
                    cb(null, {
                        count: user_ids.length,
                        exist: false,//req.body.page * config_common.entry_per_page > user_ids.length,
                        users: users
                    });
                });
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            global.config_common.sendData(req, result, next);
        });
    });

    //获取未分配认证公司的本公司人列表 type对方公司类型,reload-3.0.0-2017/4/27
    api.post('/get_users_not_verify', function (req, res, next) {
        if (req.decoded.role !== global.config_common.user_roles.TRADE_ADMIN) {
            return next('not_allow');
        }
        if (!global.config_common.company_type[req.body.type]) {
            return next('invalid_format');
        }
        var user_id;
        async.waterfall([
            function (cb) {
                var cond = {type: global.config_common.relation_type.ACCEPT};
                switch (req.body.type) {
                    case global.config_common.company_type.TRAFFIC:
                        cond.self_id = req.decoded.company_id;
                        cond.other_type = global.config_common.company_category.TRAFFIC;
                        user_id = 'self_user_id';
                        break;
                    case global.config_common.company_type.SALE:
                        cond.self_id = req.decoded.company_id;
                        cond.other_type = global.config_common.company_category.TRADE;
                        user_id = 'self_user_id';
                        break;
                    case global.config_common.company_type.PURCHASE:
                        user_id = 'other_user_id';
                        cond.other_id = req.decoded.company_id;
                        break;
                }
                global.lib_company_relation.getList({
                    find: cond,
                    select: user_id
                }, cb);
            },
            function (relations, cb) {
                var user_ids = global.lib_util.transObjArrToSigArr(relations, user_id);
                var roles = [];
                if (req.body.type == global.config_common.company_type.SALE) {
                    roles.push(global.config_common.user_roles.TRADE_PURCHASE);
                    roles.push(global.config_common.user_roles.TRADE_ADMIN);
                } else if (req.body.type == global.config_common.company_type.PURCHASE) {
                    roles.push(global.config_common.user_roles.TRADE_SALE);
                    roles.push(global.config_common.user_roles.TRADE_ADMIN);
                } else {
                    roles.push(global.config_common.user_roles.TRADE_PURCHASE);
                    roles.push(global.config_common.user_roles.TRADE_SALE);
                    roles.push(global.config_common.user_roles.TRADE_ADMIN);
                }
                global.lib_user.getList({
                    find: {_id: {$nin: user_ids}, role: {$in: roles}, company_id: req.decoded.company_id},
                    select: 'photo_url real_name role',
                    sort: {real_name: -1}
                }, function (err, users) {
                    if (err) {
                        return cb(err);
                    }
                    cb(null, {
                        count: users.length,
                        exist: false,//req.body.page * config_common.entry_per_page > user_ids.length,
                        users: users
                    });
                });
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            global.config_common.sendData(req, result, next);
        });
    });

    //获取某人负责的认证公司列表 reload-3.0.0-2017/4/27
    api.post('/get_companys_by_user_id', function (req, res, next) {
        if (req.decoded.role !== global.config_common.user_roles.TRADE_ADMIN) {
            return next('not_allow');
        }
        if (!req.body.user_id || !req.body.type) {
            return next('invalid_format');
        }
        var company_key;
        var cond;
        var types;
        var result = {};
        async.waterfall([
            function (cb) {
                cond = {type: global.config_common.relation_type.ACCEPT};
                switch (req.body.type) {
                    case global.config_common.company_type.TRAFFIC:
                        cond.self_id = req.decoded.company_id;
                        cond.self_user_id = req.body.user_id;
                        cond.other_type = global.config_common.company_category.TRAFFIC;
                        company_key = 'other_id';
                        types = [global.config_common.count_type.TRAFFIC_DEMAND];
                        break;
                    case global.config_common.company_type.SALE:
                        cond.self_id = req.decoded.company_id;
                        cond.self_user_id = req.body.user_id;
                        cond.other_type = global.config_common.company_category.TRADE;
                        company_key = 'other_id';
                        types = [global.config_common.count_type.TRADE_OFFER];
                        break;
                    case global.config_common.company_type.PURCHASE:
                        company_key = 'self_id';
                        cond.other_id = req.decoded.company_id;
                        cond.other_user_id = req.body.user_id;
                        types = [global.config_common.count_type.TRADE_DEMAND];
                        break;
                }
                global.lib_company_relation.getCount(cond, cb);
            },
            function (count, cb) {
                result.count = count;
                global.lib_company_relation.getList({
                    find: cond,
                    select: company_key
                }, cb);
            },
            function (relations, cb) {
                var company_ids = global.lib_util.transObjArrToSigArr(relations, company_key);
                global.lib_company.getList({
                    find: {_id: {$in: company_ids}},
                    select: 'full_name nick_name verify_phase url_logo'
                }, cb);
            },
            function (companies, cb) {
                result.list = [];
                global.lib_count.get({
                    body: {
                        company_ids: global.lib_util.transObjArrToSigArr(companies, '_id'),
                        types: types
                    }
                }, function (err, obj) {
                    if (err) {
                        return cb(err);
                    }
                    result.list = [];
                    for (var i = 0; i < companies.length; i++) {
                        var company = companies[i].toObject();
                        company.count = obj[company._id.toString()];
                        result.list.push(company);
                    }
                    cb();
                });
            }
        ], function (err) {
            if (err) {
                return next(err);
            }
            global.config_common.sendData(req, result, next);
        });
    });

    // 删除邀请手机记录
    // api.post('/del_user_invitation_phone', function (req, res, next) {
    //     if (!req.body.id) {
    //         return next('invalid_format');
    //     }
    //     userInvitationPhoneService.delOne({_id: req.body.id}, function (err) {
    //         if (err) {
    //             return next(err);
    //         }
    //         return config_common.sendData(req, {}, next);
    //     });
    // });

    //获取本公司已认证公司(给人分配认证公司用，额外增加负责人信息)
    api.post('/get_verify_company_user', function (req, res, next) {
        if (req.decoded.role !== global.config_common.user_roles.TRAFFIC_ADMIN &&
            req.decoded.role !== global.config_common.user_roles.TRADE_ADMIN) {
            return next('not_allow');
        }
        if (!global.config_common.checkCompanyDetailType(req.body.subType)) {
            return next('invalid_format');
        }
        req.body.page = req.body.page || 1;
        var company_key;
        var user_key;
        var cond;
        var result = {list: []};
        var verifyDatas = [];
        var types;
        var countObj;
        async.waterfall([
            function (cb) {
                cond = {type: global.config_common.relation_type.ACCEPT};
                switch (req.body.subType) {
                    case global.config_common.company_type.TRAFFIC:
                        cond.other_type = global.config_common.company_category.TRAFFIC;
                        cond.self_id = req.decoded.company_id;
                        company_key = 'other_id';
                        user_key = 'self_user_id';
                        types = [global.config_common.count_type.TRAFFIC_DEMAND, global.config_common.count_type.TRAFFIC_ORDER];
                        break;
                    case global.config_common.company_type.SALE:
                        cond.other_type = global.config_common.company_category.TRADE;
                        cond.self_id = req.decoded.company_id;
                        company_key = 'other_id';
                        user_key = 'self_user_id';
                        types = [global.config_common.count_type.TRADE_OFFER, global.config_common.count_type.SALE];
                        break;
                    case global.config_common.company_type.PURCHASE:
                        cond.other_id = req.decoded.company_id;
                        company_key = 'self_id';
                        user_key = 'other_user_id';
                        types = [global.config_common.count_type.TRADE_DEMAND, global.config_common.count_type.PURCHASE];
                        break;
                }
                global.lib_company_relation.getCount(cond, cb);
            },
            function (count, cb) {
                result.count = count;
                result.exist = count > req.body.page * global.config_common.company_per_page;
                global.lib_company_relation.getList({
                    find: cond,
                    sort: {time_verify: -1},
                    skip: (req.body.page - 1) * global.config_common.entry_per_page,
                    limit: global.config_common.entry_per_page
                }, cb);
            },
            function (verifies, cb) {
                verifyDatas = verifies;
                var user_ids = global.lib_util.transObjArrToSigArr(verifies, user_key);
                global.lib_user.getList({find: {_id: {$in: user_ids}}, select: 'real_name photo_url'}, cb);
            },
            function (users, cb) {
                global.lib_count.get({
                    body: {
                        company_ids: global.lib_util.transObjArrToSigArr(verifyDatas, company_key),
                        types: types
                    }
                }, function (err, obj) {
                    if (err) {
                        return cb(err);
                    }
                    countObj = obj;
                    cb(null, users);
                });
            },
            function (users, cb) {
                var company_ids = global.lib_util.transObjArrToSigArr(verifyDatas, company_key);
                global.lib_company.getList({
                    find: {_id: {$in: company_ids}},
                    select: '_id full_name nick_name verify_phase url_logo'
                }, function (err, companies) {
                    if (err) {
                        return cb(err);
                    }
                    var userObj = global.lib_util.transObjArrToObj(users, '_id');
                    var companyObj = global.lib_util.transObjArrToObj(companies, '_id');
                    for (var i = 0; i < verifyDatas.length; i++) {
                        var verify = verifyDatas[i];
                        result.list.push({
                            company: companyObj[verify[company_key]],
                            count: countObj[verify[company_key]],
                            user: userObj[verify[user_key]]
                        });
                    }
                    cb();
                });
            }
        ], function (err) {
            if (err) {
                return next(err);
            }
            global.config_common.sendData(req, result, next);
        });
    });


    return api;
};
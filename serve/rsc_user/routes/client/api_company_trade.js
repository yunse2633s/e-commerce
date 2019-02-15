/**
 * Created by Administrator on 2015/11/18.
 */
var _ = require('underscore');
var async = require('async');
var express = require('express');

var companyDynamicService = require('../../libs/lib_company_dynamic');

var sdk_map_gaode = require('../../sdks/map_gaode/sdk_map_gaode');

var Company = require('../../models/Company_trade');
var Company_traffic = require('../../models/Company_traffic');

var config_common = require('../../configs/config_common');
var config_server = require('../../configs/config_server');

module.exports = function () {
    var api = express.Router();

    api.post('/get_one', function (req, res, next) {
        Company
            .findOne({_id: req.body.company_id})
            //.select('status full_name nick_name verify_phase')
            .exec(function (err, company) {
                if (err) {
                    return next(err);
                }
                if (!company) {
                    return next('not_found');
                }
                config_common.sendData(req, company, next);
            });
    });

    api.post('/get_one_verify_phase', function (req, res, next) {
        Company
            .findOne({_id: req.body.company_id}, {verify_phase: 1})
            .exec(function (err, company) {
                if (err) {
                    return next(err);
                }
                if (!company) {
                    return next('not_found');
                }
                config_common.sendData(req, company, next);
            });
    });

    //cc添加2016-9-21
    //交易服务器获取公司交易信息
    api.post('/get_one_to_trade', function (req, res, next) {
        Company
            .findOne({_id: req.body.company_id})
            //.select('status full_name nick_name verify_phase')
            .exec(function (err, company) {
                if (err) {
                    return next(err);
                }
                if (!company) {
                    return next('not_found');
                }
                config_common.sendData(req, company, next);
            });
    });

    api.use(require('../../middlewares/mid_verify_user')());

    //编辑公司信息
    api.post('/edit', function (req, res, next) {
        if ((req.body.sub_type && !global.config_common.checkCompanySubType(req.body.sub_type)) ||
            (!req.body.sub_type &&
            !req.body.des &&
            !req.body.city &&
            !req.body.province &&
            !req.body.district &&
            !req.body.addr &&
            !req.body.manage &&
            !req.body.sell &&
            !req.body.buy &&
            !req.body.url_yingyezhizhao &&
            !req.body.url_honor &&
            !req.body.url_culture &&
            !req.body.nick_name &&
            !req.body.url_logo)) {
            return next('invalid_format');
        }
        if (req.body.province || req.body.city || req.body.district) {
            if (!global.config_common.checkProvince(req.body.province) ||
                !global.config_common.checkCity(req.body.province, req.body.city) ||
                !global.config_common.checkDistrict(req.body.city, req.body.district)) {
                return next('invalid_format');
            }
        }
        if (req.decoded.role !== global.config_common.user_roles.TRADE_ADMIN) {
            return next('not_allow');
        }
        async.waterfall([
            function (cb) {
                global.lib_company.getOneTrade({find: {_id: req.decoded.company_id}}, cb);
            },
            function (company, cb) {
                if (!company) {
                    return cb('company_not_found');
                }
                var count = global.config_common.company_setting_not_verify_count;
                if (company.verify_phase == config_common.verification_phase.SUCCESS) {
                    count = global.config_common.company_setting_verify_count;
                }
                if ((req.body.sell && req.body.sell.length > count) ||
                    (req.body.buy && req.body.buy.length > count)) {
                    return cb('invalid_format');
                }
                if (company.verify_phase !== global.config_common.verification_phase.PROCESSING &&
                    company.verify_phase !== global.config_common.verification_phase.SUCCESS &&
                    req.body.url_yingyezhizhao) {
                    company.url_yingyezhizhao = req.body.url_yingyezhizhao;
                }
                req.body.sub_type ? company.sub_type = req.body.sub_type : 0;
                req.body.des ? company.des = req.body.des : 0;
                req.body.url_logo ? company.url_logo = req.body.url_logo : 0;
                if (req.body.buy) {
                    company.buy = req.body.buy;
                }
                if (req.body.sell) {
                    company.sell = req.body.sell;
                }
                var change;
                if (req.body.province) {
                    company.province = global.config_province[req.body.province].name;
                    change = true;
                }
                if (req.body.city) {
                    company.city = global.config_city[req.body.province][req.body.city].name;
                    change = true;
                }
                if (req.body.district) {
                    company.district = global.config_district[req.body.city][req.body.district].name || '';
                    change = true;
                }
                if (req.body.addr) {
                    company.addr = req.body.addr;
                    change = true;
                }
                req.body.manage ? company.manage = req.body.manage : 0;
                if (req.body.url_honor && req.body.url_honor.length <= global.config_common.company_honor_picture_count) {
                    for (var i = 0; i < company.url_honor.length; i++) {
                        if (company.url_honor[i] &&
                            company.url_honor[i] !== req.body.url_honor[i]) {
                            global.lib_file.deleteImgFromAliyun(company.url_honor[i]);
                        }
                    }
                    company.url_honor = req.body.url_honor;
                }
                if (req.body.url_culture && req.body.url_culture.length <= global.config_common.company_culture_picture_count) {
                    for (var i = 0; i < company.url_culture.length; i++) {
                        if (company.url_culture[i] &&
                            company.url_culture[i] !== req.body.url_culture[i]) {
                            global.lib_file.deleteImgFromAliyun(company.url_culture[i]);
                        }
                    }
                    company.url_culture = req.body.url_culture;
                }
                if (req.body.nick_name) {
                    company.nick_name = req.body.nick_name;
                }
                if (change) {
                    sdk_map_gaode.getCoordinate(company.province + company.city + company.district + company.addr, function (err, coordinate) {
                        if (coordinate && coordinate.geocodes && coordinate.geocodes[0]) {
                            company.location = coordinate.geocodes[0].location.split(',');
                        }
                        company.save(cb);
                    });
                } else {
                    company.save(cb);
                }
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            if (req.body.des) {
                global.lib_company_dynamic.add({
                    company_id: req.decoded.company_id,
                    user_id: req.decoded.id,
                    type: companyDynamicService.typeCode.company_des,
                    data: JSON.stringify({msg: req.body.des})
                }, function () {
                });
            }
            config_common.sendData(req, result, next);
        });
    });

    //获取卖指定东西的公司(交易需求单里系统推荐)
    api.post('/get_by_category_chn', function (req, res, next) {
        if (!req.body.category_chn) {
            return next('invalid_format');
        }
        var company_id;
        if (config_common.checkTradeCompanyByRole(req.decoded.role)) {
            company_id = req.decoded.company_id;
        } else {
            company_id = req.decoded.company_id[0];
        }
        var cond = {
            sell: req.body.category_chn,
            _id: {$nin: [company_id]}
        };
        async.waterfall([
            function (cb) {
                Company.count(cond, cb);
            },
            function (count, cb) {
                var number = 0;
                if (count > config_common.demand_company_recommend) {
                    number = Math.floor(Math.random() * (count - config_common.demand_company_recommend));
                }
                Company
                    .find(cond)
                    .skip(number)
                    .limit(config_common.demand_company_recommend)
                    .exec(cb);
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, result, next);
        });
    });

    api.post('/get', function (req, res, next) {
        var company_id = req.decoded.company_id;
        if (_.isArray(company_id)) {
            company_id = company_id[0];
        }
        Company.findOne({_id: company_id}, function (err, company) {
            if (err) {
                return next(err);
            }
            if (!company) {
                return next('not_found');
            }
            config_common.sendData(req, company, next);
        });
    });

    api.post('/get_company_list', function (req, res, next) {
        if (req.body.page) {
            var page = req.body.page || 1;
            var pagesize = req.body.pagesize || 5;
        }
        var query = {_id: {$in: req.body.company_idArr}};
        if (req.body.full_name) {
            query.full_name = {$regex: req.body.full_name, $options: 'i'};
        }
        Company.count(query, function (err, count) {
            if (err) {
                return next(err);
            }
            Company.find(query)
                .skip(pagesize * (page - 1)).limit(pagesize)
                .select('url_logo full_name nick_name user_price_offer_id')
                .exec(function (err, list) {
                    if (err) {
                        return next(err);
                    }

                    config_common.sendData(req, {
                        list: list,
                        count: count
                    }, next);
                });
        })

    });

    return api;
};
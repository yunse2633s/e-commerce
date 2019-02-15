/**
 * Created by Administrator on 2017/5/5.
 */
var _ = require('underscore');
var async = require('async');
var express = require('express');
var sdk_map_gaode = require('../../sdks/map_gaode/sdk_map_gaode');
var sdk_im_wangyiyunxin = require('../../sdks/im_wangyiyunxin/sdk_im_wangyiyunxin');

module.exports = function () {

    var api = express.Router();

    //企业主页或企业主页
    api.post('/get_home_pages', function (req, res, next) {
        if (!req.body.company_id) {
            return next('invalid_format');
        }
        if (!global.lib_util.checkID(req.body.company_id)) {
            return next('invalid_format');
        }
        var company = {};
        var entry;
        async.waterfall([
            function (cb) {
                global.lib_company.getOne({
                    find: {_id: req.body.company_id}
                }, cb);
            },
            function (company, cb) {
                if (!company) {
                    return cb('company_not_found');
                }
                entry = company;
                global.lib_http.sendTradeServer({
                    method: 'getList',
                    cond: {find: {lev: 0}},
                    model: 'Classify'
                }, global.config_api_url.trade_server_get_hanzi, cb);
            },
            function (hanZi, cb) {
                hanZi = _.indexBy(hanZi, 'eng');
                company.arrSell = _.map(entry.sell, function (num) {
                    if (hanZi[num]) {
                        return hanZi[num].chn;
                    } else {
                        return '';
                    }
                });
                company.arrBuy = _.map(entry.buy, function (num) {
                    if (hanZi[num]) {
                        return hanZi[num].chn;
                    } else {
                        return '';
                    }
                });
                company.transport = _.map(entry.transport, function (num) {
                    if (hanZi[num]) {
                        return hanZi[num].chn;
                    } else {
                        return '';
                    }
                });
                company.company = entry;
                global.lib_http.sendDynamicServer({company_id: company.company._id.toString()}, global.config_api_url.dynamic_server_company_dynamic_get_count, function (err, count) {
                    if (err) {
                        return cb(err);
                    }
                    if (count) {
                        company.count = count;
                        company.count.DJ = count.SALE_DJ;
                        company.count.JJ = count.SALE_JJ;
                        company.count.TRADE_DEMAND = count.PURCHASE;
                        company.count.TRAFFIC_DEMAND = count.TRAFFIC;
                    }
                    cb(null, company);
                });
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            global.config_common.sendData(req, company, next);
        });
    });

    /**
     * 根据user_id得到这个人的公司和个人信息
     * 参数 user_id
     */
    api.post('/get_company_and_user', function (req, res, next) {
        if (!req.body.user_id) {
            return next('invalid_format');
        }
        var result = {};
        async.waterfall([
            function (cb) {
                global.lib_user.getOne({find: {_id: req.body.user_id}}, cb);
            },
            function (user, cb) {
                result.user_name = user.real_name;
                result.user_photo = user.photo_url;
                result.role = user.role;
                if (global.config_common.checkUserCompany(user)) {
                    global.lib_company.getOne({find: {_id: {$in: _.flatten([user.company_id])}}}, cb);
                } else {
                    cb(null, null);
                }
            },
            function (company, cb) {
                if (company) {
                    result.company_name = company.nick_name;
                    result.verify_phase = company.verify_phase;
                    result.vip = company.vip;
                    result.city = company.city;
                    result.province = company.province;
                }
                cb();
            }
        ], function (err) {
            if (err) {
                return next(err);
            }
            global.config_common.sendData(req, result, next);
        })
    });

    api.use(require('../../middlewares/mid_verify_user')());

    api.post('/get_one', function (req, res, next) {
        var company_id;
        async.waterfall([
            function (cb) {
                if (req.body.company_id) {
                    company_id = req.body.company_id;
                    cb(null, null);
                } else if (global.config_common.checkUserCompany(req.decoded)) {
                    company_id = req.decoded.company_id;
                    cb(null, null);
                } else {
                    global.lib_user.getOne({find: {_id: req.decoded.id}}, cb);
                }
            },
            function (user, cb) {
                if (user) {
                    company_id = user.company_id;
                }
                var cond;
                if (global.config_common.checkUserCompany({company_id: company_id, role: req.decoded.role})) {
                    cond = {_id: company_id};
                } else {
                    cond = {user_id: req.decoded.id};
                }
                global.lib_company.getOne({find: cond}, cb);
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            if (!result) {
                result = {
                    full_name: '',
                    type: '',
                    has_admin: '',
                    nick_name: '',
                    verify_phase: 'NO',
                    url_yingyezhizhao: '',
                    url_logo: '',
                    url_honor: [],    //荣誉图
                    manage: '',                   //经营品类
                    transport: '',    //运什么
                    sub_type: '',                   //子类型如钢铁煤炭
                    province: '',        //省
                    city: '',            //市
                    district: '',//区县
                    addr: '',    //详细
                    location: [],              //经纬度
                    des: '',            //公司描述
                    time_creation: new Date(),
                    phone_creator: ''           //公司创建人电话（第一个）
                };
            }
            global.config_common.sendData(req, result, next);
        });
    });

    //开通行业类别  type:buy 或者 sell  category 要开通的行业英文字段
    api.post('/open', function (req, res, next) {
        if (!req.body.type || !req.body.category) {
            return next('invalid_format');
        }
        async.waterfall([
            function (cb) {
                global.lib_company.getOne({
                    find: {_id: req.body.company_id ? req.body.company_id : req.decoded.company_id}
                }, cb);
            },
            function (company, cb) {
                company[req.body.type].push(req.body.category);
                global.lib_company.edit(company, cb);
            }
        ], function (err, result) {
            if (err) return next(err);
            global.config_common.sendData(req, result, next);
        });
    });

    /**
     * 三重判断（1）是否有公司（2）是否申请加入公司（3）是否创建了公司
     * company 是否创建公司
     * join 是否加入公司
     * supply 是否申请加入公司
     */
    api.post('/three_if', function (req, res, next) {
        var data = {};
        async.waterfall([
            //（1）是否有公司
            function (cb) {
                global.lib_user.getOne({
                    find: {_id: req.decoded.id}
                }, cb);
            },
            function (user, cb) {
                if (user && user.company_id) {
                    if (user.company_id.length !== 0) {
                        data.join = true;
                    } else {
                        data.join = false;
                    }
                } else {
                    data.join = false;
                }
                //（2）是否 申请加入 公司
                global.lib_apply_relation.getOne({
                    find: {
                        other_user_id: req.decoded.id,
                        status: global.config_common.relation_status.WAIT,
                        type: global.config_common.relation_style.COMPANY_SUPPLY
                    }
                }, cb);
            },
            function (status, cb) {
                if (status) {
                    data.supply = true;
                } else {
                    data.supply = false;
                }
                //（3）是否创建了公司
                global.lib_company.getOne({
                    find: {user_id: req.decoded.id}
                }, cb);
            }
        ], function (err, result) {
            if (err) return next(err);
            var data2 = {};
            if (result) {
                data2.company = true;
                data2.verify_phase = result.verify_phase;
            } else {
                if (data.join) {
                    data2.join = data.join;
                } else {
                    if (data.supply) {
                        data2.supply = data.supply;
                    } else {
                        data2.supply = false;
                    }
                }
            }
            if (data.join == true) {
                global.lib_company.getOne({find: {_id: {$in: _.flatten([req.decoded.company_id])}}}, function (err, company) {
                    data2.company = company;
                    global.config_common.sendData(req, data2, next);
                })
            } else {
                global.config_common.sendData(req, data2, next);
            }
        })
    });

    //申请认证
    api.post('/authentication_apply', function (req, res, next) {
        if (req.decoded.role !== global.config_common.user_roles.TRAFFIC_ADMIN &&
            req.decoded.role !== global.config_common.user_roles.TRADE_STORAGE &&
            req.decoded.role !== global.config_common.user_roles.TRADE_ADMIN) {
            return next('not_allow');
        }
        if (!req.body.url_yingyezhizhao ||
            !req.body.province ||
            !req.body.city ||
            !req.body.addr ||
            !req.body.des ||
            !req.body.phone_creator ||
            !req.body.currency ||
            !global.config_common.company_person_count[req.body.person_count] ||
            !req.body.nick_name) {
            return next('invalid_format');
        }
        var userData;
        async.waterfall([
            function (cb) {
                global.lib_company.getOne({
                    find: {
                        nick_name: req.body.nick_name,
                        verify_phase: global.config_common.verification_phase.SUCCESS
                    }
                }, cb);
            },
            function (company, cb) {
                if (company) {
                    return cb('name_is_used');
                }
                global.lib_user.getOne({
                    find: {_id: req.decoded.id}
                }, cb);
            },
            function (user, cb) {
                userData = user;
                global.lib_company.getOne({
                    find: {_id: req.decoded.company_id}
                }, cb);
                //global.lib_company.getOne({
                //    find: {full_name: req.body.full_name,_id:{$ne:req.decoded.company_id}}
                //}, cb);
            },
            //function(full_name,cb){
            //    if(full_name){
            //        return cb('have_name');
            //    }else{
            //        global.lib_company.getOne({
            //            find: {_id: req.decoded.company_id}
            //        }, cb);
            //    }
            //},
            function (company, cb) {
                if (!company) {
                    return cb('company_not_found');
                }
                if (company.verify_phase === global.config_common.verification_phase.PROCESSING) {
                    return cb('not_allow');
                }
                if (!company.type === global.config_common.company_category.TRADE) {
                    if (company.sell.length === 0 && company.buy === 0) {
                        return cb('not_allow');
                    }
                } else if (!company.type === global.config_common.company_category.TRAFFIC) {
                    if (!company.transport || company.transport.length === 0) {
                        return cb('not_allow');
                    }
                }
                company.full_name = req.body.full_name;
                company.url_logo = req.body.url_logo;
                company.url_yingyezhizhao = req.body.url_yingyezhizhao;
                company.province = req.body.province;
                company.city = req.body.city;
                company.district = req.body.district || '';
                company.addr = req.body.addr;
                company.des = req.body.des;
                company.sell = req.body.sell || [];
                company.buy = req.body.buy || [];
                company.transport = req.body.transport || [];
                company.phone_creator = req.body.phone_creator;
                company.currency = req.body.currency;
                company.person_count = global.config_common.company_person_count[req.body.person_count];
                company.nick_name = req.body.nick_name;
                company.verify_phase = global.config_common.verification_phase.PROCESSING;
                company.save(cb);
            }
        ], function (err, company) {
            if (err) {
                return next(err);
            }
            global.config_common.sendData(req, {}, next);
        });
    });

    //取消认证
    api.post('/authentication_cancel', function (req, res, next) {
        if (req.decoded.role !== global.config_common.user_roles.TRAFFIC_ADMIN &&
            req.decoded.role !== global.config_common.user_roles.TRADE_STORAGE &&
            req.decoded.role !== global.config_common.user_roles.TRADE_ADMIN) {
            return next('not_allow');
        }
        async.waterfall([
            function (cb) {
                global.lib_company.getOne({
                    find: {_id: req.decoded.company_id}
                }, cb);
            },
            function (company, cb) {
                if (company) {
                    cb(null, company);
                } else {
                    global.lib_company.getOne({
                        find: {user_id: req.decoded.id}
                    }, cb);
                }
            },
            function (company, cb) {
                if (!company) {
                    return cb('company_not_found');
                }
                if (company.verify_phase !== global.config_common.verification_phase.SUCCESS &&
                    company.verify_phase !== global.config_common.verification_phase.PROCESSING) {
                    return cb('not_allow');
                }
                company.verify_phase = global.config_common.verification_phase.NO;
                // company.url_logo = '';
                // company.url_yingyezhizhao = '';
                // company.province = '';
                // company.city = '';
                // company.des = '';
                // company.sell = [];
                // company.buy = [];
                // company.transport = [];
                // company.nick_name = '';
                // company.url_honor = [];
                // company.addr = '';
                // company.district = '';
                company.save(cb);
            }
        ], function (err) {
            if (err) {
                return next(err);
            }
            global.config_common.sendData(req, {}, next);
        });
    });

    //编辑公司信息
    api.post('/edit', function (req, res, next) {
        //角色判断
        if (req.decoded.role !== global.config_common.user_roles.TRAFFIC_ADMIN &&
            req.decoded.role !== global.config_common.user_roles.TRADE_STORAGE &&
            req.decoded.role !== global.config_common.user_roles.TRADE_ADMIN) {
            return next('not_allow');
        }
        //参数判断
        if (!req.body.url_logo &&
            !req.body.province &&
            !req.body.city &&
            !req.body.sell &&
            !req.body.buy &&
            !req.body.transport &&
            !req.body.nick_name &&
            !req.body.addr &&
            !req.body.full_name
        ) {
            return next('not_allow');
        }
        async.waterfall([
            //function (cb) {
            //    global.lib_company.getOne({
            //        find: {full_name: req.body.full_name,_id:{$ne:req.decoded.company_id}}
            //    }, cb);
            //},
            //function(full_name,cb){
            //    if(full_name){
            //        return cb('have_name');
            //    }else{
            //        global.lib_company.getOne({
            //            find: {_id: req.decoded.company_id}
            //        }, cb)
            //    }
            //},
            function (cb) {
                global.lib_company.getOne({
                    find: {_id: req.decoded.company_id}
                }, cb)
            },
            function (company, cb) {
                if (company.verify_phase !== global.config_common.verification_phase.NO) {
                    return cb('not_allow');
                }
                if (req.body.url_logo) {
                    company.url_logo = req.body.url_logo;
                }
                if (req.body.province) {
                    company.province = req.body.province;
                }
                if (req.body.city) {
                    company.city = req.body.city;
                }
                if (req.body.sell) {
                    company.sell = req.body.sell;
                }
                if (req.body.buy) {
                    company.buy = req.body.buy;
                }
                if (req.body.transport) {
                    company.transport = req.body.transport;
                }
                if (req.body.nick_name) {
                    company.nick_name = req.body.nick_name;
                }
                if (req.body.addr) {
                    company.addr = req.body.addr;
                }
                if (req.body.district) {
                    company.district = req.body.district;
                }
                if (req.body.full_name) {
                    company.full_name = req.body.full_name;
                }
                company.save(cb);
            }
        ], function (err) {
            if (err) {
                return next(err);
            }
            global.config_common.sendData(req, {}, next);
        });
    });

    //增加公司背景图
    api.post('/add_bg', function (req, res, next) {
        //角色判断
        if (req.decoded.role !== global.config_common.user_roles.TRAFFIC_ADMIN &&
            req.decoded.role !== global.config_common.user_roles.TRADE_ADMIN) {
            return next('not_allow');
        }
        //参数判断
        if (!req.body.company_bg_img) {
            return next('not_allow');
        }
        async.waterfall([
            function (cb) {
                global.lib_company.getOne({
                    find: {_id: req.decoded.company_id}
                }, cb);
            },
            function (company, cb) {
                if (company.vip) {
                    if (req.body.company_bg_img) {
                        company.url_company_bg_img = req.body.company_bg_img;
                    }
                    company.save(cb);
                } else {
                    return cb('no_vip');
                }
            }
        ], function (err) {
            if (err) {
                return next(err);
            }
            global.config_common.sendData(req, {}, next);
        })
    });

    api.post('/find', function (req, res, next) {
        if (!req.body.name) {
            return next('invalid_format');
        }
        if (!_.isNumber(req.body.page)) {
            req.body.page = 1;
        }
        var result = {};
        var cond = {nick_name: {$regex: req.body.name}, "source": {$ne: "remark"}};
        if (req.body.verify_phase) {
            cond.verify_phase = 'SUCCESS';
        } else {
            cond.verify_phase = {$ne: 'SUCCESS'};
        }
        var supplyData;
        async.waterfall([
            function (cb) {
                if (req.decoded.role === global.config_common.user_roles.TRADE_STORAGE) {
                    global.lib_company.getCount(cond, cb);
                } else if (req.decoded.role === global.config_common.user_roles.TRAFFIC_DRIVER_PRIVATE ||
                    req.decoded.role === global.config_common.user_roles.TRAFFIC_ADMIN) {
                    global.lib_company.getCountTraffic(cond, cb);
                } else {
                    cond.type = global.config_common.company_type.TRADE;
                    global.lib_company.getCountTrade(cond, cb);
                }
            },
            function (count, cb) {
                result.count = count;
                result.exist = count > req.body.page * global.config_common.entry_per_page;
                if (req.body.verify_phase) {
                    cond.verify_phase = 'SUCCESS';
                } else {
                    cond.verify_phase = {$ne: 'SUCCESS'};
                }
                if (req.decoded.role === global.config_common.user_roles.TRADE_STORAGE) {
                    global.lib_company.getList({
                        find: cond,
                        skip: (req.body.page - 1) * global.config_common.entry_per_page,
                        limit: global.config_common.entry_per_page,
                        sort: {time_creation: -1}
                    }, cb);
                } else if (req.decoded.role === global.config_common.user_roles.TRAFFIC_DRIVER_PRIVATE ||
                    req.decoded.role === global.config_common.user_roles.TRAFFIC_ADMIN) {
                    global.lib_company.getListTraffic({
                        find: cond,
                        skip: (req.body.page - 1) * global.config_common.entry_per_page,
                        limit: global.config_common.entry_per_page,
                        sort: {time_creation: -1}
                    }, cb);
                } else {
                    global.lib_company.getListTrade({
                        find: cond,
                        skip: (req.body.page - 1) * global.config_common.entry_per_page,
                        limit: global.config_common.entry_per_page,
                        sort: {time_creation: -1}
                    }, cb);
                }
            },
            function (companies, cb) {
                result.list = [];
                companies = JSON.parse(JSON.stringify(companies));
                async.eachSeries(companies, function (oneData, callback) {
                    var cond = {};
                    if (oneData.user_id) {
                        cond._id = oneData.user_id;
                    } else {
                        cond.phone = oneData.phone_creator;
                        cond.company_id = oneData._id.toString();
                    }
                    global.lib_user.getOneEasy({
                        find: cond,
                        select: 'real_name'
                    }, function (err, data) {
                        if (err) {
                            return cb(err);
                        }
                        oneData.real_name = data.real_name;
                        result.list.push(oneData);
                        callback();
                    })
                }, cb);
            },
            //根据这个人是否申请加入公司，给查询到的 他申请加入的 的公司加 supply:true
            function (cb) {
                global.lib_apply_relation.getOne({
                    find: {
                        other_user_id: req.decoded.id,
                        status: global.config_common.relation_status.WAIT,
                        type: global.config_common.relation_style.COMPANY_INVITE
                    }
                }, cb);
            },
            function (supply, cb) {
                if (supply) {
                    for (var i = 0; i < result.list.length; i++) {
                        if (result.list[i]._id.toString() === supply.company_id) {
                            result.list[i].supply = true;
                        }
                    }
                }
                cb();
            },
        ], function (err) {
            if (err) {
                return next(err);
            }
            global.config_common.sendData(req, result, next);
        });
    });

    api.post('/add', function (req, res, next) {
        if (!req.body.url_company_bg_img) {
            //判断企业背景图是否存在，如果不存在，默认为空；
            req.body.url_company_bg_img = "";
        }
        if (!global.config_common.checkCompanyName(req.body.nick_name)
        // || !req.body.province ||
        // !req.body.addr ||
        //!req.body.city
        ) {
            return next('invalid_format');
        }
        if (!req.body.sell && !req.body.buy && !req.body.transport) {
            return next('invalid_format');
        }
        var userData;
        var companyData;
        var companyDataNew;
        async.waterfall([
            //function (cb) {
            //    global.lib_company.getOne({
            //        find: {full_name: req.body.full_name}
            //    }, cb);
            //},
            //function(full_name,cb){
            //    if(full_name){
            //        return cb('have_name');
            //    }else{
            //        global.lib_company_new.getOne({
            //            find: {$or: [{phone_creator: req.decoded.phone}, {user_id: req.decoded.id}]}
            //        }, cb);
            //    }
            //},
            function (cb) {
                global.lib_company_new.getOne({
                    find: {
                        $or: [{
                            phone_creator: req.decoded.phone,
                            nick_name: req.body.nick_name
                        }, {user_id: req.decoded.id}]
                    }
                }, cb);
            },
            function (company, cb) {
                if (!company) {
                    var data = {};
                    data.full_name = req.body.full_name;
                    data.nick_name = req.body.nick_name;
                    data.sell = req.body.sell;
                    data.buy = req.body.buy;
                    data.transport = req.body.transport;
                    data.url_logo = req.body.url_logo;
                    data.province = req.body.province;
                    data.city = req.body.city;
                    data.district = req.body.district;
                    data.addr = req.body.addr;
                    //增加企业背景图--收费企业使用
                    data.url_company_bg_img = req.body.url_company_bg_img;
                    data.phone_creator = req.decoded.phone;
                    global.lib_company_new.add(data, cb);
                } else {
                    cb(null, company, 1);
                }
            },
            function (data, count, cb) {
                companyDataNew = data;
                var type;
                switch (req.decoded.role) {
                    case global.config_common.user_roles.TRADE_ADMIN:
                        type = global.config_common.company_category.TRADE;
                        break;
                    case global.config_common.user_roles.TRADE_STORAGE:
                        type = global.config_common.company_category.STORE;
                        break;
                    case global.config_common.user_roles.TRAFFIC_ADMIN:
                        type = global.config_common.company_category.TRAFFIC;
                        break;
                }
                //用唯一标识确认公司是否注册
                global.lib_company.getOne({
                    find: {company_id: companyDataNew._id.toString(), type: type}
                    // find: {$or: [
                    //     {phone_creator: req.decoded.phone, nick_name: req.body.nick_name, type: type},
                    //     {user_id: req.decoded.id, nick_name: req.body.nick_name, type: type}
                    //   ]}
                }, cb);
            },
            function (company, cb) {
                if (company) {
                    return cb('not_allow');
                }
                // global.lib_company.getOne({
                //     find: {full_name: req.body.full_name}
                // }, cb);
                cb(null, null);
            },
            function (full_name, cb) {
                if (full_name) {
                    return cb('have_name');
                } else {
                    global.lib_user.getOneEasy({find: {_id: req.decoded.id}}, cb);
                }
            },
            function (user, cb) {
                if (!user) {
                    return cb('not_found');
                }
                if ((user.role === global.config_common.user_roles.TRAFFIC_ADMIN && user.company_id.length) ||
                    (global.config_common.checkTradeCompanyByRole(user.role) && user.company_id)) {
                    return cb('not_allow');
                }
                userData = user;
                var data = {};
                data.full_name = req.body.full_name;
                data.user_id = req.decoded.id;
                data.nick_name = req.body.nick_name;
                data.url_logo = req.body.url_logo;
                data.province = req.body.province;
                data.city = req.body.city;
                data.district = req.body.district;
                data.addr = req.body.addr;
                data.company_id = companyDataNew._id.toString();
                //增加企业背景图--收费企业使用
                data.url_company_bg_img = req.body.url_company_bg_img;
                switch (req.decoded.role) {
                    case global.config_common.user_roles.TRADE_ADMIN:
                        data.type = global.config_common.company_category.TRADE;
                        break;
                    case global.config_common.user_roles.TRADE_STORAGE:
                        data.type = global.config_common.company_category.STORE;
                        break;
                    case global.config_common.user_roles.TRAFFIC_ADMIN:
                        data.type = global.config_common.company_category.TRAFFIC;
                        break;
                }
                if (data.type === global.config_common.company_category.TRADE) {
                    data.sell = req.body.sell || [];
                    data.buy = req.body.buy || [];
                } else if (data.type === global.config_common.company_category.TRAFFIC) {
                    data.transport = req.body.transport || [];
                }
                sdk_map_gaode.getCoordinate(data.province + data.city + data.district, function (err, coordinate) {
                    if (coordinate && coordinate.geocodes && coordinate.geocodes[0]) {
                        data.location = coordinate.geocodes[0].location.split(',');
                    }
                    global.lib_company.add(data, cb);
                });
            },
            function (company, cb) {
                if (global.config_common.checkTradeCompanyByRole(userData.role)) {
                    userData.company_id = company._id.toString();
                } else {
                    userData.company_id.push(company._id.toString());
                }
                userData.save(function (err) {
                    if (err) {
                        return cb(err);
                    }
                    cb(null, company);
                });
            },
            function (company, cb) {
                companyData = company;
                //如果创建公司的人是仓库那么给他的仓库都加上公司id
                if (userData.role === global.config_common.user_roles.TRADE_STORAGE) {
                    global.lib_address.updateList({
                        find: {user_ids: userData._id.toString()},
                        set: {company_id: company._id.toString()}
                    }, cb);
                } else {
                    cb(null, null);
                }
            },
            function (count, cb) {
                //给网易云发消息 创建群组
                var arr = JSON.stringify([req.decoded.id.toString()]);
                sdk_im_wangyiyunxin.createTeam({
                    tname: companyData.nick_name,
                    owner: req.decoded.id.toString(),
                    members: arr,
                    msg: '您已加入' + companyData.real_name + "群组",
                    magree: 0,
                    joinmode: 0,
                    icon: companyData.url_logo,
                    beinvitemode: 1
                }, cb);
            },
            function (tid, cb) {
                var tidData = JSON.parse(tid)
                global.lib_team.add({
                    team_id: tidData.tid,
                    company_id: companyData._id.toString(),
                    user_ids: [userData._id.toString()]
                }, cb);
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            companyData = companyData.toObject();
            companyData.tid = result.team_id;
            companyData.token = global.config_common.createTokenUser(userData, companyData || {});
          //检查物流下面是否有线路更改公司id
          if(global.config_common.checkTrafficCompanyByRole(userData.role)){
            global.lib_http.sendTrafficServer({
              user_id: req.decoded.id, 
              company_id: companyData._id
            }, global.config_api_url.traffic_server_line_company_info, function () {})
          }
            global.config_common.sendData(req, companyData, next);
        });
    });

    /***
     * 功能：金森物流企业设置
     * 参数：
     * phone       手机号
     * nick_name   企业名字
     * url_logo    logo
     * */
    api.post('/company_set', function (req, res, next) {
        if (!req.body.url_company_bg_img) {
            //判断企业背景图是否存在，如果不存在，默认为空；
            req.body.url_company_bg_img = "";
        }
        if (!global.config_common.checkCompanyName(req.body.nick_name)) {
            return next('invalid_format');
        }
        var companyData;
        var company,userData;
        async.waterfall([
            function(cb){
                global.lib_company.getOne({
                    find:{_id:req.body.company_id}
                },cb)
            },
            function (data,cb) {
                if(!data){
                    return next('invalid_format');
                }
                company=data;
                global.lib_company_new.getOne({
                    find: {
                        phone_creator: req.decoded.phone,
                        nick_name: req.body.nick_name
                    }
                }, cb);
            },
            function (company, cb) {
                if (company) {
                    cb(null, company, 1);
                } else {
                    var data = {
                        url_logo: req.body.url_logo,
                        nick_name: req.body.nick_name
                    };
                    global.lib_company_new.add(data, cb);
                }
            },
            function (data, count, cb) {
                var trade_company = {
                    nick_name:data.nick_name,
                    user_id: req.decoded.id,
                    company_id: data._id.toString(),
                    url_company_bg_img: data.url_company_bg_img,
                    buy: ["buxian"],
                    sell: ["buxian"],
                    type: global.config_common.company_category.TRADE
                };
                global.lib_company.add(trade_company, cb);
            },
            function(data,cb){
                companyData = data;
                global.lib_user.getOneEasy({find: {_id:req.body.user_id}}, cb);
            },
            function(user,cb){
                userData=user;
                user.company_id=companyData._id;
                user.save(function(err,a,b){
                    if(err){return next(err)}
                    cb();
                });
            },
            function(cb){
                global.lib_company_relation.add({
                    self_id:company._id,
                    other_id:companyData._id,
                    other_type:companyData.type
                },cb);
            },
            function(data,count,cb){
                global.lib_company_relation.add({
                    self_id:companyData._id,
                    other_id:company._id,
                    other_type:company.type
                },cb);
            },
            function(data,count,cb){
                global.lib_work_relation.add({
                    user_id: company.user_id,
                    other_user_id:companyData.user_id,
                    company_id: company._id,
                    other_company_id: companyData._id,
                    type: companyData.type
                },cb);
            },
            function(data,count,cb){
                global.lib_work_relation.add({
                    user_id: companyData.user_id,
                    other_user_id:company.user_id,
                    company_id: companyData._id,
                    other_company_id: company._id,
                    type: company.type
                },cb);
            },
            function (data,count, cb) {
                //给网易云发消息 创建群组
                var arr = JSON.stringify([req.decoded.id.toString()]);
                sdk_im_wangyiyunxin.createTeam({
                    tname: companyData.nick_name,
                    owner: req.decoded.id.toString(),
                    members: arr,
                    msg: '您已加入' + companyData.real_name + "群组",
                    magree: 0,
                    joinmode: 0,
                    icon: companyData.url_logo,
                    beinvitemode: 1
                }, cb);
            },
            function (tid, cb) {
                var tidData = JSON.parse(tid);
                global.lib_team.add({
                    team_id: tidData.tid,
                    company_id: companyData._id.toString(),
                    user_id: req.decoded.id
                }, cb);
            }
        ], function (err, count, result) {
            var data = {};
            data.company = companyData.toObject();
            data.tid = result.team_id;
            data.token = global.config_common.createTokenUser(userData,companyData ||{});
            global.config_common.sendData(req, data, next);
        });

    });
    /**
     * 是否开通公众号服务
     * 参数：company_id : 公司_id   traffic_type : true/false
     * ***/
    api.post('/traffic_get_type', function (req, res, next) {
        if(!req.body.company_id){
            return next('invalid_format');
        }
        var data={};
        async.waterfall([
            function(cb){
                global.lib_company.getOneTraffic({
                    find:{_id:req.body.company_id}
                },cb)
            },
            function(company,cb){
                if(!company){
                    return next('company_not_found')
                }
                if(req.body.type=='get'){
                    data.path='http://weixin.e-wca.com/index.html#/login_guide?id='+company._id;
                    data.traffic_type=company.traffic_type;
                    cb(null,null);
                }else{
                    company.traffic_type=req.body.traffic_type;
                    data.path='http://weixin.e-wca.com/index.html#/login_guide?id='+company._id;
                    company.save(function(data,count,err){
                        if(err){return next(err);}
                        cb(null,null);
                    });
                    //if(!req.body.traffic_type){
                    //    data.traffic_type=company.traffic_type;
                    //    cb(null,null);
                    //}else{
                    //    company.traffic_type=req.body.traffic_type;
                    //    data.path='http://weixin.e-wca.com/index.html#/login_guide?id='+company._id;
                    //    company.save(function(data,count,err){
                    //        if(err){return next(err);}
                    //        cb(null,null);
                    //    });
                    //}
                }
            }
        ],function(err,result){
            if(err){return next(err);}
            global.config_common.sendData(req, data, next);
        });
    });
    /**
     * 根据user_id数组获取对应的公司信息
     */
    api.post('/get_company_by_user', function (req, res, next) {
        var users;
        var userServer;
        if (!_.isArray(req.body.user_ids)) {
            return next('invalid_format');
        }
        async.waterfall([
            function (cb) {
                global.lib_http.sendAdminServer({
                    method: 'getList',
                    cond: {
                        find: {_id: {$in: req.body.user_ids}},
                        select: 'user_name role phone photo_url'
                    },
                    model: 'SuperAdmin'
                }, global.config_api_url.admin_server_get, cb);
            },
            function (superData, cb) {
                userServer = superData;
                global.lib_user.getListAll({
                    find: {_id: {$in: req.body.user_ids}}
                }, cb);
            },
            function (result, cb) {
                users = result.concat(userServer);
                global.lib_company.getListAll({
                    find: {_id: {$in: _.compact(_.flatten(_.pluck(result, 'company_id')))}},
                    select: 'nick_name verify_phase vip province city'
                }, cb);
            }
        ], function (err, result) {
            if (err) return next(err);
            global.config_common.sendData(req, _.reduce(users, function (obj, user) {
                obj[user._id.toString()] = {
                    role: user.role,
                    photo_url: user.photo_url,
                    real_name: user.real_name || user.user_name
                };
                result.forEach(function (company) {
                    if (user.company_id === company._id.toString()) {
                        obj[user._id.toString()] = {
                            nick_name: company.nick_name,
                            verify_phase: company.verify_phase,
                            role: user.role,
                            photo_url: user.photo_url,
                            real_name: user.real_name
                        };
                    }
                });
                return obj;
            }, {}), next);
        });
    });

    return api;

};
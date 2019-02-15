/**
 * Created by Administrator on 2017/2/27.
 */
var async = require('async');
var _ = require('underscore');
var db_user = require('../dbs/db_base')('User');
var db_trade = require('../dbs/db_base')('User_trade');
var db_traffic = require('../dbs/db_base')('User_traffic');
var db_trade_company = require('../dbs/db_base')('Company_trade');
var db_traffic_company = require('../dbs/db_base')('Company_traffic');
var db_companyRelation = require('../dbs/db_base')('Company_relation');
var db_invitation_user = require('../dbs/db_base')('Invitation_user');
var db_im_err_user = require('../dbs/db_base')('IM_err_user');
var lib_statistical = require('../libs/lib_statistical');

var sdk_im_wangyiyunxin = require('../sdks/im_wangyiyunxin/sdk_im_wangyiyunxin');


var config_common = require('../configs/config_common');

//增加人员
exports.add = function (data, callback) {
    async.waterfall([
        function (cb) {
            if (isTrafficRole(data.role)) {
                db_traffic.add(data, cb);
            } else {
                db_trade.add(data, cb);
            }
        },
        function (user, count, cb) {
            if (user.role === config_common.user_roles.TRAFFIC_DRIVER_PRIVATE) {
                lib_statistical.add({id: user._id.toString(), type: 'driver', count: 1});
            }
            sdk_im_wangyiyunxin.createUser({
                accid: user._id.toString(),
                name: user.real_name,
                icon: user.photo_url,
                token: config_common.yunXin_token
            }, function (err, data) {
                if (err) {
                    db_im_err_user.add({user_id: user._id.toString(), err: err}, function () {
                    });
                }
                global.lib_invitation_user.getList({find: {phone: user.phone, type: "FRIEND"}}, function (err, invint) {
                    var arr = JSON.stringify(_.pluck(invint, 'user_id'));
                    sdk_im_wangyiyunxin.sendBatchMsg({
                        "fromAccid": user._id.toString(),
                        "toAccids": arr,
                        "type": 0,
                        "body": JSON.stringify({
                            "msg": "请开始沟通吧"
                        })
                    }, function (err, data) {
                        //console.log('data', data);
                    })
                })
            });
            cb(null, user, count, '4');
        }
    ], callback);
};

//增加人员
exports.addUser = function (data, callback) {
    db_user.add(data, callback);
};

//获取交易人员
var getOneTrade = function (data, callback) {
    async.waterfall([
        function (cb) {
            db_trade.getOne(data, cb);
        },
        function (role, cb) {
            if (role && role.user_id) {
                db_user.getOne({find: {_id: role.user_id}}, function (err, user) {
                    if (err) {
                        return cb(err);
                    }
                    cb(null, _.extend(user, role));
                });
            } else {
                cb(null, role);
            }
        }
    ], callback);
};
exports.getOneTrade = getOneTrade;

//获取物流人员
var getOneTraffic = function (data, callback) {
    async.waterfall([
        function (cb) {
            db_traffic.getOne(data, cb);
        },
        function (role, cb) {
            if (role && role.user_id) {
                db_user.getOne({find: {_id: role.user_id}}, function (err, user) {
                    if (err) {
                        return cb(err);
                    }
                    cb(null, _.extend(user, role));
                });
            } else {
                cb(null, role);
            }
        }
    ], callback);
};
exports.getOneTraffic = getOneTraffic;

//获取一个人员
var getOne = function (data, callback) {
    async.waterfall([
        function (cb) {
            getOneTrade(data, cb);
        },
        function (user, cb) {
            if (user) {
                return cb(null, user);
            }
            getOneTraffic(data, cb);
        }
    ], callback);
};
exports.getOne = getOne;

//获取一个人员
var getOneEasy = function (data, callback) {
    async.waterfall([
        function (cb) {
            db_trade.getOne(data, cb);
        },
        function (user, cb) {
            if (user) {
                return cb(null, user);
            }
            db_traffic.getOne(data, cb);
        }
    ], callback);
};
exports.getOneEasy = getOneEasy;

//获取一群人员，两张表的集合
exports.getListAll = function (data, callback) {
    async.waterfall([
        function (cb) {
            db_trade.getList(data, cb);
        },
        function (users, cb) {
            // if (users.length) {
            //     return cb(null, users);
            // }
            db_traffic.getList(data, function (err, trafficUsers) {
                return cb(null, users.concat(trafficUsers));
            });
        }
    ], callback);
};

//获取一群人员，两张表的集合的个数
exports.getCountAll = function (data, callback) {
    async.waterfall([
        function (cb) {
            db_trade.getCount(data, cb);
        },
        function (count, cb) {
            db_traffic.getCount(data, function (err, trafficCount) {
                return cb(null, count + trafficCount);
            });
        }
    ], callback);
};

//获取一群人员
exports.getList = function (data, callback) {
    async.waterfall([
        function (cb) {
            db_trade.getList(data, cb);
        },
        function (users, cb) {
            if (users.length) {
                return cb(null, users);
            }
            db_traffic.getList(data, cb);
        }
    ], callback);
};
exports.getList_new = function (data, callback) {
    async.waterfall([
        function (cb) {
            db_trade.getList(data, cb);
        },
        function (users, cb) {
            if (users.length === config_common.entry_per_page) {
                return cb(null, users);
            } else {
                data.limit = config_common.entry_per_page - users.length;
                if (data.skip > 0) {
                    data.skip = data.skip - config_common.entry_per_page;
                }
                db_traffic.getList(data, function (err, trafficUsers) {
                    if (trafficUsers) {
                        return cb(null, users.concat(trafficUsers));
                    } else {
                        return cb(null, null);
                    }
                });
            }
        }
    ], callback);
};
//检查物流公司角色
var isTrafficRole = function (role) {
    return role.indexOf('TRAFFIC') >= 0;
};
exports.isTrafficRole = isTrafficRole;

//检查交易公司角色
var isTradeRole = function (role) {
    return role.indexOf('TRADE') >= 0;
};
exports.isTradeRole = isTradeRole;

//获取仓库交易角色之间状态user1看user2的名片
exports.getStoreTradeSupplyVerifyStatus = function (user1, user2, callback) {
    async.waterfall([
        function (cb) {
            //检查仓库角色有没有公司
            if (user1.role === config_common.user_roles.TRADE_STORAGE) {
                checkUserStoreCompany(user1, cb);
            } else {
                checkUserStoreCompany(user2, cb);
            }
        },
        function (flag, cb) {
            //仓库角色没有公司直接返回数据
            if (!flag) {
                return callback(null, '', false);
            }
            //检查这个与仓库合作的角色是否拥有公司
            if (user1.role === config_common.user_roles.TRAFFIC_ADMIN && config_common.checkUserCompany(user1)) {
                cb(null, user1);
            } else if (user2.role === config_common.user_roles.TRAFFIC_ADMIN && config_common.checkUserCompany(user1)) {
                cb(null, user2);
            } else if (user1.role === config_common.user_roles.TRADE_STORAGE) {
                checkUserTradeCompany(user2, cb);
            } else {
                checkUserTradeCompany(user1, cb);
            }
        },
        function (flag, cb) {
            //仓库角色有公司，但另一个角色没有公司
            if (!flag) {
                return callback(null, '', false);
            }
            if (user1.role === config_common.user_roles.TRADE_STORAGE) {
                db_companyRelation.getOne({
                    find: {
                        self_id: (_.isArray(user2.company_id)) ? user2.company_id[0] : user2.company_id,
                        other_id: user1.company_id,
                        other_type: config_common.company_category.STORE
                    }
                }, cb);
            } else {
                db_companyRelation.getOne({
                    find: {
                        self_id: (_.isArray(user1.company_id)) ? user1.company_id[0] : user1.company_id,
                        other_id: user2.company_id,
                        other_type: config_common.company_category.STORE
                    }
                }, cb);
            }
        },
        function (relation, cb) {
            if (relation) {
                return callback(null, '', true);
            }
            if (user1.role === config_common.user_roles.TRAFFIC_ADMIN) {
                cb(null, config_common.user_homepage_status.TRAFFIC_STORE, false);
            } else if (user2.role === config_common.user_roles.TRAFFIC_ADMIN) {
                cb(null, config_common.user_homepage_status.STORE_TRAFFIC, false);
            } else if (user1.role === config_common.user_roles.TRADE_STORAGE) {
                cb(null, config_common.user_homepage_status.STORE_TRADE, false);
            } else {
                cb(null, config_common.user_homepage_status.TRADE_STORE, false);
            }
        }
    ], callback);
};

//检查该角色是不是有仓库公司的仓库角色
var checkUserStoreCompany = function (user, callback) {
    if (user.role !== config_common.user_roles.TRADE_STORAGE ||
        !config_common.checkUserCompany(user)) {
        return callback(null, false);
    }
    async.waterfall([
        function (cb) {
            db_trade_company.getOne({find: {_id: user.company_id, type: config_common.company_category.STORE}}, cb);
        }
    ], function (err, company) {
        if (err) {
            return callback(err);
        }
        return callback(null, !!company);
    });
};
exports.checkUserStoreCompany = checkUserStoreCompany;

//检查该角色是不是有交易公司的交易角色
var checkUserTradeCompany = function (user, callback) {
    if ((user.role !== config_common.user_roles.TRADE_SALE &&
            user.role !== config_common.user_roles.TRADE_ADMIN &&
            user.role !== config_common.user_roles.TRADE_PURCHASE) ||
        !config_common.checkUserCompany(user)) {
        return callback(null, false);
    }
    async.waterfall([
        function (cb) {
            db_trade_company.getOne({find: {_id: user.company_id, type: config_common.company_category.TRADE}}, cb);
        }
    ], function (err, company) {
        if (err) {
            return callback(err);
        }
        return callback(null, !!company);
    });
};
exports.checkUserTradeCompany = checkUserTradeCompany;

/**
 * 功能:修改 所有端的基本信息
 */
var zhuanHuan = {
    'TRADE_ADMIN': 'trade',             //交易端
    'TRADE_PURCHASE': 'trade',          //交易端
    'TRADE_SALE': 'trade',              //交易端
    'TRAFFIC_ADMIN': 'traffic',         //物流端
    'TRADE_STORAGE': 'store',           //仓库
    'TRAFFIC_DRIVER_PRIVATE': 'driver', //司机端
    'OFFICE_EMPLOYEE': 'office',        //办公端
    'OFFICE_ADMIN': 'office'            //办公端
};
exports.editAll = function (id, data, callback) {
    var user02;
    async.waterfall([
        //第一步：检查（1）如果手机号改变那么需要验证验证码（2）没有修改的话继续
        //第二步：查询到user表，将基本信息修改
        //第三步：根基user表，去修改其他的各个表
        //第四步：循环修改各个表，如果修改手机号，那么需要将对应的验证码的手机号也修改掉
        function (cb) {
            global.lib_user.getOne({find: {_id: id}}, cb);
        },
        function (user, cb) {
            //获取到之后直接开始判断是否需要修改手机号码
            if (data.phone && data.phone != user.phone) {
                //检查一波验证码
                global.lib_verify_code.getOne({
                    find: {
                        phone: data.phone,
                        type: zhuanHuan[user.role]
                    }
                }, function (err, codeData) {
                    if (!codeData) {
                        return callback('invalid_verify_code');
                    }
                    if (codeData.code !== data.verify_code) {
                        return callback('invalid_verify_code');
                    }
                    if (Date.now() - codeData.time_creation.getTime() >= global.config_common.verify_codes_timeout) {
                        return callback('verify_code_timeout');
                    }
                    //这里删除新增的这个验证码内容
                    global.lib_verify_code.del({_id: codeData._id.toString()}, function (err, delData) {
                        if (err) {
                            console.log('delData-err:', err)
                        }
                        //修改手机号码--->此处只修改手机号码-->新增一个方法
                        editAllPhone(user.user_id, data);
                    })
                });
            }
            global.lib_user.getListAll({find: {user_id: user.user_id}}, cb);
        },
        function (users, cb) {
            async.eachSeries(users, function (user, cbk) {
                user02 = user.user_id;
                var edit;
                if (data.real_name) {
                    user.real_name = data.real_name;
                    edit = true;
                }
                if (data.gender) {
                    user.gender = data.gender;
                    edit = true;
                }
                if (data.photo_url) {
                    user.photo_url = data.photo_url;
                    edit = true;
                }
                if (edit) {
                    user.save();
                    //修改云信的姓名和头像
                    sdk_im_wangyiyunxin.updateUser({
                        accid: user._id.toString(),
                        name: user.real_name,
                        icon: user.photo_url
                    });
                    cbk();
                }
            }, cb);
            db_user.getOne({find: {_id: user02}}, function (err, result) {
                if (data.real_name) {
                    result.real_name = data.real_name;
                }
                if (data.gender) {
                    result.gender = data.gender;
                }
                result.save();
                cb();
            });
        }
    ], callback);
};

/**
 * 功能：只循环修改手机号
 */
var editAllPhone = function (id, data02, callback) {
    var user01;
    async.waterfall([
        function (cb) {
            global.lib_user.getListAll({find: {user_id: id}}, cb);
        },
        function (users, cb) {
            async.eachSeries(users, function (user, cbk) {
                user01 = user.user_id;
                async.waterfall([
                    function (cbk2) {
                        //如果电话号码修改了，那么还需要根据不同的角色去查询不同的验证码type类型
                        global.lib_verify_code.getOne({
                            find: {
                                phone: user.phone,
                                type: zhuanHuan[user.role]
                            }
                        }, cbk2)
                    }, function (data, cbk2) {
                        data.phone = data02.phone;
                        user.phone = data02.phone;
                        data.save(function (err, content, count) {
                            if (err) {
                                console.log('err:', err)
                            }
                            user.save(function (err) {
                                if (err) {
                                    console.log('err:', err)
                                }
                                cbk2();
                            });
                        });
                    }
                ], cbk)
            }, cb)
        },
        function (cb) {
            db_user.getOne({find: {_id: user01}}, cb);
        },
        function (data, cb) {
            data.phone = data02.phone;
            data.save(cb);
        }
    ], callback)
};

/**
 * 功能：得到云信需要的人的信息
 * 参数：user_id
 */
exports.getOneData = function (id, callback) {
    var obj = {};
    var peiZhi;
    async.waterfall([
        function (cb) {
            global.lib_http.sendTradeServer({
                method: 'getList',
                cond: {find: {lev: 0}},
                model: 'Classify'
            }, global.config_api_url.trade_server_get_hanzi, cb);
        },
        function (peizhi, cb) {
            peiZhi = _.indexBy(peizhi, 'eng');
            getOneEasy({find: {'_id': id.toString()}}, cb);
        },
        function (user, cb) {
            obj.role = user.role;
            obj.head_url = user.photo_url;
            obj.name = user.real_name;
            obj.post = user.post;
            obj.businesscard_userid = user._id.toString();
            obj.sell =  _.map(user.sell, function (num) {
                return peiZhi[num].chn;
            });
            obj.buy =  _.map(user.buy, function (num) {
                return peiZhi[num].chn;
            });
            obj.transport =  _.map(user.transport, function (num) {
                return peiZhi[num].chn;
            });
            if (user.company_id) {
                global.lib_company.getOne({find: {_id: user.company_id}}, cb);
            } else {
                cb(null, null)
            }
        },
        function (company, cb) {
            if (company) {
                obj.company_name = company.nick_name;
                obj.sell =  _.map(company.sell, function (num) {
                    return peiZhi[num].chn;
                });
                obj.buy =  _.map(company.buy, function (num) {
                    return peiZhi[num].chn;
                });
                obj.transport =  _.map(company.transport, function (num) {
                    return peiZhi[num].chn;
                });
            }
            cb(null, obj);
        }
    ], callback);
};

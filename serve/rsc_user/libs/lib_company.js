/**
 * Created by Administrator on 2017/2/27.
 */

var async = require('async');

var lib_statistical = require('../libs/lib_statistical');

var db_company_list = require('../dbs/db_base')('Company_list');
var db_company_trade = require('../dbs/db_base')('Company_trade');
var db_company_traffic = require('../dbs/db_base')('Company_traffic');

var config_common = require('../configs/config_common');

//增加公司
exports.add = function (data, callback) {
    async.waterfall([
        function (cb) {
            if (data.type === config_common.company_category.TRAFFIC) {
                db_company_traffic.add(data, cb);
            } else
                // if (data.type === config_common.company_category.TRADE ||
                // data.type === config_common.company_category.STORE)
                {
                db_company_trade.add(data, cb);
            }
            // else {
            //     return cb('company_type_err');
            // }
        },
        function (company, count, cb) {
            db_company_list.add({
                company_id: company._id.toString(),
                type: company.type
            }, function (err) {
                if (err) {
                    return cb(err);
                }
                lib_statistical.add({id: company._id.toString(), type: company.type.toLowerCase(), count: 1});
                cb(null, company);
            });
        }
    ], callback);
};

//获取一个公司
var getOne = function (data, callback) {
    async.waterfall([
        function (cb) {
            db_company_traffic.getOne(data, cb);
        },
        function (company, cb) {
            if (company) {
                return cb(null, company);
            }
            db_company_trade.getOne(data, cb);
        }
    ], callback);
};
exports.getOne = getOne;

//获取一个交易公司
exports.getOneTrade = function (data, callback) {
    async.waterfall([
        function (cb) {
            db_company_trade.getOne(data, cb);
        }
    ], callback);
};

//获取一个物流公司
exports.getOneTraffic = function (data, callback) {
    async.waterfall([
        function (cb) {
            db_company_traffic.getOne(data, cb);
        }
    ], callback);
};

//通过角色获取公司类型
exports.getList = function (data, callback) {
    async.waterfall([
        function (cb) {
            db_company_traffic.getList(data, cb);
        },
        function (company, cb) {
            if (company.length) {
                return cb(null, company);
            }
            db_company_trade.getList(data, cb);
        }
    ], callback);
};

//通过角色获取公司类型
exports.getListAll = function (data, callback) {
    async.waterfall([
        function (cb) {
            db_company_traffic.getList(data, cb);
        },
        function (company, cb) {
            // if(company.length){
            //     return cb(null, company);
            // }
            db_company_trade.getList(data, function (err, tradeCompany) {
                if (err) {
                    return cb(err);
                }
                cb(null, company.concat(tradeCompany))
            });
        }
    ], callback);
};

//通过角色获取公司类型
exports.getListTrade = function (data, callback) {
    async.waterfall([
        function (cb) {
            db_company_trade.getList(data, cb);
        }
    ], callback);
};

//通过角色获取公司类型
exports.getListTraffic = function (data, callback) {
    async.waterfall([
        function (cb) {
            db_company_traffic.getList(data, cb);
        }
    ], callback);
};

exports.getCount = function (data, callback) {
    async.waterfall([
        function (cb) {
            db_company_trade.getCount(data, cb);
        },
        function (countTrade, cb) {
            db_company_traffic.getCount(data, function (err, countTraffic) {
                if(err){
                    return cb(err);
                }
                cb(null, countTraffic+countTrade);
            });
        }
    ], callback);
};

//通过角色获取公司类型
exports.getCountTrade = function (data, callback) {
    async.waterfall([
        function (cb) {
            db_company_trade.getCount(data, cb);
        }
    ], callback);
};

//通过角色获取公司类型
exports.getCountTraffic = function (data, callback) {
    async.waterfall([
        function (cb) {
            db_company_traffic.getCount(data, cb);
        }
    ], callback);
};

//通过角色获取公司类型
exports.edit = function (data, callback) {
    async.waterfall([
        function (cb) {
            db_company_traffic.edit(data, cb);
        }
    ], callback);
};
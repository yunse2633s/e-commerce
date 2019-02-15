/**
 * Created by Administrator on 2016/2/3.
 */
var async = require('async');
var http = require('./lib_http');

var companyRelationDB = require('../dbs/db_base')('Company_relation');

var CompanyList = require('../models/Company_list');
var CompanyRelation = require('../models/Company_relation');

var config_common = require('../configs/config_common');
var config_api_url = require('../configs/config_api_url');

var relation_type = {
    ACCEPT: 'ACCEPT',
    WAIT: 'WAIT'
};
exports.relation_type = relation_type;

//同意增加认证公司
exports.addCompanyRelation = function(req, self_company_id, other_company_id, callback, type){
    var cond;
    if(type == 'PURCHASE'){
        cond = {
            self_id: other_company_id,
            other_id: self_company_id
        };
    }else{
        cond = {
            self_id: self_company_id,
            other_id: other_company_id
        };
    }
    async.waterfall([
        function(cb){
            CompanyList.findOne({company_id:other_company_id}, function(err, companylist){
                if(err){
                    return cb(err);
                }
                if(!companylist){
                    return cb('not_found');
                }
                if(req.decoded.role !== config_common.user_roles.TRAFFIC_ADMIN &&
                    req.decoded.role !== config_common.user_roles.TRADE_ADMIN){
                    return cb('not_allow');
                }
                cb(null, companylist);
            });
        },
        function(companylist, cb){
            cond.type = config_common.relation_type.ACCEPT;
            CompanyRelation.count(cond, function(err, count){
                if(err){
                    return cb(err);
                }
                if((companylist.type == config_common.company_category.TRADE && count >= config_common.company_relation_trade) ||
                    (companylist.type == config_common.company_category.TRAFFIC && count >= config_common.company_relation_traffic)){
                    return cb('not_allow');
                }
                cb(null, companylist);
            });
        },
        function(companylist, cb){
            delete cond.type;
            CompanyRelation.findOne(cond, function(err, companyRelation){
                // if(!companyRelation && companylist.type == config_common.company_category.TRAFFIC){
                //     //用于主动认证物流
                //     companyRelation = new CompanyRelation({
                //         other_type: companylist.type,
                //         self_user_id: req.decoded.id,
                //         self_id: self_company_id,
                //         other_id: other_company_id
                //     });
                // }
                if(!companyRelation){
                    return cb('not_found');
                }
                companyRelation.time_verify = new Date();
                //认证交易公司
                // if(companyRelation.other_type == config_common.company_category.TRADE){
                //数据兼容判断(旧版没有companyRelation.apply_user_id字段，新版兼容补全)
                if(!companyRelation.apply_user_id){
                    if(companyRelation.self_user_id){
                        //采购申请的
                        companyRelation.other_user_id = req.decoded.id;
                        companyRelation.apply_user_id = companyRelation.self_user_id;
                        companyRelation.approve_user_id = req.decoded.id;
                    }else{
                        //销售申请的
                        companyRelation.self_user_id = req.decoded.id;
                        companyRelation.apply_user_id = companyRelation.other_user_id;
                        companyRelation.approve_user_id = req.decoded.id;
                    }
                }
                // }
                companyRelation.type = config_common.relation_type.ACCEPT;
                companyRelation.save(function(err){
                    if(err){
                        return cb(err);
                    }
                    cb(null, companyRelation, companylist);
                });
            });
        },
        function(companyRelation, companylist, cb){
            switch (companylist.type){
                case config_common.company_category.TRADE:
                    http.sendTradeServerNoToken(req, {
                        related_id: other_company_id,
                        company_id: self_company_id
                    }, config_api_url.trade_server_demand_update_offer_range);
                    http.sendTradeServerNoToken(req, {
                        related_id: other_company_id,
                        company_id: self_company_id
                    }, config_api_url.trade_server_price_ask_update_offer_range);
                    break;
                case config_common.company_category.TRAFFIC:
                    http.sendTrafficServerNoToken(req, {company_id:other_company_id, add:true},
                        config_api_url.traffic_server_edit_traffic_demand_verify_company);
                    http.sendTrafficServerNoToken(req, {company_id:other_company_id, add:true},
                        config_api_url.traffic_server_price_ask_edit_verify_company);
                    break;
            }
            cb(null, companyRelation);
        }
    ], function(err, companyRelation){
        if(err){
            return callback(err);
        }
        callback(null, companyRelation);
    });
};

exports.getOne = function (data, cb) {
    companyRelationDB.getOne(data, cb);
};

exports.getCount = function (data, cb) {
    companyRelationDB.getCount(data, cb);
};

exports.getList = function (data, cb) {
    companyRelationDB.getList(data, cb);
};

exports.add = function (data, cb) {
    companyRelationDB.add(data, cb);
};

exports.del = function (data, cb) {
    companyRelationDB.del(data, cb);
};





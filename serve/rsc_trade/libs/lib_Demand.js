/**
 * Created by Administrator on 2017/2/27.
 */
var model = require('../dbs/db_base');
model = model('Demand');
var _ = require('underscore');
var async = require('async');

var config_common = global.config_common;

var lib_User = require('../libs/lib_User');
exports.add = function (data, callback) {
    model.add(data, callback);
};

exports.addList = function (data, callback) {
    model.addList(data, callback);
};

exports.getOne = function (data, callback) {
    model.getOne(data, callback);
};

exports.getList = function (data, callback) {
    model.getList(data, callback);
};
exports.update = function (cond, callback) {
    model.update(cond, callback);
};
exports.getListAndCount = function (page, data, callback) {
    async.waterfall([
        function (cb) {
            model.getCount(data.find, cb);
        },
        function (count, cb) {
            model.getList(data, function (err, result) {
                if (err) {
                    return cb(err);
                }
                cb(null, {
                    exist: count > config_common.entry_per_page * page,
                    list: JSON.parse(JSON.stringify(result)),
                    count: count
                });
            });
        }
    ], callback);
};

exports.getCount = function (cond, callback) {
    model.getCount(cond, callback);
};


exports.edit = function (data, callback) {
    model.edit(data, callback)
};
exports.del = function (data, callback) {
    model.del(data, callback)
};


exports.insertDemandCount = function (entry, callback) {
    var list = [];
    async.waterfall([
        function (cb) {
            async.eachSeries(entry.list, function (demand, cbk) {
                var query = {
                    user_id: demand.user_id,
                    status: global.config_model.demand_status.published
                };
                model.getCount(query, function (err, result) {
                    if (err) {
                        return next(err);
                    }
                    demand.demandCount = result;
                    list.push(demand);
                    cbk();
                })
            }, cb);
        }
    ], function (err) {
        if (err) {
            return callback(err);
        }
        entry.list = list;
        callback(null, entry);
    });
};


exports.getUpdateCount = function (req, callback) {
    var query = {
        status: global.config_model.demand_status.published
    };
    async.waterfall([
        function (cb) {
            //查询自己与某公司的列表更新时间
            query.company_id = req.body.company_id;
            global.lib_Relationship.relationCheck(req, {
                param: 'time_creation',
                type: global.config_model.relationship_type.trade_demand
            }, query, cb);
        },
        function (length, cb) {
            if (length === 0) {
                cb(null, null);
            } else {
                lib_User.getWorkRelationList(req, global.config_model.company_type.PURCHASE, cb);
            }
        },
        function (data, cb) {
            if (!data) {
                cb(null, 0);
            } else {
                query.user_id = {$in: data};
                model.getCount(global.middleware.getDoubleLayerQuery(req.body, query), cb);
            }
        }
    ], callback);
};
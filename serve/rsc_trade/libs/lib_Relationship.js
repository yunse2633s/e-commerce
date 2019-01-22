/**
 * Created by Administrator on 2017/3/15.
 */
var model = require('../dbs/db_base');
model = model('Relationship');

var async = require('async');
var config_model = global.config_model;
/**
 * 报价查询自己与某公司的列表更新时间
 * @param req
 * @param query
 * @param callback
 * @param isRemain
 */
exports.offerCheck = function (req, query, callback, isRemain) {
    async.waterfall([
        function (cb) {
            model.getOne({
                find: {
                    user_id: req.decoded.id,
                    company_id: req.body.company_id,
                    type: config_model.relationship_type.trade_offer
                }
            }, cb);
        },
        function (relationship, cb) {
            if (relationship) {
                if (req.body.update) {
                    relationship.update_time = new Date();
                    model.edit(relationship, cb);
                } else if (isRemain) {
                    query.time_update = {$gte: relationship.update_time};
                    cb();
                } else {
                    query.time_update = {$lte: relationship.update_time};
                    cb();
                }
            } else {
                model.add({
                    user_id: req.decoded.id,
                    company_id: req.body.company_id,
                    update_time: new Date(),
                    type: config_model.relationship_type.trade_offer
                }, cb);
            }
        }
    ], function (err) {

        if (err) return callback(err);
        callback();
    });
};
exports.relationCheck = function (req, data, query, callback) {
    async.waterfall([
        function (cb) {
            model.getOne({
                find: {
                    user_id: req.decoded.id,
                    company_id: req.body.company_id,
                    type: data.type
                }
            }, cb);
        },
        function (relationship, cb) {
            if (relationship) {
                query[data.param] = {$gte: relationship.update_time};
                cb(null, null);
            } else {
                cb(null, 0);
            }
        }
    ], callback);
};

/**
 * 抢单查询自己与某公司的列表更新时间
 * @param req
 * @param query
 * @param callback
 * @param isRemain
 */
exports.demandCheck = function (req, query, callback, isRemain) {
    async.waterfall([
        function (cb) {
            model.getOne({
                find: {
                    user_id: req.decoded.id,
                    company_id: req.body.company_id,
                    type: config_model.relationship_type.trade_demand
                }
            }, cb);
        },
        function (relationship, cb) {
            if (relationship) {
                if (req.body.update) {
                    relationship.update_time = new Date();
                    model.edit(relationship, cb);
                } else if (isRemain) {
                    query.time_creation = {$gte: relationship.update_time};
                    cb();
                } else {
                    query.time_creation = {$lte: relationship.update_time};
                    cb();
                }
            } else {
                model.add({
                    user_id: req.decoded.id,
                    company_id: req.body.company_id,
                    update_time: new Date(),
                    type: config_model.relationship_type.trade_demand
                }, cb);
            }
        }
    ], function (err) {
        if (err) return callback(err);
        callback();
    });
};

/**
 * 添加订单时间
 * @param objArr
 * @param callback
 */
exports.orderCheckAdd = function (objArr, callback) {
    if (!callback) callback = function () {
    };
    async.eachSeries(objArr, function (obj, cbk) {
        async.waterfall([
            function (cb) {
                model.getOne({
                    find: {
                        user_id: obj.id,
                        company_id: obj.company_id,
                        type: obj.relationship_type
                    }
                }, cb);
            },
            function (result, cb) {
                if (!result) {
                    model.add({
                        user_id: obj.id,
                        company_id: obj.company_id,
                        update_time: new Date(),
                        type: obj.relationship_type
                    }, cb);
                } else {
                    cb();
                }
            }
        ], cbk);
    }, callback);
};


exports.orderCheckUpdate = function (obj, query, callback, update) {
    if (!callback) callback = function () {
    };
    if (!query) query = {};
    async.waterfall([
        function (cb) {
            model.getOne({
                find: {
                    user_id: obj.id,
                    company_id: obj.company_id,
                    type: obj.relationship_type
                }
            }, cb);
        },
        function (result, cb) {
            if (result) {
                if (update) {
                    result.update_time = new Date();
                    model.edit(result, cb);
                } else {
                    query.time_update_step = {$gt: result.update_time};
                    cb();
                }
            } else {
                query.time_update_step = {$gt: new Date()};
                cb();
            }
        }
    ], function () {
        callback();
    });
};


/**
 * 订单查询自己与某公司的列表更新时间
 * @param req
 * @param query
 * @param callback
 */
exports.planCheck = function (req, query, callback) {
    if (!callback) {
        callback = function () {
        };
        query = {};
        req.body.update = true;
    }
    async.waterfall([
        function (cb) {
            model.getOne({
                find: {
                    user_id: req.decoded.id,
                    type: config_model.relationship_type.plan
                }
            }, cb);
        },
        function (relationship, cb) {
            if (relationship) {
                if (req.body.update) {
                    relationship.update_time = new Date();
                    model.edit(relationship, cb);
                } else {
                    query.time_creation = {$gte: relationship.update_time};
                    cb();
                }
            } else {
                model.add({
                    user_id: req.decoded.id,
                    update_time: new Date(),
                    type: config_model.relationship_type.plan
                }, cb);
            }
        }
    ], function (err) {
        if (err) return callback(err);
        callback();
    });
};


exports.getOne = function (data, callback) {
    model.getOne(data, callback);
};

exports.getList = function (data, callback) {
    model.getList(data, callback);
};
exports.add = function (data, callback) {
    model.add(data, callback);
};
exports.edit = function (data, callback) {
    model.edit(data, callback);
};

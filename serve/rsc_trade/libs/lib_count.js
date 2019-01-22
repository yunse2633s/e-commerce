/**
 * Created by Administrator on 17/8/25.
 */

var async = require('async');
var _ = require('underscore');

var lib_shop = require('../libs/lib_shop');
var lib_PriceOffer = require('../libs/lib_PriceOffer');
var lib_Demand = require('../libs/lib_Demand');
var lib_User = require('../libs/lib_User');
var lib_Relationship = require('../libs/lib_Relationship');
var lib_DemandOrder = require('../libs/lib_DemandOrder');

var mw = require('../libs/middleware');
exports.get_offerAgain = function (decoded, callback) {
    async.parallel({
        pricing: function (cb) {
            lib_shop.getCount({
                user_demand_id: decoded.id,
                order_id: ''
            }, cb);
        },
        bidding: function (cb) {
            lib_PriceOffer.getCount({list_offer: decoded.id, status: global.config_model.offer_status.published}, cb);
        }
    }, callback);
};
exports.get_planCount = function (req,callback) {
    var query = {};
    async.waterfall([
        function (cb) {
            global.lib_Relationship.planCheck(req, query, cb);
        },
        function (cb) {
            async.parallel({
                pricing: function (cbk) {
                    lib_shop.getCount(_.extend({
                        user_demand_id: req.decoded.id,
                        order_id: ''
                    }, query), cbk);
                },
                bidding: function (cbk) {
                    lib_PriceOffer.getCount(_.extend({
                        list_offer: req.decoded.id,
                        status: global.config_model.offer_status.published
                    }, query), cbk);
                }
            }, cb);
        }
    ], callback);
};

exports.getDemandRemind = function (req, callback) {
    var query = {status: global.config_model.offer_status.published};
    var obj = {};
    async.waterfall([
        function (cb) {
            lib_User.getWorkRelationCompanyList(req, global.config_model.company_type.PURCHASE, cb, true);
        },
        function (list, cb) {
            async.eachSeries(list, function (company_id, cbk) {
                async.waterfall([
                    function (cback) {
                        lib_User.getCompanyOne({find: {_id: company_id}}, cback);
                    },
                    function (company, cback) {
                        req.body.company_id = company_id;
                        if(company)req.body.material = company['buy'];
                        lib_Relationship.demandCheck(req, query, cback, true);
                    },
                    function (cback) {
                        global.lib_User.getWorkRelationList(req, global.config_model.company_type.PURCHASE, cback, true);
                    },
                    function (result, cback) {
                        lib_Demand.getCount(global.middleware.getDoubleLayerQuery(req.body, _.extend(query, {user_id: {$in: result}})), cback);
                    },
                    function (result, cback) {
                        obj[company_id] = result;
                        cback();
                    }
                ], cbk);
            }, cb);
        }
    ], function (err) {
        if (err) return callback(err);
        callback(null, obj);
    });
};

exports.getOfferRemind = function (req, callback) {
    var query = {status: global.config_model.offer_status.published}, obj = {};
    async.waterfall([
        function (cb) {
            lib_User.getWorkRelationCompanyList(req, global.config_model.company_type.SALE, cb, true);
        },
        function (list, cb) {
            async.eachSeries(list, function (company_id, cbk) {
                async.waterfall([
                    function (cback) {
                        lib_User.getCompanyOne({find: {_id: company_id}}, cback);
                    },
                    function (company, cback) {
                        req.body.company_id = company._id.toString();
                        if (company.city) req.body.city = company.city;
                        if (company.province) req.body.province = company.province;
                        if (company['sell']) req.body.material = company['sell'];
                        lib_Relationship.offerCheck(req, query, cback, true);
                    },
                    function (cback) {
                        global.lib_User.getWorkRelationList(req, global.config_model.company_type.SALE, cback, true);
                    },
                    function (result, cback) {
                        lib_PriceOffer.getCountByParam(req, {find: query}, mw.getCityQuery(req.body, {user_id: {$in: result}}), cback);
                    },
                    function (result, cback) {
                        obj[company_id] = result;
                        cback();
                    }
                ], cbk);
            }, cb);
        }
    ], function (err) {
        if (err) return callback(err);
        callback(null, obj);
    });
};

exports.getOrderRemind = function (decoded, type, callback) {
    var ineffective = {status: 'ineffective'};
    ineffective['user_' + type + '_id'] = decoded.id;
    var effective = {status: 'effective'};
    effective['user_' + type + '_id'] = decoded.id;
    var complete = {status: 'complete'};
    complete['user_' + type + '_id'] = decoded.id;
    var cancelled = {status: 'cancelled'};
    cancelled['user_' + type + '_id'] = decoded.id;
    async.parallel({
        ineffective: function (cbk) {
            async.waterfall([
                function (cback) {
                    global.lib_Relationship.orderCheckUpdate({
                        id: decoded.id,
                        company_id: decoded.company_id,
                        relationship_type: 'trade_' + type + '_ineffective'
                    }, ineffective, cback);
                },
                function (cback) {
                    lib_DemandOrder.getCount(ineffective, cback);
                }
            ], cbk);

        },
        effective: function (cbk) {
            async.waterfall([
                function (cback) {
                    global.lib_Relationship.orderCheckUpdate({
                        id: decoded.id,
                        company_id: decoded.company_id,
                        relationship_type: 'trade_' + type + '_effective'
                    }, effective, cback);
                },
                function (cback) {
                    lib_DemandOrder.getCount(effective, cback);
                }
            ], cbk);
        },
        complete: function (cbk) {
            async.waterfall([
                function (cback) {
                    global.lib_Relationship.orderCheckUpdate({
                        id: decoded.id,
                        company_id: decoded.company_id,
                        relationship_type: 'trade_' + type + '_complete'
                    }, complete, cback);
                },
                function (cback) {
                    lib_DemandOrder.getCount(complete, cback);
                }
            ], cbk);
        },
        cancelled: function (cbk) {
            async.waterfall([
                function (cback) {
                    global.lib_Relationship.orderCheckUpdate({
                        id: decoded.id,
                        company_id: decoded.company_id,
                        relationship_type: 'trade_' + type + '_cancelled'
                    }, cancelled, cback);
                },
                function (cback) {
                    lib_DemandOrder.getCount(cancelled, cback);
                }
            ], cbk);
        }
    }, callback);
};

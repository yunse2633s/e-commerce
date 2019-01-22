/**
 * Created by Administrator on 17/5/4.
 */


var model = require('../dbs/db_base');
model = model('DemandOffer');
var _ = require('underscore');
var async = require('async');
var config_error = global.config_error;
var config_common = global.config_common;
var lib_Demand = require('../libs/lib_Demand');

exports.add = function (req, data, callback) {
    var demandOffer;
    async.waterfall([
        function (cb) {
            model.add(data, cb);
        },
        function (offerAgain, count, cb) {
            demandOffer = offerAgain;
            lib_Demand.update({
                find: {_id: offerAgain.demand_id},
                set: {$inc: {count_offer: 1}, $addToSet: {list_offer: req.decoded.id}}
            }, cb);
        },
        function (result, cb) {
            lib_Demand.getOne({
                find: {_id: demandOffer.demand_id}
            }, cb);
        }
    ], function (err, result) {
        if (err) return callback(err);
        global.lib_Statistical.statistical_server_companyTrade_add(req, {
            companyObj: [{
                id: req.decoded.company_id,
                type: global.config_model.statistical_type.sale_demandOffer,
                count: result.list_offer.length === 1 ? 1 : 0,
                category: result.product_categories[0].layer['layer_1']
            }, {
                id: demandOffer.company_demand_id,
                type: global.config_model.statistical_type.demand_bid,
                user_id: req.decoded.id
            }]
        });
        callback(null, demandOffer);
    });
};
exports.edit = function (data, callback) {
    model.edit(data, callback);
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
                    list: result,
                    count: count
                });
            })
        }
    ], callback);
};
exports.getCount = function (cond, callback) {
    model.getCount(cond, callback);
};
exports.del = function (data, callback) {
    model.del(data, callback)
};



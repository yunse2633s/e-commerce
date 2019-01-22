/**
 * Created by Administrator on 17/5/15.
 */
var model = require('../dbs/db_base');
model = model('OfferAgain');
var async = require('async');
var _ = require('underscore');

var config_common = global.config_common;
var lib_PriceOffer = require('../libs/lib_PriceOffer');

exports.add = function (req, data, callback) {
    var offerAgain;
    async.waterfall([
        function (cb) {
            model.add(data, cb);
        },
        function (entry, count, cb) {
            offerAgain = entry;
            lib_PriceOffer.update({
                find: {_id: offerAgain.offer_id},
                set: {$inc: {count_offer: 1}, $addToSet: {list_offer: req.decoded.id}}
            }, cb);
        },
        function (offer, cb) {
            lib_PriceOffer.getOne({
                find: {_id: offerAgain.offer_id}
            }, cb);
        }
    ], function (err, result) {
        if (err) {
            return callback(err);
        }
        global.lib_Statistical.statistical_server_companyTrade_add(req, {
            companyObj: [{
                id: req.decoded.company_id,
                type: global.config_model.statistical_type.purchase_offerAgain,
                count: result.list_offer === 1 ? 1 : 0,
                category: result.product_categories[0].layer['layer_1']
            }, {
                id: offerAgain.company_supply_id,
                type: global.config_model.statistical_type.bidding_bid,
                user_id: req.decoded.id
            }]
        });
        callback(null, offerAgain);
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
exports.getAggregate = function (cond, callback) {
    model.group(cond, callback);
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


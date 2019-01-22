/**
 * Created by Administrator on 17/5/4.
 */
var model = require('../dbs/db_base');
model = model('PassPrice');
var _ = require('underscore');
var async = require('async');
var config_error = global.config_error;
var config_common = global.config_common;
var lib_priceOfferCity = require('../libs/lib_priceOfferCity');
var lib_PriceOffer = require('../libs/lib_PriceOffer');


exports.add = function (data, callback) {
    model.add(data, callback);
};
exports.edit = function (data, callback) {
    async.waterfall([
        function (cb) {
            model.edit(data, cb);
        },
        function (result, count, cb) {
            lib_priceOfferCity.del({PID: result._id.toString()}, cb);
        },
        function (result, cb) {
            var priceOfferCity = [];
            data.price_routes.forEach(function (offerCity) {
                offerCity['passPrice_id'] = [result._id.toString()];
                offerCity['user_id'] = data.user_id;
                if (offerCity._id) delete offerCity._id;
                priceOfferCity.push(offerCity);
            });
            lib_priceOfferCity.addList(priceOfferCity, cb);
        }
    ], callback);
    model.edit(data, callback);
};

exports.passPriceEdit = function (req, cond, callback) {
    if (req.body.pass_type == "DJ") {
        req.body.pass_type = "sale";
    }
    var entry;
    var obj;
    var edit = {
        id: 'id',
        _id: '_id',
        price_routes: 'price_routes'
    };
    async.waterfall([
        function (cb) {
            model.getOne({
                find: cond
            }, cb);
        },
        function (passPrice, cb) {
            if (!passPrice) return cb(config_error.invalid_id);
            entry = passPrice;
            for (var index in req.body) {
                if (req.body.hasOwnProperty(index) && _.allKeys(passPrice).indexOf(index) >= 0 && !edit[index]) {
                    passPrice[index] = req.body[index];
                }
            }
            model.edit(entry, cb);
        },
        function (result, count, cb) {
            obj = result;
            lib_priceOfferCity.del({passPrice_id: entry._id.toString()}, cb);
        },
        function (result, cb) {
            var priceOfferCity = [];
            req.body.price_routes.forEach(function (offerCity) {
                offerCity['passPrice_id'] = [obj._id];
                offerCity['user_id'] = req.body.user_id;
                if (offerCity._id) delete offerCity._id;
                priceOfferCity.push(offerCity);
            });
            lib_priceOfferCity.addList(priceOfferCity, cb);
        }
    ], function (err) {
        if (err)return callback(err);
        async.waterfall([
            function (cb_w) {
                lib_PriceOffer.getList({find: {passPrice_id: obj._id}}, cb_w);
            },
            function (list, cb_w) {
                lib_shop.getList({find: {offer_id: {$in: _.pluck(list, '_id')}}}, cb_w);
            },
            function (shopList, cb_w) {
                async.eachSeries(shopList, function (oneData, cb_l) {
                    oneData.status = true;
                    oneData.save();
                    cb_l();
                }, cb_w);
            }
        ], function (err) {
            if (err) {
                console.log('passPriceEdit_err:', err);
            }
        })
        callback(null, obj);
    });
};

exports.getOne = function (data, callback) {
    var resultObj;
    async.waterfall([
        function (cb) {
            model.getOne(data, cb);
        },
        function (result, cb) {
            if (!result) {
                return cb('not_found');
            }
            resultObj = JSON.parse(JSON.stringify(result));
            lib_priceOfferCity.getList({
                find: {passPrice_id: result._id.toString()}
            }, cb);
        },
        function (result, cb) {
            cb(null, _.extend(resultObj, {price_routes: result}));
        }
    ], callback);

};

exports.getList = function (data, callback) {
    model.getList(data, callback);
};
exports.update = function (cond, callback) {
    model.update(cond, callback);
};
exports.getListAndCount = function (page, data, callback) {
    var resultArr = [];
    async.waterfall([
        function (cb) {
            model.getCount(data.find, cb);
        },
        function (count, cb) {
            async.waterfall([
                function (cbk) {
                    model.getList({find: data.find}, cbk)
                },
                function (result, cbk) {
                    async.eachSeries(result, function (entry, cback) {
                        entry = JSON.parse(JSON.stringify(entry));
                        async.waterfall([
                            function (back) {
                                lib_priceOfferCity.getList({
                                    find: {passPrice_id: entry._id.toString()}
                                }, back);
                            },
                            function (pass, back) {
                                entry.price_routes = pass;
                                resultArr.push(entry);
                                back();
                            }
                        ], cback);
                    }, function (err) {
                        if (err) return cbk(err);
                        cbk(null, {
                            exist: count > config_common.entry_per_page * page,
                            count: count,
                            list: resultArr
                        });
                    });
                }
            ], cb);
        }
    ], callback);
};
exports.getCount = function (cond, callback) {
    model.getCount(cond, callback);
};
exports.del = function (data, callback) {
    model.del(data, callback);
};






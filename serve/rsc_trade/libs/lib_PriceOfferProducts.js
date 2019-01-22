/**
 * Created by Administrator on 17/6/15.
 */
var model = require('../dbs/db_base');
model = model('PriceOfferProducts');
var async = require('async');
var _ = require('underscore');

var shortid = require('js-shortid');

var lib_ProductName = require('../libs/lib_ProductName');
var lib_Tonnage = require('../libs/lib_Tonnage');
var lib_Classify = require('../libs/lib_Classify');
exports.addOnly = function (data, callback) {
    async.waterfall([
        function (cb) {
            model.add(data, cb);
        }
    ], callback);
};
exports.add = function (data, callback) {
    var CID = [];
    async.waterfall([
        function (cb) {
            async.eachSeries(data.product_name, function (product, cbk) {
                async.waterfall([
                    function (cback) {
                        if (product._id) delete product._id;
                        lib_ProductName.add(product, cback);
                    },
                    function (result, count, cback) {
                        CID.push(result._id.toString());
                        cback();
                    }
                ], cbk);
            }, cb);
        },
        function (cb) {
            model.add(_.extend(data, {product_name: CID}), cb);
        }
    ], callback);
};
exports.addList = function (data, callback) {
    var result = [];
    async.eachSeries(data, function (obj, back) {
        var CID = [];
        async.waterfall([
            function (cb) {
                var obj_arr = _.values(obj.layer);
                async.eachSeries(obj.product_name, function (product, cbk) {
                    async.waterfall([
                        function (cback) {
                            if (product.amount_unit) {
                                lib_Tonnage.update({
                                    find: {
                                        company_id: obj.company_id,
                                        PID: obj.for_liji,
                                        name: obj_arr[obj_arr.length - 1],
                                        product_name: product.name
                                    },
                                    set: {value: product.amount_unit}
                                }, cback);
                            } else {
                                cback(null, null);
                            }
                        },
                        function (result, cback) {
                            if (result) {
                                lib_Classify.getOne({find: {_id: data[0].for_liji}}, function (err, data1) {
                                    if (data1) {
                                        if (data1.unit_metering) {
                                            if (result.n === 0) {
                                                lib_Tonnage.add({
                                                    company_id: obj.company_id,
                                                    PID: obj.for_liji,
                                                    name: obj_arr[obj_arr.length - 1],
                                                    value: product.amount_unit,
                                                    product_name: product.name
                                                });
                                                cback();
                                            } else {
                                                cback();
                                            }
                                        } else {
                                            cback();
                                        }
                                    } else {
                                        cback();
                                    }
                                });
                            } else {
                                cback();
                            }
                        },
                        function (cback) {
                            if (product._id) delete product._id;
                            product = JSON.parse(JSON.stringify(product));
                            if (!product.short_id) {
                                product.short_id = shortid.gen();
                            }
                            lib_ProductName.add(product, cback);
                        },
                        function (result, count, cback) {
                            CID.push(result._id.toString());
                            cback();
                        },
                    ], cbk);
                }, cb);
            },
            function (cb) {
                model.add(_.extend(obj, {product_name: CID}), cb);
            },
            function (entry, count, cb) {
                result.push(entry);
                cb();
            }
        ], back);
    }, function (err) {
        if (err) return callback(err);
        callback(null, result);
    });

};
exports.getOne = function (data, callback) {
    model.getOne(data, callback);
};
exports.getList = function (data, callback, cond) {
    var list = [];
    async.waterfall([
        function (cb) {
            model.getList(data, cb);
        },
        function (result, cb) {
            async.eachSeries(result, function (obj, back) {
                lib_ProductName.getList({
                    find: cond ? _.extend({_id: {$in: obj.product_name}}, cond) : {_id: {$in: obj.product_name}}
                }, function (err, arr) {
                    if (err) return back(err);
                    obj.product_name = arr;
                    if (arr.length) list.push(obj);
                    back();
                });
            }, cb);
        }
    ], function (err) {
        if (err) return callback(err);
        callback(null, list);
    });
};

exports.getListAndCount = function (page, data, callback) {
    var list = [];
    async.waterfall([
        function (cb) {
            model.getCount(data.find, cb);
        },
        function (count, cb) {
            async.waterfall([
                function (cbk) {
                    model.getList(data, cbk);
                },
                function (result, cbk) {
                    async.eachSeries(result, function (obj, back) {
                        lib_ProductName.getList({
                            find: {_id: {$in: obj.product_name}}
                        }, function (err, arr) {
                            if (err) return back(err);
                            obj.product_name = arr;
                            list.push(obj);
                            back();
                        });
                    }, function (err) {
                        if (err) {
                            return cbk(err);
                        }
                        cbk(null, {
                            exist: count > global.config_common.entry_per_page * page,
                            count: count,
                            list: list
                        });
                    });
                }
            ], cb);
        }
    ], callback);
};
exports.update = function (cond, callback) {
    model.update(cond, callback);
};
exports.del = function (cond, callback) {
    model.del(cond, callback);
};

/**
 * Created by Administrator on 17/6/19.
 */
var model = require('../dbs/db_base');
model = model('Classify');
var _ = require('underscore');
var async = require('async');
var lib_PriceOfferProducts = require('../libs/lib_PriceOfferProducts');
var lib_ProductConfig = require('../libs/lib_ProductConfig');
var lib_Classify = require('../libs/lib_Classify');
exports.add = function (data, callback) {
    model.add(data, callback);
};

exports.getOne = function (data, callback) {
    model.getOne(data, callback);
};

exports.getList = function (data, callback) {
    model.getList(data, callback);
};

exports.getCount = function (data, callback) {
    model.getCount(data, callback);
};

exports.update = function (cond, callback) {
    model.update(cond, callback);
};

var checkObj = {
    unit: 1,
    material: 1
};

var checkCategory = {
    material: 1
};

/**
 * 检验产品分类是否正确并存储   自动填补中文部分
 * @param data       [{},{}]
 * @param idObj   单子的id
 * @param callback
 */
exports.checkProduct = function (data, idObj, callback) {
    var obj = {};
    var list = [];
    for (var index in checkObj) {
        if (checkObj.hasOwnProperty(index)) if (_.uniq(_.values(_.pluck(_.clone(data), index))).length !== 1) {
            return callback(global.config_error.invalid_format + ':' + index);
        }
    }
    var PID = [];
    async.eachSeries(data, function (dataObj, cbk) {
        obj = {};
        if (dataObj._id) delete dataObj._id;
        async.eachSeries(_.allKeys(dataObj), function (index, cb) {
            if ((index.split('_').length === 2 && index.split('_')[0] === 'layer' || checkCategory[index])) {
                lib_Classify.getOne({
                    find: {eng: dataObj[index]}
                }, function (err, result) {
                    if (err) return cb(err);
                    if (result) {
                        result = JSON.parse(JSON.stringify(result));
                        obj[index + '_chn'] = result['chn'];
                        obj[index] = result['eng'];
                        delete dataObj[index];
                        PID.push(result._id.toString());
                    }
                    cb();
                });
            } else {
                cb();
            }
        }, function (err) {
            if (err) return cbk(err);
            async.waterfall([
                function (cback) {
                    async.parallel({
                        replenish: function (cb) {
                            lib_ProductConfig.getCount({
                                name: '补货',
                                PID: {$in: PID},
                                status: 'other'
                            }, cb);
                        },
                        modify_amount: function (cb) {
                            lib_ProductConfig.getCount({
                                name: '补货吨数',
                                PID: {$in: PID},
                                status: 'other'
                            }, cb);
                        }
                    }, cback);
                },
                function (result, cback) {
                    result.replenish = true;    //!!result.replenish;所有东西都可以补货
                    result.modify_amount = !!result.modify_amount;
                    list.push(_.extend({layer: obj}, dataObj, idObj ? {
                        PID: [idObj.id.toString()],
                        user_id: idObj.user_id,
                        company_id: idObj.company_id
                    } : {}, result));
                    cback();
                }
            ], cbk);
        });
    }, function (err) {
        if (err) return callback(err);
        callback(null, list);
    });

};
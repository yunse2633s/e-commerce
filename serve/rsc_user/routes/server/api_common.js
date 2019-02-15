/**
 * Created by Administrator on 17/4/27.
 */
var async = require('async');
var _ = require('underscore');
var express = require('express');
var decimal = require('decimal');

var obj = {
    getOne: 'getOne',
    getCount: 'getCount',
    getList: 'getList',
    add: 'add'
};

module.exports = function () {

    var api = express.Router();

    api.use(require('../../middlewares/mid_verify_server')());

    api.post('/get', function (req, res, next) {
        if (!obj[req.body.method] || !req.body.cond || !req.body.model) {
            return next('invalid_format');
        }
        var model = require('../../dbs/db_base')(req.body.model);
        async.waterfall([
            function (cb) {
                model[req.body.method](req.body.cond, cb);
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            global.config_common.sendData(req, result, next);
        });
    });

    api.post('/gets', function (req, res, next) {
        if (!obj[req.body.method] || !_.isArray(req.body.conds) || !req.body.model) {
            return next('invalid_format');
        }
        var model = require('../../dbs/db_base')(req.body.model);
        async.mapSeries(req.body.conds, function(cond, cb){
            model[req.body.method](cond, cb);
        }, function (err, result) {
            if (err) {
                return next(err);
            }
            global.config_common.sendData(req, result, next);
        });
    });
    
    /**
     * 仓库吨数的变化接口, 假设条件仓库柜中只能存放一种商品;[20171021]
     */
    api.post('/modify_store_amount', function(req, res, next){
        async.waterfall([
            function (cb) {
                var flag = true;
                //仓库为提货还是入库，是增还是减
                var judgeFilder = ['operate', 'store_id', 'store_unit_id', 'amount'];//, 'catalogue',
                _.each(judgeFilder, function (a) {
                    if(!req.body[a]){
                        flag = false;
                        return cb('invalid_format_'+a);
                    }
                });
                if(flag){
                    cb();
                }

            }, function (cb) {
                //查询交易订单或物流订单；
                global.lib_store_unit.getOne({
                    find: {
                        store_id: req.body.store_id,
                        unit_id: req.body.store_unit_id
                    }
                }, cb);
            }, function (product, cb) {
                if(product){
                    if(req.body.operate == 'add'){
                        // 交货增加时通过物流订单查询，增加交易仓库吨数
                        product.amount = decimal(product.amount.toString()).add(req.body.amount.toString()).toNumber();
                    }else{
                        // 提货减少时通过交易订单查询，减少交易仓库吨数
                        product.amount = decimal(product.amount.toString()).sub(req.body.amount.toString()).toNumber();
                    }
                    product.time_modify = new Date();
                    product.save(cb);
                }else{
                    if(!req.body.product_categories){
                        return cb('invalid_format_product_categories');
                    }
                    req.body.material = req.body.product_categories[0].material;
                    //提取产品目录，假设不考虑是否有存货。
                    var unit_product = {
                        unit_id: req.body.store_unit_id,
                        store_id: req.body.store_id,
                        material: req.body.material, //行业类别
                        catalogue: global.config_common.convertCatalogue(req.body.product_categories, 5, ''),
                        product_categories: req.body.product_categories, //产品详情
                        amount: req.body.amount,
                        time_creation: new Date(),
                        time_modify: new Date()
                    };
                    global.lib_store_product.add(unit_product, cb);
                }
            }
        ], function(err, result){
            if(err){
                return next(err);
            }
            global.config_common.sendData(req, result, next);
        });
    });

    return api;
};

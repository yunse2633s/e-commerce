/**
 * Created by Administrator on 17/4/15.
 */
var async = require('async');
var _ = require('underscore');

var config_error = global.config_error;
var config_common = global.config_common;

var lib_Tonnage = global.lib_Tonnage;
var lib_ProductClassify = global.lib_ProductClassify;


module.exports = function (app, express) {

    var api = express.Router();

    // 拦截非授权请求
    api.use(require('../../middlewares/mid_verify_user')());

    /**
     * 批量设置理记
     *
     * product   理记参数
     */
    api.post('/set', function (req, res, next) {
        async.waterfall([
            function (cb) {
                config_error.checkBody(req.body, ['product'], cb);
            },
            function (cb) {
                async.eachSeries(req.body.product, function (product, callback) {
                    async.waterfall([
                        function (cbk) {
                            lib_Tonnage.update({
                                find: {
                                    company_id: req.decoded.company_id,
                                    PID: product.PID,
                                    name: product.name,
                                    product_name: product.product_name
                                },
                                set: {value: product.value}
                            }, cbk);
                        },
                        function (result, cbk) {
                            if (result.n === 0) {
                                lib_Tonnage.add({
                                    company_id: req.decoded.company_id,
                                    PID: product.PID,
                                    name: product.name,
                                    value: product.value,
                                    product_name: product.product_name
                                }, cbk);
                            } else {
                                cbk(null, {});
                            }
                        }
                    ], callback);
                }, cb);
            }
        ], function (err) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, {}, next);
        });
    });

    /**
     * 单独设置添加理记
     */
    api.post('/add_weight', function (req, res, next) {
        async.waterfall([
            function (cb) {
                config_error.checkBody(req.body, ['PID', 'name', 'value', 'product_name'], cb);
            },
            function (cb) {
                lib_Tonnage.update({
                    find: {
                        company_id: req.decoded.company_id,
                        PID: req.body.PID,
                        name: req.body.name,
                        product_name: req.body.product_name
                    },
                    set: {value: req.body.value}
                }, cb);
            },
            function (result, cb) {
                if (result.n === 0) {
                    lib_Tonnage.add({
                        company_id: req.decoded.id,
                        PID: req.body.PID,
                        name: req.body.name,
                        value: req.body.value,
                        product_name: req.body.product_name
                    }, cb);
                } else {
                    cb(null, {});
                }
            }
        ], function (err, result) {
            if (err) return next(err);
            config_common.sendData(req, result, next);
        });
    });

    /**
     * 用户获取该公司理记重量
     *
     * company_id  公司id
     * name 属性名称
     * PID 父类id
     */
    api.post('/get', function (req, res, next) {
        async.waterfall([
            function (cb) {
                config_error.checkBody(req.body, ['company_id'], cb);
            },
            function (cb) {
                lib_Tonnage.getOne({
                    find: global.middleware.getProductByCompany(req.body, {company_id: req.body.company_id})
                }, cb);
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, result, next);
        });
    });

    /**
     * 用户根据layer获取到自己的理记信息
     */
    api.post('/get_list', function (req, res, next) {
        if(!req.body.company_id ||!req.body.layer){
            return next ("invalid_format")
        }
        var classifyData;
        async.waterfall([
            function (cb) {
                global.lib_Classify.getOne({find: {PID: "0", eng: req.body.layer.material}}, cb);
            },
            function (data, cb) {
                var count = _.keys(req.body.layer).length / 2 - 1;
                global.lib_common.getPID(count, 1, req.body.layer, data, cb);
            },
            function (ClassifyData, cb) {
                lib_Tonnage.getList({
                    find: {company_id: req.body.company_id, PID: ClassifyData.id}
                }, cb);
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, result, next);
        })
    });

    api.post('/random', function (req, res, next) {
        config_common.sendData(req, global.util.getRandom(9), next);
    });

    return api;
};


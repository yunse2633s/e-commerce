/**
 * Created by Administrator on 17/5/4.
 */
var async = require('async');

var config_common = global.config_common;
var config_model = global.config_model;

var lib_DemandOrder = global.lib_DemandOrder;
var lib_PriceOffer = global.lib_PriceOffer;
var lib_Demand = global.lib_Demand;

var offer_type = {
    DJ: 'DJ',
    JJ: {$in: ['JJ', 'DjJJ']}
};

module.exports = function (app, express) {

    var api = express.Router();

    // 拦截非授权请求
    api.use(require('../../middlewares/mid_verify_server')());

    /**
     * 获取名片上面的数据
     * types 需要获取的类型数组
     * company_ids 或者 user_ids  需要获取的用户或者公司id数组
     */
    api.post('/get_count', function (req, res, next) {
        var obj = {};
        async.eachSeries(req.body.company_ids ? req.body.company_ids : req.body['user_ids'], function (id, callback) {
            var result = {};
            async.waterfall([
                function (cb) {
                    async.eachSeries(req.body.types, function (type, cbk) {
                        var cond = {};
                        switch (type) {
                            case 'TRADE_OFFER' :
                            case 'DJ' :
                            case 'JJ': {
                                cond.status = config_model.offer_status.published;
                                cond['$or'] = [
                                    {user_id: id},
                                    {company_id: id}
                                ];
                                if (offer_type[type]) {
                                    cond.type = offer_type[type];
                                }
                                lib_PriceOffer.getCount(cond, function (err, count) {
                                    if (err) return next(err);
                                    result[type] = count;
                                    cbk();
                                });
                                break;
                            }
                            case 'TRADE_DEMAND': {
                                if (req.body.company_ids) {
                                    cond.company_id = id;
                                } else {
                                    cond.user_id = id;
                                }
                                cond.status = config_model.demand_status.published;
                                lib_Demand.getCount(cond, function (err, count) {
                                    if (err) return next(err);
                                    result[type] = count;
                                    cbk();
                                });
                                break;
                            }
                            case 'PURCHASE' :
                            case 'SALE': {
                                if (req.body['user_ids']) {
                                    cond = lib_DemandOrder.getQueryByType(type, id);
                                } else {
                                    cond = lib_DemandOrder.getCompanyQueryByType(type, id);
                                }
                                cond.status = global.config_model.order_status.complete;
                                lib_DemandOrder.getCount(cond, function (err, count) {
                                    if (err) return next(err);
                                    result[type] = count;
                                    cbk();
                                });
                                break;
                            }
                            default:
                                cbk();
                                break;
                        }
                    }, cb);
                }
            ], function (err) {
                if (err) {
                    return next(err);
                }
                obj[id] = result;
                callback();
            });
        }, function (err) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, obj, next);
        });
    });

    return api;
};
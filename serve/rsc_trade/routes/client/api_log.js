/**
 * Created by Administrator on 17/6/23.
 */
var async = require('async');

var config_common = global.config_common;
var config_error = global.config_error;

var lib_log = global.lib_log;

module.exports = function (app, express) {

    var api = express.Router();

    // 拦截非授权请求
    api.use(require('../../middlewares/mid_verify_user')());

    /**
     * 调价记录
     * file  文件
     */
    api.post('/get_list', function (req, res, next) {
        var page_num = req.body.page || 1;
        lib_log.getListAndCount(page_num, {
            find: {user_id: req.decoded.id, type: 'readjust'},
            skip: config_common.entry_per_page * (page_num - 1),
            limit: config_common.entry_per_page,
            sort: {time_creation: -1}
        }, function (err, result) {
            if (err) return next(err);
            config_common.sendData(req, result, next);
        })
    });

    /**
     * 某个调价记录下的报价列表
     * file  文件
     */
    api.post('/get_offer_list_by_log_id', function (req, res, next) {
        var page_num = req.body.page || 1;
        var price_remember_type;
        var price_weight_type;
        async.waterfall([
            function (cb) {
                config_error.checkBody(req.body, ['log_id'], cb);
            },
            function (cb) {
                lib_log.getOne({find: {_id: req.body.log_id, user_id: req.decoded.id}}, cb);
            },
            function (log, cb) {
                if(!log){
                    return cb(config_error.not_found);
                }
                for(var i = 0; i < log.content.length; i++){
                    if(log.content[i].type === '理计价'){
                        price_remember_type = true;
                    }else if(log.content[i].type === '过磅价'){
                        price_weight_type = true;
                    }
                }
                global.lib_PriceOffer.getListAndCount(page_num, {
                    find: {_id: {$in: log.offer_ids}},
                    skip: config_common.entry_per_page * (page_num - 1),
                    limit: config_common.entry_per_page,
                    sort: {time_creation: -1}
                }, cb);
            },
            function (result, cb) {
                for(var i = 0; i < result.list.length; i++){
                    var offer = result.list[i];
                    offer.price_remember_type = price_remember_type;
                    offer.price_weight_type = price_weight_type;
                }
                cb(null, result);
            }
        ], function (err, result) {
            if(err){
                return next(err);
            }
            config_common.sendData(req, result, next);
        });
    });

    /**
     * 优惠记录
     * page 页码
     */
    api.post('/get_preferential_list', function (req, res, next) {
        var page_num = req.body.page || 1;
        lib_log.getListAndCount(page_num, {
            find: {user_id: req.decoded.id, type: 'preferential'},
            skip: config_common.entry_per_page * (page_num - 1),
            limit: config_common.entry_per_page,
            sort: {time_creation: -1}
        }, function (err, result) {
            if (err) return next(err);
            config_common.sendData(req, result, next);
        })
    });

    return api;


};
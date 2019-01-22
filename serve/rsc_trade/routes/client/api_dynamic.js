/**
 * Created by Administrator on 2018\3\20 0020.
 * 功能：因为个人主页与企业主页的动态列表页需要筛选等功能，所以写在交易，省去跨域调用。
 */
var async = require('async');
var _ = require('underscore');
var mw = global.middleware;
module.exports = function (app, express) {

    var api = express.Router();
    // 拦截非授权请求
    //api.use(require('../../middlewares/mid_verify_user')());

    /**
     * 根据状态获取自己发布的报价竞价列表
     * status  默认有效
     * user_id   默认decoded
     * type  默认全部
     * sort 排序方式
     * material
     * layer_1
     * layer_2
     * layer_3
     */
    api.post('/get_list', function (req, res, next) {
        var user_server_common = '/api/server/common/get';
        var query = {}
        if (req.body.type == 'trade_pricing_DJ') {
            req.body.type = 'DJ';
            query.status = global.config_model.offer_status.published;
        }
        if (req.body.type == 'trade_pricing_JJ') {
            req.body.type = {$ne: 'DJ'};
        }

        var page_num = req.body.page || 1;

        if (req.body.user_id) {
            query.user_id = req.body.user_id
        } else {
            query.company_id = req.body.company_id
        }
        query.type = req.body.type;
        async.waterfall([
            function (cb) {
                console.log('query',query);
                global.lib_PriceOffer.getListByParam(
                    req, {
                        find: query,
                        skip: global.config_common.list_per_page * (page_num - 1),
                        limit: global.config_common.list_per_page,
                        sort: {time_creation: -1}
                    }, "", cb, page_num, req.body.type === global.config_model.offer_type.DJ, {});

            },
            function (result, cb) {
                async.eachSeries(result.list, function (list, cb) {
                    global.http.sendUserServer({
                        method: 'getOne',
                        cond: {find: {_id: list.location_storage}},
                        model: 'Address'
                    }, user_server_common, function(err,address){
                        list.site=address;
                        cb();
                    });
                }, function(err){
                    if(err){console.log('err',err)}
                    //给这个报价/竞价添加个人信息个公司信息
                    global.lib_common.addUserAndCompany_w(result.list, function (err, data) {
                        if (err) {
                            console.log('err:', err);
                        }
                        result.list = data;
                        cb(null, result);
                    });
                });
            }
        ], function (err, result) {
            console.log('result',result);
            if (err) {
                return next(err);
            }
            config_common.sendData(req, result, next);
        });
    });

    return api;
};
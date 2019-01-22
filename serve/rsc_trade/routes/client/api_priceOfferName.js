/**
 * Created by Administrator on 17/6/24.
 */
var async = require('async');
var _ = require('underscore');

var config_common = global.config_common;

var lib_shop = global.lib_shop;
var lib_ProductName = global.lib_ProductName;
var lib_PriceOfferProducts = global.lib_PriceOfferProducts;
var lib_common = global.lib_common;
var lib_log = global.lib_log;
var lib_Tonnage = global.lib_Tonnage;
var request=require('request');
module.exports = function (app, express) {

    var api = express.Router();

    // 拦截非授权请求
    api.use(require('../../middlewares/mid_verify_user')());

    /**
     * 价格调价
     * ids    id数组、
     * type   过磅或者理记
     * price  调价额度
     */
    api.post('/readjust', function (req, res, next) {
        var log;
        var offer_ids;
        async.waterfall([
            function (cb) {
                global.config_error.checkBody(req.body, ['price', 'ids'], cb);
            },
            function (cb) {
                if (!req.body.status) req.body.price = -req.body.price;
                async.eachSeries(req.body.ids, function (id, callback) {
                    var jiLuData;
                    async.waterfall([
                        function (back) {
                            lib_ProductName.getOne({
                                find: {_id: id}
                            }, back);
                        },
                        function (result, back) {
                            jiLuData = result;
                            var set = {$inc: {}};
                            if (req.body.price_type && result[req.body.price_type]) {
                                set['$inc'][req.body.price_type] = req.body.price;
                            } else {
                                if (result.price_remember) set['$inc']['price_remember'] = req.body.price;
                                if (result.price_weight) set['$inc']['price_weight'] = req.body.price;
                            }
                            set['price_update'] = req.body.price;
                            lib_ProductName.update({
                                find: {_id: id},
                                set: set
                            }, back);
                        }
                    ], callback)
                }, cb);
            },
            function (cb) {
                lib_PriceOfferProducts.getList({
                    find: {product_name: {$in: req.body.ids}}
                }, cb);
            },
            function (result, cb) {
                offer_ids = _.flatten(_.pluck(result, 'PID'));
                global.lib_PriceOffer.update({
                    find: {_id: {$in: offer_ids}},
                    set: {time_update_price: new Date(),time_creation: new Date(), time_update: new Date()}
                }, cb);
            },
            function (result, cb) {
                lib_log.add(_.extend({
                    user_id: req.decoded.id,
                    product_name: req.body.product_name,
                    type: 'readjust',
                    price: req.body.price,
                    layer: global.middleware.getLayer(req.body),
                    offer_ids: offer_ids,
                    content: req.body.price_type ? [{
                        type: global.config_model.price_type[req.body.price_type]
                    }] : [{
                        type: global.config_model.price_type['price_remember']
                    }, {
                        type: global.config_model.price_type['price_weight']
                    }]
                }), cb);
            },
            function (result, count, cb) {
                log = result;
                // global.lib_msg.push(req, {
                //     title: '调价',
                //     content: global.config_msg_templates.encodeContent('readjust', [req.decoded.company_name || '', req.decoded['user_name']])
                // }, {}, '', {}, null, global.config_model.company_type.PURCHASE, cb);
                cb(null, result);
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            //将批量调价后的也记录进入历史价格
            async.eachSeries(offer_ids, function (id, cb) {
                global.lib_PriceOffer.onlyGetOne({find: {_id: id}}, function (err, data) {
                    for (var i = 0; i < data.price_history.length; i++) {
                        if (data.price_history[0].price_remember) {
                            if (data.price_history[i].price_weight) {
                                data.price_history[i].price_weight.push({
                                    price: (!req.body.price_type || req.body.price_type == 'price_weight') ? data.price_history[i].price_weight[data.price_history[i].price_weight.length - 1].price + req.body.price : data.price_history[i].price_weight[data.price_history[i].price_weight.length - 1].price,
                                    time: new Date()
                                });
                            }
                            if (data.price_history[i].price_remember) {
                                data.price_history[i].price_remember.push({
                                    price: (!req.body.price_type || req.body.price_type == 'price_remember') ? data.price_history[i].price_remember[data.price_history[i].price_remember.length - 1].price + req.body.price : data.price_history[i].price_remember[data.price_history[i].price_remember.length - 1].price,
                                    time: new Date()
                                });
                            }
                        } else {
                            data.price_history[i].price_weight.push({
                                price: data.price_history[i].price_weight[data.price_history[i].price_weight.length - 1].price + req.body.price,
                                time: new Date()
                            });
                        }
                    }
                    data.markModified('price_history');
                    data.save();
                    cb();
                })
            }, function (err) {
                if (err) {
                    return next(err);
                }
                //修改购物车中的相关数据
                for (var i = 0; i < offer_ids.length; i++) {
                    global.lib_common.editShop(offer_ids[i]);
                }
                //批量调价
                var price;
                http.sendUserServer({
                    method: 'getList',
                    cond: {
                        find: {
                            user_id: req.decoded.id,
                            type: 'FRIEND',
                            status: 'PROCESSING'
                        }
                    },
                    model: 'Invitation_user'
                }, '/api/server/common/get', function(err,Invitation_users){
                    if(err){return next(err)}
                    var phones= _.uniq(_.pluck(Invitation_users, 'phone'));
                    var url='http://support.e-wto.com/admin_web/trade/index.html#/rsc/person_page?id='+req.decoded.id+'&type='+req.role;
                    //var url='http://192.168.3.248:3000/#/rsc/person_page?id='+req.decoded.id+'&type='+req.decoded.role;
                    var path=global.util.shortenurl(url);
                    async.waterfall([
                        function(cbk){
                            global.lib_common.change_buy(req,cbk);
                        }
                    ],function(err,buy){
                        if(req.body.status){
                            price='涨价'+req.body.price
                        }else{
                            price='降价'+req.body.price
                        }
                        request(path,function(err,a,b){
                            var sms=[req.decoded.company_name,req.decoded.user_name,req.body.ids.length,req.body.material_chn,price,a.body];
                            lib_msg.send_sms_new(req,phones,sms,'4073143',function(){

                            });
                        });
                    });
                });
                config_common.sendData(req, _.extend({log: log}, result), next);
            })

        });
    });

    /**
     * 专属优惠
     *
     * price   额度
     * user_id 针对谁优惠
     * ids     产品名称id数组
     */
    api.post('/preferential', function (req, res, next) {
        //如果不存在type类型默认为all
        if (!req.body.type) {
            req.body.type = 'all';
        }
        var baoJiaIds;
        async.waterfall([
            function (cb) {
                global.config_error.checkBody(req.body, ['price', 'ids', 'user_id'], cb);
            },
            function (cb) {
                lib_PriceOfferProducts.getList({
                    find: {_id: {$in: req.body.ids}}
                }, cb);
            },
            function (result, cb) {
                baoJiaIds = _.flatten(_.pluck(result, 'PID'));
                async.eachSeries(_.pluck(_.flatten(_.pluck(result, 'product_name')), '_id'), function (id, callback) {
                    async.waterfall([
                        function (cbk) {
                            lib_ProductName.getOne({
                                find: {
                                    'price_preferential.user_id': req.body.user_id,
                                    _id: id
                                }
                            }, cbk);
                        },
                        function (result, cbk) {
                            if (!result) {
                                lib_ProductName.update({
                                    find: {_id: id},
                                    set: {
                                        $addToSet: {
                                            price_preferential: {
                                                user_id: req.body.user_id,
                                                price: req.body.price,
                                                type: req.body.type
                                            }
                                        }
                                    }
                                }, cbk);
                            } else {
                                var arr = [];
                                result.price_preferential.forEach(function (price_preferential) {
                                    //（1）如果
                                    if (req.body.type == 'all') {
                                        if (price_preferential.user_id === req.body.user_id) {
                                            price_preferential['price'] = req.body.price;
                                            price_preferential['type'] = req.body.type;
                                        }
                                    } else {
                                        var zhuanHuan = {
                                            weight: 'remember',
                                            remember: 'weight'
                                        };
                                        if (price_preferential.user_id === req.body.user_id && price_preferential.type === 'all') {
                                            price_preferential['type'] = zhuanHuan[req.body.type];
                                            arr.push({
                                                user_id: req.body.user_id,
                                                price: req.body.price,
                                                type: req.body.type
                                            });
                                        } else if (price_preferential.user_id === req.body.user_id && price_preferential.type === req.body.type) {
                                            price_preferential['price'] = req.body.price;
                                            price_preferential['type'] = req.body.type;
                                        } else {
                                            arr.push({
                                                user_id: req.body.user_id,
                                                price: req.body.price,
                                                type: req.body.type
                                            });
                                        }
                                    }
                                    arr.push(price_preferential);
                                });
                                result.price_preferential = _.uniq(arr);
                                result.markModified('price_preferential');
                                lib_ProductName.edit(result, cbk);
                            }
                        }
                    ], callback);
                }, cb);
            },
            function (cb) {
                // global.lib_msg.push(req, {
                //     title: '专属优惠',
                //     content: global.config_msg_templates.encodeContent('preferential_user', [req.decoded.company_name || '', req.decoded['user_name']])
                // }, {}, '', {}, [req.body.user_id], global.config_model.company_type.PURCHASE, cb);
                cb();
            }
        ], function (err) {
            if (err) {
                return next(err);
            }
            //修改购物车中的相关数据
            for (var i = 0; i < baoJiaIds.length; i++) {
                global.lib_common.editShop(baoJiaIds[i]);
            }
            config_common.sendData(req, {}, next);
        });
    });

    api.post('/get_list', function (req, res, next) {
        var page_num = req.body.page || 1;
        async.waterfall([
            function (cb) {
                lib_PriceOfferProducts.getListAndCount(page_num, {
                    find: {_id: {$in: req.body.ids}},
                    skip: config_common.entry_per_page * (req.body.page - 1),
                    limit: config_common.entry_per_page,
                    sort: {time_creation: -1}
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
     * 个人专属优惠列表
     *
     * user_id   当前专属人id
     */
    api.post('/get_preferential_list', function (req, res, next) {
        var page_num = req.body.page || 1;
        async.waterfall([
            function (cb) {
                global.config_error.checkBody(req.body, ['user_id'], cb);
            },
            function (cb) {
                lib_ProductName.getList({
                    find: {'price_preferential.user_id': req.body.user_id}
                }, cb);
            },
            function (result, cb) {
                lib_PriceOfferProducts.getListAndCount(page_num, {
                    find: {product_name: {$in: JSON.parse(JSON.stringify(_.pluck(result, '_id')))}},
                    skip: config_common.entry_per_page * (req.body.page - 1),
                    limit: config_common.entry_per_page,
                    sort: {time_creation: -1}
                }, cb);
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, result, next);
        });
    });

    return api;
};

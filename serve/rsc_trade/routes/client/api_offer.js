/**
 * Created by Administrator on 17/4/14.
 */
var async = require('async');
var _ = require('underscore');
var shortid = require('js-shortid');

var sdk_oss = require('../../sdks/sdk_oss');

var config_common = global.config_common;
var config_error = global.config_error;
var config_model = global.config_model;
var config_msg_templates = global.config_msg_templates;

var lib_Relationship = global.lib_Relationship;
var lib_PriceOffer = global.lib_PriceOffer;
var lib_priceOfferCity = global.lib_priceOfferCity;
var lib_ProductName = global.lib_ProductName;
var lib_PriceOfferProducts = global.lib_PriceOfferProducts;
var lib_msg = global.lib_msg;
var http = global.http;
var mw = global.middleware;
var request=require('request');
var timer_priceoffer = global.timer_priceoffer;

module.exports = function (app, express) {

    var api = express.Router();
    //将查看报价接口修改为不需要使用decoded参数
    api.post('/detail', function (req, res, next) {
        global.lib_common.detail(req, lib_PriceOffer, function (err, result) {
            if (err) {
                return next(err);
            }
            if (req.decoded) {
                if (_.union(result.browse_offer, [req.decoded.id]).length === 5) {
                    if (result.type === global.config_model.offer_type.DJ) {
                        global.lib_User.getUserOne({find: {_id: result.user_id}}, function (err, user) {
                            if (user) {
                                //global.lib_msg.send_sms([user.real_name, result.product_categories[0].layer.material_chn], 'pricing_detail_5', [user.phone]);
                            }
                        });
                    } else {
                        global.lib_User.getUserOne({find: {_id: result.user_id}}, function (err, user) {
                            if (user) {
                                //global.lib_msg.send_sms([user.real_name, result.product_categories[0].layer.material_chn, req.decoded.company_name], 'bidding_detail_5', [user.phone]);
                            }
                        });
                    }
                }
            }

            //向详情中加入(1)报价创建时间到最后一个订单时间的时间差(2)查询到所有的订单总数量
            if (!result.lock) {
                global.lib_common.addLockContent(result, function (err, lockContent) {
                    result.lockContent = lockContent;
                    var data01 = _.flatten(_.pluck(result.product_categories, 'product_name'));
                    var data02 = _.flatten(_.pluck(data01, 'attribute'))
                    var data03 = _.filter(data02, function (num) {
                        return num.can_count == true;
                    });
                    var data04 = _.pluck(data03, 'value');
                    // if (_.indexOf(data04, 0) !== -1) {
                    //     var data04 = _.filter(data02, function (num) {
                    //         return num.can_count == true;
                    //     });
                    //     var overArr = [];
                    //     for (var i = 0; i < data01.length; i++) {
                    //         if (data01[i].attribute[0].value == 0) {
                    //             overArr.push({
                    //                 name: data01[i].name,
                    //                 time: global.config_common.MillisecondToDate(new Date(data01[i].attribute[0].end_time).getTime() - new Date(result.time_creation).getTime())
                    //             })
                    //         }
                    //     }
                    //     result.overContent = overArr;
                    // }
                    var overtime
                    if (_.max(data04) == 0) {
                        var data05 = _.pluck(data03, 'end_time');
                        var data06 = _.map(data05, function (num) {
                            return new Date(num).getTime();
                        });
                        overtime = global.config_common.MillisecondToDate(_.max(data06) - new Date(result.lock_date).getTime());
                    }

                    if (overtime) {
                        result.lockContent.overTime = overtime;
                    }

                    //如果存在user_id则查询一下这个人购物车中的报价有多少
                    if (req.body.user_id) {
                        global.lib_shop.getCount({user_demand_id: req.body.user_id}, function (err, count) {
                            result.shop_count = count;
                            config_common.sendData(req, result, next);
                        })
                    } else {
                        config_common.sendData(req, result, next);
                    }
                })
            } else {
                //如果存在user_id则查询一下这个人购物车中的报价有多少
                if (req.body.user_id) {
                    global.lib_shop.getCount({user_demand_id: req.body.user_id}, function (err, count) {
                        result.shop_count = count;
                        config_common.sendData(req, result, next);
                    })
                } else {
                    config_common.sendData(req, result, next);
                }
            }
        });
    });

    // 拦截非授权请求
    api.use(require('../../middlewares/mid_verify_user')());

    /**
     * 增删改查
     */
    api.post('/add', function (req, res, next) {
        if (!req.body.location_storage) {
            return next('invalid_format');
        }
        async.waterfall([
            function (cb) {
                config_error.checkRole(req.decoded.role, [config_common.user_roles.TRADE_ADMIN, config_common.user_roles.TRADE_SALE], cb);
            },
            function (cb) {
                config_error.checkBody(req.body, ['product_categories', 'att_quality', 'att_payment', 'att_traffic',
                    'att_settlement', 'type', 'location_storage'], cb, [[{type: 'JJ'}, ['amount']], [{type: 'DjJJ'}, ['amount']]], 'offer');
            },
            function (cb) {
                lib_PriceOffer.addNewOffer(req, cb);
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            //新增一个方法，根据不同的类别判断，发给不同的人的推送
            lib_common.pushTuiSong(req, {
                ownType: req.body.type === global.config_model.offer_type.DJ ? global.config_model.offer_ownType.pricing : global.config_model.offer_ownType.bidding,
                user_id: req.decoded.id,
                company_id: req.decoded.company_id
            });
            //查未上线的采购商和好友
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
                if(err){console.log('err',err)}
                var phones=_.pluck(Invitation_users, 'phone');
                http.sendMsgServerSMS1(req,'GBK',{
                    template_id: 'invite_friend_sell',
                    content: [req.decoded.user_name,req.body.product_categories[0].material_chn],
                    phone_list: phones
                },function () {
                });
            });

            //邀请未上线的采购商
            var yx_id;
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
                //var url='http://192.168.3.248:3000/#/rsc/person_page?id='+req.decoded.id+'&type='+req.role;                                   //内网
                //var url='http://dev.e-wto.com/zgy/trade/ts/index.html#/person_home/'+req.decoded.id+'&type='+req.decoded.role;              //验收
                var url='http://support.sinosteel.cc/ts-web/zgy-trade/index.html#/person_home/'+req.decoded.id+'&type='+req.decoded.role;   //正式
                var path=global.util.shortenurl(url);
                async.waterfall([
                    function(cbk){
                        global.lib_common.change_layer(result.id,cbk);
                    }
                ],function(err,last_layer){
                    if(req.body.type=='DJ'){
                        yx_id='3913043';
                    }else{
                        yx_id='4073145'
                    }
                    request(path,function(err,a,b){
                        var sms=[req.decoded.company_name,req.decoded.user_name,last_layer, a.body];
                        lib_msg.send_sms_new(req,phones,sms,yx_id,function(){

                        });
                    });
                });

            });
            config_common.sendData(req, _.extend(result, {random: global.util.getRandom(8)}), next);
        });
    });

    //已失效竞价重新发布
    api.post('/again_offer', function (req, res, next) {
        global.lib_demand_edit.offerEdit(req, {_id: req.body.old_id}, function (err, result) {
            config_common.sendData(req, result, next);
        });
    });
    api.post('/del', function (req, res, next) {
        var arr = [];
        async.waterfall([
            function (cb) {
                lib_PriceOffer.getList({
                    find: {_id: {$in: req.body.ids}},
                    select: 'background_urls'
                }, cb);
            },
            function (offers, cb) {
                //报价背景图片
                for (var i = 0; i < offers.length; i++) {
                    var offer = offers[i];
                    if (offer.background_urls) {
                        arr = arr.concat(_.pluck(offer.background_urls, 'url'));
                    }
                }
                lib_PriceOfferProducts.getList({
                    find: {PID: {$in: req.body.ids}},
                    select: 'product_name'
                }, cb);
            },
            function (products, cb) {
                var nameArr = [];
                for (var i = 0; i < products.length; i++) {
                    var offer = products[i];
                    if (offer.product_name) {
                        nameArr = nameArr.concat(offer.product_name);
                    }
                }
                lib_ProductName.getList({
                    find: {_id: {$in: nameArr}},
                    select: 'image'
                }, function (err, names) {
                    if (err) {
                        return cb(err);
                    }
                    //报价产品图片
                    for (var i = 0; i < names.length; i++) {
                        var name = names[i];
                        arr = arr.concat(name.image);
                    }
                    for (var j = 0; j < arr.length; j++) {
                        sdk_oss.deleteImgFromAliyun(arr[j]);
                    }
                    cb();
                });
            },
            function (cb) {
                global.lib_common.del(req, lib_PriceOffer, cb);
            },
            function (cb) {
                //将相关的购物车列表删除
                global.lib_shop.getList({find: {offer_id: {$in: req.body.ids}}}, cb);
            },
            function (shopList, cb) {
                async.eachSeries(shopList, function (oneData, callback) {
                    oneData.status = true;
                    oneData.save();
                    callback();
                }, cb);
            },
            function (cb) {
                global.lib_push.update({
                    find: {id: {$in: req.body.ids}},
                    set: {status: config_common.push_status.ineffective}
                }, cb);
            }
        ], function (err) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, {}, next);
        });
    });
    api.post('/edit', function (req, res, next) {
        var resultObj;
        async.waterfall([
            function (cb) {
                if (req.body.background_urls) {
                    if (!req.body.background_urls.length) {
                        delete req.body.background_urls;
                    }
                }
                if (req.body.price_routes[0] == null) {
                    req.body.price_routes = [{
                        "countries": "全国",
                        "price": 0
                    }]
                }
                config_error.checkBody(req.body, ['id'].concat(_.allKeys(req.body)), cb);
            },
            function (cb) {
                lib_PriceOffer.offerEdit(req, {_id: req.body.id}, cb);
            },
            function (result, cb) {
                resultObj = result;
                global.lib_msg.push(req, {
                    title: '修改报价',
                    content: global.config_msg_templates.encodeContent('edit_offer', [req.decoded.company_name || '', req.decoded['user_name']])
                }, {}, '', {}, null, global.config_model.company_type.PURCHASE, cb);
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            async.waterfall([
                function (cb) {
                    global.lib_shop.getList({find: {offer_id: resultObj._id.toString()}}, cb);
                },
                function (shopList, cb) {
                    if (shopList.length) {
                        async.eachSeries(shopList, function (oneData, callback) {
                            oneData.status = true;
                            oneData.save();
                            callback();
                        }, cb);
                    } else {
                        cb();
                    }
                },
            ], function (err) {
                if (err) {
                    return next(err);
                }
                //global.lib_common.editShop(resultObj._id.toString());
                http.sendUserServerNotToken(req, {
                    company_id: req.decoded.company_id,
                    user_id: req.decoded.id,
                    type: 'trade_pricing',
                    data: JSON.stringify(resultObj)
                }, '/api/company_dynamic/add');
                //修改报价短信

                console.log('修改报价发短信');

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
                    //var url='http://192.168.3.248:3000/#/rsc/person_page?id='+req.decoded.id+'&type='+req.role;                                   //内网
                    //var url='http://dev.e-wto.com/zgy/trade/ts/index.html#/person_home/'+req.decoded.id+'&type='+req.decoded.role;              //验收
                    var url='http://support.sinosteel.cc/ts-web/zgy-trade/index.html#/person_home/'+req.decoded.id+'&type='+req.decoded.role;   //正式
                    var path=global.util.shortenurl(url);
                    async.waterfall([
                        function(cbk){
                            global.lib_common.change_layer(resultObj.id,cbk);
                        }
                    ],function(err,last_layer){
                        console.log('last',last_layer);
                        request(path,function(err,a,b){
                            var sms=[req.decoded.company_name,req.decoded.user_name,a.body];
                            lib_msg.send_sms_new(req,phones,sms,'3923029',function(){

                            });
                        });
                    });

                });

                config_common.sendData(req, _.extend({data: resultObj}, {random: global.util.getRandom(8)}, result), next);
            })
        });
    });

    /**
     * 功能：打开或关闭报价锁
     * 参数：id报价的_id lock
     */
    api.post('/lock', function (req, res, next) {
        if (!req.body.id || !_.isBoolean(req.body.lock)) {
            return next('invalid_format');
        }
        var old_date;
        var offer_id;
        async.waterfall([
            function (cb) {
                lib_PriceOffer.onlyGetOne({find: {_id: req.body.id}}, cb);
            },
            function (data, cb) {
                offer_id=data._id;
                data.lock = req.body.lock;
                old_date = data.time_creation;
                data.time_creation = new Date();
                data.time_update = new Date();
                data.lock_date = old_date;
                data.save(cb);
            },
            function (content, count, cb) {
                if (!content.lock) {
                    global.lib_shop.getList({find: {offer_id: content._id.toString()}}, cb);
                } else {
                    cb(null, null);
                }
            },
            function (shopList, cb) {
                if (shopList && shopList.length) {
                    async.eachSeries(shopList, function (oneData, callback) {
                        oneData.status = true;
                        oneData.save();
                        callback();
                    }, cb);
                } else {
                    cb();
                }
            },
        ], function (err) {
            if (err) {
                return next(err);
            }

            var yx_id;
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
                //var url='http://192.168.3.248:3000/#/rsc/person_page?id='+req.decoded.id+'&type='+req.role;                                   //内网
                //var url='http://dev.e-wto.com/zgy/trade/ts/index.html#/person_home/'+req.decoded.id+'&type='+req.decoded.role;              //验收
                var url='http://support.sinosteel.cc/ts-web/zgy-trade/index.html#/person_home/'+req.decoded.id+'&type='+req.decoded.role;   //正式
                var path=global.util.shortenurl(url);
                async.waterfall([
                    function(cbk){
                        global.lib_common.change_layer(offer_id,cbk);
                    }
                ],function(err,last_layer){
                    console.log('last',last_layer);
                    if (req.body.lock){
                        yx_id='3923030'
                    }else{
                        yx_id='3913039'
                    }
                    request(path,function(err,a,b){
                        var sms=[req.decoded.company_name,req.decoded.user_name,last_layer,a.body];
                        lib_msg.send_sms_new(req,phones,sms,yx_id,function(){

                        });
                    });
                });

            });
            config_common.sendData(req, {}, next);
        })
    });

    /**
     * 功能：打开或关闭自己的所有的报价的报价锁
     * 参数： lock true/false
     */
    api.post('/lock_all', function (req, res, next) {
        var sum;
        if (!_.isBoolean(req.body.lock)) {
            return next('invalid_format');
        }
        async.waterfall([
            //查询到所有的自己的报价-->(1)全部开或关闭lock(2)将报价相关的购物车全部关闭
            function (cb) {
                lib_PriceOffer.update({
                    find: {type: 'DJ', status: {$ne: 'expired'}, user_id: req.decoded.id},
                    set: {lock: req.body.lock}
                }, cb);
            },
            function (data, cb) {
                lib_PriceOffer.onlyList({find: {type: 'DJ', status: {$ne: 'expired'}, user_id: req.decoded.id}}, cb);
            },
            function (list, cb) {
                sum=list.length;
                if (list && list.length) {
                    global.lib_shop.update({
                        find: {offer_id: {$in: _.pluck(list, '_id')}},
                        set: {status: true}
                    }, cb);
                } else {
                    cb(null, null);
                }
            },
        ], function (err) {
            if (err) {
                return next(err);
            }
            //开关盘发短信
            var yx_id;
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
                //var url='http://192.168.3.248:3000/#/rsc/person_page?id='+req.decoded.id+'&type='+req.role;                                   //内网
                //var url='http://dev.e-wto.com/zgy/trade/ts/index.html#/person_home/'+req.decoded.id+'&type='+req.decoded.role;              //验收
                var url='http://support.sinosteel.cc/ts-web/zgy-trade/index.html#/person_home/'+req.decoded.id+'&type='+req.decoded.role;   //正式
                var path=global.util.shortenurl(url);
                async.waterfall([
                    function(cbk){
                        global.lib_common.change_buy(req,cbk);
                    }
                ],function(err,buy){
                    if (req.body.lock){
                        yx_id='3913040'
                    }else{
                        yx_id='3923031'
                    }
                    request(path,function(err,a,b){
                        console.log('buy',buy);
                        var sms=[req.decoded.company_name,req.decoded.user_name,sum,buy,a.body];
                        lib_msg.send_sms_new(req,phones,sms,yx_id,function(){

                        });
                    });
                });

            });
            config_common.sendData(req, {}, next);
        })
    });

    /**
     * 根据状态获取自己发布的报价列表
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
        var page_num = req.body.page || 1;
        async.waterfall([
            function (cb) {
                config_error.checkRole(req.decoded.role, [config_common.user_roles.TRADE_ADMIN, config_common.user_roles.TRADE_SALE, config_common.user_roles.TRADE_PURCHASE], cb);
            },
            function (cb) {
                lib_PriceOffer.getListByParam(req, {
                    find: mw.getOfferType(req.body, mw.getIdQuery(req, {status: req.body.status || config_model.offer_status.published}, req.decoded)),
                    skip: config_common.entry_per_page * (page_num - 1),
                    limit: config_common.entry_per_page,
                    sort: {time_creation: -1}
                }, mw.getCityQuery(req.body, {user_id: req.body.user_id || req.decoded.id}), cb, page_num, req.body.type === config_model.offer_type.DJ, {});
            },
            function (result, cb) {
                async.eachSeries(result.list, function (list, cb) {
                    global.http.sendUserServer({
                        method: 'getOne',
                        cond: {find: {_id: list.location_storage}},
                        model: 'Address'
                    }, user_server_common, function (err, address) {
                        list.site = address;
                        cb();
                    });
                }, function (err) {
                    if (err) {
                        console.log('err', err)
                    }
                    global.lib_common.addUserAndCompany(req, result, cb);
                });
            },
            function (result, cb) {
                global.lib_PriceOffer.addJJTotalAmount(result.list, function (err) {
                    if (err) {
                        return cb(err);
                    }
                    cb(null, result);
                });
            },
            // function (result, cb) {
            //     global.lib_common.addStorageName(result, cb);
            // }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, result, next);
        });
    });

    /**
     * PK列表
     * page 页码
     */
    api.post('/get_JJ_list', function (req, res, next) {
        var page_num = req.body.page || 1;
        async.waterfall([
            function (cb) {
                lib_PriceOffer.getListAndCount(page_num, {
                    find: {
                        list_offer: req.decoded.id,
                        status: config_model.demand_status.published,
                        has_order: {$nin: [req.decoded.id]}
                    },
                    skip: config_common.entry_per_page * (page_num - 1),
                    limit: config_common.entry_per_page,
                    sort: {time_creation: -1}
                }, cb);
            },
            function (result, cb) {
                global.lib_common.addUserAndCompany(req, result, cb);
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, result, next);
        });
    });

    /**
     * 根据状态获取自己发布的报价列表
     * company_id 公司id
     * page  页码
     * province  省
     * update  是否刷新
     * material   大类i
     * layer_1   分类第一层
     * city  选传
     */
    api.post('/get_certification_list', function (req, res, next) {
        var page_num = req.body.page || 1;
        var query = {status: config_model.offer_status.published};
        var count = 0;
        async.waterfall([
            function (cb) {
                config_error.checkBody(req.body, ['company_id', 'page'], cb);
            },
            function (cb) {
                lib_Relationship.offerCheck(req, query, cb);
            },
            function (cb) {
                lib_PriceOffer.getUpdateCount(req, cb);
            },
            function (length, cb) {
                count = length;
                global.lib_User.getWorkRelationList(req, global.config_model.company_type.SALE, cb);
            },
            function (result, cb) {
                lib_PriceOffer.getListByParam(req, {
                    find: query,
                    skip: config_common.entry_per_page * (page_num - 1),
                    limit: config_common.entry_per_page,
                    sort: {time_creation: -1}
                }, mw.getCityQuery(req.body, {user_id: {$in: result}}), cb, page_num, true, {});
            },
            function (result, cb) {
                lib_PriceOffer.insertTypeCount(result, cb);
            },
            function (result, cb) {
                global.lib_common.addUserAndCompany(req, result, cb);
            }
        ], function (err, result) {
            if (err) return next(err);
            result.update_count = count;
            config_common.sendData(req, result, next);
        });
    });

    /**
     * 朋友圈
     */
    api.post('/circle_of_friends', function (req, res, next) {
        global.lib_common.circle_of_friends(req, lib_PriceOffer, lib_PriceOffer.insertTypeCount, function (err, result) {
            if (err) return next(err);
            config_common.sendData(req, result, next);
        }, global.config_model.company_type.SALE, true);
    });

    /**
     * 获取推送的报价
     */
    api.post('/get_push', function (req, res, next) {
        global.lib_common.get_push(req, lib_PriceOffer, 'offer_id', lib_PriceOffer.insertTypeCount, function (err, result) {
            if (err) return next(err);
            config_common.sendData(req, result, next);
        }, true)
    });

    /**
     * 红点提示条数
     * companies  [{id:公司id,city:城市，province：省,material}]
     */
    api.post('/get_remind', function (req, res, next) {
        var query = {status: config_model.offer_status.published}, obj = {};
        async.waterfall([
            function (cb) {
                config_error.checkBody(req.body, ['companies'], cb);
            },
            function (cb) {
                async.eachSeries(req.body['companies'], function (company, callback) {
                    async.waterfall([
                        function (cb) {
                            req.body.company_id = company.id;
                            if (company.city) req.body.city = company.city;
                            if (company.province) req.body.province = company.province;
                            if (company.material) req.body.material = company.material;
                            lib_Relationship.offerCheck(req, query, cb, true);
                        },
                        function (cb) {
                            global.lib_User.getWorkRelationList(req, global.config_model.company_type.SALE, cb, true);
                        },
                        function (result, cb) {

                            lib_PriceOffer.getCountByParam(req, {find: query}, mw.getCityQuery(req.body, {user_id: {$in: result}}), cb);
                        }
                    ], function (err, result) {
                        obj[company.id] = result;
                        callback();
                    });
                }, cb);
            }
        ], function (err) {
            if (err) return next(err);
            config_common.sendData(req, obj, next);
        });
    });

    /**
     * 获取自己各个状态报价列表数量
     */
    api.post('/get_oneself_count', function (req, res, next) {
        async.waterfall([
            function (callback) {
                lib_PriceOffer.getAggregate({
                    match: {user_id: req.decoded.id},
                    group: {_id: '$status', num: {$sum: 1}}
                }, callback);
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            var Status = {
                published: 0,
                expired: 0
            };
            _.each(result, function (status) {
                Status[status._id] = status.num;
            });
            config_common.sendData(req, Status, next);
        });
    });

    /**
     * 复制报价
     * ids 需要重新发布的报价id
     */
    api.post('/add_another_list', function (req, res, next) {
        var price_offer_ids = [];
        var new_price_offer_id;
        var count = 0;
        async.waterfall([
            //报价竞价处理
            function (cb) {
                global.lib_PriceOffer.getList({find: {_id: {$in: req.body.ids}}, select: ''}, cb);
            },
            function (offers, cb) {
                price_offer_ids = global.util.transObjArrToSigArr(offers, '_id');
                global.lib_PriceOffer.update({find: {_id: {$in: req.body.ids}, set: {_id: {$in: req.body.ids}}}},cb);
            },
            function (count, cb) {
                global.lib_priceOfferCity.update({
                    find: {
                        _id: {$in: req.body.ids},
                        set: {_id: {$in: req.body.ids}}
                    }
                }, cb);
            },
            function (count, cb) {
                global.lib_PriceOffer.onlyList({find: {_id: {$in: price_offer_ids}}}, cb);
            },
            function (list, cb) {
                async.eachSeries(list, function (priceOffer, callback) {
                    var price_offer_id = priceOffer._id.toString();
                    async.waterfall([
                        function (cbk) {
                            global.lib_User.defaultOne({
                                find: {user_id: req.decoded.id, differentiate: 'Pick_up_the_goods'}
                            }, cbk);
                        },
                        function (data_a, cbk) {
                            if (data_a) {
                                cbk(null, data_a);
                            } else {
                                global.lib_User.getAddressOne({
                                    find: {
                                        user_id: req.decoded.id,
                                        differentiate: 'Pick_up_the_goods',
                                        is_default: true
                                    }
                                }, cbk);
                            }
                        },
                        function (data_a, cbk) {
                            if (data_a) {
                                cbk(null, data_a)
                            } else {
                                global.lib_User.getAddressOne({
                                    find: {_id: priceOffer.location_storage, type: {$exists: true}}
                                }, cbk);
                            }
                        },
                        function (data_a, cbk) {
                            if (data_a && data_a.store_id) {
                                global.lib_User.getAddressOne({
                                    find: {_id: data_a.store_id}
                                }, cbk);
                            } else {
                                cbk(null, data_a)
                            }
                        },
                        function (address, cbk) {
                            if (!address) {
                                count += 1;
                                cbk(null, null, null)
                            } else {
                                //处理主报价
                                var data = global.util.clone(priceOffer);
                                data.status = global.config_model.offer_status.published;
                                data.user_id = req.decoded.id;
                                data.update_time = new Date();
                                data.time_creation = new Date();
                                data.list_offer = [];
                                data.count_offer = 0;
                                data.browse_offer = [];
                                data.has_order = [];
                                data.price_routes = [];
                                data.location_storage = address._id.toString();
                                data.warehouse_name = address.name ? address.name : "";
                                data.role = req.decoded.role;
                                data.starting_count=priceOffer.starting_count;
                                //清空包邮
                                if (data.passPrice_id) {
                                    data.passPrice_id = '';
                                }
                                data.short_id = shortid.gen();
                                delete data._id;
                                global.lib_PriceOffer.add(data, cbk);
                            }
                        },
                        function (priceOfferData, count, cbk) {
                            if (!priceOfferData) {
                                cbk(null, null)
                            } else {
                                //处理报价城市
                                new_price_offer_id = priceOfferData._id.toString();
                                global.lib_priceOfferCity.getList({find: {PID: price_offer_id}}, cbk);
                            }

                        },
                        function (cities, cbk) {
                            if (!cities) {
                                cbk(null, null)
                            } else {
                                var arr = [];
                                for (var i = 0; i < cities.length; i++) {
                                    var data = global.util.clone(cities[i]);
                                    delete data._id;
                                    data.user_id = req.decoded.id;
                                    data.PID = [new_price_offer_id];
                                    arr.push(data);
                                }
                                global.lib_priceOfferCity.addList(arr, cbk);
                            }
                        },
                        function (count, cbk) {
                            if (!count) {
                                cbk(null, null)
                            } else {
                                //处理报价产品包括分类和名称
                                global.lib_PriceOfferProducts.getList({find: {PID: price_offer_id}}, cbk);
                            }
                        },
                        function (products, cbk) {
                            if (!products) {
                                cbk()
                            } else {
                                async.eachSeries(products, function (product, cb1) {
                                    var productData = global.util.clone(product);
                                    productData.PID = [new_price_offer_id];
                                    delete productData._id;
                                    async.waterfall([
                                        function (cb2) {
                                            global.lib_ProductName.getList({find: {_id: {$in: productData.product_name}}}, cb2);
                                        },
                                        function (names, cb2) {
                                            productData.product_name = [];
                                            async.eachSeries(names, function (name, cb3) {
                                                var data = global.util.clone(name);
                                                delete data._id;
                                                global.lib_ProductName.add(data, function (err, nameData) {
                                                    if (err) {
                                                        return cb3(err);
                                                    }
                                                    productData.product_name.push(nameData._id.toString());
                                                    cb3();
                                                });
                                            }, cb2);
                                        },
                                        function (cb2) {
                                            global.lib_PriceOfferProducts.addOnly(productData, function (err) {
                                                if (err) {
                                                    return cb2(err);
                                                }
                                                cb2();
                                            });
                                        }
                                    ], cb1);
                                }, cbk);
                            }
                        }
                    ], callback);
                }, cb);
            },
        ], function (err) {
            if (err) {
                return next(err);
            }

            config_common.sendData(req, {count: count}, next);
        })
    });

    /**
     * 获取优惠列表
     */
    api.post('/get_preferential', function (req, res, next) {
        var obj = {};
        var checkParam = {
            full_name: 1,
            nick_name: 1,
            url_logo: 1,
            province: 1,
            city: 1,
            company_id: 1,
            verify_phase: 1
        };
        async.waterfall([
            function (cb) {
                global.lib_User.getCompanyRelationList({
                    find: {other_id: req.decoded.company_id},
                    select: 'self_id'
                }, cb);
            },
            function (relations, cb) {
                async.eachSeries(_.pluck(relations, 'self_id'), function (id, callback) {
                    async.waterfall([
                        function (cbk) {
                            lib_PriceOffer.getList({
                                find: {user_id: req.decoded.id, status: global.config_model.offer_status.published}
                            }, cbk);
                        },
                        function (result, cbk) {
                            async.waterfall([
                                function (callBack) {
                                    global.lib_User.getCompanyOne({
                                        find: {_id: id}
                                    }, callBack);
                                },
                                function (companyData, callBack) {
                                    if (!obj[id]) obj[id] = {company_id: id};
                                    for (var index in checkParam) {
                                        if (checkParam.hasOwnProperty(index)) {
                                            if (!obj[id][index]) obj[id][index] = companyData[index];
                                        }
                                    }
                                    async.eachSeries(result, function (offer, cback) {
                                        async.eachSeries(_.flatten(_.pluck(offer.price_routes, 'preferential_FOB')).concat(_.flatten(_.pluck(offer.price_routes, 'preferential_CIF'))), function (preferentialObj, eachcbk) {
                                            if (id === preferentialObj.company_id) {
                                                if (!obj[id][offer.product_categories[0].layer['layer_1_chn']]) {
                                                    obj[id][offer.product_categories[0].layer['layer_1_chn']] = [];
                                                }
                                                obj[id][offer.product_categories[0].layer['layer_1_chn']].push(preferentialObj.price);
                                            }
                                            eachcbk();
                                        }, cback);
                                    }, callBack);
                                }
                            ], cbk)
                        }
                    ], callback);
                }, cb);
            }
        ], function (err) {
            if (err) {
                return next(err);
            }
            var objArr = [];
            for (var index in obj) {
                if (obj.hasOwnProperty(index)) {
                    var categoryArr = [];
                    for (var index1 in obj[index]) {
                        var priceObj = {};
                        if (obj[index].hasOwnProperty(index1) && !checkParam[index1]) {
                            priceObj.category_chn = index1;
                            priceObj.min = _.min(obj[index][index1]);
                            priceObj.max = _.max(obj[index][index1]);
                            categoryArr.push(priceObj);
                            delete obj[index][index1];
                        }
                    }
                    obj[index]['categoryArr'] = categoryArr;
                    objArr.push(obj[index]);
                }
            }
            config_common.sendData(req, objArr, next);
        });
    });

    /**
     * 获取优惠列表
     */
    api.post('/get_preferential_by_user', function (req, res, next) {
        var resultArr = [], page_num = req.body.page || 1, length = 0;
        async.waterfall([
            // function (cb) {
            //     global.lib_User.getCompanyRelationList({
            //         find: {other_id: req.decoded.company_id}
            //     }, cb);
            // },
            // function (relations, cb) {
            //     async.eachSeries(relations, function (relation, callback) {
            //         async.waterfall([
            //             function (back) {
            //                 global.lib_User.getWorkRelation({
            //                     find: {
            //                         other_company_id: relation.self_id,
            //                         user_id: req.decoded.id,
            //                         type: 'PURCHASE'
            //                     }
            //                 }, back);
            //             },
            //             function (result, back) {
            //                 length += _.pluck(result, 'other_user_id').length;
            //                 async.eachSeries(_.pluck(result, 'other_user_id'), function (id, cback) {
            //                     lib_PriceOffer.getDataByUser(id, relation.self_id, function (err, obj) {
            //                         if (err) return cback(err);
            //                         resultArr.push(obj);
            //                         cback();
            //                     });
            //                 }, back);
            //             }
            //         ], callback);
            //     }, cb);
            // }
            function (cb) {
                global.lib_User.getWorkRelation({
                    find: {
                        user_id: req.decoded.id,
                        type: 'PURCHASE'
                    },
                    select: 'other_user_id other_company_id',
                    sort: {other_company_id: -1}
                }, cb);
            },
            function (relations, cb) {
                length = relations.length;
                async.eachSeries(relations, function (relation, cback) {
                    lib_PriceOffer.getDataByUser(relation.other_user_id, relation.other_company_id, function (err, obj) {
                        if (err) {
                            return cback(err);
                        }
                        resultArr.push(obj);
                        cback();
                    });
                }, cb);
            }
        ], function (err) {
            if (err) {
                return next(err);
            }
            var start = (req.body.page - 1) * config_common.entry_per_page;
            config_common.sendData(req, {
                exist: length > config_common.entry_per_page * page_num,
                list: resultArr.slice(start, start + config_common.entry_per_page),
                count: length
            }, next);
        });
    });

    /**
     * 获取优惠列表
     */
    api.post('/get_preferential_by_user_id', function (req, res, next) {
        async.waterfall([
            function (cb) {
                config_error.checkBody(req.body, ['user_id', 'company_id'], cb);
            },
            function (cb) {
                lib_PriceOffer.getDataByUser(req.body.user_id, req.body.company_id, cb);
            }
        ], function (err, result) {
            if (err) return next(err);
            config_common.sendData(req, result, next);
        });
    });

    /**
     * 根据条件返回相应的数据
     *
     * 必传
     * param
     * 选传
     * page   页码
     * payment_style   类型
     * province  省
     * city  市
     * material  大类
     * layer_1_chn  小类
     *
     */
    api.post('/get_readjust_param', function (req, res, next) {
        var query = {
            find: _.extend({
                user_id: req.decoded.id,
                status: config_model.offer_status.published
            }, mw.getIdQuery(req, {}))
        };
        if (req.body.page) {
            query.skip = config_common.entry_per_page * (req.body.page - 1);
            query.limit = config_common.entry_per_page;
            query.sort = {time_creation: -1};
        }
        async.waterfall([
            function (cb) {
                var cond = {};
                if (req.body.price_type) cond[req.body.price_type] = {$gt: 0};
                lib_PriceOffer.getListByParam(req, query, _.extend(req.body['hasCity'] ? mw.getOnlyProvinceQuery(req.body, {user_id: req.decoded.id}) : mw.getCityQuery(req.body, {user_id: req.decoded.id}), {}), cb, null, true, cond);
            },
            function (result, cb) {
                lib_PriceOffer.getParam(req.body, result, cb);
            }
        ], function (err, result) {
            if (err) return next(err);
            config_common.sendData(req, result, next);
        })
    });

    /**
     * 获取补货参数
     *
     * 参数
     * location_storage  地址
     * user_id  默认为自己
     * payment_style  报价类型
     */
    api.post('/get_replenish', function (req, res, next) {
        async.waterfall([
            function (cb) {
                global.lib_PriceOfferProducts.getList({
                    find: {material: 'steel'}
                }, cb);
            },
            function (result, cb) {
                lib_PriceOffer.getList({
                    find: {
                        location_storage: req.body.location_storage,
                        user_id: req.body.user_id || req.decoded.id,
                        status: config_model.offer_status.published,
                        _id: {$in: _.pluck(result, 'offer_id')}
                    }
                }, cb);
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            var arr = [];
            result.forEach(function (offer) {
                offer.price_routes.forEach(function (route) {
                    if (offer.product_categories[0].replenish && route[req.body.payment_style] && (route.countries || req.body.city && req.body.city === route['city'] || req.body.province && req.body.province === route['province'])) {
                        arr.push({
                            preferential: route['preferential_' + req.body.payment_style],
                            price: route[req.body.payment_style],
                            product_categories: offer.product_categories
                        });
                    }
                });
            });
            config_common.sendData(req, arr, next);
        });
    });

    /**
     * 发短信
     * phone_list  手机号数组
     */
    api.post('/send_sms', function (req, res, next) {
        var query = {user_id: req.decoded.id, type: 'DJ'};
        var type = 'pricing';
        if (req.body.id) {
            type = 'bidding';
            query = {_id: req.body.id};
        }
        async.waterfall([
            function (cb) {
                lib_PriceOffer.getList({
                    find: query
                }, cb);
            },
            function (result, cb) {
                var sms = [req.decoded.company_name || '', req.decoded['user_name'], _.compact(_.first(global.util.getProduct(result, 'layer_1_chn', function (err, product) {
                    return product;
                }), 2)).join('、'), _.min(_.pluck(_.pluck(result, 'FOB').concat(_.pluck(result, 'CIF')), 'min'))];
                if (req.body.id) {
                    sms = [req.decoded.company_name || '',
                        req.decoded['user_name'],
                        _.uniq(_.pluck(_.pluck(_.flatten(_.pluck(result, 'product_categories')), 'layer'), 'material_chn'))[0]];
                }
                lib_msg.send_sms(sms, type, req.body.phone_list || ['15713101361', '15713101362'], cb);
            }
        ], function (err, result) {
            if (err) return next(err);
            config_common.sendData(req, result, next);
        });
    });

    return api;

};
/**
 * Created by Administrator on 17/4/14.
 */
var async = require('async');
var _ = require('underscore');
var shortid = require('js-shortid');
var config_error = global.config_error;
var config_common = global.config_common;
var config_model = global.config_model;

var lib_DemandOrder = global.lib_DemandOrder;
var lib_Demand = global.lib_Demand;
var lib_Relationship = global.lib_Relationship;
var lib_common = global.lib_common;
var timer_demand = global.timer_demand;
var request=require('request');

module.exports = function (app, express) {

    var api = express.Router();

    api.post('/detail', function (req, res, next) {
        lib_common.detail(req, lib_Demand, function (err, result) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, result, next);
        });
    });

    // 拦截非授权请求
    api.use(require('../../middlewares/mid_verify_user')());

    /**
     * 增删改查
     */
    api.post('/add', function (req, res, next) {
        var demand_id;
        async.waterfall([
            function (cb) {
                config_error.checkRole(req.decoded.role, [config_common.user_roles.TRADE_ADMIN, config_common.user_roles.TRADE_PURCHASE], cb);
            },
            function (cb) {
                config_error.checkBody(req.body, ['product_categories', 'att_quality', 'att_payment', 'att_traffic'
                    , 'att_settlement', 'amount', 'payment_style', 'type', 'time_validity'], cb, [
                    [], [{att_traffic: config_model.att_traffic.path_loss}, ['path_loss']]
                ], 'demand');
            },
            function (cb) {
                global.lib_ProductClassify.checkProduct(req.body.product_categories, null, cb);
            },
            function (result, cb) {
                delete result.layer;
                //给产品添加短id
                result = JSON.parse(JSON.stringify(result));
                for (var i = 0; i < result.length; i++) {
                    for (var j = 0; j < result[i].product_name.length; j++) {
                        result[i].product_name[j].short_id = shortid.gen();
                    }
                }
                lib_Demand.add({
                    user_id: req.decoded.id,
                    company_id: req.decoded.company_id,
                    company_name: req.decoded.company_name,
                    admin_id: req.decoded.admin_id || '',

                    product_categories: result,
                    price_routes: [{
                        min: req.body['price_min'] || 0,
                        max: req.body['price_max'] || 0,
                        preferential_FOB: 0,                               // 出厂价优惠
                        preferential_CIF: 0,                               // 到岸价优惠
                        countries: '全国'
                    }],

                    att_quality: req.body.att_quality,
                    att_payment: req.body.att_payment,
                    att_traffic: req.body.att_traffic,
                    att_settlement: req.body.att_settlement,
                    path_loss: req.body.path_loss || '',

                    amount: parseFloat(req.body.amount) || 0,

                    location_depart: req.body.location_depart,
                    location_storage_unit_id: req.body.location_storage_unit_id,
                    payment_style: req.body.payment_style || 'FOB',
                    role: req.decoded.role,
                    type: req.body.type,
                    appendix: req.body.appendix,

                    time_validity: req.body.time_validity,

                    delay_day: req.body.delay_day,
                    delay_type: req.body.delay_type,
                    percent_advance: req.body.percent_advance
                }, cb);
            }
        ], function (err, result) {
            demand_id=result._id;
            if (err) {
                return next(err);
            }
            global.lib_User.getCompanyRelationList({
                find: {self_id: req.decoded.company_id},
                select: 'other_id'
            }, function (err, list) {
                global.lib_Statistical.statistical_server_companyTrade_add(req, {
                    companyObj: [{
                        id: req.decoded.company_id,
                        type: config_model.statistical_type.purchase_demand,
                        add_user_id: req.decoded.id,
                        category: result.product_categories[0].layer['layer_1']
                    }].concat(_.reduce(_.pluck(list, 'other_id'), function (list, id) {
                        list.push({
                            id: id,
                            type: config_model.statistical_type.sale_demand
                        });
                        return list;
                    }, []))
                });
            });
            global.lib_User.addCompanyDynamic({
                company_id: req.decoded.company_id,
                user_id: req.decoded.id,
                type: config_common.typeCode.trade_demand,
                data: JSON.stringify(result)
            });
            async.waterfall([
                function (cbk) {
                    global.lib_msg.push(req, {
                            title: '交易抢单',
                            content: global.config_msg_templates.encodeContent('demand', [req.decoded.company_name || '', req.decoded['user_name'], result.product_categories[0].layer['layer_1_chn']])
                        },
                        {find: {self_id: req.decoded.company_id}},
                        'other_id', {
                            params: {id: result._id},
                            url: config_common.push_url.demand
                        }, null, global.config_model.company_type.SALE, cbk);
                },
                function (list, cbk) {
                    cbk(null, _.extend({id: result._id}, list));
                }
            ], function (err, resultObj) {
                if (err) return next(err);
                //新增一个方法，根据不同的类别判断，发给不同的人的推送
                lib_common.pushTuiSong(req,result);
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
                            global.lib_common.change_layer_demand(demand_id,cbk);
                        }
                    ],function(err,last_layer){
                        request(path,function(err,a,b){
                            var sms=[req.decoded.company_name,req.decoded.user_name,last_layer, a.body];
                            lib_msg.send_sms_new(req,phones,sms,'4073144',function(){

                            });
                        });
                    });

                });


                config_common.sendData(req, _.extend(resultObj, {random: global.util.getRandom(8)}), next);
            });
        });
    });
    api.post('/del', function (req, res, next) {
        async.waterfall([
            function (cb) {
                lib_common.del(req, lib_Demand, cb);
            },
            function (cb) {
                global.lib_push.update({
                    find: {id: {$in: req.body.ids}},
                    set: {status: config_common.push_status.ineffective}
                }, cb);
            }
        ], function (err) {
            if (err) return next(err);
            config_common.sendData(req, {}, next);
        });
    });
    // api.post('/edit', function (req, res, next) {
    //     lib_common.edit(req, lib_Demand, function (err, result) {
    //         if (err) {
    //             return next(err);
    //         }
    //         config_common.sendData(req, result, next);
    //     });
    // });

    // api.post('/detail', function (req, res, next) {
    //     lib_common.detail(req, lib_Demand, function (err, result) {
    //         if (err) {
    //             return next(err);
    //         }
    //         config_common.sendData(req, result, next);
    //     });
    // });

    //已失效的采购重新变成可发布状态
    api.post('/again_demand',function(req,res,next){
        //global.lib_demand_edit.demandEdit(req, {_id: req.body.old_id}, function(err,result){
        //    config_common.sendData(req, result, next);
        //});
        var layar;
        async.waterfall([
            function (cb) {
                config_error.checkRole(req.decoded.role, [config_common.user_roles.TRADE_ADMIN, config_common.user_roles.TRADE_PURCHASE], cb);
            },
            function (cb) {
                config_error.checkBody(req.body, ['product_categories', 'att_quality', 'att_payment', 'att_traffic'
                    , 'att_settlement', 'amount', 'payment_style', 'type', 'time_validity'], cb, [
                    [], [{att_traffic: config_model.att_traffic.path_loss}, ['path_loss']]
                ], 'demand');
            },
            function (cb) {
                global.lib_ProductClassify.checkProduct(req.body.product_categories, null, cb);
            },
            function(result,cb){
                result = JSON.parse(JSON.stringify(result));
                for (var i = 0; i < result.length; i++) {
                    for (var j = 0; j < result[i].product_name.length; j++) {
                        result[i].product_name[j].short_id = shortid.gen();
                    }
                }
                layar=result;
                cb();
            },
            function (cb) {
                lib_Demand.getOne({
                    find: {_id: req.body.old_id}
                }, cb);
            },
            function (demand, cb) {

                demand.user_id=req.decoded.id;
                demand.company_id= req.decoded.company_id;
                demand.company_name= req.decoded.company_name;
                demand.admin_id= req.decoded.admin_id || '';

                demand.product_categories= layar;
                demand.price_routes= req.body.price_routes;

                demand.att_quality= req.body.att_quality;
                demand.att_payment= req.body.att_payment;
                demand.att_traffic= req.body.att_traffic;
                demand.att_settlement= req.body.att_settlement;
                demand.path_loss= req.body.path_loss || '';

                demand.amount= parseFloat(req.body.amount) || 0;

                demand.location_depart= req.body.location_depart;
                demand.location_storage_unit_id= req.body.location_storage_unit_id;
                demand.payment_style= req.body.payment_style || 'FOB';
                demand.role= req.decoded.role;
                demand.type= req.body.type;
                demand.appendix= req.body.appendix;

                demand.time_validity= req.body.time_validity;     //此处，为采购倒计时

                demand.delay_day= req.body.delay_day;
                demand.delay_type= req.body.delay_type;
                demand.percent_advance= req.body.percent_advance;

                demand.time_creation=new Date();
                demand.status=config_model.offer_status.published;

                demand.save(cb);
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            global.lib_User.getCompanyRelationList({
                find: {self_id: req.decoded.company_id},
                select: 'other_id'
            }, function (err, list) {
                global.lib_Statistical.statistical_server_companyTrade_add(req, {
                    companyObj: [{
                        id: req.decoded.company_id,
                        type: config_model.statistical_type.purchase_demand,
                        add_user_id: req.decoded.id,
                        category: result.product_categories[0].layer['layer_1']
                    }].concat(_.reduce(_.pluck(list, 'other_id'), function (list, id) {
                        list.push({
                            id: id,
                            type: config_model.statistical_type.sale_demand
                        });
                        return list;
                    }, []))
                });
            });
            global.lib_User.addCompanyDynamic({
                company_id: req.decoded.company_id,
                user_id: req.decoded.id,
                type: config_common.typeCode.trade_demand,
                data: JSON.stringify(result)
            });
            async.waterfall([
                function (cbk) {
                    global.lib_msg.push(req, {
                            title: '交易抢单',
                            content: global.config_msg_templates.encodeContent('demand', [req.decoded.company_name || '', req.decoded['user_name'], result.product_categories[0].layer['layer_1_chn']])
                        },
                        {find: {self_id: req.decoded.company_id}},
                        'other_id', {
                            params: {id: result._id},
                            url: config_common.push_url.demand
                        }, null, global.config_model.company_type.SALE, cbk);
                },
                function (list, cbk) {
                    cbk(null, _.extend({id: result._id}, list));
                }
            ], function (err, resultObj) {
                if (err) return next(err);

                //新增一个方法，根据不同的类别判断，发给不同的人的推送
                lib_common.pushTuiSong(req,result);

                config_common.sendData(req, _.extend(resultObj, {random: global.util.getRandom(8)}), next);
            });
        });
    });


    /**
     * 获取自己发布的列表
     * page
     */
    api.post('/get_list', function (req, res, next) {
        var query = {user_id: req.decoded.id};
        var page_num = req.body.page || 1;
        query.status = req.body.status || config_model.demand_status.published;
        query = global.middleware.getIdQuery(req, query, req.decoded);
        async.waterfall([
            function (cb) {
                lib_Demand.getListAndCount(page_num, {
                    find: query,
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
     * PK列表
     * page
     */
    api.post('/get_JJ_list', function (req, res, next) {
        var page_num = req.body.page || 1;
        async.waterfall([
            function (cb) {
                if (req.body.status) {
                    lib_Demand.getListAndCount(page_num, {
                        find: {
                            has_order: {$nin: [req.decoded.id]},
                            list_offer: req.decoded.id,
                            status: req.body.status || config_model.demand_status.published
                        },
                        sort: {time_creation: -1},
                        skip: (page_num - 1) * config_common.entry_per_page,
                        limit: config_common.entry_per_page
                    }, cb);
                } else {
                    lib_Demand.getListAndCount(page_num, {
                        find: {
                            has_order: {$nin: [req.decoded.id]},
                            list_offer: req.decoded.id,
                            status: req.body.status || config_model.demand_status.published
                        },
                        sort: {time_creation: -1},
                        skip: (page_num - 1) * config_common.entry_per_page,
                        limit: config_common.entry_per_page
                    }, cb);
                }

            },
            function (result, cb) {
                global.lib_common.addUserAndCompany(req, result, cb);
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, result, next);
        })
    });

    /**
     * 根据某个公司获取认证抢单列表
     * company_id
     * page
     */
    api.post('/get_certification_list', function (req, res, next) {
        var page_num = req.body.page || 1;
        var query = {
            status: config_model.demand_status.published,
            company_id: req.body.company_id
        };
        var count;
        async.waterfall([
            function (cb) {
                config_error.checkBody(req.body, ['company_id'], cb);
            },
            function (cb) {
                lib_Relationship.demandCheck(req, query, cb);
            },
            function (cb) {
                global.lib_Demand.getUpdateCount(req, cb);
            },
            function (length, cb) {
                count = length;
                global.lib_User.getWorkRelationList(req, global.config_model.company_type.PURCHASE, cb);
            },
            function (ids, cb) {
                query.user_id = {$in: ids};
                lib_Demand.getListAndCount(page_num, {
                    find: global.middleware.getDoubleLayerQuery(req.body, query),
                    sort: {time_creation: -1},
                    skip: (page_num - 1) * config_common.entry_per_page,
                    limit: config_common.entry_per_page
                }, cb);
            },
            function (result, cb) {
                lib_Demand.insertDemandCount(result, cb);
            },
            function (result, cb) {
                lib_common.addUserAndCompany(req, result, cb);
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            result.update_count = count;
            config_common.sendData(req, result, next);
        });
    });

    /**
     * 朋友圈
     */
    api.post('/circle_of_friends', function (req, res, next) {
        global.lib_common.circle_of_friends(req, lib_Demand, lib_Demand.insertDemandCount, function (err, result) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, result, next);
        }, global.config_model.company_type.SALE);
    });

    /**
     * 获取推送的抢单
     */
    api.post('/get_push', function (req, res, next) {
        global.lib_common.get_push(req, lib_Demand, 'demand_id', lib_Demand.insertDemandCount, function (err, result) {
            if (err) return next(err);
            config_common.sendData(req, result, next);
        })
    });

    /**
     * 提示条数
     * companies 公司d数组 [{id:公司id，material：产品}]
     */
    api.post('/get_remind', function (req, res, next) {
        var query = {status: config_model.offer_status.published};
        var obj = {};
        async.waterfall([
            function (cb) {
                config_error.checkBody(req.body, ['companies'], cb);
            },
            function (cb) {
                async.eachSeries(req.body['companies'], function (company, callback) {
                    req.body.company_id = company.id;
                    async.waterfall([
                        function (cb) {
                            lib_Relationship.demandCheck(req, query, cb, true);
                        },
                        function (cb) {
                            global.lib_User.getWorkRelationList(req, global.config_model.company_type.PURCHASE, cb, true);
                        },

                        function (result, cb) {
                            query.user_id = {$in: result};
                            lib_Demand.getCount(global.middleware.getDoubleLayerQuery(req.body, query), cb);
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
     * 获取有效和无效抢单的个数
     */
    api.post('/get_oneself_count', function (req, res, next) {
        async.parallel({
            true: function (cb) {
                lib_Demand.getCount({
                    user_id: req.decoded.id,
                    status: config_model.demand_status.published
                }, cb);
            },
            false: function (cb) {
                lib_Demand.getCount({
                    user_id: req.decoded.id,
                    status: config_model.demand_status.expired
                }, cb);
            }
        }, function (err, result) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, result, next);
        });
    });

    /**
     * 发短信
     */
    api.post('/send_sms', function (req, res, next) {
        async.waterfall([
            function (cb) {
                lib_Demand.getList({
                    find: {_id: req.body.id}
                }, cb)
            },
            function (result, cb) {
                global.lib_msg.send_sms([req.decoded.company_name || '', req.decoded['user_name'], _.uniq(_.pluck(_.flatten(_.pluck(result, 'product_categories')), 'layer_1_chn'))[0]], 'demand', req.body.phone_list || ['15713101361'], cb);
            }
        ], function (err, result) {
            if (err) return next(err);
            config_common.sendData(req, result, next);
        });
    });

    return api;
};
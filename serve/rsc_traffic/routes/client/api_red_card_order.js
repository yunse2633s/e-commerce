/**
 * sj 20170424.
 */
//外部工具引用
var async = require('async');
var _ = require('underscore');
var express = require('express');
//内部工具引用
var http = require('../../lib/http');
var util = require('../../lib/util');

//配置文件引用
var config_api_url = require('../../configs/config_api_url');
var config_msg_template = require('../../configs/config_msg_template');
var config_common = require('../../configs/config_common');
//内部数据操作引用
var extServer = require('../../lib/lib_ext_server');
var redCardSV = require('../../lib/lib_red_card');
var redCardOrderSV = require('../../lib/lib_red_card_order');
var driverOrderSV=require('../../lib/lib_traffic_driver_order');
var tipSV=require('../../lib/lib_tip');


module.exports = function() {
    var api = express.Router();

    //token 解析判断
    api.use(require('../../middlewares/mid_verify_user')());


    api.post('/get_count', function (req, res, next) {
        async.waterfall([
            function (cb) {
                var cond={};
                if(req.body.card_id){
                    cond.card_id = req.body.card_id
                }else{
                    cond.user_id = req.decoded.id
                }
                redCardOrderSV.getCount(cond, cb)
            }
        ], function(err, result){
            if(err){
                return next(err)
            }
            config_common.sendData(req, result, next);
        });
    });
    /**
     * get_list 20170922 20171122 增加公司id筛选
     */
    api.post('/get_list', function (req, res, next) {
        //查询卡片下的分发记录，自己有多少张卡
        // var order={orders:[], exist:false, count: 0};
        var week_money=0, cond = {
            // user_id: req.decoded.id,
            // status: config_common.demand_status.effective
        };
        async.waterfall([
            function (cb) {

                _.each(['phone', 'user_id', 'send_user_id', 'card_id'], function (x) {
                    if (req.body[x]) {
                        cond[x] = req.body[x]
                    }
                });
                req.body.page = req.body.page || 1;
                if (Object.keys(cond).length == 0) {
                    cond.user_id = req.decoded.id;
                }
                if(req.body.search_time){
                    cond.time_creation = {$lt: new Date(req.body.search_time)}
                }
                if(config_common.accessRule.pass.indexOf(req.decoded.role)>-1){
                    var now_t=new Date(), week_start_t=config_common.getWeekStart();
                    async.waterfall([
                        function (cb1) {
                            redCardSV.getOne({find: {_id: req.body.card_id}}, cb1);
                        }, function (card, cb1) {
                            redCardOrderSV.getCount({card_id: req.body.card_id, time_creation: {$gt: week_start_t, $lt: now_t}}, function (x,y) {
                                cb1(null, config_common.rscDecimal('mul', card.money, y, 0))
                            })
                        }
                    ],cb)
                }else{
                    cb(null, null);
                }

            }, function(money, cb){
                week_money=money;
                redCardOrderSV.getList({
                    find:cond,
                    sort: {time_creation: -1},
                    skip: (req.body.page-1)*config_common.entry_per_page,
                    limit: config_common.entry_per_page,
                    page: req.body.page
                }, cb, req)
            }
        ], function(err, result){
            if(err){
                return next(err)
            }
            // tipSV.getTime({
            //     user_id: req.decoded.id,
            //     type: config_common.tip_type.red_card_order
            // }, true, function () {});
            config_common.sendData(req, _.extend(result, {week_money: week_money}), next);
        });
    });



    api.post('/add', function (req, res, next) {
        async.waterfall([
            function (cb) {
                var flag=true;
                //权限
                if(config_common.accessRule.pass.indexOf(req.decoded.role)==-1){
                    flag = false;
                    return cb({dev: '限物流管理员'});
                }
                if(!req.body.card_id || (!req.body.userIds && !req.body.phones)){
                    flag = false;
                    return cb({dev: '缺少参数:'});
                }

                if(flag){
                    cb();
                }
            }, function (cb) {
                //查询红卡
                redCardSV.getOne({
                    find: {
                        _id: req.body.card_id,
                        status: config_common.demand_status.effective,
                        time_validity: {$gt: new Date()}
                    }
                },cb);
            }, function (card, cb) {
                if(!card){
                    return cb({dev: '数据丢失或单据过期'})
                }
                var loopObj = req.body.userIds || req.body.phones;
                var cond = {card_id: req.body.card_id};
                async.eachSeries(loopObj, function (obj, cb1) {
                    var userInfo={};
                    async.waterfall([
                        function(cb10){
                            if(req.body.userIds){
                                extServer.driverUser({user_id: obj},callback);
                            }else{
                                cb10(null,null);
                            }
                        },
                        function (user, cb10) {
                            if(user){
                                userInfo=user;
                            }
                            if(req.body.userIds){
                                cond.user_id = obj;

                            }else{
                                cond.user_phone = obj;
                            }
                            redCardOrderSV.getOne({
                                find: cond
                            }, function (err, order) {
                                if(order){
                                    cb1()
                                }else{
                                    cb10()
                                }
                            })
                        }, function(cb10){
                            var cardOrder = {
                                send_user_id: req.decoded.id,             //发卡人
                                card_id: req.body.card_id,            //卡id
                                user_id: req.body.userIds ? obj: '',     //接卡人
                                user_phone: req.body.phones ? obj: userInfo.phone,  //接卡人手机号
                                // money_remain: card.money,       //卡额度 number ,假设与红卡额度相同
                                time_validity: card.time_validity,        //卡有效期 date
//                         time_end: {type: Date},             //最后使用时间 date
//                         operate_num: {type: Number},        //使用次数 number
                                max_step: card.max_step,   //步长，单次使用额度
                                frequency: card.frequency,  //频率
                                status: config_common.demand_status.ineffective,
                                send_company_id:req.decoded.company_id,
                                send_company_name:req.decoded.company_name,
                            };
                            if(card.allot=='equal'){
                                cardOrder.money_remain = card.money;
                                cardOrder.money = card.money;
                            }
                            if(req.body.userIds){
                                //查询card_id 和 user_id 是否存在，
                                redCardOrderSV.add(cardOrder, cb10)
                            }else{
                                //若是手机号，需要校验手机号格式,或是否有相同号码存在
                                if(config_common.checkPhone(obj)){
                                    redCardOrderSV.add(cardOrder, cb10)
                                }else{
                                    cb10()
                                }
                            }
                        }
                    ], cb1);

                }, cb)
            }
        ],function(err, result){
            if(err){
                return next(err)
            }
            config_common.sendData(req, result, next);
        })

    });
    /*
     * 暂时不修改
     * */
    api.post('/edit', function (req, res, next) {
        config_common.sendData(req, 'not_using', next);
    });
    /*
     * 关闭红包
     * */
    api.post('/close', function (req, res, next) {

        config_common.sendData(req, 'not_using', next);

    });
    /*
    * 获取单个
    * */
    api.post('/get_one', function (req, res, next) {
        async.waterfall([
            function (cb) {
                var flag=true;
                if(!req.body.company_id && !req.body.user_id){
                    flag=false;
                    return cb({dev:'参数有误'})
                }
                if(flag){
                    cb();
                }
            },
            function(cb){
                redCardOrderSV.getOne({find: {
                    user_id: req.body.user_id,
                    send_company_id: req.body.company_id,
                    status: config_common.demand_status.effective,
                    time_validity: {$gt: new Date()}
                }}, cb);
            }
        ], function (x,y) {
            tipSV.getTime({
                user_id: req.decoded.id,
                type: config_common.tip_type.red_card_order
            }, true, function () {});
            config_common.sendData(req, y||{}, next);
        })
        
    });
    /**
    * 用户注册
    * 获取与手机号关联的红包列表
    * */
    /**
    * 用户登陆
    * 最后一次登陆时间，距最后一次登陆时间若有新的红包，则弹窗提醒
    * */

    /**
     * 用户挂靠
     * 挂靠成功后，获取被挂靠公司是否有红包，若有则生成一个对应的挂靠红包
     */
    api.post('/depend_red_card', function (req, res, next) {
        var card, cardOrder;
       async.waterfall([
           function (cb) {
               //查询 挂靠公司id 的挂靠红卡
               redCardSV.getOne({find: {
                   company_id: req.body.company_id,
                   theme:'depend'
               }}, cb)
           }, function(cardR, cb){
               card=cardR;
            //判断红卡与手机号　或id号
               redCardOrderSV.getOne({
                   find: {
                       card: card_id,
                       $or: [{user_id: req.decoded.id}, {phone: req.decoded.phone}]
                   }
               }, cb)
           }, function (cardOrderR, cb) {
               cardOrder=cardOrderR;
               if(cardOrder){
                   cardOrder.status=config_common.demand_status.effective;
                   cardOrder.save(cb);
               }else{
                   var order={
                       send_user_id: card.user_id,             //发卡人
                       send_company_id: card.company_id,             //发卡人
                       send_company_name: card.company_name,             //发卡人
                       card_id: card._id,            //卡id
                       user_id: req.decoded.id,     //接卡人
                       user_phone: req.decoded.phone,  //接卡人手机号
                       // money_remain: card.money,       //卡额度 number ,假设与红卡额度相同
                       time_validity: card.time_validity,        //卡有效期 date
//                         time_end: {type: Date},             //最后使用时间 date
//                         operate_num: {type: Number},        //使用次数 number
                       max_step: card.max_step,   //步长，单次使用额度
                       frequency: card.frequency,  //频率
                       status: config_common.demand_status.effective
                   };
                   if(card.allot=='equal'){
                       order.money_remain = card.money;
                       order.money = card.money;
                   }
                   redCardOrderSV.add(order, function (x,y) {
                       if(y){
                           card.flow=config_common.rscDecimal('add', card.flow, y.money_remain);
                           card.save(function () {})
                       }
                       cb(null, y);
                   })
               }
           }
       ], function (err, result) {
           if(err){
               return next(err);
           }
           config_common.sendData(req, result, next);

       })
    });

    /*
     * 新司机注册后关联挂靠(depend)红包和司机订单;
     * */
    api.post('/depend_run', function (req, res, next) {
        var card, cardOrder={};
        async.waterfall([
            function (cb) {
                //
                var flag=true;
                if(!req.body.company_id || !req.body.user_id ||!req.body.user_phone){
                    flag=false;
                    return cb({dev:'缺少挂靠公司id'})
                }
                if(flag){
                    cb();
                }

            },function(cb){
                extServer.generalFun(req, {
                    source: 'user',
                    db:'Driver_verify',
                    method:'getCount',
                    query: {
                        find: {
                            user_id: req.body.user_id,
                            company_id: req.body.company_id
                        },
                    }
                },cb);
            }, function (count,cb) {
                // if (count == 0) {
                //     return cb({dev: '用户与公司无挂靠关系'});
                // }
                async.parallel({
                    redcard: function(cb2){
                        async.waterfall([
                            function (cb3) {
                                redCardSV.getOne({
                                    find: {
                                        company_id: req.body.company_id,
                                        time_validity:{$gt: new Date()},
                                        status:config_common.demand_status.effective,
                                        theme:'depend'
                                    }
                                }, cb3)
                            },
                            function (cardR, cb3) {
                                card=cardR;
                                redCardOrderSV.getOne({
                                    find: {
                                        $or: [{user_id: req.body.user_id}, {user_phone: req.body.user_phone}],
                                        send_company_id: req.body.company_id,
                                        card_id: card._id
                                    }
                                }, cb3)
                            },
                            function (cardOrderR, cb3) {
                                if(cardOrderR){
                                    cardOrderR.status=config_common.demand_status.effective;
                                    cardOrderR.save(cb3);
                                }else{
                                    card.flow=config_common.rscDecimal('add', card.flow, card.money);
                                    card.save(function () {});
                                    redCardOrderSV.add({
                                        send_user_id: card.user_id,             //发卡人
                                        card_id: card.card_id,            //卡id
                                        user_id: req.body.user_id,     //接卡人
                                        user_phone: req.body.user_phone,  //接卡人手机号
                                        money_remain: card.money,       //卡额度 number ,假设与红卡额度相同
                                        time_validity: card.time_validity,        //卡有效期 date
                                        max_step: card.max_step,   //步长，单次使用额度
                                        frequency: card.frequency,  //频率
                                        status: config_common.demand_status.effective,
                                        send_company_id:card.company_id,
                                        send_company_name:card.company_name
                                    }, cb3);
                                }
                            }
                        ], cb2)
                    },
                    driver: function (cb2) {
                        driverOrderSV.updateList({
                            find:{
                                source: config_common.demand_source.driver_temp,
                                supply_user_phone: req.body.user_phone
                            },
                            set:{supply_user_id: req.body.user_id}
                        }, cb2)
                    }
                }, cb)
            }
        ], function (err, result) {
            if(err){
                return next(err);
            }
            config_common.sendData(req, result, next)
        })
    });
    /*
    * 登陆之后，被邀请注册后，先获取发邀请的物流公司id，然后获取他们的红卡，再激活红卡，返回激活红卡提醒
    * */
    return api;
};
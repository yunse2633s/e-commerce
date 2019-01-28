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


module.exports = function() {
    var api = express.Router();

    //token 解析判断
    api.use(require('../../middlewares/mid_verify_user')());

    api.post('/get_one', function (req, res, next) {
        async.waterfall([
            function (cb) {
                var flag=true;
                // if(!req.body.card_id){
                //     flag=false;
                //     return cb({dev: 'card_id'})
                // }
                if(flag){
                    cb();
                }
            },
            function (cb) {
                redCardSV.getOne({
                    find: {
                        // user_id: req.decoded.id,
                        company_id: {$in: req.decoded.company_id},
                        theme:'depend'
                    }
                }, cb)
            }
        ], function (err, result) {
            if(err){
                return next(err);
            }
            config_common.sendData(req, result, next);
        })

    });

    api.post('/get_count', function (req, res, next) {
        async.waterfall([
            function (cb) {
                redCardSV.getCount({
                    user_id: req.decoded.id,
                    status: config_common.demand_status.effective
                }, cb)
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
        async.waterfall([
            function (cb) {
                redCardSV.getList({
                    find: {
                        company_id: req.decoded.company_id
                    }
                }, cb)
            }
        ], function(err, result){
            if(err){
                return next(err)
            }
            config_common.sendData(req, result, next);
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
                if((new Date()).getTime() < (new Date('2019/6/1').getTime())){
                    req.body.scope='all',
                    // req.body.time_validity= new Date('2019/1/1'),
                    req.body.max_step=1,
                    req.body.frequency=100,
                    req.body.theme='depend', //挂靠 depend，合作 partner，邀请 invite，推荐 recommend，
                    req.body.allot='equal'; //相等 equal, 均分 average 随机 random
                }
                _.each(['name','scope','money','time_validity','max_step','theme','allot'], function(a){
                    if(!req.body[a]){
                        flag = false;
                        return cb({dev: '缺少参数:'+a});
                    }
                });
                if(flag){
                    cb();
                }
            },
            function (cb) {
                var redCard =  {
                    user_id: req.decoded.id,     //表单发起者的用户ID。
                    company_id: req.decoded.company_id,  //表单发起者的用户公司ID。
                    company_name: req.decoded.company_name, //公司名字
                    name: req.body.name,       //优惠卷名称
                    scope: req.body.scope,      //使用范围 信息费，货运费
                    money: req.body.money,      //红包金额
                    time_validity: req.body.time_validity, //有效期
                    // time_creation: new Date(), //创建时间
                    status: config_common.demand_status.effective,     //红包状态
                    max_step: req.body.max_step,   //步长，单次使用额度
                    frequency: req.body.money, //req.body.frequency,  //频率
                    theme: req.body.theme,         //类型 邀请型, 待注册型，线下找车型
                    allot: req.body.allot,      //均分，随机，同面值 average radmon 等值
                };
                redCardSV.add(redCard, cb);
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
        async.waterfall([
            function (cb) {
                var flag=true;
                //权限
                if(config_common.accessRule.pass.indexOf(req.decoded.role)==-1){
                    flag = false;
                    return cb({dev: '限物流管理员'});
                }
                _.each(['card_id'], function(a){
                    if(!req.body[a]){
                        flag = false;
                        return cb({dev: '缺少参数:'+a});
                    }
                });
                if(flag){
                    cb();
                }
            }, function (cb) {
                redCardSV.getOne({
                    find: {
                        _id: req.body.card_id,
                        company_id: req.decoded.company_id
                    }
                }, cb)
            }, function (card, cb) {
                if(!card){
                    return cb({dev: '信息未找到'})
                }
                card.user_id=req.decoded.id;
                if(req.body.time_validity){
                    card.price_chart.push({
                        money: card.money,
                        time_validity:card.time_validity,
                        time_modify: Date.now()
                    });
                    card.time_validity=req.body.time_validity;
                }
                if(req.body.money){
                    card.price_chart.push({
                        money: card.money,
                        time_validity:card.time_validity,
                        time_modify: Date.now()
                    });
                    card.money=req.body.money;
                }
                if(req.body.time_validity || req.body.money){
                    card.time_modify=Date.now();
                }

                card.status = req.body.status || config_common.demand_status.effective;
                card.save(cb);
            }
        ],function(err, result){
            if(err){
                return next(err)
            }
            config_common.sendData(req, result, next);
        })
    });
    /*
    * 关闭红包
    * */
    api.post('/close', function (req, res, next) {
        async.waterfall([
            function (cb) {
                var flag=true;
                //权限
                if(config_common.accessRule.pass.indexOf(req.decoded.role)==-1){
                    flag = false;
                    return cb({dev: '限物流管理员'});
                }
                _.each(['card_id'], function(a){
                    if(!req.body[a]){
                        flag = false;
                        return cb({dev: '缺少参数:'+a});
                    }
                });
                if(flag){
                    cb();
                }
            }, function (cb) {
                redCardSV.getOne({
                    find: {
                        _id: req.body.card_id
                    }
                }, cb)
            }, function (card, cb) {
                if(!card){
                    return cb({dev: '信息未找到'})
                }
                card.status = config_common.demand_status.cancelled;
                card.save(cb);
            }
        ],function(err, result){
            if(err){
                return next(err)
            }
            config_common.sendData(req, result, next);
        })

    });
    return api;
};
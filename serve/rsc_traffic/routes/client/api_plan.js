/**
 * sj 20170424.
 */
//外部工具引用
var async = require('async');
var _ = require('underscore');
var express = require('express');
var decimal = require('decimal');
//内部工具引用
var http = require('../../lib/http');
var util = require('../../lib/util');

//配置文件引用
var config_api_url = require('../../configs/config_api_url');
// var config_server = require('../../configs/config_server');
var config_msg_template = require('../../configs/config_msg_template');
var config_common = require('../../configs/config_common');
//内部数据操作引用
var trafficDemandSV = require('../../lib/lib_traffic_demand');
var trafficPlanSV = require('../../lib/lib_traffic_plan');
var trafficOrderSV = require('../../lib/lib_traffic_order');
var extServer = require('../../lib/lib_ext_server');
var trafficLineSV = require('../../lib/lib_traffic_line');


module.exports = function() {
    var api = express.Router();

    //token 解析判断
    api.use(require('../../middlewares/mid_verify_user')());

    api.post('/get_one', function (req, res, next) {
        config_common.sendData(req, 'not_using', next);
    });

    api.post('/get_count', function (req, res, next) {

        var cond={user_id: req.decoded.id}, planstatus={ineffective: 0, effective: 0, complete: 0, cancelled:0};
        async.waterfall([
            function (cb) {
                //角色判断
                if(config_common.accessRule.pass.indexOf(req.decoded.role)==-1){
                    return cb({dev: '仅限物流', pro: '000002'});
                }
                var flag = true;
                if(!req.body.status){
                    flag = false;
                    return cb({dev: '', pro: ''});
                }
                if(flag){
                    cb();
                }
            },
            function(cb){
                if(req.body.status == 'all'){
                    trafficPlanSV.getAggregate({
                        match: cond,
                        group: {_id: '$status', num: { $sum: 1 }}
                    }, cb);
                }else{
                    if(!config_common.demand_status[req.body.status]){
                        return cb({dev: 'status值超出范围', pro: '000003'});
                    }
                    cond.status = config_common.demand_status[req.body.status];
                    driverPlanSV.getCount(cond,cb)
                }
            }, function(statisRes, cb){
                if(req.body.status == 'all'){
                    _.each(statisRes, function(status){
                        planstatus[status._id] = status.num;
                    });
                    cb(null, planstatus);
                }else{
                    cb(null, statisRes);
                }

            }], function(err,result){
            if(err) return next(err);
            config_common.sendData(req, result, next);
        });
    });
    /**
     * get_list 20170922 20171122 增加公司id筛选
     */
    api.post('/get_list', function (req, res, next) {
        //初始值
        req.body.page = req.body.page || 1;
        req.body.is_refresh = true; //['true', true, 1, '1'].indexOf(req.body.is_refresh) != -1; //若存在下列刷新，则修改个人查阅时间;
        var planList = {}, planOne={} , cond, new_count;
        async.waterfall([
            function (cb) {
                //角色判断
                if(config_common.accessRule.pass.indexOf(req.decoded.role)==-1){
                    return cb({dev: '仅限物流', pro: '000002'}); //('not_allow');
                }
                //参数判断
                if(!req.body.status || !config_common.demand_status[req.body.status]){
                    return cb({dev: 'status参数有误', pro: '000003'}); //('status_invalid_format');
                }else{
                    cond = {
                        user_id: req.decoded.id,
                        status: req.body.status == config_common.demand_status.effective ? 'effective' : 'ineffective' //{$in: ['ineffective', 'cancelled']}
                    };
                    cb();                    
                }

            }, 
            function (cb) {
            //     extServer.tipPassPlan({
            //         user_id: req.decoded.id,
            //         company_id: req.decoded.company_id[0],
            //         other_company_id: req.decoded.company_id[0]
            //     }, req.body.is_refresh, null, cb);
            // },
            // function (tipTime, cb) {
            //     if(tipTime){
            //         cond.time_modify = {$lte: tipTime.update_time};
            //         new_count = tipTime.count
            //     }
                if(req.body.company_id){
                    cond.demand_company_id = req.body.company_id;
                }
                trafficPlanSV.getList({
                    find: cond,
                    sort: {time_creation: -1},
                    skip: (req.body.page-1)*config_common.entry_per_page,
                    limit: config_common.entry_per_page,
                    page: req.body.page
                }, cb);
            }
        ], function(err, result){
            if(err) return next(err);
            planList['list'] = result.orders;
            planList['count'] = result.count;
            planList['exist'] = result.exist;
            planList['new_count'] = new_count;
            config_common.sendData(req, planList, next);
        });
    });

    api.post('/close', function (req, res, next) {
        async.waterfall([
            function (cb) {
                //角色判断
                if(config_common.accessRule.pass.indexOf(req.decoded.role)==-1){
                    return cb({dev: '仅限物流', pro: '000002'}); //('not_allow');
                }
                //参数判断
                if(!req.body.plan_id){
                    return cb({dev: 'plan_id参数有误', pro: '000003'}); //('plan_id_invalid_format');
                }
                cb();
            },  function (cb) {
                trafficPlanSV.getOne({
                    find: {
                        plan_id: req.body.plan_id,
                        user_id: req.decoded.id,
                        status: {$in: ['ineffective', 'effective']}//config_common.demand_status.ineffective
                    }
                }, cb);
            }, function (plan, cb) {
                if(!plan){
                    return cb({dev: '物流接单数据没找到', pro: '000004'}); //('not_found');
                }
                plan.status = config_common.demand_status.cancelled;
                plan.sorting=config_common.demand_status_sort[plan.status];
                plan.time_modify = new Date();
                plan.save({});
            }
        ], function(err, result){
            if(err) return next(err);
            config_common.sendData(req, true, next);
        });
    });
    /**
     * 20170704 物流接单挂号，由买方决定司机运输情况;
     * 20180523 未指派的依然可以接单，并形成合作关系
     */
    api.post('/add', function (req, res, next) {

        var demandOne={}, planOne={};
        async.waterfall([
            function (cb) {
                //角色判断
                if(config_common.accessRule.pass.indexOf(req.decoded.role)==-1 || req.decoded.company_id.length==0){
                    return cb({dev: '仅限物流', pro: '000002'}); //('not_allow');
                }
                //参数判断
                if(!req.body.demand_id || !req.body.price || !Number(req.body.price)){
                    return cb({dev: 'demand_id参数有误', pro: '000003'}); //('demand_id_invalid_format');
                }
                cb();
            }, function (cb) {
                //查询是否有这个需求单， 查询是否有与该需求单产生过报名;
                trafficDemandSV.getOne({
                    find: {
                        _id: req.body.demand_id
                        // verify_company: {$in :[req.decoded.company_id[0]]}, //被指派过;
                        // $or: [
                        //     { verify_company: {$in: req.decoded.company_id} },
                        //     { platform_company: {$in: req.decoded.company_id} }
                        // ]
                    }
                }, cb);
            }, function(demand, cb){
                if(!demand){
                    return cb({dev: '物流需求单没找到', pro: '000004'}); //('demand_not_found');
                }
                if(demand.status != config_common.demand_status.effective){
                    return cb({dev: '该笔单据已过期', pro: '000004'});
                }
                demandOne = demand;
                //20180611 判断是否有认证关系，公司与公司 ，若是人与人的工作关系。
                // extServer.generalFun(req, {
                //     source: 'user',
                //     db:'Company_relation',
                //     method:'getList',
                //     query:{
                //         find: {
                //             other_id: {$in: req.decoded.company_id}, //req.decoded.company_id[0],
                //             other_type:'TRAFFIC'
                //         },
                //         select: 'self_id'
                //     }}, function(err, company){
                //     var relationCompany = _.pluck(company, 'self_id');
                //     //平台推荐或合作企业的均可以接单
                //     if(demandOne.platform_company.indexOf(req.decoded.company_id[0])==-1 && relationCompany.indexOf(demandOne.demand_company_id)==-1){
                //         return cb({dev: '您不能接单,请联系发单负责人', pro: '000004'});
                //     }
                    //判断自己是否参与过。
                    trafficPlanSV.getCount({demand_id: req.body.demand_id, user_id: req.decoded.id, status: config_common.demand_status.effective}, cb)
                // })

            }, function(count, cb){
                if(count){
                    return cb({dev: '您已经接单,请勿重复操作', pro: '000007'}); //('plan_exists');
                }
                //20171101 标注需求单的来源
                var demandSource =
                    demandOne.verify_company.indexOf(req.decoded.company_id[0]) > -1 ? demandOne.source :
                        // req.decoded.company_id.indexOf(demandOne.demand_company_id) > -1 ? config_common.demand_source.loot_demand : config_common.demand_source.platform_assign;
                        demandOne.platform_company.indexOf(req.decoded.company_id[0]) > -1 ? config_common.demand_source.loot_demand : config_common.demand_source.platform_assign;
                trafficPlanSV.add({
                    demand_id: req.body.demand_id,
                    user_id: req.decoded.id,
                    user_name: req.decoded.user_name,
                    company_id: _.isArray(req.decoded.company_id) ? req.decoded.company_id[0] : req.decoded.company_id,
                    company_name: req.decoded.company_name,
                    demand_user_id: demandOne.demand_user_id,
                    demand_company_id: demandOne.demand_company_id,
                    demand_company_name: demandOne.demand_company_name,
                    status: config_common.demand_status.effective,
                    time_creation: new Date(),
                    time_modify: new Date(),
                    source: demandSource,
                    admin_id: req.decoded.admin_id,
                    price: req.body.price||0.1,
                    line_id: req.body.line_id||''
                }, cb);
            }, function (plan, count, cb) {
                planOne = plan.toObject();
                //线路价格修改
                if(req.body.line_id){
                    trafficLineSV.getOne({find: {_id: req.body.line_id}}, function (x,y) {
                        if(y){
                          var goto=(_.intersection(y.section, demandOne.section)).length;
                          var goback=(_.intersection(y.end_section, demandOne.end_section)).length;
                          if(goto>0 && goto>=goback && y.money != req.body.price){
                            y.price_chart.push({unmoney: y.unmoney, money: y.money,time_modify: Date.now()});
                            y.money = req.body.price;
                            y.markModified('price_chart');
                            y.time_modify=new Date();
                            y.save(function(){})
                          }else if( y.unmoney !=req.body.price){
                            y.price_chart.push({unmoney: y.unmoney, money: y.money,time_modify: Date.now()});
                            y.unmoney = req.body.price;
                            y.markModified('price_chart');
                            y.time_modify=new Date();
                            y.save(function(){})
                          }
                        }
                    })
                }
                //判断是否增加合作关系
                if(demandOne.platform_company.indexOf(req.decoded.company_id[0]) > -1){
                    extServer.tradePassRelation(req, {
                        trade_user_id: demandOne.demand_user_id,
                        trade_company_id: demandOne.demand_company_id,
                        pass_company_id: req.decoded.company_id[0],
                        pass_user_id: req.decoded.id
                    }, function (x,y) {
                    })
                }
                //向PlanOne中增加发布需求单的用户信息;
                extServer.userFind({user_id: demandOne.demand_user_id}, function (err, user) {
                    if(user){
                        planOne = _.extend(planOne, {demand_user_info: user});
                    }
                    cb();
                })

            }, function (cb) {
                //修改物流需求单，增加报名表
                // demandOne.unoffer_list.unshift(planOne.company_id); //将当前公司向数组的第一个位置插入;
                demandOne.unoffer_list.unshift(planOne.user_id); //将当前用户向数组的第一个位置插入;
                // if(demandOne.verify_company.indexOf(planOne.company_id)== -1 && demandOne.platform_company.indexOf(planOne.company_id)== -1){
                //     demandOne.plan_company.push(planOne.company_id);
                //     demandOne.assign_count ++;
                // }else{
                //     if(demandOne.verify_company.indexOf(planOne.company_id) > -1){
                //         demandOne.verify_company.splice(demandOne.verify_company.indexOf(planOne.company_id), 1);//删除verify_company中已经报名的企业
                //     }
                //     if(demandOne.platform_company.indexOf(planOne.company_id) > -1){
                //         demandOne.platform_company.splice(demandOne.platform_company.indexOf(planOne.company_id), 1);//删除platform_company中已经报名的企业
                //     }
                // }
                //没指派，且有认证关系的可以接单.
                if(demandOne.verify_company.indexOf(planOne.company_id)== -1 && demandOne.platform_company.indexOf(planOne.company_id)== -1){
                    demandOne.plan_company.push(planOne.company_id);
                    demandOne.assign_count ++;
                }

                demandOne.time_modify = new Date();
                demandOne.offer_count++;
                demandOne.save(function () {
                    //向交易服务器发送通知;
                    http.sendTradeServerNew(req, {
                        'index': demandOne.index_trade
                    }, config_api_url.trade_order_update,function (err) {
                        console.log('物流接单,交易服务出现'+err);
                        cb();
                    })
                });
                
            }
        ], function(err, result){
            if(err) return next(err);
            //推送消息
            var msgObj = {
                title: '物流参与指派',
                content: config_msg_template.encodeContent('traffic_agree_assign', [
                    demandOne.send_city,
                    demandOne.receive_city,
                    demandOne.category_chn,
                    req.decoded.company_name ? req.decoded.company_name : '',
                    req.decoded.user_name ]),
                user_ids: [demandOne.demand_user_id]
            };
            var routerUrl = {params: {id: demandOne._id, status: demandOne.status}, url: config_common.push_url.trade_traffic_demand};
            //{params: {demand_id: demandOne._id}, url: config_common.push_url.traffic_demand};20180209
            extServer.push(req, msgObj, {}, '', routerUrl, function(){});
            config_common.sendData(req, planOne, next);
        });
    });
    //判断是否存在
    api.post('/exists', function (req, res, next) {
        //
        async.waterfall([
            function (cb) {
                //判断参数
                if(!req.body.demand_id){
                    return cb({dev: 'demand_id参数有误', pro: '000003'}); //('demand_id_invalid_format');
                }
                cb();
            }, function (cb) {
                //查询数量
                trafficPlanSV.getCount({
                    user_id: req.decoded.id,
                    demand_id: req.body.demand_id
                }, cb)
            }
        ], function (err, result) {
            config_common.sendData(req, err || result==0 ? false : true, next);
        });
    });
    /**
     * 公司名筛选
     */
    api.post('/get_company_count', function (req, res, next) {
        var match={}, group={}, otherRole, cond={}, orderArr, statis_company=[];
        async.waterfall([
            function (cb) {
                if(config_common.accessRule.pass.indexOf(req.decoded.role)==-1){
                    return cb({dev: '限物流'});
                }
                match = {user_id: req.decoded.id};
                group = {_id: '$demand_company_id', sum: {$sum: 1}};
                trafficPlanSV.getAggregate({
                    match: match,
                    group: group
                }, cb);
            }, function (statisOrder, cb) {
                if(!statisOrder){cb();}
                orderArr = statisOrder;
                //查询公司名称
                async.eachSeries(orderArr, function (order, cb1) {
                    extServer.generalFun(req, {
                        source: 'user',
                        db:'Company_trade',
                        method:'getOne',
                        query:{
                            find: {
                                _id: order._id
                            },
                            select: 'nick_name'
                        }}, function(err, company){
                        if(company){
                            order.company_name = company.nick_name||'';
                            statis_company.push(order);
                        }
                        cb1();
                    });
                }, cb);
            }
        ], function (err, result) {
            if(err){
                return next(err);
            }
            config_common.sendData(req, statis_company, next);
        });
    });


    return api;
};
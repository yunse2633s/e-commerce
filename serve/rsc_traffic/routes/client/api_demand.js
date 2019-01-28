/**
 * Created by Administrator on 2015/11/19.
 */
var async = require('async');
var express = require('express');
var http = require('../../lib/http');
var util = require('../../lib/util');
var _ = require('underscore');

var config_common = require('../../configs/config_common');
var config_api_url = require('../../configs/config_api_url');
var config_msg_template = require('../../configs/config_msg_template');
var config_server = require('../../configs/config_server');

var trafficDemandSV = require('../../lib/lib_traffic_demand');
var trafficOrderSV = require('../../lib/lib_traffic_order');
var extServer = require('../../lib/lib_ext_server');
var trafficPlanSV = require('../../lib/lib_traffic_plan');
var tipSV = require('../../lib/lib_tip');
var driverOrderSV=require('../../lib/lib_traffic_driver_order');
var trafficLineSV=require('../../lib/lib_traffic_line')
module.exports = function() {
    var api = express.Router();
    api.use(require('../../middlewares/mid_verify_user')(true));
    /*
     获取单个记录 20170421
     param: demand_id demand_index index_trade scene
     return: demand
     */
    api.post('/get_one', function(req, res, next){
        var query = {}, demandOne={};
        //执行操作
        async.waterfall([
            function (cb) {
                var flag = true;
                if(!req.body.demand_id){
                    flag=false;
                    return cb({dev:'demand_id参数丢失', pro: '000003'});
                }
                if(req.body.demand_id){
                    query._id = req.body.demand_id;
                }
                if(flag){
                    cb();
                }
            },
            function(cb){
                trafficDemandSV.getDemandOne({
                    find: query
                },cb);
            }, function (result, cb) {
                demandOne = result;
                trafficDemandSV.getOne({find: query}, function (err, demand) {
                    if(req.decoded && req.decoded.id != demand.demand_user_id){
                        if(demand.view_id.indexOf(req.decoded.id) == -1){
                            demand.view_id.push(req.decoded.id);
                        }
                        if((demand.view_id.length - demand.unoffer_list.length) >=105 && 1==2){
                            //推送 或发短信
                            async.waterfall([
                                function (push) {
                                    var msgObj = {
                                        title: '报价提醒',
                                        //尊敬的xx总你好，您发布的钢铁报价已被#等5家新的企业查看未下单，请立即登录查看（链接）
                                        content: config_msg_template.encodeContent('demand_view', [
                                            demandOne.user_name,
                                            req.decoded.company_name ? req.decoded.company_name : '',
                                            demand.view_id.length,
                                            'url'
                                        ]),
                                        user_ids: [demand.demand_user_id]
                                    };
                                    extServer.push(req, msgObj, {}, '', {
                                        params: {id: demand._id.toString(), status: demand.status},
                                        url: config_common.push_url.trade_traffic_demand
                                    }, push);
                                }
                            ], function () {});
                        }
                        demand.save(cb);
                    }else{
                        cb();
                    }
                })
            }
        ], function(err, result){
            if(err){
                return next(err);
            }
            config_common.sendData(req, demandOne, next);
        });
    });
    /**
     * 获取指派中的公司信息 和状态 20170708
     */
    api.post('/assign_company_info', function(req, res, next){
        //角色判断
        //参数判断
        if(!req.body.demand_id){
            return next({dev: 'demand_id参数有误', pro: '000003'}); //'invalid_format'
        }
        //场景判断
        var cond={};
        if(req.body.demand_id){
            cond._id = req.body.demand_id;
        }
        var //demandList=[],
            demandList={assign: [], loot: []},
            trafficDemand,
            company_arr=[],//已存在的公司
            companyOne;
        async.waterfall([
            function (cb) {
                //  依据应用场景判断获取 需求单或是订单
                trafficDemandSV.getOne({
                    find: cond
                }, cb);
            }, function (demandRes, cb) {
                
                if(!demandRes) return cb({dev: '需求单未找到', pro: '000004'}); //'not_fount'
                trafficDemand = demandRes;
                if(trafficDemand.unoffer_list.length>0){
                    async.waterfall([
                        function (cb2) {
                            trafficPlanSV.onlyList({
                                find: {
                                    // company_id: {$in: trafficDemand.unoffer_list},
                                    user_id: {$in: trafficDemand.unoffer_list},
                                    demand_id: req.body.demand_id,
                                },
                                sort: req.body.sort || {price: -1}
                            }, cb2);
                        }, function (plans, cb2) {
                            async.eachSeries(plans, function (plan, cb1) {
                                async.waterfall([
                                    function (cb2) {
                                        extServer.userFind({user_id: plan.user_id}, cb2)
                                    },
                                    function (user, cb2) {
                                        if(!user){
                                            cb1();
                                        }
                                        companyOne = user;
                                        //是否有订单
                                        trafficOrderSV.getOne({find: {
                                            supply_user_id: plan.user_id,
                                            supply_company_id: plan.company_id,
                                            demand_id: plan.demand_id
                                        }}, cb2)
                                    },
                                    function(order, cb2){
                                        //获取计划
                                        company_arr.push(companyOne['company_id']);
                                        companyOne['_id']=companyOne['company_id'];
                                        companyOne['nick_name']= companyOne['company_name'];
                                        companyOne['url_logo']= companyOne['company_logo'];
                                        if(order){
                                            companyOne['order_id'] = order._id.toString();
                                            companyOne['order_amount'] = order.amount;
                                            companyOne['status'] = order.status;
                                            companyOne['source'] = order.source;//20171101区分是否为平台推荐
                                        }else{
                                            companyOne['status'] = 'wait_assign';
                                            companyOne['plan_id'] = plan._id.toString();
                                            companyOne['plan_price'] = plan.price || 0;
                                            companyOne['plan_time_creation'] = plan.time_creation;
                                            companyOne['user_id'] = plan.user_id;
                                            companyOne['source'] = plan.source;
                                        }
                                        //如果非指派过来的数据，则放在。。
                                        // demandList={assign: [], loot: []}
                                        if(trafficDemand.plan_company.indexOf(plan.company_id)>-1){
                                            demandList.loot.push(companyOne);
                                        }else{
                                            demandList.assign.push(companyOne);
                                        }
                                        cb2();
                                    }
                                ], cb1)
                            }, cb2);
                        }
                    ], cb);
                }else{
                    cb();
                }
            }, function (cb) {
                //优化: verify_company + platform_company 合并后，使用键值对
                if(trafficDemand.verify_company.length>0){
                    // async.eachSeries(trafficDemand.verify_company, function (companyId, cb1) {
                    async.eachSeries(_.difference(trafficDemand.verify_company, company_arr), function (companyId, cb1) {
                        async.waterfall([
                            function (cb10) {
                                //获取公司信息
                                extServer.generalFun(req, {
                                    source: 'user',
                                    db:'Company_traffic',
                                    method:'getOne',
                                    query:{
                                        find: {
                                            _id: companyId
                                        },
                                        select: 'nick_name url_logo verify_phase phone_creator'
                                    }}, cb10);
                            }, function (company, cb10) {
                                if (!company) {
                                    return cb1({dev: '公司信息未找到', pro: '000004'});
                                }
                                companyOne = company;
                                companyOne['status'] = config_common.demand_status.ineffective;
                                companyOne['source'] = trafficDemand.source;
                                // demandList.push(companyOne);
                                demandList.assign.push(companyOne);
                                cb10();
                            }
                        ], cb1);
                    }, cb);
                }else{
                    cb();
                }
            }, function (cb) {
                if(trafficDemand.platform_company.length>0){
                    // async.eachSeries(trafficDemand.platform_company, function (companyId, cb1) {
                    async.eachSeries(_.difference(trafficDemand.platform_company, company_arr), function (companyId, cb1) {
                        async.waterfall([
                            function (cb10) {
                                //获取公司信息
                                extServer.generalFun(req, {
                                    source: 'user',
                                    db:'Company_traffic',
                                    method:'getOne',
                                    query:{
                                        find: {
                                            _id: companyId
                                        },
                                        select: 'nick_name url_logo verify_phase phone_creator'
                                    }}, cb10);
                            }, function (company, cb10) {
                                if (!company) {
                                    return cb1({dev: '公司信息未找到', pro: '000004'});
                                }
                                companyOne = company;
                                companyOne['status'] = config_common.demand_status.ineffective;
                                companyOne['source'] = config_common.demand_source.platform_assign;
                                // demandList.push(companyOne);
                                demandList.assign.push(companyOne);
                                cb10();
                            }
                        ], cb1);
                    }, cb);
                }else{
                    cb();
                }
            }
        ], function (err) {
            if(err) {
                return next(err);
            }
            if(1==2 && req.decoded && trafficDemand && trafficDemand.status== config_common.demand_status.effective && req.decoded.id != trafficDemand.demand_user_id){
                // 推送消息
                var msgObj = {
                    title: '查看货源',
                    content: config_msg_template.encodeContent('view_demand', [req.decoded.user_name]),
                    user_ids: [trafficDemand.demand_user_id]
                };
                // extServer.push(req, msgObj, {}, '', {}, function(){});
                extServer.push(req, msgObj, {}, '', {
                    params: {id: trafficDemand._id.toString(), status: trafficDemand.status},
                    //, type: config_common.push_url.driver_order_detail
                    url: config_common.push_url.trade_traffic_demand
                }, function(){});
            }
            config_common.sendData(req, demandList, next);
        });

    });

    api.use(require('../../middlewares/mid_verify_user')());
    /**
     * 获取数量 201704..
     * param: status , find_role
     * return: count
     */

    api.post('/get_count', function(req, res, next){
        //    role & param judge
        if(req.decoded.role == config_common.user_roles.TRADE_ADMIN &&
            req.decoded.role == config_common.user_roles.TRADE_PURCHASE &&
            req.decoded.role == config_common.user_roles.TRADE_SALE){
            return next({dev:'仅限交易方', pro: '000002'});
        }
        req.body.status = 'all'; req.body.find_role = 'user';
        if(!req.body.status || !req.body.find_role || !config_common.find_role[req.body.find_role]){
            return next({dev:'参数status,find_role有误', pro: '000003'});
        }
        //    condition aggregate
        var cond={};
        if(config_common.find_role[req.body.find_role] == 'company' ){
            cond.demand_company_id = req.body.company_id;
        }else{
            cond.demand_user_id = req.body.user_id;
        }
        //    execute
        var demandstatus={ineffective: 0, effective: 0, complete: 0, cancelled:0}, condition= !req.body.condition ? 'special' : req.body.condition; //['common','special'] 通用查询和特殊查询
        async.waterfall([
            function (cb) {
              if(condition=='common'){
                  async.waterfall([
                      //聚合方式查询
                      function(cb1){
                          if(req.body.status == 'all'){
                              trafficDemandSV.getAggregate({
                                  match: cond,
                                  group: {_id: '$status', num: { $sum: 1 }}
                              }, cb1);
                          }else{
                              if(!config_common.demand_status[req.body.status]){
                                  return cb1({dev: '参数status有误', pro: '000003'});
                              }
                              cond.status = config_common.demand_status[req.body.status];
                              trafficDemandSV.getCount(cond,cb1)
                          }
                      }, function(statisRes, cb1){
                          if(req.body.status == 'all'){
                              _.each(statisRes, function(status){
                                  demandstatus[status._id] = status.num;
                              });
                              cb1(null, demandstatus);
                          }else{
                              cb1(null, statisRes);
                          }

                      }
                  ], cb);
              }else{
                  async.waterfall([
                      //特定条件单独查询
                      function (cb1) {
                        //获取限定时间内的单据数量
                          tipSV.getTime({
                              user_id: req.decoded.id,
                              company_id: req.decoded.company_id,
                              other_company_id: req.decoded.company_id,
                              type: config_common.tip_type.pass_demand
                          }, false, cb1)
                      },
                      function (tipTime, cb1) {
                          if(tipTime){
                              cond.time_modify = {$lte: tipTime.update_time};
                          }
                          cond.status = config_common.demand_status.ineffective;
                          cond.time_validity = {$lt: new Date()};
                          trafficDemandSV.getCount(cond, cb1);
                      },
                      function (count, cb1) {
                          demandstatus.ineffective = count;
                          cond.status = config_common.demand_status.effective;
                          cond.time_validity = {$gte: new Date()};
                          trafficDemandSV.getCount(cond, cb1);
                      }, function (count, cb1) {
                          demandstatus.effective = count;
                          cb1(null, demandstatus)
                      }
                  ], cb);
              }
            }
        ], function(err,result){
            if(err) return next(err); //多余
            config_common.sendData(req, result, next);
        });
    });
    //
    /**
     * 20170713 指派物流需求单
     * param: index_trade,scene,time_depart,time_arrival,payment_choice,payment_method,weigh_settlement_style,att_traffic,time_validity,company_ids,product_categories
     * return: demand
     */
    
    api.post('/add_new', function(req, res, next){
        if(req.decoded.role != config_common.user_roles.TRADE_ADMIN &&
            req.decoded.role != config_common.user_roles.TRADE_SALE &&
            req.decoded.role != config_common.user_roles.TRADE_PURCHASE){
            return next({dev: '仅限交易方', pro: '000002'});
        }

        //基础数据判断
        var statisCompany = [];
        async.waterfall([
            function (cb) {
                var flag = true;
                var checkout_fields =[
                    {field: 'index_trade', type:'string'},
                    {field: 'scene', type:'string'},
                    {field: 'payment_choice', type:'enum'},
                    {field: 'payment_method', type:'enum'},
                    {field: 'time_validity', type:'date'},
                    {field: 'company_ids', type:'array'},
                    {field: 'product_categories', type:'object'}
                ];
                config_common.checkField(req, checkout_fields, function (err) {
                    if(err){
                        flag = false;
                        return cb({dev: err+'参数有误', pro: '000003'});
                    }
                    req.body.count_day_extension = Number(req.body.count_day_extension) || 0;
                });
                //检查补货中产品结构是否有补货价格; pass_price amount_unit
                if (req.body.replenish) {
                    _.each(req.body.replenish, function (x) {
                        if (!x['layer'] || !x['pass_price']) {
                            flag = false;
                            return cb({dev: 'replenish_construct'});
                        }
                    });
                }
                req.body.product_categories = config_common.randomProductId(req.body.product_categories);
                if(flag){
                    cb();
                }
            },
            function (cb) {
                trafficDemandSV.addScene(req, cb);
            }
        ], function(err, demandRes){
            if(err){
                return next(err);
            }
            if(true){
                //向动态服务器增加动态
                extServer.addDynamicServer({
                    company_id: demandRes.demand_company_id,
                    user_id: demandRes.demand_user_id,
                    type: config_common.typeCode.traffic_assign,
                    data: JSON.stringify(demandRes)
                }, function(){});
                //向统计服务器累计
                extServer.statisticalSV({
                    companyObj: [{
                        type: config_common.statistical.assign,
                        id: req.decoded.company_id,
                        count: req.body.company_ids.length
                    }]
                }, 'trade', function(err){
                    console.log('统计服务器trade',req.decoded.company_id, err)
                });
                _.each(req.body.company_ids, function(companyId){
                    statisCompany.push({
                        type: config_common.statistical.company_assign,
                        id: companyId
                    })
                });
                extServer.statisticalSV({
                    companyObj: statisCompany
                }, 'traffic', function(err){
                    console.log('统计服务器traffic', err)
                });
                //获取物流公司名下的用户id,并推送。
                async.waterfall([
                    function (push) {
                        http.sendUserServerNew(req, {
                            cond: {find: {company_id: {$in: _.union(demandRes.verify_company, demandRes.platform_company)}, role: {$in: config_common.accessRule.pass}}, select:'real_name'},
                            model: 'User_traffic',
                            method: 'getList'
                        }, config_api_url.user_server_common, push);
                    },
                    function (users, push) {
                        async.eachSeries(users, function (user, push1) {
                            var msgObj = {
                                title: '指派物流',
                                //尊敬的XX总，XX集团给您指派运输太原—长治螺纹钢3852吨运输，每吨100元
                                content: config_msg_template.encodeContent('trade_assign_traffic', [
                                    user.real_name,
                                    demandRes['demand_company_name'] ? demandRes['demand_company_name'] : '',
                                    demandRes['send_city'],
                                    demandRes['receive_city'],
                                    demandRes['category_chn'],
                                    demandRes['amount'],
                                    demandRes['price_min'],
                                    'url'
                                ]),
                                user_ids: [user._id]
                            };
                            extServer.push(req, msgObj, {}, '', {
                                params: {
                                    demand_id: demandRes._id.toString(),
                                    wait:'newRec'
                                },
                                url: config_common.push_url.traffic_demand
                            }, function () {
                                push1()
                            });

                        }, push)
                    }
                ], function () {});
            }
            config_common.sendData(req, demandRes, next);
        });

    });

    //根据条件查找需求单 20170420
    /**
     * 货运大厅，关系，生意 scene['foyer','relation','friend'] 20180425废弃
     */
    api.post('/find', function(req, res, next){
        //角色判断
        if(config_common.accessRule.pass.indexOf(req.decoded.role)==-1){
            return next({dev: '仅限物流方', pro: '000002'});
        }
        // //场景判断 relation:关系 foyer:大厅 friend:朋友圈， recommend:智能推荐(2018已更换接口)
        if(!req.body.scene || ['relation','foyer','friend','recommend'].indexOf(req.body.scene) == -1){
            return next({dev: '参数有误', pro: '000002'});
        }
        req.body.page = parseInt(req.body.page) || 1;
        req.body.verify = req.body.verify || [];
        req.body.is_refresh = true; //['true', true, 1, '1'].indexOf(req.body.is_refresh) != -1;
        var cond = {}, new_count = 0, demandRes={};
        cond.time_validity = {$gt: new Date()}; //失效的需要排除
        cond.status = config_common.demand_status.effective;
        var plan_cond = {
            user_id: req.decoded.id,status: config_common.demand_status.effective
        }, order_cond={
            supply_user_id: req.decoded.id,status: config_common.demand_status.effective
        };
        if(req.body.verify && !!req.body.verify[0]){
            plan_cond.demand_company_id = req.body.verify[0];
            order_cond.demand_company_id = req.body.verify[0];
        }

        //认证条件
        req.body.sort = req.body.sort ? req.body.sort : 'date';
        //执行操作
        async.waterfall([
            function(cb){
                // 如果是认证关系下的查询，则判断认证关系或获取认证关系的公司
                if(req.body.scene == 'relation'){
                    req.body.verify = _.isString(req.body.verify) ? JSON.parse(req.body.verify) : req.body.verify;
                    cond.demand_company_id = {$in: req.body.verify};
                    cond.verify_company = {$in :req.decoded.company_id}; //[req.decoded.company_id[0]]};//只查询搜索
                    cb(null,null);
                }
                //拼接生意圈下的条件 ,认证，朋友指派给他的
                if(req.body.scene == 'friend'){
                    cond.$or = [];
                    http.sendUserServerNew(req, {
                        user_id: req.decoded.id,
                        type: 'SALE'
                    }, config_api_url.user_get_trade_circle,function(err, user){
                        extServer.generalFun(req, {
                            source: 'user',
                            db:'Company_relation',
                            method:'getList',
                            query:{
                                find: {
                                    other_id: {$in: req.decoded.company_id}, //req.decoded.company_id[0],
                                    other_type:'TRAFFIC'
                                },
                                select: 'self_id'
                            }}, function(err, company){
                            if(company && user){
                                cond.$or = [{demand_company_id: {$in: _.pluck(company, 'self_id')}}, {demand_user_id: {$in: user}}]
                            } if(!company && user){
                                cond.$or = [{demand_user_id: {$in: user}}]; //cond.demand_user_id = {$in: user};
                            }else if(company && !user){
                                cond.$or = [{demand_company_id: {$in: _.pluck(company, 'self_id')}}]; // cond.demand_company_id = {$in: _.pluck(company, 'self_id')};
                            }
                            cond.unoffer_list = {$nin: req.decoded.company_id};//已接单的需要排除
                            cond.$or.push({platform_company: { $in: req.decoded.company_id}});
                            cb(null,null);
                        });
                    });

                }
            },
            function(condRes, cb){
                if(condRes){
                    new_count = condRes.count;
                }
                trafficDemandSV.getList({
                    find: cond,
                    skip: (req.body.page-1)*config_common.entry_per_page,
                    limit: req.body.limit || config_common.entry_per_page,
                    page: req.body.page
                }, cb)
            },
            function(demand, cb){
                if(!demand){
                    return cb({dev: '需求单未找到', pro: '000004'});
                }

                demandRes = demand;
                var demandTmp = [];
                async.eachSeries(demandRes.demands, function(demandOne, cb1){
                    //并入用户和公司信息
                    async.waterfall([
                        function (cb10) {
                            trafficDemandSV.getCount({
                                demand_user_id: demandOne.demand_user_id,
                                status: config_common.demand_status.effective,
                                time_validity: {$gt: new Date()}
                            }, function(err, count){
                                demandOne['demand_count'] = count || 0;
                                demandOne['tipInfo'] = demandOne.view_id.indexOf(req.decoded.id) > -1 ? '已浏览' : '';
                                demandTmp.push(demandOne);
                                cb10();
                            });
                        }
                    ], cb1);
                                       
                }, function(err){
                    demandRes.demands = demandTmp;
                    cb();
                });
            }, function (cb) {
                async.parallel({
                    //接单数，接单过期数，订单进行中，订单待派货，订单已完成
                    plan_count:function (cb1) {
                        trafficPlanSV.getCount(plan_cond, cb1);
                    },
                    order_3: function(cb1){
                        //待找车
                        order_cond.status = config_common.demand_status.effective;
                        order_cond.step = 3;
                        trafficOrderSV.getCount(order_cond, cb1);
                    },
                    order_3d5: function(cb1){
                        //继续找车
                        order_cond.status = config_common.demand_status.effective;
                        order_cond.step = 3.5;
                        trafficOrderSV.getCount(order_cond, cb1);
                    },
                    demand_count_cancelled: function (cb1) {
                        cond.status=config_common.demand_status.cancelled;
                        trafficDemandSV.getCount(cond, cb1);
                    },
                    demand_canceling: function (cb1) {
                        var time = (new Date()).getTime() + 10*1000*60;
                        cond.time_validity = {$gt: new Date(time), $lt: new Date()}; //失效的需要排除
                        trafficDemandSV.getCount(cond, cb1);
                    }
                }, cb);
            }
        ],function(err, statis){
            var result={plan_count: 0, order_3:0,order_3d5:0,demand_count_cancelled:0,demand_canceling:0};
            if(statis){
                result['plan_count']=statis.plan_count;
                result['order_3']=statis.order_3;
                result['order_3d5']=statis.order_3d5;
                result['demand_count_cancelled'] = statis.demand_count_cancelled;//需求单没参与且结束
                result['demand_canceling'] = statis.demand_canceling;
            }
            if(err){
                return next(err);
            }

            var Arr1 = [];
            var Arr2 = [];
            for (var i = 0; i < demandRes.demands.length; i++) {
                if(demandRes.demands[i].verify_phase == "SUCCESS"){
                    Arr1.push(demandRes.demands[i]);
                }else {
                    Arr2.push(demandRes.demands[i]);
                }
            }
            // var result = Arr1.concat(Arr2);
            // result['new_count'] = new_count;
            result['demands'] = Arr1.concat(Arr2);
            result['exist'] = demandRes.exist;
            result['count'] = demandRes.count;
            config_common.sendData(req, result, next);
        });
    });
    /**
     * 取消物流需求单; （修改物流抢单，交易订单）20170516
     */
    api.post('/close', function(req, res, next){
        if(req.decoded.role != config_common.user_roles.TRADE_ADMIN &&
            req.decoded.role != config_common.user_roles.TRADE_SALE &&
            req.decoded.role != config_common.user_roles.TRADE_PURCHASE){
            return next({dev: '仅交易方', pro: '000002'});
        }
        if(!req.body.demand_id){
            return next({dev: 'demand_id参数有误', pro: '000003'});
        }
        async.waterfall([
            function (cb) {
                trafficOrderSV.getCount({demand_id: req.body.demand_id}, cb);
            }, function (count, cb) {
                trafficDemandSV.close(req, {
                    demand_id: req.body.demand_id, 
                    status: !!count ? config_common.demand_status.complete : config_common.demand_status.cancelled
                }, cb);
            }
        ], function (err, result) {
            if(err){
                return next({dev: err});
            }
            config_common.sendData(req, true, next);
        })
               
    });

    //通过角色获取需求单 20170516 20170807
    api.post('/get_by_role', function(req, res, next){
        if(req.decoded.role != config_common.user_roles.TRADE_ADMIN &&
            req.decoded.role != config_common.user_roles.TRADE_SALE &&
            req.decoded.role != config_common.user_roles.TRADE_PURCHASE){
            return next({dev: '仅限交易方', pro: '000002'});
        }
        req.body.page = req.body.page || 1;
        req.body.is_refresh = true; //['true', true, 1, '1'].indexOf(req.body.is_refresh) != -1;
        var cond = {}, new_count=0, demandList={};
        cond.status = req.body.status || config_common.demand_status.effective;
        cond.demand_user_id = req.decoded.id;
        if(req.body.status == config_common.demand_status.effective){
            cond.time_validity = {$gt: new Date()};
        }
        async.waterfall([
            function (cb) {
              extServer.tipPassDemand({
                  user_id: req.decoded.id,
                  company_id: req.decoded.company_id,
                  other_company_id: req.decoded.company_id
              }, req.body.is_refresh, cond.status, req.decoded.role, function (err, tipTime) {
                  if(tipTime){
                      cond.time_modify = {$lte: tipTime.update_time};
                      new_count = tipTime.count;
                  }
                  cb();
              });
            },
            function(cb){
                trafficDemandSV.getList({
                    find: cond,
                    skip: (req.body.page-1)*config_common.entry_per_page,
                    limit: config_common.entry_per_page,
                    sort: {time_creation: -1},
                    page: req.body.page
                }, cb);
            }
        ],function(err, result){
            if(err){
                return next(err);
            }
            demandList = _.extend(result, {new_count: new_count});
            config_common.sendData(req, demandList, next);
        });
    });


    /**
     * 获取可指派的公司信息 20171120 待废弃
     
    api.post('/get_not_assign_company', function(req, res, next){
        if(req.decoded.role != config_common.user_roles.TRADE_ADMIN &&
            req.decoded.role != config_common.user_roles.TRADE_PURCHASE &&
            req.decoded.role != config_common.user_roles.TRADE_SALE){
            return next({dev: '仅限交易方', pro: '000002'});
        }
        if(!req.body.index_trade || !req.body.material){
            return next({dev: 'index_trade,material参数有误', pro: '000003'});
        }
        var arr=[];
        
        async.waterfall([
            function (cb) {
                http.sendUserServerNoToken(req, {
                    status: config_common.relation_type.ACCEPT,
                    type: config_common.company_category.TRAFFIC
                }, config_api_url.user_server_get_company_relation, cb);
            }, function (companyList, cb) {
                if(!companyList){
                    return cb({dev: '没有可指派公司', pro: '000004'});
                }
                company_arr = _.pluck(companyList, 'other_id');
                extServer.generalFun(req, {
                    source: 'user',
                    db:'Company_traffic',
                    method:'getList',
                    query:{
                        find: {
                            _id: {$in: company_arr},
                            transport: {$in: [req.body.material]}
                        },
                        select: 'nick_name'
                    }
                }, cb);
            }
        ], function (err, result) {
            if(err){
                return next(err);
            }
            for(var i = 0; i < result.length; i++){
                arr[i] = {company_traffic_id: result[i]['_id'].toString()};
            }
            config_common.sendData(req, arr, next);
        });

    });
     */
    /**
     * 修改物流需求单 ，延长到期时间， 增加合作企业
     * param: demand_id, company_ids
     */
    api.post('/edit', function (req, res, next) {
        var demandRes;
        async.waterfall([
            function (cb) {
              if(!req.body.demand_id || !_.isArray(req.body.company_ids)){
                  return cb({dev: '参数有误'});
              }
                cb();
            },
            function (cb) {
                trafficDemandSV.getOne({
                    find: {_id: req.body.demand_id}
                }, cb)
            }, function (demand, cb) {
                if(!demand){
                    return cb({dev: '需求单未找到'});
                }
                demandRes = demand;
                //新的公司消息推送
                demand.verify_company = _.union(demand.verify_company, req.body.company_ids);
                // demand.time_validity = req.body.time_validity;
                demand.time_modify = new Date();
                demand.save(cb);
            }
        ], function (err, result) {
            if(err){
                return next(err);
            }
            //获取物流公司名下的用户id,并推送。
            http.sendUserServerNew(req, {
                cond: {find: {company_id: {$in: req.body.company_ids}, role: {$in: config_common.accessRule.pass}}, select:'real_name'},
                model: 'User_traffic',
                method: 'getList'
            }, config_api_url.user_server_common, function (err, users) {
                if(users){
                    // 推送消息
                    var msgObj = {
                        title: '指派物流',
                        content: config_msg_template.encodeContent('trade_assign_traffic', 
                            [req.decoded.company_name ? req.decoded.company_name : '', req.decoded.user_name, demandRes.send_city, demandRes.receive_city, demandRes.category_chn]),
                        user_ids: _.pluck(users, '_id')
                    };
                    extServer.push(req, msgObj, {}, '', {params: {demand_id: demandRes._id}, url: config_common.push_url.traffic_demand},
                        function(){});

                }
            });
            config_common.sendData(req, result, next);
        });
    });
    //物流-商业推荐 | 货源量，参与量，推荐企业，推荐需求单
    api.post('/get_assign_list', function (req, res, next) {
        //初始化
        var assign_result = {
            new_list: {count: 0, demands: [], exist: false},
                old_list: {count: 0, demands: [], exist: false}
        } , relation_company = [],
            new_list_cond={
                platform_company: { $in: req.decoded.company_id},
                unoffer_list: {$nin: [req.decoded.id]},
                status: config_common.demand_status.effective,
            },
            old_list_cond={
                platform_company: { $in: req.decoded.company_id},
                unoffer_list: {$nin: [req.decoded.id]},
                status: {$in: [config_common.demand_status.ineffective, config_common.demand_status.complete]}
            };
        //条件判断
        if(config_common.accessRule.pass.indexOf(req.decoded.role)==-1){
            return next({dev: '仅限物流'});
        }
        req.body.page = req.body.page || 1; //页码
        /* 20180530
        if(req.body.line_id){
            req.body.line_id=_.isArray(req.body.line_id)? req.body.line_id: JSON.parse(req.body.line_id)
        }
        */
        async.waterfall([
            function (cb) {
                //检查当前企业是否开启商业智能
                extServer.generalFun(req, {
                    source: 'user',
                    db:'User_traffic',
                    method:'getOne',
                    query:{
                        find: {
                            _id: req.decoded.id
                        }
                    }}, cb);

            }, function(user, cb){
                if(user.recommend){
                    async.parallel({
                        new_list: function(cb2){
                            //20180322 若用户不需要推荐，则不请求数据?
                            async.waterfall([
                                function (cb1) {
                                    trafficDemandSV.getList({
                                        find: new_list_cond,
                                        skip: (req.body.page-1) * config_common.entry_per_page,
                                        limit: config_common.entry_per_page,
                                        sort: {time_creation: -1},
                                        page: req.body.page
                                    }, cb1);
                                }, function (orders, cb1) {
                                    _.each(orders.demands, function (list) {
                                        list.tipInfo = list.view_id.indexOf(req.decoded.id) > -1 ? '已浏览' : '';
                                    });
                                    assign_result['new_list'] = orders;
                                    cb1(null, orders)
                                }
                            ], cb2);
                        },
                        old_list: function(cb2){
                            async.waterfall([
                                function (cb1) {
                                    //推荐物流需求单 包含过期和完成
                                    trafficDemandSV.getList({
                                        find: old_list_cond,
                                        skip: (req.body.page-1) * config_common.entry_per_page,
                                        limit: config_common.entry_per_page,
                                        sort: {time_creation: -1},
                                        page: req.body.page
                                    }, cb1);
                                }, function (orders, cb1) {
                                    _.each(orders.demands, function (list) {
                                        list.tipInfo = list.view_id.indexOf(req.decoded.id) > -1 ? '已浏览' : '未浏览';
                                    });
                                    assign_result['old_list'] = orders;
                                    cb1(null, orders)
                                }
                            ], cb2);
                        }
                    }, cb);
                }else{
                   cb(null, null)
                }
            },
            function (demand, cb) {
                cb();
            }
        ], function (err, result) {
            if(err){
                return next(err);
            }
            config_common.sendData(req, assign_result, next);
        });
    });

    /**
     * 双方物流
     */
    api.post('/add_both', function(req, res, next){
        if(req.decoded.role != config_common.user_roles.TRADE_ADMIN &&
            req.decoded.role != config_common.user_roles.TRADE_SALE &&
            req.decoded.role != config_common.user_roles.TRADE_PURCHASE){
            return next({dev: '仅限交易方', pro: '000002'});
        }
        //基础数据判断
        var statisCompany = [];
        async.waterfall([
            function (cb) {
                var flag = true;
                req.body['payment_choice'] = req.body.att_payment;
                req.body['quality_origin'] = req.body.att_quality;
                req.body['payment_method'] = req.body.att_settlement;
                req.body['send_id'] = req.body.location_depart;
                req.body['receive_id'] = req.body.location_storage;
                req.body['count_day_extension'] = req.body.delay_day;//
                var checkout_fields =[
                    {field: 'scene', type:'string'},
                    {field: 'receive_id', type:'string'},
                    {field: 'send_id', type:'string'},
                    {field: 'quality_origin', type:'string'},
                    {field: 'payment_choice', type:'enum'},
                    {field: 'payment_method', type:'enum'},
                    {field: 'time_validity', type:'date'},
                    {field: 'company_ids', type:'array'},
                    {field: 'product_categories', type:'object'} //这是一个数组
                ];
                if(req.body.product_categories){
                    req.body.product_categories[0]['pass_price'] = req.body.price || 1;
                }
                config_common.checkField(req, checkout_fields, function (err) {
                    if(err){
                        flag = false;
                        return cb({dev: err+'参数有误', pro: '000003'});
                    }
                    req.body.count_day_extension = Number(req.body.count_day_extension) || 0;
                });
                //检查补货中产品结构是否有补货价格; pass_price amount_unit
                if (req.body.replenish) {
                    _.each(req.body.replenish, function (x) {
                        if (!x['layer'] || !x['pass_price']) {
                            flag = false;
                            return cb({dev: 'replenish_construct'});
                        }
                    });
                }
                req.body.product_categories = config_common.randomProductId(req.body.product_categories);
                if(flag){
                    cb();
                }
            },
            function (cb) {
                trafficDemandSV.addBoth(req, cb);
            }
        ], function(err, demandRes){
            if(err){
                return next(err);
            }
            if(true){
                //向动态服务器增加动态
                extServer.addDynamicServer({
                    company_id: demandRes.demand_company_id,
                    user_id: demandRes.demand_user_id,
                    type: config_common.typeCode.traffic_assign,
                    data: JSON.stringify(demandRes)
                }, function(){});
                //向统计服务器累计
                extServer.statisticalSV({
                    companyObj: [{
                        type: config_common.statistical.assign,
                        id: req.decoded.company_id,
                        count: req.body.company_ids.length
                    }]
                }, 'trade', function(err){
                    console.log('统计服务器trade',req.decoded.company_id, err)
                });
                _.each(req.body.company_ids, function(companyId){
                    statisCompany.push({
                        type: config_common.statistical.company_assign,
                        id: companyId
                    })
                });
                extServer.statisticalSV({
                    companyObj: statisCompany
                }, 'traffic', function(err){
                    console.log('统计服务器traffic', err)
                });
                //获取物流公司名下的用户id,并推送。
                async.waterfall([
                    function (push) {
                        http.sendUserServerNew(req, {
                            cond: {find: {company_id: {$in: _.union(demandRes.verify_company, demandRes.platform_company)}, role: {$in: config_common.accessRule.pass}}, select:'real_name'},
                            model: 'User_traffic',
                            method: 'getList'
                        }, config_api_url.user_server_common, push);
                    },
                    function (users, push) {
                        async.eachSeries(users, function (user, push1) {
                            var msgObj = {
                                title: '指派物流',
                                //尊敬的XX总，XX集团给您指派运输太原—长治螺纹钢3852吨运输，每吨100元
                                content: config_msg_template.encodeContent('trade_assign_traffic', [
                                    user.real_name,
                                    demandRes['demand_company_name'] ? demandRes['demand_company_name'] : '',
                                    demandRes['send_city'],
                                    demandRes['receive_city'],
                                    demandRes['category_chn'],
                                    demandRes['amount'],
                                    demandRes['price_min'],
                                    'url'
                                ]),
                                user_ids: [user._id]
                            };
                            extServer.push(req, msgObj, {}, '', {
                                params: {
                                    demand_id: demandRes._id.toString(),
                                    wait:'newRec'
                                }, 
                                url: config_common.push_url.traffic_demand
                            }, function () {
                                push1()
                            });

                        }, push)
                    }
                ], function () {});
            }
            config_common.sendData(req, demandRes, next);
        });

    });
    /*
    *   接单记录, 不限认证公司和平台推荐
    * */
    api.post('/demand_plan_info', function(req, res, next){
        //角色判断
        //参数判断
        if(!req.body.demand_id){
            return next({dev: 'demand_id参数有误', pro: '000003'}); //'invalid_format'
        }
        //场景判断
        var cond={};
        if(req.body.demand_id){
            cond._id = req.body.demand_id;
        }
        var //demandList=[],
            demandList={assign: [], loot: []},
            trafficDemand,
            company_arr=[],//已接单的公司
            companyOne,CompanyRelation=[];
        async.waterfall([
            function (cb) {
                //  依据应用场景判断获取 需求单或是订单
                trafficDemandSV.getOne({
                    find: cond
                }, cb);
            }, function (demandRes, cb) {

                if(!demandRes) return cb({dev: '需求单未找到', pro: '000004'}); //'not_fount'
                trafficDemand = demandRes;
                //查询公司间关系
                extServer.generalFun(req, {
                    source: 'user',
                    db:'Company_relation',
                    method:'getList',
                    query:{
                        find: {
                            other_id: {$in: [trafficDemand.demand_company_id]}, //req.decoded.company_id[0],
                            other_type:'TRAFFIC'
                        },
                        select: 'self_id'
                    }}, cb)
            }, function(relation, cb){
                CompanyRelation=_.pluck(relation, 'self_id');

                if(trafficDemand.unoffer_list.length>0){
                    async.waterfall([
                        function (cb2) {
                            trafficPlanSV.onlyList({
                                find: {
                                    user_id: {$in: trafficDemand.unoffer_list},
                                    demand_id: req.body.demand_id,
                                },
                                sort: req.body.sort || {price: -1}
                            }, cb2);
                        }, function (plans, cb2) {
                            async.eachSeries(plans, function (plan, cb1) {
                                async.waterfall([
                                    function (cb2) {
                                        extServer.userFind({user_id: plan.user_id}, cb2)
                                    },
                                    function (user, cb2) {
                                        if(!user){
                                            cb1();
                                        }
                                        companyOne = user;
                                        //是否有订单
                                        trafficOrderSV.getOne({find: {
                                            supply_user_id: plan.user_id,
                                            supply_company_id: plan.company_id,
                                            demand_id: plan.demand_id
                                        }}, cb2)
                                    },
                                    function(order, cb2){
                                        //获取计划
                                        company_arr.push(companyOne['company_id']);
                                        companyOne['_id']=companyOne['company_id'];
                                        companyOne['nick_name']= companyOne['company_name'];
                                        companyOne['url_logo']= companyOne['company_logo'];
                                        companyOne['is_relation'] =  _.contains(CompanyRelation, companyOne.company_id);
                                        if(order){
                                            companyOne['order_id'] = order._id.toString();
                                            companyOne['order_amount'] = order.amount;
                                            companyOne['status'] = order.status;
                                            companyOne['source'] = order.source;//20171101区分是否为平台推荐
                                        }else{
                                            companyOne['status'] = 'wait_assign';
                                            companyOne['plan_id'] = plan._id.toString();
                                            companyOne['plan_price'] = plan.price || 0;
                                            companyOne['plan_time_creation'] = plan.time_creation;
                                            companyOne['user_id'] = plan.user_id;
                                            companyOne['source'] = plan.source;
                                        }
                                        //如果非指派过来的数据，则放在。。
                                        // demandList={assign: [], loot: []}
                                        if(trafficDemand.plan_company.indexOf(plan.company_id)>-1){
                                            demandList.loot.push(companyOne);
                                        }else{
                                            demandList.assign.push(companyOne);
                                        }
                                        cb2();
                                    }
                                ], cb1)
                            }, cb2);
                        }
                    ], cb);
                }else{
                    cb();
                }
            }, function (cb) {
                //优化: verify_company + platform_company 合并后，使用键值对
                if(trafficDemand.verify_company.length>0 || trafficDemand.platform_company.length>0){
                    var assign_company=_.uniq([].concat(trafficDemand.verify_company,trafficDemand.platform_company));//指派和推荐的公司
                    assign_company=_.difference(assign_company, company_arr);//不含接单的公司
                    console.log('aa', assign_company)
                    async.waterfall([
                        function(cb10){
                            extServer.generalFun(req, {
                                source: 'user',
                                db:'Company_traffic',
                                method:'getList',
                                query:{
                                    find: {
                                        _id: {$in: assign_company}
                                    },
                                    select: 'nick_name url_logo verify_phase phone_creator'
                                }}, cb10);
                        },
                        function (companies, cb10) {
                            console.log('companies', companies)

                                _.each(companies, function(company){
                                    demandList.assign.push(
                                        _.extend({}, company, {
                                            'status': config_common.demand_status.ineffective
                                            ,'is_relation':  _.contains(CompanyRelation, company._id)
                                            ,'source': _.contains(CompanyRelation, company._id) ? trafficDemand.source : config_common.demand_source.platform_assign

                                        })
                                    );
                                })
                                cb10()
                        }
                    ], cb)
                }else{
                    cb();
                }
            }
        ], function (err) {
            if(err) {
                return next(err);
            }
            if(req.decoded && trafficDemand && trafficDemand.status== config_common.demand_status.effective && req.decoded.id != trafficDemand.demand_user_id){
                // 推送消息
                var msgObj = {
                    title: '查看货源',
                    content: config_msg_template.encodeContent('view_demand', [req.decoded.user_name]),
                    user_ids: [trafficDemand.demand_user_id]
                };
                // extServer.push(req, msgObj, {}, '', {}, function(){});
                extServer.push(req, msgObj, {}, '', {
                    params: {id: trafficDemand._id.toString(), status: trafficDemand.status},
                    //, type: config_common.push_url.driver_order_detail
                    url: config_common.push_url.trade_traffic_demand
                }, function(){});
            }
            config_common.sendData(req, demandList, next);
        });

    });

    /**
     *  接口测试
     */
    api.post('/test_msg', function(req, res, next){
            config_common.sendData(req, {}, next)
    });


    return api;
};


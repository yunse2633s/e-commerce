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
// var demoSV = require('../../lib/lib_demo');
var driverDemandSV = require('../../lib/lib_traffic_driver_demand');
var driverOfferSV = require('../../lib/lib_traffic_driver_offer');
var driverOrderSV = require('../../lib/lib_traffic_driver_order');
var trafficOrderSV = require('../../lib/lib_traffic_order');
var extServer = require('../../lib/lib_ext_server');
var driverPlanSV = require('../../lib/lib_traffic_driver_plan');
var trafficLineSV = require('../../lib/lib_traffic_line');

module.exports = function() {
    var api = express.Router();

    //token 解析判断
    api.use(require('../../middlewares/mid_verify_user')());

    api.post('/get_one', function (req, res, next) {
        //角色判断
        return next('not_run');
    });

    api.post('/get_count', function (req, res, next) {
        //角色判断
        if(req.decoded.role != config_common.user_roles.TRAFFIC_DRIVER_PRIVATE){
            return next({dev: '仅限司机', pro: '000002'});
        }
        var cond={user_id: req.decoded.id}, planstatus={ineffective: 0, effective: 0, complete: 0, cancelled:0};
        async.waterfall([
            function (cb) {
                if(!req.body.status){
                    return cb({dev: 'status参数有误', pro: '000003'});
                }
                cb();
            },
            function(cb){
                if(req.body.status == 'all'){
                    driverPlanSV.getAggregate({
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
            if(err){
                return next(err);
            }
            config_common.sendData(req, result, next);
        });
    });

    api.post('/get_list', function (req, res, next) {
        //角色判断
        if(req.decoded.role != config_common.user_roles.TRAFFIC_DRIVER_PRIVATE){
            return next({dev: '仅限司机', pro: '000002'});
        }
        req.body.page = req.body.page || 1;
        req.body.is_refresh = true; //['true', true, 1, '1'].indexOf(req.body.is_refresh) != -1; //若存在下列刷新，则修改个人查阅时间;
        var plan_resutl = {}, cond={ user_id: req.decoded.id, status: req.body.status};
        async.waterfall([
            function (cb) {
                //参数判断
                if(!req.body.status || !config_common.demand_status[req.body.status]){
                    return cb({dev: 'status参数有误', pro: '000003'});
                }
                extServer.tipDriverPlan({
                    user_id: req.decoded.id
                }, req.body.is_refresh, req.body.status, cb);
            },            
            function (tipTime, cb) {
                if(tipTime){
                    cond.time_modify = {$lte: tipTime.update_time};
                    plan_resutl['new_count'] = tipTime.count;
                }
                driverPlanSV.getList({
                    find: cond,
                    sort: {time_creation: -1},
                    skip: (req.body.page-1)*config_common.entry_per_page,
                    limit: config_common.entry_per_page,
                    page: req.body.page
                }, cb, req);
            }, function (lists, cb) {
                plan_resutl['count'] = lists.count ;
                plan_resutl['list'] = lists.orders;
                plan_resutl['exist'] = lists.exist;
            }
        ], function(err, result){
            if(err) return next(err);
            config_common.sendData(req, plan_resutl, next);
        });
    });

    api.post('/close', function (req, res, next) {
        
        async.waterfall([
            function (cb) {
                //角色判断
                if(req.decoded.role != config_common.user_roles.TRAFFIC_DRIVER_PRIVATE){
                    return cb({dev: '仅限司机', pro: '000002'});
                }
                //参数判断
                if(!req.body.plan_id){
                    return cb({dev: 'plan_id参数有误', pro: '000003'});
                }
                cb();
            },  function (cb) {
                driverPlanSV.getOne({
                    find: {
                        plan_id: req.body.plan_id,
                        user_id: req.decoded.id,
                        status: config_common.demand_status.ineffective
                    }
                }, cb);
            }, function (plan, cb) {
                if(!plan){
                    return cb({dev: '司机计划没找到', pro: '000004'});
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
     * 20170704 司机接单挂号，由买方决定司机运输情况;
     */
    api.post('/add', function (req, res, next) {
        
         var driverDemand;
        async.waterfall([
            function (cb) {
              //角色判断
              if(req.decoded.role != config_common.user_roles.TRAFFIC_DRIVER_PRIVATE){
                  return cb({dev: '仅限司机', pro: '000002'});
              }
              //参数判断
              if(!req.body.demand_id){
                  return cb({dev: 'demand_id参数有误', pro: '000003'});
              }
              if(!req.body.price || !Number(req.body.price)){
                return cb({dev: '报价有误', pro: '000003'});
              }
                cb();
            }, 
            function (cb) {
                driverDemandSV.getOne({
                    find: {
                        _id: req.body.demand_id,
                        // amount_remain: {$gt: 0},
                        // status: config_common.demand_status.effective,
                        // $or: [
                        //     {verify_driver: {$in: [req.decoded.id]}},
                        //     {platform_driver: {$in: [req.decoded.id]}}
                        // ]
                        unoffer_list: {$nin: [req.decoded.id]}
                    }
                }, cb);
            }, 
            function (demand, cb) {
                if(!demand){
                    return cb({dev: '司机需求单没找到', pro: '000004'});
                }
                if(demand.status != config_common.demand_status.effective){
                    return cb({dev: '该单据已过期', pro: '000004'});
                }
                if(demand.amount_remain <= 0){
                    return  cb({dev: '该指派已无剩余吨数', pro: '000006'})
                }
                driverDemand = demand;
                driverPlanSV.getCount({
                    demand_id: req.body.demand_id,
                    user_id: req.decoded.id,
                    status: config_common.demand_status.effective
                }, cb);
            }, 
            function(count, cb){
                if(count>0){
                    return cb({dev: '重复操作', pro: '000007'});
                }
                
                driverPlanSV.add({
                    demand_id: req.body.demand_id,
                    user_id: req.decoded.id,
                    user_name: req.decoded.user_name,
                    status: config_common.demand_status.ineffective,
                    time_creation: new Date(),
                    time_modify: new Date(),
                    admin_id: req.decoded.admin_id,
                    source: driverDemand.verify_driver.indexOf(req.decoded.id) > -1 ? driverDemand.source: driverDemand.platform_driver.indexOf(req.decoded.user_id)> -1 ? config_common.demand_source.platform_assign : config_common.demand_source.loot_demand,
                    demand_user_id: driverDemand.demand_user_id,
                    demand_company_id: driverDemand.demand_company_id,
                    demand_company_name:  driverDemand.demand_company_name,
                    price: req.body.price || 0.1,
                    line_id: req.body.line_id, //报价线路的id
                }, cb);
            }, 
            function (plan, count , cb) {
                //判断是否增加合作关系
                if(driverDemand.platform_driver.indexOf(req.decoded.id) > -1){
                    extServer.passDriverRelation(req, {
                        pass_user_id: driverDemand.demand_user_id,
                        pass_company_id: driverDemand.demand_company_id,
                        driver_user_id: req.decoded.id
                    }, function (x,y) {
                        if(y){
                        }
                    })
                }
                if(req.body.line_id){
                    trafficLineSV.getOne({find: {_id: req.body.line_id}}, function (x,y) {
                        if(y){
                          //判断是否去程; line.section > demandOne.section  是否有交集
                          var goto=(_.intersection(y.section, driverDemand.section)).length;
                          var goback=(_.intersection(y.end_section, driverDemand.end_section)).length;
                          if(goto>0 && goto>=goback && y.money != req.body.price){
                            y.price_chart.push({unmoney: y.unmoney, money: y.money,time_modify: Date.now()});
                            y.money = req.body.price;
                            y.markModified('price_chart');
                            y.time_modify=new Date();
                            y.save(function(){})
                          }else if(y.unmoney !=req.body.price){
                            y.price_chart.push({unmoney: y.unmoney, money: y.money, time_modify: Date.now()});
                            y.unmoney = req.body.price;
                            y.markModified('price_chart');
                            y.time_modify=new Date();
                            y.save(function(){})
                          }
                        }
                    })
                }else{
                  //检查若没有相似的线路，则创建一条新的
                  var newLine={
                    role : req.decoded.role,
                    user_id : req.decoded.id,
                    money : driverDemand.price,
                    product_categories : _.uniq([driverDemand.material_chn, driverDemand.category_chn,driverDemand.category_penult_chn]),
                    time_creation : new Date(),
                    time_modify : new Date(),
                    //出发地
                    start_province : driverDemand.send_province,
                    start_city : driverDemand.send_city,
                    start_district : driverDemand.send_district,
                    //到达地
                    end_province : driverDemand.receive_province,
                    end_city : driverDemand.receive_city,
                    end_district : driverDemand.receive_district,
                    section : config_common.areaCollect([driverDemand.send_province], [driverDemand.send_city],[driverDemand.send_district]),
                    end_section : config_common.areaCollect([driverDemand.receive_province], [driverDemand.receive_city],[driverDemand.receive_district]),
                    //被包含区域
                    unsection : config_common.unAreaCollect([driverDemand.send_province], [driverDemand.send_city],[driverDemand.send_district]),
                    end_unsection : config_common.unAreaCollect([driverDemand.receive_province], [driverDemand.receive_city], [driverDemand.receive_district])
                  };
                  trafficLineSV.getCount({
                    user_id : req.decoded.id,
                    $or: [{
                      section: {$in: newLine.section},
                      end_section: {$in: newLine.end_section}
                    }, {
                      section: {$in: newLine.end_section},
                      end_section: {$in: newLine.section}
                    }]
                  }, function (x,y) {
                    if(y==0){
                      trafficLineSV.add(newLine, function (x,y) {})
                    }
                  })
                    
                }
                //司机需求单中, 增加报名记录,
                driverDemand.unoffer_list.unshift(plan.user_id);
                //判断当前用户是否是指派的否则
                if(driverDemand.verify_driver.indexOf(plan.user_id)> -1 || driverDemand.platform_driver.indexOf(plan.user_id)> -1){
                    if(driverDemand.verify_driver.indexOf(plan.user_id) > -1){
                        driverDemand.verify_driver.splice(driverDemand.verify_driver.indexOf(plan.user_id), 1);
                    }
                    if(driverDemand.platform_driver.indexOf(plan.user_id)> -1){
                        driverDemand.platform_driver.splice(driverDemand.platform_driver.indexOf(plan.user_id), 1);
                    }
                }else{
                    driverDemand.plan_driver.push(plan.user_id);
                    driverDemand.assign_count ++;
                }
                driverDemand.time_modify = new Date();
                driverDemand.offer_count ++;
                driverDemand.save(function () {
                    cb(null, plan);
                })
            }
        ], function(err, result){
            if(err) return next(err);
            result = result.toObject();
            result['demandInfo'] = driverDemand;
            var msgObj = {
                user_ids: [driverDemand.demand_user_id]
            };
            msgObj['title']= '司机参与指派';
            msgObj['content']= config_msg_template.encodeContent('driver_agree_assign', [driverDemand.send_city, driverDemand.receive_city, req.decoded.user_name, '' ]);
            //req.body.demand_id   {demand_id: result._id}
            extServer.push(req, msgObj, {}, '', {params: {demand_id: req.body.demand_id, source: 'grab'}, url: config_common.push_url.driver_demand}, function(){});
            config_common.sendData(req, result, next);
        });
    });


    return api;
};
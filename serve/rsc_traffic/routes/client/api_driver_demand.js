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
var config_server = require('../../configs/config_server');
var config_msg_template = require('../../configs/config_msg_template');
var config_common = require('../../configs/config_common');
var config_api_url = require('../../configs/config_api_url');
//内部数据操作引用
var driverDemandSV = require('../../lib/lib_traffic_driver_demand');
var trafficOrderSV = require('../../lib/lib_traffic_order');
var driverOrderSV = require('../../lib/lib_traffic_driver_order');
var extServer = require('../../lib/lib_ext_server');
var driverPlanSV = require('../../lib/lib_traffic_driver_plan');
var tipSV = require('../../lib/lib_tip');
var trafficLineSV = require('../../lib/lib_traffic_line');


module.exports = function() {
    var api = express.Router();
    api.use(require('../../middlewares/mid_verify_user')(true));
    /*
     获取单个记录 20170421
     param
     */
    api.post('/get_one', function(req, res, next){
        //角色判断 物管，交管，采购
        //场景判断
        //条件判断
        if(!req.body.demand_id &&
            !req.body.demand_index && !req.body.order_id){
            return next({dev: 'demand_id参数有误', pro: '000003'}); //('invalid_format');
        }
        var cond = {};
        if(req.body.demand_id){
            cond._id = req.body.demand_id;
        }
        if(req.body.demand_index){
            cond.index = req.body.demand_index;
        }
      if(req.body.order_id){
        cond.order_id=req.body.order_id;
        cond.status={$in: [config_common.demand_status.ineffective, config_common.demand_status.effective]}
      }

        //执行操作
        async.waterfall([
            function(cb){
                driverDemandSV.getOne({
                    find: cond
                },cb);
            },
            function (demandRes, cb) {
                if(!demandRes){
                    return cb({dev: '司机需求单没找到', pro: '000004'}); //('not_found');
                }
                if(req.decoded && req.decoded.id != demandRes.demand_user_id && demandRes.view_id){
                    if(demandRes.view_id.indexOf(req.decoded.id) == -1){
                        demandRes.view_id.push(req.decoded.id);
                    }

                    demandRes.save(function () {
                        
                    });
                }
                // 存放用户名称和公司名称及公司状态 ;
                driverOrderSV.getOrderUserComp(req, demandRes, function(err, demand){
                    if(err) return cb(err);
                    if(req.decoded && req.decoded.role == config_common.user_roles.TRAFFIC_DRIVER_PRIVATE){
                        extServer.generalFun(req, {
                            source: 'user',
                            db:'Driver_verify',
                            method:'getList',
                            query: {
                                find: {
                                    user_id: req.decoded.id,
                                    company_id: demand.demand_company_id,
                                    approve_id: demand.demand_user_id
                                },
                                select: 'company_id'
                            }
                        }, function (err, valid) {
                            demand['is_relation'] = valid ? true:false;
                            cb(null, demand);
                        })
                    }else{
                        cb(null, demand);
                    }

                });
            },
            function (demandRes, cb) {
                if(demandRes.view_id.length >=105 && demandRes.offer_count ==100){
                    //推送 或发短信
                    // 尊敬的xx总你好，您发布的钢铁报价被5家新的企业查看未下单，请立即登录查看（链接）
                    //5条查看未下单，且注册10天内每天发送一次
                    async.waterfall([
                        function (push) {
                            var msgObj = {
                                title: '报价提醒',
                                //尊敬的xx总你好，您发布的钢铁报价被5家新的企业查看未下单，请立即登录查看（链接）
                                content: config_msg_template.encodeContent('driver_demand_view', [
                                    demandRes.user_name,
                                    req.decoded.user_name,
                                    demandRes.view_id.length,
                                    'url'
                                ]),
                                user_ids: [line.user_id]
                            };
                            extServer.push(req, msgObj, {}, '', {
                                params: {
                                    demand_id: demandRes._id.toString(),
                                    source:'grab'
                                },
                                url: config_common.push_url.driver_demand
                            }, push);
                        }
                    ], function () {});
                }
                cb(null, demandRes);
            }
        ], function(err, result){
            if(err){
                return next(err);
            }
            config_common.sendData(req, result, next);
        });
    });
    /**
     * 获取司机需求单中指派车辆的信息
     */
    api.post('/assign_truck_info', function(req, res, next){
        //角色判断

        //参数判断
        if(!req.body.demand_id){
            return next({dev: 'demand_id参数有误', pro: '000003'}); //('invalid_format');
        }
        //场景判断
        var cond={_id: req.body.demand_id};
        var driver_arr=[], driverDemandOne={},
            driverInfo={
                assign: {
                    ratio: 0, //指派吨数占比
                    amount_remain:0, //剩余量
                    lists:[] //指派详情列表
                },
                loot:{
                    ratio: 0, //指派吨数占比
                    amount_assign: 0, //指派吨数
                    lists:[] //抢单列表
                }
            };
        async.waterfall([
            function (cb) {
                // 依据应用场景判断获取 需求单或是订单
                driverDemandSV.getOne({
                    find: cond
                }, cb);
            }, function (driverRes, cb) {
                if(!driverRes){
                    cb(null, driverInfo)
                }else{
                    driverDemandOne=JSON.parse(JSON.stringify(driverRes));
                    var assign=[], loot=[];
                    _.each(_.difference(driverDemandOne.unoffer_list, driverDemandOne.plan_driver), function(a){
                        assign.push({user_id: a, source: ''})
                    });
                    _.each(driverDemandOne.verify_driver, function(a){
                        assign.push({user_id: a, source: driverDemandOne.source})
                    });
                    _.each(driverDemandOne.platform_driver, function(a){
                        assign.push({user_id: a, source: config_common.demand_source.platform_assign})
                    });
                    _.each(driverDemandOne.plan_driver, function (a) {
                        loot.push({user_id: a, source: config_common.demand_source.loot_demand})
                    });
                    async.parallel({
                        assign:function(cb20){
                            var assign_amount=0,assignList=[];
                            async.eachSeries(assign, function(driver,cb1){
                                //初始数据
                                var userInfo={};
                                //场景判断
                                async.waterfall([
                                    function (cb10) {
                                        driverDemandSV.getUserTruck(req, {user_id: driver.user_id}, cb10);
                                        // extServer.driverUser({user_id: driver.user_id}, cb10, req)
                                    },
                                    function (user, cb10) {
                                        if(!user || !user.truck_id) {return cb1();}
                                        userInfo = _.extend(user, driver);

                                        driverOrderSV.getOne({
                                            find: {
                                                demand_id: driverDemandOne._id.toString(),
                                                supply_user_id: userInfo.user_id,
                                                status: config_common.demand_status.effective
                                            }
                                        }, cb10);
                                    },
                                    function (order, cb10) {
                                        if(order && driver.source==''){
                                            userInfo['status'] = order.step > 1 ? order.status :
                                                !order.tip_prices ? 'not_pay' : !!order.tip_price_id ? 'paid': 'paying';
                                            userInfo['plan_id']=order.plan_id;
                                            userInfo['order_id'] = order._id.toString();
                                            userInfo['source'] = order.source;
                                            assign_amount=config_common.rscDecimal('add', assign_amount, order.amount);//指派的吨数
                                            cb10(null, null);
                                        }else{
                                            driverPlanSV.getOne({
                                                find: {
                                                    demand_id: driverDemandOne._id.toString(),
                                                    user_id: userInfo.user_id,
                                                    status: config_common.demand_status.ineffective
                                                }
                                            }, cb10);
                                        }
                                    },
                                    function (plan, cb10) {
                                        if(plan){
                                            userInfo['status'] = 'wait_assign';
                                            userInfo['plan_id'] = plan._id;
                                            userInfo['plan_price'] = plan.price || 0;
                                            userInfo['plan_time_creation'] = plan.time_creation;
                                            userInfo['source'] = plan.source;
                                        }
                                        //若 有效期过了就是"old_ineffective",
                                        if(!userInfo['status']){
                                            userInfo['status'] = new Date(driverDemandOne.time_validity) > new Date() ? config_common.demand_status.ineffective : 'old_ineffective';
                                        }
                                        //若角色不是物流管理员，则只能看到自己的状态，不能看到其他人的状态
                                        if(req.decoded && req.decoded.role==config_common.user_roles.TRAFFIC_DRIVER_PRIVATE){
                                            if(req.decoded && req.decoded.id != userInfo.user_id){
                                                userInfo['status']='';
                                                assignList.push(userInfo);
                                            }else{
                                                assignList.unshift(userInfo);
                                            }
                                        }else{
                                            assignList.push(userInfo);
                                        }
                                        //将完成的订单放在最后

                                        cb10();
                                    }
                                ], cb1);
                            }, function () {
                                if(req.decoded && config_common.accessRule.pass.indexOf(req.decoded.role)>-1){
                                    _.each(driverDemandOne.order_complete, function (a) {
                                        if(a.source != config_common.demand_source.loot_demand){
                                            assignList.push(a);
                                        }
                                    });
                                }
                                driverInfo['assign']['ratio']=config_common.rscDecimal('div', assign_amount, driverDemandOne.amount,3);
                                driverInfo['assign']['amount_remain']=driverDemandOne.amount_remain;
                                driverInfo['assign']['lists']=assignList;
                                cb20();
                            });
                        },
                        loot: function(cb20){
                            var loot_amount=0, lootList=[];
                            async.eachSeries(loot, function(driver,cb1){
                                //初始数据
                                var userInfo={};
                                //场景判断
                                async.waterfall([
                                    function (cb10) {
                                        driverDemandSV.getUserTruck(req, {user_id: driver.user_id}, cb10);
                                    },
                                    function (user, cb10) {
                                        if(!user || !user.truck_id) {return cb1();}
                                        userInfo = _.extend(user, driver);
                                        driverOrderSV.getOne({
                                            find: {
                                                demand_id: driverDemandOne._id.toString(),
                                                supply_user_id: userInfo.user_id,
                                                status: config_common.demand_status.effective
                                            }
                                        }, cb10);
                                    },
                                    function (order, cb10) {
                                        if(order){
                                            userInfo['status'] = order.step > 1 ? order.status :
                                                !order.tip_prices ? 'not_pay' : !!order.tip_price_id ? 'paid': 'paying';
                                            userInfo['plan_id']=order.plan_id;
                                            userInfo['order_id'] = order._id.toString();
                                            userInfo['source'] = order.source;
                                            loot_amount=config_common.rscDecimal('add', loot_amount, order.amount);//指派的吨数
                                        }else{
                                            userInfo['status']='wait_assign';
                                        }
                                        //若角色不是物流管理员，则只能看到自己的状态，不能看到其他人的状态
                                        if(req.decoded && req.decoded.role==config_common.user_roles.TRAFFIC_DRIVER_PRIVATE){
                                            if(req.decoded && req.decoded.id != userInfo.user_id){
                                                userInfo['status']='';
                                                lootList.push(userInfo);
                                            }else{
                                                lootList.unshift(userInfo);
                                            }
                                        }else{
                                            lootList.push(userInfo);
                                        }
                                        cb10();
                                    }
                                ], cb1);
                            }, function () {
                                if(req.decoded && config_common.accessRule.pass.indexOf(req.decoded.role)>-1){
                                    //将完成的订单放在最后
                                    _.each(driverDemandOne.order_complete, function (a) {
                                        if(a.source == config_common.demand_source.loot_demand){
                                            lootList.push(a);
                                        }
                                    });
                                }
                                driverInfo['loot']['ratio']=config_common.rscDecimal('div', loot_amount, driverDemandOne.amount,3);
                                driverInfo['loot']['amount_assign']=loot_amount;
                                driverInfo['loot']['lists']=lootList;
                                cb20();
                            });
                        }
                    }, cb);
                }
            }
        ], function (err) {
            if(err) return next(err);
            if(1==2 && req.decoded && driverDemandOne && driverDemandOne.status== config_common.demand_status.effective  && req.decoded.id != driverDemandOne.demand_user_id){
                // 推送消息
                var msgObj = {
                    title: '查看货源',
                    content: config_msg_template.encodeContent('view_demand', [req.decoded.user_name]),
                    user_ids: [driverDemandOne.demand_user_id]
                };
                extServer.push(req, msgObj, {}, '', {
                    params: {id: driverDemandOne._id.toString(), source: 'grab'}, // type: config_common.push_url.driver_order_detail},
                    url: config_common.push_url.driver_demand
                }, function(){});
            
            }
            config_common.sendData(req, driverInfo, next);
        });

    });
    //token 解析判断
    api.use(require('../../middlewares/mid_verify_user')());

    //常规操作
    /**
     * 取消需求单; 修改来源点的数据 20170919 20170516
     */
    api.post('/close', function(req, res, next){
        //角色判断
        if(config_common.accessRule.pass.indexOf(req.decoded.role)==-1){
            return next({dev: '仅限物流方', pro: '000002'}); //('not_allow');
        }
        //参数判断
        if(!req.body.demand_id){
            return next({dev: 'demand_id参数有误', pro: '000003'}); //('invalid_format');
        }
        //场景判断
        var cond = {};
        if(req.body.demand_id){
            cond._id = req.body.demand_id;
        }
        //执行操作
        async.waterfall([
            function (cb) {
                driverOrderSV.getCount({demand_id: req.body.demand_id}, cb);
            }, function(count, cb){
                //发布者本人或系统可以取消;
                driverDemandSV.close(
                    {demand_id: req.body.demand_id},
                    !!count ? config_common.demand_status.complete : config_common.demand_status.cancelled,
                    cb);
            }
        ], function (err) {
            if(err) {
                return next(err);
            }
            config_common.sendData(req, true, next);
        });
    });

    /**
     *  获取认证公司发布的司机需求单 20170919 20170506
     */
    api.post('/get_list', function(req, res, next){
        //角色判断
        //参数判断
        if(!req.body.scene){
            return next({dev: 'scene参数有误', pro: '000003'}); //('invalid_format');
        }

        //场景判断
        var cond = {}, tipCon = {}, demandTmp=[] , demandArr={} ,mp3_arr=[], new_count=0, mp3_url = 'http://'+config_server.local_server_ip +':'+config_server.port + '/';
        req.body.is_refresh = true; //['true', true, 1, '1'].indexOf(req.body.is_refresh) != -1; //若存在下列刷新，则修改个人查阅时间;
        req.body.page = parseInt(req.body.page) || 1;
        if(req.body.line_id){
            req.body.line_id=_.isArray(req.body.line_id)? req.body.line_id: JSON.parse(req.body.line_id);//req.body.line_id.split(',')
        }
      // 筛选省市县参数的格式化
      _.each(['end_province', 'end_city','end_district',
        'start_province', 'start_city', 'start_district'], function (x) {
        if(req['body'][x] && _.isString(req['body'][x]) ){
          try{
            req['body'][x] = JSON.parse(req['body'][x])
          }catch(err){
            return next({dev: 'error：'+x+'!!!'+err});
          }

        }
      });
        //执行操作
        async.waterfall([
            function (cb) {
                //20170808 relation: 挂靠关系， selfUser ; recommend：平台推荐
                if(req.body.scene == 'relation'){
                    //角色判断，必须是挂靠司机
                    if(req.decoded.role != config_common.user_roles.TRAFFIC_DRIVER_PRIVATE){
                        return cb({dev: '仅限司机方', pro: '000002'}); //('not_allow');
                    }
                    //设置条件
                    if(req.body.company_id){
                        cond.demand_company_id = req.body.company_id;
                    }
                    cond.status = config_common.demand_status.effective;
                    cond.verify_driver = {$in: [req.decoded.id]}; // 存在
                    cond.time_validity = {$gte: new Date()};
                    tipCon = {
                        user_id:req.decoded.id,
                        other_company_id: req.body.company_id
                    };
                    //执行查询
                    if(req.body.company_id){
                        //判断司机和公司是否有关系
                        extServer.generalFun(req, {
                            source: 'user',
                            db:'Driver_verify',
                            method:'getOne',
                            query: {
                                find: {
                                    user_id: req.decoded.id,
                                    company_id: req.body.company_id, //缺少具体人 approve_id
                                }
                            }
                        }, function(err, data){
                            if(err || !data){
                                return cb({dev: '没有认证关系', pro: '000004'}); //直接返回not_found
                            }

                            extServer.tipDriverDemand(tipCon, req.body.is_refresh, cond.status, req.decoded.role, function (err, tipTime) {
                                if(tipTime){
                                    cond.time_modify = {$lte: tipTime.update_time};
                                    new_count = tipTime.count;
                                }
                                cb();
                            });
                        })
                    }else{
                        //获取司机的物流公司列表;
                        extServer.generalFun(req, {
                            source: 'user',
                            db:'Driver_verify',
                            method:'getList',
                            query: {
                                find: {
                                    user_id: req.decoded.id,
                                },
                                select: 'company_id'
                            }
                        }, function(err, company){
                            if(err){
                                return cb({dev: '没有认证关系', pro: '000004'}); //直接返回not_found
                            }
                            cond.demand_company_id = company? {$in : util.transObjArrToSigArr(company, 'company_id')} : {$in: []};
                            cb();
                        });                        
                    }
                }
                if(req.body.scene == 'selfUser'){
                    // 权限检查 必须是物流管理员
                    if(config_common.accessRule.pass.indexOf(req.decoded.role)==-1){
                        return cb({dev: '仅限物流管理员', pro: '000002'}); //('not_allow');
                    }
                    // 条件
                    cond.status = req.body.status||config_common.demand_status.effective;
                    cond.demand_user_id = req.decoded.id;
                    tipCon = {
                        user_id:req.decoded.id,
                        company_id: req.decoded.company_id[0],
                        other_company_id: req.decoded.company_id[0]
                    };
                    // 执行
                    extServer.tipDriverDemand(tipCon, req.body.is_refresh, cond.status, req.decoded.role, function (err, tipTime) {
                        if(tipTime){
                            cond.time_modify = {$lte: tipTime.update_time};
                            new_count = tipTime.count;
                        }
                        cb();
                    });
                }
                if(req.body.scene == 'recommend'){
                    if(req.decoded.role != config_common.user_roles.TRAFFIC_DRIVER_PRIVATE){
                        return cb({dev: '仅限司机方', pro: '000002'}); //('not_allow');
                    }
                    extServer.generalFun(req, {
                        source: 'user',
                        db:'Driver_verify',
                        method:'getList',
                        query: {
                            find: {
                                user_id: req.decoded.id,
                            }
                        }
                    }, function(err, data){
                        cond.demand_company_id={$nin: _.pluck(JSON.parse(JSON.stringify(data)), 'company_id')};
                        cond.platform_driver = {$in: [req.decoded.id]};
                        cb();
                    })
                }
                if(['relation','selfUser', 'recommend'].indexOf(req.body.scene) == -1){
                    return cb({dev: 'scene值超出范围', pro: '000003'}); //若scene 不存在则退出;
                }
            },
            function(cb){
                if(req.decoded.role == config_common.user_roles.TRAFFIC_DRIVER_PRIVATE){
                    var plan_cond = {user_id: req.decoded.id,
                        status: config_common.demand_status.ineffective};
                    if(req.body.company_id){
                        plan_cond.demand_company_id = req.body.company_id;
                    }
                    driverPlanSV.getCount(plan_cond, function (err, count) {
                        demandArr['plan_count'] = count || 0;
                        cb();
                    })
                }else{
                    cb()
                }
            }
            ,function (cb) {
                if(req.body.line_id && _.isArray(req.body.line_id)){
                    trafficLineSV.lineArrDemand(req.body.line_id, function (x,y) {
                        if(y){
                            cond.$or = y;
                            cb()
                        }else{
                            cb()
                        }
                    },req)
                }else if( req.body.start_province || req.body.end_province){
                  cond.$or=config_common.lineSearch(req, true);
                  cb()
                }else{
                    cb()
                }
            }
            ,function(cb){
                driverDemandSV.getList({
                // driverDemandSV.specialList({
                    find: cond,
                    sort: {time_creation: -1},
                    skip: (req.body.page-1) * config_common.entry_per_page, //config_common.entry_per_page
                    limit: config_common.entry_per_page,
                    page: req.body.page
                }, cb)
            },
            function (demandRes, cb) {
                demandArr['count'] = demandRes.count;
                demandArr['demand'] = demandRes.demand;
                demandArr['exist'] = demandRes.exist;
                demandArr['new_count'] = new_count;
                
                if(req.body.scene == 'recommend'){
                    demandArr  = _.extend(demandArr, {ineffective: 0, effective: 0, complete: 0, cancelled:0});
                    driverDemandSV.getAggregate({match: cond, group: {_id: '$status', num: { $sum: 1 }}}, function (err, statisRes) {
                        _.each(statisRes, function(status){
                            demandArr[status._id] = status.num;
                        });
                        cb();
                    });
                }else if(req.body.scene == 'relation'){
                    cond.time_validity={$gt:new Date(), $lt: (new Date((new Date()).getTime()+10*1000*60))};
                    driverDemandSV.getCount(cond, function (err, count) {
                        demandArr['cancelling'] = count;
                    });
                    req.body.search_company=req.body.company_id;
                    driverOrderSV.specialCount(req, function (err, count) {
                        demandArr  = _.extend(demandArr, count);
                        cb();
                    })
                }else{
                    cb();
                }
            }, function(cb){
                //循环追加统计数 和 生成mp3及路径
                async.eachSeries(demandArr['demand'], function(demand, cb1){
                    var demandOne = demand;     //demand.toObject();
                    async.waterfall([
                        function (cb10) {
                            extServer.generalFun(req, {
                                source: 'user',
                                db:'Driver_verify',
                                method:'getList',
                                query: {
                                    find: {
                                        user_id: req.decoded.id,
                                        company_id: demandOne.demand_company_id, //user.company_id[0]
                                        approve_id: demandOne.demand_user_id
                                    },
                                    select: 'company_id'
                                }
                            }, cb10);
                        },
                        function(valid, cb10){
                            demandOne['is_relation'] = valid && valid.length > 0 ? true:false;
                            //查询需求方者发送多少个需求单;
                            driverDemandSV.getCount({
                                demand_user_id: demandOne.demand_user_id,
                                status: cond.status
                            }, cb10);
                        }, function (count, cb10) {
                            demandOne['demand_count'] = count || 0;
                            if(req.decoded.role == config_common.user_roles.TRAFFIC_DRIVER_PRIVATE && demandOne.status=='effective'){

                                extServer.driverTTS(req,demandOne, function (err,url) {
                                    if(url){
                                        demandOne['mp3_url'] = mp3_url + url;
                                        mp3_arr.push(demandOne['mp3_url']);
                                    }
                                    demandTmp.push(demandOne);
                                    cb10();
                                })
                            }else{
                                demandTmp.push(demandOne);
                                cb10();
                            }
                        }
                    ], cb1);
                }, cb);
            },
            function (cb) {
                if(req.decoded.role == config_common.user_roles.TRAFFIC_DRIVER_PRIVATE && req.body.scene == 'recommend'){
                    http.sendUserServerNoToken(req, {
                        type: 'driver_traffic'
                    }, config_api_url.user_push_get_list, function (err, company) {
                        demandArr['push_pass_info'] = company || [];
                        cb();
                    });
                }else{
                    cb();
                }
            }
        ], function(err, result){
            if(err) return next(err);
            demandArr['demand'] = demandTmp;
            demandArr['mp3_arr'] = mp3_arr;
            config_common.sendData(req, demandArr, next);
        });
    });

    //获取数量 20170516
    api.post('/get_count', function(req, res, next){

        // role & param judge
        if(config_common.accessRule.pass.indexOf(req.decoded.role)==-1){
            return next({dev: '仅限物流方', pro: '000002'}); //('not_allow');
        }
        req.body.status = 'all'; req.body.find_role = 'user';
        if(!req.body.status || !req.body.find_role){
            return next({dev: 'status参数有误', pro: '000003'}); //('invalid_format');
        }

        //  condition aggregate
        var cond={};
        if(req.body.find_role=='company'){
            cond.demand_company_id = req.decoded.company_id[0];
        }else{
            cond.demand_user_id = req.decoded.id;
        }

        // execute
        var orderstatus={ineffective: 0, effective: 0, complete:0, cancelled:0};
        async.waterfall([
            function (cb) {
                //获取限定时间内的单据数量
                tipSV.getTime({
                    user_id: req.decoded.id,
                    company_id: req.decoded.company_id[0],
                    other_company_id: req.decoded.company_id[0],
                    type: config_common.tip_type.driver_demand
                }, false, cb);
            },
            function (tipTime, cb) {
                if(tipTime){
                    cond.time_modify = {$lte: tipTime.update_time};
                }
                if(req.body.status == 'all'){
                    driverDemandSV.getAggregate({
                        match: cond,
                        group: {_id: '$status', num: { $sum: 1 }}
                    }, cb);
                }else{
                    if(!config_common.demand_status[req.body.status]){
                        return cb({dev: 'status参数有误', pro: '000003'}); //('status_failed')
                    }
                    cond.status = config_common.demand_status[req.body.status];
                    driverDemandSV.getCount(cond,cb)
                }
            }, function(statisRes, cb){
                if(req.body.status == 'all'){
                    _.each(statisRes, function(status){
                        orderstatus[status._id] = status.num;
                    });
                    cb(null, orderstatus);
                }else{
                    cb(null, statisRes);
                }

            }], function(err,result){
            if(err) return next(err);
            config_common.sendData(req, result, next);
        });
    });

    //特殊操作
    /*
        物流订单形成司机需求单 20170516
        param: order_id ,scene:[traffic_demand,driver_demand,traffic_assign] ,
     */
    api.post('/scene_add', function(req, res, next){
        //角色判断
        if(config_common.accessRule.pass.indexOf(req.decoded.role)==-1){
            return next({dev:'仅限物流方', pro: '000002'}); //'not_allow'
        }
        //参数判断
        //执行操作
        if(!req.body.tip_price || req.body.tip_price<0){
            req.body.tip_price=0;
        }
        var orderData, driverDemand, statisUser=[], time_cost={};
        async.waterfall([
            function (cb) {
                // 条件判断
                var checkout_fields =[
                    {field: 'order_id', type:'string'},
                    {field: 'scene', type:'string'},
                    {field: 'payment_choice', type:'enum'},
                    {field: 'payment_method', type:'enum'},
                    {field: 'price_type', type:'enum'},
                    {field: 'time_validity', type:'date'},
                    {field: 'user_ids', type:'array'},
                    {field: 'price', type:'number'}
                ];
                config_common.checkField(req, checkout_fields, function (err) {
                    if(err) {
                        return cb({dev: err, pro: '000003'});//'000003'
                    }
                    //场景判断
                    req.body.att_traffic = !_.isObject(req.body.att_traffic) ? JSON.parse(req.body.att_traffic) : req.body.att_traffic;
                    cb();

                });
            },
            function(cb){
                //判断 是否可以发布司机需求单
                trafficOrderSV.getOne({
                    find: {
                        _id: req.body.order_id,
                        supply_company_id: req.decoded.company_id[0],
                        step:{$lt:4},
                        status: {$nin: [config_common.demand_status.cancelled]}
                    }
                }, cb);
            }, function(order, cb){
                if (!order) {
                    return cb({dev: '订单没找到', pro: '000004'}); //('not_found');
                }
                if (order.amount_remain<= 0) {
                    return cb({dev: '剩余吨数不足', pro: '000006'}); //('not_enough_amount');
                }
                if(req.decoded.id != order.supply_user_id){
                    return cb({dev: '您不是该笔物流订单的发起者'})
                }
                orderData = order;
                //增加时间扣款
                if(req.body.date_type || req.body.cut_type){
                    if(req.body.date_type=='start'){
                        time_cost.date_type='start',
                            time_cost.start_type=req.body.start_type,
                            time_cost.time_stamp=Date.now()+req.body.start_type*5*24*60*60*1000;
                    }else{
                        time_cost.date_type='cut',
                            time_cost.cut_type=req.body.cut_type,
                            time_cost.cut_date=req.body.cut_date,
                            time_cost.timeout_price=req.body.timeout_price,
                            time_cost.not_count_price=req.body.not_count_price
                        ;
                        var t = new Date();
                        if(req.body.cut_type=='today'){
                            time_cost.time_stamp=(new Date(t.getFullYear()+'/'+(t.getMonth()+1)+'/'+t.getDate())).getTime()+req.body.cut_date*60*60*1000;
                        }else{
                            time_cost.time_stamp=(new Date(t.getFullYear()+'/'+(t.getMonth()+1)+'/'+(t.getDate()+1))).getTime()+req.body.cut_date*60*60*1000;
                        }

                    }
                    // time_cost={
                    //     data_type:'start'
                    //     ,start_type:5
                    //     ,time_stamp: Date.now()+5*24*60*60*1000
                    //     ,cut_type: ''
                    //     ,cut_date:''
                    //     ,timeout_price:''
                    //     ,not_count_price:''
                    // }
                }
                //假设 物流订单全部产品 转为一个司机需求单。
                var driverObj = {
                    index: config_common.getDriverOfferDemandIndex(),       //随机生成订单号
                    demand_user_id: req.decoded.id,                         //发需求单人[物流]id（就是买卖双方的一方）
                    demand_user_name: req.decoded.user_name,                         //发需求单人[物流]id（就是买卖双方的一方）
                    demand_company_id: req.decoded.company_id && req.decoded.company_id.length>0? req.decoded.company_id[0] : '',          //发需求单公司id（就是买卖双方的一方）
                    demand_company_name: req.decoded.company_name, //orderData.supply_company_name,  //物流公司名
                    index_order: orderData.index,                           //物流订单订单号
                    order_id: orderData._id.toString(),
                    material: orderData.material,                //行业类别
                    material_chn: orderData.product_categories[0]['material_chn'], //config_common.material[orderData.material],                //行业类别
                    category: orderData.category,
                    category_chn: orderData.category_chn,        //商品中文名
                    product_categories : orderData.product_categories,   //产品
                    products_remain: orderData.products_remain, //产品目录
                    products_replenish : orderData.products_replenish, //补货,
                    //金融
                    price_type : req.body.price_type,
                    payment_choice : req.body.payment_choice,
                    payment_method : req.body.payment_method,
                    count_day_extension: req.body.count_day_extension,
                    ref_day_extension: req.body.ref_day_extension,
                    percentage_advance: req.body.percentage_advance,
                    percentage_remain: req.body.percentage_remain,
                    // 细则
                    att_traffic : req.body.att_traffic || {one:[1,0,0],two:[0,0]},
                    weigh_settlement_style: req.body.weigh_settlement_style || config_common.weigh_settlement_style.theory,		  //重量结算方式
                    time_settlement_style: config_common.time_settlement_style.not_used,		  //时间结算方式
                    appendix: req.body.appendix,
                    quality_origin: orderData.quality_origin, //质检方
                    //来往地址
                    send_address_id: orderData.send_address_id,
                    send_name: orderData.send_name,        //发送方名字
                    send_phone: orderData.send_phone,       //发送方电话
                    send_province: orderData.send_province,   //发送方省
                    send_city: orderData.send_city,        //发送方市
                    send_district: orderData.send_district,   //发送方区
                    send_addr: orderData.send_addr,       //发送方详细
                    send_loc: orderData.send_loc,    //20170531
                    receive_address_id: orderData.receive_address_id,
                    receive_loc: orderData.receive_loc,   //20170531
                    receive_name: orderData.receive_name,    //接收方名字
                    receive_phone: orderData.receive_phone,   //接收方电话
                    receive_province: orderData.receive_province,//接收方省
                    receive_city: orderData.receive_city,     //接收方市
                    receive_district: orderData.receive_district, //接收方区
                    receive_addr: orderData.receive_addr,      //接收方详细
                    //发票信息 和备注
                    invoice_name: req.body.invoice_name || '',               //发票公司名
                    invoice_addr: req.body.invoice_addr || '',               //单位地址
                    invoice_number: req.body.invoice_number || '',             //税号
                    invoice_phone: req.body.invoice_phone || '',              //公司电话
                    invoice_bank: req.body.invoice_bank || '',               //开户银行
                    invoice_account: req.body.invoice_account || '',           //公司账号
                    //时间
                    time_validity : req.body.time_validity,                 // 延期
                    time_modify: new Date(),
                    unoffer_list : [],
                    verify_driver : _.uniq(req.body.user_ids),
                    source: config_common.demand_source.driver_assign,
                    platform_driver: _.uniq(req.body.platform_driver) || [], //20171101
                    tip_price: req.body.tip_price || 0, //信息费
                    admin_id: req.decoded.admin_id,
                    send_nickname: orderData.send_nickname,
                    receive_nickname: orderData.receive_nickname,
                    category_penult: orderData.category_penult,
                    category_penult_chn: orderData.category_penult_chn
                };
                if(orderData.time_arrival){
                    driverObj.time_arrival = orderData.time_arrival;                   //提货时间
                }
                if(orderData.time_depart){
                    driverObj.time_depart = orderData.time_depart;
                }
                if(orderData.time_depart_start){
                    driverObj.time_depart_start = orderData.time_depart_start;
                }
                if(orderData.time_depart_end){
                    driverObj.time_depart_end = orderData.time_depart_end;
                }
                if(orderData.payment_payee){
                    driverObj.payment_payee = orderData.payment_payee;
                }
                if(orderData.freight_voucher){
                    driverObj.freight_voucher = orderData.freight_voucher;
                }
                if(time_cost.time_stamp){
                    driverObj.time_cost=time_cost;
                }
                driverObj.amount = driverObj.amount_remain = orderData.amount_remain;
                driverObj.price =  config_common.converNumberLength(req.body.price, 2);
                driverObj.assign_count = driverObj.verify_driver.length + driverObj.platform_driver.length;
                driverObj.section = config_common.demandAreaCollect(driverObj.send_province, driverObj.send_city, driverObj.send_district);
                driverObj.end_section = config_common.demandAreaCollect(driverObj.receive_province, driverObj.receive_city, driverObj.receive_district);
                driverObj.payment_payer = req.body.payment_payer;
                //增加物流需求方id
                driverObj.supply_user_id=orderData.demand_user_id,
                driverObj.supply_company_id=orderData.demand_company_id,
                driverObj.supply_company_name=orderData.demand_company_name;
                //20180619 产品搜索
                driverObj.find_category=config_common.getFindCategory(driverObj.product_categories);

                driverDemandSV.add(driverObj, cb);
            }, function(driver, count, cb){
                //增加指派司机的头像;
                driverDemand = driver.toObject();
                extServer.userLogo('traffic', {
                    _id: {$in: driverDemand.verify_driver}
                }, function (err, list) {
                    if(list){
                        driverDemand['assign_user_info'] = list;
                    }
                    extServer.userLogo('traffic', {
                        _id: {$in: driverDemand.platform_driver}
                    }, function (err, list) {
                        if(list){
                            driverDemand['platform_user_info'] = list;
                        }
                        cb();
                    });
                });

            }, function(cb){
                // --- 司机需求单生成后,发布动态信息、统计流量、消息推送、改变物流订单 ---
                //1向动态服务器增加动态
                extServer.addDynamicServer({
                    company_id: driverDemand.demand_company_id,
                    user_id: driverDemand.demand_user_id,
                    type: config_common.typeCode.driver_assign,
                    data: JSON.stringify(driverDemand)
                }, function(){});
                //2向统计服务器累计指派量
                extServer.statisticalSV({
                    companyObj:[{
                        type: config_common.statistical.driver_assign,
                        id: req.decoded.company_id,
                        count: req.body.user_ids.length
                    }]
                }, 'traffic');
                _.each(req.body.user_ids, function(userId){
                    statisUser.push({
                        type: config_common.statistical.driver_assign,
                        id: userId
                    })
                });
                extServer.statisticalSV({
                    userObj: statisUser
                }, 'driver');

                //3推送消息

                //4改变物流订单
                orderData.products_remain = [];         //
                orderData.amount_remain = 0;            //
                orderData.step = 4;
                orderData.time_update_step = new Date();
                orderData.save(cb);
            }
        ], function(err){
            if(err){
                return next(err);
            }
            //发送推送
            async.waterfall([
                function (push) {
                    async.eachSeries(_.union(driverDemand['assign_user_info'], driverDemand['platform_user_info']), function (user, push1) {
                        // 【司机中心】(3942838)鑫汇物流给您指派大同-太原线材类运输，总运量1300吨，运费50元/吨，请点击vehicles.e-wto.com在线接单，立即领取300元现金红包或回复电话18888888888现场支付信息费
                        // %s给您指派%s-%s%s运输，总运量%s吨，运费%s元/吨，请点击%s在线接单，%s现场支付信息费
                        var redcard='';
                        async.waterfall([
                            function (push2) {
                                //红包检查
                                extServer.redcardtip(req, {
                                    company_id: driverDemand.demand_company_id,
                                    user_id: user._id
                                }, push2)
                            }, function (redcardR, push2) {
                                var ispush_driver=false;
                                if(redcardR && redcardR.uuid && ((new Date()).getTime())>((new Date(redcardR.uuid.time_creation)).getTime() + 7*24*60*60*1000) ){
                                    ispush_driver=true;
                                }
                                if((!!redcardR.card || !!redcardR.cardOrder) && !redcardR.uuid){
                                    redcard +='立即领取'+redcardR.card.money+'元现金红包或'+'回复电话'+req.decoded.phone;
                                }else{
                                    redcard +='回复电话'+req.decoded.phone;
                                }
                                if(ispush_driver){
                                    var msgObj = {
                                        title: '司机指派',
                                        //尊敬的XX先生，XX物流给您指派运输太原—长治螺纹钢运输，每吨80元，请立即接单（链接：）；
                                        content: config_msg_template.encodeContent('traffic_assign_driver_red', [
                                            driverDemand['demand_company_name'] ? driverDemand['demand_company_name'] : '',
                                            driverDemand['send_city'],
                                            driverDemand['receive_city'],
                                            driverDemand['category_chn'],
                                            driverDemand['amount'],
                                            driverDemand['price'],
                                            'vehicles.e-wto.com',
                                            redcard
                                        ]),
                                        user_ids: [user._id] //[user._id]//req.body.user_ids 认证 和非认证
                                    };
                                    extServer.push(req, msgObj, {}, '',
                                        {
                                            params: {id: driverDemand._id.toString(),type: config_common.push_url.transport_detail},
                                            url: config_common.push_url.transport_detail
                                        }, push2);
                                }else{
                                    extServer.driverMsg(req, {
                                        phone: [user.phone],
                                        params: [
                                            driverDemand['demand_company_name'] ? driverDemand['demand_company_name'] : '',
                                            driverDemand['send_city'],
                                            driverDemand['receive_city'],
                                            driverDemand['category_chn'],
                                            driverDemand['amount'],
                                            driverDemand['price'],
                                            'vehicles.e-wto.com',
                                            redcard
                                        ],
                                        templateid: '3942838',
                                        id: driverDemand._id
                                    }, push2)
                                }
                                
                            }
                        ], function(){
                            push1()
                        });
                    }, push);
                }
            ], function () {});
            config_common.sendData(req, driverDemand, next);
        });
    });

   

    /**
     * 获取车辆分配钢铁数  20170516
     *  通过车载重 货品重量 ，推算货物混批的比例；
     */
    api.post('/get_truck_assign', function(req, res, next){
        if(config_common.accessRule.pass.indexOf(req.decoded.role)==-1 &&
            req.decoded.role != config_common.user_roles.TRAFFIC_DRIVER_PRIVATE){
            return next({dev: '仅限物流和司机', pro: '000002'}); //('not_allow');
        }
        if(!req.body.demand_id ||
            !req.body.weight){
            return next({dev: 'demand_id,weight参数有误', pro: '000003'}); //('invalid_format');
        }
        req.body.weight = Number(req.body.weight)||0;
        var driverDemand, assignRes={};
        async.waterfall([
            function(cb){
                //获取司机需求单
                driverDemandSV.getOne({
                    find: {
                        _id: req.body.demand_id,
                        amount_remain: {$gt: 0},
                        status: {$nin: [config_common.demand_status.complete, config_common.demand_status.ineffective]}
                    }
                }, cb);
            }, function(demandRes, cb) {
                if (!demandRes || !demandRes.product_categories[0]) {
                    return cb({dev: '司机需求单没找到', pro: '000004'}); //('driverDemand_not_found');
                }
                assignRes['amount_total'] = demandRes.amount_remain ;
                assignRes['tip_price'] = demandRes.tip_price ;
                async.waterfall([
                    function (cb1) {
                        if (demandRes.products_remain.length == 0) {
                            return cb({dev: '没有可指派的产品', pro: '000006'}); //('not_products_remain');
                        }
                        driverDemand = demandRes;
                        var assign_produce = config_common.passListToAssignProduct(req.body.weight, driverDemand.product_categories, driverDemand.products_remain);
                        cb1(null, assign_produce);
                    },
                    function(assign, cb1){
                        assignRes['product_categories'] = assign;
                        assignRes['amount'] = _.reduce(_.pluck(assign, 'pass_amount'),function (memo, num) {
                            return config_common.rscDecimal('add', memo, num);
                        }, 0);
                        cb1();
                    }
                ], cb);
            }

        ],function(err){
            if(err){
                return next(err);
            }
            config_common.sendData(req, assignRes, next);
        });
    });

    /**
     * 修改司机需求单，增加挂靠司机
     */
    api.post('/edit', function(req, res, next){
        var driverDemand;
        async.waterfall([
            function (cb) {
                if(!req.body.demand_id || !_.isArray(req.body.user_ids)){
                    return cb({dev: '参数有误'});
                }
                cb()
            }, function (cb) {
                driverDemandSV.getOne({
                    find: {_id: req.body.demand_id}
                }, cb)
            }, function (demand, cb) {
                if(!demand){
                    return cb({dev: '单据没找到'});
                }
                driverDemand = demand;
                demand.verify_driver = _.union(demand.verify_driver, req.body.user_ids);//platform_driver
                demand.platform_driver = _.union(demand.platform_driver, req.body.platform_driver);//platform_driver
                demand.assign_count = demand.verify_driver.length + demand.platform_driver.length + demand.unoffer_list.length;
                demand.time_modify = new Date();
                demand.save(cb);
            }
        ], function (err, result) {
            if(err){
                return next(err);
            }
            //发送推送
            async.waterfall([
                function (push) {
                    extServer.userLogo('traffic', {
                        _id: {$in: req.body.user_ids}
                    }, function (err, list) {
                        push(null, list, 'url');
                    });
                }, function(userinfo, url, push){
                    async.eachSeries(userinfo, function (user, push1) {
                        var msgObj = {
                            title: '司机指派',
                            //尊敬的XX先生，XX物流给您指派运输太原—长治螺纹钢运输，每吨80元，请立即接单（链接：）；
                            content: config_msg_template.encodeContent('traffic_assign_driver', [
                                result['demand_company_name'] ? result['demand_company_name'] : '',
                                result['send_city'],
                                result['receive_city'],
                                result['category_chn'],
                                result['price'],
                                req.decoded.phone,
                                url
                            ]),
                            user_ids: [user._id]
                        };
                        extServer.push(req, msgObj, {}, '',
                            {
                                params: {id: driverDemand._id.toString(),type: config_common.push_url.transport_detail},
                                url: config_common.push_url.transport_detail// url: config_common.push_url.driver_demand
                            }, function () {
                                push1();
                            });
                    }, push);
                }
            ], function () {});
            config_common.sendData(req, driverDemand, next);
        });
    });

    //司机 商业智能, 20171205 搁置
    /**
    api.post('/get_assign_list_lay', function (req, res, next) {
        var assign_result = {} , relation_company = [];
        if(req.decoded.role != config_common.user_roles.TRAFFIC_DRIVER_PRIVATE){
            return next({dev: '仅限司机'});
        }
        req.body.page = req.body.page || 1;
        async.waterfall([
            function (cb) {
                //货源量
                driverDemandSV.getCount({
                    $or: [{platform_driver: { $in: [req.decoded.id]}},{verify_driver: { $in: [req.decoded.id]}}],
                    status: config_common.demand_status.effective
                }, cb)
            },
            function (count, cb) {
                assign_result['demand_count'] = count || 0;
                //参与量,排名 assign_result['plan'] = {count: , sort: []}
                driverPlanSV.getCount({
                    user_id: req.decoded.id,
                    status: config_common.demand_status.effective
                }, cb);
            },
            function (count, cb) {
                assign_result['plan_count'] =  count || 0;
                //推荐物流需求单 包含过期和完成和有效的
                driverDemandSV.getList({
                    find: {platform_driver: { $in: [req.decoded.id]}},
                    skip: (req.body.page-1) * config_common.entry_per_page,
                    limit: config_common.entry_per_page,
                    sort: {time_creation: -1},
                    page: req.body.page
                }, cb);
            },
            function (demand, cb) {
                assign_result['recommend_list'] = demand;
                //推荐企业的名片
                async.waterfall([
                    function (cb1) {
                        extServer.generalFun(req, {
                            source: 'user',
                            db:'Driver_verify',
                            method:'getList',
                            query: {
                                find: {
                                    user_id: req.decoded.id
                                },
                                select: 'company_id'
                            }
                        }, cb1);
                    },
                    function (company, cb1) {
                        if(company){
                            relation_company = _.pluck(company, 'company_id');
                        }
                        extServer.generalFun(req, {
                            source: 'user',
                            db:'Company_traffic',
                            method:'getCount',
                            query:{
                                _id: {$nin: relation_company}
                            }}, cb1);
                    },
                    function (count, cb1) {
                        if(!count){
                            cb();
                        }
                        extServer.generalFun(req, {
                            source: 'user',
                            db:'Company_traffic',
                            method:'getList',
                            query:{
                                find: {
                                    _id: {$nin: relation_company}
                                },
                                skip: Math.floor(Math.random() * count), //取count中的一个随机数
                                limit: 1
                            }}, function (err, traffic) {
                            if(traffic){
                                assign_result['recommend_company'] = traffic[0];
                            }
                            cb1();
                        });
                    }
                ], cb);
            }
        ], function (err, result) {
            if(err){
                return next(err);
            }
            config_common.sendData(req, assign_result, next);
        });
    });
    */

    /**
     *  双方司机,不涉及到物流订单
     */
    api.post('/add_both', function(req, res, next){
        //角色判断
        if(config_common.accessRule.pass.indexOf(req.decoded.role)==-1){
            return next({dev:'仅限物流方', pro: '000002'}); //'not_allow'
        }

        //参数判断
        //执行操作
        var driverDemand, statisUser=[], orderData = {send_address_id:'', send_province : '',send_city:'', send_district:'', send_addr:'', send_name:'',send_phone:'',send_location:[], section:[]
                , receive_address_id:'',receive_province:'',receive_city:'',receive_district:'',receive_addr:'',receive_name:'',receive_phone:'',receive_location:[], end_section:[]},
            time_cost={}
            ;
        if(!req.body.tip_price || req.body.tip_price<0){
            req.body.tip_price=0;
        }
        async.waterfall([
            function (cb) {
                // 条件判断

                var checkout_fields =[
                    {field: 'scene', type:'string'},
                    {field: 'send_id', type:'string'},
                    {field: 'receive_id', type:'string'},
                    {field: 'quality_origin', type:'string'},
                    {field: 'payment_choice', type:'enum'},
                    {field: 'payment_method', type:'enum'},
                    {field: 'price_type', type:'enum'},
                    {field: 'time_validity', type:'date'},
                    {field: 'product_categories', type:'object'}
                ];
                req.body.product_categories = config_common.randomProductId(req.body.product_categories);
                config_common.checkField(req, checkout_fields, function (err) {
                    if(err) {
                        return cb({dev: err, pro: '000003'});//'000003'
                    }
                    //场景判断
                    req.body.att_traffic = !_.isObject(req.body.att_traffic) ? JSON.parse(req.body.att_traffic) : req.body.att_traffic;
                    if(req.body.platform_driver){
                        req.body.platform_driver = _.isArray(req.body.platform_driver) ? req.body.platform_driver : JSON.parse(req.body.platform_driver);
                    }
                    if(req.body.user_ids){
                        req.body.user_ids = _.isArray(req.body.user_ids) ? req.body.user_ids : JSON.parse(req.body.user_ids);
                    }
                    if(req.body.platform_driver && req.body.user_ids && req.body.platform_driver.length==0  && req.body.user_ids.length==0){
                        return cb({dev: '未指派司机'});
                    }else{
                        cb();
                    }
                });
            },
            function(cb){


                if(req.body.scene != 'both'){
                    //req.body.user_ids , req.body.platform_driver
                    //线路报价需要增加 需求单的次数
                    extServer.generalFun(req, {
                        source: 'user',
                        db:'Driver_verify',
                        method:'getOne',
                        query: {
                            find: {
                                approve_id: req.decoded.id,
                                user_id: req.body.user_ids[0]
                            },
                        }
                    }, function (err, count) {
                        if(!count){
                            req.body.platform_driver = req.body.user_ids;
                            req.body.user_ids = [];
                        }
                        cb();
                    })
                }else{

                    cb();
                }
            },
            function(cb){
                //增加时间扣款
                if(req.body.date_type || req.body.cut_type){
                    if(req.body.date_type=='start'){
                        time_cost.date_type='start',
                            time_cost.start_type=req.body.start_type,
                            time_cost.time_stamp=Date.now()+req.body.start_type*5*24*60*60*1000;
                    }else{
                        time_cost.date_type='cut',
                            time_cost.cut_type=req.body.cut_type,
                            time_cost.cut_date=req.body.cut_date,
                            time_cost.timeout_price=req.body.timeout_price,
                            time_cost.not_count_price=req.body.not_count_price
                        ;
                        var t = new Date();
                        if(req.body.cut_type=='today'){
                            time_cost.time_stamp=(new Date(t.getFullYear()+'/'+(t.getMonth()+1)+'/'+t.getDate())).getTime()+req.body.cut_date*60*60*1000;
                        }else{
                            time_cost.time_stamp=(new Date(t.getFullYear()+'/'+(t.getMonth()+1)+'/'+(t.getDate()+1))).getTime()+req.body.cut_date*60*60*1000;
                        }

                    }
                }
                //地址查询
                extServer.judgeStore({
                    _id: req.body.receive_id
                }, cb);
            },
            function(address, cb){
                if(address){
                    orderData.receive_address_id = address && address.type ? address._id.toString() : '';
                    orderData.receive_province = address.province;               //省
                    orderData.receive_city = address.city;               //市
                    orderData.receive_district = address.district;               //区
                    orderData.receive_addr = address.addr;
                    orderData.receive_name = address.prin_name;    //接收方名字
                    orderData.receive_phone = address.prin_phone;   //接收方电话
                    orderData.receive_loc = [address.location[0], address.location[1]]; //loc[1];
                    orderData.section = config_common.demandAreaCollect(orderData.receive_province, orderData.receive_city, orderData.receive_district);
                    
                    orderData.receive_nickname = address.name;
                }
                extServer.judgeStore({
                    _id: req.body.send_id
                }, cb);
            },
            function (address, cb) {
                if(address){
                    orderData.send_address_id = address && address.type ? address._id.toString() : '';
                    orderData.send_province = address.province;               //省
                    orderData.send_city = address.city;               //市
                    orderData.send_district = address.district;               //区
                    orderData.send_addr = address.addr;
                    orderData.send_name = address.prin_name;    //接收方名字
                    orderData.send_phone = address.prin_phone;   //接收方电话
                    orderData.send_loc = [address.location[0], address.location[1]]; //loc[1];
                    orderData.section = config_common.demandAreaCollect(orderData.send_province, orderData.send_city, orderData.send_district);
                    orderData.send_nickname = address.name;
                }
                //假设 物流订单全部产品 转为一个司机需求单。
                var driverObj = {
                    index: config_common.getDriverOfferDemandIndex(),       //随机生成订单号
                    demand_user_id: req.decoded.id,                         //发需求单人id（就是买卖双方的一方）
                    demand_user_name: req.decoded.user_name,                         //发需求单人id（就是买卖双方的一方）
                    demand_company_id: req.decoded.company_id,          //发需求单公司id（就是买卖双方的一方）
                    demand_company_name: req.decoded.company_name,  //物流公司名
                    //金融
                    price_type : req.body.price_type,
                    payment_choice : req.body.payment_choice,
                    payment_method : req.body.payment_method,
                    count_day_extension: req.body.count_day_extension,
                    ref_day_extension: req.body.ref_day_extension,
                    percentage_advance: req.body.percentage_advance,
                    percentage_remain: req.body.percentage_remain,
                    // 细则
                    att_traffic : req.body.att_traffic || {one:[1,0,0],two:[0,0]},
                    weigh_settlement_style: req.body.weigh_settlement_style || config_common.weigh_settlement_style.theory,		  //重量结算方式
                    time_settlement_style: config_common.time_settlement_style.not_used,		  //时间结算方式
                    appendix: req.body.appendix,
                    quality_origin: req.body.quality_origin, //质检方
                    //来往地址
                    send_address_id: orderData.send_address_id,
                    send_name: orderData.send_name,        //发送方名字
                    send_phone: orderData.send_phone,       //发送方电话
                    send_province: orderData.send_province,   //发送方省
                    send_city: orderData.send_city,        //发送方市
                    send_district: orderData.send_district,   //发送方区
                    send_addr: orderData.send_addr,       //发送方详细
                    send_loc: orderData.send_loc,    //20170531
                    receive_address_id: orderData.receive_address_id,
                    receive_loc: orderData.receive_loc,   //20170531
                    receive_name: orderData.receive_name,    //接收方名字
                    receive_phone: orderData.receive_phone,   //接收方电话
                    receive_province: orderData.receive_province,//接收方省
                    receive_city: orderData.receive_city,     //接收方市
                    receive_district: orderData.receive_district, //接收方区
                    receive_addr: orderData.receive_addr,      //接收方详细
                    //发票信息 和备注
                    invoice_name: req.body.invoice_name || '',               //发票公司名
                    invoice_addr: req.body.invoice_addr || '',               //单位地址
                    invoice_number: req.body.invoice_number || '',             //税号
                    invoice_phone: req.body.invoice_phone || '',              //公司电话
                    invoice_bank: req.body.invoice_bank || '',               //开户银行
                    invoice_account: req.body.invoice_account || '',           //公司账号
                    //时间
                    time_depart : req.body.time_depart,                     //提货时间.

                    time_validity : req.body.time_validity,                 // 延期
                    time_modify: new Date(),
                    unoffer_list : [],
                    verify_driver : _.uniq(req.body.user_ids),
                    source: req.body.scene == 'both' ? config_common.demand_source.driver_demand : config_common.demand_source.line_demand,
                    platform_driver: _.uniq(req.body.platform_driver) || [], //20171101
                    tip_price: req.body.tip_price || 0, //信息费
                    admin_id: req.decoded.admin_id,
                    send_nickname: orderData.send_nickname,
                    receive_nickname: orderData.receive_nickname,
                    payment_payer: req.body.payment_payer || 'demand'
                };
                if(time_cost.time_stamp){
                    driverObj.time_cost=time_cost;
                }
                driverObj.price =  config_common.converNumberLength(req.body.price, 2);
                driverObj.assign_count = driverObj.verify_driver.length + driverObj.platform_driver.length;
                driverObj.material = req.body.product_categories[0]['material'];
                driverObj.material_chn = req.body.product_categories[0]['material_chn'];
                driverObj.category = (_.uniq(_.pluck(req.body.product_categories, 'layer_1'))).join(',');
                driverObj.category_chn = (_.uniq(_.pluck(req.body.product_categories, 'layer_1_chn'))).join(',');
                driverObj.category_penult = config_common.penultCategory(req.body.product_categories);
                driverObj.category_penult_chn = config_common.penultCategoryChn(req.body.product_categories);
                driverObj.product_categories = config_common.product_categories_construct(req.body.product_categories); //商品目录
                driverObj.products_remain = config_common.products_remain_construct(req.body.product_categories, 'number'); //商品目录:与值,
                var convertProduce = config_common.products_catelog(req.body.product_categories);
                driverObj.amount = driverObj.amount_remain = convertProduce.amount;
                driverObj.section = config_common.demandAreaCollect(driverObj.send_province, driverObj.send_city, driverObj.send_district);
                driverObj.end_section = config_common.demandAreaCollect(driverObj.receive_province, driverObj.receive_city, driverObj.receive_district);
                if(req.body.time_arrival){
                    driverObj.time_arrival = req.body.time_arrival;                   //提货时间
                }
                if(req.body.time_depart){
                    driverObj.time_depart = req.body.time_depart;
                }
                if(req.body.time_depart_start){
                    driverObj.time_depart_start = req.body.time_depart_start;
                }
                if(req.body.time_depart_end){
                    driverObj.time_depart_end = req.body.time_depart_end;
                }
                if(req.body.payment_payee){
                    driverObj.payment_payee = req.body.payment_payee;
                }
                if(req.body.freight_voucher){
                    driverObj.freight_voucher = req.body.freight_voucher;
                }
                if(req.body.line_id){
                    driverObj.line_id = req.body.line_id;
                    //更改数据数
                    trafficLineSV.updateList({find: {_id: req.body.line_id}, set:{
                        $inc: {demand_count: 1}
                    }}, function () {});
                }
                //20180619 产品搜索
                driverObj.find_category=config_common.getFindCategory(driverObj.product_categories);
                driverDemandSV.add(driverObj, cb);
            },
            function(driver, count, cb){
                //增加指派司机的头像;
                driverDemand = driver.toObject();
                extServer.userLogo('traffic', {
                    _id: {$in: driverDemand.verify_driver}
                }, function (err, list) {
                    if(list){
                        driverDemand['assign_user_info'] = list;
                    }
                    extServer.userLogo('traffic', {
                        _id: {$in: driverDemand.platform_driver}
                    }, function (err, list) {
                        if(list){
                            driverDemand['platform_user_info'] = list;
                        }
                        cb();
                    });
                });
                // --- 司机需求单生成后,发布动态信息、统计流量、消息推送、改变物流订单 ---
                //1向动态服务器增加动态
                extServer.addDynamicServer({
                    company_id: driverDemand.demand_company_id,
                    user_id: driverDemand.demand_user_id,
                    type: config_common.typeCode.driver_assign,
                    data: JSON.stringify(driverDemand)
                }, function(){});
                //2向统计服务器累计指派量
                extServer.statisticalSV({
                    companyObj:[{
                        type: config_common.statistical.driver_assign,
                        id: req.decoded.company_id,
                        count: req.body.user_ids.length
                    }]
                }, 'traffic');
                _.each(req.body.user_ids, function(userId){
                    statisUser.push({
                        type: config_common.statistical.driver_assign,
                        id: userId
                    })
                });
                extServer.statisticalSV({
                    userObj: statisUser
                }, 'driver');
                //3推送消息
                // cb();
            }
        ], function(err){
            if(err){
                return next(err);
            }
            //发送推送
            async.waterfall([
                function (push) {
                    async.eachSeries(_.union(driverDemand['assign_user_info'], driverDemand['platform_user_info']), function (user, push1) {

                        var redcard='';
                        async.waterfall([
                            function (push2) {
                                //红包检查
                                extServer.redcardtip(req, {
                                    company_id: driverDemand.demand_company_id,
                                    user_id: user._id
                                }, push2)
                            }, function (redcardR, push2) {
                                var ispush_driver=false;
                                if(redcardR && redcardR.uuid && ((new Date()).getTime())>((new Date(redcardR.uuid.time_creation)).getTime() + 7*24*60*60*1000) ){
                                    ispush_driver=true;
                                }
                                if((!!redcardR.card || !!redcardR.cardOrder) && !redcardR.uuid){
                                    redcard +='立即领取'+redcardR.card.money+'元现金红包或'+'回复电话'+req.decoded.phone;
                                }else{
                                    redcard +='回复电话'+req.decoded.phone;
                                }
                                //推送
                                if(ispush_driver){
                                    var msgObj = {
                                        title: '司机指派',
                                        //尊敬的XX先生，XX物流给您指派运输太原—长治螺纹钢运输，每吨80元，请立即接单（链接：）；
                                        content: config_msg_template.encodeContent('traffic_assign_driver_red', [
                                            driverDemand['demand_company_name'] ? driverDemand['demand_company_name'] : '',
                                            driverDemand['send_city'],
                                            driverDemand['receive_city'],
                                            driverDemand['category_chn'],
                                            driverDemand['amount'],
                                            driverDemand['price'],
                                            'vehicles.e-wto.com',
                                            redcard
                                        ]),
                                        user_ids: [user._id]//req.body.user_ids
                                    };
                                    extServer.push(req, msgObj, {}, '',
                                        {
                                            params: {id: driverDemand._id.toString(),type: config_common.push_url.transport_detail},
                                            url: config_common.push_url.transport_detail// url: config_common.push_url.driver_demand
                                        }, push2);
                                }else{
                                    //短信
                                    extServer.driverMsg(req, {
                                        phone: [user.phone],
                                        params: [
                                            driverDemand['demand_company_name'] ? driverDemand['demand_company_name'] : '',
                                            driverDemand['send_city'],
                                            driverDemand['receive_city'],
                                            driverDemand['category_chn'],
                                            driverDemand['amount'],
                                            driverDemand['price'],
                                            'vehicles.e-wto.com',
                                            redcard
                                        ],
                                        templateid: '3942838',
                                        id: driverDemand._id
                                    }, push2)
                                }
                            }
                        ], function(){
                            push1()
                        });
                    }, push);
                }
            ], function () {});
            config_common.sendData(req, driverDemand, next);
        });
    });

    return api;
};
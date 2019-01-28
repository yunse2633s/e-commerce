/**
 * sj 20170424.
 */
//外部工具引用
var async = require('async');
var _ = require('underscore');
var express = require('express');
//内部工具引用
var http = require('../../lib/http');


//配置文件引用
// var config_server = require('../../configs/config_server');
var config_common = require('../../configs/config_common');
var configProvince = require('../../configs/config_province');
var configCity = require('../../configs/config_city');
var configDistrict = require('../../configs/config_district');

//内部数据操作引用
var trafficLineSV = require('../../lib/lib_traffic_line');
var trafficOrderSV = require('../../lib/lib_traffic_order');
var trafficDemandSV = require('../../lib/lib_traffic_demand');
var driverDemandSV = require('../../lib/lib_traffic_driver_demand');
var driverOrderSV = require('../../lib/lib_traffic_driver_order');
var extServer = require('../../lib/lib_ext_server');
var trafficLinePriceSV = require('../../lib/lib_traffic_line_price');
var driverPlanSV = require('../../lib/lib_traffic_driver_plan');
var trafficPushSV = require('../../lib/lib_traffic_push');
var config_api_url = require('../../configs/config_api_url');

module.exports = function() {
    var api = express.Router();
    // 
    //运输-车辆行情-推荐车辆 /:line_id/:role req.params.role
    api.post('/pass_one_truck', function (req, res, next) {

        if((req.decoded && config_common.accessRule.pass.indexOf(req.decoded.role)==-1) 
            && config_common.accessRule.pass.indexOf(req.decoded.role)==-1 
            // req.body.role != config_common.user_roles.TRAFFIC_ADMIN
        ){
            return next({dev: '限物流'});
        }
        if(!req.body.line_id){
            return next({dev: 'line_id参数有误'});
        }
        var truckInfo = {}, listOne = {}, driver_verify = [], fruit={lineInfo: {}, relation: {}, assign: {}};
        async.waterfall([
            function (cb) {
                trafficLineSV.getOne({
                    find: {
                        _id: req.body.line_id,
                        // user_id: req.decoded.id,
                        role: {$in: config_common.accessRule.pass},
                        status: config_common.demand_status.effective
                    }
                }, cb);
            },
            function (list, cb) {
                if(!list){
                    return cb({dev: '单据未找到'});
                }
                fruit['lineInfo'] = list;
                //线路找线路
                var lineLink = trafficLineSV.lineLink(list);
                var cond_link = _.extend({}, lineLink.mix, {user_id: {$in : driver_verify}, role: config_common.user_roles.TRAFFIC_DRIVER_PRIVATE, status: config_common.demand_status.effective});
                async.waterfall([
                    function(cb1){
                        //挂靠车辆的
                        extServer.generalFun(req, {
                            source: 'user',
                            db:'Driver_verify',
                            method:'getList',
                            query: {
                                find: {
                                    // company_id: fruit['lineInfo']['company_id']
                                    approve_id: fruit['lineInfo']['user_id']
                                },
                                select: 'user_id'
                            }
                        }, cb1);
                    },
                    function (result, cb1) {
                        if(fruit['lineInfo']['company_id'] && result){
                            driver_verify = _.pluck(result, 'user_id');
                        }
                        //获取推荐线路
                        trafficLineSV.getList({
                            find: _.extend(cond_link, {user_id: {$in : driver_verify}}),
                            sort: {money: 1, time_creation: -1},
                            skip: (req.body.page-1)*config_common.entry_per_page,
                            limit: config_common.entry_per_page,
                            page: req.body.page
                        }, cb1);
                    },
                    function (result, cb1) {
                        fruit['relation'] = result;
                        fruit['relation']['price_min'] =result.lines.length>0 ? result['lines'][0]['money'] : 0;
                        //获取推荐线路
                        trafficLineSV.getList({
                            find: _.extend(cond_link, {user_id: {$in : driver_verify}}),
                            sort: {unmoney: 1, time_creation: -1},
                            skip: (req.body.page-1)*config_common.entry_per_page,
                            limit: config_common.entry_per_page,
                            page: req.body.page
                        }, cb1);
                    },
                    function (result, cb1) {
                        if(result.lines.length>0 && result['lines'][0]['unmoney']<fruit['relation']['price_min']){
                            fruit['relation'] = result;
                            fruit['relation']['price_min'] =result.lines.length>0 ? result['lines'][0]['unmoney'] : 0;
                        }
                        cb1();
                    },
                    function (cb1) {
                        trafficLineSV.getList({
                            find: _.extend(cond_link, {user_id: {$nin : driver_verify}}),
                            sort: {money: 1, time_creation: -1},
                            skip: (1-1)*config_common.entry_per_page,
                            limit: config_common.entry_per_page,
                            page: 1
                        }, cb1);
                    },
                    function(list, cb1){
                        fruit['assign'] = list;
                        fruit['assign']['price_min'] =list.lines.length>0 ? list['lines'][0]['money'] : 0;
                        trafficLineSV.getList({
                            find: _.extend(cond_link, {user_id: {$nin : driver_verify}}),
                            sort: {unmoney: 1, time_creation: -1},
                            skip: (1-1)*config_common.entry_per_page,
                            limit: config_common.entry_per_page,
                            page: 1
                        }, cb1);
                    },
                    function(list, cb1){
                        if(list.lines.length>0 && list['lines'][0]['unmoney']<fruit['assign']['price_min']){
                            fruit['assign'] = list;
                            fruit['assign']['price_min'] =list.lines.length>0 ? list['lines'][0]['unmoney'] : 0;
                        }
                        cb1();
                    }
                ], cb);
            }
        ], function (err, result) {
            if(err){
                return next(err)
            }
            config_common.sendData(req, fruit, next);
        });
    });
    //物流-我的线路-推荐货源 | 获取线路的匹配需求单 和 推荐的需求单 20171205 /:line_id/:role
    //20180523 结果单的数据不要显示
    api.post('/pass_one_trade', function(req, res, next){
        if((req.decoded && config_common.accessRule.pass.indexOf(req.decoded.role)==-1)
            // && req.body.role != config_common.user_roles.TRAFFIC_ADMIN
            && config_common.accessRule.pass.indexOf(req.decoded.role)==-1
        ){
            return next({dev: '限物流'})
        }
        if(!req.body.line_id){
            return next({dev: '线路id无效'});
        }
        req.body.page = req.body.page || 1;
        var cond = {
            _id: req.body.line_id,
            // user_id: req.decoded.id,
            role: {$in: config_common.accessRule.pass},
            status: config_common.demand_status.effective
        }, fruit={lineInfo: {}, relation: {count:0, demands: [], price_max:0}, assign: {count:0, demands: [], price_max:0}}, path_link={}, relation_company=[];
        async.waterfall([
            function (cb) {
                trafficLineSV.getOne({find: cond}, cb)
            }, function (line, cb) {
                if(!line){
                    return cb({dev: '线路未找到'});
                }
                //线路找需求
                path_link = trafficLineSV.linePath(line);//往返线路
                fruit.lineInfo = line;
                //合作企业
                async.waterfall([
                    function (cb1) {
                        //获取合作企业company_id
                        extServer.generalFun(req, {
                            source: 'user',
                            db:'Company_relation',
                            method:'getList',
                            query:{
                                find: {
                                    other_id: fruit['lineInfo']['company_id'] ,//req.decoded.company_id[0],
                                    other_type:'TRAFFIC'
                                },
                                select: 'self_id'
                            }}, cb1);
                    },
                    function (company, cb1) {
                        if(fruit['lineInfo']['company_id'] && company){
                            relation_company = _.pluck(company, 'self_id');
                        }
                        //出发-到达；到达-出发；运输货物
                        trafficDemandSV.getList({
                            find: _.extend({},
                                path_link.mix,
                                {demand_company_id: {$in: relation_company},
                                    time_validity: {$gt: new Date()},
                                    status: config_common.demand_status.effective,
                                    unoffer_list:{$nin: [fruit['lineInfo']['company_id']]}
                                }
                        ),//{verify_company: {$in: [ fruit['lineInfo']['company_id'] ]}}
                            // find: _.extend({}, {demand_company_id: {$in: relation_company}}),
                            skip: (req.body.page-1) * config_common.entry_per_page,
                            limit: req.body.limit || config_common.entry_per_page,
                            sort: {price_max: -1,time_creation: -1},
                            page: req.body.page
                        }, cb1);
                    },
                    function (demand, cb1) {
                        // trafficDemandSV.getAggregate({
                        //     match: _.extend({status: config_common.demand_status.effective}, path_link.mix, {demand_company_id: {$in: relation_company}}, {verify_company: {$in: [ fruit['lineInfo']['company_id'] ]}}),
                        //     // match: _.extend({}, {demand_company_id: {$in: relation_company}}),
                        //     group: {_id: '', average: {$avg: '$price_max'}}}, function (err, price) {
                        //     demand.average_price = price && price.length>0 ? Number(price[0]['average']).toFixed(2):0;
                        //     fruit.relation = demand;
                        //     cb1();
                        // })
                        demand.price_max = demand && demand['demands'].length>0 ? demand['demands'][0].price_max:0;
                        fruit['relation'] = demand;
                        cb1();
                    }
                ], cb);
                //商业智能
            }, function (cb) {
                async.waterfall([
                    function (cb1) {
                    //     trafficDemandSV.getCount(
                    //         _.extend({status: config_common.demand_status.effective}, path_link.mix, {demand_company_id: {$nin: relation_company}}, {platform_company: {$in: [ fruit['lineInfo']['company_id'] ]}}),
                    //         // {},
                    //         cb1);
                    // },
                    // function (count, cb1) {
                    //     if(!count){
                    //         cb();
                    //     }
                    //     fruit['assign']['count'] = count || 0;
                        //出发-到达；到达-出发；运输货物
                        trafficDemandSV.getList({
                            find: _.extend({status: config_common.demand_status.effective}, path_link.mix, {demand_company_id: {$nin: relation_company}}, {platform_company: {$in: [ fruit['lineInfo']['company_id'] ]}}),
                            // find: {},
                            // skip: Math.floor(Math.random() * fruit['assign']['count']),
                            // limit: 1,
                            // sort: {time_creation: -1},
                            // page: 1
                            skip: 0,//(req.body.page-1) * config_common.entry_per_page,
                            limit: req.body.limit || config_common.entry_per_page,
                            sort: {price_max: -1, time_creation: -1},
                            page: 1,//req.body.page
                        }, cb1);
                    },
                    function (demand, cb1) {
                        demand.price_max = demand && demand['demands'].length>0 ? demand['demands'][0].price_max:0;
                        fruit['assign'] = demand;
                        cb1();
                        // fruit['assign']['demands'] = demand.demands || [];
                        // trafficDemandSV.getAggregate({
                        //     match: _.extend({status: config_common.demand_status.effective}, path_link.mix, {demand_company_id: {$nin: relation_company}}, {platform_company: {$in: [ fruit['lineInfo']['company_id'] ]}}),
                        //     group: {_id: '', average: {$avg: '$price_max'}}}, function (err, price) {
                        //
                        //     fruit['assign']['average_price'] = price && price.length>0? Number(price[0]['average']).toFixed(2) : 0;
                        //     cb1();
                        // })
                    }
                ], cb);
            }
        ], function(err, result){
            if(err){
                return next(err);
            }
            config_common.sendData(req, fruit, next)
        });
    });
    //token 解析判断
    api.use(require('../../middlewares/mid_verify_user')());
    /**
     * 增加
     */
    api.post('/add_old', function(req, res, next){
        config_common.sendData(req, {status: 'old_api'}, next);
        //执行操作
        var line={}, startProvince, startCity, startDistrict, endProvince, endCity, endDistrict, priceCond={};
        async.waterfall([
            function(cb){
                //角色判断
                if(config_common.accessRule.pass.indexOf(req.decoded.role)==-1 &&
                    req.decoded.role != config_common.user_roles.TRAFFIC_DRIVER_PRIVATE){
                    return cb({dev: '仅限物流和司机', pro: '000002'});//('not_allow');
                }
                //参数判断
                var checkout_fields = [
                    // {field: 'scene', type:'string'},
                    {field: 'start_province', type:'string'},
                    {field: 'start_city', type:'string'},
                    {field: 'end_province', type:'string'},
                    {field: 'end_city', type:'string'},
                    {field: 'money', type:'number'},
                    {field: 'cargo', type:'array'}
                ];

                config_common.checkField(req, checkout_fields, function (err) {
                    if(err){
                        return cb({dev: err, pro: '000003'});
                    }
                    //场景判断
                    req.body.cargo = _.isObject(req.body.cargo) ? req.body.cargo : JSON.parse(req.body.cargo);
                    if(config_common.accessRule.pass.indexOf(req.decoded.role)>-1){
                        if(req.body.start_province && (
                                !config_common.checkProvince(req.body.start_province) ||
                                !config_common.checkCity(req.body.start_province, req.body.start_city) ||
                                !config_common.checkDistrict(req.body.start_city, req.body.start_district)) &&
                                req.body.end_province && (
                                    !config_common.checkProvince(req.body.end_province) ||
                                    !config_common.checkCity(req.body.end_province, req.body.end_city) ||
                                    !config_common.checkDistrict(req.body.end_city, req.body.end_district)
                            )){
                            return cb({dev: '省市县没找到', pro: '000003'});//('invalid_format');
                        }
                        startProvince = configProvince[req.body.start_province];
                        startCity = configCity[req.body.start_province][req.body.start_city];
                        startDistrict = req.body.start_district ? configDistrict[req.body.start_city][req.body.start_district] : 0;
                        endProvince = configProvince[req.body.end_province];
                        endCity = configCity[req.body.end_province][req.body.end_city];
                        endDistrict = req.body.end_district ? configDistrict[req.body.end_city][req.body.end_district] : 0;
                        cb();
                    }else{
                        cb();
                    }
                });
            },
            function (cb) {
                if((new Date()) > (new Date('2017/12/1'))){
                    priceCond.$or = [{
                        user_id : req.decoded.id,
                        start_province: req.body.start_province,
                        start_city: req.body.start_city,
                        start_district: req.body.start_district || '',
                        end_province: req.body.end_province,
                        end_city: req.body.end_city,
                        end_district: req.body.end_district || ''
                    }, {
                        user_id : req.decoded.id,
                        start_province: req.body.end_province,
                        start_city: req.body.end_city,
                        start_district: req.body.end_district,
                        end_province: req.body.start_province,
                        end_city: req.body.start_city,
                        end_district: req.body.start_district || ''
                    }];
                }

                if(req.decoded.role == config_common.user_roles.TRAFFIC_DRIVER_PRIVATE){
                    //若是司机,必须有车辆才能发布线路
                    extServer.generalFun(req, {
                        source: 'user',
                        db:'Truck',
                        method:'getCount',
                        query:{
                            $or: [{user_id: {$in: [req.decoded.id]}}, {create_user_id: req.decoded.id}]
                        }
                    }, function (err, count) {
                        if(!count){
                            return cb({dev: '请完善车辆信息'});
                        }else{
                            line = {
                                start_province: req.body.start_province,
                                start_city: req.body.start_city,
                                start_district: req.body.start_district,
                                end_province: req.body.end_province || '',
                                end_city: req.body.end_city || '',
                                end_district: req.body.end_district
                            };
                            cb();
                        }
                    })
                }
                else{
                    line = {
                        start_pro_id: req.body.start_province,  //省id
                        start_cit_id: req.body.start_city,      //市id
                        start_dis_id: req.body.start_district,    //区县id
                        end_pro_id: req.body.end_province,  //省id
                        end_cit_id: req.body.end_city,      //市id
                        end_dis_id: req.body.end_district,    //区县id
                        start_province: startProvince.name,
                        start_city: startCity.name,
                        start_district: startDistrict ? startDistrict.name : '',
                        end_province: endProvince.name,
                        end_city: endCity.name,
                        end_district: endDistrict ? endDistrict.name : ''
                    };
                    cb();
                }
            },
            function (cb) {
                line.role = req.decoded.role;
                line.user_id = req.decoded.id;
                line.company_id = config_common.accessRule.pass.indexOf(req.decoded.role)>-1 ? req.decoded.company_id[0] : '';
                //20171120 增加AB,BA的线路查询
                if((new Date()) > (new Date('2017/12/1'))){
                    trafficLinePriceSV.getCount(priceCond, cb)
                }else{
                    trafficLineSV.getCount(line, cb);
                }
            },
            function(count, cb){
                if(count>0){
                    return cb({dev: '线路重复,请选择修改'})
                }
                line.money = req.body.money;
                line.unmoney = req.body.unmoney || 0;
                line.cargo = _.isArray(req.body.cargo) ? req.body.cargo : [];
                line.type = req.body.type;
                line.appendix = req.body.appendix || '';
                line.time_creation = line.time_modify = new Date();
                trafficLineSV.add(line, cb);
            }, function (line, count, cb) {
                if((new Date()) > (new Date('2017/12/1'))){
                    var goTo = _.extend(priceCond['$or'][0], {
                        price: req.body.money,
                        company_id: config_common.accessRule.pass.indexOf(req.decoded.role)>-1 ? req.decoded.company_id[0] : '',
                        type: 'goTo',
                        line_id: line._id.toString()
                    });
                    var goBack = _.extend(priceCond['$or'][1], {
                        price: req.body.unmoney || 0,
                        company_id: config_common.accessRule.pass.indexOf(req.decoded.role)>-1 ? req.decoded.company_id[0] : '',
                        type: 'goBack',
                        line_id: line._id.toString()
                    });
                    trafficLinePriceSV.add(goTo, function () {
                        trafficLinePriceSV.add(goBack, function () {
                            cb(null, line)
                        });
                    });
                }else{
                    cb(null, line)
                }

            }], function(err, result){
                if(err) return next(err);
                config_common.sendData(req, result, next);
        });
    });
    /**
     * 查看单个线路
     */
    api.post('/get_one', function (req, res, next) {
        //权限检查
        //参数判断
        //场景判断
        var cond={}, lineOne;
        if(!req.body.line_id){
            return next({dev: 'line_id参数有误', pro: '000003'});
        }
        //执行操作
        async.waterfall([
            function (cb) {
                trafficLineSV.getOne({find: {_id: req.body.line_id}}, cb);
            }, function (line, cb) {
                extServer.userFind({user_id: line.user_id}, function(err, user){
                    lineOne = _.extend({},JSON.parse(JSON.stringify(line)), user||{});
                    if(req.decoded.id != line.user_id){
                        if(line.view_id.indexOf(req.decoded.id) == -1){
                            line.view_id.push(req.decoded.id);
                        }
                        if(line.view_id.length >=105 && line.demand_count ==0 ){
                            //推送 或发短信
                            // 尊敬的xx总你好，您发布的钢铁报价被5家新的企业查看未下单，请立即登录查看（链接）
                            //5条查看未下单，且注册10天内每天发送一次
                            async.waterfall([
                                function (push) {
                                    var msgObj = {
                                        title: '线路报价提醒',
                                        //尊敬的xx总你好，您发布的钢铁报价被5家新的企业查看未下单，请立即登录查看（链接）
                                        content: config_msg_template.encodeContent('line_view', [
                                            lineOne.user_name,
                                            req.decoded.user_name,
                                            lineOne.view_id.length,
                                            'url'
                                        ]),
                                        user_ids: [line.user_id]
                                    };
                                    extServer.push(req, msgObj, {}, '', {
                                        // params: {id: driverOrder._id.toString(), type: config_common.push_url.driver_order_detail},
                                        // url: config_common.push_url.driver_order_detail
                                    }, push);
                                }
                            ], function () {});
                        }
                        line.save(function () {
                            cb(null, lineOne);
                        });
                    }else{
                        cb(null, lineOne);
                    }
                });
            }
        ],function (err, result) {
            if(err){
                return next(err);
            }
            config_common.sendData(req, result, next);
        });
    });
    //常规操作 分创建者和关注着
    api.post('/get_list', function(req, res, next){
        var cond = {}, tipCond = {} ,relation_cond = {}, relation_list, new_count = 0, lineOne, plan_list = [];
        async.waterfall([
            function (cb) {
                //场景判断
                if(!req.body.scene){
                    return cb({dev: 'scene参数有误', pro: '000003'}); //'invalid_format'
                }
                _.each(['end_province', 'end_city','end_district',
                    'start_province', 'start_city', 'start_district'], function (x) {
                    if(req['body'][x] && _.isString(req['body'][x]) ){
                        try{
                            req['body'][x] = JSON.parse(req['body'][x])
                        }catch(err){
                            return cb({dev: 'error：'+x+'!!!'+err});
                        }

                    }
                });
                cb();
            },
            function (cb) {
                //条件判断
                req.body.page = req.body.page || 1;
                req.body.is_refresh = true; //['true', true, 1, '1'].indexOf(req.body.is_refresh) != -1; //若存在下列刷新，则修改个人查阅时间;
                cond.status = req.body.status || config_common.demand_status.effective;
                if(req.body.scene == 'self'){
                    //角色判断
                    if(config_common.accessRule.pass.indexOf(req.decoded.role)==-1 &&
                        req.decoded.role != config_common.user_roles.TRAFFIC_DRIVER_PRIVATE){
                        return cb({dev: '仅限物流和司机', pro: '000002'}); //'not_allow'
                    }
                    if(req.decoded.role == config_common.user_roles.TRAFFIC_DRIVER_PRIVATE){
                        cond.user_id = req.decoded.id;
                        //线路报价other_company_id 选择用户id,
                        tipCond = {
                            user_id: req.decoded.id,
                            other_company_id: req.decoded.id
                        };
                    }else{
                        // cond.company_id = req.decoded.company_id[0];
                        cond.user_id = req.decoded.id;
                        tipCond = {
                            user_id: req.decoded.id,
                            // company_id: req.decoded.company_id[0],
                            other_company_id: req.decoded.id
                        };
                    }
                    cb();
                }
                if(req.body.scene == 'other'){
                    // tipCond = {
                    //     user_id: req.decoded.id,
                    //     company_id: req.decoded.company_id[0]
                    // };
                    if(req.body.user_id){
                        cond.user_id = req.body.user_id;
                        // tipCond.other_company_id = req.body.user_id;
                        cb();
                    }
                    else if(req.body.company_id){
                        cond.company_id = req.body.company_id;
                        cb();
                        // tipCond.other_company_id = req.body.company_id;
                    }else if(!req.body.group_id){
                        return cb({dev: 'group_id参数无效'});
                    }else{
                        cb();
                    }

                    //查看对方线路的情况: 司机看司机，物流看物流，物流看司机，交易看物流;

                }
                if(req.body.scene == 'relation'){
                    //角色判断
                    if(config_common.accessRule.pass.indexOf(req.decoded.role)==-1 &&
                        req.decoded.role != config_common.user_roles.TRADE_ADMIN &&
                        req.decoded.role != config_common.user_roles.TRADE_SALE &&
                        req.decoded.role != config_common.user_roles.TRADE_PURCHASE){
                        return cb({dev: '仅限交易和物流', pro: '000002'}); //'not_allow'
                    }
                    //司机查物流，物流查司机的关系 ,在没有指定公司或司机的id时的操作
                    if(config_common.accessRule.pass.indexOf(req.decoded.role)>-1){
                        // relation_cond.company_id = req.decoded.company_id[0] || '';
                        relation_cond.approve_id = req.decoded.id;
                    }else{
                        relation_cond.user_id = req.decoded.id;
                    }
                    tipCond = {
                        user_id: req.decoded.id,
                        other_company_id: 'all'
                    };
                    if(config_common.accessRule.pass.indexOf(req.decoded.role)>-1){
                        extServer.generalFun(req, {
                            source: 'user',
                            db:'Driver_verify',
                            method:'getList',
                            query:{
                                find: relation_cond
                            }}, function(err, list){
                            relation_list = list || [];
                            if(config_common.accessRule.pass.indexOf(req.decoded.role)>-1){
                                cond.user_id =  {$in : _.pluck(relation_list, 'user_id')};
                            }
                            cb();
                        });
                    }else{
                        extServer.generalFun(req, {
                            source: 'user',
                            db:'Company_relation',
                            method:'getList',
                            query:{
                                find: {
                                    self_id: req.decoded.company_id,
                                    other_type:'TRAFFIC'
                                },
                                select: 'other_id'
                            }}, function(err, list){
                                relation_list = list || [];
                                cond.company_id =  {$in : _.pluck(relation_list, 'other_id')};

                            cb();
                        });
                    }

                    //若是查看一群人的记录,则查新时间只能记录自己的id和查询时间;
                    
                }

                if(['self','other','relation'].indexOf(req.body.scene) == -1){
                    return cb({dev: 'scene值超出范围', pro: '000003'});
                }
            },
            function (cb) {
                //查询上一次查看时间;
                if(req.body.scene == 'relation'){
                    extServer.tipLinePrice(tipCond, cond, req.body.is_refresh, cb);
                }
                else if(req.body.scene == 'other' && req.body.group_id){
                    extServer.generalFun(req, {
                        source: 'user',
                        db:'Relation_group_user',
                        method:'getList',
                        query:{
                            find: {
                                group_id: req.body.group_id,
                                member_id: {$exists: true},
                                company_id: req.decoded.company_id[0]
                            },
                            select: 'member_id'
                        }}, function (err, members) {
                        if(err){
                            return cb({dev: err});
                        }
                        cond.user_id ={$in: _.pluck(members, 'member_id')};
                        cb(null, null);
                    });

                }else{
                    cb(null, null);
                }
            },
            function(condRes, cb){
                if(condRes){
                    cond.time_modify = {$lt: condRes.update_time};
                    new_count = condRes.count;
                }
                if(req.body.start_province && req.body.start_province.length>0 || req.body.end_province&&req.body.end_province.length>0){
                    cond.$or=config_common.lineSearch(req);
                }
                //执行操作
                trafficLineSV.getList({
                    find: cond,
                    sort: {time_creation: -1},
                    skip: (req.body.page-1)*config_common.entry_per_page,
                    limit: config_common.entry_per_page,
                    page: req.body.page
                }, cb);
                //向线路中增加用户信息
            }, function (lines, cb) {
                lines.new_count = new_count;
              // 判断往返
              if(req.body.start_province || req.body.end_province){
                _.each(lines.lines, function (line) {
                  line['reverse'] = false;// 假定一个值
                  if(req.body.start_province){
                    line['reverse'] = (_.intersection(line.section.concat(line.unsection), config_common.areaCollect(req.body.start_province, req.body.start_city, req.body.start_district))).length >= 1 ? true : false;
                  }
                  if(req.body.end_province && !req.body.start_province){
                    line['reverse'] = (_.intersection(line.end_unsection.concat(line.end_section), config_common.areaCollect(req.body.end_province, req.body.end_city, req.body.end_district))).length >= 1 ? false : true;
                  }
                });
              }

                cb(null, lines);
            }
        ], function (err, result) {
            if(err){
                return next(err);
            }
            config_common.sendData(req, result, next);
        });
    });

    /*
     获取单个记录 20170421
     param demand_id demand_index index_trade scene
     20171120 不允许修改省市县？
     */
    api.post('/edit', function(req, res, next){
        //执行操作
        async.waterfall([
            function(cb){
                //角色判断
                //参数判断
                var checkout_fields = [
                    {field: 'line_id', type:'string'},
                ];
                config_common.checkField(req, checkout_fields, function (err) {
                    if(err){
                        return cb({dev: err, pro: '000003'});
                    }

                    cb();
                });
            },
            function (cb) {
                trafficLineSV.getOne({
                    find: {
                        _id: req.body.line_id,
                        user_id: req.decoded.id
                    }
                }, cb);
            }, function (line, cb) {
                if (!line) {
                    return cb({dev: '线路没找到', pro: '000004'});
                }
                // if(req.body.money && req.body.money != line.money){
                //     line.price_chart.push({
                //         money: line.money,
                //         time_modify: Date.now()
                //     })
                // }
                // if(req.body.unmoney && req.body.unmoney != line.unmoney){
                //   line.un_price_chart.push({
                //     unmoney: line.unmoney,
                //     time_modify: Date.now()
                //   })
                // }
                if(req.body.money || req.body.unmoney){
                  line.price_chart.push({
                    money: line.money,
                    unmoney: line.unmoney,
                    time_modify: Date.now()
                  })
                }
                line.money =req.body.money?req.body.money : line.money;
                line.unmoney = req.body.unmoney ? req.body.unmoney : line.unmoney;
                if(req.body.cargo){
                    line.cargo = req.body.cargo && _.isArray(req.body.cargo) ? req.body.cargo : line.cargo;
                    line.cargo_chn = _.map(line.cargo, function (a) {
                        return config_common.material[a];
                    });
                }

                if(req.body.product_categories){
                    req.body.product_categories = _.isObject(req.body.product_categories) ? req.body.product_categories : JSON.parse(req.body.product_categories);
                    line.product_categories = req.body.product_categories;
                }
                line.appendix = req.body.appendix ? req.body.appendix : line.appendix;
                line.time_modify = new Date();
                line.modify_count =  line.modify_count + 1;
                line.save(cb);
            }], function(err, result){
            if(err) return next(err);
            config_common.sendData(req, result, next);
        });
    });
    //获取数量
    api.post('/get_count', function(req, res, next){
        //角色判断
        //场景判断
        //条件判断
        var cond = {status: config_common.demand_status.effective, type: config_common.line_type.start_end};
        if(req.body.user_id){
            cond.user_id = req.body.user_id;
        }else if(req.body.company_id){
            cond.company_id = req.body.company_id;
        }else{
            return next({dev: '参数有误', pro: '000003'});
        }
        //执行操作
        trafficLineSV.getCount(cond, function(err,result){
            if(err){
                return next(err);
            }
            config_common.sendData(req, result, next);
        });
    });
    //删除
    api.post('/close', function(req, res, next){
        //角色判断 物管，交管，采购
        //场景判断
        
        //条件判断
        if(!req.body.line_id){
            return next({dev: 'line_id参数有误', pro: '000003'});
        }
        var cond = {user_id: req.decoded.id};
        if(req.body.line_id){
            cond._id = req.body.line_id;
        }
        //执行操作
        async.waterfall([
            function(cb){
            //     trafficLineSV.getOne({
            //         find: cond
            //     },cb);
            // }, function (line, cb) {
            //     if(!line){ return cb({dev: '线路没找到' ,pro: '000004'});}
                // line.status = config_common.demand_status.cancelled;
                // line.time_modify = new Date();
                // line.save(cb);
                trafficLineSV.del({_id: req.body.line_id},cb)
            }
        ], function(err, result){
            if(err) return next(err);
            config_common.sendData(req, true, next);
        });
    });
    //特殊操作
    /**
     * 获取线路详情和对该线路的推荐物流需求 20171205 废弃
     */
    api.post('/line_recommend', function (req, res, next) {
        if(config_common.accessRule.pass.indexOf(req.decoded.role)==-1){
            return next({dev: '仅限物流方', pro: '000002'});
        }
        //参数判断
        
        //场景判断
        var cond={};
        req.body.page = req.body.page ? req.body.page : 1;
        if(!req.body.line_id){
            return next({dev: 'line_id参数有误', pro: '000003'});
        }
        //执行操作
        var demandTmp={};
        async.waterfall([
            function (cb) {
                trafficLineSV.getById({find: req.body.line_id, status: config_common.demand_status.effective}, cb);
            }
            ,function (line, cb) {
                if(!line){
                    return cb({dev: '线路没找到', pro: '000004'});
                }
                demandTmp['line'] = line;
                var cond = {
                    send_province: line.start_province,
                    send_city: line.start_city,
                    send_district: line.start_district,
                    receive_province: line.end_province,
                    receive_city: line.end_city,
                    receive_district: line.end_district,
                    status: config_common.demand_status.effective
                };
                trafficDemandSV.getList({
                    find: cond,
                    select: 'user_id company_id price material amount can_join send_province send_city send_district receive_province receive_city receive_district offer_count time_validity',
                    sort: {time_creation: -1},
                    skip: (req.body.page-1)*config_common.entry_per_page,
                    limit: config_common.entry_per_page,
                    page: req.body.page
                }, cb);
            }
            ,function (demandRes, cb) {
                demandTmp['count'] = demandRes.count;
                demandTmp['exist'] = demandRes.exist;
                demandTmp['demands'] = [];
                async.eachSeries(demandRes.demands, function(demand, cb1){
                    async.waterfall([
                        function (cb10) {
                        //   用户名和公司名
                            trafficDemandSV.getDemandUserComp(req, demand, cb10);
                        //    货源数
                        }, function (demand, cb10) {
                            demandOne = demand;
                            trafficDemandSV.getCount({
                                user_id: demand.user_id,
                                status: config_common.demand_status.effective
                            }, cb10);
                        }
                    ], function(err, count){
                        if(!err){
                            demandOne['demand_count'] = count;
                            demandTmp['demands'].push(demandOne);
                        }                        
                        cb1();
                    });
                }, cb);
            }
        ], function (err) {
            if(err) return next(err);
            config_common.sendData(req, demandTmp, next);
        });
    });
    /**
     * 获取司机线路详情和对该线路的推荐司机需求
     */
    api.post('/driver_line_recommend', function (req, res, next) {
        if(req.decoded.role != config_common.user_roles.TRAFFIC_DRIVER_PRIVATE){
            return next({dev: '仅限司机', pro: '000002'});
        }
        //参数判断
        //场景判断
        var cond={};
        req.body.page = req.body.page ? req.body.page : 1;
        if(!req.body.line_id){
            return next({dev: '参数有误', pro: '000003'});
        }
        //执行操作
        var demandTmp={};
        async.waterfall([
            function (cb) {
                trafficLineSV.getOne({
                    find: {
                        _id: req.body.line_id,
                        user_id: req.decoded.id,
                        status: config_common.demand_status.effective,
                    }
                }, cb);
            }
            ,function (line, cb) {
                if(!line){
                    return cb({dev: '线路没找到', pro: '000004'});
                }
                demandTmp['line'] = line;
                var cond = {
                    status: config_common.demand_status.effective
                    // ,platform_driver: {$in: [req.decoded.id]} //20180402 暂停
                };
                //线路找需求
                cond = _.extend(cond, trafficLineSV.linePath(line).mix);
                driverDemandSV.getList({
                    find: cond,
                    // select: 'demand_user_id demand_company_id price material amount can_join send_province send_city send_district receive_province receive_city receive_district offer_count time_validity',
                    sort: {time_creation: -1},
                    skip: (req.body.page-1)*config_common.entry_per_page,
                    limit: config_common.entry_per_page,
                    page: req.body.page
                }, cb);
            }

            ,function (demandRes, cb) {
                demandTmp['count'] = demandRes.count;
                demandTmp['exist'] = demandRes.exist;
                demandTmp['demand'] = [];
                _.each(demandRes.demand, function (a) {
                    a['is_relation'] = false;
                    demandTmp['demand'].push(a);
                });
                cb();
            }
        ], function (err) {
            if(err) return next(err);
            config_common.sendData(req, demandTmp, next);
        });
    });

    /**
     * 获取认证物流公司的线路
     */
    api.post('/get_relation_list', function(req, res, next){
        //角色判断 交易
        // //场景判断
        if(!req.body.scene &&
            !req.body.company_arr &&
            !(_.isArray(req.body.company_arr)) &&
            !req.body.start_province &&
            !req.body.start_city &&
            !req.body.end_province &&
            !req.body.end_city){
            return next({dev: '参数有误', pro: '000002'});
        }
        //条件判断
        var cond = {};
        req.body.page = req.body.page ? req.body.page : 1;
        if(req.body.start_province != 'all'){
            cond.start_province = req.body.start_province;
        }
        if(req.body.start_city != 'all'){
            cond.start_city = req.body.start_city;
        }
        if(req.body.end_province != 'all'){
            cond.end_province = req.body.end_province;
        }
        if(req.body.end_city != 'all'){
            cond.end_city = req.body.end_city;
        }
        cond.status = config_common.demand_status.effective;

        //执行操作.
        var company_arr=req.body.company_arr , line_arr={}, lineOne={};
        async.waterfall([
            // function (cb) {
            //     //    获取认证下的公司列表
            //     extServer.generalFun(req, {
            //         source: 'user',
            //         db:'Company_relation',
            //         method:'getList',
            //         query:{
            //             find: {
            //                 self_user_id: req.decoded.id, //需求方
            //                 self_id: req.decoded.company_id,
            //                 other_type:'TRAFFIC',
            //                 // status: config_common.relation_type.ACCEPT //物流 和交易 之间不存在状态
            //             },
            //             select: 'other_id'
            //         }}, function(err, company){ if(err){return cb(err);} company_arr = util.transObjArrToSigArr(company, 'other_id');});
            // },
            function (cb) {
                cond.company_id = {$in : company_arr};
                trafficLineSV.getList({
                    find: cond,
                    select: 'user_id company_id start_province start_city start_district end_province end_city end_district money',
                    sort: {time_creation: -1},
                    skip: (req.body.page-1)*config_common.entry_per_page,
                    limit: config_common.entry_per_page,
                    page: req.body.page
                }, cb);
            },
            function (lineRes, cb) {
                if(!lineRes){
                    return cb({dev: '线路没找到', pro: '000004'});
                }
                line_arr['exist'] = lineRes.exist;
                line_arr['count'] = lineRes.count;
                line_arr['lines'] = [];
                async.eachSeries(lineRes.lines, function(line, cb1){
                    async.waterfall([
                        function (cb10) {
                            trafficDemandSV.getDemandUserComp(req, line, cb10);
                        }, function (lineRes, cb10) {
                            lineOne = lineRes;
                            trafficLineSV.getCount({user_id: lineRes.user_id, status: config_common.demand_status.effective},cb10);
                        }, function (count, cb10) {
                            lineOne['line_count'] = count || 0;
                            trafficLineSV.getAggregate({
                                match: {user_id: lineOne.user_id, status: config_common.demand_status.effective},
                                group: {_id: '$user_id', num: {$sum: '$order_count'}}
                            }, cb10);
                        }
                    ], function(err, count){
                        lineOne['order_count'] = count[0]['num'] || 0;
                        line_arr['lines'].push(lineOne);
                        cb1();
                    });
                }, cb);
            }
        ], function(err){
            if(err){
                return next(err);
            }
            config_common.sendData(req, line_arr, next);
        });

    });
    /**
     * 获取[非]认证司机 以及相似线路
     * 20180510 增加user_name, 用于搜索某个用户
     */
    api.post('/driver_unrelation_list', function(req, res, next){
        var user_list=[], company_list, cond={role: config_common.user_roles.TRAFFIC_DRIVER_PRIVATE}, result_list=[], area={},
            driver_verify_cond={};
        if(config_common.accessRule.pass.indexOf(req.decoded.role)==-1){
            return next({dev: '限物流'});
        }
        // && !req.body.demand_id
        if(!req.body.order_id &&
            !(req.body.send_province &&req.body.send_city  &&req.body.receive_province &&
            req.body.receive_city &&req.body.send_district && req.body.receive_district )){
            return next({dev: 'order_id参数有误'});
        }
        req.body.page=req.body.page||1;
        async.waterfall([
            function(cb){
                //① 获取物流订单或司机需求单
                if(req.body.order_id){
                    trafficOrderSV.getOne({
                        find: {_id: req.body.order_id}
                    }, cb);
                }else {
                    cb(null, null);
                }
            },
            function(trade, cb) {
                if (trade) {
                    //通过订单或需求单，拼接线路范围
                    area = _.extend({}, trafficLineSV.pathLink(trade).mix);
                } else {
                    area = _.extend({}, trafficLineSV.pathLink({
                        section: config_common.demandAreaCollect(req.body.send_province , req.body.send_city , req.body.send_district),//[req.body.send_province, req.body.send_province + req.body.send_city, req.body.send_province + req.body.send_city + req.body.send_district],
                        end_section: config_common.demandAreaCollect(req.body.receive_province , req.body.receive_city , req.body.receive_district)//[req.body.receive_province, req.body.receive_province + req.body.receive_city, req.body.receive_province + req.body.receive_city + req.body.receive_district]
                    }).mix);
                }
                //选择待指派的司机列表，含用户名搜索
                trafficLineSV.pass_assign_driver_list(req, cb);
            },
            function(user_list, cb){
                cond = _.extend(cond, area);
                if(req.body.verify){
                    //③ 挂靠司机列表
                    cond.user_id = {$in: user_list};
                    cb(null, user_list);
                }else{
                    cond.user_id = req.body.user_name ? {$in: user_list} : {$nin: user_list};
                    // cond.user_id = {$nin: user_list};
                    //③ 获取相似线路的非挂靠司机
                    trafficLineSV.onlyList({
                        find: cond
                        ,select: 'user_id'
                    }, function (err, lines) {
                        if(lines){
                            cb(null, _.compact(_.uniq(_.pluck(lines, 'user_id'))));
                        }else{
                            cb(null, []);
                        }
                    });
                }
            },
            function (drivers, cb) {
                //driver 是筛选之后的挂靠司机列表
                async.eachSeries(_.uniq(drivers), function(user, cb1){
                    var user_obj = {user_id: user};
                    //获取用户信息和线路信息
                    async.waterfall([
                        function(cb10){
                            extServer.driverUser(user_obj, cb10, req);
                        },
                        function(user, cb10){
                          // 只推送给开启推荐的司机 仅限制平台推荐的位置
                            if(user.phone && user.truck_id && (req.body.verify || user.recommend)){
                                user_obj = user;
                                cond.user_id = user._id;
                                cond.status = config_common.demand_status.effective;
                                trafficLineSV.onlyList({
                                    find: cond
                                }, function (err, lines) {
                                    user_obj['lines'] = lines || [];
                                    result_list.push(user_obj);
                                    cb10();
                                });
                            }else{
                                cb1();
                            }
                        }
                    ], cb1)
                }, cb);
            }
        ], function (err, result) {
            if(err){
                return next(err);
            }
            config_common.sendData(req, result_list, next);
        });
    });
    /**
     *  依据司机需求单获取其他挂靠司机列表
     *  scene: 'replace'
     */
    api.post('/continue_assign_driver', function(req, res, next){
        var user_list, cond={role: config_common.user_roles.TRAFFIC_DRIVER_PRIVATE}, area={}, result_list=[], driverDemand;
        if(config_common.accessRule.pass.indexOf(req.decoded.role)==-1){
            return next({dev: '限物流'});
        }
        async.waterfall([
            function(cb){
                if(!req.body.demand_id){
                    return cb({dev:'demand_id不存在'});
                }
                cb();
            }, function (cb) {
                driverDemandSV.getOne({
                    find: {_id: req.body.demand_id}
                }, cb);
            },
            function(demand, cb) {
                if (!demand) {
                    return cb({dev: '需求单未找到'});
                }
                driverDemand = demand;
                //需求找线路
                area = trafficLineSV.pathLink(driverDemand).mix;
                cond = _.extend(cond, area);
                trafficLineSV.pass_assign_driver_list(req, cb);
            },function(user_list, cb){
                if(req.body.verify){
                    //③ 挂靠司机列表
                    cond.user_id = {$in: user_list};
                    cb(null, user_list);
                }else{
                    cond.user_id = req.body.user_name ? {$in: user_list} : {$nin: user_list};
                    //③ 获取相似线路的非挂靠司机
                    trafficLineSV.onlyList({
                        find: cond
                        ,select: 'user_id'
                    }, function (err, lines) {
                        if(lines){
                            cb(null, _.compact(_.uniq(_.pluck(lines, 'user_id'))));
                        }else{
                            cb(null, []);
                        }
                    });
                }
            }, function(user_list, cb){
                var old_user_list = _.union(driverDemand.verify_driver, driverDemand.unoffer_list);
                if(req.body.scene == 'replace'){
                   user_list = _.difference(user_list, driverDemand.unoffer_list); //_.difference(user_list, old_user_list);
                }

                async.eachSeries(user_list, function(user, cb1){
                    var user_obj = {user_id: user};
                    //获取用户信息和线路信息
                    async.waterfall([
                        function(cb10){
                            extServer.driverUser(user_obj, cb10, req)
                        }, function(user, cb10){
                            if(user.phone && user.truck_id){
                                user_obj = user;
                                cond.user_id = user._id;
                                user_obj['is_select'] = old_user_list.indexOf(user_obj._id) == -1 ? false : true; //标注已被选择
                                cond = _.extend(cond, area);
                                cond.status = config_common.demand_status.effective;
                                trafficLineSV.onlyList({
                                    find: cond
                                }, function (err, lines) {
                                    user_obj['lines'] = lines;
                                    result_list.push(user_obj);
                                    cb10();
                                });
                            }else{
                                cb1();
                            }
                        }
                    ], cb1)
                }, cb);
            }
        ], function (err, result) {
            if(err){
                return next(err);
            }
            config_common.sendData(req, result_list, next);
        });
    });
    /**
     * 获取[非]认证的公司及相似线路
     */
    api.post('/traffic_unrelation_list', function(req, res, next){
        //获取交易订单中的省市县 获取省市县
        //获取相似省市的， 行业类别, 非认证的司机id，线路列表；
        //获取司机当前状态
        var company_role = req.decoded.role.split('_')[0], user_list=[], company_list=[],
            cond={role: {$in: config_common.accessRule.pass}, status:config_common.demand_status.effective}, area={}, result_list=[], line_count=0;
        var section=[],end_section=[];
        if(company_role != config_common.company_category.TRADE){
            return next({dev: '限交易'});
        }
        async.waterfall([
            function(cb){
                    if(!req.body.start_province || !req.body.start_city || !req.body.end_province || !req.body.end_city){
                        return cb({dev: '参数有误'})
                    }
                    cb(null, false);
            },
            function(trade, cb){
                    section= config_common.demandAreaCollect(req.body.start_province, req.body.start_city, req.body.start_district), //[req.body.start_province, req.body.start_province+req.body.start_city],
                    end_section= config_common.demandAreaCollect(req.body.end_province, req.body.end_city, req.body.end_district), //[req.body.end_province, req.body.end_province+req.body.end_city],
                    area = (trafficLineSV.pathLink({
                        section: section,
                        end_section: end_section
                    })).mix;
                //获取认证物流
                extServer.generalFun(req, {
                    source: 'user',
                    db:'Company_relation',
                    method:'getList',
                    query:{
                        find: {
                            self_id: req.decoded.company_id,
                            other_type:'TRAFFIC'
                        },
                        select: 'other_id'
                    }}, cb);
            }, 
            function(verifys, cb) {
                
                if (verifys) {
                    company_list = _.pluck(verifys, 'other_id');
                }
                cond = _.extend(cond, area);
               if(!!req.body.verify){
                   cond.company_id = {$in: company_list}; //若某公司未发布过线路，则在线面的过程中不会被查询到！
                   cb(null, company_list);
               }else{
                   cond.company_id = {$nin: company_list};
                   //平台推荐，获取非认证企业 和 相似线路 的一家 或多家公司
                   async.waterfall([
                       function(cb1){
                           //获取当前公司的身份
                           extServer.generalFun(req, {
                               source: 'user',
                               db: 'Company_trade',
                               method: 'getList',
                               query: {find: {_id: req.decoded.company_id}, select: 'vip package_name'}
                           }, cb1);
                       },
                       function(company, cb1){
                           //获取非认证企业和相似线路
                           trafficLineSV.onlyList({
                               find: cond
                               ,select: 'user_id company_id'
                           }, function (err, lines) {
                               if(!lines || lines.length==0){
                                   cb1(null, []);
                               }
                               lines = _.compact(_.uniq(_.pluck(lines, 'company_id')));
                               line_count = lines.length;
                               if(!!req.body.verify){
                                   cb1(null, lines);
                               } else if(company && company.vip && company.package_name == req.body.package_name){
                                   cb1(null, lines);
                               }else if(company && company.package_name != req.body.package_name ){
                                   cb1(null, [ lines[Math.floor(Math.random() * line_count)] ]);
                               }else{
                                   cb1(null, []);
                               }
                           });
                       }
                   ], cb);
               }                
            },
            function(lines, cb){
                async.eachSeries(lines, function(line, cb1){
                    if(!line){
                       return cb1();
                    }
                    var user_obj = {company_id: line};
                    //获取用户信息和线路信息
                    async.waterfall([
                        function(cb10){
                            extServer.companyGetUser(user_obj, cb10)
                        },
                        function (user, cb10) {
                            if(!user){
                                return cb1();
                            }
                            //线路数，抢单数 {company_id: user.company_id}
                            trafficLineSV.getCount({company_id: user.company_id}, function (err, count) {
                                user['line_count'] = count || 0;
                                cb10(null, user);
                            });
                        },
                        function (user, cb10) {
                          driverDemandSV.getCount({demand_company_id: user.company_id}, function (err, count) {
                              user['driver_demand_count'] = count || 0;
                              cb10(null, user);
                          })
                        },
                        function(user, cb10) {
                            user_obj = _.extend(user_obj, user);
                            cond.company_id = user_obj.company_id;
                            cond.status = config_common.demand_status.effective;
                            cond = _.extend(cond, area);
                            //查询公司下员工是否有开启推荐的用户
                            extServer.generalFun(req, {
                                source: 'user',
                                db:'User_traffic',
                                method:'getList',
                                query:{
                                    find: {
                                        company_id: {$in: [line]},
                                        role: {$in: config_common.accessRule.pass},
                                        recommend:true
                                    }
                                }}, cb10);
                        }, function(recommend_users, cb10){
                            if(recommend_users){
                                cond.user_id = {$in: _.pluck(recommend_users, '_id')}
                            }
                            trafficLineSV.getOne({
                                find: cond
                            }, function (err, lines) {
                                user_obj['lines'] = lines ? [lines] : [];//计算lines的相似比例
                                if(user_obj['lines'].length>0){
                                    _.each(user_obj['lines'], function (line) {
                                        //近似率
                                        line['similar_rate'] = config_common.lineSimilarProbability([section, end_section], [line.section,line.end_section]);
                                        line['similar_rate'] = line['similar_rate']>1 ? 1 : line['similar_rate'];
                                        //往返的方向
                                        line['direction'] = config_common.judgeDirection([req.body.start_province,req.body.start_city,req.body.start_district],line.section);
                                    });
                                }
                                user_obj['line_company_count'] = line_count;//相似线路数
                                if( recommend_users || !!req.body.verify ||recommend_users.length>0){
                                    result_list.push(user_obj);
                                }
                                cb10();
                            });
                        }
                    ], cb1)
                }, cb);
            }
        ], function (err, result) {
            if(err){
                return next(err);
            }
            config_common.sendData(req,result_list, next);
        });
    });

    /**
     *  依据物流需求单获取其他合作企业列表
     */
    api.post('/continue_assign_company', function(req, res, next){
        //获取交易订单中的省市县 获取省市县
        //获取相似省市的， 行业类别, 非认证的司机id，线路列表；
        //获取司机当前状态
        var company_role = req.decoded.role.split('_')[0], trafficDemand, user_list, company_list, cond={role: {$in: config_common.accessRule.pass}}, area={}, result_list=[];
        if(company_role != config_common.company_category.TRADE){
            return next({dev: '限交易'});
        }
        if(!req.body.demand_id){
            return next({dev:'demand_id不存在'});
        }
        async.waterfall([
            function(cb){
                trafficDemandSV.getOne({
                  find: {_id: req.body.demand_id}
                }, cb);  
            },
            function(demand, cb){
                if(!demand){
                    return cb({dev: '交易订单未找到'});
                }
                trafficDemand = demand;
                //需求单找线路
                area = (trafficLineSV.pathLink(trafficDemand)).mix;
                //获取认证物流
                extServer.generalFun(req, {
                    source: 'user',
                    db:'Company_relation',
                    method:'getList',
                    query:{
                        find: {
                            self_id: req.decoded.company_id,
                            other_type:'TRAFFIC'
                        },
                        select: 'other_id'
                    }}, cb);

            },
            function(verifys, cb){
                if(verifys){
                    company_list = _.pluck(verifys, 'other_id');
                }
                var old_company_list = _.union([], trafficDemand.verify_company, trafficDemand.unoffer_list);
                // company_list = _.difference(company_list, old_company_list);
                async.eachSeries(company_list, function(user, cb1){
                    var user_obj = {company_id: user};
                    user_obj['is_select'] = old_company_list.indexOf(user) == -1 ? false: true; //标注已选企业
                    //获取用户信息和线路信息
                    async.waterfall([
                        function(cb10){
                            extServer.companyGetUser(user_obj, cb10)
                        },
                        function (user, cb10) {
                            //线路数，抢单数
                            trafficLineSV.getCount({company_id: user.company_id}, function (err, count) {
                                user['line_count'] = count || 0;
                                cb10(null, user);
                            });
                        },
                        function (user, cb10) {
                            driverDemandSV.getCount({demand_company_id: user.company_id}, function (err, count) {
                                user['driver_demand_count'] = count || 0;
                                cb10(null, user);
                            })
                        },
                        function(user, cb10){
                            user_obj = _.extend(user_obj, user);
                            cond.company_id = user_obj.company_id;
                            cond.status = config_common.demand_status.effective;
                            cond = _.extend(cond, area);
                            trafficLineSV.onlyList({
                                find: cond
                            }, function (err, lines) {
                                user_obj['lines'] = lines || [];
                                result_list.push(user_obj);
                                cb10();
                            });
                        }
                    ], cb1)
                }, cb);
            }
        ], function (err, result) {
            if(err){
                return next(err);
            }
            config_common.sendData(req, result_list, next);
        });
    });

    /**
     * 指派司机列表,按价格排序
     */
    api.post('/assign_driver_list', function (req, res, next) {
        async.waterfall([
            function(){
                // 假设（一条线路不会同时出现回城和去城，一个人不会发布重复AB||BA线路）, 若出现省市相同，则查询线路报价时就出现多条；
                // ① 获取挂靠司机列表;
                // ② 获取去城线路 列表 生成排序字段和去程标识
                // ③ 获取回城线路 列表 生成排序字段和回城标识
                // ④ 线路价格排序


            }
        ], function(err, result){
            if(err){
                return next(err);
            }
            config_common.sendData(req, result, next);
        })
    });

    /**
     * 物流|司机 发布线路报价 市县可以多选 20171205
     */
    api.post('/multi_add', function(req, res, next){

        //执行操作 假设只有最低一层是多选，最上一层都是单选
        var line={}, start_list=[], end_list=[], multi_list=[];
        // req.body = {
        //     start_province:['辽宁'],
        //     start_city:[],
        //     start_district:[],
        //     end_province:['陕西'],
        //     end_city:[],
        //     end_district:[],
        //     cargo:[]
        // }
        async.waterfall([
            function(cb){
                //角色判断
              // if(config_common.accessRule.pass.indexOf(req.decoded.role) > -1 && req.decoded.company_id && req.decoded.company_id.length==0){
              //   return cb({dev: '没有公司信息'})
              // }
                //参数判断

                var checkout_fields = [
                    {field: 'start_province', type:'array'},
                    {field: 'start_city', type:'array'},
                    {field: 'start_district', type:'array'},
                    {field: 'end_province', type:'array'},
                    {field: 'end_city', type:'array'},
                    {field: 'end_district', type:'array'},
                    // {field: 'cargo', type:'array'}
                ];
                // _.each(['start_province','start_city','end_province','end_city',], function (x) {
                //     _.map(req.body[x], function(a){
                //         return (a.replace('市', '')).replace('省', '');
                //     })
                // })
                config_common.checkField(req, checkout_fields, function (err) {
                    if(err){
                        return cb({dev: err+'参数错误', pro: '000003'});
                    }
                    var flag=true;
                    _.each(['start_province','start_city','start_district','end_province','end_city','end_district'], function(a){
                        _.each(req.body[a], function (b) {
                            //若不是字符串则返回错误
                            if(!_.isString(b)){
                                flag=false;
                            }
                        });
                    });

                    //场景判断
                    // req.body.cargo = _.isObject(req.body.cargo) ? req.body.cargo : JSON.parse(req.body.cargo);
                    if(req.body.product_categories){
                        req.body.product_categories = _.isObject(req.body.product_categories) ? req.body.product_categories : JSON.parse(req.body.product_categories);
                    }
                    if(
                        req.body.start_province.length==1 && req.body.start_city.length==0
                        || req.body.end_province.length==1 && req.body.end_city.length==0
                        || req.body.start_province.length==1 && req.body.start_city.length==1 && req.body.start_district.length==0
                        || req.body.end_province.length==1 && req.body.end_city.length==1 && req.body.end_district.length==0
                    ){
                        return cb({dev: '最后一级区域不能设置为空'})
                    }
                    if(flag){
                        cb();
                    }else{
                        cb({dev: '参数错误'})
                    }

                });
            },
            function (cb) {
              // 判断省 市 县的 合理性;
              line.role = req.decoded.role;
              line.user_id = req.decoded.id;
              line.company_id = config_common.accessRule.pass.indexOf(req.decoded.role) > -1 ? req.decoded.company_id[0] : '';
              if (req.body.money) {
                line.money = req.body.money;
              }
              if (req.body.unmoney) {
                line.unmoney = req.body.unmoney;
              }
              if (req.body.cargo) {
                line.cargo = _.isArray(req.body.cargo) ? req.body.cargo : [];
                if(req.body.cargo.length>0){
                  line.cargo_chn = _.map(line.cargo, function (a) {
                    return config_common.material[a];
                  });
                }else{
                  line.cargo_chn=[];
                }
              }

              if (req.body.product_categories) {
                line.product_categories = req.body.product_categories;
              }
              line.product_categories = req.body.product_categories;
              line.appendix = req.body.appendix || '';
              line.time_creation = line.time_modify = new Date();
              //出发地
              line.start_province = req.body.start_province[0];
              line.start_city = req.body.start_city;
              line.start_district = req.body.start_district;
              //到达地
              line.end_province = req.body.end_province[0];
              line.end_city = req.body.end_city;
              line.end_district = req.body.end_district;
              line.admin_id = req.decoded.admin_id;
              // var start_area = config_common.areaCollect(line.start_province, line.start_city, line.start_district);
              // var end_area = config_common.areaCollect(line.end_province, line.end_city, line.end_district);
              // line.section = _.union([], start_area, end_area);
              line.section = config_common.areaCollect([line.start_province], line.start_city, line.start_district);
              line.end_section = config_common.areaCollect([line.end_province], line.end_city, line.end_district);
              //被包含区域
              line.unsection = config_common.unAreaCollect([line.start_province], line.start_city, line.start_district);
              line.end_unsection = config_common.unAreaCollect([line.end_province], line.end_city, line.end_district);
              trafficLineSV.getOne({
                find: {
                  user_id: req.decoded.id,
                  section: line.section,
                  end_section: line.end_section
                }
              }, cb);
            },function(rsLine, cb){
                if(rsLine){
                  //只改变价格
                  if(line.product_categories){
                    rsLine.product_categories =line.product_categories;
                  }
                  rsLine.cargo = line.cargo && line.cargo.length>0?line.cargo : [];

                  rsLine.cargo_chn = line.cargo_chn && line.cargo_chn.length>0? line.cargo_chn : [];
                  rsLine.company_id = config_common.accessRule.pass.indexOf(req.decoded.role) > -1 ? req.decoded.company_id[0] : '';
                  if (line.money) {
                    rsLine.money=line.money;
                  }
                  if (line.unmoney) {
                    rsLine.unmoney=line.unmoney;
                  }
                  rsLine.save(cb)
                }else{
                  trafficLineSV.add(line, cb);
                }

            }
        ], function(err, result){
            if(err) return next(err);
            config_common.sendData(req, result, next);
        });
    });

    //物流-我的线路 | 线路列表中，增加推荐货源数，均价X 20171205
    //20180523 结果单的数据不能显示
    api.post('/pass_list_demand', function(req, res, next){
        if(config_common.accessRule.pass.indexOf(req.decoded.role)==-1){
            return next({dev: '限物流'})
        }
        var cond = {
            user_id: req.decoded.id,
            role: {$in: config_common.accessRule.pass},
            status: config_common.demand_status.effective
        }, plan_list = [], demand_cond={platform_company:{$in: req.decoded.company_id}};
        req.body.page = req.body.page ||1;
        async.waterfall([
            function(cb){
                //获取合作企业company_id
                extServer.generalFun(req, {
                    source: 'user',
                    db:'Company_relation',
                    method:'getList',
                    query:{
                        find: {
                            other_id: {$in: req.decoded.company_id},
                            other_type:'TRAFFIC'
                        },
                        select: 'self_id'
                    }}, cb);
            },
            function (company, cb) {
                if(company){
                    //不包含合作企业且被平台推荐的
                    demand_cond = _.extend(demand_cond, {demand_company_id: {$nin: _.pluck(company, 'self_id')}});
                }
                if(req.body.start_province&&req.body.start_province.length>0 || req.body.end_province&&req.body.end_province.length>0){
                    cond.$or=config_common.lineSearch(req);
                }
                //执行操作
                trafficLineSV.getList({
                    find: cond,
                    sort: {time_creation: -1},
                    skip: (req.body.page-1)*config_common.entry_per_page,
                    limit: config_common.entry_per_page,
                    page: req.body.page
                }, cb);
            },
            function (lines, cb) {
                async.eachSeries(lines.lines, function (line, cb1) {
                    var lineOne = line;
                    //线路查需求
                    var path_link = trafficLineSV.linePath(lineOne);
                    async.waterfall([
                        function (cb10) {
                            //去程
                            trafficDemandSV.getCount(
                                _.extend({status: config_common.demand_status.effective}, demand_cond, path_link.mix), cb10);
                        },
                        function (count, cb10) {
                            //回程
                            lineOne.assign_demand = count;
                            trafficDemandSV.onlyList({
                                find:
                                    _.extend({status: config_common.demand_status.effective}, demand_cond, path_link.mix),
                                skip: 0,
                                limit: 5,
                                page: 1,
                                sort: {'price_max': -1}
                            }, cb10);
                        },
                        function (demands, cb10) {
                            lineOne.price_max=demands&& demands[0] ? demands[0].price_max : 0;
                            
                            if(demands&& demands[0]){
                                //可用车辆，线路找线路
                                var pass_link_cond=trafficLineSV.pathLink(demands[0]).mix;//20180531 线路查询修改为需求查
                                async.waterfall([
                                    function(cb100){
                                        //获取挂靠司机
                                        extServer.generalFun(req, {
                                            source: 'user',
                                            db:'Driver_verify',
                                            method:'getList',
                                            query:{
                                                // find: {company_id: {$in: req.decoded.company_id}} //req.decoded.company_id[0]}
                                                find: {approve_id: req.decoded.id} //req.decoded.company_id[0]}
                                            }}, cb100);
                                    }, function(list, cb100){

                                        // trafficLineSV.getCount(
                                        //     _.extend(pass_link_cond, {
                                        //         user_id: {$nin: _.pluck(list, 'user_id')},
                                        //         role: config_common.user_roles.TRAFFIC_DRIVER_PRIVATE
                                        //         , status: config_common.demand_status.effective}
                                        //     ), function (x,count) {
                                        trafficLineSV.onlyList({
                                            find: _.extend(pass_link_cond, {
                                                        user_id: {$nin: _.pluck(list, 'user_id')},
                                                        role: config_common.user_roles.TRAFFIC_DRIVER_PRIVATE
                                                        , status: config_common.demand_status.effective}
                                                    )
                                        }, function(x,y){
                                                cb100(null, (_.uniq(_.pluck(y, 'user_id'))).length+(_.uniq(_.pluck(list, 'user_id'))).length)
                                            });
                                    }
                                ], function (x,count) {
                                    lineOne.usable_driver=count;// 挂靠司机和相似线路的非挂靠司机
                                    plan_list.push(lineOne);
                                    cb10();
                                });
                            }else{
                                lineOne.usable_driver=0;// 挂靠司机和相似线路的非挂靠司机
                                plan_list.push(lineOne);
                                cb10();
                            }
                            
                        }
                    ], cb1);
                }, function (err) {
                    if(err){
                        return cb(err);
                    }
                    lines.lines = plan_list;
                    cb(null, lines);
                });
            }
        ], function (err, result) {
            if(err){
                return next(err);
            }
            config_common.sendData(req, result, next);
        });
    });

    //司机-线路推荐货源数 均价X 20180521
    api.post('/driver_list_demand', function(req, res, next){
        if(req.decoded.role != config_common.user_roles.TRAFFIC_DRIVER_PRIVATE){
            return next({dev: '限司机'})
        }
        var cond = {
            user_id: req.decoded.id,
            role: config_common.user_roles.TRAFFIC_DRIVER_PRIVATE,
            status: config_common.demand_status.effective
        }, plan_list = [];
        async.waterfall([
            function(cb){
                //执行操作
                trafficLineSV.getList({
                    find: cond,
                    sort: {time_creation: -1},
                    skip: (req.body.page-1)*config_common.entry_per_page,
                    limit: config_common.entry_per_page,
                    page: req.body.page
                }, cb);
            },
            function (lines, cb) {
                async.eachSeries(lines.lines, function (line, cb1) {
                    var lineOne = line;
                    //线路查需求
                    var path_link = trafficLineSV.linePath(lineOne);
                    async.waterfall([
                        function (cb10) {//去程
                            driverDemandSV.getCount(_.extend({status: config_common.demand_status.effective}, path_link.mix, {plan_driver: {$in: [req.decoded.id]}}), cb10);
                        },
                        function (count, cb10) {
                            //回程
                            lineOne.assign_demand = count;
                            //去程
                            driverDemandSV.onlyList({
                                find: _.extend({status: config_common.demand_status.effective}, path_link.goto, {plan_driver: {$in: [req.decoded.id]}})}, cb10);
                        },
                        function (demand, cb10) {
                            lineOne.goToPrice = config_common.getAveragePrice(demand, 'price_max');
                            driverDemandSV.onlyList({
                                find: _.extend({status: config_common.demand_status.effective}, path_link.goback, {plan_driver: {$in: [req.decoded.id]}})
                            }, cb10);
                        },
                        function (demand, cb10) {
                            lineOne.goBackPrice = config_common.getAveragePrice(demand, 'price_max');
                            plan_list.push(lineOne);
                            cb10();
                        }
                    ], cb1);
                }, function (err) {
                    if(err){
                        return cb(err);
                    }
                    lines.lines = plan_list;
                    cb(null, lines);
                });
            }
        ], function (err, result) {
            if(err){
                return next(err);
            }
            config_common.sendData(req, result, next);
        });
    });
    /**
     *司机方查看线路推荐
     * 查询与线路相似的需求单，且需满足 “指派”或“平台推荐”的
     */
    api.post('/driver_one_pass', function(req, res, next){
        if(req.decoded.role != config_common.user_roles.TRAFFIC_DRIVER_PRIVATE){
            return next({dev: '限司机'})
        }
        if(!req.body.line_id){
            return next({dev: '线路id无效'});
        }
        req.body.page = req.body.page || 1;
        var cond = {
            _id: req.body.line_id,
            user_id: req.decoded.id,
            role: config_common.user_roles.TRAFFIC_DRIVER_PRIVATE
        }, fruit={lineInfo: {}, relation: {"count": 0,
            "demand": [],
            "exist": false,
            "mp3_arr": [],
            "average_price": 0}, assign: {"count": 0,
            "demand": [],
            "exist": false,
            "mp3_arr": [],
            "average_price": 0}}, path_link={}, relation_company=[];
        async.waterfall([
            function (cb) {
                trafficLineSV.getOne({find: cond}, cb)
            }, function (line, cb) {
                if(!line){
                    return cb({dev: '线路未找到'});
                }
                //线路查需求
                path_link = trafficLineSV.linePath(line);//往返线路
                fruit.lineInfo = line;
                //合作企业
                async.waterfall([
                    function (cb1) {
                        //获取合作企业company_id
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
                        //出发-到达；到达-出发；运输货物
                        driverDemandSV.getList({
                            find: _.extend(
                                {status: config_common.demand_status.effective},
                                path_link.mix,
                                {demand_company_id: {$in: relation_company}}
                            ),
                            skip: (req.body.page-1) * config_common.entry_per_page,
                            limit: req.body.limit || config_common.entry_per_page,
                            sort: {time_creation: -1},
                            page: req.body.page
                        }, cb1);
                    },
                    function (demand, cb1) {
                        driverDemandSV.getAggregate({
                            match: _.extend({status: config_common.demand_status.effective}, path_link.mix, {demand_company_id: {$in: relation_company}}),
                            group: {_id: '', average: {$avg: '$price'}}}, function (err, price) {
                            demand.average_price = price && price.length>0 ? Number(price[0]['average']).toFixed(2) : 0;
                            fruit.relation = demand;
                            cb1();
                        })
                    }
                ], cb);
                //商业智能
            }, function (cb) {
                async.waterfall([
                    function (cb1) {
                        driverDemandSV.getCount(
                            _.extend(
                                {status: config_common.demand_status.effective},
                                path_link.mix,
                                {demand_company_id: {$nin: relation_company}}
                                ,{plan_driver: {$in: [req.decoded.id]}}
                            ), cb1);
                    },
                    function (count, cb1) {
                        if(!count){
                            cb();
                        }
                        fruit['assign']['count'] = count;
                        //出发-到达；到达-出发；运输货物
                        driverDemandSV.getList({
                            find: _.extend(
                                {status: config_common.demand_status.effective},
                                path_link.mix,
                                {demand_company_id: {$nin: relation_company}}
                                ,{plan_driver: {$in: [req.decoded.id]}}
                            ),
                            skip: (req.body.page-1) * config_common.entry_per_page,
                            limit: req.body.limit || config_common.entry_per_page,
                            sort: {time_creation: -1},
                            page: req.body.page
                            // limit: 1,
                            // sort: {time_creation: -1},
                            // page: 1
                        }, cb1);
                    },
                    function (demand, cb1) {
                        fruit['assign']['demand'] = demand.demand || [];
                        driverDemandSV.getAggregate({
                            match: _.extend(
                                {status: config_common.demand_status.effective},
                                path_link.mix,
                                {demand_company_id: {$nin: relation_company}},
                                {plan_driver: {$in: [req.decoded.id]}}
                            ),
                            group: {_id: '', average: {$avg: '$price'}}}, function (err, price) {
                            fruit['assign']['average_price'] = price && price.length>0 ? Number(price[0]['average']).toFixed(2):0;
                            cb1();
                        })
                    }
                ], cb);
            }
        ], function(err, result){
            if(err){
                return next(err);
            }
            config_common.sendData(req, fruit, next)
        });
    });
    //依据线路查询需求单价格和线路价格
    api.post('/driver_line_price', function(req, res, next){
        if(req.decoded.role != config_common.user_roles.TRAFFIC_DRIVER_PRIVATE && config_common.accessRule.pass.indexOf(req.decoded.role)==-1){
            return next({dev: '限物流和司机操作'});
        }
        if(!req.body.demand_id){
            return next({dev: 'demand_id参数有误'});
        }
        var result_line = {
            demand_price: 0,
            goto_price: 0,
            goback_price: 0,
            line: []
        }, area={status: config_common.demand_status.effective}, demandOne;
        var similar_rate_value=0;

        async.waterfall([
            function (cb) {
                driverDemandSV.getOne({find: {_id: req.body.demand_id}}, function(err, demand){
                    if(demand){
                        cb(null, demand)
                    }else{
                        trafficDemandSV.getOne({find: {_id: req.body.demand_id}}, cb);
                    }
                });
            }, function (demand, cb) {
                if(!demand){
                    return cb({dev: '单据没找到'});
                }
                demandOne=demand;
                result_line['demand_price'] = config_common.accessRule.pass.indexOf(req.decoded.role)==-1 ? demand.price : config_common.rscDecimal('div', demand.price_total, demand.amount, 2);
                //需求单找线路
                area = (trafficLineSV.pathLink(demand)).mix;
                //司机查看线路价格
                area['user_id'] = req.decoded.id;
                area['role'] = req.decoded.role;
                trafficLineSV.onlyList({
                    find: area
                    // find: {}
                }, cb);
            },
            // function (lines, cb) {
            // //相似度匹配
            //     async.eachSeries(lines, function(line, cb1){
            //
            //         var tmp_similar= config_common.lineSimilarProbability([demandOne.section, demandOne.end_section], [line.section,line.end_section]);
            //         tmp_similar = tmp_similar>1 ? 1 : tmp_similar;
            //         if(tmp_similar>similar_rate_value){
            //             result_line['line'] = [line];
            //         }
            //         cb1();
            //     }, cb);
            // }
        ], function (err, line) {

            if(err){
                return next(err);
            }
            if(line && line.length>0){
                // result_line['goto_price'] = line.money;
                // result_line['goback_price'] = line.unmoney;
              //判断是否去程; line.section > demandOne.section  是否有交集
                result_line['line'] = line;


            }
            // result_line['area'] = area;
            config_common.sendData(req, result_line, next);
        });
        
    });

    //交易查看智能推荐的物流线路
    api.post('/trade_recommend_line', function(req, res, next){
        var recommend_count = 10,//20180522 更新 3-10, //推荐数
            base_time = (new Date()).getHours() >= 10 ? true : false, //判断当前时间是否超过10点
            cond = {role: {$in: config_common.accessRule.pass}}, //查询线路的条件
            condSection = []; //存放搜索地域
        if(req.decoded.role.indexOf('TRADE') == -1){
            return next({dev: '限交易'});
        }
        req.body.page = 1;
        async.waterfall([
            function (cb) {
                extServer.generalFun(req, {
                    source: 'admin',
                    db: 'PushCount',
                    method:'getOne',
                    query:{
                        find: {user_id: req.decoded.id}, //req.decoded.id}, //
                    }
                }, function (err, result) {
                    if(result && result.count.length>0){
                        var c =  _.filter(result.count, function (a) {
                            return a["type"]== "trade_traffic";
                        });
                        if(c[0]['count_everyday_line'] && c[0]['count_validity_line']){
                            count = c[0]['count_everyday_line'] > c[0]['count_validity_line'] ? c[0]['count_everyday_line'] : c[0]['count_validity_line'];
                        }
                    }else{
                        count = 0;
                    }
                    cb();
                })
            },
            function (cb) {
                //获取交易仓库的地址
              async.waterfall([
                  function (cb1) {
                      extServer.generalFun(req, {
                          source: 'trade',
                          db:'PassPrice',
                          method:'getList',
                          query:{
                              find: {
                                  user_id: req.decoded.id
                              }
                          }}, cb1);
                  }, function (passPrices, cb1) {
                      async.eachSeries(JSON.parse(JSON.stringify(passPrices||[])), function (passPrice, cb10) {
                          var section = [], end_section = [];
                          async.waterfall([
                              function (cb100) {
                                  extServer.generalFun(req, {
                                      source: 'trade',
                                      db:'PriceOfferCity',
                                      method:'getList',
                                      query:{
                                          find: {
                                              passPrice_id: passPrice._id
                                          }
                                      }}, cb100);
                              }, function (priceCitys, cb100) {
                                  if(priceCitys){
                                      _.each(priceCitys, function (a) {
                                          if(a.countries != '全国'){
                                              end_section.push(a.province);
                                              if(a.province == a.city){
                                                  end_section.push(a.province + a.district);
                                              }else{
                                                  end_section.push(a.province + a.city);
                                                  end_section.push(a.province + a.city + a.district);
                                              }
                                          }
                                      })
                                  }
                                  extServer.generalFun(req, {
                                      source: 'user',
                                      db:'Address',
                                      method:'getOne',
                                      query:{
                                          find: {
                                              _id: passPrice.location_storage
                                          }
                                      }}, cb100);
                                  
                              }, function (store, cb100) {
                                  if(store){
                                      section.push(store.province);
                                      if(store.province == store.city){
                                          section.push( store.province + store.district );
                                      }else{
                                          section.push( store.province + store.city );
                                          section.push( store.province + store.city + store.district );
                                      }
                                      condSection.push({section: _.uniq(section), end_section: _.uniq(end_section)});
                                      cb100();
                                  }else{
                                      cb100();
                                  }
                              }
                          ], cb10);
                      }, cb1)
                  }
              ], cb);
            },
            function (cb) {
                if (!base_time) {
                    trafficPushSV.getOne({
                        find: {
                            user_id: req.decoded.id
                        }
                    }, cb);
                } else {
                    cb(null, null);
                }
            },
            function(push, cb){
                if(!push){
                    extServer.generalFun(req, {
                        source: 'user',
                        db:'Company_relation',
                        method:'getList',
                        query:{
                            find: {
                                self_id: req.decoded.company_id,
                                other_type:'TRAFFIC'
                            },
                            select: 'other_id'
                        }}, function(err, list){
                        // cond.company_id =  {$nin : _.pluck(list, 'other_id')};
                        cond.company_id =  {$nin : _.pluck(list, 'other_id'), $exists: true};
                        cb();
                    });
                }else{
                    cond._id = {$in: push.push_content};
                    cb();
                }
            }
            ,function(cb){
                var condTmp = [];
                _.each(condSection, function (a) {
                    condTmp.push({section: {$in: a.section}, end_section: {$in: a.end_section}});
                    condTmp.push({section: {$in: a.end_section}, end_section: {$in: a.section}});
                });
                cond.$or = condTmp;
                // cond.company_id = {$exists: true};
                //执行操作
                trafficLineSV.getList({
                    find: cond,
                    sort: {time_creation: -1},
                    skip: (req.body.page-1)*config_common.entry_per_page,
                    limit: recommend_count,
                    page: req.body.page
                }, cb);
            },
            function (lines, cb) {
                trafficPushSV.edit({
                    user_id: req.decoded.id,
                    role: req.decoded.role,
                    type: 'line', 
                    time_creation: new Date(), 
                    push_content: _.pluck(JSON.parse(JSON.stringify(lines.lines)), '_id')
                }, function () {});
                cb(null, lines);
            }
        ], function (err, result) {
            if(err){
                return next(err);
            }
            config_common.sendData(req, result.lines, next);
        });
    });
    //运输-车辆行情 | 通过线路查询推荐车辆数和价格区间 20180105
    api.post('/pass_list_truck', function (req, res, next) {
        if(config_common.accessRule.pass.indexOf(req.decoded.role)==-1){
            return next({dev: '限物流'})
        }
        var truckInfo = {}, driverDemand_id, base_time = (new Date()).getHours() >= 10 ? true : false; //判断当前时间是否超过10点
        req.body.page = req.body.page || 1;
        async.waterfall([
            function (cb) {
                //订单数
                trafficOrderSV.getCount({
                    supply_company_id: req.decoded.company_id[0],
                    status: config_common.demand_status.effective,
                    step: {$gte:3, $lt: 4}
                }, cb);
            },
            function (count, cb) {
                truckInfo['order_count'] = count || 0;
                //司机参与数
                driverDemandSV.onlyList({
                    find: {
                        demand_user_id: req.decoded.id,
                        status: config_common.demand_status.effective,
                        time_validity : {$gte: new Date()}
                    },
                    select: 'demand_user_id unoffer_list'
                },cb);
            },
            function(list, cb){
                if(list){
                    driverDemand_id = _.pluck(JSON.parse(JSON.stringify(list)), '_id');
                }else{
                    driverDemand_id = [];
                }
                // driverPlanSV.getCount({
                //     // demand_company_id: req.decoded.company_id[0],
                //     demand_user_id: req.decoded.id,
                //     demand_id: {$in: driverDemand_id},
                //     // status: config_common.demand_status.ineffective
                // }, cb);
                
            // },
            // function (count, cb) {
                // truckInfo['plan_count'] = count || 0;
                //
                truckInfo['demand_count'] = driverDemand_id.length;
                driverPlanSV.getCount({
                    // demand_company_id: req.decoded.company_id[0],
                    demand_user_id: req.decoded.id,
                    demand_id: {$in: driverDemand_id},
                    status: config_common.demand_status.ineffective
                }, cb);
            },
            function (count, cb) {
                truckInfo['assign_count'] = count || 0;
                driverDemandSV.getCount({
                    status: config_common.demand_status.ineffective,
                    demand_user_id: req.decoded.id
                },cb);
            },
            function(count, cb){
                truckInfo['demand_count_ineffective'] = count || 0;
                //获取推荐的司机头像
                http.sendUserServerNoToken(req, {
                    type: 'traffic_truck'
                }, config_api_url.user_push_get_list, function (err, company) {
                    truckInfo['truck_info'] = company || [];
                    cb();
                });

            },
            function (cb) {
                var count=0, c , relation_list, line_cond;
                //获取推荐的司机线路
                //获取挂靠司机，获取非挂靠司机发布的线路
                async.waterfall([
                    function (cb1) {
                        //获取推荐数
                        extServer.generalFun(req, {
                            source: 'admin',
                            db: 'PushCount',
                            method:'getOne',
                            query:{
                                find: {user_id: req.decoded.id, role: 'TRAFFIC_ADMIN'}
                            }
                        }, function (err, result) {
                            if(result && result.count.length>0){
                                c =  _.filter(result.count, function (a) {
                                    return a["type"]== "traffic_truck";
                                });
                                if(c[0]['count_everyday_line'] && c[0]['count_validity_line']){
                                    count = c[0]['count_everyday_line'] < c[0]['count_validity_line'] ? c[0]['count_everyday_line'] : c[0]['count_validity_line'];
                                }
                                cb1();
                            }else{
                                cb();
                            }
                        })
                    },
                    function (cb1) {
                        if (!base_time) {
                            trafficPushSV.getOne({
                                find: {
                                    user_id: req.decoded.id
                                }
                            }, cb1);
                        } else {
                            cb1(null, null);
                        }
                    }, function(push, cb1){
                        //获取挂靠司机列表
                        if(push){
                            line_cond = {
                                _id: {$in: push.push_content},
                                status: config_common.demand_status.effective
                            };
                            cb1();
                        }else{
                            extServer.generalFun(req, {
                                source: 'user',
                                db:'Driver_verify',
                                method:'getList',
                                query:{
                                    // find: {company_id: {$in: req.decoded.company_id}} //req.decoded.company_id[0]}
                                    find: {approve_id: req.decoded.id}
                                }}, function(err, list){
                                line_cond = {
                                    user_id: {$nin: _.pluck(list, 'user_id')},
                                    role: config_common.user_roles.TRAFFIC_DRIVER_PRIVATE
                                    , status: config_common.demand_status.effective};
                                cb1();
                            });
                        }
                        
                    },
                    function (cb1) {
                        //获取非挂靠司机发布的线路
                        trafficLineSV.getList({
                            find: line_cond,
                            sort: {time_creation: -1},
                            skip: (req.body.page-1)*config_common.entry_per_page,
                            limit: count,
                            page: req.body.page
                        }, cb1);
                    }
                ], cb)
            }
        ], function (err, result) {
            if(err){
                return next(err)
            }
            truckInfo['line_list'] = result ? result.lines : [];

            if(base_time){
                trafficPushSV.edit({
                    user_id: req.decoded.id,
                    role: req.decoded.role,
                    type: 'line',
                    time_creation: new Date(),
                    push_content: _.pluck(truckInfo['line_list'], '_id')
                }, function () {});
            }
            config_common.sendData(req, truckInfo, next);
        });
    });
    return api;
};

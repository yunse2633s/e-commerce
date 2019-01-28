/**
 * Created by Administrator on 2017/2/27.
 */
var async = require('async');
var _ = require('underscore');
var decimal = require('decimal');
var http = require('../lib/http');
var util = require('../lib/util');
var config_api_url = require('../configs/config_api_url');
var config_common = require('../configs/config_common');
var DB = require('../dbs/db_base')('TrafficDemand');
var offerDB = require('../dbs/db_base')('TrafficOffer');
var planDB = require('../dbs/db_base')('TrafficPlan');
var LineDB = require('../dbs/db_base')('TrafficLine');
var trafficLineSV = require('../lib/lib_traffic_line');
var extServer = require('../lib/lib_ext_server');
var tipSV=require('../lib/lib_tip');

exports.findOne = function(date, callback){
    DB.getOne({find: date}, callback);
};
//获取表数量

//----- 20170410------
//依据条件查询单个表详情
exports.getOne = function(data, callback){
    DB.getOne(data,callback);
};
//通过id查询
exports.getById = function(data, callback){
    DB.getById(data,callback);
};
//获取表数量
exports.getCount = function(data, callback){
    DB.getCount(data, callback);
};
//获取分页数据
exports.getList = function(data, callback){
    //new
    var result = {count: 0, demands: [], exist: false};
    async.waterfall([
        function (cb) {
            DB.getCount(data.find, cb);
        }, function (count, cb) {
            if(!count){
                callback(null, result);
            }
            result.count = count;
            result.exist = count > data.page * config_common.entry_per_page;
            DB.getList(data, cb);
        }, function (lists, cb) {
            async.eachSeries(lists, function (list, cb1) {
                var demandOne = list.toObject();
                extServer.userFind({user_id: list.demand_user_id}, function(err, user){
                    if(err){
                        // result.demands.push(demandOne);
                    }else{
                        demandOne = _.extend(demandOne, user);
                        result.demands.push(demandOne);
                    }
                    cb1();
                });
            }, cb);
        }
    ], function (err) {
        if(err){
            return callback(err);
        }
        callback(null, result);
    });
};
//批量编辑
exports.editList = function(data, callback){
    DB.edit(data, callback);
};
//批量更新
exports.updateList = function(data, callback){
    DB.update(data, callback);
};
exports.onlyList = function(data, callback){
    DB.getList(data, callback);
};
exports.onlyAdd = function(data, callback){
    DB.add(data, callback);
};
//聚合
exports.getAggregate = function(data, callback){
    DB.group(data, callback);
};

//场景下的新增
exports.addScene = function(req, callback){
    var tradeOrderInfo, amount_assign=0, amount_remain=0, assign_company_info, trafficDemand, reqObj, time_cost={};
    async.waterfall([
        function(cb){
            extServer.generalFun(req, {
                source: 'trade',
                db:'DemandOrder',
                method:'getOne',
                query:{
                    find: {
                        index: req.body.index_trade
                    }
                }}, cb);
        },
        function(order, cb) {
            if (!order) {
                return cb({dev: '订单数据没找到', pro: '000004'});
            }
            //若交易订单中已没有剩余吨数，则不允许再次发送物流指派
            if ((Number(order.amount) - Number(order.amount_been_demand)) < 0) {
                return cb({dev: '剩余吨数不足', pro: '000006'});
            }
            tradeOrderInfo = JSON.parse(JSON.stringify(order));
            //增加时间扣款
            if(req.body.date_type || req.body.cut_type){
                if(req.body.date_type=='start'){ //20180601 data_type 更改为 date_type
                    time_cost.date_type='start',
                        time_cost.start_type=req.body.start_date,
                        time_cost.time_stamp=Date.now()+req.body.start_date*5*24*60*60*1000;
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
            
            extServer.judgeStore({
                _id: req.body.receive_address_id
            }, function (err, address) {
                if(address){
                    tradeOrderInfo.receive_address_id = address && address.type ? address._id.toString() : '';
                    tradeOrderInfo.receive_province = address.province;               //省
                    tradeOrderInfo.receive_city = address.city;               //市
                    tradeOrderInfo.receive_district = address.district;               //区
                    tradeOrderInfo.receive_addr = address.addr;
                    tradeOrderInfo.receive_name = address.prin_name;    //接收方名字
                    tradeOrderInfo.receive_phone = address.prin_phone;   //接收方电话
                    tradeOrderInfo.receive_location = [address.location[0], address.location[1]]; //loc[1];
                    tradeOrderInfo.receive_nickname = address.name || '';     // 仓库昵称
                }
                extServer.judgeStore({
                    _id: tradeOrderInfo.send_address_id
                }, function (err, address2) {
                    if(address2){
                        tradeOrderInfo.send_address_id = address2 && address2.type ? address2._id.toString() : '';
                        tradeOrderInfo.send_province = address2.province;               //省
                        tradeOrderInfo.send_city = address2.city;               //市
                        tradeOrderInfo.send_district = address2.district;               //区
                        tradeOrderInfo.send_addr = address2.addr;
                        tradeOrderInfo.send_name = address2.prin_name;    //接收方名字
                        tradeOrderInfo.send_phone = address2.prin_phone;   //接收方电话
                        tradeOrderInfo.send_location = [address2.location[0], address2.location[1]]; //loc[1];
                        tradeOrderInfo.send_nickname = address2.name || '';     // 仓库昵称
                    }
                    cb();
                });

            });

        },function (cb) {
            //检查用户所传product 的正确性;
            amount_remain = config_common.rscDecimal('sub', tradeOrderInfo.amount, tradeOrderInfo.amount_been_demand);

            //判断用户所传product_categories 与 订单中的product_categories是否相同;
            var flag = true;
            _.each(req.body.product_categories, function (a) {
                if(a.layer_1){
                    for(var i=0; i < tradeOrderInfo.product_categories.length; i++){
                        var b = tradeOrderInfo.product_categories[i];
                        if(a.layer_1+a.layer_2+a.layer_3 == b.layer_1+b.layer_2+b.layer_3){
                            flag = false;
                            break;
                        }
                    }
                }else{
                    flag=false;
                }

            });
            _.each(req.body.product_categories, function (a) {
                _.each(a.product_name, function (b) {
                    b.number = Number(b.number);
                    b.amount_unit = b.amount_unit || 1;
                    b.amount = config_common.rscDecimal('mul', b.number, b.amount_unit);
                    amount_assign = config_common.rscDecimal('add', b.amount, amount_assign);
                })
            });

            if(flag || Number(amount_assign) > Number(amount_remain)){
                return cb({dev: '剩余吨数不足', pro: '000006'});//
            }else{
                cb();
            }
        }, function (cb) {

            reqObj = {
                index: config_common.getDemandIndex(),
                index_trade: req.body.index_trade,
                demand_user_id: req.decoded.id,
                demand_user_name: req.decoded.user_name,
                demand_company_id: req.decoded.company_id,
                demand_company_name: req.decoded.company_name,
                company_sell_id : tradeOrderInfo.company_supply_id,
                company_buy_id : tradeOrderInfo.company_demand_id,                //
                payment_choice: req.body.payment_choice,  //现有支付选择(现金，银兑，商兑)
                payment_method: req.body.payment_method,  //现有支付方法(货到付款，款到付货，分期，信用)
                count_day_extension: req.body.count_day_extension,     //延期天数
                ref_day_extension: req.body.ref_day_extension,       //延期计算标准
                percentage_advance: req.body.percent_advance,      //预付款百分比
                percentage_remain: req.body.percentage_remain,      //预付款百分比
                //来自发货地址中的信息
                send_address_id: tradeOrderInfo.send_address_id || '',    //发货地址id
                send_province : tradeOrderInfo.send_province,               //省
                send_city : tradeOrderInfo.send_city,             //市
                send_district : tradeOrderInfo.send_district,               //区
                send_addr : tradeOrderInfo.send_addr,               //详细
                send_name : tradeOrderInfo.send_name,    //接收方名字
                send_phone : tradeOrderInfo.send_phone,   //接收方电话
                send_company_name : tradeOrderInfo.company_supply_name,
                //来自交货地址中的信息
                receive_address_id: tradeOrderInfo.receive_address_id || '',      //交货地址id
                receive_province : tradeOrderInfo.receive_province,               //省
                receive_city : tradeOrderInfo.receive_city,               //市
                receive_district : tradeOrderInfo.receive_district,               //区
                receive_addr : tradeOrderInfo.receive_addr,
                receive_name : tradeOrderInfo.receive_name,    //接收方名字
                receive_phone : tradeOrderInfo.receive_phone,   //接收方电话
                send_loc : tradeOrderInfo.send_location, //loc[0];
                receive_loc : tradeOrderInfo.receive_location, //loc[1];
                receive_company_name : tradeOrderInfo.company_demand_name,
                //结算细则
                // att_traffic: req.body.att_traffic,
                att_traffic : req.body.att_traffic || {one:[1,0,0],two:[0,0]},
                weigh_settlement_style: req.body.weigh_settlement_style,		  //重量结算方式
                // time_settlement_style: req.body.time_settlement_style,		  //时间结算方式
                //发票信息
                invoice_name: req.body.invoice_name || '',               //发票公司名
                invoice_addr: req.body.invoice_addr || '',               //单位地址
                invoice_number: req.body.invoice_number || '',               //税号
                invoice_phone: req.body.invoice_phone || '',               //公司电话
                invoice_bank: req.body.invoice_bank || '',               //开户银行
                invoice_account: req.body.invoice_account || '',               //公司账号
                //指派公司
                verify_company : _.flatten(req.body.company_ids),
                //时间段
                // time_depart: new Date(req.body.time_depart),
                time_validity : req.body.time_validity,
                time_creation: new Date(),
                time_modify: new Date(),
                //备注
                quality_origin: tradeOrderInfo['att_quality'][0], //质检方
                appendix: req.body.appendix,                  //备注
                source : config_common.demand_source.trade_assign,
                status : config_common.demand_status.effective,
                platform_company: _.flatten(req.body.platform_company || []), //20171101 平台推荐的公司
                tip_price: Number(req.body.tip_price||0), //20171110
                admin_id: req.decoded.admin_id,
                send_nickname: tradeOrderInfo.send_nickname || tradeOrderInfo.send_add_name,
                receive_nickname: tradeOrderInfo.receive_nickname || tradeOrderInfo.receive_add_name,
                payment_payer: req.body.payment_payer || 'demand',
                time_cost:time_cost
            };
            if(req.body.time_arrival){
                reqObj.time_arrival = new Date(req.body.time_arrival);
            }
            if(req.body.time_depart){
                reqObj.time_depart = new Date(req.body.time_depart);
            }
            if(req.body.time_depart_start){
                reqObj.time_depart_start = new Date(req.body.time_depart_start);
            }
            if(req.body.time_depart_end){
                reqObj.time_depart_end = new Date(req.body.time_depart_end);
            }
            if(req.body.payment_payee){
                reqObj.payment_payee = req.body.payment_payee;
            }
            if(req.body.freight_voucher){
                reqObj.freight_voucher = req.body.freight_voucher;
            }
            reqObj.material = req.body.product_categories[0]['material'];
            reqObj.category = (_.uniq(_.pluck(req.body.product_categories, 'layer_1'))).join(',');
            reqObj.category_chn = (_.uniq(_.pluck(req.body.product_categories, 'layer_1_chn'))).join(',');
            reqObj.category_penult =config_common.penultCategory(req.body.product_categories);
            reqObj.category_penult_chn =config_common.penultCategoryChn(req.body.product_categories);
            reqObj.product_categories = config_common.product_categories_construct(req.body.product_categories); //商品目录
            reqObj.products_remain = config_common.products_remain_construct(req.body.product_categories, 'number'); //商品目录:与值,
            reqObj.assign_count = reqObj.platform_company.length + reqObj.verify_company.length; //20171101
            var convertProduce = config_common.products_catelog(reqObj.product_categories);
            if (req.body.replenish) {
                _.each(req.body.replenish, function(a){
                    _.each(a['product_name'], function(b){
                        b['amount_unit'] = b['amount_unit'] || 1
                    });
                });
                reqObj.products_replenish = req.body.replenish;
            }
            reqObj.amount = reqObj.amount_remain = convertProduce.amount;//若产品是件数，则
            reqObj.price_total = convertProduce.price_total;
            reqObj.price_max = _.max(convertProduce.price_arr); //价格区间
            reqObj.price_min = _.min(convertProduce.price_arr); //价格区间
            // reqObj.section = [reqObj.send_province, reqObj.send_province + reqObj.send_city, reqObj.send_province + reqObj.send_city + reqObj.send_district];
            // reqObj.end_section = [reqObj.receive_province, reqObj.receive_province + reqObj.receive_city, reqObj.receive_province + reqObj.receive_city + reqObj.receive_district];
            reqObj.section = config_common.demandAreaCollect(reqObj.send_province, reqObj.send_city, reqObj.send_district);
            reqObj.end_section = config_common.demandAreaCollect(reqObj.receive_province, reqObj.receive_city, reqObj.receive_district);
            reqObj.payment_payer = config_common['quality_origin'][req.body.payment_payer]; //20180328 付费对象
            //getFindCategory 20180619 用于筛选产品
            reqObj.find_category=config_common.getFindCategory(reqObj.product_categories);
            //获取被指派公司管理员的头像;
            extServer.companyUserLogo('traffic',{_id: {$in: reqObj.verify_company}}, {role: {$in: config_common.accessRule.pass}}, cb);
        }, function (list, cb) {
            extServer.companyUserLogo('traffic', {_id: {$in: reqObj.platform_company}}, {role: {$in: config_common.accessRule.pass}}, function (err, list2) {
                cb(null, list || [], list2 || []);
            });
        }, function(list, list2, cb){
            extServer.generalFun(req, {
                source: 'user',
                db:'User_relation',
                method:'getList',
                query:{
                    find: {
                        user_id: req.decoded.id,
                        type: 'FRIEND'
                    },
                    select: 'other_id'
                }
            }, function(err, friend){
                var friends = friend ? _.pluck(friend, 'other_id') : [];
                extServer.userLogo('traffic', {
                    _id: {$in: friends}
                }, function (err, useLogos) {
                   cb(null, list, list2, useLogos||[]);
                })
            })
        }, function (list, list2, list3, cb) {
            //向交易服务器发起修改请求
            http.sendTradeServerNew(req, {
                    'id': tradeOrderInfo._id,
                    'amount': reqObj.amount,
                    'is_true': true,
                    'products_remain': config_common.products_remain_construct(reqObj.product_categories, 'number', 'trade'), //reqObj.products_remain,
                    'product_categories': reqObj.product_categories
                }, config_api_url.trade_order_edit, function(err){
               if(err){
                   console.log('trade_error'+ (new Date()) + tradeOrderInfo._id + err);
               }
                DB.add(reqObj, function (err, demand) {
                    if(err){ return cb({dev: '需求单创建错误'+err, pro: '000005'});}
                    trafficDemand = demand.toObject();
                    trafficDemand['assign_company_info'] = list;
                    trafficDemand['platform_company_info'] = list2;
                    trafficDemand['friend_info'] = list3;
                    cb(null, trafficDemand);
                });
            });
        }
    ],callback);
};

//获取需求单的用户姓名和公司信息
exports.getDemandUserComp = function(req, demandOne, callback, field){
    extServer.userFind({user_id: field ? demandOne[field]: demandOne.demand_user_id}, function(err, user){
        if(err){
            return callback(err);
        }
        demandOne = demandOne.toObject();
        demandOne = _.extend(demandOne, user);
        callback(null, demandOne);
    });
};

//关闭需求单
exports.close = function (req, data, callback) {
    var isRemain = 1;
    var demand={};
    async.waterfall([
        function(cb){
            DB.getOne({
                find: {
                    _id: data.demand_id,
                    status: config_common.demand_status.effective
                }
            }, cb);
        },
        function(demandRes, cb){

            demand = demandRes;
            if(!demand || (req != 'server' && demand.demand_user_id != req.decoded.id)){
                return cb({dev: '无权操作', pro: '000002'}); //('not_allow');
            }
            //向交易服务器发送修改请求
            async.waterfall([
                function (cb1) {
                    DB.getCount({
                        index_trade: demand.index_trade,
                        status: {$in: [config_common.demand_status.effective, config_common.demand_status.complete]}
                    }, cb1)
                },
                function (count, cb1) {
                    isRemain = count && count > 1 ? 2 : 1;
                    extServer.generalFun(req, {
                        source: 'trade',
                        db:'DemandOrder',
                        method:'getOne',
                        query:{
                            find: {
                                index: demand.index_trade
                            },
                            select: 'index'
                        }}, cb1);
                }, function (tradeOrderInfo, cb1) {
                    if(!tradeOrderInfo){
                        demand.status = data.status;
                        demand.sorting = config_common.demand_status_sort[demand.status];
                        demand.time_modify = new Date();
                        demand.save(cb1);
                        return cb1({dev: '关联交易订单没找到', pro: '000004'});
                    }
                    if(demand.amount_remain>0){
                        http.sendTradeServerNew(req, {
                            'id': tradeOrderInfo._id.toString(),
                            'amount': demand.amount_remain,
                            'is_true': false,
                            'step': isRemain,
                            'products_remain': config_common.products_remain_construct(demand.product_categories, 'number_remain', 'trade'), //demand.products_remain,
                            'product_categories': demand.product_categories
                        }, config_api_url.trade_order_edit, function(err,result){
                        });
                    }
                    demand.status = demand.amount_remain ? data.status : config_common.demand_status.complete;
                    demand.sorting = config_common.demand_status_sort[demand.status];
                    demand.time_modify = new Date();
                    demand.save(cb1);
                }, function (demand, count, cb1) {
                    //关闭物流抢单，
                    offerDB.update({
                        find: {
                            status: config_common.demand_status.effective,
                            demand_id: demand._id.toString()
                        },
                        set: {status: config_common.demand_status.cancelled, time_modify: new Date()}
                    }, function(){});
                    //关闭物流计划报名
                    planDB.update({
                        find: {
                            status: config_common.demand_status.effective,
                            demand_id: demand._id.toString()
                        },
                        set: {status: config_common.demand_status.ineffective, time_modify: new Date()}
                    }, function(x,y){console.log('关闭接单', x, y)});

                    cb1(null, null);
                }
            ], cb);
        }
    ], callback);
};
//返回需求单详情和发单人信息
exports.getDemandOne = function (data, callback) {
    async.waterfall([
        function (cb) {
            DB.getOne(data, cb)
        }, function (demandOne, cb) {
            if(!demandOne)return cb({dev: '单据未找到'});
            extServer.userFind({user_id: demandOne.demand_user_id}, function(err, user){
                cb(null, _.extend(JSON.parse(JSON.stringify(demandOne)), user||{}) );
            });
        }
    ], callback);
};
//双方物流
exports.addBoth = function(req, callback){
    var amount_assign=0, amount_remain=0, assign_company_info, trafficDemand, reqObj={},time_cost={},
        tradeOrderInfo = {send_address_id:'', send_province : '',send_city:'', send_district:'', send_addr:'', send_name:'',send_phone:'',send_location:[], section:[]
            , receive_address_id:'',receive_province:'',receive_city:'',receive_district:'',receive_addr:'',receive_name:'',receive_phone:'',receive_location:[], end_section:[]}
        ;
    async.waterfall([
        function (cb) {
            if(req.body.line_id){
                LineDB.update({find: {_id: req.body.line_id}, set:{
                    $inc: {demand_count: 1}
                }}, cb)
            }else{
                cb(null, null);
            }
        },
        function(line,cb){
            //增加时间扣款
            if(req.body.date_type || req.body.cut_type){
                var t = new Date();
                if(req.body.date_type=='start'){
                    time_cost.date_type='start',
                        time_cost.start_type=req.body.start_type,
                        time_cost.time_stamp = t.getTime()+ req.body.start_type*5*24*60*60*1000;
                }else{
                    time_cost.date_type='cut',
                        time_cost.cut_type=req.body.cut_type,
                        time_cost.cut_date=req.body.cut_date,
                        time_cost.timeout_price=req.body.timeout_price,
                        time_cost.not_count_price=req.body.not_count_price
                    ;

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
            extServer.judgeStore({
                _id: req.body.receive_id
            }, cb);
        }, function(address, cb){
            if(address){
                tradeOrderInfo.receive_address_id = address && address.type ? address._id.toString() : '';
                tradeOrderInfo.receive_province = address.province;               //省
                tradeOrderInfo.receive_city = address.city;               //市
                tradeOrderInfo.receive_district = address.district;               //区
                tradeOrderInfo.receive_addr = address.addr;
                tradeOrderInfo.receive_name = address.prin_name;    //接收方名字
                tradeOrderInfo.receive_phone = address.prin_phone;   //接收方电话
                tradeOrderInfo.receive_location = [address.location[0], address.location[1]]; //loc[1];
                tradeOrderInfo.section = config_common.demandAreaCollect(tradeOrderInfo.receive_province, tradeOrderInfo.receive_city, tradeOrderInfo.receive_district);
                
                tradeOrderInfo.receive_nickname = address.name || '';
            }
            extServer.judgeStore({
                _id: req.body.send_id
            }, cb);
        }, function (address, cb) {
            if (address) {

                tradeOrderInfo.send_address_id = address && address.type ? address._id.toString() : '';
                tradeOrderInfo.send_province = address.province;               //省
                tradeOrderInfo.send_city = address.city;               //市
                tradeOrderInfo.send_district = address.district;               //区
                tradeOrderInfo.send_addr = address.addr;
                tradeOrderInfo.send_name = address.prin_name;    //接收方名字
                tradeOrderInfo.send_phone = address.prin_phone;   //接收方电话
                tradeOrderInfo.send_location = [address.location[0], address.location[1]]; //loc[1];
                tradeOrderInfo.end_section = config_common.demandAreaCollect(tradeOrderInfo.send_province, tradeOrderInfo.send_city, tradeOrderInfo.send_district);
                tradeOrderInfo.send_nickname = address.name || '';
            }
            reqObj = {
                index: config_common.getDemandIndex(),
                demand_user_id: req.decoded.id,
                demand_user_name: req.decoded.user_name,
                demand_company_id: req.decoded.company_id,
                demand_company_name: req.decoded.company_name,
                payment_choice: req.body.payment_choice,  //现有支付选择(现金，银兑，商兑)
                payment_method: req.body.payment_method,  //现有支付方法(货到付款，款到付货，分期，信用)
                count_day_extension: req.body.count_day_extension,     //延期天数
                ref_day_extension: req.body.ref_day_extension,       //延期计算标准
                percentage_advance: req.body.percent_advance,      //预付款百分比
                percentage_remain: req.body.percentage_remain,      //预付款百分比
                //来自发货地址中的信息
                send_address_id: tradeOrderInfo.send_address_id || '',    //发货地址id
                send_province : tradeOrderInfo.send_province,               //省
                send_city : tradeOrderInfo.send_city,             //市
                send_district : tradeOrderInfo.send_district,               //区
                send_addr : tradeOrderInfo.send_addr,               //详细
                send_name : tradeOrderInfo.send_name,    //接收方名字
                send_phone : tradeOrderInfo.send_phone,   //接收方电话
                // send_company_name : tradeOrderInfo.company_supply_name,
                //来自交货地址中的信息
                receive_address_id: tradeOrderInfo.receive_address_id || '',      //交货地址id
                receive_province : tradeOrderInfo.receive_province,               //省
                receive_city : tradeOrderInfo.receive_city,               //市
                receive_district : tradeOrderInfo.receive_district,               //区
                receive_addr : tradeOrderInfo.receive_addr,
                receive_name : tradeOrderInfo.receive_name,    //接收方名字
                receive_phone : tradeOrderInfo.receive_phone,   //接收方电话
                send_loc : tradeOrderInfo.send_location, //loc[0];
                receive_loc : tradeOrderInfo.receive_location, //loc[1];
                // receive_company_name : tradeOrderInfo.company_demand_name,
                //结算细则
                // att_traffic: req.body.att_traffic,
                att_traffic : req.body.att_traffic || {one:[1,0,0],two:[0,0]},
                weigh_settlement_style: req.body.weigh_settlement_style,		  //重量结算方式
                // time_settlement_style: req.body.time_settlement_style,		  //时间结算方式
                //指派公司
                verify_company : _.flatten(req.body.company_ids), //指派公司
                //时间段
                
                // time_depart: new Date(req.body.time_depart),
                time_validity : req.body.time_validity,
                time_creation: new Date(),
                time_modify: new Date(),
                //备注
                quality_origin: req.body.quality_origin, //质检方
                appendix: req.body.appendix,                  //备注
                source : req.body.scene == 'both' ? config_common.demand_source.traffic_demand : config_common.demand_source.traffic_line_demand,
                status : config_common.demand_status.effective,
                platform_company: _.flatten(req.body.platform_company || []), //20171101 平台推荐的公司
                tip_price: Number(req.body.tip_price||0), //20171110
                admin_id: req.decoded.admin_id,
                send_nickname: tradeOrderInfo.send_nickname,
                receive_nickname: tradeOrderInfo.receive_nickname,
                line_id: req.body.line_id || '',
                payment_payer: req.body.payment_payer || 'demand',
                time_cost:time_cost
            };
            if(req.body.time_arrival){
                reqObj.time_arrival = new Date(req.body.time_arrival);
            }
            if(req.body.time_depart){
                reqObj.time_depart = new Date(req.body.time_depart);
            }
            if(req.body.time_depart_start){
                reqObj.time_depart_start = new Date(req.body.time_depart_start);
            }
            if(req.body.time_depart_end){
                reqObj.time_depart_end = new Date(req.body.time_depart_end);
            }
            if(req.body.payment_payee){
                reqObj.payment_payee = req.body.payment_payee;
            }
            if(req.body.freight_voucher){
                reqObj.freight_voucher = req.body.freight_voucher;
            }
            
            // reqObj.section = [reqObj.send_province, reqObj.send_province + reqObj.send_city, reqObj.send_province + reqObj.send_city + reqObj.send_district];
            // reqObj.end_section = [reqObj.receive_province, reqObj.receive_province + reqObj.receive_city, reqObj.receive_province + reqObj.receive_city + reqObj.receive_district];
            reqObj.section = config_common.demandAreaCollect(reqObj.send_province, reqObj.send_city, reqObj.send_district);
            reqObj.end_section = config_common.demandAreaCollect(reqObj.receive_province,reqObj.receive_city, reqObj.receive_district);
            
            reqObj.material = req.body.product_categories[0]['material'];
            reqObj.category = (_.uniq(_.pluck(req.body.product_categories, 'layer_1'))).join(',');
            // reqObj.category_chn = (_.uniq(_.pluck(req.body.product_categories, 'layer_1_chn'))).join(',');
            reqObj.category_penult =config_common.penultCategory(req.body.product_categories);
            extServer.generalFun(req, {
                source: 'trade',
                db:'Classify',
                method:'getList',
                query:{
                    find: {
                        // eng: reqObj.category
                        eng: {$in: [reqObj.category,reqObj.category_penult]}
                    },
                    select: 'eng chn'
                }
            }, function(err, friend){
                if(friend){
                    _.each(friend, function (a) {
                        if(a.eng == reqObj.category){
                            reqObj.category_chn = a.chn;
                        }
                        if(a.eng==reqObj.category_penult){
                            reqObj.category_penult_chn = a.chn;
                        }                        
                    })
                    cb();
                }else{
                    cb();
                }
            });
        }, function (cb) {
            reqObj.product_categories = config_common.product_categories_construct(req.body.product_categories); //商品目录
            reqObj.products_remain = config_common.products_remain_construct(req.body.product_categories, 'number'); //商品目录:与值,
            reqObj.assign_count = reqObj.platform_company.length + reqObj.verify_company.length; //20171101
            var convertProduce = config_common.products_catelog(reqObj.product_categories);
            if (req.body.replenish) {
                _.each(req.body.replenish, function(a){
                    _.each(a['product_name'], function(b){
                        b['amount_unit'] = b['amount_unit'] || 1
                    });
                });
                reqObj.products_replenish = req.body.replenish;
            }
            reqObj.amount = reqObj.amount_remain = convertProduce.amount;//若产品是件数，则
            reqObj.price_total = config_common.converNumberLength(convertProduce.price_total, 2);
            reqObj.price_max = _.max(convertProduce.price_arr); //价格区间
            reqObj.price_min = _.min(convertProduce.price_arr); //价格区间
            //getFindCategory 20180619
            reqObj.find_category=config_common.getFindCategory(reqObj.product_categories);
            //获取被指派公司管理员的头像;
            extServer.companyUserLogo('traffic',{_id: {$in: reqObj.verify_company}}, {role: {$in: config_common.accessRule.pass}}, cb);
        }, function (list, cb) {
            extServer.companyUserLogo('traffic', {_id: {$in: reqObj.platform_company}}, {role: {$in: config_common.accessRule.pass}}, function (err, list2) {
                cb(null, list || [], list2 || []);
            });
        }, function(list, list2, cb){
            extServer.generalFun(req, {
                source: 'user',
                db:'User_relation',
                method:'getList',
                query:{
                    find: {
                        user_id: req.decoded.id,
                        type: 'FRIEND'
                    },
                    select: 'other_id'
                }
            }, function(err, friend){
                var friends = friend ? _.pluck(friend, 'other_id') : [];
                extServer.userLogo('traffic', {
                    _id: {$in: friends}
                }, function (err, useLogos) {
                    cb(null, list, list2, useLogos||[]);
                })
            })
        }, function (list, list2, list3, cb) {
            DB.add(reqObj, function (err, demand) {
                if(err){ return cb({dev: '需求单创建错误'+err, pro: '000005'});}
                trafficDemand = demand.toObject();
                trafficDemand['assign_company_info'] = list;
                trafficDemand['platform_company_info'] = list2;
                if(req.body.scene == 'both'){
                    trafficDemand['friend_info'] = list3;
                }
                cb(null, trafficDemand);
            });
        }
    ],callback);
};

exports.specialList = function(data, callback, req){
    //new
    var result = {count: 0, lists: [], exist: false};
    async.waterfall([
        function (cb) {
            data.sort = {sorting: 1,time_creation: -1};
            DB.getCount(data.find,function(err,count){
                if(err){
                    return cb(err);
                }
                DB.getList(data,function(err, orders){
                    if(err){
                        return cb(err);
                    }
                    cb(null,{
                        orders: JSON.parse(JSON.stringify(orders)),
                        exist: count > data.page*config_common.entry_per_page,
                        count: count
                    });
                });
            });
        }, function (lists, cb) {
            result.count = lists.count;
            result.exist = lists.exist;
            var verify=[], unverify=[];
            async.parallel({
                getList: function(cb2){
                    async.eachSeries(lists.orders, function (list, cb1) {
                        extServer.userFind({user_id: list.demand_user_id}, function(err, user){
                            // if(req.decoded.role==config_common.user_roles.TRAFFIC_ADMIN){
                            if(config_common.accessRule.pass.indexOf(req.decoded.role) > -1){
                                if(user && user.verify_phase == "SUCCESS"){
                                    verify.push(_.extend(list, user));
                                }else{
                                    unverify.push(_.extend(list, user||{}));
                                }
                            }
                            else{
                                verify.push(_.extend(list, user||{}));
                            }

                            cb1();
                        });
                    }, function () {
                        result.lists=verify.concat(unverify);
                        cb2();
                    });
                },
                recommend:function(cb2){
                    if(req.body.step=='recommend_demand'){
                        // if(req.decoded && req.decoded.role==config_common.user_roles.TRAFFIC_ADMIN){
                        if(req.decoded && config_common.accessRule.pass.indexOf(req.decoded.role) > -1){
                            //物流
                            cb2()
                        }else{
                            //交易
                            cb2()
                        }
                    }else{
                        cb2()
                    }
                },
                tipUpdate:function(cb2){
                    // if(req.body.step=='traffic_demand' && req.decoded.role==config_common.user_roles.TRAFFIC_ADMIN){
                    if(req.body.step=='traffic_demand' && config_common.accessRule.pass.indexOf(req.decoded.role) > -1){
                        //获取限定时间内的单据数量
                        tipSV.getTime({
                            user_id: req.decoded.id,
                            company_id: req.decoded.company_id,
                            other_company_id: req.body.verify && req.body.verify.length==1 ? req.body.verify[0] :req.decoded.company_id,
                            type: config_common.tip_type.pass_demand
                        }, true, cb2);
                    }else{
                        cb2();
                    }
                }
            }, cb);
            
        }
    ], function (err) {
        if(err){
            return callback(err);
        }
        callback(null, result);
    });

};
//get_assign_list,物流-商业推荐
var get_assign_list=function(req, cb){
    var recommend_company = [];
    async.waterfall([
        function (cb1) {
            extServer.generalFun(req, {
                source: 'user',
                db:'Company_relation',
                method:'getList',
                query:{
                    find: {
                        other_id: {$in: req.decoded.company_id},//req.decoded.company_id[0],
                        other_type:'TRAFFIC'
                    },
                    select: 'self_id'
                }}, cb1);
        },
        function (company, cb1) {
            if(company){
                relation_company = _.pluck(company, 'self_id');
            }
            //获取当前公司预设值的推荐数--- ，;

            extServer.generalFun(req, {
                source: 'user',
                db:'Company_trade',
                method:'getCount',
                query:{
                    _id: {$nin: relation_company}, type: {$nin: ['STORE']}
                }}, cb1);
        },
        function (count, cb1) {
            if(!count){
                cb();
            }
            extServer.generalFun(req, {
                source: 'user',
                db:'Company_trade',
                method:'getList',
                query:{
                    find: {
                        _id: {$nin: relation_company}, type: {$nin: ['STORE']}
                    },
                    skip: Math.floor(Math.random() * count), //从配置中获取预设值20171219
                    limit: 1
                }}, cb1);
        },
        function (trades, cb1) {
            if(trades){
                
                async.eachSeries(trades, function(trade, cb2){
                    //查询出公司的详情 和 报价，采购，运输
                    http.sendUserServerNoToken(req, {company_id: trade._id}, config_api_url.user_company_home_page, function(err, result){
                        if(result){
                            recommend_company.push(result);
                        }
                        cb2();
                    });
                }, cb1);
            }else{
                cb1();
            }
        }
    ], cb);
}

/**
 * Created by Administrator on 2017/2/28.
 */
var async = require('async');
var decimal = require('decimal');
var _ = require('underscore');
var config_api_url = require('../configs/config_api_url');
var config_common = require('../configs/config_common');
var http = require('../lib/http');
var util = require('../lib/util');
var DB = require('../dbs/db_base')('TrafficOrder');
var driverDemandSV = require('../lib/lib_traffic_driver_demand');
var driverOrderSV = require('../lib/lib_traffic_driver_order');
// var config_msg_url = require('../configs/config_msg_url');
var extServer = require('../lib/lib_ext_server');


//获取表数量
exports.count = function(data, callback){
    DB.getCount(data, callback);
};
//依据条件获取表数量和分页数据
exports.list = function(data, callback){
    DB.getCount(data.find,function(err,count){
        if(err){
            return callback(err);
        }
        DB.getList(data,function(err, orders){
            if(err){
                return callback(err);
            }
            callback(null,{
                orders: orders,
                exist: count > data.page*config_common.entry_per_page
            });
        });
    });
};
//依据条件查询单个表详情
exports.findOne = function(data, callback){
    DB.getOne(data,callback);
};
exports.delete = function (data, callback) {
    DB.del(data, callback);
};
//------    20170410      -----
//依据条件修改原表数据
exports.getCount = function(data, callback){
    DB.getCount(data, callback);
};
exports.modify = function(data,callback){
    DB.modify(data,callback);
};
exports.updateList = function(data,callback){
    DB.update(data,callback);
};
exports.onlyList = function(data,callback){
    DB.getList(data,callback);
};
exports.onlyAdd = function(data,callback){
    DB.add(data,callback);
};
exports.getById = function(data, callback){
    DB.getById(data,callback);
};
exports.getOne = function(data, callback){
    DB.getOne(data,callback);
};
exports.getList = function(data, callback){
    DB.getCount(data.find,function(err,count){
        if(err){
            return callback(err);
        }
        DB.getList(data,function(err, orders){
            if(err){
                return callback(err);
            }
            callback(null,{
                orders: orders,
                exist: count > data.page*config_common.entry_per_page,
                count: count
            });
        });
    });
};

exports.getAggregate = function(data, callback){
    DB.group(data, callback);
};

//扩展
//获取需求单的用户姓名和公司信息 20170807
exports.getOrderUserComp = function(req, orderOne, callback){
    var cond={};
    if(req.decoded && config_common.accessRule.pass.indexOf(req.decoded.role) > -1){
        cond = {user_id: orderOne.demand_user_id};
    }else{
        if(!orderOne.supply_user_id){
            return callback({dev: 'supply_user_id参数有误', pro: '000003'});
        }
        cond = {user_id: orderOne.supply_user_id};
    }
    extServer.userFind(cond, function(err, user){
        if(err){return callback(err);}
        orderOne = orderOne.toObject();
        orderOne = _.extend(orderOne, user);
        callback(null, orderOne);
    });
};



//依据物流需求单查物流订单，通过物流订单找司机订单
exports.trafficTodriverOrder = function(req, find, callback){
    var driverDemandList=[],
        cond = {
            status: {
                $in: [config_common.demand_status.effective, config_common.demand_status.complete]
            }
        };
    cond = _.extend(cond, find);
    async.waterfall([
        function (cb) {
            //获取司机需求单
            driverDemandSV.onlyList({
                find: cond,
                select: 'demand_company_name amount amount_remain price status product_categories'
            }, cb);

            //获取司机订单
        }, function (demandList, cb) {
            if(demandList.length==0){
               demandList = [{_id: ''}];
            }
            async.eachSeries(demandList, function(demandOne, cb1){
                var demand_Obj =demandOne.toObject ? demandOne.toObject() : demandOne, driverOrderList=[];
                demand_Obj['amount_actual'] = 0;
                if(demand_Obj.product_categories){
                    _.each(demand_Obj.product_categories, function(a){
                        _.each(a.product_name, function(b){
                            if(!!b.amount_actual){
                                demand_Obj['amount_actual'] = config_common.rscDecimal('add', demand_Obj['amount_actual'], b.amount_actual)
                            }
                        });
                    });
                }
                async.waterfall([
                    function(cb10){
                        //查询物流需求单下的司机订单
                        driverOrderSV.onlyList({
                            // find: {demand_id: demandOne._id.toString()},
                            find: cond,
                            select: 'supply_user_id amount status'
                        }, cb10);
                    }, function (orderList, cb10) {
                        async.eachSeries(orderList, function(orderOne, cb100){
                            var order_obj = orderOne.toObject();
                            //查询司机订单中的用户信息
                            driverDemandSV.getUserTruck(req, {user_id: orderOne.supply_user_id}, function(res, user){
                                order_obj = _.extend(order_obj, user);
                                driverOrderList.push(order_obj);
                                cb100();
                            })
                        }, cb10);
                    }
                ], function(){
                    demand_Obj['orderList'] = driverOrderList;
                    if(demand_Obj._id || driverOrderList.length>0){
                        driverDemandList.push(demand_Obj);
                    }

                    cb1();
                });
            }, cb);
        }
    ], function(err){
        if(err){
            callback('driver_order_error');
        }else{
            callback(null, driverDemandList);
        }
    });
};

/**
 * 1，通过总件数，分配产品内容; 2，清除将amount，count为0的数据
 * @param count
 * @param product
 * @returns {*}
 */
// var tf_countProduce = function(counts, product, products_remain){
//     var count; //总分配数[{category:'', count:''},{},...]
//     //product:[{category:'', detail:[{caizhi:'',number:[{guige:'', long:[{long:''},...]},...]},... ]}]
//     //product:[{"amount_unit" : 1.5, "count" : 100, "key" : "steel_gaoxian-ML08AI-Φ8-"},...]
//     //计算新的product_remain 、新的product 、剩余的product_remian 、
//     _.each(products_remain, function (x) {
//         var pro_arr = x.key.split('-');
//         count = _.filter(counts, function(x){return x.category == pro_arr[0];})
//     })
//
//     return product;
// };
// exports.tf_countProduce = tf_countProduce;

exports.offlineAdd = function (req, trade, obj, callback) {
    var tradeOrder=trade; //obj ={交易index, 物流公司名, 车辆指派信息}
    async.waterfall([
        function (cb) {
            //查询物流订单
            DB.getOne({find: {
                index_trade: tradeOrder.index,
                supply_company_name: obj.company_name,
                demand_company_id: req.decoded.company_id
            }}, cb);
        },
        function (order, cb) {
            if(!order){
                //生成新的物流订单
                var order = {
                    index: config_common.getOrderIndex(),
                    index_trade: tradeOrder.index,
                    demand_user_id: req.decoded.id,
                    demand_company_id: req.decoded.company_id,
                    demand_company_name: req.decoded.company_name,
                    supply_user_id: obj.userInfo._id,
                    supply_company_id: obj.companyInfo._id,
                    supply_company_name: obj.company_name,
                    company_sell_id: tradeOrder.payment_style=='FOB' ? tradeOrder.company_demand_id : tradeOrder.company_supply_id,//出厂价，采购方提货
                    company_buy_id: tradeOrder.payment_style=='FOB' ? tradeOrder.company_supply_id : tradeOrder.company_demand_id,

                    //付款方式
                    payment_choice: tradeOrder.att_payment[0],  //现有支付选择(现金，银兑，商兑) tradeOrder.att_payment[0]
                    payment_method: tradeOrder.att_settlement[0],  //现有支付方法(货到付款，款到付货，分期，信用) tradeOrder.att_settlement[0]
                    count_day_extension: tradeOrder.delay_day[0],     //延期天数 delay_day
                    ref_day_extension: tradeOrder.delay_type[0],       //延期计算标准 delay_type
                    percentage_advance: tradeOrder.percent_advance[0],      //预付款百分比 tradeOrder.percent_advance[0]
                    percentage_remain: '',      //预付款百分比
                    //细则
                    att_traffic: {
                        "one" : [
                            "1",
                            0, //tradeOrder.path_loss[0]
                            0  //tradeOrder.path_loss[1]
                        ],
                        "two" : [
                            "0",
                            "0"
                        ]
                    },
                    weigh_settlement_style: config_common.trade_att_traffic[ tradeOrder.att_traffic[0] ],		  //重量结算方式 tradeOrder.att_traffic[0]
                    time_settlement_style: '',		  //时间结算方式
                    //两方物流新增字段
                    // location_arrival: trafficDemand.location_arrival,
                    // location_depart: trafficDemand.location_depart,
                    send_address_id: tradeOrder.send_address_id,
                    send_company_name: tradeOrder.send_company_name,                  //发送方名字
                    send_name: tradeOrder.send_name,                  //发送方名字
                    send_phone: tradeOrder.send_phone,                  //发送方电话
                    send_province: tradeOrder.send_province,               //省
                    send_city: tradeOrder.send_city,               //市
                    send_district: tradeOrder.send_district,               //区
                    send_addr: tradeOrder.send_addr,               //详细
                    send_loc: tradeOrder.send_location,    //20170531
                    
                    receive_address_id: tradeOrder.receive_address_id,
                    receive_loc: tradeOrder.receive_location,   //20170531
                    receive_company_name: tradeOrder.receive_company_name,                  //接收方名字
                    receive_name: tradeOrder.receive_name,                  //接收方名字
                    receive_phone: tradeOrder.receive_phone,                  //接收方电话
                    receive_province: tradeOrder.receive_province,               //省
                    receive_city: tradeOrder.receive_city,               //市
                    receive_district: tradeOrder.receive_district,               //区
                    receive_addr: tradeOrder.receive_addr,               //详细
                    //发票信息
                    
                    //时间

                    time_depart: req.body.time_depart,//tradeOrder.time_depart,
                    time_creation: new Date(),
                    time_update_step: new Date(),
                    //辅助
                    quality_origin: tradeOrder.att_quality[0], //质检方 tradeOrder.att_quality[0]
                    appendix: '',
                    source: config_common.demand_source.traffic_temp, //20171101
                    status: (!tradeOrder.send_add_name && !tradeOrder.receive_add_name) ? 'complete' : 'effective',
                    step: (!tradeOrder.send_add_name && !tradeOrder.receive_add_name) ? 5 : 3,
                    offer_id: '',
                    section: '',  //区间
                    end_section: '',  //区间
                    demand_id: '',
                    replenish:{
                        products_replenish:	[],
                        replenish_price:	'0',
                        replenish_count:	'0',
                        replenish_amount:	'0'
                    },
                    time_sort: config_common.getYearMonth(new Date()).monthStr,                    
                    send_nickname: tradeOrder.send_add_name,
                    receive_nickname: tradeOrder.receive_add_name
                };
                // order.step = (function () {
                //     var value = (!tradeOrder.send_add_name && !tradeOrder.receive_add_name) ? 5 : 3;
                //    
                //     return value;
                // })()
                order.product_categories = config_common.product_categories_construct(obj.product_categories); //商品目录
                var convertProduce = config_common.products_catelog(order.product_categories);
                order.amount = convertProduce.amount;
                order.price_total = convertProduce.price_total;
                order.price_max = _.max(convertProduce.price_arr); //价格区间
                order.price_min = _.min(convertProduce.price_arr); //价格区间
                if(req.body.time_arrival){
                    ordertime_arrival = req.body.time_arrival;//tradeOrder.time_arrival,
                }
                _.extend(order, {
                    //产品详情
                    // product_categories: obj.product_categories,//[],//tradeOrder.product_categories,
                    products_replenish: tradeOrder.replenish,
                    // material: tradeOrder.product_categories[0]['material'],
                    category: '',
                    category_chn: '',
                    catalogue: '',
                    products_remain: [],//config_common.products_remain_construct(tradeOrder.product_categories, 'number')
                    // amount:
                });
                DB.add(order, cb);
            }else{
                cb(null, order, 1);
            }
        },
        function (order, count, cb) {
            extServer.storeServerOrderTrafficAdd({
                order_id: order._id.toString(),
                send_address_id: order.send_address_id,
                receive_address_id: order.receive_address_id,
                index_trade: order.index_trade,
                amount: order.amount,
                user_id: order.supply_user_id,
                company_id: order.supply_company_id
            });
            cb(null, order, count);
            
        }
    ], callback)
};

//单独处理统计
exports.specialCount = function (req, callback) {

    req.body.status = 'all'; req.body.find_role = 'user';
    var orderstatus={ineffective: 0, effective: 0, complete: 0, cancelled:0, money: 0}, cond={}, tipCond={}, match={}, group={};
    async.waterfall([
        function (cb) {
            if(config_common.accessRule.pass.indexOf(req.decoded.role) == -1 &&
                req.decoded.role != config_common.user_roles.TRADE_ADMIN &&
                req.decoded.role != config_common.user_roles.TRADE_SALE &&
                req.decoded.role != config_common.user_roles.TRADE_PURCHASE){
                return cb({dev: '仅限交易和物流', pro: '000002'});
            }
            if(!req.body.status || !req.body.find_role || !config_common.find_role[req.body.find_role]){
                return cb({dev: 'status参数有误', pro: '000003'});
            }
            //    condition aggregate
            if(config_common.accessRule.pass.indexOf(req.decoded.role) > -1){
                if(req.body.find_role=='company'){
                    cond.supply_company_id = req.decoded.company_id[0];
                }else{
                    cond.supply_user_id = req.decoded.id;
                    // 获取自己的合同额, start
                    if(req.body.search_company){
                        cond.demand_company_id = req.body.search_company;
                    }
                    group = {_id: '$supply_user_id', sum: {$sum: '$price_total'}};
                    //end
                }
                tipCond = {
                    user_id: req.decoded.id,
                    company_id: req.decoded.company_id[0],
                    other_company_id: req.decoded.company_id[0]
                };
                cb();
            }
            if(req.decoded.role == config_common.user_roles.TRADE_ADMIN || req.decoded.role == config_common.user_roles.TRADE_SALE || req.decoded.role == config_common.user_roles.TRADE_PURCHASE){
                if(req.body.find_role=='company'){
                    cond.demand_company_id = req.decoded.company_id;
                }else{
                    cond.demand_user_id = req.decoded.id;
                    //交易角色, 查看自己的合同额 start
                    if(req.body.search_company){
                        cond.supply_company_id = req.body.search_company;
                    }
                    group = {_id: '$demand_user_id', sum: {$sum: '$price_total'}};
                    //end
                }
                tipCond = {
                    user_id: req.decoded.id,
                    company_id: req.decoded.company_id,
                    other_company_id: req.decoded.company_id
                };
                cb();
            }

        },
        function (cb) {
            extServer.tipPassOrder(tipCond, false, null, req.decoded.role, cb);
        },
        function(condRes, cb){
            if(condRes){
                cond.time_update_step = {$lte: condRes.update_time};
            }
            if(req.body.status == 'all'){
                DB.group({
                    match: cond,
                    group: {_id: '$status', num: { $sum: 1 }}
                }, cb);
            }else{
                if(!config_common.demand_status[req.body.status]){
                    return cb({dev: 'status值超出范围', pro: '000003'})
                }
                cond.status = config_common.demand_status[req.body.status];
                DB.getCount(cond,cb)
            }
        },
        function(statisRes, cb){
            if(req.body.status == 'all'){
                _.each(statisRes, function(status){
                    orderstatus[status._id] = status.num;
                });
                cb(null, orderstatus);
            }else{
                cb(null, statisRes);
            }
        },
        function(statisRes, cb){
            DB.group({
                match: cond,
                group: group
            }, function (err, res_money) {
                if(res_money.length>0){
                    statisRes['money'] = res_money[0]['sum'];
                }
                cb(null, statisRes);
            });
        }
    ], callback);
};

exports.specialList = function(data, callback, req){
    //
    var result = {count: 0, lists: [], exist: false}, user_cond= {};
    //
    async.waterfall([
        function (cb) {
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
            async.eachSeries(lists.orders, function (list, cb1) {
                user_cond.user_id = config_common.accessRule.pass.indexOf(req.decoded.role) > -1? list.supply_user_id : list.demand_user_id;
                extServer.userFind(user_cond, function(err, user){
                    result.lists.push( _.extend(list, user||{}) );
                    cb1();
                });
            }, function () {
                cb(null, result)
            });
        }
    ], function (err) {
        if(err){
            return callback(err);
        }
        callback(null, result);
    });

};
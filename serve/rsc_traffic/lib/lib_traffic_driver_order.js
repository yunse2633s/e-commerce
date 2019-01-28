/**
 * by Administrator 20170410
 */
var async = require('async');
var http = require('../lib/http');
var util = require('../lib/util');
var _ = require('underscore');
var config_api_url = require('../configs/config_api_url');
var config_common = require('../configs/config_common');
var DB = require('../dbs/db_base')('TrafficDriverOrder');
var orderDB = require('../dbs/db_base')('TrafficOrder');
var driverDemandDB = require('../dbs/db_base')('TrafficDriverDemand');
var extServer = require('../lib/lib_ext_server');
var config_msg_template = require('../configs/config_msg_template');
var infoPriceSV=require('../lib/lib_info_price');
/**
 * 增删改查
 */
exports.add = function(data,callback){
    DB.add(data,callback);
};
//删除记录
exports.del = function(data,callback){
    DB.del(data,callback);
};

//依据条件修改原表数据
exports.edit = function(data,callback){
    DB.edit(data,callback);
};

//依据条件查询单个表详情
exports.getOne = function(data, callback){
    DB.getOne(data,callback);
};

/**
 * 扩展
 */
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
//批量编辑
exports.editList = function(data,callback){
    DB.edit(data,callback);
};
//批量更新
exports.updateList = function(data,callback){
    DB.update(data,callback);
};
exports.onlyList = function(data,callback){
    DB.getList(data,callback);
};
exports.onlyAdd = function(data,callback){
    DB.add(data,callback);
};
//相似检查
exports.check=function(){

};
//统计
exports.getAggregate = function(data, callback){
    DB.group(data, callback);
};
exports.getOrderUserComp = function(req, demandOne, callback){
    var cond={} ;
    //司机看物管，物管看司机，物管看交易，交易看物管
    if(req.decoded){
        if(req.decoded.role == config_common.user_roles.TRAFFIC_DRIVER_PRIVATE){
            cond = {user_id: demandOne.demand_user_id}
        }else if( config_common.accessRule.pass.indexOf(req.decoded.role) > -1 ||
            req.decoded.role === config_common.user_roles.TRADE_STORAGE){
            //req.decoded.role === config_common.user_roles.TRAFFIC_ADMIN
            cond = demandOne.supply_user_id ? {user_id: demandOne.supply_user_id} : {user_id: demandOne.demand_user_id};
        }
        extServer.userFind(cond, function(err, user){

            // if(err){return callback(err);}
            demandOne = config_common.updateNumber(demandOne.toObject());
            demandOne = _.extend(demandOne, user || {}); //若user不存在则为{}
            callback(null, demandOne);
        });
    }else{
        callback(null, demandOne);
    }

};
//不含路耗计算
var weight_settlement_style =  function (order, product, type, style) {
    
    if(style.indexOf(order.weigh_settlement_style) != -1){
        var price_actual = config_common.getPriceActual(order, product, type);
        order.replenish['price_actual'] = !!order.replenish['price_actual'] ? config_common.rscDecimal('add', order.replenish['price_actual'] , price_actual, 2): price_actual;
    }
    order.markModified('replenish');
};
exports.weightSettlementStyle = weight_settlement_style;

var trade_price_actual = function(req, tradeIndex, product, style){
    extServer.generalFun(req, {
        source: 'trade',
        db:'DemandOrder',
        method:'getOne',
        query:{
            find: {
                index: tradeIndex
            },
            select: 'index att_traffic'
        }}, function (err, tradeOrder) {
            if(tradeOrder && style.indexOf(tradeOrder.att_traffic[0]) != -1){
                var trade_price_actual = config_common.getPriceActual(tradeOrder, product, 'trade');
                http.sendTradeServerNew(req, {
                    'index': tradeIndex,
                    price_actual:  trade_price_actual
                }, config_api_url.trade_order_update, function(err){
                });
            }
        
    })
};
exports.tradePriceActual = trade_price_actual;
//路耗计算
exports.consumePrice = function(s, r, p, c, cp){
    // 合理损耗 = 提货 * 合理损耗% ;
    // 损耗扣款 = (提货- 交货 - 合理损耗) * 扣款单价
    // × 结算价 = 提货价- 损耗价 = 提货*订单单价 - （提货 - 提货*合理损耗%）*扣款单价 = 提货（订单单价-（1-合理损耗%）*扣款单价）
    // √ 结算价 = 理论价 - 损耗价
    var send = s, receive = r, price_total = p, consume = c || 0, cutPrice = cp || 0, price_actual=0;
    var rational_consume = config_common.rscDecimal('mul', send, consume);
    var actual_consume = config_common.rscDecimal('sub', send, receive);
    if(actual_consume<=rational_consume){
        price_actual = config_common.rscDecimal('mul', send, price, 2);
    }else{
        // price_actual = config_common.rscDecimal('mul', send, config_common.rscDecimal('sub', price, config_common.rscDecimal('mul', cutPrice, config_common.rscDecimal('sub', 1, consum))));
        price_actual = config_common.rscDecimal('sub', price_total, config_common.rscDecimal('mul', cutPrice, config_common.rscDecimal('sub', actual_consume, rational_consume)), 2);
    }
    return price_actual;
};
//补货发生后的 司机订单，物流订单，交易订单发生改变
exports.replenishCalculate = function (order_id, replenish, prefix, callback, weighAmount) {
    // ①只有提货仓库，提货发生补货则将数量、总量、价格累计到订单中
    // ②只有交货仓库, 交货发生补货则将数量、总量、价格累计到订单中
    // ③有提交货仓库，按订单货运细则累计提货或交货仓库的补货信息;
    // ④没有提交货仓库，发生补货时则累计补货信息
    var products_replenish = replenish, prefix = prefix || '';
    var driverOrder, trafficOrder, replenish_amount,replenish_count,replenish_price_unit,pass_replenish_price_unit,replenish_price, pass_replenish_price;
    async.waterfall([
        function (cb1) {
            // 查询司机订单 是否有提、交货仓库，
            DB.getOne({find: {_id: order_id}}, cb1);
        }, function (order, cb1) {
            driverOrder = order;
            driverOrder.amount_remain = config_common.rscDecimal('sub', driverOrder.amount_remain, weighAmount);
            //司机运输价格
            replenish_price_unit = driverOrder.price;//司机价格为price_avg; (_.pluck(req.body.products_replenish, 'pass_price'))[0];
            //补货重量
            replenish_amount = config_common.getProductTotal(products_replenish, prefix + 'amount', 3);
            //补货数量
            replenish_count = config_common.getProductTotal(products_replenish, prefix + 'number', 0);
            //司机补货产生的金额
            replenish_price = config_common.rscDecimal('mul', replenish_amount, replenish_price_unit, 2);
            //司机总吨数增加补货量
            driverOrder.amount = config_common.rscDecimal('add', driverOrder.amount, replenish_amount);
            //司机总剩余增加补货量
            driverOrder.amount_remain = config_common.rscDecimal('add', driverOrder.amount_remain, replenish_amount);
            //司机总金额增加补货金额
            driverOrder.price_total = config_common.rscDecimal('add', driverOrder.price_total, replenish_price);

            driverOrder['replenish']['replenish_price'] = config_common.rscDecimal('add', driverOrder['replenish']['replenish_price'], replenish_price, 2);
            driverOrder['replenish']['replenish_count'] = config_common.rscDecimal('add', driverOrder['replenish']['replenish_count'], replenish_count, 0);
            driverOrder['replenish']['replenish_amount'] = config_common.rscDecimal('add', driverOrder['replenish']['replenish_amount'], replenish_amount);
            driverOrder.markModified('replenish');
            driverOrder.time_update_step = new Date();
            driverOrder.save(cb1);
        }, function (order, count, cb1) {
            orderDB.getOne({find: {_id: order.order_id, status: config_common.demand_status.effective}}, cb1)
        }, function (order, cb1) {
            if(!order){
                return callback();
            }
            trafficOrder = order;
            //物流运输价格
            pass_replenish_price_unit = (_.pluck(products_replenish, 'pass_price'))[0]; // 物流价格
            //物流补货产生的金额
            pass_replenish_price = config_common.rscDecimal('mul', replenish_amount, pass_replenish_price_unit, 2); //物流补货价格
            //总吨数
            trafficOrder.amount = config_common.rscDecimal('add', trafficOrder.amount, replenish_amount);
            //总价格
            trafficOrder.price_total = config_common.rscDecimal('add', trafficOrder.price_total, pass_replenish_price);
            //补货详情，总重，总数，总价
            trafficOrder['replenish']['products_replenish'].push(products_replenish[0]);
            trafficOrder['replenish']['replenish_amount'] = config_common.rscDecimal('add', driverOrder['replenish']['replenish_amount'], replenish_amount);
            trafficOrder['replenish']['replenish_count'] = config_common.rscDecimal('add', driverOrder['replenish']['replenish_count'], replenish_count, 0);
            trafficOrder['replenish']['replenish_price'] = config_common.rscDecimal('add', driverOrder['replenish']['replenish_price'], pass_replenish_price, 2);
            trafficOrder.markModified('replenish');
            trafficOrder.time_update_step = new Date();
            trafficOrder.save(cb1);
        }, function (order, count, cb1) {
            if(!order.index_trade){
                return callback();
            }
            http.sendTradeServerNew({}, {
                'index': order.index_trade, //交易订单id,
                'replenishCar': products_replenish[0],
                'amount': replenish_amount
            }, config_api_url.trade_replenish, function (err, result) {
                cb1()
            });
        }
    ], callback);
};
//提交货影响 物流订单、司机需求单
exports.storeTouchList = function (req, obj, callback) {
    // obj = {order_id : '', demand_id : '', product_categories : '', passRule : '', tradeRule : ''}
    async.waterfall([
        function (cb) {
            //修改物流订单
            orderDB.getOne({
                find: {_id: obj.order_id}
            }, function (err, trafficOrder) {
                if (err || !trafficOrder) {
                    return callback();
                }
                //交易订单: 计算提货价格,查询交易订单结算方式,计算传值;
                if(trafficOrder.index_trade){
                    trade_price_actual(req, trafficOrder.index_trade, obj.product_categories, obj.tradeRule);//['pick_up', 'path_loss']
                }
                //修改物流订单
                trafficOrder.time_update_step = new Date();
                //若是提货，则计算物流订单的提货价格
                weight_settlement_style(trafficOrder, obj.product_categories, 'pass', obj.passRule);//['get', 'theory']
                trafficOrder.save(function () {
                    cb();
                });
            });
        }, function (cb) {
            //司机需求单中增加，实际提交货数量; 若多次
            driverDemandDB.getOne({
                find: {_id: obj.demand_id}
            }, function (err, driverDemand) {
                //若是提货结算，则记录提货吨数['get', 'theory']
                if (driverDemand && obj.passRule.indexOf(driverDemand.weigh_settlement_style) != -1){
                    driverDemand.product_categories = config_common.storeProductTodriverDemand(obj.product_categories, driverDemand.product_categories);
                    driverDemand.markModified('product_categories');
                    driverDemand.save(function (){
                        cb();
                    });
                }else{
                    cb();
                }
                
            });
        }
    ], callback)
};
//线路找车
exports.offlineAdd = function (req, obj, trafficOrder, callback) {
  async.waterfall([
      function (cb) {
          driverOrder = {
              index: config_common.getDriverOrderIndex(),
              demand_id: '',
              order_id: trafficOrder._id,
              demand_user_id: trafficOrder.supply_user_id,
              demand_company_id: trafficOrder.supply_company_id,
              supply_user_id: obj.userInfo._id, //req.decoded.id,
              truck_id: obj.truckInfo._id,
              truck_weight: obj.truck_weight,
              role: obj.userInfo.role,
              material: trafficOrder.material,
              material_chn: config_common.material[trafficOrder.material],
              price: obj.price || 1,
              product_categories: obj.product_categories,
              products_replenish: trafficOrder.products_replenish,//[], 补货信息
              //支付方式
              payment_choice: trafficOrder.payment_choice,          //现有支付选择(现金，银兑，商兑)
              payment_method: trafficOrder.payment_method,          //现有支付方法(货到付款，款到付货，分期，信用)
              count_day_extension: trafficOrder.count_day_extension,    //延期天数
              time_day_extension: trafficOrder.time_day_extension,       //实际还款天数
              ref_day_extension: trafficOrder.ref_day_extension,      //延期计算标准
              percentage_advance: trafficOrder.percentage_advance,     //预付款百分比
              percentage_remain: trafficOrder.percentage_remain,      //中款百分比

              weigh_settlement_style: trafficOrder.weigh_settlement_style,  //重量结算方式
              time_settlement_style: trafficOrder.time_settlement_style,   //时间结算方式
              att_traffic: trafficOrder.att_traffic, //物流细则
              appendix: trafficOrder.appendix,                 //备注
              quality_origin: trafficOrder.quality_origin, //质检方

              //出发地 ，到达地
              send_address_id: trafficOrder.send_address_id,
              send_name: trafficOrder.send_name,
              send_phone: trafficOrder.send_phone,
              send_province: trafficOrder.send_province,
              send_city: trafficOrder.send_city,
              send_district: trafficOrder.send_district,
              send_addr: trafficOrder.send_addr,
              send_loc: trafficOrder.send_loc,
              receive_address_id: trafficOrder.receive_address_id,
              receive_name: trafficOrder.receive_name,
              receive_phone: trafficOrder.receive_phone,
              receive_province: trafficOrder.receive_province,
              receive_city: trafficOrder.receive_city,
              receive_district: trafficOrder.receive_district,
              receive_addr: trafficOrder.receive_addr,
              receive_loc: trafficOrder.receive_loc,
              //时间
              time_depart: trafficOrder.time_depart,
              
              time_creation: new Date(),
              time_update_step: new Date(),
              status: (!trafficOrder.send_nickname && !trafficOrder.receive_nickname) ? 'complete' : 'effective',
              // step: (!trafficOrder.send_nickname && !trafficOrder.receive_nickname) ? 5 : 1,
              source: config_common.demand_source.driver_temp,
              replenish:{
                  products_replenish:   [],
                  order_loading:    [],
                  order_unloading:  [],
                  price_send_sub: '0',
                  price_receive_sub:  '0',
                  replenish_price:    '0',
                  replenish_count:    '0',
                  replenish_amount:   '0',
                  truck_phone: obj.truck_phone,
                  truck_long:'', //车辆长度，
                  truck_type:'', //车辆类型，
              },
              time_sort: config_common.getYearMonth(new Date()).monthStr,
              demand_user_name: trafficOrder.supply_user_name,
              demand_company_name: trafficOrder.supply_company_name,
              supply_user_name: obj.user_name,
              truck_num: obj.truck_num,
              lading_code: '',
              catalogue: '',
              section: '',  //区间
              end_section: '',  //区间
              tip_price: '', //信息费
              send_nickname: trafficOrder.send_nickname,
              receive_nickname: trafficOrder.receive_nickname,
          };
          driverOrder.step = (function () {
                var value = (!trafficOrder.send_nickname && !trafficOrder.receive_nickname) ? 5 : 1;
                if(!trafficOrder.send_nickname && trafficOrder.receive_nickname){
                 value = 3;
                }
              return value;
          })();
          if(trafficOrder.time_arrival){
              driverOrder.time_arrival = trafficOrder.time_arrival;
          }
          driverOrder.category = (_.uniq(_.pluck(obj.product_categories, 'layer_1'))).join(',');
          driverOrder.category_chn = (_.uniq(_.pluck(obj.product_categories, 'layer_1_chn'))).join(',');
          driverOrder.amount = driverOrder.amount_remain = config_common.getAmountTheory(obj.product_categories); //获取理论吨数 //0;//
          driverOrder.products_remain = [];//config_common.products_remain_construct(obj.product_categories, 'number');
          DB.add(driverOrder, cb);
      },
  ], callback);
};

//订单统计
exports.specialCount = function (req, callback) {
    // req.decoded.role != config_common.user_roles.TRAFFIC_ADMIN
    if (config_common.accessRule.pass.indexOf(req.decoded.role) == -1 && req.decoded.role != config_common.user_roles.TRAFFIC_DRIVER_PRIVATE) {
        return callback({dev: '仅限物流和司机', pro: '000002'});
    }
    // req.body.status = req.body.status || 'all';
    var cond = {}, tipCond = {}, group = {}, tipCond;

    // if (req.decoded.role == config_common.user_roles.TRAFFIC_ADMIN) {
    if (config_common.accessRule.pass.indexOf(req.decoded.role) > -1) {
        cond.demand_user_id = req.decoded.id;
        //统计订单额 start
        if (req.body.search_company) {
            cond.supply_user_id = req.body.search_company;
        }
        group = {_id: '$demand_user_id', sum: {$sum: '$price_total'}};
        tipCond = {
            user_id: req.decoded.id,
            company_id: req.decoded.company_id[0],
            other_company_id: req.decoded.company_id[0],
            type: config_common.tip_type.driver_order
        }
    }
    if (req.decoded.role == config_common.user_roles.TRAFFIC_DRIVER_PRIVATE) {
        cond.supply_user_id = req.decoded.id;
        //统计订单额 start
        if (req.body.search_company) {
            cond.demand_company_id = req.body.search_company;
        }
        group = {_id: '$supply_user_id', sum: {$sum: '$price_total'}};
        //end
        tipCond = {
            user_id: req.decoded.id,
            type: config_common.tip_type.driver_order
        }
    }
    //    execute
    var orderstatus = {
        ineffective: '0',
        effective: '0',
        complete: '0',
        cancelled: '0',
        money: '0',
        send: '0',
        receive: '0',
        tip: '0',
    };
    async.waterfall([
        function (cb1) {
            DB.group({
                match: cond,
                group: {_id: '$status', num: {$sum: 1}}
            }, cb1);
        }, 
        function (statisRes, cb1) {
            _.each(statisRes, function (status) {
                orderstatus[status._id] = status.num;
            });
            cond['status'] = config_common.demand_status.effective;
            cond['step'] = 0.5;
            DB.getCount(cond, cb1);
        },
        function (count, cb1) {
            orderstatus['tip'] = count || 0;
            cond['step'] = {$gte:2, $lt: 2.5};
            DB.getCount(cond, cb1);
        }, 
        function (count, cb1) {
            orderstatus['send'] = count || 0;
            cond['step'] = {$gte: 2.5, $lt: 5};
            DB.getCount(cond, cb1);
        }, 
        function (count, cb1) {
            orderstatus['receive'] = count || 0;
            delete(cond['step']);
            cond['status'] ={$nin: [config_common.demand_status.cancelled]};
            DB.group({
                match: cond,
                group: group
            }, function (err, res_money) {
                if (res_money && res_money.length > 0) {
                    orderstatus['money'] = res_money[0]['sum'].toFixed('2');
                    cb1(null, orderstatus);
                }else{
                    cb1(null, orderstatus);
                }
            })
        }
    ], callback);
};

//司机提货，费用转账到物流
exports.payTipToBuy = function (req, orderId, callback) {
    async.waterfall([
        function (cb) {
            DB.getOne({find: {_id: orderId}}, cb)
        },
        function(order, cb){
            http.sendPayServerNew(req, {
                orderNo : order.tip_price_id,
                // order_id: order._id.toString(),
                receivablesProducts: 'information_income', //'information_expenditure',
                role: {$in: config_common.accessRule.pass},
            }, config_api_url.pay_information_recharge, function (err, result) {
                if(result){
                    order['replenish']['pay_tip_to_buy'] = true;
                    order.markModified('replenish');
                    order.save(function (err, driver) {
                        cb(null, driver)
                    })
                }else{
                    cb(err,null)
                }
            })
        },
        function (result, cb) {
            if(result){
                infoPriceSV.disCountAdd(req, result, function(x,y){
                    console.log('记账', x, y)
                });
                extServer.push(req, {
                    title: '信息费到帐',
                    content: config_msg_template.encodeContent('tip_price_input', [result.supply_user_name, result.truck_num, result.tip_prices]),
                    user_ids: [result.demand_user_id]
                }, {}, '', {
                    params: {
                        id: result._id.toString(),
                        source: 'buy_transit'
                    },
                    url: config_common.push_url.finance_index
                }, cb);
            }else{
                cb();
            }
        }
    ], callback)
}

//提货记录
exports.libraLoading = function (req, order_id, amount_send_start, amount_send_end, amount, callback) {
    async.waterfall([
        function (cb) {
            DB.getOne({
                find: {
                    _id: order_id,
                }
            }, cb);
        },
        function(driverOrder, cb){
            driverOrder.time_update_step = new Date();
            //多次补货
            driverOrder.amount_send_sub = !!driverOrder.amount_send_sub ? config_common.rscDecimal('add', driverOrder.amount_send_sub, amount) : amount;//Number(req.body.amount);//amount 和 product_categories中的吨数不符
            // 修改 product_categories 中的提交货剩余数

            driverOrder['replenish']['order_loading'].push({
                products_replenish:  [],
                product_categories: driverOrder.product_categories,
                amount_send_start: amount_send_start,
                amount_send_end: amount_send_end,
                amount: amount,
                amount_remain: config_common.rscDecimal('sub', driverOrder.amount, driverOrder.amount_send_sub),
                loading_time: new Date(),
                libra_id: driverOrder.libra_id
            });

            driverOrder['replenish']['price_send_sub'] = config_common.rscDecimal('add', driverOrder['replenish']['price_send_sub'], config_common.rscDecimal('mul', driverOrder.price, amount), 2);
            // 过磅记录,依据过磅情况计算订单实际费用

            if(['get', 'theory'].indexOf(driverOrder.weigh_settlement_style) != -1){
                var price_actual = config_common.rscDecimal('mul', driverOrder.price, amount, 2); //config_common.getPriceActual(order, product, type);
                driverOrder.replenish['price_actual'] = !!driverOrder.replenish['price_actual'] ? config_common.rscDecimal('add', driverOrder.replenish['price_actual'] , price_actual, 2): price_actual;
            }

            driverOrder.markModified('replenish');
            driverOrder.step = 2.5;
            driverOrder.amount_send_start = 0;
            driverOrder.amount_send_end = 0;
            driverOrder.libra_id = '';
            driverOrder.libra_amount = 0;
            driverOrder.save(cb)
        }
    ], callback)
}
//交货记录
exports.libraUnLoading = function (req, order_id, amount_send_start, amount_send_end, amount, callback) {
    async.waterfall([
        function (cb) {
            DB.getOne({
                find: {
                    _id: order_id,
                }
            }, cb);
        },
        function (order, cb) {
            order.amount_receive_sub = !!order.amount_receive_sub ? config_common.rscDecimal('add', order.amount_receive_sub, amount) : amount;
            // 修改 product_categories 中的交货剩余数
            order['replenish']['price_receive_sub'] = config_common.rscDecimal('add', order['replenish']['price_receive_sub'], config_common.rscDecimal('mul', order.price||1, amount), 2);
            order['replenish']['order_unloading'].push({
                product_categories: order.product_categories,
                amount_send_start: amount_send_start, //parseFloat(c.toFixed(p))
                amount_send_end: amount_send_end,
                amount: amount,
                amount_remain: config_common.rscDecimal('sub', order.amount, order.amount_receive_sub),
                loading_time: new Date(),
                libra_id: order.libra_id
            });

            if(['fact'].indexOf(order.weigh_settlement_style) != -1){
                var price_actual = config_common.rscDecimal('mul', driverOrder.price, amount, 2); //config_common.getPriceActual(order, product, type);
                driverOrder.replenish['price_actual'] = !!driverOrder.replenish['price_actual'] ? config_common.rscDecimal('add', driverOrder.replenish['price_actual'] , price_actual, 2): price_actual;
            }
            order.markModified('replenish');
            order.step = 3.5; //20171120
            order.amount_send_start = 0;
            order.amount_send_end = 0;
            order.libra_id = '';
            order.libra_amount = 0;
            order.save(cb)
        }
    ], callback)
}

exports.specialList = function(data, callback, req){
    var result = {lists: [], exist: false, count: 0}, user_cond={};
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
        }, 
        function (lists, cb) {
            result.exist = lists.exist;
            result.count = lists.count;
            if(!req.decoded){
                cb(null, result);
            }else{
                async.eachSeries(lists.orders, function (demandOne, cb1) {
                    user_cond.user_id = req.decoded.role == config_common.user_roles.TRAFFIC_DRIVER_PRIVATE ? demandOne.demand_user_id : demandOne.supply_user_id;
                    extServer.userFind(user_cond, function(err, user){
                        result.lists.push( _.extend(demandOne, user || {}) ); //若user不存在则为{}
                        cb1();
                    });
                }, cb)
            }
        }
    ], function () {
        callback(null, result);
    })
};
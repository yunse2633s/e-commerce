var mongoose = require('mongoose');
var _ = require('underscore');
var config_server = require('../configs/config_server');
var config_common = require('../configs/config_common');
var fs = require('fs');

var config_api_url = require('../configs/config_api_url');
var async = require('async');
var db = require('../dbs/db_base')('TrafficDemand');
var planDB = require('../dbs/db_base')('TrafficPlan');
var orderDB = require('../dbs/db_base')('TrafficOrder');

var driverDemandDB = require('../dbs/db_base')('TrafficDriverDemand');
var driverPlanDB = require('../dbs/db_base')('TrafficDriverPlan');
var driverOrderDB = require('../dbs/db_base')('TrafficDriverOrder');
var redCardOrderDB=require('../dbs/db_base')('RedCardOrder');
var lineDB = require('../dbs/db_base')('TrafficLine');
var userDB = require('../dbs/db_base')('User');

var http=require('../lib/http');
var extServer = require('../lib/lib_ext_server');
var lib_msg = require('../lib/lib_msg');
var trafficPushSV = require('../lib/lib_traffic_push');
var infoPriceSV=require('../lib/lib_info_price');

//
mongoose.Promise = global.Promise;
console.log('config_server.mongodb', config_server.mongodb)
// mongoose.connect('mongodb://rscdba:a11111@101.200.0.196:27040/rsc_cppcc');
mongoose.connect(config_server.mongodb);

mongoose.connection.on('connected',function() {
    var date_string = new Date().toString();
    console.log('mongodb connection established: ' + date_string);
});

mongoose.connection.on('error',function() {
    var date_string = new Date().toString();
    console.log('mongodb error: ' + date_string + '. Closing....');
    mongoose.connection.close();
});

// var db = require('../dbs/db_price_ask');
// console.log('db',db)
/**
db.getById({find:'58df45ffa420d715e855e278',select:'index user_id '},function(err,res){
    console.log('err',err)
    console.log('res',res)
})
*/
/**
db.group({match:{}, group:{_id: '$company_id', total: {$sum: 1}}},function(err, res){
    console.log('err',err);
    console.log('res',res);
});
 */
/**
db.getOne({find:{order_id:'58eaf3653529511a0439f6a2'}} ,function(err,cc){
    console.log('cc',cc._id)
    var obj = cc.toObject();
    delete obj._id;
    delete obj.index;
    
    obj['order_id'] = obj['order_id'].slice(0,23)
    
    for(var i = 0 ;i<9;i++){
        obj['order_id']= obj['order_id']+i;
        obj['index'] = 'zdy2017041700000'+i;
        (function(){
            db.add(obj,function(e){console.log(i, e)})
        })()
    }
    // db.add(obj,function(e){
    //             console.log(e)
    //         })
    
})
 **/
/** 批量增加坐标
async.waterfall([
    function (cb) {
        db.getList({}, cb)
    }, function (lists, cb) {
        async.eachSeries(lists, function(list, cb1){
            async.waterfall([
                function (cb10) {
                    var data = {
                        address:[list.send_province+list.send_city+list.send_district , list.receive_province+list.receive_city+list.receive_district ]
                    };
                    http.sendAmapServer(data, '/geocode/geo', cb10)
                },function (loc, cb10) {
                    console.log('loc', loc);
                    list.send_loc = loc[0];
                    list.receive_loc = loc[1];
                    list.save(cb10);
                }
            ], cb1);
        });
    }
], function(err){
    console.log('err',err)
});
 **/
/**
db.getCount({}, function(err, cc){
    console.log(cc);
})
 **/
/** 批量物流订单，司机需求单， 司机订单
 * 
 **/
/**
async.waterfall([
    function (cb) {
        orderDB.getList({}, cb);
    },function (lists, cb) {
        console.log('lists', lists.length); 
        async.eachSeries(lists, function(list, cb1){
            async.waterfall([
                function (cb10) {
                    db.getOne({find:{_id: list.demand_id}}, cb10);
                },
                function (demand, cb10) {
                    console.log('addr', demand.send_loc, demand.receive_loc)
                        list.send_loc = demand.send_loc;
                        list.receive_loc = demand.receive_loc;
                    list.save();
                    cb10();
                }
            ], cb1);
        }, cb);
    }
], function(){});
 */
/**
 async.waterfall([
 function (cb) {
        driverDemandDB.getList({}, cb);
    },function (lists, cb) {
        async.eachSeries(lists, function(list, cb1){
            async.waterfall([
                function (cb10) {
                    orderDB.getOne({find:{_id: list.order_id}}, cb10);
                },
                function (demand, cb10) {
                        list.send_loc = demand.send_loc;
                        list.receive_loc = demand.receive_loc;
                    list.save(cb10);
                }
            ], cb1);
        }, cb);
    }
 ], function(){});
 */
/**
 async.waterfall([
 function (cb) {
        driverOrderDB.getList({}, cb);
    },function (lists, cb) {
        async.eachSeries(lists, function(list, cb1){
            async.waterfall([
                function (cb10) {
                    orderDB.getOne({_id: list.order_id}, cb10);
                },
                function (demand, cb10) {
                        list.send_loc = demand.send_loc;
                        list.receive_loc = demand.receive_loc;
                    list.save(cb10);
                }
            ], cb1);
        }, cb);
    }
 ], function(){});
 */
/**
 //  物流需求单 中订单量 批量修改
async.waterfall([
    function (cb) {
        db.getList({find:{}}, cb)
    }, function (lists, cb) {
        async.eachSeries(lists, function (list, cb1) {
            orderDB.getCount({demand_id: list._id.toString()}, function(err, count){
                list.order_count = count;
                list.save(cb1);
            })
        },cb);
    }
], function () {

});
 **/
/**
 // 测试_id : 为数组是的查询
async.waterfall([
    function (cb) {
        http.sendUserServerNew('', {
            cond: {find: {_id: '58ba689f293beba14de4a8ae'}, select:'real_name photo_url company_id role'},
            model: 'User_traffic',
            method: 'getOne',
        }, config_api_url.user_server_common, cb);
    }, function (user, cb) {
        console.log('use', user.company_id)
        http.sendUserServerNew('', {
            cond: {find: {_id: user.company_id}, select:'full_name nick_name url_logo verify_phase'},
            model: 'Company_traffic',
            method: 'getOne',
        }, config_api_url.user_server_common, function(err, cc){
            console.log('err', err, cc);
            cb();
        });
    }
], function(){

});
 **/
/**
 // 刷新司机需求单
 db.getCollection('trafficdriverdemands').update({time_creation:{$lt: new Date('2017-06-07')}}, {$set:{amount:100000,amount_remain:100000, status:'effective', time_validity: new Date('2017-07-01'), unoffer_list:[]}}, false, true)
 **/

//查询多个_id; mongoose可以不用使用ObjectId
// db.getList({
//     find: {_id: {$in: ['5954b676a410f030d8f004a9','5954b676a410f030d8f004a9']}},
//     select: 'company_trade_name'
// }, function (err, result) {
// console.log('err', err, result);
// })

//删除某单据
// db.del({_id:'5954b676a410f030d8f004a9'}, function (err, result) {
//     console.log('err', err, result);
// })
// db.update({find: {_id: '5976e0538f3cd5422d38f28d' }, set: {$set: {status:'cancelled'}}}, function (err, res) {
//  console.log('err', err, res.nModified);
// })

/**
 *  旧结构 转为 新结构;
 *  物流需求单列表， 物流订单列表， 司机需求单列表，司机订单列表
 *  <trafficDemand>
 *  products  --> product_categories
 *  user_id     -->
 *  company_id  -->
 *  company_trade_name  -->
 *  $ -->price_total
 *
 *  <trafficOrder>
 *  user_demand_id  ->
 *  company_demand_id   ->
 *  company_trade_name  ->
 *  user_traffic_id     ->
 *  company_traffic_id  ->
 *  company_traffic_name    ->
 *  products    ->
 *  price_unit  ->
 *  price_theory    ->
 *
 *  <driverDemand>
 * user_demand_id   ->
 * company_demand_id    ->
 * company_traffic_name     ->
 * products     ->
 *
 *  <driverOrder>
 *  user_demand_id  ->
 *  company_demand_id   ->
 *  user_supply_id  ->
 *  products    ->
 *  price   ->
 *  price_avg   ->
 *

console.log('trafficDemand---------->')

//物流需求单
async.waterfall([
    function (cb) {
        //
        db_copy.getList({}, cb)
    }, function (list, cb) {        
        async.eachSeries(list, function (listOne, cb1) {
            async.waterfall([
                function (cb2) {
                    //获取交易订单
                    extServer.generalFun({}, {
                        source: 'trade',
                        db:'DemandOrder',
                        method:'getOne',
                        query:{
                            find: {
                                index: listOne.index_trade,
                            }
                        }}, cb2);
                }, function (demandOrder, cb2) {
                    listOne.user_id = trafficeDemand.demand_user_id;
                    listOne.company_id = trafficeDemand.demand_company_id;
                    listOne.products = demandOrder.product_categories;
                    listOne.price_total = config_common.rscDecimal('mul',trafficeDemand.amount, trafficeDemand.price );
                    listOne.markModified('products');
                    listOne.save(cb2)
                }
            ], cb1);
        }, cb);
    }
], function (err, result) {
    console.log('err', err, result);
});
 */

//物流订单
/**
 * <trafficOrder>
 *  user_demand_id  ->
 *  company_demand_id   ->
 *  company_trade_name  ->
 *  user_traffic_id     ->
 *  company_traffic_id  ->
 *  company_traffic_name    ->
 *  products    ->
 *  price_unit  ->
 *  price_theory    ->
 *

console.log('trafficOrder---------->')
async.waterfall([
    function (cb) {
        //
        trafficOrder.getList({}, cb)
    }, function (list, cb) {
        async.eachSeries(list, function (listOne, cb1) {
            async.waterfall([
                function (cb2) {
                    //获取交易订单
                    trafficDemand.getOne({
                        find: {_id: listOne.demand_id}
                    }, cb2);
                }, function (demandDemand, cb2) {
                    listOne.demand_user_id = demandDemand.user_demand_id;
                    listOne.demand_company_id = demandDemand.company_demand_id;
                    listOne.company_company_name = demandDemand.company_trade_name;

                    listOne.supply_company_id = demandDemand.user_traffic_id;
                    listOne.supply_user_id = demandDemand.company_traffic_id;
                    listOne.supply_company_name = demandDemand.company_traffic_name;
                    listOne.price_total = demandDemand.price_theory;
                    listOne.products = demandDemand.product_categories;

                    listOne.markModified('products');
                    listOne.save(cb2)
                }
            ], cb1);
        }, cb);
    }
], function (err, result) {
    console.log('err', err, result);
});
 */
// 司机订单
/**
 * <driverDemand>
 * user_demand_id   ->
 * company_demand_id    ->
 * company_traffic_name     ->
 * products     ->

console.log('driverDemand---------->')
async.waterfall([
    function (cb) {
        //
        driverDemand.getList({}, cb)
    }, function (list, cb) {
        async.eachSeries(list, function (listOne, cb1) {
            async.waterfall([
                function (cb2) {
                    //获取交易订单
                    trafficOrder.getOne({
                        find: {_id: listOne.order_id}
                    }, cb2);
                }, function (trafficOrder, cb2) {
                    listOne.demand_user_id = listOne.user_demand_id;
                    listOne.demand_company_id = listOne.company_demand_id;
                    listOne.company_company_name = listOne.company_trade_name;

                    listOne.products = trafficOrder.product_categories;
                    listOne.markModified('products');
                    listOne.save(cb2)
                }
            ], cb1);
        }, cb);
    }
], function (err, result) {
    console.log('err', err, result);
});
 */
/**
 * <driverOrder>
 *  user_demand_id  ->
 *  company_demand_id   ->
 *  user_supply_id  ->
 *  products    ->
 *  price   ->
 *  price_avg   ->

console.log('driverOrder---------->')
async.waterfall([
    function (cb) {
        //
        driverOrder.getList({}, cb)
    }, function (list, cb) {
        async.eachSeries(list, function (listOne, cb1) {
            async.waterfall([
                function (cb2) {
                    //获取交易订单
                    driverDemand.getOne({
                        find: {_id: listOne.demand_id}
                    }, cb2);
                }, function (driverDemand, cb2) {
                    listOne.demand_user_id = listOne.user_demand_id;
                    listOne.demand_company_id = listOne.company_demand_id;
                    listOne.company_company_name = listOne.company_trade_name;
                    listOne.price_total = listOne.company_demand_id;
                    listOne.price = listOne.price_avg;

                    listOne.products = driverDemand.product_categories;
                    listOne.markModified('products');
                    listOne.save(cb2)
                }
            ], cb1);
        }, cb);
    }
], function (err, result) {
    console.log('err', err, result);
});
 */

/**
 * 物流订单中增加一个时间排序字段，用于统计 （可用于刷库）

var count = 0;
async.waterfall([
    function(cb){
        driverOrderDB.getList({}, cb);
        // OrderDB.getList({}, cb);
    }, function(list, cb){
        count = list.length;
        async.eachSeries(list, function(order, cb2){
            var timeFormat = new Date(order.time_creation);
            var sortTime = timeFormat.getFullYear()+'-'+(timeFormat.getMonth()+1);
            // console.log('年月',timeFormat+timeFormat.getFullYear()+(timeFormat.getMonth()+1) , (new Date(sortTime)))
            order.time_sort = sortTime;
            count--;
            order.save(cb2);
        }, cb);

    }
], function(err, result) {
    console.log('err', err, count)
});
 */

/**
 *  月份汇总+页面排序 
 *   期望结果: 将data_time中的数据按分配推送进sort_time中;

var sort_time= [{time:'2017', data:[]},{time:'2018', data:[]},{time:'2019', data:[]}];
var data_time = [{time:'2017', sort:1}, {time:'2018', sort:2}, {time:'2017', sort:3}, {time:'2017', sort:4}, {time:'2018', sort:5} ];

var data_time2 = _.filter(data_time, function (e) {
    return e.time=='2017'
});
// sort_time.forEach(function (a) {
    _.each(sort_time, function (a){
    var data =  _.filter(data_time, function (b) {
        return b.time == a.time
    })
    a.data = a.data.concat(data);
});
//每次分页都会重新计算第一次目录; 若 sort_time中元素data为空则移除;
sort_time = _.filter(sort_time, function (a) {
    return a.data.length > 0;
})

 */

/**
 *  物流订单数据按月份分类，且可以分页;

async.waterfall([
    function(cb){
        //按月分类统计数量
        orderDB.group({match: {}, group: {_id:'$sort_time', num: {$sum:1}} })
    }, function(cb){
        //按页码提供列表数据
    }, function (cb) {
        //数据处理
    }
], function(){});
 */

/**
 *  司机订单中增加 公司和司机名称, 车牌, demand_company_name, supply_user_name, truck_brand

async.waterfall([
    function (cb) {
        driverOrderDB.getList({}, cb);
    }, function (orderlist, cb) {
        async.eachSeries(orderlist, function(order, cb2){
            async.waterfall([
                function (cb3) {
                    // 物流
                    http.sendUserServerNew('', {
                        cond: {find: {_id: order.demand_user_id}, select:'phone photo_url real_name role company_id province city district'},
                        model: 'User_traffic',
                        method: 'getOne',
                    }, config_api_url.user_server_common, cb3);
                }, function (user, cb3) {
                    order['demand_user_name'] = user.real_name;
                    http.sendUserServerNew('', {
                        cond: {find: {_id: order.demand_company_id}, select:'nick_name url_logo verify_phase'},
                        model: 'Company_traffic',
                        method: 'getOne',
                    }, config_api_url.user_server_common, cb3);
                }, function(compInfo, cb3) {
                    order['demand_company_name'] = compInfo.nick_name;
                    // 司机
                    http.sendUserServerNew('', {
                        cond: {
                            find: {_id: order.supply_user_id},
                            select: 'phone photo_url real_name role company_id province city district'
                        },
                        model: 'User_traffic',
                        method: 'getOne',
                    }, config_api_url.user_server_common, cb3);
                }, function(user, cb3){
                    order['supply_user_name'] = user.real_name;
                        //获取车辆信息
                    http.sendUserServerNew('', {
                        cond: {find: {create_user_id: order.supply_user_id}, select:'long number type weight che_tou_zhao_url brand'},
                        model: 'Truck',
                        method: 'getOne'
                    }, config_api_url.user_server_common, cb3);

                }, function(compInfo, cb3){
                    order['truck_num'] = compInfo.number;
                    order.save(cb3())
                    
                }
            ], cb2);
        }, cb);
    }
], function (err, result) {
    console.log('err', err, result)
})
 */
//es6 for..of 
/**
 * 司机需求单修改
 * 赵恒星，回世磊 需要司机需求单用于测试;

var assign_user_id = '5934b9574d3a1f72404994ea'; // 手机号:18722222222
async.waterfall([
    function (cb) {
        driverDemandDB.getList({
            // find: {unoffer_list: {$in: [ assign_user_id ]}}
            find: {verify_driver: {$in: [ assign_user_id ]}}
        }, cb);
    }, function (list, cb) {
        console.log('getlist', list.length)
        async.eachSeries(list, function (demand, cb1) {
            //删除司机的接单记录
            driverPlanDB.del({demand_id: demand._id, user_id: assign_user_id}, function () {
                
            });
            //变更司机需求单的剩余吨数，剩余产品, *_company的记录
            demand.verify_driver.push(assign_user_id);
            demand.platform_driver = ['59b8deee444e7ba97ae56982'];
            demand.unoffer_list = [];
            demand.status = 'effective';
            demand.time_validity = new Date('2017/12/1');
            demand.amount_remain = demand.amount;
            demand.save(cb1)
        }, cb);
    }
], function (err,result) {
console.log('err', err);
})
 * */
/** 
 * 查看仓库id 
 * 
extServer.generalFun('', {
    source: 'user',
    db: 'Address',
    method: 'getList',
    query: {
        find: {user_ids: {$in: ['59c873f3b8bc5488b2f20b2c']}, type: {$exists: true}},
        select: 'user_ids'
    }
}, function (err, result) {
    result = _.pluck(result, '_id')
    
    console.log('err', err,result, typeof(result[0]))
});
 **/
/**
 * 司机订单修改
 * 赵恒星，回世磊 司机订单用于测试;

 var assign_user_id = '5934b9574d3a1f72404994ea'; // 手机: 18722222222
 async.waterfall([
 function (cb) {
        driverOrderDB.getList({
            // find: {unoffer_list: {$in: [ assign_user_id ]}}
            find: {supply_user_id: assign_user_id, time_creation: {$gt: new Date('2017/8/1')}}
        }, cb);
    }, function (list, cb) {
        console.log('getlist', list.length)
        async.eachSeries(list, function (order, cb1) {
            order.lading_code = config_common.getVerifyCode();
            order.send_address_id = '59c8becba1d60ba4fc41a11e';
            order.receive_address_id ='59c8becba1d60ba4fc41a11e';
            order.status = 'effective';
            order.step = 1;
            order.save(function (err, sta) {
                console.log('err', err)
                cb1();
            })
        }, cb);
    }
 ], function (err,result) {
console.log('err', err);
})
 * */
/**
 * 循环生成随机码

driverOrderDB.getList({
    find: {
        $or: [
            {send_address_id: {$in: ['59c8becba1d60ba4fc41a11e','']},
                receive_address_id: {$in: ['59c8becba1d60ba4fc41a11e', '59c8becba1d60ba4fc41a11e']}}
        ]
    },
    select: 'lading_code'
}, function (err, list) {
    var code = _.pluck(list, 'lading_code');
    var code_n = _.uniq(code);
    console.log('list', code.length, code_n.length)
})
 */
/**
 * 检查物流订单中 物流人员和物流公司id对应错误的数据。

async.waterfall([
    function (cb) {
        orderDB.getList({find:{}}, cb)
    }, function (list, cb) {
        async.eachSeries(list, function (one, cb2) {
            async.waterfall([
                function (cb3) {
                    extServer.generalFun('', {
                        source: 'user',
                        db: 'User_traffic',
                        method: 'getOne',
                        query: {
                            find: {_id: one.supply_user_id}
                        }
                    }, function (err, result) {
                        if(one.supply_company_id != result.company_id[0]){
                            console.log('用户与企业关系错位',one._id)
                        }
                    cb3()
                    });  
                }
            ], cb2);
        }, cb);
    }
],function (err, result) {
    console.log('err', err, result)
})
 */

/**
 * 单元仓 ，仓产品, 仓查询,
 * 物流订单中增加产品目录;

async.waterfall([
    function(cb){
        orderDB.getList({}, cb)
    }, function (lists, cb) {
        async.eachSeries(lists, function (list, cb1) {
            list.catalogue = config_common.getCatalogue(list.product_categories, 5,'')
            list.save(cb1);
        }, cb);
    }
], function (err, result) {
    console.log('err', err, result);
});
 */
/**
 * 短信发送测试
 * 

var sms = ['company_name', 'user_name', 'send_city', 'receive_city', 'amount', 'pass_unit', 'category_chn', 'lading_code', 'driver.e-wto.com' ];
lib_msg.send_sms(sms, 'replace_driver_agree', ['17346509330'], function(err, result){
    console.log('err', err, result);
});
 */
//send_city , receive_city
// extServer.generalFun(req, {
//         source: 'trade',
//         db:'DemandOrder',
//         method:'getList',
//         query:{
//             find: {}
//         }},
/**
 * 替换省市县

lineDB.getList({find: {}},
    function (err, lists) {
    console.log('err', lists.length)
    async.eachSeries(lists, function(list, cb){
        // if(list.send_city){
        //     list.send_city = list.send_city.replace('市', '')
        // }
        // if(list.receive_city){
        //     console.log('list.receive_city', list.receive_city)
        //     list.receive_city = list.receive_city.replace('市', '')
        // }
        // if(list.send_province){
        //     list.send_province = list.send_province.replace('省', '')
        // }
        // if(list.receive_province){
        //     list.receive_province = list.receive_province.replace('省', '')
        // }
        if(list.start_province){
            list.start_province = list.start_province.replace('省', '')
        }
        if(list.end_province){
            list.end_province = list.end_province.replace('省', '')
        }
        if(list.start_city){
            list.start_city = list.start_city.replace('市', '')
        }
        if(list.end_city){
            list.end_city = list.end_city.replace('市', '')
        }
        list.save(cb)
    }, function(){});
});

async.waterfall([
    function (cb) {
        //如果传递了user_id，则先查用户信息，否则向下继续
        http.sendUserServerNew('', {
            cond: {find: {_id: '59755881c2a0a2482a7bcff5'}, select:'real_name photo_url company_id'},
            model: 'User_traffic',
            method: 'getOne'
        }, config_api_url.user_server_common, cb);
    }, function (user, cb) {
        userInfo = user;
        console.log('d', {create_user_id: userInfo.user_id})
        http.sendUserServerNew('', {
            cond: {find: {create_user_id: userInfo.user_id}, select:'long number type weight che_tou_zhao_url brand'},
            model: 'Truck',
            method: 'getOne'
        }, config_api_url.user_server_common, cb);
    }, function(dataRes, cb){
        if(dataRes){
            userInfo = _.extend(userInfo, {
                truck_id : dataRes._id,
                truck_long : dataRes.long,
                truck_num : dataRes.number,
                truck_type : dataRes.type,
                truck_weight : dataRes.weight,
                truck_logo : dataRes.che_tou_zhao_url,
                truck_brand : dataRes.brand
            });
        }
        cb(null, userInfo);
    }
], function (err, user) {
    console.log('err', err, user)
});
 */
/*
async.waterfall([
    function (cb) {
        db.getList({
            status: config_common.demand_status.effective
        }, cb)
    }, function (lists, cb) {
        async.eachSeries(lists, function(list, cb1){
            list.status = Number(list.amount_remain)>1 || !!list.amount_remain ? config_common.demand_status.effective : config_common.demand_status.complete;
            list.save(cb1);
        }, cb);
    }
], function (err, result) {
console.log('d')
})
*/
/**
var unrelation=[], findComp=[], result_comp=[], companys;
async.waterfall([
    function (cb) {
        //查询相似公司名的列表
        extServer.generalFun({}, {
            source: 'user',
            db: 'Company_traffic',
            method: 'getList',
            query: {find:{
                nick_name: {$regex: ''}//req.body.company_name
            }}
        }, cb)
    },
    function (company_ids, cb) {
        companys = JSON.parse(JSON.stringify(company_ids));
        //查询公司列表中的关系
        unrelation = _.pluck(companys, '_id');
        console.log('un', unrelation.length)
        extServer.generalFun({}, {
            source: 'user',
            db:'Company_relation',
            method:'getList',
            query:{
                find: {
                    self_id: '5969c424d03e721caf91977b',
                    other_type:'TRAFFIC',
                    other_id: {$in: unrelation}
                },
                select: 'other_id'
            }
        }, cb)
    },
    function (relation, cb) {
        console.log('re', relation.length)
        if(relation.length > 0){
            _.each(relation, function(a){
                _.each(companys, function(b){
                    if(a.other_id == b._id){
                        findComp.push(b);
                    }
                })
            });
            //查询物流需求单
            db.getOne({find: {_id: '5a13e3ae18774918d7269fa3'}}, cb)
        }else{
            cb(null, false)
        }
    },
    function (demand, cb) {
        if(demand){
            console.log( {
                    start_province : demand.send_province,
                    start_city : demand.send_city,
                    end_province : demand.receive_province,
                    end_city : demand.receive_city
                })
            //查询公司下的线路
            async.eachSeries(findComp, function (company, cb1) {
                lineDB.getOne({find: {
                    company_id: company._id.toString(),
                    // $or: [{
                    //     start_province : demand.send_province,
                    //     start_city : demand.send_city,
                    //     end_province : demand.receive_province,
                    //     end_city : demand.receive_city
                    // }, {start_province : demand.receive_province,
                    //     start_city : demand.receive_city,
                    //     end_province : demand.send_province,
                    //     end_city : demand.send_city}]
                }}, function (err, line) {
                    company.line = line || [];
                    result_comp.push(company);
                    cb1();
                })
            }, cb);
        }else{
            cb(null, [])
        }

    }
], function(err, result){
    // if(err){
    //     return next(err);
    // }
console.log(result_comp.length)
});
 **/
/**
 * 物流计划中增加需求方信息

async.waterfall([
    function (cb) {
        planDB.getList({}, cb)
    }, function (lists, cb) {
        console.log('dd', lists.length)
        // console.log(lists[0])
        // cb();
        
        async.eachSeries(lists, function (list, cb1) {
            db.getOne({
                find: {_id: list.demand_id}
            }, function (x, y) {
                if(y){
                    list.demand_user_id = y.demand_user_id;
                    list.demand_company_id =y.demand_company_id ;
                    list.demand_company_name = y.demand_company_name;
                    
                    list.time_modify = new Date();
                    list.save(cb1) 
                }else{
                    planDB.del({_id: list._id}, function () {
                        
                    })
                    cb1()
                }
                
            })
        }, cb)
    }
], function (x,y) {
    console.log(x,y)
})
 */
/*** 司机计划中增加需求方信息

async.waterfall([
    function (cb) {
        driverPlanDB.getList({}, cb)
    }, function (lists, cb) {
        console.log('dd', lists.length)
        // console.log(lists[0])
        // cb();

        async.eachSeries(lists, function (list, cb1) {
            driverDemandDB.getOne({
                find: {_id: list.demand_id}
            }, function (x, y) {
                if(y){
                    list.demand_user_id = y.demand_user_id;
                    list.demand_company_id =y.demand_company_id ;
                    list.demand_company_name = y.demand_company_name;
                    list.time_modify = new Date();
                    list.save(cb1)
                }else{
                    driverPlanDB.del({_id: list._id}, function () {

                    })
                    cb1()
                }

            })
        }, cb)
    }
], function (x,y) {
    console.log(x,y)
})
 */
/***交易回补
var product_categories = [
    {
        "layer_4" : "1219",
        "layer_4_chn" : "1219",
        "layer_3" : "304/2B",
        "layer_3_chn" : "304/2B",
        "layer_2" : "lengyabuxiugangjuan",
        "layer_2_chn" : "冷轧不锈钢卷",
        "layer_1" : "buxiugang",
        "layer_1_chn" : "不锈钢",
        "material" : "gangtie",
        "material_chn" : "钢铁",
        "company_id" : "5969c9b2d03e721caf919791",
        "PID" : [
            "5a1776b743aa05b811c226dd"
        ],
        "product_name" : [
            {
                "number_remain" : 4,
                "price" : 4020,
                "name" : "",
                "amount" : 4,
                "amount_unit" : 1,
                "number" : 4,
                "price_update" : 0,
                "price_preferential" : [],
                "image" : [
                    "http://rsc-dev.oss-cn-beijing.aliyuncs.com/1511487120300_8b.jpg"
                ],
                "measure_unit" : [],
                "attribute" : [
                    {
                        "value" : "4",
                        "unit" : "mm",
                        "vary" : "",
                        "name" : "厚度",
                        "numbering" : "407",
                        "_id" : "59fb11fe09d928b60835fede"
                    }
                ],
                "__v" : 0,
                "price_weight_max" : 4050,
                "price_weight_min" : 4000,
                "_id" : "5a1776b743aa05b811c226e0"
            },
            {
                "number_remain" : 4,
                "price" : 4020,
                "name" : "",
                "amount" : 4,
                "amount_unit" : 1,
                "number" : 4,
                "price_update" : 0,
                "price_preferential" : [],
                "image" : [
                    "http://rsc-dev.oss-cn-beijing.aliyuncs.com/1511487120300_8b.jpg"
                ],
                "measure_unit" : [],
                "attribute" : [
                    {
                        "value" : "4",
                        "unit" : "mm",
                        "vary" : "",
                        "name" : "厚度2",
                        "numbering" : "407",
                        "_id" : "59fb11fe09d928b608ede"35f
                    }
                ],
                "__v" : 0,
                "price_weight_max" : 4050,
                "price_weight_min" : 4000,
                "_id" : "5a1776b743aa05b811c226e0"
            }
        ],
        "replenish" : true,
        "path_loss" : false,
        "modify_amount" : false,
        "__v" : 0,
        "user_id" : "596c1beb41f109086b455f9b",
        "pass_unit" : "吨",
        "unit" : "吨",
        "_id" : "5a1776b743aa05b811c226e1"
    }
];
var assign_categories = [
    {
        "amount_unit" : 1,
        "count" : 4,
        "key" : "buxiugang;lengyabuxiugangjuan;304/2B;1219"
    }
];
var add = function (a, b) {
    return config_common.rscDecimal('add', a,b);
};
var sub = function (a, b) {
    return config_common.rscDecimal('sub', a,b);
};
var getAssign = function(product_categories, assign, fun) {
    var newArr = [];
    if (!assign || !_.isArray(assign)) return false;
    // console.log(product_categories,assign,fun)
    product_categories.forEach(function (obj) {
        assign.forEach(function (assign) {
            // 拼成物流服务器发过来的产品种类字符串，只去layer_x部分，产品分类部分
            var str = '';
            var arr = [];
            for (var i = 0; i < _.keys(obj).length; i++) {
                var index = _.keys(obj)[i];
                if (obj[index] !== '' &&
                    (new RegExp(obj[index])).test(assign.key) &&
                    index !== 'material' &&
                    index.split('_').length === 2 &&
                    index.split('_')[0] === 'layer') {
                    arr[index.split('_')[1] - 1] = obj[index]+';';
                }
            }
            //keys顺序会变，从一级分类开始整理
            for(var j = 0; j < arr.length; j++){
                str += arr[j];
            }
            str = str.substr(0, str.length-1)
            // 和物流服务器发过来的产品匹配成功进入
            console.log('A', assign.key, str, assign.key.indexOf(str))
            if(assign.key.indexOf(str) >= 0){
                obj.product_name.forEach(function (productObj) {
                    console.log('assign.key', assign.key)
                    if (productObj.name) {
                        //如果产品存在名称也要匹配
                        console.log('1')
                        if ((new RegExp(productObj.name).test(assign.key)))
                            productObj['number_remain'] = fun(productObj['number_remain'], assign.count);
                    } else {
                        console.log('2')
                        productObj['number_remain'] = fun(productObj['number_remain'], assign.count);
                    }
                    
                    if (productObj['number_remain'] < 0) return false;
                });
            }
        });
        newArr.push(obj);
    });
    return newArr;
}
getAssign(product_categories,assign_categories,sub )
**/

/**  
 * 2种线路价格排序

var linePriceSort = function(lists, list, dice){
    var loop_lists = JSON.parse(JSON.stringify(lists))
    for(var j = 0; j < loop_lists.length-1; j++){
        if(loop_lists[j]['start_province'] == list.start_province && loop_lists[j]['start_city'] == list.start_city ){
            loop_lists[j]['view']= 'goto';
        }else{
            loop_lists[j]['view']= 'goback';
        }
        if(loop_lists[j+1]['start_province'] == list.start_province && loop_lists[j+1]['start_city'] == list.start_city ){
            loop_lists[j+1]['view']= 'goto';
        }else{
            loop_lists[j+1]['view']= 'goback';
        }
    }

    var loop = loop_lists.length;
    var Swap = function(A,i,j){
        var temp = A[i];
        A[i] = A[j];
        A[j] = temp;
    };
    for(var i=0; i< loop-1; i++){
        for(var j=0; j<loop-1-i; j++){
            //判断2个坐标是回城和去程；
            var flag = false;
            var cf = function(arr, i, x, y){
                return !!dice ? arr[i][x] < arr[i+1][y] : arr[i][x] > arr[i+1][y];
            };
            if(loop_lists[j]['view'] == 'goto' && loop_lists[j+1]['view'] == 'goto'){
                flag = cf(loop_lists, j, 'money', 'money');
            }
            else if(loop_lists[j]['view'] == 'goto' && loop_lists[j+1]['view'] == 'goback'){
                flag = cf(loop_lists, j, 'money', 'unmoney');
            }
            else if(loop_lists[j]['view'] == 'goback' && loop_lists[j+1]['view'] == 'goback'){
                flag = cf(loop_lists, j, 'unmoney', 'unmoney');

            }
            else if(loop_lists[j]['view'] == 'goback' && loop_lists[j+1]['view'] == 'goto'){
                flag = cf(loop_lists, j, 'unmoney', 'money');
            }
            if(flag){
                Swap(loop_lists, j, j+1);
            }
        }
    }
    return loop_lists;
};

var linePriceInsertSort = function(lists, list, dice){
    var loop_lists = JSON.parse(JSON.stringify(lists));
    for(var j = 0; j < loop_lists.length-1; j++){
        if(loop_lists[j]['start_province'] == list.start_province && loop_lists[j]['start_city'] == list.start_city ){
            loop_lists[j]['view']= 'goto';
        }else{
            loop_lists[j]['view']= 'goback';
        }
        if(loop_lists[j+1]['start_province'] == list.start_province && loop_lists[j+1]['start_city'] == list.start_city ){
            loop_lists[j+1]['view']= 'goto';
        }else{
            loop_lists[j+1]['view']= 'goback';
        }
    }

    var loop = loop_lists.length;

    for(var j =1; j < loop; j++){
        //判断2个坐标是回城和去程；
        var flag = false;

        var cf = function(arr, i, x, y){
            return !!dice ? arr[i-1][x] < arr[i][y] : arr[i-1][x] > arr[i][y];
        };
        if(loop_lists[j]['view'] == 'goto' && loop_lists[j-1]['view'] == 'goto'){
            flag = cf(loop_lists, j, 'money', 'money');
        }
        else if(loop_lists[j]['view'] == 'goto' && loop_lists[j-1]['view'] == 'goback'){
            flag = cf(loop_lists, j, 'money', 'unmoney');
        }
        else if(loop_lists[j]['view'] == 'goback' && loop_lists[j-1]['view'] == 'goback'){
            flag = cf(loop_lists, j, 'unmoney', 'unmoney');

        }
        else if(loop_lists[j]['view'] == 'goback' && loop_lists[j-1]['view'] == 'goto'){
            flag = cf(loop_lists, j, 'unmoney', 'money');
        }
        var tmp = loop_lists[j];
        var i = j - 1;
        while(i >= 0 && flag){
            loop_lists[i+1] = loop_lists[i];
            i--;
        }
        loop_lists[i+1] = tmp;
    }

    return loop_lists;
};

 */
/**
 *  20171205 司机接单中增加需求方信息

async.waterfall([
    function (cb) {
        driverPlanDB.getList({
            find: {}
        }, cb)
    }, function (lists, cb) {
        console.log('list', lists.length)
        async.eachSeries(lists, function(list, cb1){
            driverDemandDB.getOne({
                _id: list.demand_id
            }, function (err, result) {
                list.demand_user_id = result.demand_user_id;
                list.demand_company_id = result.demand_company_id;
                list.demand_company_name = result.demand_company_name;
                list.save(function(err){
                    console.log(err)
                });
                cb1();
            })
        }, cb)
    }
], function (err, result) {
    if(err){
        console.log(err)
    }
    console.log('result', result);
})
 */
/**
 *  将旧线路修改为新线路，字符串改为数组

async.waterfall([
    function(cb){
        lineDB.getList({find: {}}, cb)
    }, function (lists, cb) {
        async.eachSeries(lists, function (list, cb1) {
            list.start_city = _.isArray(list.start_city) ? list.start_city : [list.start_city];
            list.start_district = _.isArray(list.start_district) ? list.start_district : [list.start_district];
            list.end_city = _.isArray(list.end_city) ? list.end_city : [list.end_city];
            list.end_district = _.isArray(list.end_district) ? list.end_district : [list.end_district];
            list.cargo_chn = _.map(line.cargo, function (a) {
                return config_common.material[a];
            });
            console.log('3')
            list.save(function (x,y) {console.log('x', x,y)})
            cb1();
        }, cb);
    }
], function(x, y){
    console.log('d', x,y)
});
 */
/**
 *

async.waterfall([
    function (cb) {
        lineDB.getList({find: {}}, cb)     
    }, function (lists, cb) {
        async.eachSeries(lists, function(line, cb1){
            // var start_area = config_common.areaCollect(line.start_province, line.start_city, line.start_district);
            // var end_area = config_common.areaCollect(line.end_province, line.end_city, line.end_district);
            // line.section = _.union([], start_area, end_area);
            line.section = config_common.areaCollect([line.start_province], line.start_city, line.start_district);
            line.end_section = config_common.areaCollect([line.end_province], line.end_city, line.end_district);
            line.unsection = config_common.unAreaCollect([line.start_province], line.start_city, line.start_district);
            line.end_unsection = config_common.unAreaCollect([line.end_province], line.end_city, line.end_district);
            line.save(cb1)
        }, cb);
    }
], function (x, y) {
    console.log(x, y)
});
 **/

/**
 *  需求单、订单区域配置

async.waterfall([
    function (cb) {
        // db.getList({find: {}}, cb)
        // driverDemandDB.getList({find: {}}, cb)
        // orderDB.getList({find: {}}, cb);
        driverOrderDB.getList({find: {}}, cb);
    }, function (lists, cb) {
        async.eachSeries(lists, function(driverObj, cb1){
            driverObj.section = [driverObj.send_province, driverObj.send_province + driverObj.send_city, driverObj.send_province + driverObj.send_city + driverObj.send_district];
            driverObj.end_section = [driverObj.receive_province, driverObj.receive_province + driverObj.receive_city, driverObj.receive_province + driverObj.receive_city + driverObj.receive_district]

            driverObj.save(cb1)
        }, cb);
    }
], function (x, y) {
    console.log(x, y)
});
 */
//获取当前公司预设值的推荐数--- ，
/**
 * 

var pushCount, //推送数字
    base_time = (new Date()).getHours() >= 10 ? true : false,  // 10点前
    pushContent, //推送公司ID
    pushList, //推送公司列表
    relation_company=[]; //认证公司列表
async.waterfall([
    function(cb2){
        //获取当前公司预先设置的推荐数
        cb2(null, 2);
    },
    function(count, cb2){
        pushCount = count;
        //获取当前时间大于10点重新获取 count个数量的公司，并存储到物流推送表中，若小于10点则查询是否有推送记录取值
        // 大于等于10，获取预先设置的推荐数，获取对应数据，将索引存入push中；
        // 小于10，获取push的记录，依据索引查询对应数据；若没有push记录获取对应数据，并将索引存入push中
        //1 获取认证公司， 2 获取当前预先设置的推荐数 3 获取推送记录
        trafficPushSV.getOne({
            find: {
                user_id: '5a2f7150d6aa0f6e96cee91c',//req.decoded.id,
                role: config_common.user_roles.TRAFFIC_ADMIN,
                type: 'trafficDemand'
            }
        }, cb2);
    }, function (push, cb2) {
        if(push && push.push_content.length>0){
            pushContent = push.push_content;
        }
        //获取非认证交易企业数量
        if(base_time){
            extServer.generalFun({}, {
                source: 'user',
                db:'Company_trade',
                method:'getCount',
                query:{
                    _id: {$nin: relation_company}, type: {$nin: ['STORE']}
                }}, cb2);
        }else{
            cb2(null, 0);
        }

    }, function (count, cb2) {
        var push_cond = {};
        if(base_time){
            push_cond = {
                find: {_id: {$nin: relation_company}, type: {$nin: ['STORE']}},
                skip: Math.floor(Math.random() * count), //从配置中获取预设值20171219
                limit: pushCount
            }
        }else{
            push_cond = {find: {_id: {$in: pushContent}}};
        }
        //获取非认证企业交易列表
        extServer.generalFun({}, {
            source: 'user',
            db:'Company_trade',
            method:'getList',
            query: push_cond
        }, cb2);
    }, function (companys, cb2) {
        pushList = _.pluck(JSON.parse(JSON.stringify(companys)), '_id');
        if(base_time){
            trafficPushSV.add({
                user_id: '5a2f7150d6aa0f6e96cee91c',//req.decoded.id,
                role: config_common.user_roles.TRAFFIC_ADMIN,
                type: 'trafficDemand',
                time_creation: new Date(),
                push_content: pushList
            }, function(){});
        }
        cb2(null, pushList);
    }
], function (x, y) {
    console.log('x', x,y)
});

 */

//*** 将司机订单的状态 置为 effective
/*
async.waterfall([
    function(cb){
        driverDemandDB.getList({find: {}}, cb)
    }, function (list, cb) {
        async.each(list, function(one, cb1){
            one.material_chn = config_common.material[one.material]
            one.save(function(){})
            cb1();
        }, cb)
    }
], function(){
    console.log('lo')
});
 */
//*** 依据最新司机订单 生成另外一个影子订单
/*

var driverOrder = {}
async.waterfall([
    function (cb) {
        driverOrderDB.getOne({
            find: {_id: '5ae17b8dc13f428da3662e80'}
        },cb)
    }, function (list, cb) {
        //获取司机和车辆信息
        var driverDemand = list.toObject();
       var driverOrder = {
            demand_id: driverDemand.demand_id,
            order_id: driverDemand.order_id,
            demand_user_id: driverDemand.demand_user_id,
            demand_company_id: driverDemand.demand_company_id,
            // truck_id: userInfo.truck_id,
            role: config_common.user_roles.TRAFFIC_DRIVER_PRIVATE,
            material: driverDemand.material,
            material_chn: driverDemand.material_chn,
            price: driverDemand.price,
            product_categories: driverDemand.product_categories,
            products_replenish: driverDemand.products_replenish,//[], 补货信息
            //支付方式
            payment_choice: driverDemand.payment_choice,          //现有支付选择(现金，银兑，商兑)
            payment_method: driverDemand.payment_method,          //现有支付方法(货到付款，款到付货，分期，信用)
            count_day_extension: driverDemand.count_day_extension,    //延期天数
            time_day_extension: driverDemand.time_day_extension,       //实际还款天数
            ref_day_extension: driverDemand.ref_day_extension,      //延期计算标准
            percentage_advance: driverDemand.percentage_advance,     //预付款百分比
            percentage_remain: driverDemand.percentage_remain,      //中款百分比

            weigh_settlement_style: driverDemand.weigh_settlement_style,  //重量结算方式
            time_settlement_style: driverDemand.time_settlement_style,   //时间结算方式
            att_traffic: driverDemand.att_traffic, //物流细则
            appendix: driverDemand.appendix,                 //备注
            quality_origin: driverDemand.quality_origin, //质检方
            //汇款信息
            
            //出发地 ，到达地
            send_address_id: driverDemand.send_address_id,
            send_name: driverDemand.send_name,
            send_phone: driverDemand.send_phone,
            send_province: driverDemand.send_province,
            send_city: driverDemand.send_city,
            send_district: driverDemand.send_district,
            send_addr: driverDemand.send_addr,
            send_loc: driverDemand.send_loc,
            receive_address_id: driverDemand.receive_address_id,
            receive_name: driverDemand.receive_name,
            receive_phone: driverDemand.receive_phone,
            receive_province: driverDemand.receive_province,
            receive_city: driverDemand.receive_city,
            receive_district: driverDemand.receive_district,
            receive_addr: driverDemand.receive_addr,
            receive_loc: driverDemand.receive_loc,
            //时间
            time_depart: driverDemand.time_depart,
            time_arrival: driverDemand.time_arrival,
            time_creation: new Date(),
            time_update_step: new Date(),
            status: 'effective',
            //source: driverDemand.verify_driver.indexOf(req.decoded.id) != -1 ? driverDemand.source: config_common.demand_source.platform_assign,
            source: 'yingzi',
            replenish:driverDemand.replenish,
            time_sort: config_common.getYearMonth(new Date()).monthStr,
            demand_user_name: driverDemand.demand_user_name,
            demand_company_name: driverDemand.demand_company_name,
            lading_code: driverDemand.lading_code,
            catalogue: driverDemand.catalogue,
            section: driverDemand.section,  //区间
            end_section: driverDemand.end_section,  //区间
            tip_price: driverDemand.tip_price, //信息费
            send_nickname: driverDemand.send_nickname,
            receive_nickname: driverDemand.receive_nickname,
            tip_prices : driverDemand.tip_price,
        };
        driverOrder.category = driverDemand.category;
        driverOrder.category_chn = driverDemand.category_chn;
        driverOrder.amount = driverDemand.amount; //获取理论吨数
        driverOrder.amount_remain = 100;
        driverOrder.step = 0.5;
        driverOrder.products_remain = driverDemand.products_remain;
        driverOrder.price_total = driverDemand.price_total;//获取订单理论价格
        driverOrder.supply_user_id = driverDemand.supply_user_id,
        driverOrder.truck_weigth = driverDemand.truck_weigth;
        driverOrder.supply_user_name = driverDemand.supply_user_name;
        driverOrder.truck_num = driverDemand.truck_num ;
        driverOrder.tip_price =100 ;
        driverOrder.tip_prices = 289.2;
                
        async.eachSeries([1,2,3,4,5,6], function (x, cb22) {
            console.log('x', x)
            driverOrder.time_tip_price = (new Date()).getTime() + x * 30 * 60 *1000;
            driverOrder.index = config_common.getTradeOrderIndex('order');
            console.log('index', driverOrder)
            driverOrderDB.add(driverOrder, function (x,y) {
                console.log('add', x)
                cb22()
            })
        },cb)
    }
], function(x, y){
    console.log(x, y)
})
*/

 // *
/*
var afterTime = new Date(time.getTime() + 12*60*60*1000);
var beforeTime= new Date(time.getTime() - 12*60*60*1000);
var cond = {
    // status: 'effective', 
    // step: {$lt: 2}, 
    // tip_prices:{$gt: 0}, 
    time_creation: {$gt: beforeTime, $lt: afterTime} //time_depart
}
// driverOrderDB.getList({find: cond}, function (err , list) {
//     console.log('list', list.length)
// })
var time = new Date();
var hours = myDate.getHours(); //12点 0点执行

    */
/*
async.parallel({
    'a': function (cb) {
        cb(null, 'a')
    }, 'b': function (cb) {
        cb(null, 'b')
    }, 'c': function (cb) {
        //若没有返回值，则挂起
    }
    
}, function (err, result) {
    console.log('err', err, result)
})*/

/*
* 将数据库文件输入到文本中，或excel中
* */


/*
* 20180328 司机订单中增加 交易订单号 fields: index_trade

async.waterfall([
    function (cb) {
        // driverOrderDB.getList({find: {_id: '5a9507894f4fae67bbb6184b'}}, cb)
        driverOrderDB.getList({find: {}}, cb)
    },function (lists, cb) {        
        async.eachSeries(lists, function(list, cb1){
            if(list.order_id){
                orderDB.getOne({find:{
                    _id: list.order_id
                }}, function (x, y) {
                    if(y && y.index_trade){
                        if(!!list.time_tip_price){
                            
                        }else{
                            list.time_tip_price = (new Date()).getTime();
                        }
                        list.index_trade = y.index_trade;
                        list.demand_trade_user_id = y.demand_user_id;
                        list.save(cb1)
                    }else{
                        cb1()
                    }                    
                })
            }else{
                cb1()
            }
            
            
        }, cb)
    }
], function (x, y) {
    console.log(x,y)
})
 */
//5abdf35ab141d18e3b2375eb
/*
async.waterfall([
    function (cb) {
        driverDemandDB.getOne({find: {_id: '5ac33b2e8230ac32e346087d'}}, cb)
    }, function (driver, cb) {
        var driverObj = JSON.parse(JSON.stringify(driver));
        delete driverObj._id;
        delete driverObj.__v;
        // driverObj.order_id = '';
        driverObj.time_creation = new Date();
        driverObj.time_validity = new Date((new Date()).getTime() + 24*60*60*1000 );
        driverObj.time_modify = new Date();
        
        driverObj.verify_driver.push('5a2f881160cf321b9a6e1c36');// =["5a2f881160cf321b9a6e1c36"];
        driverObj.unoffer_list =[];
        // driverObj.source = 'testDemand';
        for(var i=0; i< 5; i++){
            driverObj.index = config_common.getDriverOfferDemandIndex();
            driverObj.status = 'effective';
            driverDemandDB.add(driverObj, function(){})
        }
        cb()
    }
], function (x, y) {
console.log(x,y)
})*/
//
// http.sendBaiDuTTs({"text":"老司机,梓朦物流货运发布邯郸到海口的运输再生资源110吨,快来接单","order_id":"5ac33d52d4dcb63198ba9f4a"}, function(err, url){
//     console.log('err', err, url)
// });


similarProbability=function (a,b) {
    if(_.isArray(a) && _.isArray(b)){
        //并集
        abu = (_.union(a,b));
        //交集
        abi = (_.intersection(a,b));
        if((a.length==1&&a[0].length==2 || b.length==1&&b[0].length==2 )&& a[0].substring(0,2) ==  b[0].substring(0,2) ){
            //若是全省呢，则是a,b只有一个2汉字字符串，
            //取a b 中前2个字符串比较，若相同则return 1;
            return 1;//匹配了省
            //匹配市 最好是省市县有分隔符？ 省相同1 市相同1 县相同1 (1+1+1)/3, (1+1+0)/3, (1+0+0)/3,
        }else if(abu.length == a.length){
            //并集 数量若与比较值想到，则为包含，
            return 1
        }else{
            return abi.length/abu.length;
        }       
    }else{
        return 0
    }
}
lineSimilarProbability = function(a, b){
     //a,b是2个元素的数组
     ab_start_p = similarProbability(a[0], b[0]);
     ab_end_p = similarProbability(a[1], b[1]);
     ba_start_p = similarProbability(a[0], b[1]);
     ba_end_p = similarProbability(a[1], b[0]);
     return ab_start_p*ab_end_p + ba_start_p*ba_end_p;
 }
/*
* 求解线路匹配时 ，常用 详细地址"匹配"模糊地址或详细地址, 若是用模糊地址“匹配”模糊地址怎么处理呢

async.waterfall([
    function(cb){
        orderDB.getList({find: {}}, cb);
    }, function (lists, cb) {
        console.log('lists', lists.length)
        //订单中增加产品倒数第二级类
        async.eachSeries(lists, function (list, cb1) {
            list.category_penult = config_common.penultCategory(list.product_categories);
            list.category_penult_chn = config_common.penultCategoryChn(list.product_categories);
            list.save(cb1)
        }, cb)
    }
], function(x,y){
    console.log(x,y)
})
**/
//20170427增加排序字段
async.waterfall([
    function(cb){
      // db.getList({find:{}}, cb)
      //   orderDB.getList({find: {}}, cb)
      //   driverDemandDB.getList({find: {}}, cb)
      //     driverOrderDB.getList({find: {}}, cb)
        // planDB.getList({find: {}}, cb)
        // driverPlanDB.getList({find: {}}, cb)
        // redCardOrderDB.getList({find: {}}, cb)
        lineDB.getList({find: {}}, cb)
      // userDB.getList({find: {}}, cb)
        // cb()
    }, function(lists, cb){
    console.log('list', lists.length)
        //effective,ineffective,complete,cancelled
        async.eachSeries(lists, function(list, cb1){
          // list.cppcc_phyle = list.phyle;
          // list.offic_cppccPost = list.cppccPost;
          // list.offic_department = list.department;
          // list.role = list.a_role;
          // list.a_role = list.role;

          // list.save(cb1)
          // if(list.price_chart && list.price_chart.length>0){
          //   _.each(list.price_chart, function(a){
          //     if(!a.unmoney){
          //       a.unmoney=list.money;
          //     }
          //     if(!a.money){
          //       a.money=list.unmoney;
          //     }
          //     if(typeof(a.time_modify) == 'object'){
          //       // a.time_modify=(new Date(a.time_modify)).getTime()
          //       console.log('obj', typeof(a.time_modify), a.time_modify, new Date(a.time_modify), (new Date(a.time_modify)).getTime() )
          //       var tm = (new Date(a.time_modify)).getTime();
          //       a.time_modify=tm
          //     }
          //     // a.time_modify=(new Date(a.time_modify)).getTime()
          //     // a.unmoney=list.money;
          //   });
          //   list.markModified('price_chart')
          // }
          // list.save(cb1)
            // if(list && list.demand_user_id && list.demand_company_id && list.supply_user_id && list.tip_prices){
            //     infoPriceSV.getOne({find: {
            //         user_id: list.demand_user_id,
            //         type: 'all'
            //     }}, function (x, y1) {
            //         if(y1){
            //             y1.price_total = config_common.rscDecimal('add', y1.price_total, list.tip_prices);
            //             y1.save(cb1)
            //         }else{
            //             infoPriceSV.add({
            //                 user_id: list.demand_user_id,
            //                 type: 'all',
            //                 price_total: list.tip_prices,
            //                 in_discount: 100, //物流内部折扣
            //                 out_discount: 100, //平台折扣
            //             }, cb1)
            //         }
            //     })
            // }else{
            //     cb1()
            // }
            // find_category: {type: String}, //查询产品匹配,存放产品链式目录? 字段类似 catalogue，一个是字符串一个是数组
            // 类似: "xiancailei;luowengang;HRB500;9mi;Φ8, meitan;guochan;donglimei;changyanmei;4"
            // list.category_penult=config_common.penultCategory(list.product_categories)
            // list.category_penult_chn=config_common.penultCategoryChn(list.product_categories)
            // console.log(list.category_penult, list.category_penult_chn)
            // cb1()
            // list.time_cost={
            //     "time_stamp" : (new Date(list.time_depart)).getTime(),
            //     "start_type" : 1,
            //     "date_type" : "start"
            // };
            // if(list.time_cost){
                // if(!list.time_cost['time_stamp']){
                //     list.time_cost['time_stamp'] = (new Date()).getTime()
                // }
                // list.time_cost['date_type']=list.time_cost['data_type'];
                // delete list.time_cost['data_type'];
                // list.markModified('time_cost')
                // list.save(cb1)
                // cb1()
            // }else{
            //     list.time_cost={
            //             "time_stamp" : (new Date()).getTime(),
            //             "start_type" : 1,
            //             "date_type" : "start"
            //         };
            //     list.markModified('time_cost')
            //     list.save(cb1)
            //     cb1()
            // }
            
            // list.sorting=config_common.demand_status_sort[list.status]; // 需求 和计划的 排序
            // list.section = config_common.demandAreaCollect(list.send_province, list.send_city, list.send_district); // 需求的省份
            // list.end_section = config_common.demandAreaCollect(list.receive_province, list.receive_city, list.receive_district); // 需求的省份
            // list.frequency=list.money_remain;
            // list.save(cb1);
            // driverDemandDB.getOne({_id: list.order_id},function (x,y) {
                // list.supply_user_id=y.demand_user_id,
                //     list.supply_company_id=y.demand_company_id,
                //     list.supply_company_name=y.demand_company_name;
                // list.weigh_settlement_style=y.weigh_settlement_style;
                        
            // })
            // if(list && ((new Date()).getTime())>((new Date(list.time_creation)).getTime() + 7*24*60*60*1000) ){
            //
            //     cb1()
            // }else{
            //     console.log('d',list.time_creation)
            //     cb1()
            // }
        }, cb)
        // extServer.userFind({user_id: '5a3083fa4038589caf1afa3e'}, cb)
        // db.getOne({
        //     find: {
        //         $where: function(){
        //             // for(var i=0 ; i<this.section.length;i++){
        //             //     if(this.section[i].indexOf('汉阳')>-1){
        //             //         return this;
        //             //     }
        //             // }
        //             return this.amount>300 && this.amount<350
        //         }
        //     },
        //     select: 'section amount',
        // }, cb)
    }
], function(x,y){
    console.log(x,y)
})
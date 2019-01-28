/**
 * by Administrator 20170410
 */
var async = require('async');
var _ = require('underscore');
var http = require('../lib/http');
var util = require('../lib/util');
var config_api_url = require('../configs/config_api_url');
var config_common = require('../configs/config_common');
var DB = require('../dbs/db_base')('TrafficDriverDemand');
var trafficOrderDB = require('../dbs/db_base')('TrafficOrder');
var driverPlanDB = require('../dbs/db_base')('TrafficDriverPlan');
var extServer = require('../lib/lib_ext_server');


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
    var result = {count: 0, demand: [], exist: false, mp3_arr:[]};
    async.waterfall([
        function (cb) {
            DB.getCount(data.find,function(err,count){
                if(err){
                    return callback(err);
                }
                DB.getList(data,function(err, orders){
                    if(err){
                        return callback(err);
                    }
                    cb(null,{
                        demand: orders,
                        exist: count > data.page*config_common.entry_per_page,
                        count: count
                    });
                });
            });        
        }, function (lists, cb) {
            result.count = lists.count;
            result.exist = lists.exist;
            async.eachSeries(lists.demand, function (list, cb1) {
                listObj=JSON.parse(JSON.stringify(list));
                extServer.userFind({user_id: list.demand_user_id}, function(err, user){
                    result.demand.push( _.extend(listObj, user||{}) );
                    cb1();
                });
            }, cb);
        }
    ], function () {
        callback(null, result);
    })
    
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
    DB.save(data,callback);
};
//相似检查
exports.check=function(){

};
exports.getAggregate = function(data, callback){
    DB.group(data, callback);
};
//获取司机 和车辆信息
exports.getUserTruck = function(req, data, callback){
    var userInfo={};
    //若 token 中是管理员，查人员和公司，若token 是司机，查人员和车辆
    // /**
    async.waterfall([
        function (cb) {
            extServer.generalFun(req, {
                source: 'user',
                db: 'User_traffic',
                method: 'getOne',
                query: {
                    find: {_id: data.user_id},
                    select: 'phone photo_url real_name role company_id province city district id_card_number_url jia_shi_zheng_url other_picture'
                }
            }, cb);
        },
        function (user, cb) {
            if(!user){return cb({dev: '用户信息没找到', pro: '000004'});}
            userInfo = _.extend(userInfo,{
                user_id: user._id.toString(),
                user_logo: user.photo_url,
                real_name: user.real_name,
                role: user.role,
                phone: user.phone,
                province: user.province? user.province: '',
                city: user.city? user.city: '',
                district: user.district? user.district: '',
                id_card_number_url: user.id_card_number_url,
                jia_shi_zheng_url: user.jia_shi_zheng_url,
                other_picture: user.other_picture
            });
            if(user.role == config_common.user_roles.TRAFFIC_DRIVER_PRIVATE){
                //查车辆
                extServer.generalFun(req, {
                    source: 'user',
                    db: 'Truck',
                    method: 'getList',
                    query: {
                        find: {
                            user_id: {$in: [data.user_id]},
                        },
                        select:'long number type weight che_tou_zhao_url brand xing_shi_zheng_url yun_ying_zheng_url che_tou_zhao_url',
                        sort: {is_default: -1}
                    }
                }, cb);
            }else{
                //查公司
                extServer.generalFun(req, {
                    source: 'user',
                    db: 'Company_traffic',
                    method: 'getOne',
                    query: {
                        find: {_id: user.company_id[0]},
                        select: 'nick_name verify_phase des sell'
                    }
                }, cb);
            }
        },
        function (dataRes, cb) {
            if(dataRes) {
                if(userInfo.role == config_common.user_roles.TRAFFIC_DRIVER_PRIVATE){
                    if(dataRes.length > 0){
                        userInfo = _.extend(userInfo, {
                            truck_id : dataRes[0]._id.toString(),
                            truck_long : dataRes[0].long,
                            truck_num : dataRes[0].number,
                            truck_type : dataRes[0].type,
                            truck_weight : dataRes[0].weight,
                            truck_logo : dataRes[0].che_tou_zhao_url,
                            truck_brand : dataRes[0].brand,
                            xing_shi_zheng_url: dataRes[0].xing_shi_zheng_url,
                            yun_ying_zheng_url: dataRes[0].yun_ying_zheng_url,
                            che_tou_zhao_url: dataRes[0].che_tou_zhao_url
                        });
                    }
                }else{
                    userInfo = _.extend(userInfo, {
                        company_id : dataRes._id.toString(),
                        company_name : dataRes.nick_name, //dataRes.verify_phase=='NO'? dataRes.full_name: dataRes.nick_name
                        verify_phase : dataRes.verify_phase,
                        company_des: dataRes.des,
                        company_sell: dataRes.sell ? dataRes.sell : []
                    });
                }
            }
            cb(null, userInfo);
        }, function (user, cb) {
            http.sendMsgServerNew(req, {user_id: data.user_id}, config_api_url.msg_server_push_one, function (x,uuid) {
                user['newLogin']=uuid ? (new Date(uuid.time_creation)).getTime() : 0;
                cb(null, user);
            });
        }
    ], callback);
     // */
    /*
    extServer.userFind(data, callback)
    */

};

//关闭需求单
exports.close = function(data, status, callback){
    var demand, order;
    if(!data.demand_id){
        return callback({dev: 'demand_id参数有误', pro: '000003'});
    }
    async.waterfall([
        function (cb) {
            DB.getOne({
                find: {
                    _id: data.demand_id
                }
            }, cb)
        },function (demandRes, cb) {
            demand = demandRes;
            //获取物流订单，并修改剩余值 和 吨数
            demand.status = demandRes.order_count>0 ? config_common.demand_status.complete : status;
            demand.sorting = config_common.demand_status_sort[demand.status];
            trafficOrderDB.getById({find: demand.order_id},cb);
        }, function(orderRes, cb) {
            if(!orderRes || demand.amount_remain <=0 ){
                //关闭effective状态的司机计划单据
                driverPlanDB.update({
                    find: {
                        status: config_common.demand_status.effective,
                        demand_id: demand._id.toString()
                    },
                    set: {status: config_common.demand_status.ineffective, time_modify: new Date()}
                }, function(){});
                //修改司机需求单
                demand.time_modify = new Date();
                demand.save(cb);
            }else{
                order = orderRes;
                var tmp_remain = config_common.rscDecimal('add', order.amount_remain, demand.amount_remain);//若一个订单对应多个物流需求单
                if (tmp_remain > order.amount) {
                    demand.save(function () {
                        return cb({dev: '物流订单修改失败', pro: '000005'});
                    });
                }else{
                    order.amount_remain = tmp_remain;
                    order.products_remain = demand.products_remain;
                    order.product_categories = config_common.recompute_products(demand.product_categories, 'number_remain');//number_remain
                    order.markModified('product_categories');
                    order.markModified('products_remain');
                    order.step = 3.5;
                    order.time_update_step = new Date();
                    order.save(function (err) {
                        if (err) {
                            return cb({dev: '物流订单修改失败', pro: '000005'});
                        }else{
                            demand.time_modify = new Date();
                            demand.save(cb);
                        }

                    });
                }

            }
        }
    ], callback);
};

exports.specialList = function(data, callback, req){
    //new
    var result = {count: 0, lists: [], exist: false, mp3_arr:[]},
        mp3_url = 'http://'+config_server.local_server_ip +':'+config_server.port + '/';
    async.waterfall([
        function (cb) {
            data.sort = {sorting: 1, time_creation: -1};
            // data.select='time_creation status demand_user_id demand_company_id index sorting platform_driver unoffer_list verify_driver'
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
            async.parallel({
                getList: function(cb2){
                    async.eachSeries(lists.orders, function (list, cb1) {
                        listObj=JSON.parse(JSON.stringify(list));
                        // if(req && req.decoded && req.decoded.role==config_common.user_roles.TRAFFIC_ADMIN){
                        if(req && req.decoded && config_common.accessRule.pass.indexOf(req.decoded.role) > -1){
                            result.lists.push(listObj);
                            cb1();
                        }else{
                            async.waterfall([
                                function (cb10) {
                                    extServer.userFind({user_id: list.demand_user_id}, function(err, user){
                                        listObj=_.extend(listObj, user||{});
                                        cb10();                                        
                                    });
                                },
                                function(cb10){
                                    extServer.generalFun(req, {
                                        source: 'user',
                                        db:'Driver_verify',
                                        method:'getList',
                                        query: {
                                            find: {
                                                user_id: req.decoded.id,
                                                company_id: list.demand_company_id //user.company_id[0]
                                            },
                                            select: 'company_id'
                                        }
                                    }, cb10);
                                },
                                function(valid, cb10){
                                    //是否有认证关系
                                    listObj['is_relation'] = valid && valid.length > 0 ? true:false;
                                    //查询需求方者发送多少个需求单;
                                    DB.getCount({
                                        demand_user_id: listObj.demand_user_id,
                                        status: {$nin: [config_common.demand_status.cancelled]}
                                    }, cb10);
                                },
                                function (count, cb10) {
                                    listObj['demand_count']=count||0;
                                    extServer.driverTTS(req, listObj, function (err,url) {
                                        if(url){
                                            listObj['mp3_url'] = mp3_url + url;
                                            result.mp3_arr.push(listObj['mp3_url']);
                                        }
                                        result.lists.push(listObj);
                                        cb10();
                                    });
                                }
                            ],cb1)
                        }
                    }, cb2);
                }
                // ,
                // recommend: function (cb2) {
                //     //若是推荐位置: 物流看什么，司机看什么
                //     if(req.body.sv=='recommend_demand'){
                //         if(req.decoded && req.decoded.role==config_common.user_roles.TRAFFIC_ADMIN){
                //             cb2();
                //         }else{
                //             //司机方-商业智能-推荐的物流头像
                //             http.sendUserServerNoToken(req, {
                //                 type: 'driver_traffic'
                //             }, config_api_url.user_push_get_list, function (err, company) {
                //                 result['push_pass_info'] = company || [];
                //                 cb2();
                //             });
                //         }
                //     }else{
                //         cb2();
                //     }
                //
                // }
            }, cb)

        }
    ], function (err) {
        if(err){
            return callback(err);
        }
        callback(null, result);
    });

};
//司机方-商业智能-推荐的物流头像
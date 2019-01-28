/**
 * by Administrator 20170410
 */
var _ = require('underscore');
var async = require('async');
var http = require('../lib/http');
var config_api_url = require('../configs/config_api_url');
var config_common = require('../configs/config_common');
var tipSV = require('../lib/lib_tip');
var trafficDemandSV = require('../lib/lib_traffic_demand');
var trafficPlanSV = require('../lib/lib_traffic_plan');
var trafficOrderSV = require('../lib/lib_traffic_order');
var driverDemandSV = require('../lib/lib_traffic_driver_demand');
var driverPlanSV = require('../lib/lib_traffic_driver_plan');
var driverOrderSV = require('../lib/lib_traffic_driver_order');
var trafficLineSV = require('../lib/lib_traffic_line');
var trafficMsgLogDB=require('../dbs/db_base')('TrafficMsgLog');
var redCardSV=require('../lib/lib_red_card');
var redCardOrderSV=require('../lib/lib_red_card_order');
/**
 * 增删改查 getOne, getList, getCount
 */
// param :obj = {source: '', db:'', method:'', query: {find:'', select:'', ...},}
exports.generalFun = function(req, obj, callback){
    if(!obj && !obj.source && !obj.db && !obj.method && !obj.query){
        return callback({dev: '参数有误', pro:'000003'});
    }

    var server = {'trade': 'sendTradeServerNew', 'user': 'sendUserServerNew', 'statistic': 'sendStatisticServerNew', 'admin': 'sendAdminServerNew'};
    http[server[obj.source]](req, {
        cond: obj.query,
        model: obj.db,
        method: obj.method
    }, config_api_url.user_server_common, callback);
};
exports.push = function (req, data, cond, index, clientDate, callback) {
    /**
     * req, data:{
     *  title:'短信小标题',
     *  content: '短信文字描述',
     *  user_ids: '用户id'
     *  }, cond:{
     *  find: 关系查询条件
     *  } , index: 用户id的索引, clientData
     */
    /**
     * 1，指派物流需求单
     *      已知物流公司id,
     *          需查询物流公司的管理员id,
     * 2，物流公司接单
     *      已知发布物流需求单的交易用户id
     * 3, 指派司机
     *      已知司机id
     * 4, 司机接单
     *      已知发布司机需求单的物流用户id
     * 5, 司机订单结束
     *      已知司机订单物流方用户id;
     **/
    //增加语音文件
    if (!callback) callback = function () {};
    async.waterfall([
        function (cb) {
            //增加语音文件
            // http.sendBaiDuTTs({text: data.content , user_id: ''}, cb)
            cb();
        },
        function (cb) {
            clientDate['mp3'] = '';
            data.data = JSON.stringify(clientDate);
            data.user_ids = JSON.stringify(data.user_ids);
            http.sendMsgServerNew(req, data, config_api_url.msg_server_push, cb);
            msgLog(req,{template_id:data.title, phone_list:data.user_ids, sms:data.content, case_id: _.values(clientDate.params)[0]});
        }
    ], callback);
};

//交易用户和公司信息
exports.userFind = function(obj, callback){
    var userInfo = {};
    if(!obj.user_id){
        return callback({dev: 'user_id参数有误', pro: '000003'}); //('not_user_id')
    }
    async.waterfall([
        function (cb) {
            //如果传递了user_id，则先查用户信息，否则向下继续
            http.sendUserServerNew('', {
                cond: {find: {_id: obj.user_id}, select:'phone photo_url real_name role company_id province city district'},
                model: 'User_trade',
                method: 'getOne',
            }, config_api_url.user_server_common, cb);
        },
        function (user, cb) {
            if(user){
                cb(null, user);
            }else{
                http.sendUserServerNew('', {
                    cond: {find: {_id: obj.user_id}, select:'phone photo_url real_name role company_id province city district id_card_number_url jia_shi_zheng_url other_picture'},
                    model: 'User_traffic',
                    method: 'getOne',
                }, config_api_url.user_server_common, cb);
            }
        },
        function (user, cb) {
            if(!user){
                // return cb({dev: '没找到用户数据,id:'+obj.user_id, pro: '000004'});
                return callback(null, {}); //查询不到用户，则返回空对象
            }
            userInfo['user_name'] = user.real_name;
            userInfo['user_photo'] = user.photo_url;
            userInfo['user_phone'] = user.phone;
            userInfo['user_role'] = user.role;
            userInfo['id_card_number_url'] = user.id_card_number_url;
            userInfo['jia_shi_zheng_url'] = user.jia_shi_zheng_url;
            userInfo['other_picture'] = user.other_picture;

            var dataModel = user.role.split('_')[0] == 'TRADE' ? 'Company_trade' : 'Company_traffic' ;
            // 区分司机和非司机
            if(userInfo['user_role']==config_common.user_roles.TRAFFIC_DRIVER_PUBLISH || userInfo['user_role']==config_common.user_roles.TRAFFIC_DRIVER_PRIVATE){
                //获取车辆信息
                http.sendUserServerNew('', {
                    cond: {
                        find: {
                            // $or: [{create_user_id: userInfo._id}, {user_id: {$in: [userInfo._id]}}] //20180314 司机增加默认车辆启用下方查询
                            user_id: {$in: [obj.user_id]},
                            // $or: [
                            //     {is_default:true, is_default:{$exists: true}}
                            //     ,{is_default:{$exists: false}}
                            // ]
                        },
                        select:'long number type weight che_tou_zhao_url brand xing_shi_zheng_url yun_ying_zheng_url che_tou_zhao_url',
                        sort: {is_default: -1}
                    },
                    model: 'Truck',
                    method: 'getList'
                }, config_api_url.user_server_common, cb);
            }else{
                //获取公司信息
                http.sendUserServerNew('', {
                    cond: {find: {_id: user.company_id}, select:'nick_name url_logo verify_phase sell buy transport province city'},
                    model: dataModel,
                    method: 'getOne',
                }, config_api_url.user_server_common, cb);
            }
            
        },
        function(compInfo, cb){
            if(compInfo){
                if(userInfo['user_role']==config_common.user_roles.TRAFFIC_DRIVER_PUBLISH || userInfo['user_role']==config_common.user_roles.TRAFFIC_DRIVER_PRIVATE){
                    if(compInfo.length>0){
                        userInfo = _.extend(userInfo, {
                            truck_id : compInfo[0]._id,
                            truck_long : compInfo[0].long,
                            truck_num : compInfo[0].number,
                            truck_type : compInfo[0].type,
                            truck_weight : compInfo[0].weight,
                            truck_logo : compInfo[0].che_tou_zhao_url,
                            truck_brand : compInfo[0].brand,
                            xing_shi_zheng_url: compInfo[0].xing_shi_zheng_url,
                            yun_ying_zheng_url: compInfo[0].yun_ying_zheng_url,
                            che_tou_zhao_url: compInfo[0].che_tou_zhao_url
                        });
                    }
                }else{
                    userInfo = _.extend(userInfo, {
                        company_id: compInfo._id.toString(),
                        company_name : compInfo.nick_name,
                        company_logo : compInfo.url_logo || '',
                        verify_phase : compInfo.verify_phase,
                        company_sell : _.map(compInfo.sell, function(e){return config_common.material[e]}),
                        company_buy : _.map(compInfo.buy, function(e){return config_common.material[e]}),
                        company_transport : _.map(compInfo.transport, function(e){return config_common.material[e]}),
                        company_province: compInfo.province,
                        company_city: compInfo.city,

                    });
                }
            }
            cb(null, userInfo);
        }
    ], callback);
};

//司机和车辆信息 (与上雷同)
exports.driverUser = function(obj, callback, req){
    var userInfo = {};
    if(!obj.user_id){
        return callback({dev: 'user_id参数有误', pro: '000003'})
    }
    async.waterfall([
        function (cb) {
            //如果传递了user_id，则先查用户信息，否则向下继续
            http.sendUserServerNew('', {
                cond: {find: {_id: obj.user_id}, select:'real_name photo_url company_id phone id_card_number_url jia_shi_zheng_url other_picture recommend'},
                model: 'User_traffic',
                method: 'getOne'
            }, config_api_url.user_server_common, cb);
        }, function (user, cb) {
            if (!user) {
                cb(null, null);
            } else {
                userInfo = user;
            }
            //检查是否上线
            if(req){
                http.sendMsgServerNew(req, {user_id: obj.user_id}, config_api_url.msg_server_push_one, cb);
            }else{
                cb(null,null);
            }            
        },function(uuid, cb){
            userInfo['newLogin']=uuid ? (new Date(uuid.time_creation)).getTime() : 0;
            http.sendUserServerNew('', {
                    cond: {
                        find: {
                            // $or: [{create_user_id: userInfo._id}, {user_id: {$in: [userInfo._id]}}] //20180314 司机增加默认车辆启用下方查询
                            user_id: {$in: [obj.user_id]},
                            // $or: [
                            //     {is_default:true, is_default:{$exists: true}}
                            //     ,{is_default:{$exists: false}}
                            // ]
                        },
                        select:'long number type weight che_tou_zhao_url brand xing_shi_zheng_url yun_ying_zheng_url che_tou_zhao_url',
                        sort: {is_default: -1}
                    },
                    model: 'Truck',
                    method: 'getList'
                }, config_api_url.user_server_common, cb);
            
        }, function(dataRes, cb){
            if(dataRes && dataRes.length>0){
                userInfo = _.extend(userInfo, {
                    truck_id : dataRes[0]._id,
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
            cb(null, userInfo);
        }
    ], callback);
};

var userLogo = function (role, cond, callback) {
    http.sendUserServerNew('', {
        cond: {find: cond, select:'photo_url real_name phone'},//{_id: {$in: cond}}
        model: 'User_'+role, //trade
        method: 'getList',
    }, config_api_url.user_server_common, callback);
};
exports.userLogo = userLogo;

//获取创建公司的用户信息
exports.companyUserLogo = function (role, cond, othCond, callback) {
  var phone_arr = [], _cond = othCond;
    async.waterfall([
        function (cb) {
            http.sendUserServerNew('', {
                cond: {find: cond, select:'phone_creator'},//{_id: {$in: cond}}
                model: 'Company_'+role, //trade
                method: 'getList',
            }, config_api_url.user_server_common, cb);
        }, function (phoneObj, cb) {
            if(phoneObj){
                //通过公司_id获取用户信息
                phone_arr = _.pluck(phoneObj, '_id');
                _cond = _.extend(_cond, {company_id:{$in: phone_arr}});
                userLogo(role, _cond, cb);
            }else{
                cb();
            }
        }
    ], callback);
};

//统计服务器
exports.statisticalSV = function (data, type, callback) {
    if(!callback){
        var callback = function(){};
    }
    var url=false ;
    async.waterfall([
        function (cb) {
            if(!type){
                console.log('statisticalSV:' + '被统计数据丢失')
            }
            switch(type) {
                case 'trade' :
                    url = config_api_url.statis_server_companyTrade_add;
                    break;
                case 'traffic' :
                    url = config_api_url.statis_server_companyTraffic_add;
                    break;
                case 'order' :
                    url = config_api_url.statis_server_order_add;
                    break;
                case 'driver' :
                    url = config_api_url.statis_server_userDriver_add;
                    break;
            }
            if(url){
                cb()
            }
        }, function (cb) {
            http.sendStatisticServerNew('', data, url, cb);
        }
    ], callback);

};

//获取上一次查阅时间
exports.tipPassDemand = function (condition, flag, status, role, callback) {
    var cond = condition||{};
    cond.type = config_common.tip_type.pass_demand;
    
    async.waterfall([
        function(cb){
            tipSV.getTime(cond, flag, cb);
        },
        function(tipRes, cb){
            //查询自己能接单的数据
            var tipCond = {
                demand_company_id: cond.other_company_id,
                time_modify: {$gte: tipRes.update_time},
                status: status || config_common.demand_status.effective
            };
            // if(role == config_common.user_roles.TRAFFIC_ADMIN){
            if(config_common.accessRule.pass.indexOf(role) > -1){
                tipCond = _.extend(tipCond, {
                    verify_company : {$in: [cond.company_id]}
                });
            }
            trafficDemandSV.getCount(tipCond, function (err, count) {
                if(err){ 
                    return cb(err);
                }else{
                    return cb(null, {company_id: cond.other_company_id, update_time: tipRes.update_time, count: count});
                }
            });
        }
    ], callback);  
};
//获取上一次查阅时间
exports.tipPassPlan = function (condition, flag, status, callback) {
    var cond = condition || {};
    cond.type = config_common.tip_type.pass_plan;

    async.waterfall([
        function(cb){
            tipSV.getTime(cond, flag, cb);
        },
        function(tipRes, cb){
            //查询自己能接单的数据
            trafficPlanSV.getCount({
                user_id: cond.user_id,
                time_modify: {$gte: tipRes.update_time},
                status: config_common.demand_status.effective
            }, function (err, count) {
                if(err){
                    return cb(err);
                }else{
                    return cb(null, {update_time: tipRes.update_time, count: count});
                }
            });
        }
    ], callback);
};
//获取上一次查阅时间
exports.tipPassOrder = function (condition, flag, status, role, callback, temp) {
    var cond = condition||{};
    
    cond.type = config_common.tip_type.pass_order;

    async.waterfall([
        function(cb){
            tipSV.getTime(cond, flag, cb);
        },
        function(tipRes, cb){
            //查询自己能接单的数据
            var orderCond = {time_update_step: {$gte: tipRes.update_time}, status: status || {$in:[config_common.demand_status.ineffective,
                config_common.demand_status.effective,config_common.demand_status.complete,config_common.demand_status.cancelled]}};
            if(role == 'TRAFFIC_ADMIN'){
                orderCond.supply_user_id = cond.user_id;
            }else{
                orderCond.demand_user_id = cond.user_id;
            }
            if(temp == 'special'){
                orderCond.step = {$gte:3, $lt: 4};
            }
            trafficOrderSV.getCount(orderCond, function (err, count) {
                if(err){
                    return cb(err);
                }else{
                    return cb(null, {company_id: cond.other_company_id, update_time: tipRes.update_time, count: count});
                }
            });
        }
    ], callback);
};
//获取上一次查阅时间
exports.tipDriverDemand = function (condition, flag, status, role, callback) {
    var cond = condition||{};
    cond.type = config_common.tip_type.driver_demand;

    async.waterfall([
        function(cb){
            tipSV.getTime(cond, flag, cb);
        },
        function(tipRes, cb){
            //查询自己能接单的数据
            //如果是物流，则查自己的，如果是司机这查可以看到
            // var tipCon = {time_modify: {$gte: tipRes.update_time}, status: status || config_common.demand_status.effective};
            var tipCon = {time_creation: {$gte: tipRes.update_time}, status: status || config_common.demand_status.effective};
            // if(role == config_common.user_roles.TRAFFIC_ADMIN){
            if(config_common.accessRule.pass.indexOf(role) > -1){
                tipCOn = _.extend(tipCon, {
                    demand_user_id: cond.user_id,
                });
            }else{
                tipCon = _.extend(tipCon, {
                        demand_company_id: cond.other_company_id,
                        verify_driver : {$in: [cond.user_id]},
                    }
                );
            }
            driverDemandSV.getCount(tipCon, function (err, count) {
                if(err){
                    return cb(err);
                }else{
                    return cb(null, {company_id: cond.other_company_id, update_time: tipRes.update_time, count: count});
                }
            });
        }
    ], callback);
};
//获取上一次查阅时间
exports.tipDriverPlan = function (condition, flag, status, callback) {
    var cond = condition || {};
    cond.type = config_common.tip_type.driver_plan;

    async.waterfall([
        function(cb){
            tipSV.getTime(cond, flag, cb);
        },
        function(tipRes, cb){
            //查询自己能接单的数据
            driverPlanSV.getCount({
                user_id: cond.user_id,
                // time_modify: {$gte: tipRes.update_time},
                time_creation: {$gte: tipRes.update_time},
                status: config_common.demand_status.effective
            }, function (err, count) {
                if(err){
                    return cb(err);
                }else{
                    return cb(null, {update_time: tipRes.update_time, count: count});
                }
            });
        }
    ], callback);
};
//获取上一次查阅时间
exports.tipDriverOrder = function (condition, flag, status, role, callback) {
    var cond = condition||{};

    cond.type = config_common.tip_type.driver_order;

    async.waterfall([
        function(cb){
            tipSV.getTime(cond, flag, cb);
        },
        function(tipRes, cb){
            //查询自己能接单的数据
            // var orderCond = {time_update_step: {$gte: tipRes.update_time}, status: status || {$in:[config_common.demand_status.ineffective,
            //     config_common.demand_status.effective,config_common.demand_status.complete,config_common.demand_status.cancelled]}};
            var orderCond = {time_creation: {$gte: tipRes.update_time}, status: status || {$in:[config_common.demand_status.ineffective,
                config_common.demand_status.effective,config_common.demand_status.complete,config_common.demand_status.cancelled]}};
            if(role == 'TRAFFIC_ADMIN'){
                orderCond.demand_user_id = cond.user_id;
            }else{
                orderCond.supply_user_id = cond.user_id;
            }
            driverOrderSV.getCount(orderCond, function (err, count) {
                if(err){
                    return cb(err);
                }else{
                    return cb(null, {company_id: cond.other_company_id, update_time: tipRes.update_time, count: count});
                }
            });
        }
    ], callback);
};
exports.addDynamicServer = function(data, callback){
    if(!callback){
        callback = function (){};
    }
    http.sendDynamicServer(data, config_api_url.dynamic_server_company_dynamic_add, callback);
};

exports.userToken = function(user_id, callback) {
    if (!callback) {
        callback = function () {
        };
    }
    http.sendUserServerNew('', {
        user_id: user_id
    }, config_api_url.user_get_token, callback);
};

exports.tipLinePrice = function (tipCond, cond, flag, callback) {
    var tipCond = tipCond || {}, cond = cond || {};
    tipCond.type = config_common.tip_type.line_price;

    async.waterfall([
        function(cb){
            tipSV.getTime(tipCond, flag, cb);
        },
        function(tipRes, cb){
            //查询自己能接单的数据
            cond.time_modify = {$gte: tipRes.update_time};
            trafficLineSV.getCount(cond, function (err, count) {
                if(err){
                    return cb(err);
                }else{
                    return cb(null, {update_time: tipRes.update_time, count: count});
                }
            });
        }
    ], callback);
};

exports.judgeStore = function (cond, callback) {
    this.generalFun({}, {
        source: 'user',
        db: 'Address',
        method: 'getOne',
        query: {
            find: cond
        }
    }, callback);
};

exports.storeServerOrderTrafficComplete = function(data, callback){
    if(!callback){
        callback = function (){};
    }
    http.sendStoreServer(data, config_api_url.store_server_order_traffic_complete, callback);
};

exports.storeServerOrderTrafficAdd = function(data, callback){
    if(!callback){
        callback = function (){};
    }
    http.sendStoreServer(data, config_api_url.store_server_order_traffic_add, callback);
};

exports.storeServerOrderTradeAdd = function(data, callback){
    if(!callback){
        callback = function (){};
    }
    http.sendStoreServer(data, config_api_url.store_server_order_trade_add, callback);
};
exports.storeClientSetStoreRegion = function(req, data, callback){
    if(!callback){
        callback = function (){};
    }
    http.sendStoreServerNew(req, data, config_api_url.store_client_set_store_region, callback);
};
exports.storeServerOrderTradeComplete = function(data, callback){
    if(!callback){
        callback = function (){};
    }
    http.sendStoreServer(data, config_api_url.store_server_order_trade_complete, callback);
};

//通过公司查询用户
exports.companyGetUser = function (obj, callback) {
    var userInfo = {}, companyModel = 'Company_trade', userModel='User_trade';
    if(!obj.company_id){
        return callback({dev: 'company_id参数有误', pro: '000003'}); //('not_user_id')
    }
    async.waterfall([
        function (cb) {
            http.sendUserServerNew('', {
                cond: {find: {_id: obj.company_id}, select:'nick_name phone_creator url_logo verify_phase sell buy transport'},
                model: companyModel,
                method: 'getOne'
            }, config_api_url.user_server_common, cb);
        },
        function (company, cb) {
            if(company) {
                cb(null, company);
            }else {
                companyModel = 'Company_traffic'; userModel='User_traffic';
                http.sendUserServerNew('', {
                    cond: {find: {_id: obj.company_id}, select:'nick_name phone_creator url_logo verify_phase sell buy transport'},
                    model: companyModel,
                    method: 'getOne'
                }, config_api_url.user_server_common, cb);
            }
        },function (compInfo, cb) {
            if(!compInfo){
                // return cb({dev: '公司信息为查到'});
               return callback(null, null)
            }
            userInfo = _.extend(userInfo, {
                company_id: compInfo._id.toString(),
                company_phone: compInfo.phone_creator,
                company_name : compInfo.nick_name,
                company_logo : compInfo.url_logo || '',
                verify_phase : compInfo.verify_phase,
                company_sell : _.map(compInfo.sell, function(e){return config_common.material[e]}),
                company_buy : _.map(compInfo.buy, function(e){return config_common.material[e]}),
                company_transport : _.map(compInfo.transport, function(e){return config_common.material[e]})
            });
            //如果传递了user_id，则先查用户信息，否则向下继续
            http.sendUserServerNew('', {
                cond: {
                    find: {company_id: {$in: [userInfo.company_id]}, role: {$in: [config_common.user_roles.TRAFFIC_ADMIN, config_common.user_roles.TRADE_ADMIN]}},
                    select:'phone photo_url real_name role company_id recommend'
                },
                model: userModel,
                method: 'getOne'
            }, config_api_url.user_server_common, cb);
        }, function (user, cb) {
            if(user){
                userInfo['user_id'] = user._id.toString();
                userInfo['user_name'] = user.real_name;
                userInfo['user_photo'] = user.photo_url;
                userInfo['user_role'] = user.role;
                userInfo['recommend'] = user.recommend;
            }
            cb(null, userInfo);
        }
    ], callback);
};
//信息费支付
exports.tipPricePay = function(data, callback){
    if(!callback){
        callback = function (){};
    }
    http.sendPayServer(data, config_api_url.store_server_order_trade_complete, callback);
};
//发消息
exports.send_sms = function (sms, template_id, phone_list, callback, req, case_id) {
    if (!callback) callback = function () {
    };
    
    async.waterfall([
        function (cb) {
            var url = 'www.e-wto.com';
            if(sms[sms.length-1] == 'driver'){
                sms.pop();
                sms.push('vehicles.e-wto.com');
            }else{
                sms.push(url);
            }
            msgLog(req,{template_id:template_id,phone_list:phone_list,sms:sms, case_id: case_id});
            http.sendMsgServerNew(req, {
                content: JSON.stringify(sms),
                phone_list: phone_list,
                template_id: template_id
            }, config_api_url.msg_server_send_sms1 + '/template' + '/' + 'GBK', cb);
        }
    ], callback);
};
var msgLog=function (req, data) {
    if(req.decoded && req.decoded.id && data && data.template_id && data.sms && data.phone_list){
        trafficMsgLogDB.add({
            user_id: req.decoded.id, //物流需求单id
            role: req.decoded.role, //物流需求单id TRAFFIC_ADMIN, TRAFFIC_DRIVER_PRIVATE,
            type: data.template_id, //,
            accept_user_id: _.isString(data.phone_list)? data.phone_list : JSON.stringify(data.phone_list),//接收人
            push_content: JSON.stringify(data.sms), //推送内容
            case_id: data.case_id
        }, function(x,y){console.log(x,y)})
    }
};
exports.msgLog=msgLog;

/**
 *司机短信
 * 20180815 登录一周之内发布短信，一周之后变成推送
 */

exports.driverMsg=function (req, data, callback) {

    if(!data.phone || !data.params || !data.templateid){
        return callback({dev: '参数不足'})
    }
    var body = {
            phone: JSON.stringify(data.phone),
            params: JSON.stringify(data.params),
            templateid: data.templateid
        },
        url = '/msg/send_driver_sms';//config_api_url.msg_send_driver_sms;
    msgLog(req, {
        template_id: data.templateid, //,
        phone_list: data.phone,//接收人
        sms: data.params, //推送内容
        case_id: data.id
    });
    if(process.env.node_env == 'dev'){
        return callback();
    }
    http.sendMsgServerNew(req, body, url, callback);

};
/*
* 红包文字提醒
*  data: {demand_company_id: '', user_id: ''}
* */

exports.redcardtip=function(req, data, callback){
    async.parallel({
        card: function (push3) {
            redCardSV.getOne({find: {
                company_id: data.company_id,
                time_creation: {$gt: new Date()},
                status: config_common.demand_status.effective
            }}, push3)
        },
        cardOrder:function(push3){
            redCardOrderSV.getOne({find: {
                user_id: data.user_id,
                send_company_id: data.company_id,
                status: config_common.demand_status.ineffective
            }}, push3);
        },
        uuid: function(push3){
            http.sendMsgServerNew(req, {user_id: data.user_id}, '/api/push/get_one', push3)
        }
    }, callback)
}

/*
* 司机端增加语音
* */
exports.driverTTS=function(req, demandOne, callback){
    if(req.decoded.role == config_common.user_roles.TRAFFIC_DRIVER_PRIVATE && demandOne && demandOne.status=='effective'){
        var msgTxt = '', totalPrice=config_common.rscDecimal('mul', demandOne.amount, demandOne.price);
        // msgTxt += '老司机,'+demandOne.demand_company_name + '发布'+demandOne.send_city+'到'+demandOne.receive_city+'的运输'+demandOne.category_penult_chn;
        msgTxt += '老司机,'+demandOne.demand_company_name + '发布'+demandOne.send_city;
        if(demandOne.send_district){
            msgTxt +=demandOne.send_district;
        }
        msgTxt +='到'+demandOne.receive_city;
        if(demandOne.receive_district){
            msgTxt +=demandOne.receive_district;
        }
        msgTxt += '的运输'+demandOne.category_penult_chn + '共计'+demandOne.amount+'吨,快来接单';

        //生成语音并附上连接
        http.sendBaiDuTTs({
            text: msgTxt,
            order_id: demandOne._id.toString()
        }, callback);
    }else{
        callback();
    }    
};

//模拟交易和物流的合作关系
exports.tradePassRelation=function(req, obj, callback){
   
    async.waterfall([
        function (cb) {
            //模拟申请合作的消息
            http['sendUserServerNew'](req, {
                cond: {
                    user_id: obj.trade_user_id,
                    company_id: obj.trade_company_id,
                    other_company_id: obj.pass_company_id,
                    other_user_id:obj.pass_user_id,
                    type: 'WORK',
                    extend: 'PURCHASE',//PURCHASE,TRAFFIC
                    time_creation: new Date(),
                    status:'ACCEPT'
                },
                model: 'Apply_relation_online',
                method: 'add'
            }, config_api_url.user_server_common, cb);
        },
        function (online, cb) {
            //模拟合作企业的消息
            http['sendUserServerNew'](req, {
                cond: {
                    self_id: obj.trade_company_id,
                    other_id: obj.pass_company_id,
                    other_type: 'TRAFFIC',
                    time_creation: new Date(),
                    status:'ACCEPT'
                },
                model: 'Company_relation',
                method: 'add'
            }, config_api_url.user_server_common, cb);
        },
        function (online, cb) {
            //模拟合作企业的消息
            http['sendUserServerNew'](req, {
                cond: {
                    self_id: obj.pass_company_id,
                    other_id: obj.trade_company_id,
                    other_type: 'PURCHASE',
                    time_creation: new Date(),
                    status:'ACCEPT'
                },
                model: 'Company_relation',
                method: 'add'
            }, config_api_url.user_server_common, cb);
        },
        function (online, cb) {
            //模拟合作企业的消息
            http['sendUserServerNew'](req, {
                cond: {
                    "user_id" : obj.pass_user_id,
                    "company_id" : obj.pass_company_id,
                    "other_user_id" : obj.trade_user_id,
                    "other_company_id" : obj.trade_company_id,
                    "type" : "PURCHASE",
                    "time_creation" : new Date()
                },
                model: 'Work_relation',
                method: 'add'
            }, config_api_url.user_server_common, cb);
        },
        function (online, cb) {
            //模拟合作企业的消息
            http['sendUserServerNew'](req, {
                cond: {
                    "user_id" : obj.trade_user_id,
                    "company_id" : obj.trade_company_id,
                    "other_user_id" : obj.pass_user_id,
                    "other_company_id" : obj.pass_company_id,
                    "type" : "TRAFFIC",
                    "time_creation" : new Date()
                },
                model: 'Work_relation',
                method: 'add'
            }, config_api_url.user_server_common, cb);
        }
    ], callback)
};
//模拟物流和司机的挂靠
exports.passDriverRelation=function(req, obj, callback){
    async.waterfall([
        function (cb) {
            //模拟申请合作的消息
            http['sendUserServerNew'](req, {
                cond: {
                    "user_id" : obj.pass_user_id,
                    "company_id" : obj.pass_company_id,
                    "other_user_id" : obj.driver_user_id, //司机
                    "type" : "COMPANY_SUPPLY",
                    "extend" : "TRAFFIC_DRIVER_PRIVATE",
                    "time_creation" : new Date(),
                    "status" : "ACCEPT"
                },
                model: 'Apply_relation_online',
                method: 'add'
            }, config_api_url.user_server_common, cb);
        },
        function (online, cb) {
            //模拟合作企业的消息
            http['sendUserServerNew'](req, {
                cond: {
                    user_id : obj.driver_user_id,
                    company_id : obj.pass_company_id, //物流
                    approve_id : obj.pass_user_id, //物流
                    time_creation: new Date()
                },
                model: 'Driver_verify',
                method: 'add'
            }, config_api_url.user_server_common, cb);
        }
    ], callback)
};

//查挂靠关系
exports.multDriverVerify=function(req, obj, callback){
    var cond={};
    if(obj['user_id'] && obj['company_id']){
        //查关系
        cond = {
            user_id: obj['user_id'],
            company_id: obj['company_id'],
            approve_id: obj['approve_id']
        }

    }else if(obj['user_id'] && !obj['company_id']){
        //查挂靠公司
        cond = {
            user_id: obj['user_id']
        }

    }else if(!obj['user_id'] && obj['company_id']){
        //查挂靠司机
        cond = {
            company_id: {$in: obj['company_id']}
        }
    }
    http['sendUserServerNew'](req, {
        cond: cond,
        model: 'Driver_verify',
        method: 'getList'
    }, config_api_url.user_server_common, callback);
};
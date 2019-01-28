/**
 * 线路报价，依线路为主
 */
var _ = require('underscore');
var async = require('async');
var http = require('../lib/http');
var util = require('../lib/util');
var config_api_url = require('../configs/config_api_url');
var config_common = require('../configs/config_common');
var DB = require('../dbs/db_base')('TrafficLine');
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
    var result = {count: 0, lines: [], exist: false};
    async.waterfall([
        function (cb) {
            DB.getCount(data.find, cb);
        }, function (count, cb) {
            result.count = count;
            result.exist = count > data.page * config_common.entry_per_page;
            DB.getList(data, cb);
        }, function (lists, cb) {
            async.eachSeries(lists, function (list, cb1) {
                var demandOne = list.toObject();
                extServer.userFind({user_id: list.user_id}, function(err, user){
                    // if(err){
                    //     return cb(err);
                    // }
                    if(!err){
                        demandOne = _.extend(demandOne, user);
                    }
                    result.lines.push(demandOne);
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

    //-----------
    /*DB.getCount(data.find,function(err,count){
        if(err){
            return callback(err);
        }
        DB.getList(data,function(err, orders){
            if(err){
                return callback(err);
            }
            callback(null,{
                lines: orders,
                exist: count > data.page*config_common.entry_per_page,
                count: count
            });
        });
    });*/
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
//批量增加
exports.addList = function(data, callback){
    DB.addList(data, callback);
};

exports.lineLink = function (line) {
    //线路找线路 ,出发-到达 被 出发-到达所包含， 
    if(!line ||!line.section){
        return;
    }
    return {'mix': {
        $or: [
            {section: {$in: line.section}, end_section: {$in: line.end_section}},
            {end_section: {$in: line.section}, section: {$in: line.end_section}},
            // {section: {$in: line.unsection}, end_section: {$in: line.end_unsection}},
            // {end_section: {$in: line.unsection}, section: {$in: line.end_unsection}},
            {unsection: {$in: line.unsection}, end_unsection: {$in: line.end_unsection}},
            {end_unsection: {$in: line.unsection}, unsection: {$in: line.end_unsection}},
        ]
    }};
};

exports.pathLink = function (line) {
    //需求单找线路 需求单中的section有3个元素: 省, 省市, 省市县
    if(!line ||!line.section || !line.end_section){
        return;
    }
    //需求单的起点终点区域 匹配 线路的区域
    // {'mix': {section: {$in: _.union(line.section, line.end_section)}}};
    // return {'mix': {section: {$in: _.union(line.section, line.end_section)}}}; //{'mix': {section: {$in: line.section}}}
    return {'mix': {$or: [
        {section: {$in: line.section}, end_section: {$in: line.end_section}}, 
        {end_section: {$in: line.section}, section: {$in: line.end_section}}
    ]}};
};

exports.linePath = function (line) {
    //线路找需求单
    if(!line ||!line.section){
        return;
    }
    // return {'goto': {section: {$in: line.section}}, 'goback': {end_section: {$in: line.section}}, 'mix': {section: {$in: line.section}, end_section: {$in: line.section}}};
    return {'goto': {section: {$in: line.section}, end_section: {$in: line.end_section}}, 'goback': {end_section: {$in: line.section}, section: {$in: line.end_section}},
        'mix': {$or: [
            {section: {$in: line.section}, end_section: {$in: line.end_section}}, 
            {end_section: {$in: line.section}, section: {$in: line.end_section}}
        ]}};
};
/*

exports.pathLink_old = function (line) {
    if(!line ||!line.start_province || !line.end_province){
        return;
    }
    var goto_cond = {send_province: line.start_province, receive_province: line.end_province};
    //去程起点A
    if(line.start_district.length==0 && line.start_city.length >= 1){
        //全区
        goto_cond.send_city = {$in: line.start_city};
    }
    if(line.start_district.length>=1){
        //包含县
        goto_cond.send_district = {$in: line.start_district};
    }
    //去程终点A
    if(line.end_district.length==0 && line.end_city.length>=1){
        //全区
        goto_cond.receive_city = {$in: line.end_city};
    }
    if(line.end_district.length>=1){
        //固定县
        goto_cond.receive_district = {$in: line.end_district};
    }
    //--------------- goback_cond ----------------------//
    //回城起点A
    var goback_cond = {receive_province: line.start_province, send_province: line.end_province};
    if(line.start_district.length==0 && line.start_city.length >= 1){
        //全区
        goback_cond.receive_city = {$in: line.start_city};
    }
    if(line.start_district.length>=1){
        //包含县
        goback_cond.receive_district = {$in: line.start_district};
    }
    //回城终点A
    if(line.end_district.length==0 && line.end_city.length>=1){
        //全区
        goback_cond.send_city = {$in: line.end_city}
    }
    if(line.end_district.length>=1){
        //固定县
        goback_cond.send_district = {$in: line.end_district};
    }
    var mixture = {$or: [goto_cond, goback_cond]};
    return {'goto': goto_cond, 'goback': goback_cond, 'mix': mixture};
};

exports.lineLink_old = function (line) {
    if(!line ||!line.start_province || !line.end_province){
        return;
    }
    var goto_cond = {start_province: line.start_province, end_province: line.end_province};
    //去程起点A
    if(line.start_district.length==0 && line.start_city.length >= 1){
        //全区
        goto_cond.start_city = {$in: line.start_city};
    }
    if(line.start_district.length>=1){
        //包含县
        goto_cond.start_district = {$in: line.start_district};
    }
    //去程终点A
    if(line.end_district.length==0 && line.end_city.length>=1){
        //全区
        goto_cond.end_city = {$in: line.end_city};
    }
    if(line.end_district.length>=1){
        //固定县
        goto_cond.end_district = {$in: line.end_district};
    }
    //------------- goto_cond_b ------------------------//
    var goto_cond_b = {start_province: line.start_province, end_province: line.end_province, start_city: {$size: 0}, end_city: {$size: 0}};
    //------------- goto_cond_c ------------------------//
    var goto_cond_c = {start_province: line.start_province, end_province: line.end_province, start_district: {$size: 0}, end_district: {$size: 0}};
    //去程起点A
    if(line.start_district.length==0 && line.start_city.length >= 1){
        //全区
        goto_cond_c.start_city = {$in: line.start_city};
    }
    //去程终点A
    if(line.end_district.length==0 && line.end_city.length>=1){
        //全区
        goto_cond_c.end_city = {$in: line.end_city};
    }
    //--------------- goback_cond ----------------------//
    //回城起点A
    var goback_cond = {end_province: line.start_province, start_province: line.end_province};
    if(line.start_district.length==0 && line.start_city.length >= 1){
        //全区
        goback_cond.end_city = {$in: line.start_city};
    }
    if(line.start_district.length>=1){
        //包含县
        goback_cond.end_district = {$in: line.start_district};
    }
    //回城终点A
    if(line.end_district.length==0 && line.end_city.length>=1){
        //全区
        goback_cond.start_city = {$in: line.end_city}
    }
    if(line.end_district.length>=1){
        //固定县
        goback_cond.start_district = {$in: line.end_district};
    }
    //--------------- goback_cond_b ----------------------//
    var goback_cond_b = {end_province: line.start_province, start_province: line.end_province, start_city: {$size: 0}, end_city: {$size: 0}};
    //--------------- goback_cond_c ----------------------//
    var goback_cond_c = {end_province: line.start_province, start_province: line.end_province, start_district: {$size: 0}, end_district: {$size: 0}};
    if(line.start_district.length==0 && line.start_city.length >= 1){
        //全区
        goback_cond_c.end_city = {$in: line.start_city};
    }
    //回城终点A
    if(line.end_district.length==0 && line.end_city.length>=1){
        //全区
        goback_cond_c.start_city = {$in: line.end_city}
    }
    var goto = {$or: [goto_cond, goto_cond_b, goto_cond_c]};
    var goback = {$or: [goback_cond, goback_cond_b, goback_cond_c]};
    var mixture = {$or: [goto_cond, goto_cond_b, goto_cond_c, goback_cond, goback_cond_b, goback_cond_c]};
    return {'goto': goto, 'goback': goback, 'mix': mixture};
};
exports.pathLineLink_old = function (line) {
    if(!line ||!line.send_province || !line.receive_province){
        return;
    }
    var goto_cond = {start_city: {$size: 0}, end_city: {$size: 0}, start_province: line.send_province, end_province: line.receive_province};
    var goto_cond_b = {start_district: {$size: 0}, end_district: {$size: 0}, start_province: line.send_province, end_province: line.receive_province, start_city: {$in: [line.send_city]}, end_city: {$in: [line.receive_city]}};
    var goto_cond_c = {start_province: line.send_province, end_province: line.receive_province, start_city: {$in: [line.send_city]}, end_city: {$in: [line.receive_city]}, start_district: {$in: [line.send_district]}, end_district: {$in: [line.receive_district]}};


    var goback_cond = {start_city: {$size: 0}, end_city: {$size: 0}, start_province: line.receive_province, end_province: line.send_province};
    var goback_cond_b = {start_district: {$size: 0}, end_district: {$size: 0}, start_province: line.receive_province, end_province: line.send_province, start_city: {$in: [line.receive_city]}, end_city: {$in: [line.send_city]}};
    var goback_cond_c = {start_province: line.receive_province, end_province: line.send_province, start_city: {$in: [line.receive_city]}, end_city: {$in: [line.send_city]}, start_district: {$in: [line.receive_district]}, end_district: {$in: [line.send_district]}};


    var mixture = {$or: [goto_cond, goto_cond_b, goto_cond_c, goback_cond, goback_cond_b, goback_cond_c]};
    return {'goto': _.extend({}, goto_cond, goto_cond_b, goto_cond_c), 'goback': _.extend({}, goback_cond, goback_cond_b, goback_cond_c), 'mix': mixture};
};
*/

exports.specialList = function(data, callback, req){
    var result={lists:[],count:0,exist:false};
    async.waterfall([
        function (cb) {
        //     if(req.decoded.role==config_common.user_roles.TRAFFIC_ADMIN){
        //         DB.getList({find:{
        //             user_id: req.decoded.id,
        //             role: {$in: config_common.accessRule.pass}
        //         }}, cb);
        //     }else{
        //         cb(null,null);
        //     }
        // },
        // function(list,cb){
        //     if(list && list.length>0 && !req.body.start_province && !req.body.end_province){
        //         data.find.$or=[];
        //         _.each(list, function(c){
        //             data.find.$or.push({section: {$in: c.section.concat(c.unsection)}, end_section: {$in: c.end_section.concat(c.end_unsection)}})
        //         });
        //     }
            DB.getCount(data.find, cb);
        }, function (count, cb) {
            result.count = count;
            result.exist = count > data.page * config_common.entry_per_page;
            DB.getList(data, cb);
        }, function (lists, cb) {
            async.parallel({
                getList:function(cb2){
                    async.eachSeries(lists, function (list, cb1) {
                        var demandOne = list.toObject();
                        extServer.userFind({user_id: list.user_id}, function(err, user){
                            if(!err){
                                demandOne = _.extend(demandOne, user);
                            }
                            result.lists.push(demandOne);
                            cb1();
                        });
                    }, function(){
                        cb2(null, result);
                    });
                },
                recommend:function(cb2){
                    cb2();
                }
            }, cb);
            
        }
    ], function () {
        callback(null, result);
    })
};
exports.specialCount = function(data, callback, req){
    async.waterfall([
        function (cb) {
        //     if(req.decoded.role==config_common.user_roles.TRAFFIC_ADMIN){
        //         DB.getList({find:{
        //             user_id: req.decoded.id,
        //             role: {$in: config_common.accessRule.pass}
        //         }}, cb);
        //     }else{
        //         cb(null,null);
        //     }
        // },
        // function(list,cb){
        //     if(list && list.length>0 && !req.body.start_province && !req.body.end_province){
        //         data.find.$or=[];
        //         _.each(list, function(c){
        //             data.find.$or.push({section: {$in: c.section.concat(c.unsection)}, end_section: {$in: c.end_section.concat(c.end_unsection)}})
        //         });
        //     }
            DB.getCount(data.find, cb);
        }
    ], callback)

};

//pass_list_truck 运输-车辆行情 | 通过线路查询推荐车辆数和价格区间
var pass_list_truck=function(req, callback){
    //头像
    http.sendUserServerNoToken(req, {
        type: 'traffic_truck'
    }, config_api_url.user_push_get_list, function (err, company) {
        truckInfo['truck_info'] = company || [];
        cb();
    });
    //推荐线路
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
                line_cond = {_id: {$in: push.push_content}};
                cb1();
            }else{
                extServer.generalFun(req, {
                    source: 'user',
                    db:'Driver_verify',
                    method:'getList',
                    query:{
                        find: {company_id: {$in: req.decoded.company_id}} //req.decoded.company_id[0]}
                    }}, function(err, list){
                    line_cond = {user_id: {$nin: _.pluck(list, 'user_id')}, role: config_common.user_roles.TRAFFIC_DRIVER_PRIVATE};
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
            }, function (x,y) {
                if(base_time){
                    trafficPushSV.edit({
                        user_id: req.decoded.id,
                        role: req.decoded.role,
                        type: 'line',
                        time_creation: new Date(),
                        push_content: _.pluck(y.lines, '_id')
                    }, function () {});
                }
                cb1(x,y)
            });
        }
    ], cb)

}
//trade_recommend_line 交易查看智能推荐的物流线路
// var trade_recommend_line=
exports.trade_recommend_line=function(req, callback){
    var store_list=[], passPrice=[];
    async.waterfall([
        function (cb) {
            if(req.body.passPrice_id){
                cond = {_id: req.body.passPrice_id};
            }else if(req.body.pass_type){
                cond = {
                    user_id: req.decoded.id,
                    pass_type: req.body.pass_type
                };
            }
            extServer.generalFun(req, {
                source: 'trade',
                db:'PassPrice',
                method:'getList',
                query:{
                    find: cond,
                }}, cb);
        }, function (lists, cb) {
            if(lists){
                store_list=_.pluck(JSON.parse(JSON.stringify(lists)), 'location_storage');
                passPrice=_.pluck(JSON.parse(JSON.stringify(lists)), '_id');
            }
            async.parallel({
                section:function(cb1){
                    //获取起点
                    extServer.generalFun(req, {
                        source: 'user',
                        db: 'Address',
                        method: 'getList',
                        query: {
                            find: {_id: {$in:store_list}}
                        }
                    }, function (x,y) {
                        if(y){
                            var area=[];
                            _.each(y, function (x) {
                                if(x.province){
                                    var _tmp =config_common.demandAreaCollect(x.province, x.city, x.district);
                                    area = _.union(area, _tmp);
                                }
                            })
                            cb1(null, area);
                        }else{
                            cb1(null, []);
                        }
                    });
                },
                end_section:function(cb1){
                    var area=[];
                    //获取终点
                    if(req.body.dic && req.body.dic.length>0){
                        //客户端提供终点区域
                        _.each(req.body.dic, function (x) {
                            if(x.province){
                                var _tmp =config_common.demandAreaCollect(x.province, x.city, x.district);
                                area = _.union(area, _tmp);
                            }
                        });
                        cb1(null, area);
                    }else{
                        extServer.generalFun(req, {
                            source: 'trade',
                            db: 'PriceOfferCity',
                            method: 'getList',
                            query: {
                                find: {passPrice_id: {$in:passPrice}}
                            }
                        }, function (x,y) {
                            if(y){

                                _.each(y, function (x) {
                                    if(x.province){
                                        var _tmp =config_common.demandAreaCollect(x.province, x.city, x.district);
                                        area = _.union(area, _tmp);
                                    }
                                })
                                cb1(null, area);
                            }else{
                                cb1(null, []);
                            }
                        });
                    }

                },
                unsection:function(cb1){
                    //获取起点
                    extServer.generalFun(req, {
                        source: 'user',
                        db: 'Address',
                        method: 'getList',
                        query: {
                            find: {_id: {$in:store_list}}
                        }
                    }, function (x,y) {
                        if(y){
                            var area=[];
                            _.each(y, function (x) {
                                if(x.province){
                                    var _tmp =config_common.demandAreaCollect(x.province, x.city, x.district);
                                    area = _.union(area, _tmp);
                                }
                            })
                            cb1(null, area);
                        }else{
                            cb1(null, []);
                        }
                    });
                },
                end_unsection:function(cb1){
                    var area=[];
                    //获取终点
                    if(req.body.dic && req.body.dic.length>0){
                        //客户端提供终点区域
                        _.each(req.body.dic, function (x) {
                            if(x.province){
                                var _tmp =config_common.demandAreaCollect(x.province, x.city, x.district);
                                area = _.union(area, _tmp);
                            }
                        });
                        cb1(null, area);
                    }else{
                        extServer.generalFun(req, {
                            source: 'trade',
                            db: 'PriceOfferCity',
                            method: 'getList',
                            query: {
                                find: {passPrice_id: {$in:passPrice}}
                            }
                        }, function (x,y) {
                            if(y){

                                _.each(y, function (x) {
                                    if(x.province){
                                        var _tmp =config_common.demandAreaCollect(x.province, x.city, x.district);
                                        area = _.union(area, _tmp);
                                    }
                                })
                                cb1(null, area);
                            }else{
                                cb1(null, []);
                            }
                        });
                    }

                }
            }, cb);
        }
    ], callback)
};
//物流选择待指派的司机列表
exports.pass_assign_driver_list=function(req, callback){
    req.body.page=req.body.page||1;
    var page_cond={
        // skip: (req.body.page-1)*config_common.entry_per_page,
        // limit: config_common.entry_per_page,
        // sort: {time_creation: -1},
        // page: req.body.page
    }, user_name_list=[], group_id_list=[];
    async.waterfall([
        function(cb){
            if(req.body.user_name){
                //则返回user_name
                var user_name_cond={
                    real_name: {$regex: req.body.user_name},
                    role: config_common.user_roles.TRAFFIC_DRIVER_PRIVATE
                };
                if(req.body.verify){
                    user_name_cond.company_id={$in: req.decoded.company_id}
                }else{
                    user_name_cond.company_id={$nin: req.decoded.company_id}
                }
                extServer.generalFun(req, {
                    source: 'user',
                    db:'User_traffic',
                    method:'getList',
                    query:{
                        find: user_name_cond,
                        // skip: (req.body.page-1)*config_common.entry_per_page,
                        // limit: config_common.entry_per_page,
                        // sort: {time_creation: -1},
                        // page: req.body.page,
                        // select: 'real_name'
                    }}, cb);
            }else{
                cb(null, null)
            }
        }
        ,function (user_list, cb) {
            if(user_list){
                user_name_list=_.pluck(JSON.parse(JSON.stringify(user_list)), '_id');
            }
            if(!req.body.verify){
                cb(null, null);
            }else{
                var group_query={
                    find:{
                        company_id: {$in: req.decoded.company_id}
                        // user_id: req.decoded.id
                    }
                    ,select: 'member_id'
                };
                if(req.body.group_id){
                    group_query.find.group_id=req.body.group_id;
                }
                if(req.body.user_name){
                    group_query.find.member_id={$in: user_name_list};
                }else{
                    group_query.find.member_id={$exists: true};
                }
                if(!req.body.group_id && !req.body.user_name){
                    group_query=_.extend(group_query, page_cond);
                }
                //返回group_id下的user_name
                extServer.generalFun(req, {
                    source: 'user',
                    db:'Relation_group_user',
                    method:'getList',
                    query:group_query
                }, cb);
            }
        }
        ,function (group, cb) {
            if(group){
                group_id_list=_.pluck(JSON.parse(JSON.stringify(group)), 'member_id')
            }

            if((!req.body.user_name && !req.body.group_id && req.body.verify) || !req.body.verify){
                var driver_verify_query={
                    find: {
                        company_id:{$in: req.decoded.company_id},
                        approve_id:req.decoded.id
                        // user_id: {$nin: group_id_list}
                    },
                    select: 'user_id'
                };
                if(req.body.verify){
                    driver_verify_query.find.user_id = {$nin: group_id_list}
                }
                driver_verify_query=_.extend(driver_verify_query, page_cond);

                extServer.generalFun(req, {
                    source: 'user',
                    db:'Driver_verify',
                    method:'getList',
                    query:driver_verify_query
                }, function (x,y) {
                    if(req.body.user_name){
                        cb(null, user_name_list)
                    }else{
                        cb(x, _.pluck(JSON.parse(JSON.stringify(y)), 'user_id'));
                    }

                });
            }else if(req.body.user_name && !req.body.group_id){
                cb(null, user_name_list)
            }else if(req.body.group_id){
                cb(null, group_id_list);
            }
        }

    ],function (x,y) {
        callback(null, _.uniq(y))
    });
};
//线路筛选司机需求或物流需求
exports.lineArrDemand=function(line_arr, callback, req){
    if(!(_.isArray(line_arr))){
        return callback();
    }
    var cond = [], lineCond={status: config_common.demand_status.effective, user_id: req.decoded.id};
    //若line_arr数组为空，则表示获取不再线路内的数据
    if(line_arr[0]==''){

    }else{
        lineCond._id= {$in: line_arr};
    }
    DB.getList({find: lineCond}, function (x,lists) {
        if(lists && lists.length>0){
            _.each(lists, function (line) {
                if(line_arr[0]!==''){
                    cond.push({section: {$in: line.section}, end_section: {$in: line.end_section}});
                    cond.push({end_section: {$in: line.section}, section: {$in: line.end_section}});
                }else{
                    cond.push({section: {$nin: line.section}, end_section: {$nin: line.end_section}});
                    cond.push({end_section: {$nin: line.section}, section: {$nin: line.end_section}});
                }
                
            });
            callback(null, cond);
        }else{
            callback(null, null)
        }
    })
};
//搜索区域内包含某个字符
exports.vagueLineDemand=function(vagueFiled, callback){
    var lineArr=[];
    if(vagueFiled.indexOf(',') >-1){
        lineArr= vagueFiled.split(',')
    }else if(vagueFiled.indexOf('，') >-1){
        lineArr= vagueFiled.split('，')
    }else{
        callback()
    }
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
};
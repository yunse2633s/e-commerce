/**
 * Created by Administrator on 2018\4\12 0012.
 */
var async = require('async');
var _ = require('underscore');

var config_common = global.config_common;

module.exports = function (app, express) {

    var api = express.Router();

    // 拦截非授权请求
    api.use(require('../../middlewares/mid_verify_user')());

    /**
     * 功能: 根据不同的type类型得到不同的报价/竞价/采购/购物车/订单...列表
     * 参数: (1)type;
     *       (2)page;
     */
    api.post('/get_list_dj', function (req, res, next) {
        //判断参数
        if (!req.body.type) {
            return next('invalid_format');
        }
        if (!req.body.page) {
            req.body.page = 1;
        }
        async.waterfall([
            function (cb) {
                switch (req.body.type) {
                    //行情
                    case config_common.listType.dj:
                        global.lib_list.getList_dj(req, cb);
                        break;
                    //购物车
                    case config_common.listType.shop:
                        global.lib_list.getList_shop(req, cb);
                        break;
                    case config_common.listType.ineffective:
                        //待确认订单
                        req.body.type = 'PURCHASE';
                        req.body.status = {$in: [config_common.listType.ineffective, config_common.listType.cancelled]};
                        global.lib_list.getList_order(req, 'DJ', cb);
                        break;
                    case config_common.listType.effective:
                        //进行中订单
                        req.body.status = config_common.listType.effective;
                        req.body.type = 'PURCHASE';
                        global.lib_list.getList_order(req, 'DJ', cb);
                        break;
                    case config_common.listType.complete:
                        //已完成订单
                        req.body.status = config_common.listType.complete;
                        req.body.type = 'PURCHASE';
                        global.lib_list.getList_order(req, 'DJ', cb);
                        break;
                }
            }
        ], function (err, result) {
            if (err) return next(err);
            config_common.sendData(req, result, next);
        })
    });

    api.post('/get_list_jj', function (req, res, next) {
        //判断参数
        if (!req.body.type) {
            return next('invalid_format');
        }
        if (!req.body.page) {
            req.body.page = 1;
        }
        async.waterfall([
            function (cb) {
                switch (req.body.type) {
                    case config_common.listType.jj:
                        global.lib_list.getList_jj(req, cb);
                        break;
                    case config_common.listType.cy:
                        //已参与
                        global.lib_list.getList_cy(req, cb);
                        break;
                    case config_common.listType.ineffective:
                        //待确认订单
                        req.body.status = {$in:[config_common.listType.ineffective,config_common.listType.cancelled]};
                        global.lib_list.getList_order(req, 'JJ', cb);
                        break;
                    case config_common.listType.effective:
                        //进行中订单
                        req.body.status = config_common.listType.effective;
                        global.lib_list.getList_order(req, 'JJ', cb);
                        break;
                    case config_common.listType.complete:
                        //已完成订单
                        req.body.status = config_common.listType.complete;
                        global.lib_list.getList_order(req, 'JJ', cb);
                        break;
                }
            }
        ], function (err, result) {
            if (err) return next(err);
            config_common.sendData(req, result, next);
        })
    });

    api.post('/get_list_demand', function (req, res, next) {
        //判断参数
        if (!req.body.type) {
            return next('invalid_format');
        }
        if (!req.body.page) {
            req.body.page = 1;
        }
        async.waterfall([
            function (cb) {
                switch (req.body.type) {
                    case config_common.listType.demand:
                        global.lib_list.getList_demand(req, cb);
                        break;
                    //已参与的采购
                    case config_common.listType.cy:
                        global.lib_list.getList_cy_demand(req, cb);
                        break;
                    case config_common.listType.ineffective:
                        //待确认订单
                        req.body.status = {$in:[config_common.listType.ineffective,config_common.listType.cancelled]};
                        global.lib_list.getList_order_demand_hq(req, 'demand', cb);
                        break;
                    case config_common.listType.effective:
                        //进行中订单
                        req.body.status = config_common.listType.effective;
                        global.lib_list.getList_order_demand_hq(req, 'demand', cb);
                        break;
                    case config_common.listType.complete:
                        //已完成订单
                        req.body.status = config_common.listType.complete;
                        global.lib_list.getList_order_demand_hq(req, 'demand', cb);
                        break;
                }
            }
        ], function (err, result) {
            if (err) return next(err);
            config_common.sendData(req, result, next);
        })
    });


    //自己发布的报价列表和订单情况
    api.post('/get_list_dj_self', function (req, res, next) {
        //判断参数
        if (!req.body.type) {
            return next('invalid_format');
        }
        if (!req.body.page) {
            req.body.page = 1;
        }
        async.waterfall([
            function (cb) {
                switch (req.body.type) {
                    //已发布报价列表
                    case config_common.listType.dj:
                        global.lib_list.getList_dj_self(req, cb);
                        break;
                    case config_common.listType.ineffective:
                        //待确认订单
                        req.body.status = {$in:[config_common.listType.ineffective,config_common.listType.cancelled]};
                        //req.body.status = config_common.listType.ineffective;
                        global.lib_list.getList_order_dj_participation(req, 'DJ', cb);
                        break;
                    case config_common.listType.effective:
                        //进行中订单
                        req.body.status = config_common.listType.effective;
                        global.lib_list.getList_order_dj(req, 'DJ', cb);
                        break;
                    case config_common.listType.complete:
                        //已完成订单
                        req.body.status = config_common.listType.complete;
                        global.lib_list.getList_order_dj(req, 'DJ', cb);
                        break;
                }
            }
        ], function (err, result) {

            if (err) return next(err);
            config_common.sendData(req, result, next);
        })
    });
    //自己发布的采购列表和订单情况
    api.post('/get_list_demand_self', function (req, res, next) {
        //判断参数
        if (!req.body.type) {
            return next('invalid_format');
        }
        if (!req.body.page) {
            req.body.page = 1;
        }
        async.waterfall([
            function (cb) {
                switch (req.body.type) {
                    case config_common.listType.published:
                        //已发布
                        global.lib_list.getList_demand_self(req,cb);
                        break;
                    case config_common.listType.ineffective:
                        //待确认订单
                        req.body.status = {$in:[config_common.listType.ineffective,config_common.listType.cancelled]};
                        global.lib_list.getList_order_dj_participation(req, 'demand', cb);
                        break;
                    case config_common.listType.effective:
                        //进行中订单
                        req.body.status = config_common.listType.effective;
                        global.lib_list.getList_order_demand(req, 'demand', cb);
                        break;
                    case config_common.listType.complete:
                        //已完成订单
                        req.body.status = config_common.listType.complete;
                        global.lib_list.getList_order_demand(req, 'demand', cb);
                        break;
                }
            }
        ], function (err, result) {
            if (err) return next(err);
            config_common.sendData(req, result, next);
        })
    });
    //自己发布的竞价列表和订单情况
    api.post('/get_list_jj_self', function (req, res, next) {
        //判断参数
        if (!req.body.type) {
            return next('invalid_format');
        }
        if (!req.body.page) {
            req.body.page = 1;
        }
        async.waterfall([
            function (cb) {
                switch (req.body.type) {
                    //已发布竞价列表
                    case config_common.listType.published:
                        global.lib_list.getList_jj_self(req, cb);
                        break;
                    case config_common.listType.ineffective:
                        //待确认订单
                        req.body.status = {$in:[config_common.listType.ineffective,config_common.listType.cancelled]};
                        global.lib_list.getList_order_dj_participation(req, 'JJ', cb);
                        break;
                    case config_common.listType.effective:
                        //进行中订单
                        req.body.status = config_common.listType.effective;
                        global.lib_list.getList_order_dj(req, 'JJ', cb);
                        break;
                    case config_common.listType.complete:
                        //已完成订单
                        req.body.status = config_common.listType.complete;
                        global.lib_list.getList_order_dj(req, 'JJ', cb);
                        break;
                }
            }
        ], function (err, result) {
            if (err) return next(err);
            config_common.sendData(req, result, next);
        })
    });
    //小红点
    api.post('/get_count_red', function (req, res, next) {
        async.parallel({
            DJ: function (cb) {
                var arr;
                var result={};
                result.list=[];
                result.count=0;
                async.waterfall([
                    //1.根据ID查到和自己有关系的合作公司
                    function (cb) {
                        global.http.sendUserServer({
                            method: 'getList',
                            cond: {
                                find: {
                                    user_id: req.decoded.id,
                                    type: 'SALE'
                                }
                            },
                            model: 'Work_relation'
                        }, '/api/server/common/get', cb);
                    },
                    //2.根据这个公司id和自己id得到上次更新时间
                    function (company, cb) {
                        arr = _.pluck(company, 'other_company_id');
                        global.lib_Relationship.getList({
                            find: {
                                user_id: req.decoded.id,
                                company_id: {$in: arr},
                                type:'dj'
                            }
                        }, cb);
                    },
                    //3.查询数字条件多加一个大于上次更新时间
                    function (data, cb) {
                        async.eachSeries(data, function (time, cbk) {
                            async.waterfall([
                                function (cb1) {
                                    req.body.company_id=time.company_id;
                                    global.lib_list.getCount_dj(req, time.update_time, cb1);
                                },
                                function (count, cb1) {
                                    var obj = {};
                                    obj[time.company_id] = count;
                                    var new_count=_.pluck(count, 'count');
                                    var sum=0;
                                    for(var i=0;i<new_count.length;i++){
                                        sum+=new_count[i];
                                    }
                                    result.count+=sum;
                                    result.list.push(obj);
                                    cb1()
                                }
                            ], cbk);

                        }, cb);
                    },
                    function(cb){
                        cb(null,result);
                    }
                ],cb);
            },
            JJ: function (cb) {
                var arr;
                var result={};
                result.list=[];
                result.count=0;
                async.waterfall([
                    //1.根据ID查到和自己有关系的合作公司
                    function (cb) {
                        global.http.sendUserServer({
                            method: 'getList',
                            cond: {
                                find: {
                                    user_id: req.decoded.id,
                                    type: 'SALE'
                                }
                            },
                            model: 'Work_relation'
                        }, '/api/server/common/get', cb);
                    },
                    //2.根据这个公司id和自己id得到上次更新时间
                    function (company, cb) {
                        arr = _.pluck(company, 'other_company_id');
                        global.lib_Relationship.getList({
                            find: {
                                user_id: req.decoded.id,
                                company_id: {$in: arr},
                                type:'jj'
                            }
                        }, cb);
                    },
                    //3.查询数字条件多加一个大于上次更新时间
                    function (data, cb) {
                        async.eachSeries(data, function (time, cbk) {
                            async.waterfall([
                                function (cb1) {
                                    req.body.company_id=time.company_id;
                                    global.lib_list.getCount_jj(req, time.update_time, cb1);
                                },
                                function (count, cb1) {
                                    var obj = {};
                                    obj[time.company_id] = count;
                                    var new_count=_.pluck(count, 'count');
                                    var sum=0;
                                    for(var i=0;i<new_count.length;i++){
                                        sum+=new_count[i];
                                    }
                                    result.count+=sum;
                                    result.list.push(obj);
                                    cb1()
                                }
                            ], cbk);

                        }, cb);
                    },
                    function(cb){
                        cb(null,result);
                    }
                ], cb);
            },
            Demand: function (cb) {
                var arr;
                var result={};
                result.list=[];
                result.count=0;
                async.waterfall([
                    //1.根据ID查到和自己有关系的合作公司
                    function (cb) {
                        global.http.sendUserServer({
                            method: 'getList',
                            cond: {
                                find: {
                                    user_id: req.decoded.id,
                                    type: 'PURCHASE'
                                }
                            },
                            model: 'Work_relation'
                        }, '/api/server/common/get', cb);
                    },
                    //2.根据这个公司id和自己id得到上次更新时间
                    function (company, cb) {
                        arr = _.pluck(company, 'other_company_id');

                        global.lib_Relationship.getList({
                            find: {
                                user_id: req.decoded.id,
                                company_id: {$in: arr},
                                type:'demand'
                            }
                        }, cb);
                    },
                    //3.查询数字条件多加一个大于上次更新时间
                    function (data, cb) {
                        async.eachSeries(data, function (time, cbk) {
                            async.waterfall([
                                function (cb1) {
                                    req.body.company_id=time.company_id;
                                    global.lib_list.getCount_demand(req, time.update_time, cb1);
                                },
                                function (count, cb1) {
                                    var obj = {};
                                    obj[time.company_id] = count;
                                    var new_count=_.pluck(count, 'count');
                                    var sum=0;
                                    for(var i=0;i<new_count.length;i++){
                                        sum+=new_count[i];
                                    }
                                    result.count+=sum;
                                    result.list.push(obj);
                                    cb1()
                                }
                            ], cbk);

                        }, cb);
                    },
                    function(cb){
                        cb(null,result);
                    }
                ],cb);
            }
        }, function (err, result) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, result, next);
        });
    });
    /**
     * 功能：得到列表的数量和相关列表
     */
    api.post('/get_list_count', function (req, res, next) {
        //判断参数
        if (!req.body.type) {
            return next('invalid_format');
        }
        async.waterfall([
            function (cb) {
                switch (req.body.type) {
                    case 'dj':
                        global.lib_list.getCount_dj(req, '', cb);
                        break;
                    case 'jj':
                        global.lib_list.getCount_jj(req, '', cb);
                        break;
                    case 'demand':
                        global.lib_list.getCount_demand(req, '', cb);
                        break;
                    case 'demand_self':
                        global.lib_list.getCount_demand_self(req, '', cb);
                        break;
                    case 'dj_self':
                        global.lib_list.getCount_dj_self(req, '', cb);
                        break;
                    case 'jj_self':
                        global.lib_list.getCount_jj_self(req, '', cb);
                        break;
                }
            }
        ], function (err, result) {
            if (err) return next(err);
            config_common.sendData(req, result, next);
        })
    });

    return api;

};


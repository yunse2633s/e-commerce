/**
 * by Administrator 20170410
 */
var async = require('async');
var http = require('../lib/http');
var util = require('../lib/util');
var config_api_url = require('../configs/config_api_url');
var config_common = require('../configs/config_common');
var DB = require('../dbs/db_base')('InfoPrice');
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
    DB.save(data,callback);
};
//相似检查
exports.check=function(){

};
//提货成功后付款物流方; 获取提现比列
exports.disCountAdd=function (req, order, callback) {
    var userObj={};
    async.waterfall([
        function (cb) {
            DB.getOne({find: {user_id: order.demand_user_id, order_index: order.index}}, cb)
        },
        function (isorder, cb) {
            //若order存在，则直接返回callback
            if(isorder){
                return callback(null, null)
            }
            //获取折现比例
            extServer.generalFun(req, {
                source: 'user',
                db:'User_traffic',
                method:'getOne',
                query:{
                    find: {
                        _id: order.demand_user_id
                    }
                }}, function (x,y) {
                if(y){
                    userObj=y;
                    extServer.generalFun(req, {
                        source: 'user',
                        db:'Percentage_cash',
                        method:'getOne',
                        query:{
                            find: {
                                company_id: {$in: order.demand_company_id}
                            }
                        }
                    }, cb)
                }else{
                    return cb({dev: '账户信息出错'})
                }

            });

            
        }, function(rate, cb){
            console.log('rate', rate, cb)
            var tmp_rate=100, tmp_platform=rate && rate['platform'] ? rate['platform'] : 0;
            if(userObj.role == config_common.user_roles.TRAFFIC_CAPTAIN){
                tmp_rate=rate['traffic_captain'];
            }else if(userObj.role == config_common.user_roles.TRAFFIC_EMPLOYEE){
                tmp_rate=rate['traffic_employee'];
            }
            var not_platform=config_common.rscDecimal('div', config_common.rscDecimal('mul', order.tip_prices, config_common.rscDecimal('sub', 100, tmp_platform)), 100)
            var info_price={
                user_id: order.demand_user_id,     //表单发起者的用户ID。
                company_id: order.demand_company_id,  //表单发起者的用户公司ID。
                tip_price_id: order.tip_price_id, //支付账单id
                order_index: order.index,//司机订单id,
                after_tax: config_common.rscDecimal('div', config_common.rscDecimal('mul', not_platform, tmp_rate), 100),//所得值
                before_tax: not_platform, //总金额,
                tip_prices: order.tip_prices,
                in_discount: tmp_rate, //物流内部折扣
                out_discount: tmp_platform, //平台折扣
                type: 'once'
            };
            DB.add(info_price, function (x,y) {
                if(y){
                    DB.getOne({
                        find: {user_id: order.demand_user_id,
                            type: 'all'}
                    }, function (x1, y1) {
                        if(y1){
                            y1.price_total = config_common.rscDecimal('add', y1.price_total, y.after_tax);
                            y1.in_discount= y.in_discount, //物流内部折扣
                            y1.out_discount= y.out_discount; //平台折扣
                            y1.save(cb)
                        }else{
                            DB.add({
                                user_id: order.demand_user_id,
                                type: 'all',
                                price_total: y.after_tax,
                                in_discount: y.in_discount, //物流内部折扣
                                out_discount: y.out_discount, //平台折扣
                            }, cb)
                        }
                    })
                }
            });
        }
    ], callback)
}
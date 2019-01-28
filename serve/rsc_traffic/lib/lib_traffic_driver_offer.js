/**
 * by Administrator 20170410
 */
var async = require('async');
var http = require('../lib/http');
var util = require('../lib/util');
var _ = require('underscore');
var decimal = require('decimal');

var config_api_url = require('../configs/config_api_url');
var config_common = require('../configs/config_common');
var DB = require('../dbs/db_base')('TrafficDriverOffer');


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
//统计
exports.getAggregate = function(data, callback){
    DB.group(data, callback);
};
//相似检查
exports.check=function(){

};

//产品相减
exports.subProduce = function(old, source){
    var newData=_.filter(source, function(e){
        return e.count>0;
    }), oldData=_.filter(old, function(e){
        return e.count>0;
    });

    //对原有oldData数据进行 清零处理;
    for(var a=0; a<newData.length; a++){
        for(var b=0; b<oldData.length; b++){
            if(newData[a].key == oldData[b].key){
                oldData[b].count = oldData[b].count - newData[a].count;
                if(oldData[b].count==0){
                    oldData.splice(b,1);
                    b--;
                }
            }
        }
    }

    return oldData;
};
//产品剩余相加
exports.addProduce = function(oldData, newData, callback){
    // 提取newData的key 如：{key:'steel_luowengang-HRB500E-Φ20-12' ,count: 0}
    // 查询oldData中是否存在 key ,如果不存在，报错; 如存在且oldData.count - newData.count <0 报错 否则，继续
    
    for(var a=0; a<newData.length; a++){
        var flag = true;
        for(var b=0; b<oldData.length; b++){
            if(newData[a].key == oldData[b].key){
                oldData[b].count = config_common.rscDecimal('add', oldData[b].count, newData[a].count, 0);
            }else{
                flag = false;
            }
        }
        if(flag){
            oldData.push(newData[a]);
        }
    }
    return oldData;
};
/**
 * 计算指派吨数( 20170703 discard)
 * 1, 根据剩余的产品，计算分配的载重产品
 * 2,
 */
exports.assignProduct = function (req, data, callback) {
    var driverDemand = data.demand;
    async.waterfall([
        function(cb){
            var produce = tf_amountProduce(req.body.weight, driverDemand.products, driverDemand.products_remain);
            cb(null, produce);
        }
    ], callback);
};

/**
 * 
 * @param amount (20170703 discard)
 * @param product
 * 通过总amount 分配产品结构
 */
var tf_amountProduce = function(amount, param_product, param_product_remain){
    var product = JSON.parse(JSON.stringify(param_product));
    var pass_list = JSON.parse(JSON.stringify(param_product_remain));
    var sign_amount = Number(amount); //标准值
    //使用货运清单
    _.each(pass_list, function (a) {
        a.amount = config_common.rscDecimal('mul', a.count, a.amount_unit);
        if(sign_amount>0){
            var count_div = Math.ceil(config_common.rscDecimal('div', sign_amount, a.amount));
            a.count = count_div > a.count ? a.count : count_div;
            sign_amount = config_common.rscDecimal('sub', sign_amount, a.amount);
        }else{
            a.count = 0;
        }
    });
    return product;
};

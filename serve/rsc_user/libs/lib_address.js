/**
 * Created by Administrator on 2017/2/27.
 */
var async = require('async');

var http = require('./lib_http');
var util = require('./lib_util');

var config_api_url = require('../configs/config_api_url');
var config_common = require('../configs/config_common');

var addressDB = require('../dbs/db_base')('Address');

var sdk_map_gaode = require('../sdks/map_gaode/sdk_map_gaode');
/**
 * 增删改查
 */
exports.add = function (req, data, callback) {
    async.waterfall([
        function (cb) {
            // addressDB.update({
            //     find: {user_id: req.decoded.id, is_default: true, differentiate: data.differentiate},
            //     set: {$set: {is_default: false}}
            // }, function (err) {
            //     if (err) {
            //         return cb('update_err')
            //     }
            //     cb();
            // });
            if(!data.type){
                //添加地址
                addressDB.getCount({user_id: req.decoded.id, is_default: true, differentiate: data.differentiate}, cb);
            }else{
                //添加仓库
                cb(null, 1);
            }
        },
        function (count, cb) {
            if(count === 0){
                data.is_default = true;
            }
            sdk_map_gaode.getCoordinate(data.province + data.city + data.district + data.addr, cb);
        },
        function (coordinate, cb) {
            if(coordinate && coordinate.geocodes && coordinate.geocodes[0]){
                data.location = coordinate.geocodes[0].location.split(',');
            }
            addressDB.add(data, cb);
        }
    ], callback);
};

//删除记录
exports.del = function (req, data, callback) {
    addressDB.del(data, callback);
};

//依据条件修改原表数据
exports.edit = function (data, callback) {
    addressDB.edit(data, callback);
};

//依据条件查询单个表详情
exports.getOne = function (data, callback) {
    addressDB.getOne(data, callback);
};

/**
 * 扩展
 */

//设为默认地址
// set_default
exports.set_default = function (data, callback) {
    var query = {};
    if (data.address_id) {
        query._id = data.address_id;
    }
    async.waterfall([
        function (cb) {
            addressDB.update({
                find: {user_id: data.user_id, differentiate: data.differentiate, is_default: true},
                set: {is_default: false},
                multi: {multi: true}
            }, cb);
        },
        function (count, cb) {
            addressDB.update({
                find: {_id: data.address_id},
                set: {is_default: true}
            }, cb);
        }
    ], callback);
};


//通过id查询
exports.getById = function (data, callback) {
    addressDB.getById(data, callback);
};
//获取表数量
exports.getCount = function (data, callback) {
    addressDB.getCount(data, callback);
};
//获取分页数据
exports.getList = function (data, callback) {
    addressDB.getList(data, callback)
};
//批量编辑
exports.editList = function (data, callback) {
    addressDB.edit(sourceData, modifyData, callback);
};
//批量更新
exports.updateList = function (data, callback) {
    addressDB.update(data, callback);
};
//相似检查
exports.check = function () {

};
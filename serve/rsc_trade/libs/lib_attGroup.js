/**
 * Created by Administrator on 17/6/19.
 */
var async = require('async');
var model = require('../dbs/db_base');
model = model('AttGroup');

var lib_util = require('./util');
var lib_Config = require('./lib_Config');

exports.add = function (data, callback) {
    model.add(data, callback);
};

exports.getOne = function (data, callback) {
    var cid;
    async.waterfall([
        function (cb) {
            model.getOne(data, cb);
        },
        function (result, cb) {
            if (result) {
                cid = result.CID;
                lib_Config.getList({
                    find: {numbering: {$in: result.CID}},
                    select: 'name unit vary read numbering double'
                }, cb);
            } else {
                cb(null, []);
            }
        },
        function (list, cb) {
            if(list.length === 0){
                return cb(null, []);
            }else{
                //根据CID顺序排序
                var arr = [];
                var numberingObj = lib_util.transObjArrToObj(list, 'numbering');
                for(var i = 0; i < cid.length; i++){
                    var number = cid[i];
                    arr.push(numberingObj[number]);
                }
                cb(null, arr);
            }
        }
    ], callback);
};

exports.getList = function (data, callback) {
    model.getList(data, callback);
};
exports.update = function (cond, callback) {
    model.update(cond, callback);
};

exports.getCount = function (data, callback) {
    model.getCount(data, callback);
};

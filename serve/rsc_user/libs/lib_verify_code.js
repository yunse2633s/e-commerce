/**
 * Created by Administrator on 2017/2/27.
 */
var async = require('async');

var db_model = require('../dbs/db_base')('Verify_code');

var config_common = require('../configs/config_common');

exports.add = function (cond, callback) {
    db_model.add(cond, callback);
};

exports.del = function (data, callback) {
    db_model.del(data, callback);
};

exports.getOne = function (cond, callback) {
    db_model.getOne(cond, callback);
};

exports.getList = function (cond, callback) {
    db_model.getList(cond, callback);
};

exports.getCount = function (cond, callback) {
    db_model.getCount(cond, callback);
};

exports.edit = function (data, callback) {
    db_model.edit(data, callback);
};

exports.check = function (v_code, code_str, callback) {
    async.waterfall([
        function (cb) {
            if (!v_code) {
                return cb('verify_code_not_found');
            }
            //if(code_str !== config_common.password){
                if (v_code.code !== code_str) {
                    return cb('verify_code_invalid');
                }
                if (Date.now() - v_code.time_creation.getTime() >= config_common.verify_codes_timeout) {
                    return cb('verify_code_timeout');
                }
            //}
            cb();
        }
    ], callback);
};
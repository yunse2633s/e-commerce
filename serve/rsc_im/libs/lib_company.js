/**
 * Created by Administrator on 2017/5/23.
 */
var async = require('async');

var config_api_url = require('../configs/config_api_url');

var lib_http = require('../libs/lib_http');


exports.getListAll = function (data, callback) {
    async.waterfall([
        function (cb) {
            lib_http.sendUserServer({cond: data}, config_api_url.user_server_company_get_list_all, cb);
        }
    ], callback);
};
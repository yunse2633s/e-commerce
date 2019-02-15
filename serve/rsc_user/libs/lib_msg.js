/**
 * Created by Administrator on 17/5/20.
 */
var async = require('async');
var _ = require('underscore');

var http = require('../libs/lib_http');

/**
 * 功能：发短信--调用网易云信短信接口
 * @param phones 电话号码 数组[]
 * @param params 传给云信的参数 数组[]
 * @param templateid 云信上的短信模板id 字符串 ‘’
 * @param callback 回调
 * @returns {*}
 */
exports.send_sms = function (req,phones, params, templateid, callback) {
    if (!callback) callback = function () {
    };
    if (!global.config_server.is_sms) {
        return callback();
    }
    async.waterfall([
        function (cb) {
            //网易云短信
            http.sendMsgServerSMSNew(req, {
                phone: JSON.stringify(phones),
                params: JSON.stringify(params),
                templateid: templateid
            }, '/msg/send_rsc_sms', cb);
        }
    ], callback);
};


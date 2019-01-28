/**
 * Created by Administrator on 17/5/20.
 */
var async = require('async');
var _ = require('underscore');

var http = require('../lib/http');


var obj = {
    msg_server_push: '/api/push/push',//推送
    msg_server_send_sms1: '/msg/send_sms1'//发送手机短信
};

exports.send_sms = function (sms, template_id, phone_list, callback) {
    if (!callback) callback = function () {
    };
    async.waterfall([
        function (cb) {
        //     http.short_url(url, cb);
        // },
        // function (short_url, cb) {
        //     url = short_url;
            http.sendMsgServerNotToken(null, {
                content: JSON.stringify(sms),
                phone_list: phone_list,
                template_id: template_id
            }, obj.msg_server_send_sms1 + '/template' + '/' + 'GBK', cb);
        }
    ], callback);
};


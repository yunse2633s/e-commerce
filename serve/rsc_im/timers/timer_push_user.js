/**
 * Created by Administrator on 2017/4/9.
 */
var async = require('async');
var lib_im = global.lib_im;
//推送消息的方法
exports.push = function () {
//     async.waterfall([
//         function (cb) {
//             lib_im.getList({
//                 find: {
//                     count: {$gt: 0},
//                     time_creation: {$lt: new Date((new Date()).getTime() - 5000)},
//                     push: true
//                 }
//             }, cb);
//         },
//         function (result, cb) {
//             async.eachSeries(result, function (obj, callback) {
//                 async.waterfall([
//                     function (cbk) {
//                         global.lib_user.getOne({user_id: obj.user_id}, cbk);
//                     },
//                     function (data, cbk) {
//                         var role;
//                         // if (global.config_common.checkTradeCompanyByRole(data.role)) {
//                         //     role = 'trade.new_message';
//                         //     global.lib_http.sendMsgServerNoToken({
//                         //         title: '互联网+',
//                         //         user_ids: JSON.stringify([obj.user_id]),
//                         //         content: '您有' + obj.count + '条未读消息',
//                         //         data: JSON.stringify({url: role})
//                         //     }, global.config_api_url.msg_server_push);
//                         // } else {
//                         //     role = 'traffic.new_message';
//                         //     global.lib_http.sendMsgServerNoToken({
//                         //         title: '互联网+',
//                         //         user_ids: JSON.stringify([obj.user_id]),
//                         //         content: '您有' + obj.count + '条未读消息',
//                         //         data: JSON.stringify({url: role})
//                         //     }, global.config_api_url.msg_server_push);
//                         //     cbk();
//                         // }
//                         cbk();
//                     }
//                 ], callback);
//             }, cb);
//         },
//         function (cb) {
//             lib_im.update({
//                 find: {
//                     count: {$gt: 0},
//                     time_creation: {$lt: new Date((new Date()).getTime() - 5000)},
//                     push: true
//                 },
//                 set: {push: false}
//             }, cb);
//         }
//     ], function (err) {
//         if (err) return console.log(err);
//         // console.log('push success' + new Date().toDateString());
//     })
};




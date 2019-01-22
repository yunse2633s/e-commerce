var _ = require('underscore');
var async = require('async');
var mongoose = require('mongoose');
var config_server = require('../configs/config_server')
var Schema = mongoose.Schema;
var querystring = require('querystring');
var request = require('request');

var db_trade = mongoose.createConnection('mongodb://192.168.3.248:27017/rsc_trade');

var tradeSchema = new Schema({
    name: {type: String, required: true},                        // 名称
    unit: {type: String, default: ''},                           // 单位
    status: {type: String, required: true},                      // 类型
    PID: {type: Array, required: true},                          // 父节点
    vary: {type: String, default: ''},                           // 增长值
    calculate: {type: Boolean, default: false}

});
var db_trade = mongoose.createConnection('mongodb://192.168.3.248:27017/rsc_trade');
var db_trade_pro = mongoose.createConnection('mongodb://rscdba:a11111@60.205.146.53:27033/rsc_trade');
var trade = db_trade.model('ProductConfig', tradeSchema);
var trade_pro = db_trade_pro.model('ProductConfig', tradeSchema);
//
console.log(_.allKeys(trade),_.allKeys(trade_pro));
async.waterfall([
    function (cb) {
        trade.find({}, cb);
    },
    function (result, cb) {
        trade_pro.create(result, cb);
    }
], function (err, result) {
    console.log(result);
})


// var OrderClassifySchema = new Schema({
//     phone: {type: String, required: true, unique: {index: true}},
//     real_name: {type: String, default: ''},
//     role: {type: String, default: ''},
//     gender: {type: String, default: 'MALE'},
//     company_id: {type: Array},   //我加入的公司,
//     time_creation: {
//         type: Date, default: function () {
//             return new Date()
//         }
//     },
//     photo_url: {type: String, default: 'http://rsc-jishuzhichi.oss-cn-beijing.aliyuncs.com/default_face.png'},
//     province: {type: String, default: ''},//省
//     city: {type: String, default: ''},    //市
//     district: {type: String, default: ''},//区县
//     addr: {type: String, default: ''},    //详细
//     post: {type: String, default: ''},    //岗位职务
//     sell: {type: Array},    //销售设置
//     buy: {type: Array},    //采购设置
//     transport: {type: Array},    //运什么
//     verify_lock: {type: String, default: 'UNLOCK'},    //认证锁(关闭可修改，开启不可修改)
//     id_card_number: {type: String},       //身份证号码
//     id_card_number_url: {type: String, default: ''},  //身份证照片正面
//     id_card_number_back_url: {type: String, default: ''},  //身份证照片背面
//     jia_shi_zheng_url: {type: String, default: ''}     //驾驶证照片
// });
// mongoose.Promise = global.Promise;
// var db_conn_trade = mongoose.createConnection('mongodb://rscdba:a11111@60.205.146.53:27033/rsc_main');
// var ceshi = db_conn_trade.model('user_traffic', OrderClassifySchema);
//
//
// var AppKey = '34933ec0c6e6d8add0129e8177d39b41';
// var AppSecret = '1602955c262e';
//
// // 注册
// var createUser = function (data, cb) {
//     if (!cb) cb = function () {
//     };
//     var a = Math.random();
//     var Nonce = a * Math.pow(10, a.toString().split('.')[1].length);
//     var CurTime = ((new Date()).getTime() / 1000 - 100).toString().split('.')[0];
//     var CheckSum = sha1(AppSecret + Nonce + CurTime);
//     var options = {
//         url: 'https://api.netease.im/nimserver/user/create.action',
//         body: querystring.stringify(data),
//         method: 'POST',
//         headers: {
//             AppKey: AppKey,
//             Nonce: Nonce,
//             CurTime: CurTime,
//             CheckSum: CheckSum,
//             'Content-Type': 'application/x-www-form-urlencoded'
//         }
//     };
//     request(options, function (err, http_req, http_res) {
//         if (err) return cb(err);
//         if (http_req.statusCode === 200) {
//             console.log(http_res);
//             cb(null, http_res);
//         } else {
//             cb(http_req.statusCode);
//         }
//     });
// };
//
// async.waterfall([
//     function (cb) {
//         ceshi.find({}, cb);
//     },
//     function (result, cb) {
//         trade.find({}, function (err, list) {
//             async.eachSeries(result.concat(list), function (user, cbk) {
//                 createUser({
//                     accid: user._id.toString(),
//                     name: user.real_name,
//                     icon: user.photo_url,
//                     token: 'a11111'
//                 });
//                 cbk();
//             }, cb);
//         });
//
//     }
// ], function (err, result) {
// })


// var ProductClassifySchema = new Schema({
//     PID: {type: String, required: true},                       // 父节点
//     chn: {type: String, required: true},                       // 中文
//     eng: {type: String, required: true},                       // 英文
//     lev: {type: Number, default: 0}                            // 层级数
// });
//
//
// var ProductConfigSchema = new Schema({
//     name: {type: String, required: true},                        // 名称
//     unit: {type: String, default: ''},                           // 单位
//     status: {type: String, required: true},                      // 类型
//     PID: {type: Array, required: true},                          // 父节点
//     vary: {type: String, default: ''},                           // 增长值
//     calculate: {type: Boolean, default: false}                   // 增长值
// });
//
// var ProductConfig = db_trade.model('ProductConfig', ProductConfigSchema);
//
// var ProductClassify_pro = db_trade_pro.model('ProductClassify', ProductClassifySchema);
// var ProductClassify = db_trade.model('ProductClassify', ProductClassifySchema);
// // var a = {
// //     "_id": ObjectId("5949e0f1ee8e721ed05bdd3f"),
// //     "name": "9米",
// //     "status": "product_name",
// //     "vary": "",
// //     "PID": [],
// //     "unit": "",
// //     "__v": 0
// // }
// // 数组根据特定字段分组
// var getGroupByParam = function (list, param) {
//     var Obj = {};
//     for (var i = 0; i < list.length; i++) {
//         var obj = list[i];
//         if (!Obj[obj[param]]) {
//             Obj[obj[param]] = {
//                 name: param,
//                 value: obj[param],
//                 array: []
//             };
//         }
//         Obj[obj[param]].array.push(obj);
//     }
//     return Obj;
// };
// async.waterfall([
//     function (cb) {
//         ProductClassify_pro.findOne({chn: "螺纹钢"}, cb);
//     },
//     function (result, cb) {
//         ProductClassify_pro.find({PID: result._id.toString()}, cb);
//     },
//     function (result, cb) {
//         ProductClassify_pro.find({PID: {$in: _.pluck(result, '_id')}}, cb);
//         // ProductConfig
//         //     .update({name:"理计"}, {$addToSet:{PID:{$each:JSON.parse(JSON.stringify(_.pluck(result,'_id')))}}}, {multi: true})
//         //     .exec(cb);
//         //     var arr = [];
//         //     // result.forEach(function (obj) {
//         //     //     arr.push({
//         //     //         PID:obj._id.toString(),
//         //     //         chn:'9米',
//         //     //         eng:'9米',
//         //     //         lev:3
//         //     //     });
//         //     //     arr.push({
//         //     //         PID:obj._id.toString(),
//         //     //         chn:'12米',
//         //     //         eng:'12米',
//         //     //         lev:3
//         //     //     });
//         //     // });
//         //     var obj = getGroupByParam(result, 'eng');
//         //
//         //     // console.log(_.pluck(_.values(obj),'array'));
//         //     async.waterfall([
//         //         function (cbk) {
//         //             _.pluck(_.values(obj), 'array').forEach(function (array) {
//         //                 console.log(obj);
//         //                 arr.push({
//         //                     name: array[0]['chn'],
//         //                     status: "product_name",
//         //                     vary: '',
//         //                     PID: JSON.parse(JSON.stringify(_.pluck(array, 'PID'))),
//         //                     unit: ''
//         //                 });
//         //             });
//         //             ProductConfig.create(arr, cb);
//         //         }
//         //     ], cb);
//     },
//     function (result, cb) {
//         var arr = [];
//         var resultObj = getGroupByParam(result, 'PID');
//         async.eachSeries(result, function (obj, cbk) {
//             async.waterfall([
//                 function (callback) {
//                     ProductClassify.find({eng: {$in: ['9米', '12米']}}, callback);
//                 },
//                 function (result2, callback) {
//                     result2.forEach(function (result2Obj) {
//                         for (var index in resultObj) {
//                             if (index === result2Obj.PID) {
//                                 ProductConfig
//                                     .update({name: {$in: _.pluck(resultObj[index]['array'], 'eng')}}, {$addToSet: {PID: result2Obj._id.toString()}}, {multi: true})
//                                     .exec(function (err, result) {
//                                         console.log(_.pluck(resultObj[index]['array'], 'eng'), arguments, result2Obj._id);
//                                     });
//                             }
//                         }
//                     });
//                     callback();
//                 }
//             ], cbk);
//
//         }, cb);
//
//     }
// ], function (err, result) {
//     console.log(result);
// })



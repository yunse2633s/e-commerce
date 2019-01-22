/**
 * Created by Administrator on 17/8/18.
 */
var _ = require('underscore');
var async = require('async');
var mongoose = require('mongoose');
var sha1 = require('sha1');
var config_server = require('../configs/config_server')
var Schema = mongoose.Schema;
var querystring = require('querystring');
var request = require('request');
mongoose.Promise = global.Promise;

var OrderClassifySchema = new Schema({
    phone: {type: String, required: true, unique: {index: true}},
    real_name: {type: String, default: ''},
    role: {type: String, default: ''},
    gender: {type: String, default: 'MALE'},
    company_id: {type: Array},   //我加入的公司,
    time_creation: {
        type: Date, default: function () {
            return new Date()
        }
    },
    photo_url: {type: String, default: 'http://rsc-jishuzhichi.oss-cn-beijing.aliyuncs.com/default_face.png'},
    province: {type: String, default: ''},//省
    city: {type: String, default: ''},    //市
    district: {type: String, default: ''},//区县
    addr: {type: String, default: ''},    //详细
    post: {type: String, default: ''},    //岗位职务
    sell: {type: Array},    //销售设置
    buy: {type: Array},    //采购设置
    transport: {type: Array},    //运什么
    verify_lock: {type: String, default: 'UNLOCK'},    //认证锁(关闭可修改，开启不可修改)
    id_card_number: {type: String},       //身份证号码
    id_card_number_url: {type: String, default: ''},  //身份证照片正面
    id_card_number_back_url: {type: String, default: ''},  //身份证照片背面
    jia_shi_zheng_url: {type: String, default: ''}     //驾驶证照片
});

var UserSchema = new Schema({
    phone: {type: String, required: true, unique: {index: true}},
    real_name: {type: String, default: ''},
    role: {type: String, default: ''},
    gender: {type: String, default: 'MALE'},
    company_id: {type: String, default: ''},
    photo_url: {type: String, default: 'http://rsc-jishuzhichi.oss-cn-beijing.aliyuncs.com/default_face.png'},
    post: {type: String, default: ''},    //岗位职务
    sell: {type: Array},    //销售设置
    buy: {type: Array},    //采购设置
    transport: {type: Array},    //运什么
    time_creation: {
        type: Date, default: function () {
            return new Date()
        }
    }
});
var db_conn_trade = mongoose.createConnection('mongodb://192.168.3.248:27017/rsc_main');
var ceshi = db_conn_trade.model('user_traffic', OrderClassifySchema);
var trade = db_conn_trade.model('user_trade', OrderClassifySchema);
;

var AppKey = '34933ec0c6e6d8add0129e8177d39b41';
var AppSecret = '1602955c262e';

// 注册
var createUser = function (data, cb) {
    if (!cb) cb = function () {
    };
    var a = Math.random();
    var Nonce = a * Math.pow(10, a.toString().split('.')[1].length);
    var CurTime = ((new Date()).getTime() / 1000 - 100).toString().split('.')[0];
    var CheckSum = sha1(AppSecret + Nonce + CurTime);
    var options = {
        url: 'https://api.netease.im/nimserver/user/create.action',
        body: querystring.stringify(data),
        method: 'POST',
        headers: {
            AppKey: AppKey,
            Nonce: Nonce,
            CurTime: CurTime,
            CheckSum: CheckSum,
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    };
    request(options, function (err, http_req, http_res) {
        if (err) return cb(err);
        if (http_req.statusCode === 200) {
            console.log(http_res);
            cb(null, http_res);
        } else {
            cb(http_req.statusCode);
        }
    });
};
createUser({
    accid: "59a8b9eec4fc0b2b04b15bd5",
    name: '啦啦啦',
    icon: 'http://rsc-jishuzhichi.oss-cn-beijing.aliyuncs.com/default_face.png',
    token: "a11111"
}, function (err, result, asd) {
    console.log(arguments);
});


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
//             console.log(result.concat(list).length);
//         });
//
//     }
// ], function (err, result) {
// })
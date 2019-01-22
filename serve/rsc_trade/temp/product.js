/**
 * Created by Administrator on 17/8/18.
 */
var _ = require('underscore');
var async = require('async');
var mongoose = require('mongoose');
var config_server = require('../configs/config_server')
var Schema = mongoose.Schema;
var querystring = require('querystring');
var request = require('request');


var db_trade = mongoose.createConnection('mongodb://192.168.3.248:27017/rsc_trade');
var db_trade_pro = mongoose.createConnection('mongodb://rscdba:a11111@60.205.146.53:27033/rsc_trade');
var add = function (one, two) {
    var config = 0;
    async.waterfall([
        function (cb) {
            one.find({}, cb);
        },
        function (result, cb) {
            async.eachSeries(result, function (obj, callback) {
                async.waterfall([
                    function (cbk) {
                        two.findOne({
                            find: {_id: obj._id}
                        }, cbk);
                    },
                    function (result, cbk) {
                        if (result) {
                            cbk();
                        } else {
                            config++;
                            obj = obj.toObject();
                            obj = new two(obj);
                            obj.save(cbk);
                        }
                    }
                ], callback);
            }, cb);
        }
    ], function (err) {
        console.log(err,config);
    });
}


var configSchema = new Schema({
    name: {type: String},                        // 名称
    unit: {type: String, default: ''},                           // 单位
    status: {type: String},                      // 类型
    number: {type: Number},                      // 类型
    PID: {type: Array},                          // 父节点
    vary: {type: String, default: ''},                           // 增长值
    calculate: {type: Boolean, default: false},                   // 增长值
    numbering: {type: String},
    keyboard: {type: String}                      // 类型
});


var ProductClassifySchema = new Schema({
    PID: {type: String, required: true},                         // 父节点
    chn: {type: String, required: true},                         // 中文
    eng: {type: String, required: true},                         // 英文
    lev: {type: Number, default: 0},                             // 层级数
    attribute: {type: String, default: ''},                      // 属性
    price_type: {type: String, default: ''},                     // 价格类型
    unit_product: {type: String, default: ''},                   // 产品单位
    unit_pass: {type: String, default: ''},                      // 运输单位
    unit_metering: {type: String, default: ''},                  // 运输单位
    file: {type: String}
});

var asd = new Schema({
    CID: {type: Array, required: true},                          // 父节点
    numbering: {type: String}
});
var attGroup = db_trade.model('attGroup', asd);
var attGroup_pro = db_trade_pro.model('attGroup', asd);
var ProductConfig = db_trade.model('config', configSchema);
var ProductConfig_pro = db_trade_pro.model('config', configSchema);
var ProductClassify = db_trade.model('classify', ProductClassifySchema);
var ProductClassify_pro = db_trade_pro.model('classify', ProductClassifySchema);

add(attGroup, attGroup_pro);
add(ProductConfig, ProductConfig_pro);
add(ProductClassify, ProductClassify_pro);

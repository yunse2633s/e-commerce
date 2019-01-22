/**
 * Created by Administrator on 17/8/18.
 */
var excel_to_json = require('excel-as-json');
var _ = require('underscore');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var async = require('async');
var pinyin = require('pinyin');

// var db_trade = mongoose.createConnection('mongodb://rscdba:a11111@60.205.146.53:27033/rsc_trade');
var db_trade = mongoose.createConnection('mongodb://192.168.3.248:27017/rsc_trade');
// var db_trade = mongoose.createConnection('mongodb://rscdba:a11111@101.200.0.196:27040/rsc_trade');
var ProductClassifySchema = new Schema({
    PID: {type: String, required: true},                         // 父节点
    chn: {type: String, required: true},                         // 中文
    eng: {type: String, required: true},                         // 英文
    lev: {type: Number, default: 0},                             // 层级数
    line: {type: Number},                                        // 属于配置表行数
    attribute: {type: String, default: ''},                      // 属性
    price_type: {type: String, default: ''},                     // 价格类型
    unit_product: {type: String, default: ''},                   // 产品单位
    unit_pass: {type: String, default: ''},                      // 运输单位
    unit_metering: {type: String, default: ''},                  // 运输单位
    path_loss: {type: Boolean},                                  // 路耗
    file: {type: String}
});

var calssify = db_trade.model('classify', ProductClassifySchema);
var configSchema = new Schema({
    name: {type: String, required: true},                        // 名称
    unit: {type: String, default: ''},                           // 单位
    status: {type: String, required: true},                      // 类型
    number: {type: Number, required: true},                      // 排序
    PID: {type: Array, required: true},                          // 父节点
    vary: {type: String, default: ''}                            // 增长值
});

var config = db_trade.model('config', configSchema);

var resultObj = {};
var attObj = {};
var otherObj = {};

async.waterfall([
    function (cb) {
        excel_to_json.processFile('./产品分类.xlsx', null, {isColOriented: false, omitEmptyFields: true}, cb);
    },
    function (result, cb) {
        var obj = getGroupByParam(result, 'material');
        var arr = _.pluck(_.values(obj), 'array');
        async.eachSeries(arr, function (list, arrback) {
            var line = 0;
            async.eachSeries(list, function (entry, cbk) {
                line++;
                var pid, i = 0;
                var paramArr = _.keys(entry);
                async.eachSeries(_.keys(entry), function (param, cbbbb) {
                    async.waterfall([
                        function (cback) {
                            if (i == 0) {
                                addMaterial(entry, function (err, result, count) {
                                    if (err) return cback(err);
                                    if (result) pid = result._id.toString();
                                    cback();
                                });
                            } else {
                                cback();
                            }
                        },
                        function (cback) {
                            var attribute, price_type, unit_product, unit_pass, unit_metering, path_loss;
                            //存在产品名称和属性都没有的产品，所以加了price_type判断，注意以后加列只能在最后加，这涉及列判断
                            if (paramArr[i + 1] === 'attribute' ||
                                paramArr[i + 1] === 'product_name' ||
                                paramArr[i + 1] === 'price_type') {
                                attribute = entry['attribute'];
                                price_type = entry['price_type'];
                                unit_product = entry['unit_product'];
                                unit_pass = entry['unit_pass'];
                                unit_metering = entry['unit_metering'];
                                path_loss = entry['path_loss'];
                            } else {
                                attribute = '';
                                price_type = '';
                                unit_product = '';
                                unit_pass = '';
                                unit_metering = '';
                                path_loss = false;
                            }
                            if ((new RegExp('layer').test(param))) {
                                add(pid, i, entry[param], {
                                    attribute: attribute,
                                    price_type: price_type,
                                    unit_product: unit_product,
                                    unit_pass: unit_pass,
                                    unit_metering: unit_metering,
                                    path_loss: path_loss
                                }, line, function (err, result, count) {
                                    if (err) return cback(err);
                                    if (result) pid = result._id.toString();
                                    if (paramArr[i + 1] === 'product_name') resultObj[pid] = entry['product_name'];
                                    delete entry[param];
                                    cback();
                                });
                            } else {
                                cback();
                            }
                        },
                        function (cback) {
                            i++;
                            cback();
                        }
                    ], cbbbb);
                }, function (err) {
                    if (err) return cbk(err);
                    i = 0;
                    cbk();
                });
            }, arrback);
        }, cb);
    },
    function (cb) {
        async.eachSeries(_.keys(resultObj), function (param, callback) {
            var arr;
            if (_.isNumber(resultObj[param])) {
                arr = [resultObj[param]];
            } else {
                arr = resultObj[param].indexOf(',') != -1 ? _.compact(resultObj[param].split(',')) : resultObj[param].indexOf('，') != -1 ? _.compact(resultObj[param].split('，')) : [resultObj[param]]
            }
            var num = 0;
            async.eachSeries(arr, function (product_name, cbk) {
                ++num;
                addProductName(param, num, product_name, cbk);
            }, callback);
        }, cb);
    }
], function (err, result) {
    console.log('err:',err);
    console.log('set classify: ok');
});
// 数组根据特定字段分组
var getGroupByParam = function (list, param) {
    var Obj = {};
    for (var i = 0; i < list.length; i++) {
        var obj = list[i];
        if (!Obj[obj[param]]) {
            Obj[obj[param]] = {
                name: param,
                value: obj[param],
                array: []
            };
        }
        Obj[obj[param]].array.push(obj);
    }
    return Obj;
};
var file = {
    钢铁: 'http://rsc-jishuzhichi.oss-cn-beijing.aliyuncs.com/products/steel.png',
    矿石: 'http://rsc-jishuzhichi.oss-cn-beijing.aliyuncs.com/products/ore.png',
    煤焦: 'http://rsc-jishuzhichi.oss-cn-beijing.aliyuncs.com/products/coal.png',
    再生资源: 'http://rsc-jishuzhichi.oss-cn-beijing.aliyuncs.com/products/Renewable%20resources.png'
};
var addMaterial = function (entry, callback) {
    if (!callback) callback = function () {
    };
    async.waterfall([
        function (cb) {
            calssify.findOne({chn: entry.material}, cb);
        },
        function (result, cb) {
            if (result) {
                cb(null, {_id: result._id}, null)
            } else {
                (new calssify({
                    lev: 0,
                    PID: 0,
                    chn: entry.material,
                    file: file[entry.material],
                    eng: pinyinString(entry.material)
                })).save(callback);
            }
        }
    ], callback);
};

var add = function (pid, i, chn, obj, line, callback) {
    async.waterfall([
        function (cb) {
            calssify.findOne({PID: pid, chn: chn}, cb);
        },
        function (result, cb) {
            if (result) {
                cb(null, result, null);
            } else {
                (new calssify(_.extend({PID: pid || 0, chn: chn, eng: pinyinString(chn), lev: i, line: line}, obj))).save(cb);
            }
        }
    ], callback);
};

var addProductName = function (pid, num, chn, callback) {
    async.waterfall([
        function (cb) {
            config.findOne({name: chn}, cb);
        },
        function (result, cb) {
            if (!result) {
                (new config({PID: [pid], name: chn, number: num, status: 'product_name', calculate: true})).save(cb);
            } else {
                config.update({name: chn}, {$addToSet: {PID: pid}}, {multi: true}, cb);
            }
        }
    ], callback);
};

var pinyinString = function (chn) {
    var eng = '';
    pinyin(chn, {style: pinyin.STYLE_NORMAL}).forEach(function (nam) {
        eng = eng + nam;
    });
    //如果是存数字则转完中文为空，不过结构要求必有英文，所以存数字就拿存数字当英文
    return eng || chn;
};



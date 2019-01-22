/**
 * Created by Administrator on 17/8/18.
 */
var excel_to_json = require('excel-as-json');
var _ = require('underscore');
var async = require('async');
var pinyin = require('pinyin');

// var db_trade = mongoose.createConnection('mongodb://192.168.3.248:27017/rsc_traffic');

var resultObj = {};
var attObj = {};
var otherObj = {};

async.waterfall([
    function (cb) {
        excel_to_json.processFile('../product_config/产品分类.xlsx', null, {isColOriented: false, omitEmptyFields: true}, cb);
    },
    function (result, cb) {
        var obj = getGroupByParam(result, 'material');
        var arr = _.pluck(_.values(obj), 'array');
        console.log('aa', arr[0])
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



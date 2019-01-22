/**
 * Created by Administrator on 17/8/18.
 */
var excel_to_json = require('excel-as-json');
var _ = require('underscore');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var async = require('async');

// var db_trade = mongoose.createConnection('mongodb://rscdba:a11111@60.205.146.53:27033/rsc_trade');
var db_trade = mongoose.createConnection('mongodb://192.168.3.248:27017/rsc_trade');
// var db_trade = mongoose.createConnection('mongodb://rscdba:a11111@101.200.0.196:27040/rsc_trade');

var configSchema = new Schema({
    name: {type: String},                        // 名称
    unit: {type: String, default: ''},                           // 单位
    status: {type: String, required: true},                      // 类型
    vary: {type: String, default: ''},                           // 增长值
    numbering: {type: String},
    keyboard: {type: String, required: 'string'},                      // 类型
});
var config = db_trade.model('config', configSchema);


async.waterfall([
    function (cb) {
        excel_to_json.processFile('./单位.xlsx', null, {isColOriented: false, omitEmptyFields: true}, cb);
    },
    function (result, cb) {
        async.eachSeries(result, function (obj, callback) {
            add(obj, callback);
        }, cb);
    }
], function (err) {
    console.log('err:',err);
    console.log('set addUnit: ok');
});


var add = function (obj, callback) {
    async.waterfall([
        function (cbk) {
            config.count({numbering: obj.numbering}, cbk);
        },
        function (result, cbk) {
            if (!result) {
                (new config(obj)).save(cbk);
            } else {
                cbk();
            }
        }
    ], callback)
}


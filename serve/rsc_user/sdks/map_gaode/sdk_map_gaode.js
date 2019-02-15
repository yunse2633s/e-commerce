/**
 * Created by Administrator on 2017/5/25.
 */

var http = require('http');

var key = '16a44fc050cdfe70b8a3bf98b6366f87';

//通过文字地址获取经纬度
exports.getCoordinate = function(address, cb){
    http.get('http://restapi.amap.com/v3/geocode/geo?address='+encodeURIComponent(address)+'&output=JSON&key='+key, function (result) {
        result.setEncoding('utf8');
        var str = '';
        result.on('data', function (chunk) {
            str += chunk;
        });
        result.on('end', function () {
            if (JSON.parse(str).status === '1') {
                return cb(null, JSON.parse(str));
            } else {
                return cb(str);
            }
        });
    });
};
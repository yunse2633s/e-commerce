/**
 * Created by Administrator on 2017/4/17.
 */

//版本比较
var lib_util = require('../libs/lib_util');
console.log(lib_util.versionCompare('2.9.9'));
console.log(lib_util.versionCompare('3.9.9'));
console.log(lib_util.versionCompare('3.0.1'));
console.log(lib_util.versionCompare('3.1.0'));
console.log(lib_util.versionCompare('3.0.0'));


//字符串去除特殊字符
var _ = require('underscore');
var a = '153 0017 8737---';
var b = [' ', '-'];
var c;
for(var i = 0; i < b.length; i++){
    var arr = a.split(b[i]);
    a = '';
    for(var j = 0; j < arr.length; j++){
        a += arr[j];
    }
}
console.log(a);
/**
 * Created by Administrator on 2017/5/22.
 */
var _ = require('underscore');

exports.clone = function (data) {
    return JSON.parse(JSON.stringify(data));
};

exports.transObjArrToObj = function (arr, field) {
    var newArr = {};
    if (!arr || arr.length == 0) {
        return newArr;
    }
    for (var i = 0; i < arr.length; i++) {
        var data = arr[i][field];
        if (data) {
            newArr[data] = arr[i].toObject ? arr[i].toObject() : arr[i];
        }
    }
    return newArr;
};

//从对象数组中取某个字段变成数组   field:a [{a:1,b:2},{a:3,b:4}]=>[1,3]    notToString：false转,true不转
exports.transObjArrToSigArr = function (arr, field, notToString) {
    var newArr = [];
    if (!arr || arr.length == 0) {
        return newArr;
    }
    for (var i = 0; i < arr.length; i++) {
        var data = arr[i][field];
        if (data) {
            if (_.isArray(data)) {
                newArr = newArr.concat(data);
            } else {
                if (!notToString) {
                    newArr.push(data.toString());
                } else {
                    newArr.push(data);
                }
            }
        }
    }
    return newArr;
};
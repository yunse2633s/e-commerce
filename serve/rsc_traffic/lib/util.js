/**
 * Created by Administrator on 2015/12/26.
 */
var _ = require('underscore');

exports.transObjArrToSigArr = function(arr, field){
    var newArr = [];
    if(!arr || arr.length == 0){
        return newArr;
    }
    for(var i = 0; i < arr.length; i++){
        var data = arr[i][field];
        if(data){
            if(_.isArray(data)){
                newArr = newArr.concat(data);
            }else{
                newArr.push(data.toString());
            }
        }
    }
    return newArr;
};

exports.transObjArrToObj = function(arr, field){
    var newArr = {};
    if(!arr || arr.length == 0){
        return newArr;
    }
    for(var i = 0; i < arr.length; i++){
        var data = arr[i][field];
        if(data){
            newArr[data] = arr[i].toObject ? arr[i].toObject() : arr[i];
        }
    }
    return newArr;
};

exports.transDateToStr = function(time){
    var str = '';
    str += time.getFullYear();
    str += '-';
    str += (time.getMonth()+1);
    str += '-';
    str += time.getDate();
    return str;
};

exports.deepClone = function(obj){
    var o;
    switch(typeof obj){
        case 'undefined': break;
        case 'string'   : o = obj + '';break;
        case 'number'   : o = obj - 0;break;
        case 'boolean'  : o = obj;break;
        case 'object'   :
            if(obj === null){
                o = null;
            }else{
                if(_.isArray(obj)){
                    o = [];
                    for(var i = 0, len = obj.length; i < len; i++){
                        o.push(this.deepClone(obj[i]));
                    }
                }else{
                    o = {};
                    for(var k in obj){
                        o[k] = this.deepClone(obj[k]);
                    }
                }
            }
            break;
        default:
            o = obj;break;
    }
    return o;
};

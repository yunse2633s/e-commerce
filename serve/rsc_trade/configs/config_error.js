/**
 * Created by Administrator on 2017/4/10.
 */
var config_model = require('../configs/config_model');
var _ = require('underscore');
var async = require('async');

module.exports = {
    //只检验到第二层
    checkObj: function (data, obj) {
        for (var index in obj) {
            if (obj.hasOwnProperty(index)) {
                if (!data[index]) {
                    return false;
                } else {
                    if (_.isObject(obj[index]) && !_.isArray(obj[index])) {
                        for (var index1 in obj[index]) {
                            if (obj[index].hasOwnProperty(index1)) {
                                if (!data[index][index1]) {
                                    return false;
                                }
                            }
                        }
                    } else if (_.isArray(obj[index]) && _.isObject(data[index][0]) && !_.isArray(data[index][0])) {
                        if (obj[index].length === 0) return false;
                        for (var index2 in data[index][0]) {
                            if (data[index][0].hasOwnProperty(index2)) {
                                for (var i = 0; i < obj[index].length; i++) {
                                    var dataObj = obj[index][i];
                                    if (!_.isObject(data[index][0]) || _.isArray(data[index][0])) {
                                        return false
                                    } else {
                                        if (!dataObj[index2]) {
                                            return false;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        return true;
    },
    /**
     *
     * @param body
     * @param paramArr   必传的参数
     * @param cb
     * @param chooseArr  在某种情况下 必传哪些参数
     * @param index    用于拼接param  检验config_common是否有枚举
     * @returns {*}
     */
    checkBody: function (body, paramArr, cb, chooseArr, index) {
        if (!chooseArr) chooseArr = [];
        for (var i = 0; i < paramArr.length; i++) {
            var param = paramArr[i];
            if (body[param] === 0 || body[param] === false || body[param] === "" || body[param] === '') continue;
            if (!body[param] ||//检验参数是否存在
                (_.isArray(body[param]) && (body[param].length === 0) ||//当value为数组时  长度不能为0
                (_.isObject(body[param][0]) && !_.isArray(body[param][0]) && config_model[param] && !this.checkObj(body[param][0], config_model[param]))) ||//当value为数组时  检验config_model中是否有规定格式  如果有 检验value【0】是否有效
                (_['isString'](body[param]) && config_model[param] && !config_model[param][body[param]]) ||// 当value为字符串时  检验config_model中是否有枚举  如果有 是否有改value
                config_model[param] && _.isObject(body[param]) && !_.isArray(body[param]) && !this.checkObj(config_model[param], body[param]) ||// 当value为对象时  检验config_model中是否有规定格式  如果有 检验value是否有效
                (config_model[index + '_' + param] && _['isString'](body[param]) && !config_model[index + '_' + param][body[param]])// 当value为字符串时  检验config_model中是否有枚举  如果有 是否有改value
            ) {
                return cb(this.invalid_format + " : " + param);
            }
        }
        //检验规定情况下 必须传什么参数 [{payment_style:CIF},['price']]  在payment_style的值为CIF的时候  price为必传参数 否则则不用必传
        for (var j = 0; j < chooseArr.length; j++) {
            var arr = chooseArr[j];
            var is_true = false;
            if (_.isArray(arr)) {
                for (var k = 0; k < arr.length; k++) {
                    var choose = arr[k];
                    if (_.isObject(choose)) {
                        for (var att in choose) {
                            if (choose.hasOwnProperty(att)) {
                                if (body[att] === choose[att]) {
                                    is_true = true;
                                }
                            }
                        }
                    }
                    if (_.isArray(choose) && is_true) {
                        for (var n = 0; n < choose.length; n++) {
                            if (!body[choose[n]]) {
                                return cb(this.invalid_format + ' : ' + choose[n]);
                            }
                        }
                    }
                }
            }
        }
        cb();
    },
    checkRole: function (user_role, Arr, cb) {
        var ERROR = this.invalid_role;
        Arr.forEach(function (role) {
            if (user_role === role) {
                ERROR = undefined;
            }
        });
        cb(ERROR);
    },

    frozen: '公司冻结',

    invalid_format: '无效参数',
    invalid_role: '没有权限',
    invalid_id: '无效id',
    invalid_date: '无效的时间参数',
    invalid_method: '无效的方法名',
    invalid_amount: '无效吨数',
    invalid_product: "无效产品",
    invalid_VIP: '没有权限',
    invalid_number: '无效个数',

    not_found: '没有找到',
    not_file: '缺少文件',
    not_amount: '吨数无效',

    no_number: '没有次数',
    no_product: '未知产品',

    file_little_bigger: '文件较大',

    JJ_ERROR: '已竞价',

    amount_overstep:'竞价吨数超过剩余总竞价吨数',

    unknown_err: '未知错误'
};
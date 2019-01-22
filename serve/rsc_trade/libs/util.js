/**
 * Created by Administrator on 2015/12/25.
 */
/**
 * Created by Administrator on 2017/2/27.
 */
var request = require('request');
var decimal = require('decimal');
var async = require('async');
var _ = require('underscore');
var urlencode=require('urlencode');
var config_common = global.config_common;
var dateNumberToString = function (num) {
    var str = '';
    if (num < 10) {
        str = '0' + num.toString();
    }
    else {
        str = num.toString();
    }
    return str;
};

module.exports = {

    clone: function (data) {
        return JSON.parse(JSON.stringify(data));
    },

    getRandom: function (num) {
        if (!num) num = 1;
        var result = 0;
        for (var i = 0; i < num; i++) {
            result += Math.floor(Math.random() * 10 - 1);
        }
        return _.range(10, 90)[result];
    },

    // getToday: function () {
    //     var date = new Date();
    //     return date.getFullYear() + ' ' + (date.getMonth() + 1) + ' ' + date.getDay();
    // },
    /**
     * 根据某个字段去重
     * @param data  数组
     * @param index   键
     * @returns {Array}
     */
    getObjArr: function (data, index) {
        var users = [], uhash = {};
        for (var i = 0, length = data.length; i < length; ++i) {
            if (!uhash[data[i][index]]) {
                uhash[data[i][index]] = true;
                users.push(data[i]);
            }
        }
        return users;
    },

    /**
     * 生成index
     * @param my_type
     * @returns {string}
     */
    getOrderIndex: function (my_type) {
        var index = '';
        switch (my_type) {
            case 'order': {
                index += 'cg-';
                break;
            }
            case 'demand': {
                index += 'cgxq-';
                break;
            }
        }
        var today = new Date();
        var year = today.getFullYear().toString().substr(2);
        var month = dateNumberToString(today.getMonth() + 1);
        var date = dateNumberToString(today.getDate());
        var random = '';
        for (var i = 0; i < 5; i++) {
            var s_index = Math.floor(Math.random() * config_common.index_number.length);
            random += config_common.index_number[s_index];
        }
        index += year + month + date + random;
        return index;
    },

    /**
     * 添加公司信息
     * @param arr
     * @param result
     * @param param
     * @returns {Array}
     */
    addCompanyVIP: function (arr, result, param) {
        var newArr = [];
        result.forEach(function (company) {
            arr.forEach(function (entry) {
                if (company._id === entry[param]) {
                    for (var index in company) {
                        if (company.hasOwnProperty(index) && config_common.VIP[index]) {
                            entry[index] = company[index];
                        }
                    }
                }
                newArr.push(entry);
            });
        });
        return newArr.length === 0 ? arr : newArr;
    },

    /**
     * 添加用户信息
     * @param arr
     * @param result
     * @param param
     * @returns {Array}
     */
    addUser: function (arr, result, param) {
        var newArr = [];
        result.forEach(function (user) {
            arr.forEach(function (entry) {
                if (user._id === entry[param]) {
                    for (var index in user) {
                        if (user.hasOwnProperty(index) && config_common.user[index]) {
                            entry[index] = user[index];
                        }
                    }
                }
                newArr.push(entry);
            });
        });
        return newArr;
    },

    /**
     * 添加仓库信息
     * @param arr
     * @param result
     * @param param
     * @returns {Array}
     */
    addStorage: function (arr, result, param) {
        var newArr = [];
        result.forEach(function (storage) {
            arr.forEach(function (entry) {
                if (storage._id === entry[param]) {
                    for (var index in storage) {
                        if (storage.hasOwnProperty(index) && config_common.storage[index]) {
                            entry[index] = storage[index];
                        }
                    }
                }
                newArr.push(entry);
            });
        });
        return newArr;
    },

    toObjective: function (result) {
        var list = [];
        result.forEach(function (obj) {
            list.push(obj.toObject());
        });
        return list;
    },

    getDateByHour: function (num) {
        return new Date((new Date()).getTime() + 1000 * 60 *60* Number(num));
    },

    getDateByHour2: function (num) {
        return new Date((new Date()).getTime() + 1000 * 60* Number(num));
    },

    /**
     * 数组根据特定字段分组
     * @param list
     * @param param
     * @returns {{}}
     */
    getGroupByParam: function (list, param) {
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
    },

    // /**
    //  * 数组根据特定字段分组
    //  * @param list
    //  * @param param
    //  * @returns {{}}
    //  */
    // getGroupByParams: function (list, param) {
    //     var Obj = {};
    //     for (var i = 0; i < list.length; i++) {
    //         var obj = list[i];
    //         if (!Obj[obj[param]]) {
    //             Obj[obj[param]] = {
    //                 name: param,
    //                 value: obj[param],
    //                 array: []
    //             };
    //         }
    //         Obj[obj[param]].array.push(obj);
    //     }
    //     return Obj;
    // },

    add: function (number, count) {
        return decimal(number.toString())['add'](count.toString()).toNumber();
    },
    sub: function (number, count) {
        return decimal(number.toString())['sub'](count.toString()).toNumber();
    },
    mul: function (number, count) {
        return decimal(number.toString())['mul'](count.toString()).toNumber();
    },
    div: function (number, count) {
        return decimal(number.toString())['div'](count.toString()).toNumber();
    },

    getChild: function (list, param, callback) {
        callback(null, _.flatten(_.pluck(list, param)));
    },

    getProduct: function (list, param, callback) {
        callback(null, _.compact(_.uniq(_.pluck(_.flatten(_.pluck(_.flatten(_.pluck(list, 'product_categories')), 'layer')), param))));
    },
    
    getProductName:function (list,callback) {
        callback(null, _.compact(_.uniq(_.pluck(_.flatten(_.compact(_.uniq(_.pluck(_.flatten(_.pluck(list, 'product_categories')), 'product_name')))), 'name'))));
    },

    getTwo: function (list, index,param, callback) {
        callback(null, _.compact(_.uniq(_.pluck(_.flatten(_.pluck(list, index)), param))));
    },

    /**
     * 订单用
     * @param product
     */
    getMaterialList: function (product) {
        var Obj = {};
        for (var i = 0; i < product.length; i++) {
            var obj = product[i];
            var layerObj;
            layerObj = obj;
            if (obj.layer) layerObj = obj.layer;
            if (!Obj[layerObj['layer_1']]) {
                Obj[layerObj['layer_1']] = {
                    chn: layerObj['layer_1_chn'],
                    number: 0,
                    unit: obj.unit
                };
            }
            if (Obj[layerObj['layer_1']]) {
                var number = 0;
                for (var j = 0; j < obj.product_name.length; j++) {
                    number = this.add(number, obj.product_name[j].number);
                }
                Obj[layerObj['layer_1']].number = this.add(Obj[layerObj['layer_1']].number, number);
            }
        }
        return _.values(Obj);
    },
    shortenurl:function (url) {
        var headers =
        {
            'Content-Type': 'application/x-www-form-urlencoded'
        };
        var options =
        {
            'method': 'GET',
            'headers': headers,
            'url': 'http://api.ft12.com/api.php?url='+ urlencode(url)
        };
        return options;
    },
    isSameDay: function (date1, data2) {
        return (date1.toLocaleDateString() === data2.toLocaleDateString());
    },

    //从对象数组中取某个字段变成数组   field:a [{a:1,b:2},{a:3,b:4}]=>[1,3]    notToString：false转,true不转
    transObjArrToSigArr: function (arr, field, notToString) {
        var newArr = [];
        if (!arr || arr.length === 0) {
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
    },

    transObjArrToObj: function (arr, field) {
        var newArr = {};
        if (!arr || arr.length === 0) {
            return newArr;
        }
        for (var i = 0; i < arr.length; i++) {
            var data = arr[i][field];
            if (data) {
                newArr[data] = arr[i].toObject ? arr[i].toObject() : arr[i];
            }
        }
        return newArr;
    },
    checkPhone: function (input) {
        var reg = /^1[3-9][0-9]{9}/;
        return reg.test(input);
    },
    truck_number_pro: ['京', '津', '沪', '渝', '蒙', '新', '藏', '宁', '桂', '港', '澳', '黑', '吉', '辽', '冀', '晋', '青', '鲁', '豫', '苏', '皖', '浙', '闽', '赣', '湘', '鄂', '粤', '台', '琼', '甘', '陕', '川', '贵', '云'],
    truck_number_letter: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'],
    check_truck_num: function(truck){
        return this.truck_number_pro.indexOf([truck[0]])!=-1 && this.truck_number_letter.indexOf([truck[1]])!=-1;
    }
};

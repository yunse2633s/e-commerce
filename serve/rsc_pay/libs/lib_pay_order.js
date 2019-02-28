/**
 * Created by Administrator on 2017/2/27.
 */
var http = require('../libs/http');
var https = require('https');
var async = require('async');
var _ = require('underscore');
var fs = require('fs');

var config_api_url = global.config_api_url;
var config_error = global.config_error;
var crypto = require('crypto');

var PayOrderDB = require('../dbs/db_base')('PayOrder');

//依据条件查询单个表详情
exports.getOne = function (data, callback) {
    PayOrderDB.getOne(data, callback);
};
//依据条件添加单个表详情
exports.add = function (data, callback) {
    PayOrderDB.add(data, callback);
};
exports.del = function (data, callback) {
    PayOrderDB.del(data, callback)
};
//依据条件修改单个表详情
exports.update = function (data, callback) {
    PayOrderDB.update(data, callback);
};
exports.getList = function (data, callback) {
    PayOrderDB.getList(data, callback);
};
exports.getCount = function (data, callback) {
    PayOrderDB.getCount(data, callback);
};

exports.getVerifyContent = function (params) {
    var sPara = [];
    if (!params) return null;
    params = JSON.stringify(params, 'utf-8');
    // params = params;
    return params;
}

exports.getParams = function (platform, par) {
    var parmas;
    var data = new Date();
    var out_trade_no = this.dateByOrder(data);
    var timestamp = this.dateInit(data);
    var orderDate = this.dateInitDay(data);
    var reqTime = this.dateInitreqTime(data);
    switch (platform) {
        case 'WowUnicom':
            parmas = {
                interfaceVersion: '2.0.0.0',
                tranType: '20102',
                bankCode: 'ABC_B2B',
                merNo: '301100710007142',
                goodsName: '测试名字',
                orderDate: orderDate,
                orderNo: out_trade_no,
                amount: par.amount,
                charSet: 'UTF-8',
                // payProducts:'B2BWY|YE|B2CWY|FKB',
                payProducts: 'B2BWY',
                tradeMode: '0001',
                reqTime: reqTime,
                respMode: '1',
                // callbackUrl:'http://credit.e-wto.com/#/rsc/paySuccess',
                callbackUrl: 'http://60.205.146.53:18027/api/order/pay_page_redirection',
                signType: 'RSA_SHA256',
                signMsg: '',
                serverCallUrl: 'http://60.205.146.53:18027/api/order/pay_order_success'
            }
            break;
        default:
            console.log('出错')
    }
    return parmas;
}
exports.getSignType = function (platform, data) {
    var sign;
    switch (platform) {
        case 'WowUnicom':
            sign = this.createSignWowUnicom(data);
            break;
        default:
            console.log('出错')
    }
    return sign;
}

//将wow联通发来的数据生成有序数列
exports.getVerifyParamsSignWowUnicom = function (params) {
    var sPara = [];
    if (!params) return null;
    for (var key in params) {
        if ((!params[key]) || key == "trade_status" || key == "signMsg") {
            continue;
        }
        ;
        sPara.push([key, params[key]]);

    }
    sPara = sPara.sort();
    var prestr = '';
    for (var i2 = 0; i2 < sPara.length; i2++) {
        var obj = sPara[i2];
        if (i2 == sPara.length - 1) {
            prestr = prestr + obj[0] + '=' + obj[1] + '';
        } else {
            prestr = prestr + obj[0] + '=' + obj[1] + '|';
        }
    }
    return prestr;
}
//wow联通签名
exports.getSignWowUnicom = function (params) {
    // console.log('签名之前',params);
    try {
        //读取秘钥 新秘钥
        var key = '-----BEGIN RSA PRIVATE KEY-----\n' +
            'MIIEpAIBAAKCAQEAxlbZENi3nx5bnLqeSoj4XYaiGt/GXM6sZ6BfXn3UnAPfPiic\n' +
            'pvK3ydEAfxNut5WTeK61hwlPi5k+FMORNHNsDMr7aTry6Rj+HxluxuwnQS/gajnT\n' +
            '6tcA/60s209TQZ0ctnym1EDlv11asqL/pCEIrYDlq3nheptVfmA2pPu2DHHAZIoN\n' +
            '5hYoyuCMjXwtZI6LYp5aqaDpGsApvT9XdqXCWiL9HvGpU7bUgoEuO9a+Bqrf/A21\n' +
            '3PRsyrlOjsy4wJbe8KjpqHR5z25+D7yVU3sEBP8+Bj7wtuzX9oRnfUAUo4q/m/iA\n' +
            'UlxFl8O5tk5478h/HxtjSQDp+DarcTmn2AcqjwIDAQABAoIBAQCI96zLL34Oyl4l\n' +
            'q9JoUpKBs9n6iRJpQOhaX6u8i1TpsNrYCB+2QuOc4VJgb0EEUq0WqD//0vQ1yUvP\n' +
            '9wYtnI+/feWE1Aqv4myLeXrAsJCjObbWZLzt7jBoYGUbxnoOU7tiYk6rQW3na0aZ\n' +
            'GmtEIvPlLaBtfKuzidXOgg76fEFJ8YSpByEYU3LoeyOADR2FcNqrgWg+On9zzB5i\n' +
            '2zi6kk21T4x9pVDE879I5PuAyJt7U1lw2p0NO4pSEXTQfwBCOwj/TTxG88ni1QsK\n' +
            'Zshtbt13p3YS0I+hH5y83ypwjEkXU/I+k8Zec+UEkbImfSJJVnvDEJgaBNRvZuBG\n' +
            '16b6QzOhAoGBAOmYGgAZgMgsVmWCs/lt1eRJaEg8PsuMsLHPEty2M4i9ehl26XkM\n' +
            'N2TX0Q6rvAsaZxNVy7rhmRYwns8FwOb6zkq83IWgBmRCMfI1TUtEGkiQi5vdGLW+\n' +
            't+oWYeUPBOVAcFabUkDIK9JSRDAyzxgNI8uSPpLB55B7Vej46+NrMYjnAoGBANld\n' +
            'EDADMv5JrmNMnqcuw2wIHfFlR24Z6cLw2IdYHNVkm8GQVSAZrXSvoVXGljBwqqEm\n' +
            'bsqY7looDEXZ3d+XCuNm9D+gfI9auBWF9lDKP6XvTgIaoZtEUwid1JFAi6fqyNAA\n' +
            '8YTdM7M4hKtN5qk3qrmVJD/Au6ork3ALrXP081QZAoGARnoilhcbuMlPw868eCwA\n' +
            'VaEkOm8azxUClpMQcND0GXR5a0dqR6A88kr/AzsjQAJWSQogrqC0LHK8518oBUh0\n' +
            'hy4WJqbSZttl8FrOmD/S4kPiK0N42hTRrmnUXWS7qGNZwXeZSHxcZFd3xUb/HpWQ\n' +
            'UDIueN7R+9CKagD4QqQrzM8CgYEAs+RYhFPxfRC/2gDMgTKrm5owJdubPV0G4UZw\n' +
            '/bqHyngEjDMGsJVvv9WnIZVEMXzdSpfDM7tT8JuaZKkF/olEAqXvWUVaMU50caO4\n' +
            'Em8ANDWUixs9SoJGciglh70yl9sxLSzKthpYMmiBLEFBuCSREByFrpm09wYvdJjF\n' +
            'ieVdCOkCgYAJ08aZjS0ynhm+Pd3UE6pkPepR5nLNnTZh2kTrSz2dDg/gne+zWz3s\n' +
            'Miw9GI7ESHCxuxYDDXHA6r7a3b2sPQBlFnNQeUmadJwWMR8QyHD9LGQNV0Ne4F9R\n' +
            '427IIEpDcCnCxIbH2D+s+0oL/NAfbyihUcZxzkIZulqlJhlA4/nRhA==\n' +
            '-----END RSA PRIVATE KEY-----\n'
        var sign = crypto.createSign('RSA-SHA256');
        sign.update(params, 'utf8');
        sign = sign.sign(key, 'base64');
        return sign;
    } catch (err) {
        console.log('err', err)
    }
}
//wow联通签名
exports.createSignWowUnicom = function (params) {
    var result;
    //将参数排序，并将参数biz_content转为JSON字符串
    var myParam = this.getVerifyParamsSignWowUnicom(params);
    //获取签名串
    var mySign = this.getSignWowUnicom(myParam);
    //拼接
    params.signMsg = mySign;
    result = params;
    // console.log('加签之前验证-----------------', myParam);
    // console.log('加签之后验证-----------------', params.signMsg);

    return result;
}
//wow联通验签名
exports.checkSignWowUnicom = function (params) {
    var arr = [];
    var alipayPubkey = '-----BEGIN PUBLIC KEY-----\n' +
        'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAxlbZENi3nx5bnLqeSoj4\n' +
        'XYaiGt/GXM6sZ6BfXn3UnAPfPiicpvK3ydEAfxNut5WTeK61hwlPi5k+FMORNHNs\n' +
        'DMr7aTry6Rj+HxluxuwnQS/gajnT6tcA/60s209TQZ0ctnym1EDlv11asqL/pCEI\n' +
        'rYDlq3nheptVfmA2pPu2DHHAZIoN5hYoyuCMjXwtZI6LYp5aqaDpGsApvT9XdqXC\n' +
        'WiL9HvGpU7bUgoEuO9a+Bqrf/A213PRsyrlOjsy4wJbe8KjpqHR5z25+D7yVU3sE\n' +
        'BP8+Bj7wtuzX9oRnfUAUo4q/m/iAUlxFl8O5tk5478h/HxtjSQDp+DarcTmn2Acq\n' +
        'jwIDAQAB\n' +
        '-----END PUBLIC KEY-----'

    for (var key in params) {
        if (key != 'signMsg' && !!params[key]) {
            arr.push(key);
        }
    }
    arr.sort();
    var str = '';
    _.each(arr, function (substr) {
        str += substr + '=' + params[substr] + '|';
    });
    str = str.slice(0, str.length - 1);
    var verify = crypto.createVerify('SHA256');
    verify.update(str, 'utf-8');
    var result = verify.verify(alipayPubkey, params.signMsg, 'base64');
    return result;
};
//时间格式年月日时分秒毫秒
exports.dateByOrder = function (date) {
    var now = date;
    var year = now.getFullYear();
    var month = (now.getMonth() + 1).toString();
    var day = (now.getDate()).toString();
    var hour = (now.getHours()).toString();
    var minute = (now.getMinutes()).toString();
    var second = (now.getSeconds()).toString();
    var milliseseconds = (now.getMilliseconds()).toString();
    if (month.length == 1) {
        month = "0" + month;
    }
    if (day.length == 1) {
        day = "0" + day;
    }
    if (hour.length == 1) {
        hour = "0" + hour;
    }
    if (minute.length == 1) {
        minute = "0" + minute;
    }
    if (second.length == 1) {
        second = "0" + second;
    }
    if (milliseseconds.length < 3) {
        milliseseconds = "0" + milliseseconds;
        if (milliseseconds.length < 2) {
            milliseseconds = "0" + milliseseconds;
            if (milliseseconds.length < 1) {
                milliseseconds = "0" + milliseseconds;

            }
        }
    }
    var dateTime = year + month + day + hour + minute + second + milliseseconds;
    return dateTime;

}
//时间格式年-月-日 时：分：秒
exports.dateInit = function (date) {
    var now = date;
    var year = now.getFullYear();
    var month = (now.getMonth() + 1).toString();
    var day = (now.getDate()).toString();
    var hour = (now.getHours()).toString();
    var minute = (now.getMinutes()).toString();
    var second = (now.getSeconds()).toString();
    if (month.length == 1) {
        month = "0" + month;
    }
    if (day.length == 1) {
        day = "0" + day;
    }
    if (hour.length == 1) {
        hour = "0" + hour;
    }
    if (minute.length == 1) {
        minute = "0" + minute;
    }
    if (second.length == 1) {
        second = "0" + second;
    }
    var dateTime = year + "-" + month + "-" + day + " " + hour + ":" + minute + ":" + second;
    return dateTime;

};
//时间格式年月日
exports.dateInitDay = function (date) {
    var now = date;
    var year = now.getFullYear();
    var month = (now.getMonth() + 1).toString();
    var day = (now.getDate()).toString();
    var hour = (now.getHours()).toString();
    var minute = (now.getMinutes()).toString();
    var second = (now.getSeconds()).toString();
    if (month.length == 1) {
        month = "0" + month;
    }
    if (day.length == 1) {
        day = "0" + day;
    }
    if (hour.length == 1) {
        hour = "0" + hour;
    }
    if (minute.length == 1) {
        minute = "0" + minute;
    }
    if (second.length == 1) {
        second = "0" + second;
    }
    var dateTime = year + '' + month + '' + day;
    return dateTime;

};
//时间格式年月日时分秒秒
exports.dateInitreqTime = function (date) {
    var now = date;
    var year = now.getFullYear();
    var month = (now.getMonth() + 1).toString();
    var day = (now.getDate()).toString();
    var hour = (now.getHours()).toString();
    var minute = (now.getMinutes()).toString();
    var second = (now.getSeconds()).toString();
    if (month.length == 1) {
        month = "0" + month;
    }
    if (day.length == 1) {
        day = "0" + day;
    }
    if (hour.length == 1) {
        hour = "0" + hour;
    }
    if (minute.length == 1) {
        minute = "0" + minute;
    }
    if (second.length == 1) {
        second = "0" + second;
    }
    var dateTime = year + '' + month + day + hour + minute + second;
    return dateTime;

};
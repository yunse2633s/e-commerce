/**
 * Created by Administrator on 2017/2/27.
 */
var http = require('../libs/http');
var https = require('https');
var async = require('async');
var _ = require('underscore');
var fs = require('fs');
var parseString = require('xml2js').parseString;
var randomstring = require("randomstring");//获取随机数
var config_api_url = global.config_api_url;
var config_error = global.config_error;
var crypto = require('crypto');

var PayRechargeDB = require('../dbs/db_base')('PayRecharge');

//依据条件查询单个表详情
exports.getOne = function (data, callback) {
    PayRechargeDB.getOne(data, callback);
};
//依据条件添加单个表详情
exports.add = function (data, callback) {
    PayRechargeDB.add(data, callback);
};
exports.del = function (data, callback) {
    PayRechargeDB.del(data, callback)
};
//依据条件修改单个表详情
exports.update = function (data, callback) {
    PayRechargeDB.update(data, callback);
};
exports.getList = function (data, callback) {
    PayRechargeDB.getList(data, callback);
};
exports.getCount = function (data, callback) {
    PayRechargeDB.getCount(data, callback);
};

exports.getVerifyContent = function (params) {
    var sPara = [];
    if (!params) return null;
    params = JSON.stringify(params, 'utf-8');
    return params;
}

exports.getParams = function (platform, par) {
    var parmas;
    var data = new Date();
    var out_trade_no = this.dateByOrder(data);
    var timestamp = this.dateInit(data);
    var orderDate = this.dateInitDay(data);
    var reqTime = this.dateInitreqTime(data);
    var rand = randomstring.generate(30);
    switch (platform) {
        case 'Alipay':
            parmas = {
                app_id: '2018012502069441',
                method: 'alipay.trade.app.pay',
                charset: 'utf-8',
                sign_type: 'RSA2',
                timestamp: timestamp,
                version: '1.0',
                format: 'JSON',
                notify_url: 'http://60.205.146.53:18027/api/company/pay_price_success',
                biz_content: {
                    subject: '司机中心充值',
                    out_trade_no: out_trade_no,
                    total_amount: par.total_amount,
                    product_code: 'QUICK_MSECURITY_PAY',
                    timeout_express: '90m'
                },
                trade_status: 'ineffective',
                packageName: par.packageName
            };
            break;
        case 'WeChat':
            parmas = {
                // appid:"wx99b1f7bfb394e41b",
                // mch_id:"1499267862",
                appid:"wx7b4d8cfdcab2ef5e",
                mch_id:"1497860742",
                nonce_str:rand,//随机字符串
                total_fee:par.total_fee,
                notify_url:'http://60.205.146.53:18027/api/company/pay_weixin_success',
                body:"账户充值",
                trade_type:"APP",
                spbill_create_ip:par.spbill_create_ip,
                out_trade_no:out_trade_no,
                trade_status: 'ineffective',
                packageName: par.packageName
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
        case 'Alipay':
            sign = this.createSignAlipay(data);
            break;
        default:
            console.log('出错')
    }
    return sign;
}
//将支付宝发来的数据生成有序数列
exports.getVerifyParams = function (params) {
    var sPara = [];
    if (!params) return null;
    for (var key in params) {
        if ((!params[key]) || key == "trade_status" || key == "sign" || key == 'packageName') {
            continue;
        }
        ;
        if (key == 'biz_content') {
            params.biz_content = this.getVerifyContent(params.biz_content);
        }
        sPara.push([key, params[key]]);
    }
    sPara = sPara.sort();
    var prestr = '';
    for (var i2 = 0; i2 < sPara.length; i2++) {
        var obj = sPara[i2];
        if (i2 == sPara.length - 1) {
            prestr = prestr + obj[0] + '=' + obj[1] + '';
        } else {
            prestr = prestr + obj[0] + '=' + obj[1] + '&';
        }

    }
    return prestr;
}


//将支付宝发来的数据生成有序数列
exports.getVerifyParamsSign = function (params) {
    var sPara = [];
    if (!params) return null;
    for (var key in params) {
        if ((!params[key]) || key == "trade_status" || key == 'packageName') {
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
            prestr = prestr + obj[0] + '=' + encodeURIComponent(obj[1]) + '';
        } else {
            prestr = prestr + obj[0] + '=' + encodeURIComponent(obj[1]) + '&';
        }
    }
    return prestr;
}
//获取私钥
exports.getPrivateKey = function (packename) {
    var privateKey;
    console.log('packename', packename);
    switch (packename) {
        case 'com.sinosteel.vehicles':
            privateKey = '-----BEGIN RSA PRIVATE KEY-----\n' +
                'MIIEowIBAAKCAQEAxdx89sDDmlv64+gWM+TWqEqA22FBEgrwZ6FdQ87nWxF7ldcF\n' +
                'NTpzzUgSrXKMf1e8WGd6BMRXy6ZjNSCKUHmbjBKnT4nvM+OQO3b1cfO3tUMf/ofK\n' +
                'EHwg2w906TspKuIkLhA44g769K/YkJe8z7BWxIMFQfIMjRBIv0gTN9hdrdhjDtQn\n' +
                'fHSC0TKek7vH13zIdicTejE2KarmgcXSzMwlONRRMfVq/MTfeDvJdjRoE9fy2++t\n' +
                'CLFtz2NdF5qkpOEIfAHRCfEPOwaIDBkZ+Xg2cjQO9bmTZg5R9+91b4Ue5L1eN5+Z\n' +
                '+imNdFHoEGCbfUckNpH27jr5idhQctK2exs6fwIDAQABAoIBAHmy8pH7YtRwutKv\n' +
                'j+h/WqDMopFNMm7cl53GHM12V8sl57P0O1nQCCY9rG9Ow6gX2NsvWlfQRIgYYXDu\n' +
                'AOUax1fSqWI83wo1cCODOdjLJTWygd1WvCyDjNnwmeJS5zFfQw2qILK6sBUMi9Hz\n' +
                '4siEF/pq9DLppFqnp3cv59IznPstxaEf7NRCWvlyYu2VrjSElNMrtxrCo/Br07rc\n' +
                'B21Gn7vVnO8PZWOCQIY9A58HEsdWNuyPTSTB8KvPlURbMcVxk9MeiOAs+eI/m4a2\n' +
                '0UGz1M98esVvmbOECabXuXnl4cZteau557ao2OFokzphy3AFSxhZO7IL0fihzJ88\n' +
                'OM+F1SECgYEA8xMeUf5K0nUnuQlF/T6WjZh6QNbmKunXOAo+V3n+mko4/BKwv18X\n' +
                'W/8OsL6BmDKyBgazs48JuD8Xe0y5SpgFZ7RGUFCK3iUlT/4tT/Xn4YolVOCVR006\n' +
                'ADIw95kouLFzZgoZGmTO5OsAvmvyT/LTK1AmrrpwYNLaeWZ8QAg0T8kCgYEA0GHl\n' +
                'rlhugsZfFIltbCJtRvJZjLM1tqzyjtxulbjCDdgajya8Ey3A/1+85E+HT3bN6hJg\n' +
                'z5kIprRUQhicZOfwSRJNEBHNkcMRnQReBvPlVwgvLYCRugjde4eS7FSk2dvbLE9j\n' +
                '9CRew40OBKY3G6G3tx723zc8kUtSZimvidiCrAcCgYBd4aR0RqLfZiBRdyNxDBtZ\n' +
                '1Opi4J1FNcvJ+Sra3mNXdBNOSGm7gB6liX1DBlFHV00qxqvhTf2TC8sl9Bwck1qD\n' +
                'Ez2VB4abBf3DR4h4uaE1mwWQIq2FPG6KZNhEyQLRUrgfUQchCo5eG+XNpiOQfVjS\n' +
                'AcLu+VMuEkIPYWXb1U9fAQKBgEGCdU1hGaTdLijrp022aPpD2Ckmcb1zE3IcFFvX\n' +
                'UJI/nOHiAIBbAvCFrYFtCxHNPKDYlDzPVGvsBw0cZZZHYD/ok/d4UVMAqznclJ7E\n' +
                '8BVzSjmY0LdWcCKUlXjch1LCDl4Yu0iWYoBBiOWnR23VYkccYen8mHro3gemFTxV\n' +
                'p4bjAoGBALTu20fu84smGudCyTp3dgapRyI9hobs6pkr3p1PJ4razipY2yFZcfEz\n' +
                '4oYmMeYZeFmFna9zD/zmNGNKdQtXDgafpYjSZrDDiqBHItgLtp1Smf+NmfBCNomn\n' +
                '5eNpHsyzNp/W4sed47Ft3BFB5O31DNSEKLQliX+fyfb2NNfXvcBi\n' +
                '-----END RSA PRIVATE KEY-----';
            break;
        case 'com.rsc.android_driver':
            privateKey = '-----BEGIN RSA PRIVATE KEY-----\n' +
                'MIIEowIBAAKCAQEAwr+CFKiXe8LOtmhkuc4tFqtukgS9Gpj/NZ196XKmdLxjYSRg\n' +
                'kgUkoRefjr99aNtvs3BNjhIUb1oYQj2i4ItYhWlHVQO4rur8GptEB13fFzhxXsfB\n' +
                'JG9xiZYACckLFuHyBcSOyz4j9dFPvmhpfBAb7fjd+cq45gIIeKjrV7kxX5Pivh5o\n' +
                'KMltAlcn73R2Bh+i1keu+t7lhkqe3GJ1nQ5HG/SmT8HlM0sl7ZKd94C9dQwIbGA+\n' +
                'w5Kgta+g18lumP4hqjlpQmEJ0LTeey9n0aIiRljaAvc3H14tvqFfL/yW0twkYcU3\n' +
                'jKUKFQ04baRwa712LuBw794q2Ji7t/Gs/HW5twIDAQABAoIBACrrH5TD7tZ0gS/L\n' +
                '497a5C7pyu1dI/u3mg7LzZLkFHEHj3M6HBoyDfd+iEhiRRYVvhEyf7T+oQhFN7Fp\n' +
                'efq4WuLT58eBkXLjEHogm6Zv9plcdAeqSBNqiAAFUa7WYp5BXyAMSFfcMvqajVNu\n' +
                'GUkhF7ajMPA6z/LIoetNdsgXZR0lzNCqItXXjmqw3JHFb0CdNgchJG+npihYT9AX\n' +
                'RtwWI8vhcm5AZtmfQE8qVQOcILdQtDJehQbhqHPPO7dlbKIPKw0n6b062X5JX9Eu\n' +
                'BupEHtCLP4RcTFcLIDg40xme2amkCwbf6x99FCrsGhiVQ6YPc7XoYE+5TnvXfwXe\n' +
                'BxL3+FkCgYEA5ShgIhjNrxVGJVFHkTF5IBXNHk3/2mJi4y9DcnTHHndX8eeV/FBT\n' +
                'mvUlSw4Jy1krfFZLKaiWe4ENH34RIRxYcfAQ00U0mzJJrRH4a9Ov20vaRHi0VE9G\n' +
                'RKCctif2EMR62gsLurU2LGLCmzMvGf69Wy1ppPEQkPIqwt0EQvIrzJUCgYEA2Y9P\n' +
                'XEWls221Xj5/HniUUE0Ip70orQV7JdvTFHfTvJMBzT6ps3+5RtQmkCcAtxhTIRkH\n' +
                'msLqbqq0oOO5HhUDd3Z3zNO9er1+I5fwtCFXoGN6RqLQPzljcwKrAJWPLV67ZEWM\n' +
                '1rwZB9ibmUN5UlNZzBslVF5Yym2ZgbhT3WlLDhsCgYBO0v+WWu/NTMUPKxEyCVF/\n' +
                'zt/6j5v1c6hOO0C5CyA/A5A1vpJh8wN/JtoIIjEOSILjxw8dqkbw/qgT8BpWSFjI\n' +
                'AGrZMVHyHG8pYCgSdwNjrIjMyrRE1+v0yUZ+hepnRB56CBilxZV32RTVq9qE15Is\n' +
                '3cccHGu1YAeDdeD0YjbcrQKBgF03Ohme/dBTQVKQFIdJwsJlP0AfnD4GCy29ckNi\n' +
                '1CYIFs2J+8wc/ZWLcLpy+6t3kKatwsRcn3WrTplg+QAaoNGewNXSI21jo5g8kbWc\n' +
                'U581AD8jo3ZzcFjm2730VtRpsoDUC/Q1w8PI22Jftqu/aso5F1V+1yxkqVEbWVOU\n' +
                'ucPhAoGBALa9t6KLNN4ndjx3rc1tgTBhSh6JRmFXoXohjg9tBdmX73fZqEIgs5g7\n' +
                'KKYx6ormAGY6wgC5gfThC4gMPYzJuPSkOs1n+7POv2wS0/pZPbjcyUiA2VptfANF\n' +
                'BYilKi2qVuIg4bx1CVic+zdRoWM8z46iKlY8kSuesZORUKVSkjrn\n' +
                '-----END RSA PRIVATE KEY-----';
            break;
        case 'com.rsc.drivercenter':
            privateKey = '-----BEGIN RSA PRIVATE KEY-----\n' +
                'MIIEowIBAAKCAQEAwr+CFKiXe8LOtmhkuc4tFqtukgS9Gpj/NZ196XKmdLxjYSRg\n' +
                'kgUkoRefjr99aNtvs3BNjhIUb1oYQj2i4ItYhWlHVQO4rur8GptEB13fFzhxXsfB\n' +
                'JG9xiZYACckLFuHyBcSOyz4j9dFPvmhpfBAb7fjd+cq45gIIeKjrV7kxX5Pivh5o\n' +
                'KMltAlcn73R2Bh+i1keu+t7lhkqe3GJ1nQ5HG/SmT8HlM0sl7ZKd94C9dQwIbGA+\n' +
                'w5Kgta+g18lumP4hqjlpQmEJ0LTeey9n0aIiRljaAvc3H14tvqFfL/yW0twkYcU3\n' +
                'jKUKFQ04baRwa712LuBw794q2Ji7t/Gs/HW5twIDAQABAoIBACrrH5TD7tZ0gS/L\n' +
                '497a5C7pyu1dI/u3mg7LzZLkFHEHj3M6HBoyDfd+iEhiRRYVvhEyf7T+oQhFN7Fp\n' +
                'efq4WuLT58eBkXLjEHogm6Zv9plcdAeqSBNqiAAFUa7WYp5BXyAMSFfcMvqajVNu\n' +
                'GUkhF7ajMPA6z/LIoetNdsgXZR0lzNCqItXXjmqw3JHFb0CdNgchJG+npihYT9AX\n' +
                'RtwWI8vhcm5AZtmfQE8qVQOcILdQtDJehQbhqHPPO7dlbKIPKw0n6b062X5JX9Eu\n' +
                'BupEHtCLP4RcTFcLIDg40xme2amkCwbf6x99FCrsGhiVQ6YPc7XoYE+5TnvXfwXe\n' +
                'BxL3+FkCgYEA5ShgIhjNrxVGJVFHkTF5IBXNHk3/2mJi4y9DcnTHHndX8eeV/FBT\n' +
                'mvUlSw4Jy1krfFZLKaiWe4ENH34RIRxYcfAQ00U0mzJJrRH4a9Ov20vaRHi0VE9G\n' +
                'RKCctif2EMR62gsLurU2LGLCmzMvGf69Wy1ppPEQkPIqwt0EQvIrzJUCgYEA2Y9P\n' +
                'XEWls221Xj5/HniUUE0Ip70orQV7JdvTFHfTvJMBzT6ps3+5RtQmkCcAtxhTIRkH\n' +
                'msLqbqq0oOO5HhUDd3Z3zNO9er1+I5fwtCFXoGN6RqLQPzljcwKrAJWPLV67ZEWM\n' +
                '1rwZB9ibmUN5UlNZzBslVF5Yym2ZgbhT3WlLDhsCgYBO0v+WWu/NTMUPKxEyCVF/\n' +
                'zt/6j5v1c6hOO0C5CyA/A5A1vpJh8wN/JtoIIjEOSILjxw8dqkbw/qgT8BpWSFjI\n' +
                'AGrZMVHyHG8pYCgSdwNjrIjMyrRE1+v0yUZ+hepnRB56CBilxZV32RTVq9qE15Is\n' +
                '3cccHGu1YAeDdeD0YjbcrQKBgF03Ohme/dBTQVKQFIdJwsJlP0AfnD4GCy29ckNi\n' +
                '1CYIFs2J+8wc/ZWLcLpy+6t3kKatwsRcn3WrTplg+QAaoNGewNXSI21jo5g8kbWc\n' +
                'U581AD8jo3ZzcFjm2730VtRpsoDUC/Q1w8PI22Jftqu/aso5F1V+1yxkqVEbWVOU\n' +
                'ucPhAoGBALa9t6KLNN4ndjx3rc1tgTBhSh6JRmFXoXohjg9tBdmX73fZqEIgs5g7\n' +
                'KKYx6ormAGY6wgC5gfThC4gMPYzJuPSkOs1n+7POv2wS0/pZPbjcyUiA2VptfANF\n' +
                'BYilKi2qVuIg4bx1CVic+zdRoWM8z46iKlY8kSuesZORUKVSkjrn\n' +
                '-----END RSA PRIVATE KEY-----';
            break;
        default:
            console.log('出错')
    }
    return privateKey;
}
//获取公钥
exports.getPublicKey = function (packename) {
    var publicKey;
    switch (packename) {
        case 'com.sinosteel.vehicles':
            publicKey = '-----BEGIN PUBLIC KEY-----\n' +
                'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAsqGETB0TWw03nEnAayjU\n' +
                'GpYsB+4qnmGPrY8zH84N1FujMdWpK3OnzyjulO5D1zhNOiTj/3KLHlXXakrHlcBz\n' +
                'Ltv9h+OTONYR08Ecbn0MCsAuXfbRtdRcN265DRNdQV/BIsL8CpwvxRwEkTzcmVWK\n' +
                'lIb++n+yFjgqxJYM1SDBLni0km2yBriBk1PRVQ3nKw5T9WiMcYePyjti/mIOS6mx\n' +
                'USKsBcrUMScQS8HxCBqj0CDxpMVW7lfd92b0v/LfW7BPnN9KO9+3TjqE9GV7jYBA\n' +
                'UT+wfzByQIY9k/qNLIl/22dPNd0l2oLZ2FboAguOtXA6WQjV4xZUoJHglcGRS9kT\n' +
                'xwIDAQAB\n' +
                '-----END PUBLIC KEY-----';
            break;
        case 'com.rsc.android_driver':
            publicKey = '-----BEGIN PUBLIC KEY-----\n' +
                'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAsqGETB0TWw03nEnAayjU\n' +
                'GpYsB+4qnmGPrY8zH84N1FujMdWpK3OnzyjulO5D1zhNOiTj/3KLHlXXakrHlcBz\n' +
                'Ltv9h+OTONYR08Ecbn0MCsAuXfbRtdRcN265DRNdQV/BIsL8CpwvxRwEkTzcmVWK\n' +
                'lIb++n+yFjgqxJYM1SDBLni0km2yBriBk1PRVQ3nKw5T9WiMcYePyjti/mIOS6mx\n' +
                'USKsBcrUMScQS8HxCBqj0CDxpMVW7lfd92b0v/LfW7BPnN9KO9+3TjqE9GV7jYBA\n' +
                'UT+wfzByQIY9k/qNLIl/22dPNd0l2oLZ2FboAguOtXA6WQjV4xZUoJHglcGRS9kT\n' +
                'xwIDAQAB\n' +
                '-----END PUBLIC KEY-----';
            break;
        case 'com.rsc.drivercenter':
            publicKey = '-----BEGIN PUBLIC KEY-----\n' +
                'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAsqGETB0TWw03nEnAayjU\n' +
                'GpYsB+4qnmGPrY8zH84N1FujMdWpK3OnzyjulO5D1zhNOiTj/3KLHlXXakrHlcBz\n' +
                'Ltv9h+OTONYR08Ecbn0MCsAuXfbRtdRcN265DRNdQV/BIsL8CpwvxRwEkTzcmVWK\n' +
                'lIb++n+yFjgqxJYM1SDBLni0km2yBriBk1PRVQ3nKw5T9WiMcYePyjti/mIOS6mx\n' +
                'USKsBcrUMScQS8HxCBqj0CDxpMVW7lfd92b0v/LfW7BPnN9KO9+3TjqE9GV7jYBA\n' +
                'UT+wfzByQIY9k/qNLIl/22dPNd0l2oLZ2FboAguOtXA6WQjV4xZUoJHglcGRS9kT\n' +
                'xwIDAQAB\n' +
                '-----END PUBLIC KEY-----';
            break;
        default:
            console.log('出错')
    }
    return publicKey;
}
//支付宝签名
exports.getSign = function (params, packageName) {
    try {
        //读取秘钥 新秘钥
        var key = this.getPrivateKey(packageName);
        var sign = crypto.createSign('RSA-SHA256');
        sign.update(params, 'utf8');
        sign = sign.sign(key, 'base64');
        return sign;
    } catch (err) {
        console.log('err', err)
    }
}
//支付宝签名
exports.createSignAlipay = function (params) {
    var packageName = params.packageName;
    //将参数排序，并将参数biz_content转为JSON字符串
    var myParam = this.getVerifyParams(params);
    //获取签名串
    var mySign = this.getSign(myParam, packageName);
    //将参数除sign以外的值进行排序，并encodeURIComponent
    var result = this.getVerifyParamsSign(params);
    //拼接
    result = result + '&sign=' + encodeURIComponent(mySign);
    console.log('加签之前验证-----------------', params);
    console.log('加签之后验证-----------------', result);

    return result;
}
//支付宝验签名
exports.checkSignAlipay = function (params, packageName) {
    var arr = [];
    var alipayPubkey = this.getPublicKey(packageName);
    for (var key in params) {
        if (key != 'sign_type' && key != 'sign')
            arr.push(key);
    }
    arr.sort();
    var str = '';
    _.each(arr, function (substr) {
        str += substr + '=' + params[substr] + '&';
    });
    str = str.slice(0, str.length - 1);
    var verify = crypto.createVerify('SHA256');
    verify.update(str, 'utf-8');
    var result = verify.verify(alipayPubkey, params.sign, 'base64');

    return result;
};

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


//------微信支付-----------

//一次签名sign
exports.paysignApp = function (parmas,type) {
    var ret;
    if(type === 'callback'){
        ret = parmas;
    }else {
        ret = {
            appid: parmas.appid,
            body: parmas.body,
            mch_id: parmas.mch_id,
            nonce_str: parmas.nonce_str,
            notify_url: parmas.notify_url,
            out_trade_no: parmas.out_trade_no,
            spbill_create_ip: parmas.spbill_create_ip,
            total_fee: parmas.total_fee,
            trade_type: parmas.trade_type//这些参数左边的参数名是参加签名的参数名，跟文档保持一致
        };
    }

    var string = raw(ret);

    var key = "qwe5asd89zxc73q8dSAs12d1DGSsawe1";//日计算车主API密钥
    // var key = "qwe5asd89zxc73q8dSAs12d1DGSsaRsc";//司机中心API密钥
    string = string + '&key=' + key;

    console.log("第一次签名验证的参数", string);

    return crypto.createHash('md5').update(string, 'utf8').digest('hex').toUpperCase();
};
//得到prepay再次签名
exports.paySignTwo = function (appid, notifystr, packagevalue, mchid, prepayid, timestamp, packageName) {    //参数名不可改，必须严格一模一样
    var ret = {
        appid: appid,
        noncestr: notifystr,
        package: packagevalue,
        partnerid: mchid,
        prepayid: prepayid,
        timestamp: timestamp
    };
    var string = raw(ret);
    var key = "qwe5asd89zxc73q8dSAs12d1DGSsawe1";//日计算车主API密钥
    // var key = "qwe5asd89zxc73q8dSAs12d1DGSsaRsc";//司机中心API密钥
    string = string + '&key=' + key;  //key为在微信商户平台(pay.weixin.qq.com)-->账户设置-->API安全-->密钥设置
    var crypto = require('crypto');
    console.log("签名");
    return crypto.createHash('md5').update(string, 'utf8').digest('hex').toUpperCase();
};

//转化xml数据
function raw(args) {
    var keys = Object.keys(args);
    keys = keys.sort()
    var newArgs = {};
    keys.forEach(function (key) {
        if(key!=='sign'){
            newArgs[key.toLowerCase()] = args[key];
        }
    });
    var string = '';
    for (var k in newArgs) {
        string += '&' + k + '=' + newArgs[k];
    }
    string = string.substr(1);
    return string;
};

//解析xmL数据
exports.getXMLNodeValue = function(xml) {
    var obj;
    parseString(xml, { explicitArray : false, ignoreAttrs : true }, function (err, result) {
        obj = result.xml;
    });
    return obj;
};

exports.getRawBody = function (req, callback) {
    if (req.rawBody) return callback(null, req.rawBody);
    var  data = '';
    req.setEncoding('utf8');
    req.on('data', function (chunk) {
        data += chunk;
    });
    req.on('end', function () {
        req.rawBody = data;
        callback(null, data);
    });
};

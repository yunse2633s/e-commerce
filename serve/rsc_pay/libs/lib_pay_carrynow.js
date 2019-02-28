/**
 * Created by Administrator on 2017/2/27.
 */
var http = require('http');
var https = require('https');
var async = require('async');
var _ = require('underscore');
var request = require('request');
var fs = require('fs');

var config_api_url = global.config_api_url;
var config_error = global.config_error;
var crypto = require('crypto');

var PayCarryNowDB = require('../dbs/db_base')('PayCarryNow');

//依据条件查询单个表详情
exports.getOne = function (data, callback) {
    PayCarryNowDB.getOne(data, callback);
};
//依据条件添加单个表详情
exports.add = function (data, callback) {
    PayCarryNowDB.add(data, callback);
};
exports.del = function (data, callback) {
    PayCarryNowDB.del(data, callback)
};
//依据条件修改单个表详情
exports.update = function (data, callback) {
    PayCarryNowDB.update(data, callback);
};
exports.getList = function (data, callback) {
    PayCarryNowDB.getList(data, callback);
};
exports.getCount = function (data, callback) {
    PayCarryNowDB.getCount(data, callback);
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
    var out_biz_no = this.dateByOrder(data);
    var timestamp = this.dateInit(data);
    switch (platform) {
        case 'Alipay':
            parmas = {
                app_id: '2018012502069877',
                method: 'alipay.fund.trans.toaccount.transfer',
                charset: 'utf-8',
                sign_type: 'RSA2',
                timestamp: timestamp,
                version: '1.0',
                format: 'JSON',
                biz_content: {
                    payer_show_name: '北京日升昌记科技有限公司',//付款方姓名
                    payee_real_name: par.payee_real_name,//收款方姓名
                    out_biz_no: out_biz_no,
                    payee_type: 'ALIPAY_LOGONID',
                    payee_account: par.payee_account,
                    amount: par.amount,
                },
                trade_status: 'ineffective',
                packageName: par.packageName
            };
            if (par.remark) {
                parmas.remark = par.remark;//转账备注
            } else {
                parmas.remark = '商品';//转账备注
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
        case 'com.rsc.business':
            privateKey = '-----BEGIN RSA PRIVATE KEY-----\n' +
                'MIIEowIBAAKCAQEA37PDTrs/doaeYypq+Z/jGml3m8EcTsj4Qb3aW/sv7L4DtJya\n' +
                '7Ih5yaO4f4mAbb0feuMEil/osq0bmcmbYD2GZ8tghPPj2IISbaNaxDP+Y7p63tcc\n' +
                'ximWfvbNxgWBA89w5a2zFx/2ERT6tilMV9KcqpaXv+fDof6ki+HykET0ZaaFuJcV\n' +
                'SMoWyhfc6uFLjTz8OiEKxOsjqinxdPhpPRek0reUowptG8upMgNSFC/OcJVOlodf\n' +
                'KQ3FD8zCrRqTGGut8qpGbDdg5MCpmD7HxA0JT7AX0BYH898oZQwtRcTaV5ITELq9\n' +
                'h9TPQJt4C0t5n1srAAxx5325UalkPaNJXAW4UQIDAQABAoIBAGkioksRY+0/rZbr\n' +
                'q6UwSNrz8HvqUXSRrWOwZ7zNHCQG1dT/uSwrpBlpcd+27v4kYXQu18Z09vdqtksb\n' +
                '3oNnxxBnHDDAMzhhQWn32UPXL9sNHIw4y1Qy3YFEW0eS9KSmzOeVMFNQ+SPkGUSd\n' +
                'ujyYRntCFYXi1iX/eLQpeAfn8HkI3h6OBp93xzX+SQvfBjTFcwYTfdWXo6BCoLRR\n' +
                'dgrFbd4aqPloN+GM2QV4DhF58ZAq8KWAkLcPT22afd8Fxq94MdoUqSae2/7UPF4Y\n' +
                'Bb7s0wQd5H9V3MTbs6Te6ELOUEkyhonv+JLdEsQ19DC7zdB0iMUjWWjqNtwH5E/t\n' +
                'J6/oOeUCgYEA+2480EZ67Um0TmQU5+z1Bx/ga22sdoZ5Avoio+vNymxpArsUF95Y\n' +
                'hXhYpee7VpJbwXnbDDJXtxtmndtrkzy8106R3K0cLcC+WwV31HeebBBDcHLIQdDs\n' +
                'MWmsCTN6m5oQFllAYPA8yF8t3JJgGB8QOcyZcl0phlIrHz38u16OGJ8CgYEA48SF\n' +
                'XOAUWEnUIFL8A1CpGl3YTFnAPcAo6D0Hq2aNsaTyGLEa82AAqWDojg6VZ/Nl60sX\n' +
                'NQVSia//JzEeRE8Wh25O03UEp3Hm1ge1DqbhaXwXGWdOyX8ky7295qLFXIHsvcD9\n' +
                'hRp36ASWeKIrSGYEd8HbJwAyPZnyRwczqSr9WQ8CgYEA07Uz8a+W7FyGPQeabtsg\n' +
                'Srp1jh+P+1Epbe9O4bW41zxHg6wgtCRdZy05f6DLJo8gQZ4oanGtWBnzYvIR961J\n' +
                '2QVoXmdI9eF4p03IY5fBRn6/Olz78CdJ6iVvXWQCVij4aMkII1fF5nX2OObrkQP+\n' +
                '9pwnjJuTTm27r5fTSbXJckMCgYBm2eVHDUDipWQOvKpkbNYPu/TidVzkBZPzWyvN\n' +
                'cF/nqg5QrBj5cY6a7dHV5Cv/Zt/NInl2TdL5renQLtP2EKihu2QJBLx3SG3ulEhk\n' +
                'N2NumMRtikL/plRdVG8eaL4qidj3zuAsbMlckkXIb6KP7NFzqqxlricBvjSzckMX\n' +
                'zvvcbQKBgCMtX18nyLYs/ShUeHzBJcizp6Etb+ymbJYEiM85OcDZ6TKyCT5LuNB1\n' +
                'lFImuzOPoctt9uFuBYMrKQBIrHGWX7O82R+ApAg558sLXSl47iiR8W4vYRAK+8MN\n' +
                '4OhUEs+gRsCxJoVn2rxEJbos9j0fjyKUgxuP/Cix7NLpJ8mIuaq0\n'+
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
        case 'com.rsc.business':
            privateKey = '-----BEGIN PUBLIC KEY-----\n' +
                'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAsqGETB0TWw03nEnAayjU\n' +
                'GpYsB+4qnmGPrY8zH84N1FujMdWpK3OnzyjulO5D1zhNOiTj/3KLHlXXakrHlcBz\n' +
                'Ltv9h+OTONYR08Ecbn0MCsAuXfbRtdRcN265DRNdQV/BIsL8CpwvxRwEkTzcmVWK\n' +
                'lIb++n+yFjgqxJYM1SDBLni0km2yBriBk1PRVQ3nKw5T9WiMcYePyjti/mIOS6mx\n' +
                'USKsBcrUMScQS8HxCBqj0CDxpMVW7lfd92b0v/LfW7BPnN9KO9+3TjqE9GV7jYBA\n' +
                'UT+wfzByQIY9k/qNLIl/22dPNd0l2oLZ2FboAguOtXA6WQjV4xZUoJHglcGRS9kT\n' +
                'xwIDAQAB\n'+
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
//请求转账
exports.getCarryNow = function (params,callback) {
    // var options = 'https://openapi.alipay.com/gateway.do?' + params;
    // https.get(options, function (res) {
    //     res.setEncoding('utf8');
    //     res.on('data', function (data) {
    //         //支付宝响应参数
    //         // {
    //         //     "alipay_fund_trans_toaccount_transfer_response":
    //         //     {"code":"40004",
    //         //         "msg":"Business Failed",
    //         //         "sub_code":"EXCEED_LIMIT_SM_MIN_AMOUNT",
    //         //         "sub_msg":"单笔最低转账金额0.1元",
    //         //         "out_biz_no":"20180226103940859"
    //         //     },
    //         //     "sign":"IzyuXVoSny1oR/ISw6Z2yhO9z5NmtdPpsdnVlu4gSKofG+DS1dRuTm7K0Kji2BghggshIb+RwtCzutDcbqX6Q/qcI6cZmsBN1oT5ocIYEzFb1kpHfE8f2OIOGFwBBZke8PPBRTKUQpNBnMnvB8z6JGv2acHFAv3Lrydt7WRCWUEfP6HEDi3MWtm7DbBaZjXvnaRdNKVjh8qnZY3aumIGSLESeVbMEQ4FrYu/oeE6pIfV8f8HIkSsQtnLEunFDJbBBUUoMzhLFlA6UpaMV4g0IGeKcXb81A8RdYSwT38Yrxzy/vhuKU7NmnhKNybZBM/hXzlLcSKg7L8FmBXg2gOUfQ=="
    //         // }
    //         callback(data);
    //
    //     });
    // }).on('error', function (err) {
    //
    //     return JSON.stringify(err);
    //
    // });
};

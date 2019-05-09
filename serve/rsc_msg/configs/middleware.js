/**
 * Created by Administrator on 2015/12/11 0011.
 */
var jwt = require('jsonwebtoken');
var config_common = require('./config_common');
var tpl = require('./templates');
var p_n = require('./package_name');

module.exports =
    {
        //verifyToken:function(req,res,next)
        //{
        //    var token = req.headers['x-access-token'];
        //    if(token)
        //    {
        //        jwt.verify(token, config_common.secret_keys.user, function(err, decoded)
        //        {
        //            if(err)
        //            {
        //                return res.send({status:'auth_failed'});
        //            }
        //            req.decoded = decoded;
        //            next();
        //        });
        //    } else
        //    {
        //        res.send({status:'no_token'});
        //    }
        //},

        checkIDString: function (input) {
            var reg = /^[a-z0-9]{24}$/;
            return reg.test(input);
        },

        checkPhoneString: function (input) {
            var reg = /^1[0-9]{10}$/;
            // var reg = /^1[34578][0-9]{9}$/;
            return reg.test(input);
        },

        checkDateString: function (input) {
            var reg = /^20[1-9][0-9]\/((0[1-9])|(1[0-2]))\/((0[1-9])|([1-2][0-9])|(3[0-1]))$/;
            return reg.test(input);
        },

        // 用信息索引和内容数组形成真正的短信信息
        // 将短信实际内容拆成数组后 短信数组比内容数组元素个数大1
        encodeActualMSG: function (template_id, content) {
            if (tpl.msg_templates[template_id] === undefined) return 'invalid msg template';
            var result = '';
            var msg_array = tpl.msg_templates[template_id].content.split('#');
            // 如果没有特殊内容
            if (msg_array.length == 1) {
                result = msg_array[0];
            }
            else {
                for (var i = 0; i < msg_array.length - 1; i++) {
                    result += msg_array[i];
                    if (config_common.user_roles_ch[content[i]]) {
                        content[i] = config_common.user_roles_ch[content[i]]
                    }
                    result += content[i];
                }
                // 加上内容字符数组的最后一项
                result += msg_array.pop();
            }
            return result;
        },

        encodeActualSMS: function (template_id, content, req) {
            //如果穿过来的短信有包名走这个，否则走老的逻辑
            if (req.headers && req.headers['package-name'] && p_n.title[req.headers['package-name']]) {
                if (tpl.sms_templates_new[template_id] === undefined) return 'invalid sms template';
                var result = '';
                var msg_array = tpl.sms_templates_new[template_id].content.split('#');
                // 如果没有特殊内容
                if (msg_array.length == 1) {
                    result = msg_array[0];
                } else {
                    for (var i = 0; i < msg_array.length - 1; i++) {
                        result += msg_array[i];
                        result += content[i];
                    }
                    result += msg_array.pop();
                    //（1）替换标题：根据包名的不同来确定使用不同的 标识->根据包名获得不同的字段
                    result = result.replace(/&/g, p_n.title[req.headers['package-name']]);
                    //(2)替换下载地址：根据包名+不同属性替换地址
                    result = result.replace('^', p_n.link[req.headers['package-name'] + '_' + tpl.sms_templates_new[template_id].link]);
                }


                return result;
            } else {
                if (tpl.sms_templates[template_id] === undefined) return 'invalid sms template';

                if (content[0].substr(-2, 2) == "^^") {
                    function delfh(str) {
                        if (str.substr(-2, 2) == "^^") {
                            str2 = str.substring(0, str.length - 2);
                        }
                        return str2;
                    }
                    content[0] = delfh(content[0]);
                    template_id = 'custom_driver';
                }
                var result = '';
                var msg_array = tpl.sms_templates[template_id].content.split('#');
                // 如果没有特殊内容
                if (msg_array.length == 1) {
                    result = msg_array[0];
                } else {
                    for (var i = 0; i < msg_array.length - 1; i++) {
                        result += msg_array[i];
                        result += content[i];
                    }
                    result += msg_array.pop();
                }
                return result;
            }
        },

        sendData: function (res, status, result) {
            var res_obj = {status: status};
            if (status === 'err') {
                if (config_common.status === 'dev') {
                    res_obj.data = result;
                }
            }
            else {
                res_obj.data = result;
            }
            res.setHeader('x-powered-by', 'Chris Brosnan');
            //console.log('===============send================');
            //console.log(res_obj);
            res.send(res_obj);

            var str_log = '-------------------SEND-----------------------\n';
            str_log += JSON.stringify(res_obj);
            str_log += '\n------------------' + new Date().toLocaleString() + '-------------------\n\n';
            console.log(str_log);
        }
    };
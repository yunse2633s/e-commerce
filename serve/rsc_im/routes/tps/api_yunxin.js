/**
 * Created by Administrator on 2018\2\2 0002.
 *  tps:third-party service
 */
var async = require('async');
var _ = require('underscore');
var express = require('express');
var config_common = require('../../configs/config_common');

module.exports = function () {

    var api = express.Router();

    /**
     * 保存聊天文件
     * 云信调用此接口
     * 参数：
     * fromAccount 发送者的id
     * to 接受者的id
     * attach 存在则表示是一种文件
     * msgType 文件的类型
     * attach.ext文件的后缀名
     * attach.size文件的大小
     * attach.name文件的名字
     * attach.url文件的下载地址
     */
    api.post('/add', function (req, res, next) {
        if(req.body.convType=='TEAM'){
            return next();
        }else {
            var obj={
                user_id: req.body.fromAccount.toString(),
                other_user_id: req.body.to.toString(),
                user_last:JSON.stringify(req.body),
                time_last:new Date()
            };
        }
        async.waterfall([
            function (cb) {
                global.lib_session.getOne({
                    find:{
                        user_id:obj.user_id,
                        other_user_id:obj.other_user_id
                    }
                },cb)
            },
            function (data, cb) {
                if(!data){
                    global.lib_session.add(obj,cb);
                }else{
                    data.user_last=JSON.stringify(req.body);
                    data.time_last=new Date();
                    global.lib_session.edit(data,cb);
                }
            }
        ], function (err, url) {
            if (err) {
                return callback(err);
            }

            if (req.body.attach) {
                req.body.attach = JSON.parse(req.body.attach)
                if (req.body.attach.url) {
                    //将对象attach解析出来
                    async.waterfall([
                        function (cb) {
                            //将attach中存到云信服务器的文件下载下来在存到自己的阿里云上
                            var html = req.body.attach.url;
                            //这里把url里的\斜杠去除掉就可以得到正确的文件加载地址了
                            html = html.replace('"', '').replace(/[\\]/g, '')
                            global.lib_file.saveFileByUrlForIm(html, req.body.attach.name, req.body.attach.ext, cb);
                        },
                        function (url, cb) {
                            var obj = {
                                user_id: req.body.fromAccount.toString(),
                                other_user_id: req.body.to.toString(),
                                msgType: req.body.msgType,
                                file_url: url,
                                ext: req.body.attach.ext,
                                size: req.body.attach.size,
                                name: req.body.attach.name
                            }
                            global.lib_im_file.add(obj, cb);
                        }
                    ], function (err) {
                        if (err) {
                            return next(err);
                        }
                        config_common.sendData(req, {}, next);
                    })
                } else {
                    config_common.sendData(req, {}, next);
                }
            } else {
                config_common.sendData(req, {}, next);
            }
        });
        });
    return api;

};
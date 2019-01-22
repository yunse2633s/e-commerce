/**
 * Created by Administrator on 17/6/23.
 */
var async = require('async');
var fs = require('fs');
var formidable = require('formidable');
var crypto = require('crypto');
var _ = require('underscore');

var config_error = global.config_error;
var config_common = global.config_common;

var http = global.http;
var mw = global.middleware;

module.exports = function (app, express) {

    var api = express.Router();

    // 拦截非授权请求
    api.use(require('../../middlewares/mid_verify_user')());

    /**
     * 上传图片
     * file  文件
     */
    api.post('/img_upload', function (req, res, next) {
        var url = '';
        var files;
        async.waterfall([
            function (cb) {
                config_error.checkRole(req.decoded.role, [config_common.user_roles.TRADE_ADMIN, config_common.user_roles.TRADE_PURCHASE, config_common.user_roles.TRADE_SALE], cb);
            },
            function (cb) {
                var form = formidable.IncomingForm();
                form.uploadDir = __dirname.replace('/routes/client', config_common.file_path);
                form.parse(req, cb);
            },
            function (fields, fileDate, cb) {
                files = fileDate;
                if (files['file'] === undefined) return next(config_error.not_file);
                var file_name = _.now();
                var file = files['file'];
                if (!config_common.file_format[file.name.split('.').pop()] || file.size > config_common.file_size) {
                    fs.unlink(file.path, function (err) {
                        if (err) {
                            return next(err);
                        }
                        else {
                            return next(config_error.file_little_bigger);
                        }
                    });
                }
                file_name += '_' + mw.getRandomString(2) + '.' + 'jpg';
                if (process.env.node_env && process.env.node_env !== 'dev') {
                    url = 'http://' + config_common.OSS.bucket_img_url + '/' + file_name;
                } else {
                    url = 'http://' + config_common.OSS_DEV.bucket_img_url + '/' + file_name;
                }
                http.uploadImg({
                    file_name: file_name,
                    file: file,
                    url: url
                }, cb);
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, result, next);
        });
    });

    /**
     * 上传视频
     * file  文件
     */
    api.post('/video_upload', function (req, res, next) {
        var url = '';
        var files;
        async.waterfall([
            function (cb) {
                config_error.checkRole(req.decoded.role, [config_common.user_roles.TRADE_ADMIN, config_common.user_roles.TRADE_PURCHASE, config_common.user_roles.TRADE_SALE], cb);
            },
            function (cb) {
                var form = formidable.IncomingForm();
                form.uploadDir = __dirname.replace('/routes/client', config_common.file_path);
                form.parse(req, cb);
            },
            function (fields, fileDate, cb) {
                files = fileDate;
                if (files['file'] === undefined) return next(config_error.not_file);
                var file_name = _.now();
                var file = files['file'];
                if (!config_common.video_format[file.name.split('.').pop()] || file.size > config_common.video_size) {
                    fs.unlink(file.path, function (err) {
                        if (err) {
                            return next(err);
                        }
                        else {
                            return next(config_error.file_little_bigger);
                        }
                    });
                }
                file_name += '_' + mw.getRandomString(2) + '.' + 'mp4';
                if (process.env.node_env && process.env.node_env !== 'dev') {
                    url = 'http://' + config_common.VIDEO_OSS.bucket_video_url + '/' + file_name;
                } else {
                    url = 'http://' + config_common.OSS_DEV.bucket_img_url + '/' + file_name;
                }

                http.uploadVideo({
                    file_name: file_name,
                    file: file,
                    url: url
                }, cb);
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, result, next);
        });
    });

    api.post('/delete_img', function (req, res, next) {
        if (!req.body.url) {
            return next('invalid_format');
        }
        async.waterfall([
            function (cb) {
                if (process.env.node_env && process.env.node_env !== 'dev') {
                    http.deleteImgFromAliyun(req.body.url);
                } else {
                    http.deleteImgFromLocal(req.body.url);
                }
                cb()
            },
            function (cb) {
                if (req.body.product_name_id) {
                    global.lib_ProductName.getOne({find: {_id: req.body.product_name_id}});
                } else if (req.body.offer_id) {
                    global.lib_ProductName.getOne({find: {_id: req.body.offer_id}});
                } else {
                    cb(null, null);
                }
            },
            function (data, cb) {
                if (data) {
                    if (req.body.product_name_id) {
                        data.image = _.difference(data.image, [req.body.url])
                        data.save();
                        cb();
                    } else if (req.body.offer_id) {
                        data.background_urls = _.difference(data.background_urls, [req.body.url])
                        data.save();
                        cb();
                    }
                } else {
                    cb();
                }
            }
        ], function (err) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, {}, next);
        })
    })

    return api;

};
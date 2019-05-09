/**
 * Created by Administrator on 2017/5/24.
 */
var fs = require('fs');
var async = require('async');
var download = require('download');
var formidable = require('formidable');
var config_common = require('../configs/config_common');
var config_server = require('../configs/config_server');

var sdk_oss = require('../sdks/oss_aliyun/sdk_oss_aliyun');

//用于文件转换
//var unoconv = require('unoconv');
//var converter = require('office-convert').createConverter();

//通过url保存文件
exports.saveFileByUrl = function (url, callback) {
    var path = __dirname.replace('/libs', config_common.file_path);
    var urlArr = url.split('/');
    var filename = urlArr[urlArr.length - 1];
    async.waterfall([
        function (cb) {
            download(url, path).then(function (data) {
                cb(null, data);
            });
        },
        function (data, cb) {

            console.log('url', url);

            console.log('urlArr', urlArr);
            console.log('filename', filename);
            console.log('path', path);

            sdk_oss.upload(path, filename, cb);
        }
    ], callback);
};

/**
 * 通过云信url下载文件然后保存到自己的阿里云上
 * @param url 文件地址
 * @param name 文件名
 * @param ext 文件类型
 * @param callback
 */
exports.saveFileByUrlForIm = function (url, name, ext, callback) {
    if(!name){return;}
    name = name.replace(/\.\w+$/, '')
    var path = __dirname.replace('/libs', config_common.file_path);
    var urlArr = url.split('/');
    var filename = name + "." + ext;
    async.waterfall([
        function (cb) {
            download(url).then(function (data) {
                fs.writeFileSync(path + filename, data);
                cb(null, data);
            });
        },
        function (data, cb) {
            sdk_oss.upload(path, filename, cb);
        }
    ], callback);
};

/**
 * 通过url得到相应的文件，并将其转化为html格式存入aly,返回
 * @param url
 * @param callback
 */
exports.saveFileByUrlForChange = function (url, callback) {
    var path = __dirname.replace('/libs', config_common.file_path);
    var urlArr = url.split('/');
    var filename = urlArr[urlArr.length - 1];
    var filename2 = filename.replace(/\.\w+$/, '') + '.html';
    async.waterfall([
        function (cb) {
            download(url, path).then(function (data) {
                cb(null, data);
            });
        },
        function (data, cb) {
            converter.generate(path + filename, 'html', path + filename2).then(function (data) {
                cb(null, data);
            })
        },
        function (data, cb) {
            fs.unlinkSync(path + filename);
            sdk_oss.upload(path, filename2, cb);
        }
    ], callback);
};

//通过附件保存文件
exports.saveFileByAttachment = function (req, callback) {
    var path = __dirname.replace('/libs', config_common.file_path);
    var filename;
    async.waterfall([
        function (cb) {
            parseFile(req, cb);
        },
        function (data, cb) {
            req.body = data;
            filename = data.type + '_' + Date.now() + '_' + config_common.getRandomString(2) + '.' + data.file.name.split('.').pop();
            fs.rename(data.file.path, './' + config_common.file_path + filename, cb);
        },
        function (cb) {
            sdk_oss.upload(path, filename, cb);
        }
    ], function (err, url) {
        if (err) {
            return callback(err);
        }
        req.body.content = url;
        callback();
    });
};

//解析文件传参
var parseFile = function (req, callback) {
    var form = formidable.IncomingForm();
    form.uploadDir = __dirname.replace('/libs', config_common.file_path);
    form.parse(req, function (err, fields, paramData) {
        if (err) {
            return callback(err);
        }
        var data = fields;
        data.file = paramData.file;
        callback(null, data);
    });
};
exports.parseFile = parseFile;
/**
 * Created by Administrator on 2018\2\3 0003.
 */
var async = require('async');
var _ = require('underscore');
var model = require('../dbs/db_base');
model = model('ImFile');


/**
 * 保存从云信上扒下来的聊天文件
 * @param data
 * @param callback
 * 根据文件类型查看是否可以被转化
 */
exports.add = function (data, callback) {
    //设置需要转换的文件类型
    var type = {
        docx: 'docx',
        xlsx: 'xlsx'
    }
    if (type[data.ext]) {
        //需要转化走这里
        async.waterfall([
            function (cb) {
                //（1）将文件进行转化得到相应的url
                global.lib_file.saveFileByUrlForChange(data.file_url, cb);
            },
            function (url, cb) {
                data.change_url = url;
                model.add(data, cb);
            }
        ], callback)
    } else {
        //不需要直接添加即可
        model.add(data, callback);
    }
};


exports.getList = function (data, callback) {
    model.getList(data, callback);
};

exports.edit = function (data, callback) {
    model.edit(data, callback);
};

exports.update = function (data, callback) {
    model.update(data, callback);
};

exports.getOne = function (data, callback) {
    model.getOne(data, callback);
};





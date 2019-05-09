/**
 * Created by Administrator on 2017/5/24.
 */

var oss = require('./oss');

// 上传一个文件到阿里云
exports.upload = function (path, file_name, cb){
    oss.upload(path, file_name, cb);
};

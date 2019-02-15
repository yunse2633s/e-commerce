/**
 * Created by Administrator on 2016/4/9.
 */
var fs = require('fs');
var async = require('async');
var crypto = require('crypto');
var request = require('request');

var lib_user = require('./lib_user');
var lib_company = require('./lib_company');

var db_truck = require('../dbs/db_base')('Truck');
var db_user_traffic = require('../dbs/db_base')('User_traffic');

var config_server = require('../configs/config_server');
var config_common = require('../configs/config_common');

// 从阿里云上删除一个文件
exports.deleteImgFromAliyun = function (url) {
    var file_name = url.split('/').pop();
    var CanonicalizedOSSHeaders = '';
    var CanonicalizedResource = '/' + config_common.OSS.bucket_img + '/' + file_name;
    var requestDate = new Date().toUTCString();
    var VERB = 'DELETE';
    var signature_content = VERB + '\n\n' + 'application/octet-stream\n' + requestDate + '\n' + CanonicalizedOSSHeaders + CanonicalizedResource;
    var signature = crypto.createHmac('sha1',config_common.OSS.access_key).update(signature_content).digest().toString('base64');

    var header_authorization = 'OSS ' + config_common.OSS.access_id + ':' + signature;

    var headers =
        {
            'Authorization': header_authorization,
            'Cache-Control': 'no-cache',
            'Content-Length': 0,
            'Content-Type': 'application/octet-stream',
            'Date': requestDate,
            'Host': config_common.OSS.bucket_img_url
        };

    var option =
        {
            'method': 'DELETE',
            'headers': headers,
            'url': 'http://' + config_common.OSS.bucket_img_url + '/' + file_name
        };

    request(option, function (err, res_header, res_body) {
        if (err || res_header.statusCode !== 204) {
            var msg = 'Failed to DELETE FILE: ' + file_name + ' | AT: ' + new Date().toLocaleString();
            console.log(msg);
        }
    });
};

// 从本地删除一个文件
exports.deleteImgFromLocal = function (url) {
    try {
        var arr = url.split('/');
        var dir = __dirname.replace('/libs', config_common.file_path);
        fs.unlinkSync(dir + arr[arr.length - 1]);
    } catch (err) {
    }
};

// 上传一个文件到阿里云
exports.uploadFileToAliyun = function (file, file_name, cb) {
    var url = 'http://' + config_common.OSS.bucket_img_url + '/' + file_name;
    var file_data = fs.readFileSync(file.path);
    // 上传至阿里云OSS，并删除本地文件
    fs.unlinkSync(file.path);
    var CanonicalizedOSSHeaders = '';
    var CanonicalizedResource = '/' + config_common.OSS.bucket_img + '/' + file_name;
    var requestDate = new Date().toUTCString();
    var VERB = 'PUT';
    var signature_content = VERB + '\n\n' + 'application/octet-stream\n' + requestDate + '\n' + CanonicalizedOSSHeaders + CanonicalizedResource;
    var signature = crypto.createHmac('sha1', config_common.OSS.access_key).update(signature_content).digest().toString('base64');
    var header_authorization = 'OSS ' + config_common.OSS.access_id + ':' + signature;
    var headers = {
        'Authorization': header_authorization,
        'Cache-Control': 'no-cache',
        'Content-Disposition': 'attachment;filename=' + file_name,
        'Content-Length': file_data.length,
        'Content-Type': 'application/octet-stream',
        'Date': requestDate,
        'Host': config_common.OSS.bucket_img_url
    };
    var option = {
        'method': 'PUT',
        'headers': headers,
        'url': 'http://' + config_common.OSS.bucket_img_url + '/' + file_name,
        'body': file_data
    };
    request(option, function (err, http_req, http_res) {
        if (err) {
            return cb(err);
        }
        if (http_req.statusCode == '200') {
            cb(null, url);
        } else {
            cb(http_res);
        }
    });
};

// 上传一个文件到本地
exports.uploadFileToLocal = function (file, file_name, cb) {
    fs.rename(file.path, './' + config_common.file_path + file_name, function (err) {
        if (err) {
            return cb(err);
        }
        cb(null, 'http://' + config_server.local_server_ip + ':' + config_server.port + '/' + file_name);
    });
};

// 获取文件名
exports.getFileName = function (decoded, data, extension) {
    var id;
    var file_name;
    if (config_common.checkTrafficCompanyByRole(decoded.role)) {
        id = decoded.company_id[0];
    } else {
        id = decoded.company_id;
    }
    switch (data.type) {
        case config_common.file_type.user_other:
        case config_common.file_type.tou_xiang:
        case config_common.file_type.jia_shi_zheng:
        case config_common.file_type.id_card_number:
        case config_common.file_type.id_card_number_back:
            file_name = decoded.id;
            break;
        case config_common.file_type.xing_shi_zheng:
        case config_common.file_type.che_tou_zhao:
            file_name = data.truck_id;
            break;
        case config_common.file_type.offer_zhi_jian:
            file_name = 'offer' + Date.now();
            break;
        case config_common.file_type.logo:
        case config_common.file_type.ying_ye_zhi_zhao:
        case config_common.file_type.qi_ye_zhan_shi:
            file_name = id;
            break;
    }
    return file_name + '_' + data.type + '_' + config_common.getRandomString(2) + '.' + extension;
};

// 检查图片
exports.checkFile = function (data, cb) {
    if (!config_common.checkFileType(data.type)) {
        return cb('invalid_format');
    }
    var file = data.file;
    if (!file) {
        return cb('no_file');
    }
    var extension = file.name.split('.').pop();

    if( data.type =='ying_ye_zhi_zhao'){
        cb(null, extension);
    }else if (!config_common.file_format[extension] ||
        file.size > config_common.file_size) {
        fs.unlink(file.path, function (err) {
            if (err) {
                return cb(err);
            } else {
                return cb('file_invalid_format');
            }
        });
    } else {
        cb(null, extension);
    }
};

// 检查车辆
exports.checkTruck = function (truck_id, decoded, type, callback) {
    if (!truck_id) {
        return callback('invalid_format');
    }
    var truckData;
    async.waterfall([
        function (cb) {
            //车辆首次创建可以不穿truck_id
            // if(truck_id){
            db_truck.getOne({find: {_id: truck_id}}, cb);
            // }else{
            //     cb(null, {});
            // }
        },
        function (truck, cb) {
            if (!truck) {
                return cb('truck_not_found');
            }
            truckData = truck;
            if (decoded.role !== config_common.user_roles.TRAFFIC_DRIVER_PRIVATE
            // decoded.role !== config_common.user_roles.TRAFFIC_ADMIN
            ) {
                return cb('not_allow');
            }
            // if(decoded.role == config_common.user_roles.TRAFFIC_ADMIN){
            //     if(truck.create_company_id !== decoded.company_id[0]){
            //         return cb('not_allow');
            //     }
            //     return callback(null, truck[type+'_url']);
            // }else{
            if (truck.create_user_id !== decoded.id) {
                return cb('not_allow');
            }
            db_user_traffic.getOne({find: {_id: decoded.id}}, cb);
            // }
        },
        function (user, cb) {
            if (!user) {
                return cb('user_not_found');
            }
            if (user.verify_lock == config_common.verify_lock.LOCK &&
                type == config_common.file_type.xing_shi_zheng) {
                return cb('not_allow');
            }
            cb(null, truckData[type + '_url']);
        }
    ], callback);
};

// 检查人
exports.checkUser = function (user_id, decoded, type, cb) {
    lib_user.getOne({find: {_id: user_id}}, function (err, user) {
        if (err) {
            return cb(err);
        }
        if (!user) {
            return cb('not_found');
        }
        if (type == config_common.file_type.jia_shi_zheng &&
            user.verify_lock == config_common.verify_lock.LOCK) {
            return cb('not_allow');
        }
        if (type == config_common.file_type.tou_xiang) {
            cb(null, user.photo_url);
        } else {
            cb(null, user[type + '_url']);
        }
    });
};

// 检查公司
exports.checkCompany = function (company_id, decoded, type, cb) {
    if (!config_common.checkAdmin(decoded.role) && decoded.role !== config_common.user_roles.TRADE_STORAGE) {
        return cb('not_allow');
    }
    lib_company.getOne({find: {_id: decoded.company_id}}, function (err, company) {
        if (err) {
            return cb(err);
        }
        if (!company) {
            return cb('not_found');
        }
        if (type == config_common.file_type.ying_ye_zhi_zhao &&
            (company.verify_phase == config_common.verification_phase.PROCESSING ||
            company.verify_phase == config_common.verification_phase.SUCCESS)) {
            return cb('not_allow');
        }
        if (type == config_common.file_type.qi_ye_zhan_shi &&
            company.url_honor.length >= config_common.qi_ye_zhan_shi_count) {
            return cb('not_allow');
        }
        if (type == config_common.file_type.ying_ye_zhi_zhao) {
            return cb(null, company.url_yingyezhizhao);
        } else if (type == config_common.file_type.logo) {
            return cb(null, company.url_logo);
        } else if (type == config_common.file_type.company_bg_img) {
            return cb(null, company.company_bg_img);
        } else if (type == config_common.file_type.qi_ye_zhan_shi) {
            return cb(null, '');
        }
    });
};
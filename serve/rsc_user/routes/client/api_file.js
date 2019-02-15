/**
 * Created by Administrator on 2015/12/11.
 */
var fs = require('fs');
var http = require('http');
var async = require('async');
var _ = require('underscore');
var crypto = require('crypto');
var request = require('request');
var express = require('express');
var formidable = require('formidable');
var fileService = require('../../libs/lib_file');
var Truck = require('../../models/Truck');
var UserTrade = require('../../models/User_trade');
var UserTraffic = require('../../models/User_traffic');
var CompanyList = require('../../models/Company_list');
var CompanyTrade = require('../../models/Company_trade');
var CompanyTraffic = require('../../models/Company_traffic');
var config_common = require('../../configs/config_common');
var config_server = require('../../configs/config_server');
var env = process.env.node_env;

module.exports = function () {
    var api = express.Router();

    api.use(require('../../middlewares/mid_verify_user')());

    // 上传文件 -- 上传预付款及尾款的付款凭证
    api.post('/upload/:type/:truck_id', function (req, res, next) {
        if (!config_common.checkFileType(req.params.type)) {
            return next('invalid_format');
        }
        async.waterfall([
            function (cb) {
                //车辆证件
                if (req.params.type == config_common.file_type.xing_shi_zheng ||
                    req.params.type == config_common.file_type.yun_ying_zheng ||
                    req.params.type == config_common.file_type.che_tou_zhao) {
                    if (req.params.truck_id && req.params.truck_id != "null") {
                        Truck.findById(req.params.truck_id, function (err, truck) {
                            if (err) {
                                return cb(err);
                            }
                            if (!truck) {
                                return cb('not_found');
                            }
                            if (req.decoded.role !== config_common.user_roles.TRAFFIC_DRIVER_PRIVATE &&
                                req.decoded.role !== config_common.user_roles.TRAFFIC_ADMIN) {
                                return cb('not_allow');
                            }
                            if (req.decoded.role == config_common.user_roles.TRAFFIC_ADMIN) {
                                if (truck.create_company_id !== req.decoded.company_id[0]) {
                                    return cb('not_allow');
                                }
                                if (truck[req.params.type + '_url']) {
                                    if (env == 'pro') {
                                        fileService.deleteImgFromAliyun(truck[req.params.type + '_url']);
                                    } else {
                                        fileService.deleteImgFromLocal(truck[req.params.type + '_url']);
                                    }
                                }
                                cb();
                            } else {
                                if (truck.create_user_id !== req.decoded.id) {
                                    return cb('not_allow');
                                }
                                UserTraffic.findById(req.decoded.id, function (err, user) {
                                    if (err) {
                                        return cb(err);
                                    }
                                    if (!user) {
                                        return cb('not_found');
                                    }
                                    // if (//user.verify_lock == config_common.verify_lock.LOCK &&
                                    //     req.params.type == config_common.file_type.xing_shi_zheng) {
                                    //     return cb('not_allow');
                                    // }
                                    if (truck[req.params.type + '_url']) {
                                        if (env == 'pro') {
                                            fileService.deleteImgFromAliyun(truck[req.params.type + '_url']);
                                        } else {
                                            fileService.deleteImgFromLocal(truck[req.params.type + '_url']);
                                        }
                                    }
                                    cb();
                                });
                            }
                            //if((req.decoded.role == config_common.user_roles.TRAFFIC_DRIVER &&
                            //    truck.create_user_id &&
                            //    truck.create_user_id !== req.decoded.id) ||
                            //    (req.decoded.role == config_common.user_roles.TRAFFIC_ADMIN &&
                            //    truck.create_company_id &&
                            //    truck.create_company_id !== req.decoded.company_id[0])){
                            //    return cb('not_allow');
                            //}
                            //if(truck.verify_phase == config_common.verification_phase.PROCESSING ||
                            //    truck.verify_phase == config_common.verification_phase.SUCCESS){
                            //    return cb('not_allow');
                            //}
                        });
                    } else {
                        if (req.decoded.role !== config_common.user_roles.TRAFFIC_DRIVER_PRIVATE &&
                            req.decoded.role !== config_common.user_roles.TRAFFIC_ADMIN) {
                            return cb('not_allow');
                        } else {
                            cb();
                        }
                    }
                } else {
                    if (req.params.type == config_common.file_type.offer_zhi_jian) {
                        cb();
                    } else if (req.params.type !== config_common.file_type.tou_xiang &&
                        req.params.type !== config_common.file_type.jia_shi_zheng &&
                        req.params.type !== config_common.file_type.id_card_number_back &&
                        req.params.type !== config_common.file_type.id_card_number) {
                        if (!config_common.checkAdmin(req.decoded.role)) {
                            return cb('not_allow');
                        }
                        CompanyList.findOne({company_id: req.decoded.company_id}, function (err, list) {
                            if (err) {
                                return cb(err);
                            }
                            if (!list) {
                                return cb('not_found');
                            }
                            var Company;
                            if (list.type == config_common.company_category.TRADE) {
                                Company = CompanyTrade;
                            } else {
                                Company = CompanyTraffic;
                            }
                            Company.findOne({_id: req.decoded.company_id}, function (err, company) {
                                if (err) {
                                    return cb(err);
                                }
                                if (!company) {
                                    return cb('not_found');
                                }
                                if (req.params.type == config_common.file_type.ying_ye_zhi_zhao &&
                                    (company.verify_phase == config_common.verification_phase.PROCESSING ||
                                    company.verify_phase == config_common.verification_phase.SUCCESS)) {
                                    return cb('not_allow');
                                }
                                if (req.params.type == config_common.file_type.ying_ye_zhi_zhao) {
                                    if (company.url_yingyezhizhao) {
                                        if (env == 'pro') {
                                            fileService.deleteImgFromAliyun(company.url_yingyezhizhao);
                                        } else {
                                            fileService.deleteImgFromLocal(company.url_yingyezhizhao);
                                        }
                                    }
                                } else if (req.params.type == config_common.file_type.logo) {
                                    if (company.url_logo) {
                                        if (env == 'pro') {
                                            fileService.deleteImgFromAliyun(company.url_logo);
                                        } else {
                                            fileService.deleteImgFromLocal(company.url_logo);
                                        }
                                    }
                                } else {
                                    var data = req.params.type.split('_');
                                    if (company['url_' + data[0]][data[1] - 1]) {
                                        if (env == 'pro') {
                                            fileService.deleteImgFromAliyun(company['url_' + data[0]][data[1] - 1]);
                                        } else {
                                            fileService.deleteImgFromLocal(company['url_' + data[0]][data[1] - 1]);
                                        }
                                    }
                                }
                                cb();
                            });
                        });
                    } else {
                        //个人证件
                        var db;
                        if (config_common.checkTradeCompanyByRole(req.decoded.role)) {
                            db = UserTrade;
                        } else {
                            db = UserTraffic;
                        }
                        db.findById(req.decoded.id, function (err, user) {
                            if (err) {
                                return cb(err);
                            }
                            if (!user) {
                                return cb('not_found');
                            }
                            // if (req.params.type == config_common.file_type.jia_shi_zheng
                            //     && user.verify_lock == config_common.verify_lock.LOCK
                            // ) {
                            //     return cb('not_allow');
                            // }
                            if (req.params.type == config_common.file_type.tou_xiang) {
                                if (user.photo_url) {
                                    if (env == 'pro') {
                                        fileService.deleteImgFromAliyun(user.photo_url);
                                    } else {
                                        fileService.deleteImgFromLocal(user.photo_url);
                                    }
                                }
                            } else {
                                if (env == 'pro') {
                                    fileService.deleteImgFromAliyun(user[req.params.type + '_url']);
                                } else {
                                    fileService.deleteImgFromLocal(user[req.params.type + '_url']);
                                }
                            }
                            cb();
                        });
                    }
                }
            },
            function (cb) {
                // 上传文件
                var form = formidable.IncomingForm();
                form.uploadDir = __dirname.replace('/routes/client', config_common.file_path);
                form.parse(req, function (err, fields, files) {
                    if (!files['file']) {
                        return next('no_file');
                    }
                    var file = files['file'];
                    var extension = file.name.split('.').pop();
                    if (!config_common.file_format[extension] ||
                        file.size > config_common.file_size) {
                        fs.unlink(file.path, function (err) {
                            if (err) {
                                return next(err);
                            } else {
                                return next('invalid_format');
                            }
                        });
                        return;
                    }
                    var id;
                    var file_name;
                    if (config_common.checkTrafficCompanyByRole(req.decoded.role)) {
                        id = req.decoded.company_id[0];
                    } else {
                        id = req.decoded.company_id;
                    }
                    var date = new Date();
                    date = date.getTime();
                    switch (req.params.type) {
                        case config_common.file_type.tou_xiang:
                        case config_common.file_type.jia_shi_zheng:
                        case config_common.file_type.id_card_number:
                        case config_common.file_type.id_card_number_back:
                            file_name = req.decoded.id;
                            break;
                        case config_common.file_type.xing_shi_zheng:
                        case config_common.file_type.yun_ying_zheng:
                        case config_common.file_type.che_tou_zhao:
                            file_name = req.params.truck_id;
                            break;
                        case config_common.file_type.offer_zhi_jian:
                            file_name = 'offer' + date;
                            break;
                        default :
                            file_name = id;
                            break;
                    }
                    file_name += ('_' + req.params.type + '_' + config_common.getRandomString(2) + '.' + extension);
                    if (env == 'pro') {
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
                                return next(err);
                            }
                            if (http_req.statusCode == '200') {
                                config_common.sendData(req, url, next);
                            } else {
                                next(http_res);
                            }
                        });
                    } else {
                        fs.rename(file.path, './' + config_common.file_path + file_name, function (err) {
                            if (err) {
                                return cb(err);
                            }
                            config_common.sendData(req, 'http://' + config_server.local_server_ip + ':' + config_server.port + '/' + file_name, next);
                        });
                    }
                });
            }
        ], function (err) {
            if (err) {
                return next(err);
            }
        });
    });

    api.post('/upload', function (req, res, next) {
        var data;
        var old_url;
        var fileExtension;
        async.waterfall([
            function (cb) {
                //通过该方法创建一个form表单
                var form = formidable.IncomingForm();
                //通过uploadDir设置上传文件时临时文件存放的位置
                form.uploadDir = __dirname.replace('/routes/client', config_common.file_path);
                //parse方法解析node.js中request请求中包含的form表单提交的数据
                form.parse(req, cb);
            },
            function (fields, paramData, cb) {
                //fields -->自定义的type类型 -->{ type: 'tou_xiang' }
                //paramData -->这个文件的信息-->{ size: 263108,path: '/root/code/rsc-other/rsc_user/temp/upload_5df89459e890e103a17ed3a16c450c00',name: '333053-106.jpg',type: 'image/jpeg'}
                data = fields;
                data.file = paramData.file;
                global.lib_file.checkFile(data, cb);
            },
            function (extension, cb) {
                if (!req.decoded.company_id || req.decoded.company_id.length === 0) {
                    global.lib_user.getOne({find: {_id: req.decoded.id}}, function (err, user) {
                        if (err) {
                            return cb(err);
                        }
                        if (global.config_common.checkUserCompany(user)) {
                            req.decoded.company_id = user.company_id;
                            cb(null, extension);
                        } else {
                            global.lib_company.getOne({find: {user_id: req.decoded.id}}, function (err, company) {
                                if (err) {
                                    return cb(err);
                                }
                                if (company) {
                                    req.decoded.company_id = company._id.toString();
                                    cb(null, extension);
                                } else {
                                    // return cb('company_not_found');
                                    cb(null, extension);
                                }
                            });
                        }
                    });
                } else {
                    cb(null, extension);
                }
            },
            function (extension, cb) {
                fileExtension = extension;
                switch (data.type) {
                    case config_common.file_type.xing_shi_zheng:
                    case config_common.file_type.che_tou_zhao:
                        global.lib_file.checkTruck(data.truck_id, req.decoded, data.type, cb);
                        break;
                    case config_common.file_type.offer_zhi_jian:
                        cb();
                        break;
                    case config_common.file_type.user_other:
                    case config_common.file_type.tou_xiang:
                    case config_common.file_type.jia_shi_zheng:
                    case config_common.file_type.id_card_number:
                    case config_common.file_type.id_card_number_back:
                        global.lib_file.checkUser(req.decoded.id, req.decoded, data.type, cb);
                        break;
                    case config_common.file_type.logo:
                    case config_common.file_type.ying_ye_zhi_zhao:
                    case config_common.file_type.qi_ye_zhan_shi:
                    case config_common.file_type.company_bg_img:
                        if (req.decoded.company_id.length) {
                            global.lib_file.checkCompany(req.decoded.company_id, req.decoded, data.type, cb);
                        } else {
                            //首次创建企业上传照片无实际企业数据
                            var company_id = Date.now() + '_' + config_common.getRandomString(2);
                            if (config_common.checkTrafficCompanyByRole(req.decoded.role)) {
                                req.decoded.company_id = [company_id];
                            } else {
                                req.decoded.company_id = company_id;
                            }
                            cb(null, '');
                        }
                        break;
                    default:
                        cb('file_type_err');
                        break;
                }
            },
            function (url, cb) {
                old_url = url;
                var file_name = global.lib_file.getFileName(req.decoded, data, 'jpg');
                if (env == 'pro') {
                    global.lib_file.uploadFileToAliyun(data.file, file_name, cb);
                } else {
                    global.lib_file.uploadFileToLocal(data.file, file_name, cb);
                }
            },
            function (url, cb) {
                if (old_url) {
                    if (env == 'pro') {
                        global.lib_file.deleteImgFromAliyun(old_url);
                    } else {
                        global.lib_file.deleteImgFromLocal(old_url);
                    }
                }
                cb(null, url);
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            global.config_common.sendData(req, result, next);
        });
    });

    api.post('/delete', function (req, res, next) {
        if (_.isString(req.body.urls)) {
            req.body.urls = JSON.parse(req.body.urls);
        }
        if (!_.isArray(req.body.urls)) {
            return next('invalid_format');
        }
        async.waterfall([
            function (cb) {
                for (var i = 0; i < req.body.urls.length; i++) {
                    var url = req.body.urls[i];
                    if (env === 'pro') {
                        global.lib_file.deleteImgFromAliyun(url);
                    } else {
                        global.lib_file.deleteImgFromLocal(url);
                    }
                }
                cb();
            }
        ], function (err) {
            if (err) {
                return next(err);
            }
            global.config_common.sendData(req, {}, next);
        });
    });

    api.post('/delete_qi_ye_zhan_shi', function (req, res, next) {
        if (!_.isArray(req.body.urls)) {
            return next('invalid_format');
        }
        async.waterfall([
            function (cb) {
                global.lib_company.getOne({
                    find: {_id: req.decoded.company_id},
                    select: 'url_honor'
                }, cb);
            },
            function (company, cb) {
                var urls = _.intersection(company.url_honor, req.body.urls);
                for (var i = 0; i < urls.length; i++) {
                    var url = urls[i];
                    if (env == 'pro') {
                        global.lib_file.deleteImgFromAliyun(url);
                    } else {
                        global.lib_file.deleteImgFromLocal(url);
                    }
                }
                company.url_honor = _.difference(company.url_honor, urls);
                company.save(cb);
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            global.config_common.sendData(req, result, next);
        });
    });

    return api;
};
var async = require('async');
var express = require('express');

module.exports = function () {
    var api = express.Router();

    //获取进入的公司及是否显示出来
    api.post('/get_enter_company', function (req, res, next) {
        if (!global.config_common.checkPhone(req.body.phone) ||
            !global.config_common.user_type[req.body.type]) {
            return next('invalid_format');
        }
        var result = {};
        async.waterfall([
            function (cb) {
                var role = global.service_user.getRoleCondByTerminal(req.body.type);
                global.lib_user.getOne({find: {phone: req.body.phone, role: role}}, cb);
            },
            function (user, cb) {
                if(!user || !global.config_common.checkUserCompany(user)){
                    cb(null, null);
                }else{
                    global.lib_company.getOne({find: {_id: user.company_id}}, cb);
                }
            },
            function (company, cb) {
                result.appear = !company;
                if(result.appear){
                    global.service_company.getListByPhone({find: {phone: req.body.phone}}, cb);
                }else{
                    cb(null, []);
                }
            }
        ], function (err, companies) {
            if(err){
                return next(err);
            }
            result.list = companies;
            global.config_common.sendData(req, result, next);
        });
    });

    return api;
};
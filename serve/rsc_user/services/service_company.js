var async = require('async');
var _ = require('underscore');

//通过电话获取公司信息
exports.getListByPhone = function (data, callback) {
    var userData;
    async.waterfall([
        function (cb) {
            global.lib_user_new.getOne(data, cb);
        },
        function (user, cb) {
            if (!user) {
                return callback(null, []);
            } else {
                userData = user;
                global.lib_user.getListAll({find: {user_id: user._id.toString()}, select: 'company_id'}, cb);
            }
        },
        function (roles, cb) {
            var company_ids = global.lib_util.transObjArrToSigArr(roles, 'company_id');
            company_ids = _.uniq(_.without(company_ids, null, '', undefined));
            global.lib_company.getListAll({find: {_id: {$in: company_ids}}, select: 'company_id'}, cb);
        },
        function (companies, cb) {
            var company_ids = _.uniq(global.lib_util.transObjArrToSigArr(companies, 'company_id'));
            global.lib_company_new.getList({find: {_id: {$in: company_ids}}}, cb);
        }
    ], callback);
};

//通过id增加公司类型
exports.addById = function (company_id, type, callback) {
    var companyData;
    async.waterfall([
        function (cb) {
            global.lib_company_new.getOne({find: {_id: company_id}}, cb);
        },
        function (company, cb) {
            if (!company) {
                return cb('company_not_found');
            }
            companyData = company;
            global.lib_company.getOne({find: {company_id: company_id, type: type}}, cb);
        },
        function (company, cb) {
            if (company) {
                return callback(null, company);
            } else {
                var companyTypeData = global.lib_util.clone(companyData);
                delete companyTypeData._id;
                companyTypeData.type = type;
                global.lib_company.add(companyTypeData, cb);
            }
        },
        function (company, cb) {
            cb(null, _.extend(companyData, company));
        }
    ], callback);
};
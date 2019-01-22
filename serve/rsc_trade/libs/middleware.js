/**
 * Created by Administrator on 2015/11/26 0026.
 */

var request = require('request');
var _ = require('underscore');
var crypto = require('crypto');
var config_common = global.config_common;
var http;
try {
    http = require('https');
} catch (err) {
    http = require('http');
}

module.exports = {
    // 返回若干位随机码
    getRandomString: function (count) {
        if (isNaN(count)) return '';
        var random = '';
        for (var i = 0; i < count; i++) {
            var s_index = Math.floor(Math.random() * config_common.index_collection.length);
            random += config_common.index_collection[s_index];
        }
        return random;
    },

    // 从阿里云上删除一个文件
    deleteImgFromAliyun: function (file_name) {
        var OSSHeaders = '';
        var Resource = '/' + config_common.OSS.bucket_img + '/' + file_name;
        var requestDate = new Date().toUTCString();
        var VERB = 'DELETE';
        var signature_content = VERB + '\n\n' + 'application/octet-stream\n' + requestDate + '\n' + OSSHeaders + Resource;
        var signature = crypto.createHmac('sha1', config_common.OSS.access_key).update(signature_content).digest().toString('base64');
        var header_authorization = 'OSS ' + config_common.OSS.access_id + ':' + signature;
        var headers = {
            'Authorization': header_authorization,
            'Cache-Control': 'no-cache',
            'Content-Length': 0,
            'Content-Type': 'application/octet-stream',
            'Date': requestDate,
            'Host': config_common.OSS.bucket_img_url
        };

        var option = {
            'method': 'DELETE',
            'headers': headers,
            'url': 'http://' + config_common.OSS.bucket_img_url + '/' + file_name
        };
        request(option, function () {
        });
    },

    /**
     * 摘出去的产品分类
     * 用于添加产品分类筛选
     * @param body
     * @param query
     * @returns {*}
     */
    getLayerQuery: function (body, query) {
        for (var index in body) {
            if (body.hasOwnProperty(index)) {
                if ((new RegExp('material')).test(index) || (new RegExp('layer')).test(index)) query['layer.' + index] = body[index];
            }
        }
        return query;
    },

    /**
     * 没摘出去的产品分类
     * 用于添加产品分类筛选
     * @param body
     * @param query
     * @returns {*}
     */
    getDoubleLayerQuery: function (body, query) {
        for (var index in body) {
            if (body.hasOwnProperty(index)) {
                if ((new RegExp('material')).test(index) || (new RegExp('layer')).test(index)) query['product_categories.layer.' + index] = body[index];
            }
        }
        return query;
    },

    /**
     * 用于添加城市筛选   省市一起
     * @param body
     * @param cond
     * @returns {*}
     */
    getCityQuery: function (body, cond) {
        if (body.city) {
            cond['$or'] = [
                {countries: '全国'},
                {city: body.city},
                {city: '', province: body.province}
            ];
        } else if (body.province) {
            cond['$or'] = [
                {province: body.province},
                {countries: '全国'}
            ];
        } else if (body['countries']) {
            cond.countries = '全国';
        }
        if (_.isArray(body['city'])) {
            cond['$or'] = [
                {countries: '全国'},
                {city: {$in: body['city']}},
                {city: '', province: body.province}
            ];
        } else if (_.isArray(body['province'])) {
            cond['$or'] = [
                {countries: '全国'},
                {province: {$in: body.province}}
            ];
        }
        return cond;
    },

    /**
     * 用于添加城市筛选   只有一层
     * @param body
     * @param cond
     * @returns {*}
     */
    getOnlyProvinceQuery: function (body, cond) {
        if (body.city) {
            cond['$or'] = [
                {city: body.city}
            ];
        } else if (body.province) {
            cond['$or'] = [
                {city: '', province: body.province}
            ];
        }
        if (_.isArray(body['city'])) {
            cond['$or'] = [
                {city: {$in: body['city']}}
            ];
        } else if (_.isArray(body['province'])) {
            cond['$or'] = [
                {city: '', province: {$in: body.province}}
            ];
        }
        if (body['countries']) {
            if (!cond['$or']) cond['$or'] = [];
            cond['$or'].push({countries: '全国'})
        }
        return cond;
    },

    /**
     * 用于筛选理记配置
     * @param body
     * @param query
     * @returns {*}
     */
    getProductByCompany: function (body, query) {
        if (body.PID) query.PID = body.PID;
        if (body.name) query.name = body.name;
        return query;
    },

    /**
     * 订单公司id筛选
     * @param type
     * @param id
     * @returns {{}}
     */
    getOtherCompanyQueryByType: function (type, id) {
        var data = {};
        if (type === 'SALE') {
            data.company_demand_id = id;
        } else if (type === 'PURCHASE') {
            data.company_supply_id = id;
        } else {
            data['$or'] = [
                {company_supply_id: id},
                {company_demand_id: id}
            ];
        }
        return data;
    },

    /**
     * 添加用户和公司id筛选
     * @param req
     * @param query
     * @param decoded
     * @param type
     * @returns {*}
     */
    getIdQuery: function (req, query, decoded, type) {
        if (!req.body.user_id && !req.body.company_id && decoded) query.user_id = decoded.id;
        if (req.body.user_id) query.user_id = req.body.user_id;
        if (req.body.company_id) query.company_id = req.body.company_id;
        if (type && req.body.user_id) query['user_' + type + '_id'] = req.body.user_id;
        if (type && req.body.company_id) query['company_' + type + '_id'] = req.body.company_id;
        return query;
    },

    /**
     * 报价 抢单类型筛选
     * @param body
     * @param query
     * @returns {*}
     */
    getOfferType: function (body, query) {
        if (!body.type) query.type = {$in: ['DJ', 'JJ', 'QjJJ', 'DjJJ']};
        if (body.type === 'DJ') query.type = 'DJ';
        if (body.type === 'JJ') query.type = {$in: ['JJ', 'DjJJ']};
        return query;
    },

    getUserAndPaymentQuery: function (id, body, query) {
        if (body.type === 'demand') {
            query['user_demand_id'] = id;
            query['payment_style'] = global.config_model.payment_style.FOB;
        } else if (body.type === 'supply') {
            query['user_supply_id'] = id;
            query['payment_style'] = global.config_model.payment_style.CIF;
        } else {
            query['$or'] = [
                {user_supply_id: id, payment_style: global.config_model.payment_style.CIF},
                {user_demand_id: id, payment_style: global.config_model.payment_style.FOB}
            ];
        }
        return query;
    },
    getUserQuery: function (id, body, query) {
        if (body.type) {
            query['user_' + body.type + '_id'] = id;
        } else {
            query['$or'] = [
                {user_supply_id: id},
                {user_demand_id: id}
            ];
        }
        return query;
    },
    getLayer: function (body) {
        return _.reduce(_.keys(body), function (obj, index) {
            if ((new RegExp('layer')).test(index) || (new RegExp('material')).test(index)) obj[index] = body[index];
            return obj;
        }, {});
    }
};
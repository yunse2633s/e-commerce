/**
 * Created by Administrator on 2016/5/27.
 */
var express = require('express');
var _ = require('underscore');

var dis = require('../../configs/config_district');
var proName = require('../../configs/config_province_name');
var cityName = require('../../configs/config_city_name');
var disName = require('../../configs/config_district_name');
var config_common = require('../../configs/config_common');

module.exports = function () {

    var api = express.Router();

    api.use(require('../../middlewares/mid_verify_user')());

    api.post('/get_id_by_name', function (req, res, next) {
        var data = {};
        if (req.body.pro) {
            data.pro = proName[req.body.pro];
        }
        if (req.body.city) {
            data.city = cityName[req.body.city];
        }
        if (req.body.dis && req.body.city && req.body.pro) {
            var district = disName[req.body.dis];
            if (district) {
                if (district.length === 1) {
                    data.dis = district[0];
                } else {
                    var dist = dis[data.city];
                    if (dist) {
                        for (var i = 0; i < district.length; i++) {
                            if (dist[district[i]]) {
                                data.dis = district[i];
                                break;
                            }
                        }
                    }
                }
            }
        }
        config_common.sendData(req, data, next);
    });

    api.post('/get_provinces', function (req, res, next) {
        var arr = _.values(global.config_province);
        global.config_common.sendData(req, arr, next);
    });

    api.post('/get_cities', function (req, res, next) {
        if (!req.body.province) {
            return next('invalid_format');
        }
        var pro_id = global.config_province_name[req.body.province];
        if (!pro_id) {
            return next('invalid_format');
        }
        var arr = _.values(global.config_city[pro_id]);
        global.config_common.sendData(req, arr, next);
    });

    api.post('/get_districts', function (req, res, next) {
        if (!req.body.city) {
            return next('invalid_format');
        }
        var pro_id = global.config_city_name[req.body.city];
        if (!pro_id) {
            return next('invalid_format');
        }
        var arr = _.values(global.config_district[pro_id]);
        global.config_common.sendData(req, arr, next);
    });

    api.post('/get_provinces_cities', function (req, res, next) {
        var arr = [];
        for(var key in global.config_province){
            var province = global.config_province[key];
            var data = {};
            data[province.name] = [];
            var cities = global.config_city[key];
            for(var key2 in cities){
                var city = cities[key2];
                data[province.name].push(city);
            }
            arr.push(data);
        }
        global.config_common.sendData(req, arr, next);
    });

    return api;

};
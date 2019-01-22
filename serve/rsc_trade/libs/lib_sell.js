/**
 * Created by Administrator on 2018/5/30/030.
 */
var async = require('async');
var _ = require('underscore');
var http = global.http;
var config_error = global.config_error;
var lib_PassPrice = require('../libs/lib_PassPrice');
var lib_priceOfferCity = global.lib_priceOfferCity;
var lib_PriceOffer = global.lib_PriceOffer;

/**
 * 如果地址不在配送区域内，添加到销售配送区域
 * **/
exports.sell_add_area = function (req, saveOrderData, cb) {
    var code = {_id: saveOrderData.user_confirm_id};
    if (req.body.pass_type == 'purchase') {
        code._id = saveOrderData.user_demand_id;
    }
    async.waterfall([
        function (cbk) {
            http.sendUserServer({
                method: 'getOne',
                cond: {find: code},
                model: 'User_trade'
            }, '/api/server/common/get', cbk);
        },
        function (user, cbk) {
            var obj = {
                pass_type: req.body.pass_type,//sale  purchase
                warehouse_name: saveOrderData.name || '',
                name: saveOrderData.send_province + '-' + saveOrderData.receive_province,
                user_id: user._id,
                company_id: user.company_id,
                location_storage: saveOrderData.send_address_id,
                role: user.role,
                appendix: req.body.appendix || '',
                time_creation: new Date()
            };
            if (req.body.pass_type == 'purchase') {
                obj.location_storage = saveOrderData.send_address_id;
                obj.name = saveOrderData.receive_province + '-' + saveOrderData.send_province;
                obj.location_storage = saveOrderData.receive_address_id
            }
            lib_PassPrice.add(obj, cbk)
        }, function (result, count, cbk) {
            var obj = {
                user_id: result.user_id,
                city: saveOrderData.receive_city,
                district: saveOrderData.receive_district,
                province: saveOrderData.receive_province,
                warehouse_name: "",
                passPrice_id: result._id,
                price: saveOrderData.traffic_cost
            };
            if (req.body.pass_type == 'purchase') {
                obj.city = saveOrderData.send_city;
                obj.district = saveOrderData.send_district;
                obj.province = saveOrderData.send_province;
            }
            lib_priceOfferCity.add(obj, function (err) {
                if (err) {
                    return cbk(err)
                }
                cbk();
            })
        }
    ], cb);
};

exports.sell_add_city = function (req, saveOrderData, cbk2) {
    var code = {
        location_storage: saveOrderData.receive_address_id,
        pass_type: req.body.pass_type
    };
    if (req.body.pass_type == 'sale') {
        code.location_storage = saveOrderData.send_address_id;
    }
    async.waterfall([
        function (cbk) {
            lib_PassPrice.getOne({find: code}, cbk)
        },
        function (pass, cbk) {
            var obj = {
                user_id: pass.user_id,
                countries: pass.countries,
                province: saveOrderData.send_province,
                city: saveOrderData.send_city,
                district: saveOrderData.send_district,
                warehouse_name: pass.warehouse_name,
                price: saveOrderData.traffic_cost,
                passPrice_id: pass._id
            };
            if (req.body.pass_type == 'sale') {
                obj.province = saveOrderData.receive_province;
                obj.district = saveOrderData.receive_district;
                obj.city = saveOrderData.receive_city;
            }
            lib_priceOfferCity.add(obj, cbk);
        },
        //function (result, cont, cbk) {
        //    //(1)挂报价上
        //    edit_priceOffer(req, saveOrderData, cbk);
        //}
    ], cbk2);
};


//修改模板中的配送区域
exports.sell_edit_city = function (req, saveOrderData, cbk2) {
    var code = {location_storage: saveOrderData.receive_address_id};

    if (req.body.pass_type == 'sale') {
        code.location_storage = saveOrderData.send_address_id;
    }
    async.waterfall([
        function (cbk) {
            lib_PassPrice.getOne({
                find: code
            }, cbk);
        },
        function (pass, cbk) {
            var code = {
                passPrice_id: pass._id,
                district: saveOrderData.send_district,
                city: saveOrderData.send_city,
                province: saveOrderData.send_province
            };
            if (req.body.pass_type == 'sale') {
                code.district = saveOrderData.receive_district;
                code.city = saveOrderData.receive_city;
                code.province = saveOrderData.receive_province
            }
            lib_priceOfferCity.getOne({
                find: code
            }, cbk);
        },
        function (result, cbk) {
            result.price = saveOrderData.traffic_cost;
            result.save(cbk)
        },
        function (data, count, cbk) {

            edit_priceOffer(req, saveOrderData, cbk);
        }
    ], cbk2);
};
var edit_priceOffer = function (req, saveOrderData, cbk) {
    var data;
    async.waterfall([
        function (cbk) {
            lib_PassPrice.getOne({
                find: {
                    location_storage: saveOrderData.send_address_id,
                    pass_type: 'sale'
                }
            }, cbk);
        },
        function (pass, cbk) {
            data = pass;
            lib_PriceOffer.onlyGetOne({
                find: {_id: {$in: saveOrderData.offer_id}}
            }, cbk);
        },
        function (priceOffer, cbk) {
            //绑定配送区域到报价上 如果不包邮直接创建区域模板，如果包邮但是区域内没有，就在改区域创建一个新区域
            if (priceOffer && priceOffer.isDelivery && priceOffer.passPrice_id) {
                async.waterfall([
                    function (cbk1) {
                        lib_priceOfferCity.getOne({
                            find: {
                                user_id: priceOffer.user_id,
                                //countries:result.countries,
                                province: saveOrderData.receive_province,
                                city: saveOrderData.receive_city,
                                district: saveOrderData.receive_district,
                                //warehouse_name:result.warehouse_name,
                                //price:saveOrderData.traffic_cost,
                                passPrice_id: priceOffer.passPrice_id
                            }
                        }, cbk1);
                    },
                    function (result, cbk1) {
                        if (result) {
                            result.price = saveOrderData.traffic_cost;
                            result.save(function (err) {
                                if (err) {
                                    return cbk1(err);
                                }
                                cbk1();
                            })
                        } else {
                            lib_priceOfferCity.add({
                                user_id: priceOffer.user_id,
                                province: saveOrderData.receive_province,
                                city: saveOrderData.receive_city,
                                district: saveOrderData.receive_district,
                                price: saveOrderData.traffic_cost,
                                passPrice_id: priceOffer.passPrice_id
                            }, function (err) {
                                if (err) {
                                    return cbk1(err)
                                }
                                cbk1();
                            })
                        }
                    }
                ], cbk);
            } else {
                if (priceOffer) {
                    priceOffer.isDelivery = true;
                    priceOffer.passPrice_id = data._id;

                    priceOffer.cut_time = 0;
                    priceOffer.not_count_price = 0;
                    priceOffer.timeout_price = 0;
                    priceOffer.date_type = 0;
                    priceOffer.start_date = 0;
                    priceOffer.time_goods = '24小时';

                    priceOffer.save(function (err) {
                        if (err) {
                            return cbk(err);
                        }
                        cbk()
                    });
                } else {
                    cbk();
                }
            }
        },
        function (cbk) {
            global.lib_shop.update({
                find: {offer_id: saveOrderData.offer_id.toString()},
                set: {status: true}
            }, function (err) {
                if (err) {
                    return cbk(err)
                }
                cbk();
            });
        }
    ], cbk);
};

exports.edit_priceOffer = edit_priceOffer;



/**
 * Created by Administrator on 2018/3/23/023.
 */
/**
 * Created by Administrator on 2017/2/27.
 */

var model = require('../dbs/db_base');
model = model('Demand');
var _ = require('underscore');
var async = require('async');
var shortid = require('js-shortid');
var offer_model = require('../dbs/db_base')('PriceOffer');
var PriceOfferProducts=require('../dbs/db_base')('PriceOfferProducts');
var ProductName=require('../dbs/db_base')('ProductName');
var config_model = global.config_model;


exports.offerEdit = function (req, cond,callback) {
    var entry;
    async.waterfall([
        function (cb) {
            offer_model.getOne({
                find: cond
            }, cb);
        },
        function (offer,cb) {
            var historyArr = [];

            for (var i = 0; i < req.body.product_categories[0].product_name.length; i++) {
                var historyObj = {};
                if (req.body.product_categories[0].product_name[i].price_remember) {
                    historyObj = {
                        name: req.body.product_categories[0].product_name[i].name,
                        price_weight: [{
                            price: req.body.product_categories[0].product_name[i].price_weight,
                            time: new Date()
                        }],
                        price_remember: [{
                            price: req.body.product_categories[0].product_name[i].price_remember,
                            time: new Date()
                        }]
                    }
                } else {
                    historyObj = {
                        name: req.body.product_categories[0].product_name[i].name,
                        price_weight: [{
                            price: req.body.product_categories[0].product_name[i].price_weight,
                            time: new Date()
                        }]
                    }
                }
                historyArr.push(historyObj)
            }
            if(req.body.type === global.config_model.offer_type.DJ){
                offer.ownType=global.config_model.offer_ownType.pricing;
            }else{
                offer.ownType=global.config_model.offer_ownType.bidding;
            }
            if(!isNaN(parseInt(req.body.delay_day))){
                offer.delay_day=parseInt(req.body.delay_day)
            }
            if(req.body.delay_type){
                offer.delay_type=req.body.delay_type;
            }
            offer.user_id= req.decoded.id;
            offer.admin_id= req.decoded.admin_id;
            offer.company_id= req.decoded.company_id;
            offer.company_name= req.decoded.company_name;

            offer.att_quality= req.body.att_quality;
            offer.att_payment= req.body.att_payment;
            offer.att_traffic= req.body.att_traffic;
            offer.att_settlement= req.body.att_settlement;
            offer.path_loss= req.body.path_loss;

            offer.price_history= historyArr;

            offer.location_storage= req.body.location_storage;    //提货地址
            offer.location_storage_unit_id= req.body.location_storage_unit_id;    //提货地址区域
            offer.passPrice_id= req.body.passPrice_id;                                  // 运费模板
            offer.status= config_model.offer_status.published;
            offer.type= req.body.type;
            offer.role= req.decoded.role;
            offer.appendix= req.body.appendix;
            offer.warehouse_name= req.body.warehouse_name;
            offer.percent_advance= req.body.percent_advance || 0;

            offer.background_urls= req.body.background_urls || [];

            offer.amount= req.body.amount || 0;

            offer.time_goods= req.body.time_goods || 0;
            offer.time_validity=req.body['time_validity'];           //此处，为竞价倒计时
            offer.time_creation=new Date();
            offer.save(cb);
        },
        function(data,count,cb){
            PriceOfferProducts.getOne({find:{PID:cond._id}},cb);
        },
        function (offer,  cb) {
            entry = offer.toObject();
            var priceOfferCity = [];
            if (!req.body.price_routes || req.body.price_routes.length === 0) {
                req.body.price_routes = [{
                    PID: [offer._id.toString()],
                    price: req.body.price || 0,
                    min: req.body['price_min'] || 0,
                    max: req.body['price_max'] || 0,
                    countries: '全国'
                }]
            }
            req.body.price_routes.forEach(function (offerCity) {
                offerCity.PID = [offer._id.toString()];
                offerCity['user_id'] = req.decoded.id;
                offerCity['type'] = req.body.type;
                if (offerCity._id) delete offerCity._id;
                priceOfferCity.push(offerCity);
            });
            lib_priceOfferCity.addList(priceOfferCity, cb);
        },
        function (result, cb) {
            entry.price_routes = result;
            global.lib_ProductClassify.checkProduct(req.body.product_categories, {
                id: entry._id,
                user_id: req.decoded.id,
                company_id: req.decoded.company_id
            }, cb);
        },
        function (result, cb) {
            result[0].for_liji = req.body.PID;
            lib_PriceOfferProducts.addList(result, cb);
        }
    ], function (err, result) {
        if (err) return callback(err);
        var type, other_type, statistical_type, title, url;
        entry.product_categories = result;
        global.lib_User.addCompanyDynamic({
            company_id: req.decoded.company_id,
            user_id: req.decoded.id,
            type: config_common.typeCode.trade_pricing,
            data: JSON.stringify(entry)
        });
        if (entry.type === config_model.offer_type.DJ) {
            type = 'offer';
            title = '交易报价';
            statistical_type = config_model.statistical_type.sale_pricing;
            other_type = config_model.statistical_type.purchase_pricing;
            url = config_common.push_url.offer;
        } else {
            type = 'JJ_offer';
            title = '交易竞价';
            statistical_type = config_model.statistical_type.sale_bidding;
            other_type = config_model.statistical_type.purchase_bidding;
            url = config_common.push_url.bidding;
        }

        global.lib_User.getCompanyRelationList({
            find: {other_id: req.decoded.company_id},
            select: 'self_id'
        }, function (err, list) {
            global.lib_Statistical.statistical_server_companyTrade_add(req, {
                companyObj: [{
                    id: req.decoded.company_id,
                    type: statistical_type,
                    add_user_id: req.decoded.id,
                    category: result[0].layer['layer_1']
                }].concat(_.reduce(_.pluck(list, 'self_id'), function (list, id) {
                    list.push({
                        id: id,
                        type: other_type
                    });
                    return list;
                }, []))
            });
        });
        async.waterfall([
            function (cbk) {
                global.lib_msg.push(req, {
                        title: title,
                        content: global.config_msg_templates.encodeContent(type, [req.decoded.company_name || '', req.decoded['user_name'], result[0].layer['layer_1_chn']])
                    }, {}, '', {
                        params: {id: entry._id, deal: 'buy', type: 'quan'},
                        url: url
                    }, null, global.config_model.company_type.PURCHASE,
                    cbk);
            },
            function (list, cbk) {
                cbk(null, _.extend({id: entry._id}, list));
            }
        ], callback);
    });
};
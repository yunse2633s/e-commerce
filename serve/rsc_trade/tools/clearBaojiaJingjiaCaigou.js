/**
 * Created by Administrator on 2017/6/28.
 */
var mongoose = require('mongoose');
var config_server = require('../configs/config_server');

// var dbUrl = 'mongodb://rscdba:a11111@60.205.146.53:27033/rsc_trade';
// var dbUrl = 'mongodb://192.168.3.248:27017/rsc_trade';
mongoose.Promise = global.Promise;
mongoose.connect(dbUrl);
mongoose.connection.on('connected',function() {
});
mongoose.connection.on('error',function() {
    mongoose.connection.close();
});
mongoose.connection.on('disconnected',function() {
    mongoose.connect(dbUrl);
});


var async = require('async');
var db_PriceOffer = require('../dbs/db_base')('PriceOffer');
var db_PriceOfferProducts = require('../dbs/db_base')('PriceOfferProducts');
var db_PriceOfferCity = require('../dbs/db_base')('PriceOfferCity');
var db_ProductName = require('../dbs/db_base')('ProductName');
var db_shop = require('../dbs/db_base')('shop');
var db_demand_offer = require('../dbs/db_base')('DemandOffer');
var db_demand = require('../dbs/db_base')('Demand');
var db_offerAgain = require('../dbs/db_base')('OfferAgain');
var lib_util = require('../libs/util');

var user_ids = [
    '599e2a00258e373bce07189f',
    '599e2a29258e373bce0718a0',
    '599e2a34258e373bce0718a1',
    '599e2a43258e373bce0718a2',
    '599e2a50258e373bce0718a3',
    '599e2b2d258e373bce0718a9',
    '599e2b62258e373bce0718ac',
    '599e2b50258e373bce0718ab',
    '599e2b3e258e373bce0718aa',
    '599e2b74258e373bce0718ad',
    '599e30f8258e373bce0718c0',
    '599e3107258e373bce0718c1',
    '599e3116258e373bce0718c2',
    '599e3c60af2e484881087da3',
    '599e3cbfaf2e484881087da4',
    '599e3ccaaf2e484881087da5'
];

var offer_ids;
var name_ids;
// var priceOfferCond = {user_id: {$in: user_ids}}; //############注意
// var priceOfferCond = {user_id: {$nin: user_ids}}; //############注意
async.waterfall([
    //清理报价
    function (cb) {
        db_PriceOffer.getList({
            find: priceOfferCond
        }, cb);
    },
    function (offers, cb) {
        offer_ids = lib_util.transObjArrToSigArr(offers, '_id');
        db_PriceOfferProducts.getList({
            find: {PID: {$in: offer_ids}},
            select: 'product_name'
        }, cb);
    },
    function (products, cb) {
        name_ids = lib_util.transObjArrToSigArr(products, 'product_name');
        db_ProductName.del({_id: {$in: name_ids}}, cb);
    },
    function (count, cb) {
        db_PriceOfferCity.del({PID: {$in: offer_ids}}, cb);
    },
    function (count, cb) {
        db_PriceOfferProducts.del({PID: {$in: offer_ids}}, cb);
    },
    function (count, cb) {
        db_PriceOffer.del(priceOfferCond, cb);
    },
    //清理购物车
    function (count, cb) {
        db_shop.del({offer_id: {$in: offer_ids}}, cb);
    },
    //清理竞价
    function (count, cb) {
        db_offerAgain.del({offer_id: {$in: offer_ids}}, cb);
    },
    //获取采购
    function (count, cb) {
        db_demand.getList({
            find: priceOfferCond
        }, cb);
    },
    //清理抢单
    function (demands, cb) {
        db_demand_offer.del({demand_id: {$in: lib_util.transObjArrToSigArr(demands, '_id')}}, cb);
    },
    //清理采购
    function (count, cb) {
        db_demand.del(priceOfferCond, cb);
    }
], function (err) {
    if(err){
        console.log(err);
    }
    console.log('clear success!');
});
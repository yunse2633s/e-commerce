/**
 * sj 20170424.
 */
//外部工具引用
var async = require('async');
var express = require('express');
var config_common = require('../../configs/config_common');
var redCardSV=require('../../lib/lib_red_card');
var redCardOrderSV=require('../../lib/lib_red_card_order');
//内部工具引用

//配置文件引用

//内部数据操作引用

var obj = {
    getOne: 'getOne',
    getCount: 'getCount',
    getList: 'getList'
};
var judgeObjectId = function(str){
    var reg = /[a-fA-F0-9]{24}/;
    if(typeof(str) == 'string'){
        return reg.test(str) && str.length==24;
    }
    if(typeof(str) == 'object' && (Object.keys(str)).indexOf('_id') > -1){
        return reg.test(str) && str.length==24;
    }else{
        return true
    }
}
module.exports = function() {
    var api = express.Router();
    //token 解析判断
    api.use(require('../../middlewares/mid_verify_server')());
    /**
     * method: 表
     */
    api.post('/get', function (req, res, next) {
        if (!obj[req.body.method] ||
            !req.body.cond ||
            !req.body.model) {
            return next({dev:'invalid_format', pro: 'invalid_format'});
        }
        var model = require('../../dbs/db_base');
        model = model(req.body.model);
        async.waterfall([
            function (cb) {
                if(judgeObjectId(req.body.cond)){
                    model[req.body.method](req.body.cond, cb);
                }else{
                    cb(null, {})
                }
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, result, next);
        });
    });

    /**
     * 用户挂靠
     * 挂靠成功后，获取被挂靠公司是否有红包，若有则生成一个对应的挂靠红包
     */
    api.post('/depend_red_card', function (req, res, next) {
        var card, cardOrder;
        async.waterfall([
            function (cb) {
                //查询 挂靠公司id 的挂靠红卡
                redCardSV.getOne({find: {
                    company_id: req.body.company_id,
                    theme:'depend',
                    status: config_common.demand_status.effective,
                    time_validity:{$gt: new Date()}
                }}, cb)
            }, function(cardR, cb){
                if(!cardR){
                    return cb({dev: '无红包'})
                }
                card=cardR;
                //判断红卡与手机号　或id号
                redCardOrderSV.getOne({
                    find: {
                        card_id: card._id,
                        $or: [{user_id: req.body.user_id}, {phone: req.body.user_phone}]
                    }
                }, cb)
            }, function (cardOrderR, cb) {
                cardOrder=cardOrderR;
                if(cardOrder){
                    cardOrder.status=config_common.demand_status.effective;
                    cardOrder.save(cb);
                }else{
                    var order={
                        send_user_id: card.user_id,             //发卡人
                        send_company_id: card.company_id,             //发卡人
                        send_company_name: card.company_name,             //发卡人
                        card_id: card._id,            //卡id
                        user_id: req.body.user_id,     //接卡人
                        user_phone: req.body.user_phone,  //接卡人手机号
                        // money_remain: card.money,       //卡额度 number ,假设与红卡额度相同
                        time_validity: card.time_validity,        //卡有效期 date
//                         time_end: {type: Date},             //最后使用时间 date
//                         operate_num: {type: Number},        //使用次数 number
                        max_step: card.max_step,   //步长，单次使用额度
                        frequency: card.frequency,  //频率
                        status: config_common.demand_status.effective
                    };
                    if(card.allot=='equal'){
                        order.money_remain = card.money;
                    }
                    redCardOrderSV.add(order, function (x,y) {
                        if(y){
                            card.flow=config_common.rscDecimal('add', card.flow, y.money_remain);
                            card.save(function () {})
                        }
                        cb(null, y);
                    })
                }
            }
        ], function (err, result) {
            if(err){
                return next(err);
            }
            config_common.sendData(req, result, next);

        })
    });


    return api;
};


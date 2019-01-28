/**
 * 统计各角色的 物流需求单量、物流需求吨数、 接单数 订单数
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var trafficUserTotal = {
    user_id: {type:String},                 //表单发起者的用户ID。
    company_id: {type:String},              //表单发起者的用户公司ID。
    demand_count: {type:Number, default: 0},    //需求单数量
    plan_count: {type:Number, default: 0},    //接单数量
    order_count: {type:Number, default: 0},    //订单数量
    driver_demand_count: {type:Number, default: 0},    //司机需求单数量
    driver_plan_count: {type:Number, default: 0},    //司机接单数量
    driver_order_count: {type:Number, default: 0},    //司机订单数量
    demand_amount: {type:Number, default: 0},    //需求单重量
    order_amount: {type:Number, default: 0},    //订单重量
    driver_demand_amount: {type:Number, default: 0},    //司机需求单重量
    driver_order_amount: {type:Number, default: 0},    //司机订单重量
    demand_price: {type:Number, default: 0},    //需求总价
    order_price: {type:Number, default: 0},    //订单总价
    driver_demand_price: {type:Number, default: 0},    //司机需求单总价
    driver_order_price: {type:Number, default: 0},    //司机订单总价
    line_count: {type:Number, default: 0},    //物流线路数
    driver_count: {type:Number, default: 0},    //司机线路数

};
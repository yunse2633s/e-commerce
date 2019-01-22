/**
 * Created by Administrator on 17/8/12.
 */
var _ = require('underscore');
var async = require('async');
var mongoose = require('mongoose');
var config_server = require('../configs/config_server')
var Schema = mongoose.Schema;
var querystring = require('querystring');
var request = require('request');
var result = Math.floor(Math.random() * 10 + 10)
var totalDays = 0;

var getMondayAndSunday = function (num) {
    if (!num) num = 0;
    var now = new Date();
    var nowTime = now.getTime();
    var day = now.getDay();
    var oneDayLong = 24 * 60 * 60 * 1000;
    var MondayTime = nowTime - (day - 1 + num) * oneDayLong;
    var SundayTime = nowTime + (7 - day - num) * oneDayLong;
    var monday = new Date(MondayTime);
    var sunday = new Date(SundayTime);
    return {
        monday: monday,
        sunday: sunday
    };
};
// console.log((new Date).getDay());
//
// console.log(_.extend([1,2,3],function (result,num) {
//     result.push((num+2));
//     return result
// },[]));
// var a = {
//     "status": "err",
//     "msg": {
//         "content": {
//             "message": "PriceOfferProduces validation failed",
//             "name": "ValidationError",
//             "errors": {
//                 "material_chn": {
//                     "message": "Path `material_chn` is required.",
//                     "name": "ValidatorError",
//                     "properties": {"type": "required", "message": "Path `{PATH}` is required.", "path": "material_chn"},
//                     "kind": "required",
//                     "path": "material_chn"
//                 }
//             }
//         }, "code": "未知错误"
//     }
// }

// var a = {
//     "material_chn": "钢铁",
//     "material": "steel",
//     "layer": {
//         "layer_2": "Q275",
//         "layer_2_chn": "Q275",
//         "layer_1": "steel_gangpei",
//         "layer_1_chn": "钢坯",
//         "material": "steel",
//         "material_chn": "钢铁"
//     },
//     "unit": "件",
//     "pass_unit": "吨",
//     "user_id": "595454d499a59139694846ac",
//     "modify_amount": false,
//     "path_loss": false,
//     "replenish": false,
//     "product_name": [
//         "59c0ce6e8512f940e424e426"
//     ],
//     "PID": [
//         "59c0ce6e8512f940e424e424"
//     ],
//     "company_id": "59546ec0d3e1b60414c24b70"
// }
// a = _.extend(a,a.layer);
// delete a.layer;
var a = '23,23'
console.log(a.indexOf(','));




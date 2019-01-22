/**
 * Created by Administrator on 17/4/19.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//运费模板，配送区域运费，每吨多多少钱，有passPrice_id无PID
//报价，区域优惠，每吨少多少钱，无passPrice_id有PID
var priceOfferCitSchema = new Schema({
    user_id: {type: String, required: true},                                    // 表单发起者的用户ID。

    PID: {type: Array, default: []},                                            // 上级id。
    passPrice_id: {type: String, default: ''},                                  // 运费模板id

    price: {type: Number, default: 0},                                          // 区域价格

    warehouse_name: {type: String, default: ""},                                 // 仓库名称

    province: {type: String, default: ''},                                      // 省
    city: {type: String, default: ''},                                          // 城市
    district: {type: String, default: ''},                                      // 县/区域
    countries: {type: String, default: ''}                                      // 国

});

module.exports = mongoose.model('PriceOfferCity', priceOfferCitSchema);
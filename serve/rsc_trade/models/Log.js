/**
 * Created by Administrator on 2017/2/13.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//批量调价，批量优惠，调整记录
var pushSchema = new Schema({
    type: {type: String, required: true},                     // 类型。

    user_id: {type: String, required: true},                  // 表单发起者的用户ID。
    layer: {type: Schema.Types.Mixed, default: {}},           // 产品分类
    content: {type: Schema.Types.Mixed, default: []},         // 内容[]
    price: {type: Number, default: ''},                       // 添加额度
    province: {type: String},                                 // 省。
    city: {type: String},                                     // 市。
    countries: {type: String},                                // 国。

    offer_ids: {type: Array, default: []},                    //修改的报价id
    product_name: {type: Array, default: []},
    time_creation: {
        type: Date, default: function () {
            return new Date();
        }
    }
});

module.exports = mongoose.model('Log', pushSchema);
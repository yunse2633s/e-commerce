/**
 * Created by Administrator on 2017/2/13.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//理计
var TonnageSchema = new Schema({
    company_id: {type: String, default: ''},                         // 公司id
    PID: {type: String, default: ''},                                // 分类
    name: {type: String, default: ''},                               // 分类名称，给客户端用
    product_name: {type: String, default: ''},                       // 产品名称
    value: {type: Number}
});

module.exports = mongoose.model('Tonnage', TonnageSchema);

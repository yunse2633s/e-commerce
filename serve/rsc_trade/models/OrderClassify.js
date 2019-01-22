/**
 * Created by Administrator on 17/6/26.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//产品配置一起下单，目前没有用
var OrderClassifySchema = new Schema({
    arr: {type: Array, default: []}  //产品分类数组
});

module.exports = mongoose.model('OrderClassify', OrderClassifySchema);

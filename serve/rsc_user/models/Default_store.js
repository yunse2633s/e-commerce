var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//默认仓库地址
var DefaultStoreSchema = new Schema({
    user_id: {type:String},
    store_id: {type:String},
    differentiate:  {type: String},     //提货交货地址
    time_creation: {type:Date, default:function(){return new Date()}}
});

module.exports = mongoose.model('default_store', DefaultStoreSchema);
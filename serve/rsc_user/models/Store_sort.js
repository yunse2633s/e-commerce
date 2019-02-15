/**
 * Created by Administrator on 2017\11\11 0011.
 */
/**
 * 仓库顺序表：记录仓库的排序
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var StoreSortSchema = new Schema({
    user_id: {type: String},  //个人id
    store_id: {type: Array},  //仓库父id
    time_creation: {type: Date},
});

module.exports = mongoose.model('StoreSort', StoreSortSchema);
/**
 * Created by Administrator on 17/10/9.
 */

//属性分类综合表
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var configSchema = new Schema({
    CID: {type: Array, required: true},                          //对应属性的编号
    numbering: {type: String}
});
module.exports = mongoose.model('attGroup', configSchema);




/**
 * Created by Administrator on 2017/6/21.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var RelationSchema = new Schema({
    user_id: {type:String},    //自己id
    other_id: {type:String},   //对方id
    type: {type:String, default: 'FRIEND'},       //好友、公司
    extend: {type:String},          //根据type扩展此字段内容
    time_creation: {type:Date, default:function(){return new Date()}}
});

module.exports = mongoose.model('user_relation', RelationSchema);
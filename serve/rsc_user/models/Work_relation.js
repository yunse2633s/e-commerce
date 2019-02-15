/**
 * Created by Administrator on 2017/6/21.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var RelationSchema = new Schema({
    user_id: {type:String},         //自己id
    company_id: {type:String},      //自己公司id
    other_user_id: {type:String},   //对方id
    other_company_id: {type:String},//对方公司id
    type: {type:String},            //other_user_id是user_id的type
    time_creation: {type:Date, default:function(){return new Date()}}
});

module.exports = mongoose.model('work_relation', RelationSchema);
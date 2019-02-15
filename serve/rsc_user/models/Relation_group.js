/**
 * Created by Administrator on 2016/5/14.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//user_id和company_id只能有一个，好友类型的只有user_id，公司级的包括同事，合作商都是company_id
var TruckGroupSchema = new Schema({
    user_id: {type:String},     //所属人id
    company_id: {type:String},  //所属公司id
    name: {type:String},        //名称
    type: {type:String},        //组类型
    time_creation: {
        type: Date, default: function () {
            return new Date()
        }
    }
});

module.exports = mongoose.model('relation_group', TruckGroupSchema);
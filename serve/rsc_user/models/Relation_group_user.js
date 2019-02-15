/**
 * Created by Administrator on 2016/5/14.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//user_id和company_id只能有一个，好友类型的只有user_id，公司级的包括同事，合作商都是company_id
//member_id和invite_id只能有一个，invite_id是邀请未上线的，member_id是组成员的人id
var TruckGroupRelationSchema = new Schema({
    user_id: {type:String},     //所属人id
    company_id: {type:String},  //所属公司id
    member_id: {type:String},   //组员id
    invite_id: {type:String},   //邀请未上线的邀请id，对应invitation_user表_id
    type: {type:String},        //类型跟组类型一致
    group_id: {type:String},    //所属组id
    time_creation: {
        type: Date, default: function () {
            return new Date()
        }
    }
});

module.exports = mongoose.model('relation_group_user', TruckGroupRelationSchema);
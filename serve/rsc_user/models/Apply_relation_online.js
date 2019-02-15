/**
 * Created by Administrator on 2017/6/21.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var RelationSchema = new Schema({
    user_id: {type:String},         //自己id,接到申请的人的id
    company_id: {type:String},      //自己公司id，接到申请的人的公司的id
    other_user_id: {type:String},   //对方id ，发申请人的id
    other_company_id: {type:String},//对方公司id，发申请人的公司的id
    type: {type:String},            //好友、公司邀请、公司申请、合作、来访公司
    status: {type:String, default: 'WAIT'},          //同意、拒绝、申请、来访人
    extend: {type:String},          //根据type扩展此字段内容
    friend_extend: {type:String},          //根据type扩展此字段内容
    group_type: {type:String},          //组类型(邀请时候选组就有)
    group_id: {type:String},          //组id(邀请时候选组就有)
    time_creation: {type:Date, default:function(){return new Date()}}
});

// 被邀请记录
// 好友关系：无company_id,无other_company_id,有extend邀请的角色
// 公司邀请：无company_id,有other_company_id,有extend邀请的角色
// 公司申请：有company_id,无other_company_id,有extend邀请的角色(物管，仓管，挂靠有extend，其它角色没有)
// 合作关系：有company_id,有other_company_id,有extend邀请的合作类型(other_company_id是company_id的extend,a是b的供应商)

module.exports = mongoose.model('apply_relation_online', RelationSchema);
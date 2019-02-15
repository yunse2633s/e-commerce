/**
 * Created by Administrator on 2017/3/24.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UserSchema = new Schema({
    phone: {type: String},
    real_name: {type: String},
    role: {type: String},
    extend:{type: String},       //根据type类型确定的扩展字段
    company_id: {type: String},  //发邀请的公司
    user_id: {type: String},     //发邀请的人
    type: {type: String},        //离线邀请类型，好友、同事
    status:{type:String,default:'PROCESSING'},  //邀请的状态，当邀请成功是改为 success
    time_creation: {
        type: Date, default: function () {
            return new Date()
        }
    }
});

//好友邀请：无role、company_id
//同事邀请：全有

module.exports = mongoose.model('invitation_user', UserSchema);
/**
 * Created by Administrator on 2015/11/23.
 */
var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var Schema = mongoose.Schema;

var UserSchema = new Schema({
    user_id: {type:String},     //所属人id
    phone: {type:String},
    // password: {type:String ,required:true, select:false},
    real_name: {type:String, default:''},
    role: {type:String, default:''},
    gender: {type:String, default:'MALE'},
    company_id: {type:Array},               //我加入的公司,
    time_creation: {type:Date, default:function(){return new Date()}},
    photo_url: {type:String, default:'http://support.e-wto.com/default_face.png'},
    province: {type:String, default:''},    //省
    city: {type:String, default:''},        //市
    district: {type:String, default:''},    //区县
    addr: {type:String, default:''},        //详细
    post: {type:String, default:''},        //岗位职务
    sell: {type: Array},                    //销售设置
    buy: {type: Array},                     //采购设置
    transport: {type: Array},               //运什么
    verify_lock: {type:String, default:'UNLOCK'},           //认证锁(关闭可修改，开启不可修改)
    id_card_number: {type:String},          //身份证号码
    id_card_number_url: {type:String, default:'http://support.e-wto.com/default_weishangchuan.png'},          //身份证照片正面
    id_card_number_back_url: {type:String, default:'http://support.e-wto.com/default_weishangchuan.png'},     //身份证照片背面
    jia_shi_zheng_url: {type:String, default:'http://support.e-wto.com/default_weishangchuan.png'},           //驾驶证照片
    free: {type: Boolean},                      //自由标志，自由表示可离职，可加入其它公司，认证公司的人用此字段表示是否可以离开此公司
    admin_id: {type: String, default: ""},      //指挥中心带操作人的id
    other_picture: {type: Array},                //司机设置上传其它证件使用
    source: {type: String}, //备注remark，主动创建active，被动邀请 passive
    recommend: {type: Boolean, default: false} //推荐：是否接受推荐和推荐给别人
});

UserSchema.pre('save',function(next) {
    var user = this;
    if(!user.isModified('password')) {
        return next();
    }
    bcrypt.hash(user.password, null, null, function(err, hash) {
        if(err){
            return next(err);
        }
        user.password = hash;
        next();
    });
});

UserSchema.method('comparePassword', function (password) {
    return bcrypt.compareSync(password, this.password);
});

module.exports = mongoose.model('user_traffic', UserSchema);
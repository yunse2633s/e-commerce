/**
 * Created by Administrator on 2015/11/6 0006.
 */
var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var Schema = mongoose.Schema;

var UserSchema = new Schema({
    user_id: {type: String},                 //所属人id
    phone: {type: String},
    real_name: {type: String, default: ''},
    role: {type: String, default: ''},
    gender: {type: String, default: 'MALE'},
    company_id: {type: String, default: ''},
    photo_url: {type: String, default: 'http://support.e-wto.com/default_face.png'},
    post: {type: String, default: ''},    //岗位职务
    free: {type: Boolean},  //自由标志，自由表示可离职，可加入其它公司，认证公司的人用此字段表示是否可以离开此公司
    sell: {type: Array},    //销售设置
    buy: {type: Array},    //采购设置
    transport: {type: Array},    //运什么
    admin_id: {type: String, default: ""},   // 指挥中心带操作人的id
    source: {type: String}, //备注remark，主动创建active，被动邀请 passive
    recommend: {type: Boolean, default: false}, //推荐：是否接受推荐和推荐给别人
    time_creation: {
        type: Date, default: function () {
            return new Date()
        }
    }
    // password:   {type:String ,required:true, select:false},
    //mail: {type:String, default:''},    //邮件
    // province: {type:String, default:''},//省
    // city: {type:String, default:''},    //市
    // district: {type:String, default:''},//区县
    // addr: {type:String, default:''},    //详细
    //sign: {type:String, default:''},    //签名
    //home_see: {type: Array},     //首页设置看什么
    //store_id: {type:Array},                  //所属仓库
    // sms_timeArr:[Date],                  //短信创建时间
    // sms_logintime:{type:Date, default:function(){return new Date()}},         //最后登录时间
    // sms_islogin:{type:Boolean, default:false},        //是否发送过提示登录短信
});

UserSchema.pre('save', function (next) {
    var user = this;
    if (!user.isModified('password')) {
        return next();
    }
    bcrypt.hash(user.password, null, null, function (err, hash) {
        if (err) {
            return next(err);
        }
        user.password = hash;
        next();
    });
});

UserSchema.method('comparePassword', function (password) {
    return bcrypt.compareSync(password, this.password);
});

module.exports = mongoose.model('user_trade', UserSchema);
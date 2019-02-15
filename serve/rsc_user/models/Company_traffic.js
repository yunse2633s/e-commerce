/**
 * Created by Administrator on 2015/11/23.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var CompanySchema = new Schema({
    user_id: {type: String},
    company_id: {type: String},
    full_name: {type: String}, //公司全名
    type: {type: String},
    //has_admin: {type: Boolean, default: true},
    nick_name: {type: String, default: ''},
    currency: {type: Number, default: 0},
    person_count: {type: String},       //公司人数
    join_allow: {type: Boolean, default: true},            //公司描述
    verify_phase: {type: String, default: 'NO'},
    //status: {type: String, default: 'n_n'},
    url_yingyezhizhao: {type: String},
    url_logo: {type: String},
    url_honor: {type: Array, default: []},    //荣誉图

    url_company_bg_img: {type: String},          //企业背景图

    panorama_url:{type: String},              ////企业全景看场地址

    //url_culture: {type: Array, default: []},    //文化图
    //manage: {type: String},                   //经营品类
    transport: {type: Array, default: []},    //运什么
    //sub_type: {type: String, default: 'TRAFFIC'},                   //子类型如钢铁煤炭
    province: {type: String},        //省
    city: {type: String},            //市
    district: {type: String},//区县
    addr: {type: String},    //详细
    location: {type: [Number]},              //经纬度
    des: {type: String, default: ''},            //公司描述
    time_creation: {
        type: Date, default: function () {
            return new Date()
        }
    },
    //freeze: {type: Boolean, default: false},  //冻结公司标志
    phone_creator: {type: String},        //公司创建人电话（第一个）
    // invite_user_id: {type: String, select: false},
    // comp_invited_id: {type: String},
    // comp_invited_name: {type: String},
    // operator: {type: String}

    traffic_type:{type:Boolean,default:false},    // 是否开通公众号服务
    admin_id: {type: String, default: ""},   // 指挥中心带操作人的id
    source: {type: String}, //备注remark，主动创建active，被动邀请 passive
    min_web: {type: String}, // 公众号
});

module.exports = mongoose.model('company_traffic', CompanySchema);
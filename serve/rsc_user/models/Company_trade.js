/**
 * Created by Administrator on 2015/11/6 0006.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var CompanySchema = new Schema({
    user_id: {type: String},    //创建这个公司的人的id，创建公司后被清空
    company_id: {type: String},
    full_name: {type: String},  //公司全名
    type: {type: String},       //公司类型
    //has_admin: {type: Boolean, default: true},
    nick_name: {type: String, default: ''}, //正经公司名
    currency: {type: Number, default: 0},
    verify_phase: {type: String, default: 'NO'},//认证状态
    //status: {type: String, default: 'n_n'},
    url_yingyezhizhao: {type: String},
    url_logo: {type: String},

    url_company_bg_img: {type: String},      //企业背景图
    panorama_url:{type: String},              //企业全景看场地址
    url_honor: {type: Array, default: []},    //荣誉图
    //url_culture: {type: Array, default: []},    //文化图
    sell: {type: Array, default: []},    //卖什么
    buy: {type: Array, default: []},    //买什么
    //manage: {type: String},                   //经营品类
    //sub_type: {type: String},                   //子类型如钢铁煤炭
    province: {type: String},        //省
    city: {type: String},            //市
    district: {type: String},//区县
    addr: {type: String},    //详细
    location: {type: [Number]},              //经纬度
    person_count: {type: String},       //公司人数
    join_allow: {type: Boolean, default: true},            //公司描述
    des: {type: String, default: ''},            //公司描述
    //invite_user_id: {type: String, select: false},
    //freeze: {type: Boolean, default: false},  //冻结公司标志
    phone_creator: {type: String},           //公司创建人电话（第一个）
    time_creation: {
        type: Date, default: function () {
            return new Date()
        }
    },
    // comp_invited_id: {type: String},
    // comp_invited_name: {type: String},
    // operator: {type: String},
    // user_price_offer_id: {type: String},
    // is_update: String      //是否添加过理记重量

    //如果有vip,则他发送请求的时候调用另一个包名
    vip: {type: Boolean, default: false},   //公司是否为收费版，默认是false，没有交费
    package_name: {type: String},

    admin_id: {type: String, default: ""},   // 指挥中心带操作人的id
    source: {type: String} //备注remark，主动创建active，被动邀请 passive
});

module.exports = mongoose.model('company_trade', CompanySchema);
/**
 * Created by Administrator on 2015/11/23.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var trafficLine = new Schema({
    user_id: {type:String},         //人id
    company_id: {type:String},      //所属公司id
    role: {type:String},        //人物角色
    money: {type:Number},        //线路价格
    unmoney: {type:Number},        //返程线路价格
    // type:{type: String, default: 'start_end'}, //线路类型
    
    // start_pro_id: {type:String},  //省id
    // start_cit_id: {type:String},      //市id
    // start_dis_id: {type:String},    //区县id
    // end_pro_id: {type:String},  //省id
    // end_cit_id: {type:String},      //市id
    // end_dis_id: {type:String},    //区县id
    start_province: {type:String, default: ''},  //省
    start_city: {type:Array, default: []},      //市
    start_district: {type:Array, default: []},   //区县
    end_province: {type:String, default: ''},    //省
    end_city: {type:Array, default: []},        //市
    end_district: {type:Array, default: []},    //区县

    status: {type:String, default: 'effective'},          //状态
    time_creation: {type:Date, default:function(){return new Date()}}, //创建时间
    time_modify: {type:Date},           //修改时间
    order_count: {type: Number, default:0},    //下单次数
    demand_count: {type: Number, default:0}, //线路指派
    modify_count: {type: Number, default:0},  //修改次数
    cargo: {type: Array, default: []},         //货物清单
    cargo_chn: {type: Array, default: []},         //货物清单
    appendix: {type:String, default: ''},    //备注
    admin_id: {type: String},     //为代操作管理员
    section: {type: Array, default: []},  //区间
    end_section: {type: Array, default: []},  //区间
    unsection: {type: Array, default: []}, //被包含区域
    end_unsection: {type: Array, default: []},  //被包含区域
    view_id: {type: Array, default: []}, //浏览者id
    product_categories : {type:Array, default: []}, //产品详情
    price_chart: {type: Array, default:[]},
    // un_price_chart: {type: Array, default:[]},
    find_category: {type: String}, //查询产品匹配,存放产品链式目录?

}); 

module.exports = mongoose.model('trafficLine', trafficLine);
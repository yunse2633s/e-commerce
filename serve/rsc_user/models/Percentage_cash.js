/**
 * Created by Administrator on 2017/3/24.
 * 表功能：存储提现百分比
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var PercentageCashSchema = new Schema({
    company_id: {type: String, required: true, unique: {index: true}},  //公司
    platform: {type: Number, default: 30},     //平台百分比（默认百分之30）
    //role: {type: Schema.Types.Mixed, required: true},//公司内部员工百分比（按照角色划分）【{role:admin,percentage:50}】
    traffic_employee:{type: Number}, //物流管理员的百分比
    traffic_captain:{type: Number},  //物流队长的百分比
    time_creation: {
        type: Date, default: function () {
            return new Date()
        }
    }
});

//好友邀请：无role、company_id
//同事邀请：全有

module.exports = mongoose.model('Percentage_cash', PercentageCashSchema);
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
  photo: { type: String, default: '' }, // 头像
  name: { type: String, default: '' }, // 姓名
  phone: { type: String, required: true, unique: { index: true } }, // 手机号
  birthDate: { type: Date, default: '' }, // 出生年月
  sex: { type: String, default: '' }, // 性别
  province: { type: String, default: '' }, // 省
  city: { type: String, default: '' }, // 市
  district: { type: String, default: '' }, // 县区
  role: { type: Array, default: [] }, // 角色
  a_role: { type: Array, default: [] }, // 角色
  // 角色一：机关人员 (1)部门(2)职务
  offic_cppccPost: { type: String, default: '' }, // 部门
  cppccPost : { type: String, default: '' }, // 部门
  offic_department: { type: String, default: '' }, // 职务
  department: { type: String, default: '' }, // 职务
  // 角色二：政协委员 (1)工作单位 （2）职务 （3）界别 （4）委员会
  cppcc_company: { type: String, default: '' }, // 工作单位
  cppcc_companyPost: { type: String, default: '' }, // 职务
  cppcc_phyle: { type: String, default: '' }, // 界别
  phyle: { type: String, default: '' }, // 界别
  cppcc_committee: { type: Array, default: [] }, // 委员会
  // 三：工商联（1）部门（2）职务
  cfic_cppccPost: { type: String, default: '' }, // 部门

  cfic_department: { type: String, default: '' }, // 职务

  // 四：民主党派 根据dpg_partisan 将 partisan 字段更新 其他三个角色党为共产党或无
  partisan: { type: String, default: '' }, // 党派
  companyPhone: { type: String, default: '' }, // 单位座机
  address: { type: String, default: '' }, // 通讯地址
  email: { type: String, default: '' }, // 电子邮件
  userRole: { type: String, default: 'CPPCC_MEMBER' }, // 角色
  inviteUserId: { type: String, default: '' }, // 邀请人
  updateTime: { type: Date, default: Date.now }, // 修改时间
  createTime: { type: Date, default: Date.now }, // 创建时间
  score: { type: Number, default: 0 }, // 履职积分
  del: { type: Boolean, default: false }, // 是否删除
});

module.exports = mongoose.model('User', userSchema);
/**
 * Created by Administrator on 2016/5/14.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//user_id��company_idֻ����һ�����������͵�ֻ��user_id����˾���İ���ͬ�£������̶���company_id
var TruckGroupSchema = new Schema({
    user_id: {type:String},     //������id
    company_id: {type:String},  //������˾id
    name: {type:String},        //����
    type: {type:String},        //������
    time_creation: {
        type: Date, default: function () {
            return new Date()
        }
    }
});

module.exports = mongoose.model('relation_group', TruckGroupSchema);
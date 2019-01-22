/**
 * Created by Administrator on 2017/2/13.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//红点提示
var relationshipSchema = new Schema({
    user_id: {type: String, required: true},    // 表单发起者的用户ID。
    user_company_id: String,                    //自己公司的id
    company_id: String,                         //对方公司的id
    update_time: Date,
    type: String,
    number: Number
});

module.exports = mongoose.model('Relationship', relationshipSchema);
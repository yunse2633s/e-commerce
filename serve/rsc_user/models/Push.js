/**
 * Created by Administrator on 2017/2/13.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var pushSchema = new Schema({
    user_id: {type: String},        // 表单发起者的用户ID。
    id: {type: Array},              // 推送id (人的id)
    type: {type: String},           // 推送id类型
    status: {type: String, default: 'effective'},// 状态
    newest: {type: Boolean},        // 最新一条
    time_creation: {
        type: Date, default: function () {
            return new Date();
        }
    }
});

module.exports = mongoose.model('push', pushSchema);
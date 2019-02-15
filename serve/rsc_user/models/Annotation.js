/**
 * Created by Administrator on 2018\6\5 0005.
 * 此表单用于添加个人主页的备注信息
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var AnnotationSchema = new Schema({
    user_id: {type: String},             //个人id
    other_id:{type: String},             //另一个人的id
    content:{type: String},
    time_creation: {
        type: Date, default: function () {
            return new Date()
        }
    }
});

module.exports = mongoose.model('Annotation', AnnotationSchema);

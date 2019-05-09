/**
 * Created by Administrator on 2017/7/13.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ContentSchema = new Schema({
    user_id: {type: String},
    count:{type:Number},
    push:{type:Boolean},
    time_creation: {
        type: Date, default: function () {
            return new Date()
        }
    }   //创建时间
});

module.exports = mongoose.model('push_user', ContentSchema);
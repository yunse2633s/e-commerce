/**
 * Created by Haoran Z on 2016/7/15 0015.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var NoticeSchema = new Schema(
    {
        content:String,
        side:String,
        time_creation:Date                          // 建立时间
    });

module.exports = mongoose.model('Notice',NoticeSchema);
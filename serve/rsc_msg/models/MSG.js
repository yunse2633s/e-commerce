/**
 * Created by Administrator on 2015/12/11 0011.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var MSGSchema = new Schema(
    {
        operator:String,                            // 短信由谁触发
        target:String,                              // 短信的接收者
        template_id: String,                        // 模版ID
        theme:String,                               // 表明此消息的主题
        content:[String],                           // 内容列表
        been_read:{type:Boolean,default:false},    // 是否已读
        url:String,                                 // 可能带的跳专用URL
        time_creation:Date                          // 建立时间
    });

module.exports = mongoose.model('MSG',MSGSchema);
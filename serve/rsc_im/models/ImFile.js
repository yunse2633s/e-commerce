/**
 * Created by Administrator on 2018\2\3 0003.
 * for保存聊天文件
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ImFileSchema = new Schema({
    user_id: {type: String},                    //发送者的id
    other_user_id: {type: String},              //接受者的id
    user_name: {type: String},                  //发送者的名字
    other_user_name: {type: String},            //接受者的名字
    msgType: {type: String},                    //文件类型
    file_url: {type: String},                   //文件在阿里云上的地址
    change_url: {type: String},                 //文件转换后在阿里云上的地址
    change: {type: Boolean, default: false},    //文件是否可以转化
    ext: {type: String},                        //文件后缀名
    size: {type: Number},                       //文件大小
    name: {type: String},                       //文件名
    time_creation: {
        type: Date, default: function () {
            return new Date()
        }
    }   //创建时间
});

module.exports = mongoose.model('ImFile', ImFileSchema);
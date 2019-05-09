/**
 * Created by Administrator on 2017/3/14.
 */

var msgTemplateConfig = require('../configs/config_msg_templates');

var msgDB = require('../db/db_msg');
var msgGetTimeDB = require('../db/db_msg_get_time');

exports.checkContent = function (content, template_id) {
    var template = msgTemplateConfig[template_id];
    if(!template){
        return true;
    }
    return template.element_count != content.length;
};

//增加消息
exports.add = function(data, callback){
    data.content = getContent(data.template_id, data.content);
    data.send_id = data.send_id || '000000000000000000000000';
    msgDB.add(data, callback);
};

//获取单个消息
exports.getOne = function(data, callback){
    msgDB.getOne(data, callback);
};

//编辑单个消息
exports.editOne = function(self, data, callback){
    msgDB.edit(self, data, callback);
};

//获取消息个数
exports.getCount = function(data, callback){
    msgDB.getCount(data, callback);
};

//获取消息个数
exports.getList = function(data, callback){
    msgDB.getList(data, callback);
};

//增加消息
exports.updateGetTime = function(data, callback){
    msgGetTimeDB.upsert(data, callback);
};

//获取一个消息获取时间
exports.getOneGetTime = function(data, callback){
    msgGetTimeDB.getOne(data, callback);
};

//通过模板id和内容拼成字符串
var getContent = function(template_id, content){
    var result = '';
    var template = msgTemplateConfig[template_id];
    var arr = template.content.split('#');
    if(arr.length == 1) {
        result = arr[0];
    } else {
        for(var i = 0; i < arr.length - 1; i++) {
            result += arr[i];
            result += content[i];
        }
        result += arr.pop();
    }
    return result;
};
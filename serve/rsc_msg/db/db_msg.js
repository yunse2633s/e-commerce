/**
 * Created by Administrator on 2017/3/14.
 */

var Message = require('../models/Message');

//增加消息
exports.add = function(data, callback){
    var msg = new Message({
        send_id: data.send_id,
        receive_id: data.receive_id,
        content: data.content
    });
    msg.save(callback);
};

//获取一个数据
exports.edit = function(self, data, callback){
    for(var key in data){
        self[key] = data[key];
    }
    self.save(callback);
};

//获取一个数据
exports.getOne = function(data, callback){
    Message.findOne(data, callback);
};

//获取个数
exports.getCount = function(data, callback){
    Message.count(data, callback);
};

//获取消息个数
exports.getList = function(data, callback){
    if(data.find && data.sort && data.limit && data.skip){
        Message.find(data.find).sort(data.sort).skip(data.skip).limit(data.limit).exec(callback);
    }else if(data.find && data.sort && data.limit){
        Message.find(data.find).sort(data.sort).limit(data.limit).exec(callback);
    }else{
        Message.find(data.find, callback);
    }
};
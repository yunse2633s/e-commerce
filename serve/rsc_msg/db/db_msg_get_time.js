/**
 * Created by Administrator on 2017/3/14.
 */
var MessageGetTime = require('../models/MessageGetTime');

//获取一个数据
exports.getOne = function(data, callback){
    MessageGetTime.findOne(data, callback);
};

//获取一个数据
exports.upsert = function(data, callback){
    MessageGetTime.update(data, {user_id: data.user_id, get_time: new Date()}, {upsert : true}, callback);
};
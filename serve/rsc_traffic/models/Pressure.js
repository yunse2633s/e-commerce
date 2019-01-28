var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var RequestInfoSchema = new Schema({
    server: {type: String},      //请求服务器
    url:    {type: String},      //请求接口
    count:  {type: Number},      //请求次数
    res_time_max: {type: Number},    //最大响应时间
    res_time_min: {type: Number},    //最小响应时间
    res_time_average: {type: Number},    //平均响应时间
    time_update: {type: Date},          //更新时间
    time_creation: {
        type: Date, default: function () {
            return new Date()
        }
    }
});

module.exports = mongoose.model('Pressure', RequestInfoSchema);
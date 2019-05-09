/**
 * Created by Administrator on 2015/12/11 0011.
 */
var MSG = require('../models/MSG');

function getTodayAtZero()
{
    var today = new Date();
    today.setHours(0);
    today.setMinutes(0);
    today.setSeconds(0);
    today.setMilliseconds(0);
    return today;
}

module.exports =
{
    // 移除30天前所有已读信息
    removeAllReadMsg : function()
    {
        var today = getTodayAtZero();

        // 获得今天的毫秒值以及一个月前的毫秒差
        var today_in_ms = today.getTime();
        var diff = 1000 * 60 * 60 * 24 * 30;
        var old_time = new Date(today_in_ms - diff);

        MSG.remove({been_read:true,time_creation:{'$lte':old_time}},function(err)
        {
            if(err)
            {
                console.log('Error occurred when removing all read msg. ' + new Date().toString());
            }
            else
            {
                console.log('Successfully remove all read msg. ' + new Date().toString());
            }
        });
    },
    // 移除某个时间点以前的所有信息，默认为2个月前
    removeOldMsg : function()
    {
        var today = getTodayAtZero();

        // 获得今天的毫秒值以及一个月前的毫秒差
        var today_in_ms = today.getTime();
        var diff = 1000 * 60 * 60 * 24 * 60;
        var old_time_in_ms = today_in_ms - diff;
        var old_time = new Date(old_time_in_ms);

        MSG.remove({time_creation:{'$lte':old_time}},function(err)
        {
            if(err)
            {
                console.log('Error occurred when removing old msg. ' + new Date().toString());
            }
            else
            {
                console.log('Successfully remove old msg. ' + new Date().toString());
            }
        });
    }
};
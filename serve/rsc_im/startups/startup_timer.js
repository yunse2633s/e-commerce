/**
 * Created by Administrator on 2017/4/9.
 */

var CronJob = require('cron').CronJob;
//定时调用，判断时间 按照 cronjob的规则写时间判断
module.exports = function () {
    //这里写的每五秒执行一次
    // new CronJob('*/5 * * * * *', function () {
    //     require('../timers/timer_push_user').push();
    // }, null, true);

    console.log(new Date().toString() + ' ok! ' + __filename.split('/').pop());
};
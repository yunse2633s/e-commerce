/**
 * Created by Administrator on 2017/4/9.
 */

var CronJob = require('cron').CronJob;

module.exports = function(){
    new CronJob('0 0 0 * * *', function () {
        require('../timers/timer_invitation').clearBeforeYestdayInvitation();
    }, null, true);

    console.log(new Date().toString() + ' ok! ' + __filename.split('/').pop());

    //每天凌晨5分开始执行,20分钟执行一次0 5/20 0 * * *
    //*/1 * * * *   每分钟执行一次
    // new CronJob('0 5/20 0 * * *', function () {
    //     // new CronJob('0 */1 * * * *', function () {
    //     require('../timers/timer_day').changePrice();
    // }, null, true);
    // console.log(new Date().toString() + ' ok! ' + __filename.split('/').pop());
};
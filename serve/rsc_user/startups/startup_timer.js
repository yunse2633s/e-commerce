/**
 * Created by Administrator on 2017/4/9.
 */

var CronJob = require('cron').CronJob;

module.exports = function(){
    // new CronJob('0 0 0 * * *', function () {
    //     require('../timers/timer_invitation').clearBeforeYestdayInvitation();
    // }, null, true);
    new CronJob('00 */1 * * * *', function () {
        require('../timers/check').checkIm();
    }, null, true);
    console.log(new Date().toString() + ' ok! ' +__filename.split('/').pop());
};
/**
 * Created by Administrator on 2017/4/9.
 */
var Invitation = require('../models/Invitation');

exports.clearBeforeYestdayInvitation = function(){
    //必须写回调否则不删除
    //The operation is only executed when a callback is passed. To force execution without a callback, you must first call remove() and then execute it by using the exec() method.
    Invitation.remove({time_creation:{$lt:new Date()}}, function(){});
};
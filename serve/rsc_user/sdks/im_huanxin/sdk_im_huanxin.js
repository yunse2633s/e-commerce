/**
 * Created by Administrator on 2017/5/18.
 */

var User = require('./easemob/user');
var ChatHistory = require('./easemob/chatHistory');


var user = new User();
var chatHistory = new ChatHistory();


exports.createUser = function (account, callback) {
    user.createUser(account, '123456', callback);
};

//新增修改环信的用户名
exports.editNickname = function (username, realname, callback) {
    user.editNickname(username, realname, callback);
}

exports.createUsers = function (accounts) {
    //已经存在的会报错，不过不影响新的创建
    for (var i = 0; i < accounts.length; i++) {
        var account = accounts[i];
        this.createUser(account);
    }
    //已经存在的会报错，一个都不会创建成功
    // var arr = [];
    // for(var i = 0; i < accounts.length; i++){
    //     var account = accounts[i];
    //     arr.push({
    //         username: account,
    //         password: '123456'
    //     });
    // }
    // user.createUsers(arr);
};


exports.getChatMessages = function (time) {
    chatHistory.getChatMessages(time);
};
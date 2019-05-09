/**
 * Created by Administrator on 2015/11/6 0006.
 */
var _ = require('underscore');
var jwt = require('jsonwebtoken');

module.exports = {

    token_server_timeout: 10,       //服务器间通讯秘钥超时时间
    entry_per_page: 8,              //每页个数
    file_path: '/temp/',

    secret_keys: {
        user: 'user',
        trade: 'trade',
        traffic: 'traffic',
        invite: 'invite',
        dynamic: 'dynamic',
        admin: 'admin',
        phone: 'phone',
        im:'im'
    },

    im_status: {
        unread: 'unread',       //未读
        effective: 'effective', //有效
        invalid: 'invalid'      //无效（删除的）
    },

    im_type: {
        file: 'file',   //文件
        video: 'video', //视频
        audio: 'audio', //语音
        loc: 'loc',     //地理位置
        txt: 'txt',     //文本
        emoji: 'emoji', //表情
        img: 'img'      //图片
    },

    index_collection: [
        'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j',
        'k', 'm', 'n', 'p', 'q', 'r', 's', 't', 'u', 'v',
        'w', 'x', 'y', 'z', '2', '3', '4', '5', '6', '7',
        '8', '9'
    ],

    user_roles: {
        'TRADE_ADMIN': 'TRADE_ADMIN',
        'TRADE_PURCHASE': 'TRADE_PURCHASE',          //采购
        'TRADE_SALE': 'TRADE_SALE',
        //'TRADE_MANUFACTURE':'TRADE_MANUFACTURE',
        // 'TRADE_FINANCE': 'TRADE_FINANCE',
        // 'TRADE_STORAGE': 'TRADE_STORAGE',
        'TRAFFIC_ADMIN': 'TRAFFIC_ADMIN',
        // 'TRAFFIC_DRIVER_PUBLISH': 'TRAFFIC_DRIVER_PUBLISH'  //公有司机（公司所属）
        'TRAFFIC_DRIVER_PRIVATE': 'TRAFFIC_DRIVER_PRIVATE'   //私人司机（挂靠司机）
    },
    //检查是否是交易角色
    checkTradeCompanyByRole: function (role) {
        return role.indexOf() >= 0;
    },

    // 返回若干位随机码
    getRandomString: function (count) {
        if (isNaN(count)) {
            return '';
        }
        var random = '';
        for (var i = 0; i < count; i++) {
            var s_index = Math.floor(Math.random() * this.index_collection.length);
            random += this.index_collection[s_index];
        }
        return random;
    },

    sendData: function (req, data, next) {
        req.result = data;
        next('success');
    }
};

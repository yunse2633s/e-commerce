/**
 * Created by Administrator on 2015/12/11 0011.
 */
module.exports =
{
    status:'dev',
    token_server_timeout:100000000,
    db:'mongodb://192.168.3.248:27017/rsc_msg',
    system_id: '000000000000000000000000',
    msg_per_request: 1000,
    msg_per_page:5,

    sms_operation:
    {
        url_send:'http://222.73.117.169/msg/HttpBatchSendSM?',
        username:'rishengchangyx',
        password:'Tch123456'
    },

    sms_regular:
    {
        url_send:'http://222.73.117.158/msg/HttpBatchSendSM?',
        username:'rishengchang',
        password:'Tch123456'
    },

    sms_GBK:
    {
        url_send:'http://api.106txt.com/smsUTF8.aspx?action=Send',
        username:412266878,
        password:'412266878',
        gwid:53
    },

    sms_url_send:'http://222.73.117.169/msg/HttpBatchSendSM?',
    sms_username:'rishengchangyx',
    sms_password:'Tch123456',

    sms_regular_url_send:'http://222.73.117.158/msg/HttpBatchSendSM?',
    sms_regular_username:'rishengchang',
    sms_regular_password:'Tch123456',

    servers:
    {
        user:'http://127.0.0.1:18080',
        traffic:'http://127.0.0.1:18081',
        trade:'http://127.0.0.1:18082',
        msg:'http://127.0.0.1:18083',
        finance:'http://127.0.0.1:18084',
        log:'http://127.0.0.1:18085',
        admin:'http://127.0.0.1:18086'
    },

    secret_keys:
    {
        user:'user',
        invite:'invite',
        trade:'trade',
        traffic:'traffic',
        dynamic:'dynamic',
        admin:'admin'
    },
    user_roles :
    {
        'TRADE_ADMIN':'TRADE_ADMIN',
        'TRADE_PURCHASE':'TRADE_PURCHASE',
        'TRADE_SALE':'TRADE_SALE',
        'TRADE_MANUFACTURE':'TRADE_MANUFACTURE',
        'TRADE_FINANCE':'TRADE_FINANCE',
        'TRADE_STORAGE':'TRADE_STORAGE',
        'TRAFFIC_ADMIN':'TRAFFIC_ADMIN',
        'TRAFFIC_DRIVER':'TRAFFIC_DRIVER'
    },
    user_roles_ch :
    {
        'TRADE_ADMIN':'交易超级管理员',
        'TRADE_PURCHASE':'交易采购员',
        'TRADE_SALE':'交易销售员',
        'TRADE_FINANCE':'交易财务负责人',
        'TRADE_STORAGE':'交易仓库管理员',
        'TRAFFIC_ADMIN':'物流超级管理员'
    },

    //msg_range:
    //{
    //    'PERSONAL':'PERSONAL',
    //    'ALL':'ALL',
    //    'TRADE_ADMIN':'TRADE_ADMIN',
    //    'TRADE_PURCHASE':'TRADE_PURCHASE',
    //    'TRADE_SALE':'TRADE_SALE',
    //    'TRADE_MANUFACTURE':'TRADE_MANUFACTURE',
    //    'TRADE_FINANCE':'TRADE_FINANCE',
    //    'TRADE_STORAGE':'TRADE_STORAGE',
    //    'TRAFFIC_ADMIN':'TRAFFIC_ADMIN',
    //    'TRAFFIC_DRIVER':'TRAFFIC_DRIVER'
    //},
    company_category:
    {
        'TRADE':'TRADE',
        'TRAFFIC':'TRAFFIC'
    },

    msg_theme:
    {
        'trade':'trade',
        'traffic':'traffic',
        'finance':'finance',
        'system':'system',
        'verify':'verify',
        'price_ask':'price_ask',
        'price_offer':'price_offer',
        'company':'company'
    },

    sendData:function(req, data, next) {
        req.result = data;
        next('success');
    }

};
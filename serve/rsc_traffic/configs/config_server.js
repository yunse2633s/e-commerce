/**
 * Created by Administrator on 2015/11/16.
 */
var server_config = {
    env: 'dev',                                 //开发环境
    dev:{
        mongodb: 'mongodb://192.168.3.248:27017/rsc_traffic',    //使用数据库地址
        local_server_ip: '192.168.3.248',           //本服务器实际ip
        port: 18081,                                //本服务使用端口
        https_port: 17081,
        user_server_ip: '192.168.3.248',            //账号服务器地址
        traffic_server_ip: '192.168.3.248',            //账号服务器地址
        trade_server_ip: '192.168.3.248',           //交易服务器地址
        finance_server_ip: '192.168.3.248',         //金融服务器地址
        msg_server_ip: '192.168.3.248',             //消息服务器地址
        log_server_ip: '192.168.3.248',             //消息服务器地址
        admin_server_ip: '192.168.3.248',             //后台服务器地址
        dynamic_server_ip: '192.168.3.248',                      //动态服务器地址
        statistical_server_ip: '192.168.3.248',             //统计服务器 //.73
        store_server_ip: '192.168.3.248',             //统计服务器 //.73
        credit_server_ip: '192.168.3.248',                   //信用服务器地址
        
        credit_server_port: 18095,                           //信用服务器端口
        store_server_port: 18090,                             //动态服务器端口
        dynamic_server_port: 18091,                             //动态服务器端口
        user_server_port: 18080,                 //账号服务器端口
        traffic_server_port: 18081,             //物流服务器端口
        trade_server_port: 18082,                //交易服务器端口
        trade_server_port_new: 16082,                //新交易服务器端口
        msg_server_port: 18083,                  //消息服务器端口
        finance_server_port: 18084,              //金融服务器端口
        log_server_port: 18085,                  //消息服务器端口
        admin_server_port: 18086,                  //后台服务器端口
        statistical_server_port: 18088,                  //统计服务器端口
        
        pay_server_ip: '192.168.3.248', //支付地址
        pay_server_port: 18097, //支付接口
        
        file_path:'/temp/',
        file_format : {'jpg': 1, 'jpeg': 1, 'png': 1},
        file_size: 5 * 1024 *1024,
        share_url:'http://192.168.3.248:4000',
        OSS: {
            access_id:'wZ2NKdo8zRXchXpr',
            access_key:'T9ebkKOgyLSqsZx7SnhwViNHnZjAUo',
            bucket_img_url:'rsc-img.oss-cn-beijing.aliyuncs.com',
            bucket_img:'rsc-img'
        },
        amapUrl: 'http://restapi.amap.com/v3',
        amapKey: '16a44fc050cdfe70b8a3bf98b6366f87'
    },
    pro:{
        mongodb: 'mongodb://rscdba:a11111@localhost:27033/rsc_traffic',    //使用数据库地址
        local_server_ip:'60.205.146.53',
        port: 18011,                                //本服务使用端口
        https_port: 17011,
        user_server_ip: '127.0.0.1',            //账号服务器地址
        trade_server_ip: '127.0.0.1',           //交易服务器地址
        traffic_server_ip: '127.0.0.1',         //物流服务器地址
        finance_server_ip: '127.0.0.1',         //金融服务器地址
        msg_server_ip: '127.0.0.1',             //消息服务器地址
        log_server_ip: '127.0.0.1',             //消息服务器地址
        admin_server_ip: '127.0.0.1',             //后台服务器地址
        dynamic_server_ip: '127.0.0.1',                      //动态服务器地址
        statistical_server_ip: '127.0.0.1',             //统计服务器
        store_server_ip: '127.0.0.1',             //统计服务器 //.73
        credit_server_ip: '127.0.0.1',      //信用服务器地址

        credit_server_port: 18025,          //信用服务器端口
        store_server_port: 18020,                             //动态服务器端口
        dynamic_server_port: 18021,                             //动态服务器端口
        user_server_port: 18010,                 //账号服务器端口
        traffic_server_port: 18011,              //物流服务器端口
        trade_server_port: 18012,                //交易服务器端口
        msg_server_port: 18013,                  //消息服务器端口
        finance_server_port: 18014,              //金融服务器端口
        log_server_port: 18015,                  //消息服务器端口
        admin_server_port: 18016,                  //后台服务器端口
        statistical_server_port: 18018,                  //统计服务器端口

        pay_server_ip: '127.0.0.1', //支付地址
        pay_server_port: 18027, //支付接口
        
        file_path:'/temp/',
        file_format : {'jpg': 1, 'jpeg': 1, 'png': 1},
        file_size: 5 * 1024 *1024,
        share_url:'http://www.rsc365.com:4000',
        OSS: {
            access_id:'wZ2NKdo8zRXchXpr',
            access_key:'T9ebkKOgyLSqsZx7SnhwViNHnZjAUo',
            bucket_img_url:'rsc-img.oss-cn-beijing.aliyuncs.com',
            bucket_img:'rsc-img'
        },
        amapUrl: 'http://restapi.amap.com/v3',
        amapKey: '16a44fc050cdfe70b8a3bf98b6366f87'

    },
    demo:{
        mongodb: 'mongodb://rscdba:a11111@localhost:27020/rsc_traffic',    //使用数据库地址
        local_server_ip: '101.200.0.196',           //本服务器实际ip
        port: 18081,                                //本服务使用端口
        https_port: 17081,
        user_server_ip: '127.0.0.1',            //账号服务器地址
        trade_server_ip: '127.0.0.1',           //交易服务器地址
        finance_server_ip: '127.0.0.1',         //金融服务器地址
        msg_server_ip: '127.0.0.1',             //消息服务器地址
        log_server_ip: '127.0.0.1',             //消息服务器地址
        admin_server_ip: '127.0.0.1',             //后台服务器地址
        dynamic_server_ip: '127.0.0.1',                      //动态服务器地址
        statistical_server_ip: '127.0.0.1',             //统计服务器
        dynamic_server_port: 18091,                             //动态服务器端口
        user_server_port: 18080,                 //账号服务器端口
        trade_server_port: 18082,                //交易服务器端口
        msg_server_port: 18083,                  //消息服务器端口
        finance_server_port: 18084,              //金融服务器端口
        log_server_port: 18085,                  //消息服务器端口
        admin_server_port: 18086,                  //后台服务器端口
        statistical_server_port: 18088,                  //统计服务器端口
        file_path:'/temp/',
        file_format : {'jpg': 1, 'jpeg': 1, 'png': 1},
        file_size: 5 * 1024 *1024,
        share_url:'http://www.rsc365.net:4000',
        OSS: {
            access_id:'wZ2NKdo8zRXchXpr',
            access_key:'T9ebkKOgyLSqsZx7SnhwViNHnZjAUo',
            bucket_img_url:'rsc-img.oss-cn-beijing.aliyuncs.com',
            bucket_img:'rsc-img'
        },
        amapUrl: 'http://restapi.amap.com/v3',
        amapKey: '16a44fc050cdfe70b8a3bf98b6366f87'
    },
    test:{
        mongodb: 'mongodb://rscdba:a11111@localhost:27017/rsc_traffic',    //使用数据库地址
        local_server_ip: '101.200.0.196',           //本服务器实际ip
        port: 19081,                                //本服务使用端口
        https_port: 18081,
        user_server_ip: '127.0.0.1',            //账号服务器地址
        trade_server_ip: '127.0.0.1',           //交易服务器地址
        finance_server_ip: '127.0.0.1',         //金融服务器地址
        msg_server_ip: '127.0.0.1',             //消息服务器地址
        log_server_ip: '127.0.0.1',             //消息服务器地址
        admin_server_ip: '127.0.0.1',             //后台服务器地址
        dynamic_server_ip: '127.0.0.1',                      //动态服务器地址
        statistical_server_ip: '127.0.0.1',             //统计服务器
        dynamic_server_port: 19091,                             //动态服务器端口
        user_server_port: 19080,                 //账号服务器端口
        trade_server_port: 19082,                //交易服务器端口
        msg_server_port: 19083,                  //消息服务器端口
        finance_server_port: 19084,              //金融服务器端口
        log_server_port: 19085,                  //消息服务器端口
        admin_server_port: 19086,                  //后台服务器端口
        statistical_server_port: 18088,                  //统计服务器端口
        file_path:'/temp/',
        file_format : {'jpg': 1, 'jpeg': 1, 'png': 1},
        file_size: 5 * 1024 *1024,
        share_url:'http://www.rsc365.net:4999',
        OSS: {
            access_id:'wZ2NKdo8zRXchXpr',
            access_key:'T9ebkKOgyLSqsZx7SnhwViNHnZjAUo',
            bucket_img_url:'rsc-img.oss-cn-beijing.aliyuncs.com',
            bucket_img:'rsc-img'
        },
        amapUrl: 'http://restapi.amap.com/v3',
        amapKey: '16a44fc050cdfe70b8a3bf98b6366f87'
    },
    //数据库 '27040' ，端口为 '2' 开头
    platform: {
        mongodb: 'mongodb://rscdba:a11111@101.200.0.196:27040/rsc_traffic',    //使用数据库地址
        local_server_ip:'127.0.0.1',
        port: 28011,                                //本服务使用端口
        https_port: 27011,
        user_server_ip: '101.200.0.196',            //账号服务器地址
        trade_server_ip: '101.200.0.196',           //交易服务器地址
        traffic_server_ip: '127.0.0.1',         //物流服务器地址
        finance_server_ip: '127.0.0.1',         //金融服务器地址
        msg_server_ip: '127.0.0.1',             //消息服务器地址
        log_server_ip: '127.0.0.1',             //消息服务器地址
        admin_server_ip: '127.0.0.1',             //后台服务器地址
        dynamic_server_ip: '127.0.0.1',                      //动态服务器地址
        statistical_server_ip: '127.0.0.1',             //统计服务器
        store_server_ip: '127.0.0.1',             //统计服务器 //.73
        
        user_server_port: 28010,                 //账号服务器端口
        traffic_server_port: 28011,              //物流服务器端口
        trade_server_port: 28012,                //交易服务器端口
        msg_server_port: 28013,                  //消息服务器端口
        finance_server_port: 28014,              //金融服务器端口
        log_server_port: 28015,                  //消息服务器端口
        admin_server_port: 28016,                  //后台服务器端口
        statistical_server_port: 28018,                  //统计服务器端口
        store_server_port: 28020,                             //动态服务器端口
        dynamic_server_port: 28021,                             //动态服务器端口

        pay_server_ip: '127.0.0.1', //支付地址
        pay_server_port: 28027, //支付接口
        
        file_path:'/temp/',
        file_format : {'jpg': 1, 'jpeg': 1, 'png': 1},
        file_size: 5 * 1024 *1024,
        share_url:'http://www.rsc365.net:4000',
        OSS: {
            access_id:'wZ2NKdo8zRXchXpr',
            access_key:'T9ebkKOgyLSqsZx7SnhwViNHnZjAUo',
            bucket_img_url:'rsc-img.oss-cn-beijing.aliyuncs.com',
            bucket_img:'rsc-img'
        },
        amapUrl: 'http://restapi.amap.com/v3',
        amapKey: '16a44fc050cdfe70b8a3bf98b6366f87'

    }
};
module.exports = server_config[process.env.node_env || 'dev'];
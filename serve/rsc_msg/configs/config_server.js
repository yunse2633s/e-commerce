/**
 * Created by Administrator on 2015/11/16.
 */
var server = {
    env: 'dev',                                 //开发环境
    dev: {
        mongodb: 'mongodb://192.168.3.248:27017/rsc_msg',    //链接数据库地址
        local_server_ip: '192.168.3.248',       //本服务器实际ip
        port: 18083,                                //本服务使用端口
        port_https: 17083,                                //本服务使用端口
        traffic_server_port: 18081,               //物流服务器端口
        trade_server_port: 18082,                   //交易服务器端口
        msg_server_port: 18083,                   //消息服务器端口
        admin_server_port: 18086,                   //后台服务器端口
        user_server_port: 18080,                   //后台服务器端口
        dynamic_server_port: 18091,                          //动态服务器端口

        dynamic_server_ip: '192.168.3.248',                  //动态服务器地址
        user_server_ip: '127.0.0.1',        //后台服务器地址
        admin_server_ip: '192.168.3.248',        //后台服务器地址
        wai_ip: '127.0.0.1',                      //本服务外网地址
        traffic_server_ip: '127.0.0.1',         //物流服务器地址
        msg_server_ip: '192.168.3.248',             //消息服务器地址
        trade_server_ip: '192.168.3.248',             //交易服务器地址
        client_invite_path: '/#/tab/regBase',   //发送短信邀请注册，客户端显示界面路径
        file_path: '/temp/',
        file_format: {'jpg': 1, 'jpeg': 1, 'png': 1},
        file_size: 5 * 1024 * 1024,
        share_url: 'http://192.168.3.248:4000',
        is_sms: true,
        OSS: {
            access_id: 'wZ2NKdo8zRXchXpr',
            access_key: 'T9ebkKOgyLSqsZx7SnhwViNHnZjAUo',
            bucket_img_url: 'rsc-img.oss-cn-beijing.aliyuncs.com',
            bucket_img: 'rsc-img'
        }
    },
    pro: {
        mongodb: 'mongodb://rscdba:a11111@localhost:27033/rsc_msg',    //链接数据库地址
        port: 18013,                                //本服务使用端口
        port_https: 17013,                                //本服务使用端口
        traffic_server_port: 18011,               //物流服务器端口
        trade_server_port: 18012,                   //交易服务器端口
        msg_server_port: 18013,                   //消息服务器端口
        admin_server_port: 18016,                   //后台服务器端口
        user_server_port: 18010,                   //后台服务器端口
        dynamic_server_port: 18021,         //动态服务器端口

        dynamic_server_ip: '127.0.0.1',     //动态服务器地址
        user_server_ip: '127.0.0.1',        //后台服务器地址
        admin_server_ip: '127.0.0.1',        //后台服务器地址
        wai_ip: '60.205.146.53',                 //本服务外网地址
        traffic_server_ip: '127.0.0.1',         //物流服务器地址
        msg_server_ip: '127.0.0.1',             //消息服务器地址
        trade_server_ip: '127.0.0.1',             //交易服务器地址
        client_invite_path: '/#/tab/regBase',   //发送短信邀请注册，客户端显示界面路径
        file_path: '/temp/',
        file_format: {'jpg': 1, 'jpeg': 1, 'png': 1},
        file_size: 5 * 1024 * 1024,
        share_url: 'http://www.rsc365.com:4000',
        is_sms: true,
        OSS: {
            access_id: 'wZ2NKdo8zRXchXpr',
            access_key: 'T9ebkKOgyLSqsZx7SnhwViNHnZjAUo',
            bucket_img_url: 'rsc-img.oss-cn-beijing.aliyuncs.com',
            bucket_img: 'rsc-img'
        }
    },
    demo: {
        mongodb: 'mongodb://rscdba:a11111@localhost:27018/rsc_msg',    //链接数据库地址
        local_server_ip: '101.200.0.196',       //本服务器实际ip
        port: 18083,                                //本服务使用端口
        port_https: 17083,                                //本服务使用端口
        traffic_server_port: 18081,               //物流服务器端口
        trade_server_port: 18082,                   //交易服务器端口
        msg_server_port: 18083,                   //消息服务器端口
        admin_server_port: 18086,                   //后台服务器端口
        user_server_ip: '127.0.0.1',        //后台服务器地址
        admin_server_ip: '127.0.0.1',        //后台服务器地址
        wai_ip: '101.200.0.196',                      //本服务外网地址
        traffic_server_ip: '127.0.0.1',         //物流服务器地址
        msg_server_ip: '127.0.0.1',             //消息服务器地址
        trade_server_ip: '127.0.0.1',             //交易服务器地址
        client_invite_path: '/#/tab/regBase',   //发送短信邀请注册，客户端显示界面路径
        file_path: '/temp/',
        file_format: {'jpg': 1, 'jpeg': 1, 'png': 1},
        file_size: 5 * 1024 * 1024,
        share_url: 'http://www.rsc365.net:4000',
        is_sms: true,
        OSS: {
            access_id: 'wZ2NKdo8zRXchXpr',
            access_key: 'T9ebkKOgyLSqsZx7SnhwViNHnZjAUo',
            bucket_img_url: 'rsc-img.oss-cn-beijing.aliyuncs.com',
            bucket_img: 'rsc-img'
        }
    },
    test: {
        mongodb: 'mongodb://rscdba:a11111@localhost:27017/rsc_msg',    //链接数据库地址
        local_server_ip: '101.200.0.196',       //本服务器实际ip
        port: 19083,                                //本服务使用端口
        port_https: 20083,                                //本服务使用端口
        traffic_server_port: 19081,               //物流服务器端口
        trade_server_port: 19082,                   //交易服务器端口
        msg_server_port: 19083,                   //消息服务器端口
        admin_server_port: 19086,                   //后台服务器端口
        user_server_ip: '127.0.0.1',        //后台服务器地址
        admin_server_ip: '127.0.0.1',        //后台服务器地址
        wai_ip: '101.200.0.196',                      //本服务外网地址
        traffic_server_ip: '127.0.0.1',         //物流服务器地址
        msg_server_ip: '127.0.0.1',             //消息服务器地址
        trade_server_ip: '127.0.0.1',             //交易服务器地址
        client_invite_path: '/#/tab/regBase',   //发送短信邀请注册，客户端显示界面路径
        file_path: '/temp/',
        file_format: {'jpg': 1, 'jpeg': 1, 'png': 1},
        file_size: 5 * 1024 * 1024,
        share_url: 'http://www.rsc365.net:4999',
        is_sms: true,
        OSS: {
            access_id: 'wZ2NKdo8zRXchXpr',
            access_key: 'T9ebkKOgyLSqsZx7SnhwViNHnZjAUo',
            bucket_img_url: 'rsc-img.oss-cn-beijing.aliyuncs.com',
            bucket_img: 'rsc-img'
        }
    },
    platform: {
        mongodb: 'mongodb://rscdba:a11111@localhost:27040/rsc_msg',    //链接数据库地址
        port: 28013,                                //本服务使用端口
        port_https: 27013,                                //本服务使用端口
        traffic_server_port: 28011,               //物流服务器端口
        trade_server_port: 28012,                   //交易服务器端口
        msg_server_port: 28013,                   //消息服务器端口
        admin_server_port: 28016,                   //后台服务器端口
        user_server_port: 28010,                   //后台服务器端口
        dynamic_server_port: 28021,                             //动态服务器端口

        dynamic_server_ip: '127.0.0.1',                      //动态服务器地址
        user_server_ip: '127.0.0.1',        //后台服务器地址
        admin_server_ip: '127.0.0.1',        //后台服务器地址
        wai_ip: '101.200.0.196',                 //本服务外网地址
        traffic_server_ip: '127.0.0.1',         //物流服务器地址
        msg_server_ip: '127.0.0.1',             //消息服务器地址
        trade_server_ip: '127.0.0.1',             //交易服务器地址
        client_invite_path: '/#/tab/regBase',   //发送短信邀请注册，客户端显示界面路径
        file_path: '/temp/',
        file_format: {'jpg': 1, 'jpeg': 1, 'png': 1},
        file_size: 5 * 1024 * 1024,
        share_url: 'http://www.rsc365.com:4000',
        is_sms: true,
        OSS: {
            access_id: 'wZ2NKdo8zRXchXpr',
            access_key: 'T9ebkKOgyLSqsZx7SnhwViNHnZjAUo',
            bucket_img_url: 'rsc-img.oss-cn-beijing.aliyuncs.com',
            bucket_img: 'rsc-img'
        }
    }
};
module.exports = server[process.env.node_env || 'dev'];

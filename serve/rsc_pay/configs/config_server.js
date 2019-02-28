/**
 * Created by Administrator on 2015/11/16.
 */
var data = {
    env: 'dev',                                 //开发环境
    dev: {
        mongodb: 'mongodb://192.168.3.248:27017/rsc_pay',                //链接数据库地址
        local_server_ip: '192.168.3.248',                               //本服务器实际ip
        port: 18097,                                                    //本服务http使用端口
        port_https: 17097,                                               //本服务https使用端口
        traffic_server_port: 18081,                          //物流服务器端口
        trade_server_port: 18082,                            //交易服务器端口
        user_server_port: 18080,                             //账号服务器端口
        msg_server_port: 18083,                              //消息服务器端口


        user_server_ip: '192.168.3.248',                     //账号服务器地址
        traffic_server_ip: '192.168.3.248',                  //账号服务器地址
        trade_server_ip: '192.168.3.248',                    //交易服务器地址
        msg_server_ip: '192.168.3.248',                      //消息服务器地址
    },
    pro: {
        mongodb: 'mongodb://rscdba:a11111@localhost:27035/rsc_pay',      //链接数据库地址
        port: 18027,                                                    //本服务http使用端口
        port_https: 17027,                                               //本服务https使用端口
        traffic_server_port: 18011,                          //物流服务器端口
        trade_server_port: 18012,                            //交易服务器端口
        user_server_port: 18010,                             //账号服务器端口
        msg_server_port: 18013,             //消息服务器端口



        user_server_ip: '127.0.0.1',        //后台服务器地址
        traffic_server_ip: '127.0.0.1',        //物流服务器地址
        trade_server_ip: '127.0.0.1',        //交易服务器地址
        msg_server_ip: '127.0.0.1',         //消息服务器地址

    },
    platform: {
        mongodb: 'mongodb://rscdba:a11111@localhost:27040/rsc_pay',      //链接数据库地址
        port: 28027,                                                    //本服务http使用端口
        port_https: 27027,                                               //本服务https使用端口
        traffic_server_port: 28011,                          //物流服务器端口
        trade_server_port: 28012,                            //交易服务器端口
        user_server_port: 28010,                             //账号服务器端口
        msg_server_port: 28013,          //消息服务器端口

        user_server_ip: '127.0.0.1',        //后台服务器地址
        traffic_server_ip: '127.0.0.1',        //物流服务器地址
        trade_server_ip: '127.0.0.1',        //交易服务器地址
        msg_server_ip: '127.0.0.1',        //消息服务器地址

    },
};

module.exports = data[process.env.node_env || 'dev'];
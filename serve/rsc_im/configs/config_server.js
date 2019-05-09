/**
 * Created by Administrator on 2015/11/16.
 */
var data = {
    env: 'dev',                                 //开发环境
    dev: {
        env: 'dev',
        mongodb: 'mongodb://192.168.3.248:27017/rsc_im',                //链接数据库地址
        local_server_ip: '192.168.3.248',                               //本服务器实际ip
        port: 18092,                                                    //本服务http使用端口
        port_https: 17092,                                              //本服务https使用端口
        user_server_port: 18080,                                        //物流服务器端口
        msg_server_port: 18083,                                 //消息服务器端口
        msg_server_ip: '192.168.3.248',                         //消息服务器地址
        user_server_ip: '192.168.3.248'                                 //后台服务器地址
    },
    pro: {
        env: 'pro',
        mongodb: 'mongodb://rscdba:a11111@localhost:27033/rsc_im',      //链接数据库地址
        port: 18022,                                                    //本服务http使用端口
        port_https: 17022,                                              //本服务https使用端口
        user_server_port: 18010,                                        //物流服务器端口
        msg_server_port: 18013,                                         //消息服务器端口
        msg_server_ip: '127.0.0.1',                                     //消息服务器地址
        user_server_ip: '127.0.0.1'                                     //后台服务器地址
    },
    demo: {
        env: 'demo',
        mongodb: 'mongodb://rscdba:a11111@localhost:27018/rsc_im',      //链接数据库地址
        local_server_ip: '101.200.0.196',                                //本服务器实际ip
        port: 18092,                                                    //本服务使用端口
        port_https: 17092,                                              //本服务使用端口
        user_server_port: 18080,                                        //物流服务器端口
        msg_server_port: 18083,                                         //消息服务器端口
        msg_server_ip: '127.0.0.1',                                     //消息服务器地址
        user_server_ip: '127.0.0.1'                                     //后台服务器地址
    },
    test: {
        env: 'test',
        mongodb: 'mongodb://rscdba:a11111@localhost:27017/rsc_im',      //链接数据库地址
        local_server_ip: '101.200.0.196',                                //本服务器实际ip
        port: 19092,                                                    //本服务使用端口
        port_https: 20092,                                              //本服务使用端口
        user_server_port: 19080,                                       //物流服务器端口
        msg_server_port: 19083,                                         //消息服务器端口
        msg_server_ip: '127.0.0.1',                                     //消息服务器地址
        user_server_ip: '127.0.0.1'                                     //后台服务器地址
    },
    platform: {
        env: 'platform',
        mongodb: 'mongodb://rscdba:a11111@localhost:27040/rsc_im',      //链接数据库地址
        local_server_ip: '101.200.0.196',                               //本服务器实际ip
        port: 28022,                                                    //本服务http使用端口
        port_https: 27022,                                              //本服务https使用端口
        user_server_port: 28010,                                        //物流服务器端口
        msg_server_port: 28013,                                         //消息服务器端口
        msg_server_ip: '127.0.0.1',                                     //消息服务器地址
        user_server_ip: '127.0.0.1'                                     //后台服务器地址
    },
};

module.exports = data[process.env.node_env || 'dev'];

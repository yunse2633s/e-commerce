/**
 * Created by Administrator on 2015/11/16.
 */
var data = {
    env: 'dev',                                 //开发环境
    dev: {
        mongodb: 'mongodb://192.168.3.248:27017/rsc_im',                //链接数据库地址
        local_server_ip: '192.168.3.248',                               //本服务器实际ip
        port: 18094,                                                    //本服务http使用端口
        port_https: 17094                                               //本服务https使用端口
    },
    pro: {
        mongodb: 'mongodb://rscdba:a11111@localhost:27028/rsc_im',      //链接数据库地址
        port: 18024,                                                    //本服务http使用端口
        port_https: 17024                                               //本服务https使用端口
    },
    demo: {
        mongodb: 'mongodb://rscdba:a11111@localhost:27018/rsc_im',      //链接数据库地址
        local_server_ip: '101.200.0.196',                                //本服务器实际ip
        port: 18092,                                                    //本服务使用端口
        port_https: 17092                                               //本服务使用端口
    },
    test: {
        mongodb: 'mongodb://rscdba:a11111@localhost:27017/rsc_im',      //链接数据库地址
        local_server_ip: '101.200.0.196',                                //本服务器实际ip
        port: 19092,                                                    //本服务使用端口
        port_https: 20092                                               //本服务使用端口
    },
    platform: {
        mongodb: 'mongodb://rscdba:a11111@localhost:27040/rsc_im',      //链接数据库地址
        port: 28024,                                                    //本服务http使用端口
        port_https: 27024                                               //本服务https使用端口
    },
};

module.exports = data[process.env.node_env || 'dev'];
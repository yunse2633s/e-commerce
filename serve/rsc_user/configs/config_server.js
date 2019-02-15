/**
 * Created by Administrator on 2015/11/16.
 */
var data = {
    env: 'dev',                                 //��������
    dev: {
        mongodb: 'mongodb://192.168.3.248:27017/rsc_main',      //�������ݿ��ַ
        local_server_ip: '192.168.3.248',                       //��������ʵ��ip
        port: 18080,                                            //������httpʹ�ö˿�
        port_https: 17080,                                      //������httpsʹ�ö˿�
        traffic_server_port: 18081,                             //�����������˿�
        trade_server_port: 18082,                               //���׷������˿�
        trade_server_new_port: 18082,                           //�½��׷������˿�
        msg_server_port: 18083,                                 //��Ϣ�������˿�
        admin_server_port: 18086,                               //��̨�������˿�
        dynamic_server_port: 18091,                             //��̬�������˿�
        phone_server_port: 18089,                               //ͨѶ¼�������˿�
        statistical_server_port: 18088,                         //ͳ�Ʒ������˿�
        im_server_port: 18092,                                     //����������˿�
        im_server_ip: '192.168.3.248',                                 //�����������ַ
        statistical_server_ip: '192.168.3.248',                       //ͳ�Ʒ�������ַ
        phone_server_ip: '192.168.3.248',                       //ͨѶ¼��������ַ
        dynamic_server_ip: '192.168.3.248',                      //��̬��������ַ
        user_server_ip: '127.0.0.1',                            //��̨��������ַ
        admin_server_ip: '192.168.3.248',                       //��̨��������ַ
        wai_ip: '127.0.0.1',                                    //������������ַ
        traffic_server_ip: '192.168.3.248',                         //������������ַ
        msg_server_ip: '192.168.3.248',                         //��Ϣ��������ַ
        trade_server_ip: '192.168.3.248',                       //���׷�������ַ
        client_invite_path: '/#/tab/regBase',                   //���Ͷ�������ע�ᣬ�ͻ�����ʾ����·��
        // file_path: '/temp/',
        // file_format: {'jpg': 1, 'jpeg': 1, 'png': 1},
        // file_size: 5 * 1024 * 1024,
        share_url: 'http://192.168.3.248:4000',
        is_sms: false
        // OSS: {
        //     access_id: 'wZ2NKdo8zRXchXpr',
        //     access_key: 'T9ebkKOgyLSqsZx7SnhwViNHnZjAUo',
        //     bucket_img_url: 'rsc-img.oss-cn-beijing.aliyuncs.com',
        //     bucket_img: 'rsc-img'
        // }
    },
    pro: {
        mongodb: 'mongodb://rscdba:a11111@localhost:27033/rsc_main',    //�������ݿ��ַ
        local_server_ip: '60.205.146.53',                       //��������ʵ��ip
        port: 18010,                                                    //������ʹ�ö˿�
        port_https: 17010,                                              //������ʹ�ö˿�
        traffic_server_port: 18011,                                     //�����������˿�
        trade_server_port: 18012,                                       //���׷������˿�
        trade_server_new_port: 18012,                           //�½��׷������˿�
        msg_server_port: 18013,                                         //��Ϣ�������˿�
        admin_server_port: 18016,                                       //��̨�������˿�
        dynamic_server_port: 18021,                             //��̬�������˿�
        phone_server_port: 18019,                             //ͨѶ¼�������˿�
        statistical_server_port: 18018,                               //ͳ�Ʒ������˿�
        im_server_port: 18022,                                     //����������˿�
        im_server_ip: '127.0.0.1',                                  //�����������ַ
        statistical_server_ip: '127.0.0.1',                       //ͳ�Ʒ�������ַ
        phone_server_ip: '127.0.0.1',                         //ͨѶ¼��������ַ
        dynamic_server_ip: '127.0.0.1',                         //��̬��������ַ
        user_server_ip: '127.0.0.1',                                    //��̨��������ַ
        admin_server_ip: '127.0.0.1',                                   //��̨��������ַ
        wai_ip: '60.205.146.53',                                       //������������ַ
        traffic_server_ip: '127.0.0.1',                                 //������������ַ
        msg_server_ip: '127.0.0.1',                                     //��Ϣ��������ַ
        trade_server_ip: '127.0.0.1',                                   //���׷�������ַ
        client_invite_path: '/#/tab/regBase',                           //���Ͷ�������ע�ᣬ�ͻ�����ʾ����·��
        // file_path: '/temp/',
        // file_format: {'jpg': 1, 'jpeg': 1, 'png': 1},
        // file_size: 5 * 1024 * 1024,
        share_url: 'http://www.rsc365.com:4000',
        is_sms: true
        // OSS: {
        //     access_id: 'wZ2NKdo8zRXchXpr',
        //     access_key: 'T9ebkKOgyLSqsZx7SnhwViNHnZjAUo',
        //     bucket_img_url: 'rsc-img.oss-cn-beijing.aliyuncs.com',
        //     bucket_img: 'rsc-img'
        // }
    },
    demo: {
        mongodb: 'mongodb://rscdba:a11111@localhost:27018/rsc_main',    //�������ݿ��ַ
        local_server_ip: '101.200.0.196',                                //��������ʵ��ip
        port: 18080,                                                    //������ʹ�ö˿�
        port_https: 17080,                                              //������ʹ�ö˿�
        traffic_server_port: 18081,                                     //�����������˿�
        trade_server_port: 18082,                                       //���׷������˿�
        trade_server_new_port: 18082,                           //�½��׷������˿�
        msg_server_port: 18083,                                         //��Ϣ�������˿�
        admin_server_port: 18086,                                       //��̨�������˿�
        dynamic_server_port: 18091,                             //��̬�������˿�
        phone_server_port: 18089,                             //ͨѶ¼�������˿�
        statistical_server_port: 18088,                               //ͳ�Ʒ������˿�
        im_server_port: 18092,                                     //����������˿�
        im_server_ip: '127.0.0.1',                                  //�����������ַ
        statistical_server_ip: '127.0.0.1',                       //ͳ�Ʒ�������ַ
        phone_server_ip: '127.0.0.1',                         //ͨѶ¼��������ַ
        dynamic_server_ip: '127.0.0.1',                         //��̬��������ַ
        user_server_ip: '127.0.0.1',                                    //��̨��������ַ
        admin_server_ip: '127.0.0.1',                                   //��̨��������ַ
        wai_ip: '101.200.0.196',                                         //������������ַ
        traffic_server_ip: '127.0.0.1',                                 //������������ַ
        msg_server_ip: '127.0.0.1',                                     //��Ϣ��������ַ
        trade_server_ip: '127.0.0.1',                                   //���׷�������ַ
        client_invite_path: '/#/tab/regBase',                           //���Ͷ�������ע�ᣬ�ͻ�����ʾ����·��
        // file_path: '/temp/',
        // file_format: {'jpg': 1, 'jpeg': 1, 'png': 1},
        // file_size: 5 * 1024 * 1024,
        share_url: 'http://www.rsc365.net:4000',
        is_sms: false
        // OSS: {
        //     access_id: 'wZ2NKdo8zRXchXpr',
        //     access_key: 'T9ebkKOgyLSqsZx7SnhwViNHnZjAUo',
        //     bucket_img_url: 'rsc-img.oss-cn-beijing.aliyuncs.com',
        //     bucket_img: 'rsc-img'
        // }
    },
    test: {
        mongodb: 'mongodb://rscdba:a11111@localhost:27017/rsc_main',    //�������ݿ��ַ
        local_server_ip: '101.200.0.196',                                //��������ʵ��ip
        port: 19080,                                                    //������ʹ�ö˿�
        port_https: 20080,                                              //������ʹ�ö˿�
        traffic_server_port: 19081,                                     //�����������˿�
        trade_server_port: 19082,                                       //���׷������˿�
        trade_server_new_port: 19082,                           //�½��׷������˿�
        msg_server_port: 19083,                                         //��Ϣ�������˿�
        admin_server_port: 19086,                                       //��̨�������˿�
        dynamic_server_port: 19091,                             //��̬�������˿�
        phone_server_port: 19089,                             //ͨѶ¼�������˿�
        statistical_server_port: 19088,                               //ͳ�Ʒ������˿�
        im_server_port: 19092,                                     //����������˿�
        im_server_ip: '127.0.0.1',                                  //�����������ַ
        statistical_server_ip: '127.0.0.1',                       //ͳ�Ʒ�������ַ
        phone_server_ip: '127.0.0.1',                         //ͨѶ¼��������ַ
        dynamic_server_ip: '127.0.0.1',                         //��̬��������ַ
        user_server_ip: '127.0.0.1',                                    //��̨��������ַ
        admin_server_ip: '127.0.0.1',                                   //��̨��������ַ
        wai_ip: '101.200.0.196',                                         //������������ַ
        traffic_server_ip: '127.0.0.1',                                 //������������ַ
        msg_server_ip: '127.0.0.1',                                     //��Ϣ��������ַ
        trade_server_ip: '127.0.0.1',                                   //���׷�������ַ
        client_invite_path: '/#/tab/regBase',                           //���Ͷ�������ע�ᣬ�ͻ�����ʾ����·��
        // file_path: '/temp/',
        // file_format: {'jpg': 1, 'jpeg': 1, 'png': 1},
        // file_size: 5 * 1024 * 1024,
        share_url: 'http://www.rsc365.net:4999',
        is_sms: true
        // OSS: {
        //     access_id: 'wZ2NKdo8zRXchXpr',
        //     access_key: 'T9ebkKOgyLSqsZx7SnhwViNHnZjAUo',
        //     bucket_img_url: 'rsc-img.oss-cn-beijing.aliyuncs.com',
        //     bucket_img: 'rsc-img'
        // }
    },
    platform: {
        mongodb: 'mongodb://rscdba:a11111@localhost:27040/rsc_main',    //�������ݿ��ַ
        local_server_ip: '101.200.0.196',                       //��������ʵ��ip
        port: 28010,                                                    //������ʹ�ö˿�
        port_https: 27010,                                              //������ʹ�ö˿�
        traffic_server_port: 28011,                                     //�����������˿�
        trade_server_port: 28012,                                       //���׷������˿�
        trade_server_new_port: 28012,                           //�½��׷������˿�
        msg_server_port: 28013,                                         //��Ϣ�������˿�
        admin_server_port: 28016,                                       //��̨�������˿�
        dynamic_server_port: 28021,                             //��̬�������˿�
        phone_server_port: 28019,                             //ͨѶ¼�������˿�
        statistical_server_port: 28018,                               //ͳ�Ʒ������˿�
        im_server_port: 28022,                                     //����������˿�
        im_server_ip: '127.0.0.1',                                  //�����������ַ
        statistical_server_ip: '127.0.0.1',                       //ͳ�Ʒ�������ַ
        phone_server_ip: '127.0.0.1',                         //ͨѶ¼��������ַ
        dynamic_server_ip: '127.0.0.1',                         //��̬��������ַ
        user_server_ip: '127.0.0.1',                                    //��̨��������ַ
        admin_server_ip: '127.0.0.1',                                   //��̨��������ַ
        wai_ip: '101.200.0.196',                                       //������������ַ
        traffic_server_ip: '127.0.0.1',                                 //������������ַ
        msg_server_ip: '127.0.0.1',                                     //��Ϣ��������ַ
        trade_server_ip: '127.0.0.1',                                   //���׷�������ַ
        client_invite_path: '/#/tab/regBase',                           //���Ͷ�������ע�ᣬ�ͻ�����ʾ����·��
        // file_path: '/temp/',
        // file_format: {'jpg': 1, 'jpeg': 1, 'png': 1},
        // file_size: 5 * 1024 * 1024,
        share_url: 'http://www.rsc365.com:4000',
        is_sms: true
        // OSS: {
        //     access_id: 'wZ2NKdo8zRXchXpr',
        //     access_key: 'T9ebkKOgyLSqsZx7SnhwViNHnZjAUo',
        //     bucket_img_url: 'rsc-img.oss-cn-beijing.aliyuncs.com',
        //     bucket_img: 'rsc-img'
        // }
    },
};
module.exports = data[process.env.node_env || 'dev'];

/**
 * Created by Administrator on 2017/4/18.
 */
var JPush = require('jpush-sdk');

var apps = {
    // 'com.rsc365.rsc': {
    //     appKey: '94910a21122a507c03f03bc5',         //ionic正式
    //     masterSecret: 'bf0cfda9bc8432fb8a100084'
    // },
    // 'com.rsc365.test': {
    //     appKey: 'f86b7639cba60d0a5392efec',         //ionic测试
    //     masterSecret: 'd62009fb1cbbb512e3cad756'
    // },
    // // 'com.rsc.driver': {
    // //     appKey: '44b0da113b0a04cd22d76b1a',         //ios(和android共用一个应用)
    // //     masterSecret: '94651c9f912914a12e3922bc'
    // // },
    'com.rsc.android_driver': {
        appKey: '44b0da113b0a04cd22d76b1a',         //android(和ios共用一个应用)
        masterSecret: '94651c9f912914a12e3922bc'
    },
    //
    // //正式服
    // 'com.rsc.pass': {
    //     appKey: '58756caf3662946008418682',         //天下物流
    //     masterSecret: '87b31cff01991f5ef65adb5e'
    // },
    // 'com.rsc.driver': {
    //     appKey: '44b0da113b0a04cd22d76b1a',         //天下货运
    //     masterSecret: '94651c9f912914a12e3922bc'
    // },
    // 'com.rsc.rsc': {
    //     appKey: 'c972853df8d534b79857edfa',         //日升昌
    //     masterSecret: 'b22487fea074bf213ddb76d1'
    // },
    // 'com.rsc.admin': {
    //     appKey: '5177a7ecc005e529058596fc',         //运营指挥中心
    //     masterSecret: '6861a7d9c6a72fd33445daff'
    // },
    // 'com.rsc.calculation': {
    //     appKey: 'fa7921552aba6c3ce2022f05',         //日计算
    //     masterSecret: '7e9592993c298643a3efed30'
    // },

    //下个版本可以删除的包名
    'com.rsc.lumingyuan': {
        appKey: '84ae55491f7a2b59cea7051d',         //鹿鸣苑企业版
        masterSecret: '84e65fb852a22fb562f33611'
    },

    //正在服役的包名
    'com.rsc.tradecenter': {
        appKey: 'd0491255dd99ab155fc331a6',         //贸易中心
        masterSecret: '111c7c33e93338cef4ce26dc'
    },
    'com.rsc.dispatcenter': {
        appKey: '2c1c6ff3df942b7a806f6c90',         //调度中心--下个版本可删除
        masterSecret: '529115696fdc15c54d656592'
    },
    'com.rsc.business': {
        appKey: 'c999b1a3041058b6d4812a01',         //运输中心
        masterSecret: '7ae8c1b79b220648c80fc485'
    },
    'com.rsc.drivercenter': {
        appKey: '21153dcee9e981bedfe91590',         //司机中心
        masterSecret: 'a3ae0186d7ce26f5b93c3234'
    },
    'com.rsc.warehousecenter': {
        appKey: 'd502cb5cfe9e274d74ed83d0',         //仓库中心
        masterSecret: 'dced8dd38d7b95df39823c19'
    },
    'com.zgy365.zgy': {
        appKey: 'aa4460c52a36683ab3df6075',         //中钢云
        masterSecret: 'bba675eaf4d853f1fedf46e3'
    },
    'com.sinosteel.logistics': {
        appKey: '25096d5b1f442e8e211e2828',         //中钢云->物流
        masterSecret: 'b96e09f6007dd54c9ced8b2c'
    },
    'com.sinosteel.warehouse': {
        appKey: '3bb5e5b7307d988013ae8806',         //中钢云->仓库
        masterSecret: 'c4599ca2cfa161691b0893ac'
    },
    'com.sinosteel.vehicles': {
        appKey: 'd95dbc659268096b7f1c9086',         //中钢云->司机
        masterSecret: 'e6f362e8c0a58c2b664bba59'
    },
    'sinosteel.logistics.center': {
        appKey: '8d03ea953ab5c4437451314a',         //中钢云->物流 ！新！
        masterSecret: 'd55b4cbba190e9e7f068da3e'
    },
    'com.xinhuiyun.trade': {
        appKey: '3b4f2885a5b9e8e77815f320',         //鑫汇云->交易 ！新！
        masterSecret: '57c0e41882b0aec601527f93'
    }
};

var clientObj = {};
for (var key in apps) {
    var app = apps[key];
    var client = JPush.buildClient(app.appKey, app.masterSecret, null, false);
    clientObj[key] = client;
}

exports.push = function (data, package_name, reg_ids) {
    try {
        var client = clientObj[package_name];
        if (client) {
            client.push()
                .setPlatform('ios', 'android')
                .setAudience(JPush.registration_id(reg_ids))
                .setNotification(data.title,
                    JPush.ios(data.content, data.title, null, true, JSON.parse(data.data || '{}')),
                    JPush.android(data.content, data.title, 1, JSON.parse(data.data || '{}')))
                // .setMessage(JSON.stringify(data.data || {}))
                .setOptions(null, null, null, process.env.node_env === 'pro')
                .send(function (err, res) {
                    if (err) {
                        console.error(err.message);
                    }
                });
        } else {
            console.error('err:not_package_name');
        }
    } catch (err) {
        console.log(err);
    }
};

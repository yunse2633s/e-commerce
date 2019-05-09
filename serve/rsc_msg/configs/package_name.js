/**
 * Created by Administrator on 2018\3\8 0008.
 */
module.exports = {
    //短信的标题
    title: {
        //交易
        'com.rsc.tradecenter': '互联网+',        //贸易中心
        'com.zgy365.zgy': '中钢云',              //中钢云
        'com.xinhuiyun.trade': '鑫汇云',              //中钢云
        //物流
        'com.rsc.business': '互联网+',           //运输中心
        'sinosteel.logistics.center': '中钢云',  //中钢云物流
        //仓库
        'com.rsc.warehousecenter': '互联网+',     //仓储中心
        'sinosteel.warehouse.center': '中钢云',   //中钢云物流
        //司机
        'com.rsc.android_driver': '互联网+',      //司机中心-安卓
        'com.rsc.drivercenter': '互联网+',        //司机中心-苹果
        'com.sinosteel.vehicles': '中钢云',       //中钢云司机-安卓
        'sinosteel.vehicles.center': '中钢云',    //中钢云司机-苹果
        'com.xinhuiyun.trade': '鑫汇云'
    },
    //短信的链接
    // 1:交易的地址；
    // 2：物流的地址；
    // 3：仓库的地址；
    // 4:司机的地址
    // 5:all
    // 6:对应的app名称
    // 9：验证码 文字替换
    link: {
        //鑫汇云
        'com.xinhuiyun.trade_1': "xinhuiyun.sinosteel.cc",
        'com.xinhuiyun.trade_2': "logistics.e-wto.com",
        'com.xinhuiyun.trade_3': "warehouse.e-wto.com",
        'com.xinhuiyun.trade_4': "vehicles.e-wto.com",
        'com.xinhuiyun.trade_5':'交易请登录xinhuiyun.sinosteel.cc,仓储请登录warehouse.e-wto.com,物流请登录logistics.e-wto.com,司机请登录vehicles.e-wto.com',
        'com.xinhuiyun.trade_6': "鑫汇云",
        'com.xinhuiyun.trade_9': "鑫汇云携手运输中心、仓储中心、司机中心",
        'com.xinhuiyun.trade_10': "driver.e-wto.com",

        //贸易中心
        'com.rsc.tradecenter_1': "www.e-wto.com",
        'com.rsc.tradecenter_2': "logistics.e-wto.com",
        'com.rsc.tradecenter_3': "warehouse.e-wto.com",
        'com.rsc.tradecenter_4': "vehicles.e-wto.com",
        'com.rsc.tradecenter_5':'交易请登录www.e-wto.com,仓储请登录warehouse.e-wto.com,物流请登录logistics.e-wto.com,司机请登录vehicles.e-wto.com',
        'com.rsc.tradecenter_6': "贸易中心",
        'com.rsc.tradecenter_9': "贸易中心携手运输中心、仓储中心、司机中心",
        //运输中心
        'com.rsc.business_1': "www.e-wto.com",
        'com.rsc.business_2': "logistics.e-wto.com",
        'com.rsc.business_3': "warehouse.e-wto.com",
        'com.rsc.business_4': "vehicles.e-wto.com",
        'com.rsc.business_5':'交易请登录www.e-wto.com,仓储请登录warehouse.e-wto.com,物流请登录logistics.e-wto.com,司机请登录vehicles.e-wto.com',
        'com.rsc.business_6': "运输中心",
        'com.rsc.business_9': "贸易中心携手运输中心、仓储中心、司机中心",
        //仓储中心
        'com.rsc.warehousecenter_1': "www.e-wto.com",
        'com.rsc.warehousecenter_2': "logistics.e-wto.com",
        'com.rsc.warehousecenter_3': "warehouse.e-wto.com",
        'com.rsc.warehousecenter_4': "vehicles.e-wto.com",
        'com.rsc.warehousecenter_5':'交易请登录www.e-wto.com,仓储请登录warehouse.e-wto.com,物流请登录logistics.e-wto.com,司机请登录vehicles.e-wto.com',
        'com.rsc.warehousecenter_6': "仓储中心",
        'com.rsc.warehousecenter_9': "贸易中心携手运输中心、仓储中心、司机中心",
        //司机中心
        'com.rsc.android_driver_1': "www.e-wto.com",
        'com.rsc.android_driver_2': "logistics.e-wto.com",
        'com.rsc.android_driver_3': "warehouse.e-wto.com",
        'com.rsc.android_driver_4': "vehicles.e-wto.com",
        'com.rsc.android_driver_5':'交易请登录www.e-wto.com,仓储请登录warehouse.e-wto.com,物流请登录logistics.e-wto.com,司机请登录vehicles.e-wto.com',
        'com.rsc.android_driver_6': "司机中心",
        'com.rsc.android_driver_9': "贸易中心携手运输中心、仓储中心、司机中心",
        'com.rsc.drivercenter_1': "www.e-wto.com",
        'com.rsc.drivercenter_2': "logistics.e-wto.com",
        'com.rsc.drivercenter_3': "warehouse.e-wto.com",
        'com.rsc.drivercenter_4': "vehicles.e-wto.com",
        'com.rsc.drivercenter_5':'交易请登录www.e-wto.com,仓储请登录warehouse.e-wto.com,物流请登录logistics.e-wto.com,司机请登录vehicles.e-wto.com',
        'com.rsc.drivercenter_6': "司机中心",
        'com.rsc.drivercenter_9': "贸易中心携手运输中心、仓储中心、司机中心",
        //中钢云-交易
        'com.zgy365.zgy_1': "trade.sinosteel.cc",
        'com.zgy365.zgy_2': "logistics.sinosteel.cc",
        'com.zgy365.zgy_3': "warehouse.sinosteel.cc",
        'com.zgy365.zgy_4': "vehicles.sinosteel.cc",
        'com.zgy365.zgy_5':'交易请登录www.e-wto.com,仓储请登录warehouse.e-wto.com,物流请登录logistics.e-wto.com,司机请登录vehicles.e-wto.com',
        'com.zgy365.zgy_6': "中钢云",
        'com.zgy365.zgy_9': "中钢云携手运输中心、仓储中心、司机中心",
        //中钢云-运输
        'sinosteel.logistics.center_1': "trade.sinosteel.cc",
        'sinosteel.logistics.center_2': "logistics.sinosteel.cc",
        'sinosteel.logistics.center_3': "warehouse.sinosteel.cc",
        'sinosteel.logistics.center_4': "vehicles.sinosteel.cc",
        'sinosteel.logistics.center_5':'交易请登录www.sinosteel.cc,仓储请登录warehouse.e-wto.com,物流请登录logistics.e-wto.com,司机请登录vehicles.e-wto.com',
        'sinosteel.logistics.center_6': "中钢云-运输",
        'sinosteel.logistics.center_9': "中钢云携手运输中心、仓储中心、司机中心",
        //中钢云-仓储
        'sinosteel.warehouse.center_1': "trade.sinosteel.cc",
        'sinosteel.warehouse.center_2': "logistics.sinosteel.cc",
        'sinosteel.warehouse.center_3': "warehouse.sinosteel.cc",
        'sinosteel.warehouse.center_4': "vehicles.sinosteel.cc",
        'sinosteel.warehouse.center_5':'交易请登录www.sinosteel.cc,仓储请登录warehouse.e-wto.com,物流请登录logistics.e-wto.com,司机请登录vehicles.e-wto.com',
        'sinosteel.warehouse.center_6': "中钢云-仓储",
        'sinosteel.warehouse.center_9': "中钢云携手运输中心、仓储中心、司机中心",
        //中钢云-司机
        'com.sinosteel.vehicles_1': "trade.sinosteel.cc",
        'com.sinosteel.vehicles_2': "logistics.sinosteel.cc",
        'com.sinosteel.vehicles_3': "warehouse.sinosteel.cc",
        'com.sinosteel.vehicles_4': "vehicles.sinosteel.cc",
        'com.sinosteel.vehicles_5':'交易请登录www.sinosteel.cc,仓储请登录warehouse.e-wto.com,物流请登录logistics.e-wto.com,司机请登录vehicles.e-wto.com',
        'com.sinosteel.vehicles_6': "中钢云-司机",
        'com.sinosteel.vehicles_9': "中钢云携手运输中心、仓储中心、司机中心",
        'sinosteel.vehicles.center_1': "trade.sinosteel.cc",
        'sinosteel.vehicles.center_2': "logistics.sinosteel.cc",
        'sinosteel.vehicles.center_3': "warehouse.sinosteel.cc",
        'sinosteel.vehicles.center_4': "vehicles.sinosteel.cc",
        'sinosteel.vehicles.center_5':'交易请登录www.sinosteel.cc,仓储请登录warehouse.e-wto.com,物流请登录logistics.e-wto.com,司机请登录vehicles.e-wto.com',
        'sinosteel.vehicles.center_6': "中钢云-司机",
        'sinosteel.vehicles.center_9': "中钢云携手运输中心、仓储中心、司机中心",
    }
};
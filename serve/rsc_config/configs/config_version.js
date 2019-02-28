/**
 * Created by Administrator on 2018\1\16 0016.
 */
module.exports = {
    version: '6.1.7',
    is_forced: 1,  //0 ，1表示强制更新

    //交易、中钢云更新内容
    rsc_version_dec: "" +
    "1、开通商业智能处增加提醒设置区域文字；" + "\<br>" +
    "2、价格、吨数数字显示规则修改；" + "\<br>" +
    "3、修改重量文字显示；" + "\<br>" +
    "4、报价行情文字修改；" + "\<br>" +
    "5、注册页面自定义产品改为‘不限制’；" + "\<br>" +
    "6、分享个人名片修改；" + "\<br>" +
    "7、物流公众号运输进度增加下载提示；" + "\<br>" +
    "8、修复若干bug；" + "\<br>" ,

    //运输中心、中钢云物流更新内容
    traffic_version_dec: "" +
    "1.货源进行中的指派详情里面详情页同步" + "\<br>" +
    "2.立即接单弹出框发布线路页，自动显示地址" + "\<br>" +
    "3.指派车辆页显示调整" + "\<br>" +
    "4.车辆详情页下面的“补货”去掉" + "\<br>" +
    "5.货源详情页标题“指派详情”改为“货源订单" + "\<br>" +
    "6.货源详情页新增指派车辆详情入口" + "\<br>" +
    "7.发布司机运输选择提货起始时间时新增提示" + "\<br>" +
    "8.车辆已发布的指派详情页标题修改" + "\<br>" +
    "9.注册选择常运货物时，“自定义”改为“不限制”" + "\<br>" +
    "10.价格 和 吨数 显示规则调整" + "\<br>" +
    "11.物流公众号业务增加文字显示" + "\<br>" +
    "12.发布运输需求页面文字调整" + "\<br>" +
    "13.分享到微信的文字调整" + "\<br>" ,

    //仓储中心，中钢云仓储更新内容
    storage_version_dec: "" +
    "1.修复提、交货进度条显示错误的bug" + "\<br>" +
    "2.优化提交货过磅流程",

    //司机，中钢云车辆更新内容
    driver_version_dec: "" +
    "1.优化线路筛选出发地，到达地" + "\n" +
    "2.新增线路详情的走势图，显示去程和回程两条走势线" + "\n" +
    "3.新增商业智能按出发到达地进行实时推荐" + "\n" +
    "4.修复已知BUG",

    //信用中心跟新内容
    credit_version_dec: "" +
    "1.优化用户体验" + "\<br>" +
    "2.提升产品质量",

    //贸易中心
    'com.rsc.tradecenter': function () {
        return ({
            version: this.version,
            rsc_version_dec: this.rsc_version_dec,
            is_forced: this.is_forced,
            download: 'http://support.e-wto.com/download/trade.apk'
        })
    },
    //鑫汇云定制版
    'com.xinhuiyun.trade': function () {
        return ({
            version: '6.1.3',
            rsc_version_dec: this.rsc_version_dec,
            is_forced: this.is_forced,
            download: 'http://support.sinosteel.cc/download/xhy-trade.apk'
        })
    },
    //调度中心
    'com.rsc.dispatcenter': function () {
        return ({
            version: this.version,
            traffic_version_dec: this.traffic_version_dec,
            is_forced: this.is_forced,
            download: 'http://support.e-wto.com/download/traffic.apk'
        })
    },
    //调度中心-新
    'com.rsc.business': function () {
        return ({
            version: this.version,
            traffic_version_dec: this.traffic_version_dec,
            is_forced: this.is_forced,
            download: 'http://support.e-wto.com/download/traffic.apk'
        })
    },
    //仓库中心
    'com.rsc.warehousecenter': function () {
        return ({
            version: '6.0.1',
            storage_version_dec: this.storage_version_dec,
            is_forced: this.is_forced,
            download: 'http://support.e-wto.com/download/storage.apk'
        })
    },
    //司机中心安卓包名
    'com.rsc.android_driver': function () {
        return ({
            version: '6.1.8',
            driver_version_dec: this.driver_version_dec,
            is_forced: this.is_forced,
            download: 'http://support.e-wto.com/download/driver.apk'
        })
    },
    //司机中心IOS包名
    'com.rsc.drivercenter': function () {
        return ({
            version: this.version,
            driver_version_dec: this.driver_version_dec,
            is_forced: this.is_forced,
            download: 'http://support.e-wto.com/download/driver.apk'
        })
    },
    //信用中心
    'com.rsc.trankcenter': function () {
        return ({
            version: '5.3.6',
            credit_version_dec: this.credit_version_dec,
            is_forced: this.is_forced,
            download: 'http://support.e-wto.com/download/credit.apk'
        })
    },
    //中钢云
    'com.zgy365.zgy': function () {
        return ({
            version: this.version,
            rsc_version_dec: this.rsc_version_dec,
            is_forced: this.is_forced,
            download: 'http://support.sinosteel.cc/download/zgy-trade.apk'
        })
    },
    //中钢云->物流
    'com.sinosteel.logistics': function () {
        return ({
            version: this.version,
            traffic_version_dec: this.traffic_version_dec,
            is_forced: this.is_forced,
            download: 'http://support.sinosteel.cc/download/zgy-traffic.apk'
        })
    },

    //中钢云->仓库
    'com.sinosteel.warehouse': function () {
        return ({
            version: this.version,
            storage_version_dec: this.storage_version_dec,
            is_forced: this.is_forced,
            download: 'http://support.sinosteel.cc/download/zgy-storage.apk'
        })
    },
    //中钢云->司机
    'com.sinosteel.vehicles': function () {
        return ({
            version: this.version,
            driver_version_dec: this.driver_version_dec,
            is_forced: this.is_forced,
            download: 'http://support.sinosteel.cc/download/zgy-driver.apk'
        })
    }
};
/**
 * Created by Administrator on 2017\12\9 0009.
 */
var _ = require('underscore');
var jwt = require('jsonwebtoken');
var configCity = require('./config_city');
var configProvince = require('./config_province');
var configDistrict = require('./config_district');

module.exports = {
    password_new:'7e4a014d38',
    password: '111111',
    yunXin_token: 'a11111',
    verify_codes_timeout: 10 * 60 * 1000,   //验证码超时时间
    verify_codes_resend: 20 * 1000,         //验证码重发时间
    token_invite_timeout: 60 * 60 * 1000,   //用户秘钥超时时间
    token_server_timeout: 10000,           //服务器间通讯秘钥超时时间
    invitation_timeout: 24 * 60 * 60 * 1000,   //邀请有效时间,
    driver_re_applay_timeout: 24 * 60 * 60 * 1000,   //挂靠司机再次申请时间间隔
    driver_apply_verify_count: 200,     //挂靠司机申请认证最多200家

    company_relation_trade: 100,        //公司关系交易最大
    company_relation_traffic: 200,      //公司关系物流最大
    company_relation_apply_resend_msg: 24 * 60 * 60 * 1000,   //公司申请再次发送消息提醒时间间隔

    company_honor_picture_count: 8, //公司荣誉图片个数
    company_culture_picture_count: 8, //公司文化图片个数
    line_number: 30,    //线路数量

    company_private_truck_number: 1000, //公司最多挂靠司机数量

    demand_company_recommend: 10,    //需求单里系统推荐企业数

    self_setting_private_driver_count: 10,   //挂靠司机个人设置数
    //self_setting_verify_count: 3,           //认证公司人员系统推荐设置数量
    //self_setting_not_verify_count: 1,       //未认证公司人员系统推荐设置数量

    system_recommend_company_driver: 3,           //挂靠司机获得系统推荐公司数量
    system_recommend_company_purchase: 3,           //管理员获得系统推荐公司数量
    system_recommend_company_admin: 3,              //管理员获得系统推荐公司数量
    system_recommend_company_sale: 3,               //销售获得系统推荐公司数量
    system_recommend_demand_traffic: 3,              //物流公司获取推荐需求单数量
    system_recommend_demand_trade: 3,               //交易公司获取推荐需求单数量
    system_recommend_driver_demand_driver: 3,      //挂靠司机获取推荐需求单数量

    company_setting_verify_count: 100,       //认证公司设置购买销售种类数量
    company_setting_not_verify_count: 100,   //未认证公司设置购买销售种类数量

    entry_per_page: 10,                      //采购单每页给十个

    phone_book_group_count: 10, //通讯录组个数
    phone_book_count: 100, //通讯录每组个数

    truck_group_number: 10,             //车辆组个数
    truck_group_unit_number: 100,       //车辆组每个最多车辆数
    truck_group_per_page: 10,             //车辆组每页个数

    truck_per_page: 10,                      //每页显示数量
    user_per_page: 10,                      //每页显示数量
    line_per_page: 10,                      //每页显示数量
    company_per_page: 10,                      //每页显示数量

    sms_phone_count: 20,                    //每次发送短信邀请最多发20个号码
    sms_send_count: 100,                     //一天一人100条

    demand_push_count: 2,                   //需求单主动推送次数

    qi_ye_zhan_shi_count: 12,               //企业展示图最大个数
    system_id: '000000000000000000000000',

    verify_codes: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],

    truck_number_pro: ['京', '津', '沪', '渝', '蒙', '新', '藏', '宁', '桂', '港', '澳', '黑', '吉', '辽', '冀', '晋', '青', '鲁', '豫', '苏', '皖', '浙', '闽', '赣', '湘', '鄂', '粤', '台', '琼', '甘', '陕', '川', '贵', '云'],
    truck_number_letter: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'],
    truck_number_number: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
    download_url: '/html/downLoad.html',
    secret_keys: {
        user: 'user',
        trade: 'trade',
        traffic: 'traffic',
        invite: 'invite',
        dynamic: 'dynamic',
        statistical: 'statistical',
        admin: 'admin',
        phone: 'phone',
        im: 'im',
        version: 'asdrdcvtuhjerwsd13sd65rfg331235fgSDsd'
    },
    address_status: {
        effective: 'effective',
        ineffective: 'ineffective'
    },

    relation_group_type: {
        FRIEND: 'FRIEND',       //好友
        COLLEAGUE: 'COLLEAGUE', //同事
        SALE: 'SALE',           //销售
        PURCHASE: 'PURCHASE',   //采购
        TRAFFIC: 'TRAFFIC',     //物流
        STORAGE: 'STORAGE',     //合作仓库
        DRIVER: 'DRIVER'        //司机
    },

    //实时推送内容
    socket_push: {
        new_relation:'new_relation' //邀请加关系
    },

    file_type: {
        //质检
        offer_zhi_jian: 'offer_zhi_jian',
        //车辆
        xing_shi_zheng: 'xing_shi_zheng',   //行驶证照片
        yun_ying_zheng: 'yun_ying_zheng',   //运营证照片
        che_tou_zhao: 'che_tou_zhao',       //车头照
        //个人
        id_card_number: 'id_card_number',
        id_card_number_back: 'id_card_number_back',
        jia_shi_zheng: 'jia_shi_zheng',
        tou_xiang: 'tou_xiang',
        user_other: 'user_other',                     //司机其它证件
        //公司
        logo: 'logo',
        ying_ye_zhi_zhao: 'ying_ye_zhi_zhao',
        qi_ye_zhan_shi: 'qi_ye_zhan_shi',        //企业展示图
        company_bg_img: 'company_bg_img',        //企业背景图
        honor_1: 'honor_1',
        honor_2: 'honor_2',
        honor_3: 'honor_3',
        honor_4: 'honor_4',
        honor_5: 'honor_5',
        honor_6: 'honor_6',
        honor_7: 'honor_7',
        honor_8: 'honor_8',
        culture_1: 'culture_1',
        culture_2: 'culture_2',
        culture_3: 'culture_3',
        culture_4: 'culture_4',
        culture_5: 'culture_5',
        culture_6: 'culture_6',
        culture_7: 'culture_7',
        culture_8: 'culture_8'
    },

    count_type: {
        TRADE_OFFER: 'TRADE_OFFER',              //交易抢单(参与抢单)
        DJ: 'DJ',                                //竞价
        JJ: 'JJ',                                //定价
        TRADE_DEMAND: 'TRADE_DEMAND',            //交易需求单(交易抢单)
        PURCHASE: 'PURCHASE',                    //采购订单
        SALE: 'SALE',                            //销售订单
        TRAFFIC_DEMAND: 'TRAFFIC_DEMAND',        //物流需求单(交易发)
        DRIVER: 'DRIVER',
        TRAFFIC_ORDER: 'TRAFFIC_ORDER',          //物流订单（查交易公司）
        TRAFFIC_SUPPLY_ORDER: 'TRAFFIC_ORDER',          //物流订单（查物流公司）
        TRAFFIC_OFFER: 'TRAFFIC_OFFER',          //物流抢单(物流抢)
        TRAFFIC_LINE: 'TRAFFIC_LINE',            //物流线路报价
        DRIVER_DEMAND: 'DRIVER_DEMAND',          //司机需求单(物管发布)
        DRIVER_OFFER: 'DRIVER_OFFER',            //司机抢单(司机抢)
        DRIVER_ORDER: 'DRIVER_ORDER',            //司机订单(查物流公司)
        DRIVER_SUPPLY_ORDER: 'DRIVER_ORDER',            //司机订单（查司机）
        DRIVER_LINE: 'DRIVER_LINE',              //司机线路
        RELATION_TRAFFIC_ORDER: 'RELATION_TRAFFIC_ORDER',    //与某人或某公司订单数
        company_sale: 'company_sale',            //销售公司
        company_purchase: 'company_purchase'     //采购公司
    },

    user_roles: {
        'TRADE_ADMIN': 'TRADE_ADMIN',                //交易--管理员
        'TRADE_PURCHASE': 'TRADE_PURCHASE',          //交易--采购
        'TRADE_SALE': 'TRADE_SALE',                  //交易--销售
        //'TRADE_MANUFACTURE':'TRADE_MANUFACTURE',
        // 'TRADE_FINANCE': 'TRADE_FINANCE',
        'OFFICE_EMPLOYEE': 'OFFICE_EMPLOYEE',       //办公--员工
        'OFFICE_ADMIN': 'OFFICE_ADMIN',             //办公--管理员
        'TRADE_STORAGE': 'TRADE_STORAGE',           //交易--仓管
        'TRAFFIC_ADMIN': 'TRAFFIC_ADMIN',           //物流总负责人
        'TRAFFIC_EMPLOYEE': 'TRAFFIC_EMPLOYEE',     //物流管理员
        'TRAFFIC_CAPTAIN': 'TRAFFIC_CAPTAIN',       //外部合作车队
        // 'TRAFFIC_DRIVER_PUBLISH': 'TRAFFIC_DRIVER_PUBLISH'  //公有司机（公司所属）
        'TRAFFIC_DRIVER_PRIVATE': 'TRAFFIC_DRIVER_PRIVATE'   //私人司机（挂靠司机）
    },

    user_roles_chn: {
        'TRADE_ADMIN': '交易管理员',
        'TRADE_PURCHASE': '采购负责人',
        'TRADE_SALE': '销售负责人',
        'OFFICE_EMPLOYEE': '员工',       //办公--员工
        'OFFICE_ADMIN': '行政专员',             //办公--管理员
        //'TRADE_MANUFACTURE':'生产负责人',
        // 'TRADE_FINANCE': '财务负责人',
        'TRADE_STORAGE': '仓库管理员',
        'TRAFFIC_ADMIN': '物流总负责人',
        'TRAFFIC_EMPLOYEE': '物流管理员',
        'TRAFFIC_CAPTAIN': '外部合作车队',
        // 'TRAFFIC_DRIVER_PUBLISH': '自有司机',
        'TRAFFIC_DRIVER_PRIVATE': '挂靠司机'
    },

    truck_types: {
        PING_BAN: 'PING_BAN',               //平板车
        GAO_LAN: 'GAO_LAN',                 //高栏车
        QIAN_SI_HOU_BA: 'QIAN_SI_HOU_BA',   //前四后八
        BAN_GUA: 'BAN_GUA',                 //半挂
        XIANG_SHI: 'XIANG_SHI',             //厢式
        DAN_QIAO: 'DAN_QIAO',               //单桥
        SI_QIAO: 'SI_QIAO',                 //四桥
        DI_LAN: 'DI_LAN',                   //低栏
        SAN_QIAO: 'SAN_QIAO',               //三桥
        HOU_BA_LUN: 'HOU_BA_LUN',           //后八轮
        CHANG_PENG: 'CHANG_PENG',           //敞篷
        QUAN_GUA: 'QUAN_GUA',               //全挂
        ZHONG_LAN: 'ZHONG_LAN',             //中栏
        JIA_CHANG_GUA: 'JIA_CHANG_GUA',     //加长挂
        BU_XIAN: 'BU_XIAN'                  //不限
    },

    truck_longs: {
        '2_5': '2_5',
        '6_8': '6_8',
        '9_10': '9_10',
        '11_12': '11_12',
        '13_15': '13_15',
        '16_17.5': '16_17.5',
        '17.5_': '17.5_'
    },

    truck_weights: {
        '6_10': '6_10',
        '11_15': '11_15',
        '16_20': '16_20',
        '21_25': '21_25',
        '26_30': '26_30',
        '31_35': '31_35',
        '36_40': '36_40',
        '40_': '40_'
    },

    company_category: {
        'TRADE': 'TRADE',
        'OFFICE': 'OFFICE',
        'TRAFFIC': 'TRAFFIC',
        'STORE': 'STORE'
    },

    tip_type: {
        'line': 'line',
        linkman: 'linkman' //联系人
    },

    company_type: {
        SALE: 'SALE',
        PURCHASE: 'PURCHASE',
        TRADE: 'TRADE',     //采购和销售
        TRAFFIC: 'TRAFFIC',
        STORE: 'STORE'
    },

    user_type: {
        TRADE: 'TRADE',     //交易
        STORE: 'STORE',     //仓库
        DRIVER: 'DRIVER',   //司机
        OFFICE: 'OFFICE',   //办公
        TRAFFIC: 'TRAFFIC'  //物流
    },

    store_type: {
        PU_TONG: 'PU_TONG',     //普通仓
        LENG_CANG: 'LENG_CANG', //冷苍仓
        HENG_WEN: 'HENG_WEN',   //恒温仓
        WEI_XIAN_PIN: 'WEI_XIAN_PIN'    //危险品仓
    },

    truck_group_type: {
        PRIVATE: 'PRIVATE', //挂靠
        PUBLIC: 'PUBLIC'     //自有
    },

    url_share: {
        traffic_add_new: '/html/trafficDemandInvite.html?',
        driver_add_offer: '/html/driverDemandInfo.html?',
        download: '/html/downLoad.html'
    },

    verification_phase: {
        'NO': 'NO',
        'PROCESSING': 'PROCESSING',
        'SUCCESS': 'SUCCESS',
        'FAILED': 'FAILED'
    },

    //公司人数限制
    vip_count: {
        vip: 200,
        no_vip: 20
    },

    msg_templates: {
        company_verify_direct: 'company_verify_direct',
        traffic_admin_price_offer: 'traffic_admin_price_offer',
        traffic_demand_push_msg: 'traffic_demand_push_msg',
        traffic_driver_demand_push_msg: 'traffic_driver_demand_push_msg',
        signup: 'signup',
        signup_share: 'signup_share',
        apply_verify: 'apply_verify',
        apply_verify_self: 'apply_verify_self',
        approve_verify: 'approve_verify',
        driver_apply_verify_self: 'driver_apply_verify_self',
        driver_apply_verify_traffic: 'driver_apply_verify_traffic',
        driver_apply_verify_agree: 'driver_apply_verify_agree',
        driver_apply_verify_disagree: 'driver_apply_verify_disagree',
        old_public_dirver_trans: 'old_public_dirver_trans',
        new_public_dirver_trans: 'new_public_dirver_trans',
        traffic_admin_dirver_trans: 'traffic_admin_dirver_trans',
        invite_signup: 'invite_signup',
        invite_signup_private_driver: 'invite_signup_private_driver',
        invite_signup_notice: 'invite_signup_notice',
        invite_unlock_driver: 'invite_unlock_driver',
        create_company: 'create_company'
        // comp_to_verify: 'comp_to_verify',
        // invite_direct: 'invite_direct',
        // role_change: 'role_change'
    },

    sms_templates: {
        invite_colleague: 'invite_colleague',
        //invite_driver: 'invite_driver',
        invite_driver_publish: 'invite_driver_publish',
        invite_driver_private: 'invite_driver_private',

        //store_addr_change: 'store_addr_change',
        //trade_purchase_invite: 'trade_purchase_invite',
        // company_verify_complete: 'company_verify_complete',
        get_verify_code: 'get_verify_code'
    },

    sms_templates_client: {
        invite_direct: 'invite_direct',
        invite_by_traffic_plan: 'invite_by_traffic_plan',
        trade_send_demand: ' trade_send_demand',
        trade_send_traffic_demand: 'trade_send_traffic_demand'
    },

    company_sub_type: {
        IRON: 'IRON',
        COAL: 'COAL'
    },

    relation_type: {
        ACCEPT: 'ACCEPT',
        WAIT: 'WAIT'
    },
    differentiate_type: {
        Pick_up_the_goods: 'Pick_up_the_goods', //提货地址
        Delivery_of_the_goods: 'Delivery_of_the_goods'  //交货地址
    },


    index_collection: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'm', 'n', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
        '2', '3', '4', '5', '6', '7', '8', '9'],

    //新关系类型
    relation_style: {
        FRIEND: 'FRIEND',                   //加好友
        COMPANY_INVITE: 'COMPANY_INVITE',   //邀请加入企业
        COMPANY_SUPPLY: 'COMPANY_SUPPLY',   //申请加入企业
        WORK: 'WORK',                       //合作
        VISITOR:'VISITOR'                   //来访者
    },

    //新关系状态
    relation_status: {
        ACCEPT: 'ACCEPT',
        WAIT: 'WAIT',
        REFUSE: 'REFUSE',
        VISITOR:'VISITOR'
    },

    //推送类型
    push_type: {
        COMPANY_TRADE: 'COMPANY_TRADE'
    },
    //推送类型 -- 来自指挥中心的！
    push_count_type: {
        //交易
        DJ: 'DJ',           //报价
        JJ: 'JJ',           //竞价
        demand: 'demand',   //采购
        trade_traffic: 'trade_traffic',  //物流（交易人员查看物流人员）
        //物流
        supply_goods: 'supply_goods',//货源
        traffic_truck: 'traffic_truck',//车辆
        //司机
        driver_traffic: 'driver_traffic',//物流（司机的）
    },
    //离线邀请
    // invitation_user_type: {
    //     'COMPANY': 'COMPANY',   //同事
    //     'FRIEND':'FRIEND'       //好友
    // },

    verify_lock: {
        UNLOCK: 'UNLOCK',
        LOCK: 'LOCK'
    },
    invitation_phone_type: {
        'PURCHASE': 'PURCHASE',  //采购
        'SALE': 'SALE',                         //销售
        'TRAFFIC': 'TRAFFIC'
    },

    user_homepage_status: {
        'DRIVER_TRAFFIC': 'DRIVER_TRAFFIC',  //司机查看物管
        'TRAFFIC_DRIVER': 'TRAFFIC_DRIVER',  //物管查看司机
        'TRAFFIC_TRADE': 'TRAFFIC_TRADE',    //物管查看交易
        'TRADE_TRAFFIC': 'TRADE_TRAFFIC',    //交易查看物流
        'STORE_TRADE': 'STORE_TRADE',        //仓管查看交易
        'TRADE_STORE': 'TRADE_STORE',        //交易查看仓库
        'PURCHASE_SALE': 'PURCHASE_SALE',    //采购查看销售
        'SALE_PURCHASE': 'SALE_PURCHASE',    //销售查看采购
        'TRADE_ADMIN': 'TRADE_ADMIN',        //交易查看超管
        'STORE_TRAFFIC': 'STORE_TRAFFIC',    //仓管查看物管
        'TRAFFIC_STORE': 'TRAFFIC_STORE',    //物管查看仓库
        'other': 'other'
    },

    share_type: {
        tradeDemandListCom: 'tradeDemandListCom',   //需求分享页列表（公司id)
        tradeDemandListPer: 'tradeDemandListPer',  //需求分享页列表（个人id)
        driverSingle: 'driverSingle',                  //实时物流（名片）
        passRealTimePrice: 'passRealTimePrice',    // 物流主动报价
        companyTrade: 'companyTrade',                         //交易企业主页
        companyTraffic: 'companyTraffic',                    //物流企业主页
        personTraffic: 'personTraffic',                      //物流个人名片
        personTrade: 'personTrade',                          //交易个人名片
        honor: 'honor',                             //企业荣誉
        driverDemand: 'driverDemand',            //司机需求单
        trafficDemand: 'trafficDemand',          //物流需求
        tradePlan: 'tradePlan',                   //物流计划
        trafficPriceAsk: 'trafficPriceAsk',     //物流询价
        trafficPriceOffer: 'trafficPriceOffer',//物流主动报价
        tradePriceOffer: 'tradePriceOffer',    //交易主动报价
        tradePriceAsk: 'tradePriceAsk',         //交易询价
        tradeDemand: 'tradeDemand'               //交易需求
    },

    company_person_count: {
        '0-50': '0-50',
        '50-100': '50-100',
        '100-300': '100-300',
        '300-500': '300-500',
        '500-1000': '500-1000',
        '1000': '1000'
    },

    file_path: '/temp/',
    file_format: {'jpg': 1, 'jpeg': 1, 'png': 1, 'bmp': 1},
    file_size: 5 * 1024 * 1024,
    OSS: {
        access_id: 'wZ2NKdo8zRXchXpr',
        access_key: 'T9ebkKOgyLSqsZx7SnhwViNHnZjAUo',
        bucket_img_url: 'rsc-img.oss-cn-beijing.aliyuncs.com',
        bucket_img: 'rsc-img'
    },

    //验证码类型对应的包名
    verify_code_type: {
        'com.rsc.tradecenter': 'trade',     //交易
        'com.zgy365.zgy': 'trade',          //中钢云
        'com.rsc.dispatcenter': 'traffic',  //物流
        'com.rsc.officecenter': 'office',   //办公
        'com.rsc.android_driver': 'driver', //司机
        'com.rsc.drivercenter': 'driver',   //司机
        'com.rsc.warehousecenter': 'store', //仓库
        'com.rsc.business': 'traffic',       //物流
        'com.rsc.trankcenter': ['trade', 'traffic'],//信用中心
        'com.sinosteel.vehicles': 'driver',     //中钢云-司机
        'com.sinosteel.warehouse': 'store',     //中钢云-仓库
        'com.sinosteel.logistics': 'traffic',    //中钢云-物流
        'com.xinhuiyun.trade': 'trade'    //鑫汇云-交易
    },

    //验证登录-->只有这几个电话号码可以使用111111
    phoneArr: ['18888888801', '18888888802', '18888888803', '18888888804', '18888888805',
        '18888888806', '18888888807', '18888888808', '18888888809', '18888888810',
        '18888888811', '18888888812', '18888888813', '18888888814', '18888888815',
        '18888888816', '18888888817', '18888888818', '18888888819', '18888888820',
        '18888888821', '18888888822', '18888888823', '18888888824', '18888888825',
        '18888888826', '18888888827', '18888888828', '18888888829', '18888888830',
        '18888888831', '18888888832', '18888888833', '18888888834', '18888888835',
        '18888888836', '18888888837', '18888888838', '18888888839', '18888888840',
        '18888888841', '18888888842', '18888888843', '18888888844', '18888888845',
        '18888888846', '18888888847', '18888888848', '18888888849', '18888888850',
        '18888888851', '18888888852', '18888888853', '18888888854', '18888888855',
        '18888888856', '18888888857', '18888888858', '18888888859', '18888888860',
        '18888888861', '18888888862', '18888888863', '18888888864', '18888888865',
        '18888888866', '18888888867', '18888888868', '18888888869', '18888888870',
        '18888888871', '18888888872', '18888888873', '18888888874', '18888888875',
        '18888888876', '18888888877', '18888888878', '18888888879', '18888888880',
        '18888888881', '18888888882', '18888888883', '18888888884', '18888888885',
        '18888888886', '18888888887', '18888888888', '18888888889', '18888888890',
        '18888888891', '18888888892', '18888888893', '18888888894', '18888888895',
        '18888888896', '18888888897', '18888888898', '18888888899', '18310306740',
        '13488670745', '15617432515', '13810841691', '18658888999', '18701393788',
        '17600208145', '13580000000', '15210112715', '16619871946', '18241225154',
        '16600000000','16600000001','16600000002','16600000003','16600000004',
        '16600000005','16600000006','16600000007','16600001111'
    ],

    checkShareType: function (type) {
        return !!(this.share_type[type]);
    },

    checkClientSMSTemp: function (type) {
        return !!(this.sms_templates_client[type]);
    },

    checkRelationType: function (type) {
        return !!(this.relation_type[type]);
    },

    checkCompanySubType: function (type) {
        return !!(this.company_sub_type[type]);
    },

    checkCompanyDetailType: function (type) {
        return !!(this.company_type[type]);
    },

    checkTruckGroupType: function (type) {
        return !!(this.truck_group_type[type]);
    },

    checkCoordinate: function (input) {
        return !(
            (input.latitude !== 0 && !input.latitude) ||
            (input.longitude !== 0 && !input.longitude) || !_.isNumber(input.latitude) || !_.isNumber(input.longitude)
        );
    },

    checkFileType: function (type) {
        return !!(this.file_type[type]);
    },

    checkIdCard: function (input) {
        var reg1 = /^[0-9]{17}[0-9xX]{1}$/;
        var reg2 = /^[0-9]{14}[0-9xX]{1}$/;
        return (reg1.test(input) || reg2.test(input));
    },

    checkCommonString: function (input) {
        var reg = /^[\s\S]{2,40}$/;
        return reg.test(input);
    },

    checkUrlString: function (input) {
        var reg = /^[\s\S]{2,200}$/;
        return reg.test(input);
    },

    checkPassword: function (input) {
        var reg = /^[a-zA-Z0-9]{6,16}$/;
        return reg.test(input);
    },

    checkCompanyName: function (input) {
        // var reg = /^[a-zA-Z\u4e00-\u9fa5\s]{1,5}$/;
        // return reg.test(input);
        var bytesCount = 0;
        for (var i = 0; i < input.length; i++) {
            var c = input.charCodeAt(i);
            if (/^[\u0000-\u00ff]$/.test(c)) {
                bytesCount += 1;
            } else {
                bytesCount += 2;
            }
        }
        return bytesCount <= 20;
    },

    checkRealName: function (input) {
        var reg = /^[a-zA-Z\u4e00-\u9fa5\s]{2,10}$/;
        return reg.test(input);
    },

    checkGender: function (gender) {
        return gender == 'FEMALE' || gender == 'MALE';
    },

    checkPhone: function (input) {
        var reg = /^1[3-9][0-9]{9}/
        //var reg = /^1[0-9]{10}$/;
        // var reg = /(^13[0-9]{9}$)|(^15[0-9]{9}$)|(^17[0-9]{9}$)|(^18[012356789][0-9]{8}$)|(^199[0-9]{8}$)/;
        return reg.test(input);
    },

    checkTelephone: function (input) {
        var reg = /(^[0-9\-]{9,20}$)/;
        return reg.test(input) || this.checkPhone(input);
    },

    checkCompanyType: function (type) {
        return !!(this.company_category[type]);
    },

    checkAdmin: function (role) {
        return role.indexOf('ADMIN') >= 0;
    },

    checkDriver: function (role) {
        return role.indexOf('DRIVER') >= 0;
    },

    checkTrafficCompanyByRole: function (role) {
        return role.indexOf(this.company_category.TRAFFIC) >= 0;
    },

    checkTradeCompanyByRole: function (role) {
        return role.indexOf(this.company_category.TRADE) >= 0;
    },

    //检查个人公司是否存在
    checkUserCompany: function (user) {
        // return !((this.checkTradeCompanyByRole(user.role) && !user.company_id) ||
        // (this.checkTrafficCompanyByRole(user.role) && !user.company_id.length));
        return (_.isArray(user.company_id) && user.company_id.length !== 0) ||
            (_.isString(user.company_id) && user.company_id);
    },

    //检查此人是否可以加入其它公司
    checkUserCanJoinCompany: function (user, company) {
        return !(company.verify_phase === this.verification_phase.SUCCESS && !user.free);
    },

    checkRoleType: function (type) {
        return !!(this.user_roles[type]);
    },

    checkTruckType: function (type) {
        return !!(this.truck_types[type]);
    },

    checkTruckLong: function (type) {
        return !!(this.truck_longs[type]);
    },

    checkTruckWeight: function (type) {
        return !!(this.truck_weights[type]);
    },

    checkProvince: function (data) {
        return !!(configProvince[data]);
    },

    checkCity: function (pro, city) {
        return !!(configCity[pro][city]);
    },

    checkDistrict: function (city, dis) {
        if (configDistrict[city]) {
            return !!(configDistrict[city][dis]);
        } else {
            return true;
        }
    },

    checkDistrictStrict: function (city, dis) {
        if (configDistrict[city]) {
            return !!(configDistrict[city][dis]);
        } else {
            return true;
        }
    },

    checkNumberBiggerZero: function (num) {
        return !(!num || !_.isNumber(num) || num <= 0);
    },

    checkMaxNumber: function (num) {
        return !(!num || !_.isNumber(num) || num > 999999.99);
    },

    sendData: function (req, data, next) {
        req.result = data;
        next('success');
    },

    getCompanyName: function (company) {
        if (company.verify_phase === this.verification_phase.SUCCESS) {
            return company.nick_name;
        } else {
            return company.full_name;
        }
    },

    getVerifyCode: function () {
        var s_code = '';
        for (var i = 0; i < 6; i++) {
            var index = Math.floor(Math.random() * this.verify_codes.length);
            s_code += this.verify_codes[index];
        }
        return s_code;
    },

    getCompanyTypeByRole: function (role) {
        return role.split('_')[0];
    },

    dateNumberToString: function (num) {
        var str = '';
        if (num < 10) {
            str = '0' + num.toString();
        } else {
            str = num.toString();
        }
        return str;
    },

    getInvitationIndex: function () {
        //var index = 'yq-';
        //var today = new Date();
        //var year = today.getFullYear().toString();
        //var month = this.dateNumberToString(today.getMonth() + 1);
        //var date = this.dateNumberToString(today.getDate());
        //var hour = this.dateNumberToString(today.getHours());
        //var minute = this.dateNumberToString(today.getMinutes());
        //var second = this.dateNumberToString(today.getSeconds());
        var random = '';
        for (var i = 0; i < 5; i++) {
            random += Math.floor(Math.random() * 10);
        }
        //index += year+month+date+'-'+hour+minute+second+'-'+random;
        return random;
    },

    // 返回若干位随机码
    getRandomString: function (count) {
        if (isNaN(count)) {
            return '';
        }
        var random = '';
        for (var i = 0; i < count; i++) {
            var s_index = Math.floor(Math.random() * this.index_collection.length);
            random += this.index_collection[s_index];
        }
        return random;
    },

    // 返回随机车牌号
    getRandomTruckNumber: function () {
        var pro = this.truck_number_pro[Math.floor(Math.random() * this.truck_number_pro.length)];
        var letter1 = this.truck_number_letter[Math.floor(Math.random() * this.truck_number_letter.length)];
        var letter2 = this.truck_number_letter[Math.floor(Math.random() * this.truck_number_letter.length)];
        var number1 = this.truck_number_number[Math.floor(Math.random() * this.truck_number_number.length)];
        var number2 = this.truck_number_number[Math.floor(Math.random() * this.truck_number_number.length)];
        var number3 = this.truck_number_number[Math.floor(Math.random() * this.truck_number_number.length)];
        var number4 = this.truck_number_number[Math.floor(Math.random() * this.truck_number_number.length)];
        return pro + letter1 + letter2 + number1 + number2 + number3 + number4;
    },

    // 返回随机车类型
    getRandomTruckType: function () {
        return this.truck_types[Math.floor(Math.random() * this.truck_types.length)];
    },

    // 返回随机车长度
    getRandomTruckLong: function () {
        return this.truck_longs[Math.floor(Math.random() * this.truck_longs.length)];
    },

    // 返回随机车长度
    getRandomTruckWeight: function () {
        return this.truck_weights[Math.floor(Math.random() * this.truck_weights.length)];
    },

    createTokenUser: function (user, company) {
        var company_name;
        company_name = (company) ? company.nick_name : '';
        return jwt.sign({
                id: user._id,
                company_id: user.company_id,
                role: user.role,
                user_name: user.real_name,
                phone: user.phone,
                company_name: company_name
            },
            this.secret_keys.user,
            {expiresIn: 60 * 60 * 24 * 30});
    },

    //给代操作的司机创建token
    createTokenForReplace: function (user, company) {
        return jwt.sign({
                id: user._id,
                company_id: user.company_id || '',
                role: user.role,
                user_name: user.real_name,
                phone: user.phone,
                company_name: company.nick_name || '',
                admin_id: "5976f947169e2997301675b0"
            },
            this.secret_keys.user,
            {expiresIn: 60 * 60 * 24 * 30});
    },

    createTokenPhoen: function (phone) {
        return jwt.sign({phone: phone}, this.secret_keys.version, {expiresIn: 60});
    },

    change: function (arr, k, j) {
        arr = _.toArray(arr);
        var c = arr[k];
        arr[k] = arr[j];
        arr[j] = c;
        arr = arr.toString().replace(/,/g, "")
        return arr
    },
    convertCatalogue: function (product, loop, chn) {
        var catalogue = [];
        _.each(product, function (a) {
            var category = '';
            for (var x = 1; x < loop; x++) {
                if (a['layer_' + x + chn]) {
                    category = !category ? a['layer_' + x + chn] : category + ';' + a['layer_' + x + chn];
                } else {
                    break;
                }
            }
            _.each(a.product_name, function (b) {
                if (b['measure_unit'][0]['value'] || b['attribute'].length > 0) {
                    var product_name = category;
                    if (b.name) {
                        product_name = product_name + ';' + b.name;
                    }
                    catalogue.push(product_name);
                }
            })
        });
        return catalogue;
    },


    //指挥中心使用的角色信息
    super_admin_role_new: {
        //超级管理员
        'offline_superman': {
            chn: "线下总司令",
            eng: "offline_superman",
            lev: 9,
            urls: [{
                name: "线下交易",
                url: "http://www.e-wto.com/center/trade/index.html"
            }, {
                name: "线下物流",
                url: "http://www.e-wto.com/center/logistics/index.html"
            }, {
                name: "线上交易",
                url: "http://www.e-wto.com/center_online/trade/index.html"
            }, {
                name: "线上物流",
                url: "http://www.e-wto.com/center_online/logistics/index.html"
            }]
        },
        'on_line_superman': {
            chn: "线上总司令",
            eng: "on_line_superman",
            lev: 9,
            urls: [{
                name: "线下交易",
                url: "http://www.e-wto.com/center/trade/index.html"
            }, {
                name: "线下物流",
                url: "http://www.e-wto.com/center/logistics/index.html"
            }, {
                name: "线上交易",
                url: "http://www.e-wto.com/center_online/trade/index.html"
            }, {
                name: "线上物流",
                url: "http://www.e-wto.com/center_online/logistics/index.html"
            }]
        },
        //部门负责人
        'president': {
            chn: "总裁",
            eng: "president",
            lev: 0,
            urls: [{
                name: "线下交易",
                url: "http://www.e-wto.com/center/trade/index.html"
            }, {
                name: "线下物流",
                url: "http://www.e-wto.com/center/logistics/index.html"
            }, {
                name: "线上交易",
                url: "http://www.e-wto.com/center_online/trade/index.html"
            }, {
                name: "线上物流",
                url: "http://www.e-wto.com/center_online/logistics/index.html"
            }]
        },
        //大区负责人
        'zongjingli': {
            chn: "总经理",
            eng: "zongjingli",
            lev: 1,
            urls: [{
                name: "线下交易",
                url: "http://www.e-wto.com/center/trade/index.html"
            }, {
                name: "线下物流",
                url: "http://www.e-wto.com/center/logistics/index.html"
            }, {
                name: "线上交易",
                url: "http://www.e-wto.com/center_online/trade/index.html"
            }, {
                name: "线上物流",
                url: "http://www.e-wto.com/center_online/logistics/index.html"
            }]
        },
        //大区负责人
        'project_director': {
            chn: "项目总监",
            eng: "project_director",
            lev: 2,
            urls: [{
                name: "线下交易",
                url: "http://www.e-wto.com/center/trade/index.html"
            }]
        },
        'traffic_senior_manager': {
            chn: "物流高级经理",
            eng: "traffic_senior_manager",
            lev: 2,
            urls: [{
                name: "线下物流",
                url: "http://www.e-wto.com/center/logistics/index.html"
            }, {
                name: "线上物流",
                url: "http://www.e-wto.com/center_online/logistics/index.html"
            }]
        },
        'on_line_senior_manager': {
            chn: "线上高级经理",
            eng: "on_line_senior_manager",
            lev: 2,
            urls: [{
                name: "线上交易",
                url: "http://www.e-wto.com/center_online/trade/index.html"
            }, {
                name: "线上物流",
                url: "http://www.e-wto.com/center_online/logistics/index.html"
            }]
        },
        //部门——线下职员
        'trade_manager': {
            chn: "交易经理",
            eng: "trade_manager",
            lev: 2,
            urls: [{
                name: "线下交易",
                url: "http://www.e-wto.com/center/trade/index.html"
            }]
        },
        'traffic_manager': {
            chn: "物流经理",
            eng: "traffic_manager",
            lev: 2,
            urls: [{
                name: "线下物流",
                url: "http://www.e-wto.com/center/logistics/index.html"
            }]
        },
        'car_manager': {
            chn: "车辆经理",
            eng: "car_manager",
            lev: 2,
            urls: [{
                name: "线下物流",
                url: "http://www.e-wto.com/center/logistics/index.html"
            }]
        },
        //部门——线上职员
        'trade_service': {
            chn: "交易客服",
            eng: "trade_service",
            lev: 2,
            urls: [{
                name: "线上交易",
                url: "http://www.e-wto.com/center_online/trade/index.html"
            }]
        },
        'traffic_service': {
            chn: "物流客服",
            eng: "traffic_service",
            lev: 2,
            urls: [{
                name: "线上物流",
                url: "http://www.e-wto.com/center_online/logistics/index.html"
            }]
        },
        'car_service': {
            chn: "车辆客服",
            eng: "car_service",
            lev: 2,
            urls: [{
                name: "线上物流",
                url: "http://www.e-wto.com/center_online/logistics/index.html"
            }]
        }
    },

};

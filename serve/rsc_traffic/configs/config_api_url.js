 /**
 * Created by Administrator on 2016/1/8.
 */
module.exports = {
    //发送手机短信
    msg_server_send_sms: '/msg/send_sms',


    //通过平台发送短信
    admin_server_auto_demand_sms_broadcast: '/api/func/admin_server_auto_demand_sms_broadcast',


    //增加物流日志
    log_server_new_order_status: '/new_order_status',


    //增加动态
    dynamic_server_company_dynamic_add: '/api/server/company_dynamic/add',

    //增加仓库出库数据
    store_server_order_traffic_complete: '/api/server/store_unit/order_traffic_complete',
    store_server_order_traffic_add: '/api/server/store_ready/order_traffic_add',
    store_server_order_trade_complete: '/api/server/store_unit/order_trade_complete',
    store_server_order_trade_add: '/api/server/store_agreement/order_trade_add',
    store_client_set_store_region: '/api/store_agreement/set_store_region',


    //获取某笔订单详细信息
    traffic_server_driver_order_complete: '/api/driver_order_c/order_complete',

    //编辑公司应收应付
    finance_server_edit_yet: '/api/account/edit_yet',
    //编辑公司已收已付
    finance_server_edit_has: '/api/account/edit_has',
    //信用申请
    finance_server_credit_req: '/api/credit/req',
    //通过订单编辑信用完成
    finance_server_credit_edit_repay_by_order: '/api/credit/edit_repay_by_order',
    //通过订单编辑信用图片
    finance_server_credit_edit_url_by_order: '/api/credit/edit_url_by_order',
    //信用价格修改
    finance_server_edit_credit_price: '/api/credit/edit_credit_price',
    //信用有效期修改
    finance_server_edit_credit_expire_time: '/api/credit/edit_credit_expire_time',



    //增加公司动态
    user_server_company_dynamic_add: '/api/company_dynamic/add',
    //获取仓库信息
    user_server_store_get_one: '/api/company_trade_store/get_one',
    //获取地址信息
    user_server_address_get_one: '/api/address/get_one',
    //获取线路信息
    user_server_line_get_by_id: '/api/company_traffic_line/get_by_id',
    //增加抢单数
    user_server_line_add_order_count: '/api/company_traffic_line/add_order_count',
    //获取物流公司
    user_server_traffic_company_get_one: '/api/company_traffic/get_one',
    //获取交易公司
    user_server_trade_company_get_one: '/api/company_trade/get_one',
    //获取车辆
    user_server_truck_get_one: '/api/user_traffic_truck/get_one',
    user_server_truck_get_by_user_id: '/api/user_traffic_truck/get_truck_by_user_id',
    //检查userid和truckid
    user_server_check_v_info: '/api/company_traffic/check_v_info',
    //判断物流公司是否冻结
    user_server_traffic_company_is_freeze: '/api/company_traffic/is_freeze',
    //检查companyid和storeid
    user_server_check_company_store: '/api/company_trade/check_company_store',
    //获取公司的认证公司
    user_server_get_company_relation: '/api/company_relation/get_by_type',
    //获取两个公司的认证关系
    user_server_get_one_company_relation: '/api/company_relation/get_by_company_id',
    user_server_get_verify_status_by_company_ids: '/api/company_relation/get_verify_status_by_company_ids',
    //获取挂靠司机ids
    user_server_get_private_driver_by_user_ids: '/api/user_traffic/get_private_driver_by_user_ids',
    //申请认证公司
    user_server_company_apply_verify: '/api/company_relation/apply_verify',
    //发消息
    user_server_trade_send_msg: '/api/user_trade/send_msg',
    user_server_traffic_send_msg: '/api/user_traffic/send_msg',
    //发短信
    user_server_traffic_send_sms: '/api/user_traffic/send_sms',
    //获取个人信息
    user_server_check_driver: '/api/user_traffic/check_driver',
    //获取司机认证情况
    user_server_driver_verify_get_one: '/api/driver_verify/get_one',
    //获取认证的公司
    user_server_get_driver_verify_company: '/api/driver_verify/get_verify',
    //获取个人信息
    user_server_get_me_trade: '/api/user_trade/me',
    //获取个人信息
    user_server_get_me_traffic: '/api/user_traffic/me',
    //获取个人信息
    user_server_get_me_traffic_new: '/api/user_traffic/me_new',
    //获取某人信息
    user_server_user_get_one_driver: '/api/user_traffic/get_one_driver',
    //判断交易公司是否冻结
    user_server_trade_company_is_freeze: '/api/company_trade/is_freeze',
    //获取line个数
    user_server_get_line_count:'/api/company_traffic_line/get_line_count',
    //获取认证公司
    user_server_get_company_verify: '/api/company_relation/get_company_verify',
    //获取用户信息
    user_server_get_by_id: '/api/user_trade/get_by_id',
    //企业头像
    user_company_home_page: '/api/company/get_home_pages',
    user_push_get_list: '/api/push/get_list',


    //通知交易服务器修改已发三方物流需求单吨数
    trade_server_traffic_send_order_amount: '/api/demand/traffic_send_order_amount',
    //通知交易服务器第三步物流完成
    trade_server_order_3_traffic_confirm: '/api/demand/order_3_traffic_confirm/',
    //通知交易服务器第三步物流完成
    trade_server_order_add_traffic_demand: '/api/demand/order_add_traffic_demand',
    //获取某笔订单详细信息
    trade_server_order_detail_for_server: '/api/demand/order_detail_for_server',
    //发布物流修改订单流程
    trade_update_order_step:'/api/demand/update_order_step',
	//增加交易订单的物流索引
	add_trade_order_traffic_index: '/api/demand/order_3_traffic_order/',
    //获取钢铁理记重量
    trade_server_get_steel_liji_weigh_config: '/api/pricing/get_steel_liji_weigh_config',
    //计算四层吨数
    trade_server_get_steel_weigh_liji_for_traffic:'/api/pricing/get_steel_weigh_liji_for_traffic',
    //删除物流订单号和物流需求单号
    trade_server_delete_order_logistic: '/api/demand/delete_order_logistic',
    //获取某公司报价和需求单个数
    trade_server_get_offer_and_demand_count:'/api/pricing/get_offer_and_demand_count',

    //新版--服务间通讯start 201705
    //交易
    trade_server_common: '/api/server/common/get',
    trade_tonnage_get_config: '/api/server/tonnage/get_config',
    trade_order_edit: '/api/server/order/edit',//{is_true:为真是发布,为假是取消; amount:需要修改的吨数,}
    trade_order_update: '/api/server/order/update',
    trade_replenish: '/api/server/order/replenish', //补货信息
    //用户
    user_server_common: '/api/server/common/get',
    user_get_trucks_users: '/api/server/truck_group_relation/get_trucks_users',
    user_get_trade_circle: '/api/server/user_relation/get_trade_circle',
    user_get_token: '/api/server/user/get_token',
    
    //金融
    pay_information_debit: '/api/server/order/pay_information_debit', //扣款信息费
    pay_information_recharge: '/api/server/order/pay_information_recharge',  //添加信息费
    pay_information_refund: '/api/server/order/pay_information_refund',  //信息费退款接口
    pay_price_carry: '/api/company/pay_price_carry',
    //消息
    msg_server_push: '/api/push/push',
    msg_server_send_sms1: '/msg/send_sms1',             //发送手机短信
    msg_send_driver_sms: '/msg/send_driver_sms', //司机短信
    msg_server_push_one: '/api/push/get_one',//获取用户uuid
    //统计
    statis_server_order_add: '/api/server/order/add', //时时统计订单
    statis_server_companyTraffic_add: '/api/server/companyTraffic/add',          //后台统计物流部分
    statis_server_companyTrade_add: '/api/server/companyTrade/add',              //后台统计交易部分
    statis_server_userDriver_add: '/api/server/userDriver/add',  //后台统计司机部分
    //获取admin服务器的信息
    admin_server_get: '/api/server/common/get',

 //新版--服务间通讯end
    //高德地图api
    amap_geocode_geo : '/geocode/geo', //地理编码
    
};
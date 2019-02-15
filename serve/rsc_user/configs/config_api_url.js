/**
 * Created by Administrator on 2016/1/8.
 */
module.exports = {
    //通用服务器获取接口
    server_common_get: '/api/server/common/get',
    server_change_change: '/api/server/change/change',

    //发送手机短信
    msg_server_send_sms: '/msg/send_sms',
    msg_server_send_sms1: '/msg/send_sms1',
    msg_server_add_message: '/api/message/add',
    msg_server_push: '/api/push/push',
    msg_server_socket_push: '/api/socket_push/push',


    //发送手机短信
    admin_server_auto_save_rcmd_list: '/api/func/auto_save_rcmd_list',
    //上传用户电话给后台服务器
    upload_user_sms_record: '/api/func/upload_user_sms_record',


    //发消息
    user_server_trade_send_msg: '/api/user_trade/send_msg',
    user_server_traffic_send_msg: '/api/user_traffic/send_msg',
    user_server_apply_verify: '/api/company_relation/apply_verify',


    //增加动态
    dynamic_server_company_dynamic_add: '/api/server/company_dynamic/add',
    dynamic_server_company_dynamic_get_count: '/api/server/company_dynamic/get_dynamic_count',

    //平台增加公司或司机
    statistical_server_platform_add: '/api/server/platform/add',

    //通知通讯录改状态
    phone_server_edit: '/api/server/phone/edit',

    //根据一定条件读取交易数据库
    trade_server_get_anyCount: 'api/server/common',

    //获取交易服务器的文字信息
    trade_server_get_hanzi: '/api/server/common/get',
    //获取交易服务器的产品文字信息
    trade_server_get_layer: '/api/server/common/get_layer',

    //获取admin服务器的信息
    admin_server_get: '/api/server/common/get',
    admin_server_edit_push_count: '/api/server/push_count/edit',
    admin_server_add_system_info: '/api/server/system_info/add',
    admin_server_save_push_count: '/api/server/push_count/save',
    admin_server_close_or_open_push_count: '/api/server/push_count/close_or_open',

    //获取交易服务器相关单据数量
    trade_server_get_count: '/api/server/count/get_count',
    //采购需求单受到了邀请注册的消息
    trade_server_demand_signup: '/api/demand/demand_signup/id/',
    //获取推荐交易需求单
    trade_server_demand_recommend: '/api/demand/demand_recommend',
    //获取某个需求单信息
    trade_server_demand_detail: '/api/demand/demand_detail/id/',
    //编辑推送次数
    //trade_server_demand_add_push_count: '/api/demand/add_push_count',
    //邀请别人来抢单注册
    trade_server_demand_invite: '/api/demand/demand_invite/id/',
    //向所有采购需求添加新认证公司的id
    trade_server_demand_update_offer_range: '/api/demand/demand_update_offer_range',
    //向所有采购需求删除新认证公司的id
    trade_server_demand_remove_from_offer_range: '/api/demand/demand_remove_from_offer_range',
    //询价添加认证公司
    trade_server_price_ask_update_offer_range: '/api/pricing/price_ask_update_offer_range',          // 添加
    //询价删除认证公司
    trade_server_price_ask_remove_from_offer_range: '/api/pricing/price_ask_remove_from_offer_range',         // 减少
    //获取公司category
    trade_server_demand_list_goods: '/api/demand/list_goods',         // 减少
    //把发布单据更新成历史状态
    trade_server_update_send_history_status: '/api/server/user_adjustment/update_history_status',
    //更新参与竞价，购物车，抢单公司信息
    trade_server_update_partake_company: '/api/server/user_adjustment/update_partake_company',
    //copy此人现有发布单据数据
    trade_server_copy_send_data: '/api/server/user_adjustment/copy_send_data',
    //更新参与的人id
    trade_server_update_partake_user: '/api/server/user_adjustment/update_partake_user',
    //更新订单所属人ID
    trade_server_update_order_user_id: '/api/server/user_adjustment/update_order_user_id',

    //获取物流服务器相关单据数量
    traffic_server_get_count: '/api/server/offer/get_count',
    //获取某线路正在运输中的司机
    get_by_store_id: '/api/route/get_by_store_id',
    //获取某公司已经使用的车辆
    get_used_truck_path: '/api/route/get_used_truck',
    //获取司机们状态
    get_by_user_ids: '/api/route/get_by_user_ids',
    //获取订单信息
    get_one_demand: '/api/demand/get_one',
    //获取订单信息
    traffic_server_get_one_driver_demand: '/api/driver_demand/get_one',
    //编辑推送次数
    traffic_server_demand_add_push_count: '/api/demand/add_push_count',
    //编辑司机抢单推送次数
    traffic_server_driver_demand_add_push_count: '/api/driver_demand/add_push_count',
    //获取司机们派车状态
    traffic_server_plan_get_by_user_ids: '/api/driver_plan/get_by_user_ids',
    //获取某公司已经派遣车辆
    traffic_server_plan_get_used_truck_path: '/api/driver_plan/get_used_truck',
    //改变自有车辆司机
    traffic_server_trans_truck_driver: '/api/driver_plan/trans_truck_driver',
    //获取忙碌车辆数量
    traffic_server_truck_get_busy_count: '/api/route/get_busy_count',
    //根据条件查询需求单
    traffic_server_demand_find: '/api/demand/find',
    //根据设置条件查询需求单
    traffic_server_demand_recommend: '/api/demand/recommend',
    //根据设置条件查询需求单
    traffic_server_price_ask_recommend: '/api/price_ask/recommend',
    //获取系统推荐司机需求单
    traffic_server_driver_demand_recommend: '/api/driver_demand/recommend',
    //编辑物流需求单增加可抢单公司
    traffic_server_edit_traffic_demand_verify_company: '/api/demand/edit_traffic_demand_verify_company',
    //编辑物流询价增加可抢单公司
    traffic_server_price_ask_edit_verify_company: '/api/price_ask/edit_verify_company',
    //编辑物流需求单增加可抢单公司
    traffic_server_edit_traffic_demand_invite_list: '/api/demand/edit_traffic_demand_invite_list',
    //物流管理员获取司机抢单
    traffic_server_driver_offer_admin_get: '/api/driver_offer/admin_get',
    //司机获取未认证物流公司发布的司机需求单
    traffic_server_driver_get_driver_offer_order: '/api/order/driver_get_driver_offer_order',
    //更新线路中公司信息
    traffic_server_line_company_info: '/api/server/line/update_company_info'

};
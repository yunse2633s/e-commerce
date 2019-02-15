/**
 * Created by Administrator on 2016/4/14.
 */
module.exports = {
    traffic_demand_details: function(demand_id){    //物流需求单详情
        return 'tab.rushTranspDetail({demand_id:'+'\''+demand_id+'\''+'})';
    },
    relation_company_purchase: function(){
        return 'tab.my_company1';       //获取采购的公司（买东西的公司）
    },
    relation_company_sale: function(){
        return 'tab.my_company2';       //获取销售的公司（卖东西的公司）
    },
    relation_company_traffic: function(){
        return 'tab.my_company3';       //获取物流的公司
    },
    relation_company_traffic_driver: function(){
        return 'tab.my_logistics';       //司机获取物流的公司申请合作
    },
    relation_company_purchase_apply: function(){
        return 'tab.my_company1({order:true})';       //获取采购的公司（买东西的公司）
    },
    relation_company_sale_apply: function(){
        return 'tab.my_company2({order:true})';       //获取销售的公司（卖东西的公司）
    },
    relation_company_traffic_apply: function(){
        return 'tab.my_company3({order:true})';       //获取物流的公司
    },
    relation_traffic_company_apply: function(){
        return 'tab.my_company1({type:'+'\''+'trade'+'\''+',order:true})';       //物流公司的交易合作企业(等待审核)
    },
    offer_now_trade: function(){            //交易立即抢单
        return 'tab.rush({status:'+'\''+'verified'+'\''+'})';
    },
    offer_now_traffic: function(){          //物流立即抢单
        return 'tab.rushTransp({verify:true})';
    },
    offer_now_driver: function(){          //司机立即抢单
        return 'tab.driverOrderList';
    },
    traffic_admin_price_offer: function(user_id){          //物流管理员增加线路报价
        return 'tab.pass_real_time_price({user_id:'+'\''+user_id+'\''+'})';
    },
    traffic_admin_private_truck: function(){          //物流管理员挂靠车辆
        return 'tab.my_company5';
    },
    traffic_admin_private_truck_apply: function(){          //物流管理员挂靠车辆申请认证列表
        return 'tab.my_company5({order:true})';
    },
    company_home: function(company_id, type){
        return 'tab.companyProHome({id:'+'\''+company_id+'\''+',type:'+'\''+type+'\''+'})';
    },
    signup: function(){
        return 'tab.newMessage';
    } ,
    keyInfo: function(){
        return 'tab.keyInfo';
    }


    //traffic_order_generated: function(order_id){
    //    return 'tab.passOrder({order_id:'+'\''+order_id+'\''+'})';
    //},
    //traffic_order_adv_payment: function(order_id){
    //    return 'tab.passOrder({order_id:'+'\''+order_id+'\''+'})';
    //},
    //traffic_order_driver_notice: function(route_id){
    //    return 'tab.driverOrderDetail({route_id:'+'\''+route_id+'\''+'})';
    //},
    //traffic_order_req_goods: function(order_id){
    //    return  'tab.StoreOrderDetail({order_id:'+'\''+order_id+'\''+'})'
    //}
};
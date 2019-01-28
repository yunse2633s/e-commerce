/**
 * 20170904 废弃
 */
module.exports = {
    traffic_driver_demand_verify_list: function(){
        return 'tab.driverOrderList({})';   //司机的认证货源
    },
    traffic_driver_demand_details: function(order_id){
        return 'tab.driverRecommendationSingle({data:'+'\''+order_id+'\''+'})';
    },
    traffic_price_ask_details: function(demand_id){
        return 'tab.passAskPriceDetail({id:'+'\''+demand_id+'\''+'})';
    },
    traffic_demand_details: function(demand_id){
        return 'tab.rushTranspDetail({demand_id:'+'\''+demand_id+'\''+'})';
    },
    traffic_demand_details_new: function(demand_id){
        return 'tab.rushTranspDetailNew({demand_id:'+'\''+demand_id+'\''+'})';
    },
    traffic_order_details: function(order_id){//三方物流订单详情
        return 'tab.passOrder({order_id:'+'\''+order_id+'\''+'})';
    },
    traffic_order_details_new: function(order_id){  //三方物流订单详情
        return 'tab.passOrderNew({order_id:'+'\''+order_id+'\''+'})';
    },
    traffic_order_details_both: function(order_id){//两方物流订单详情
        return 'tab.trafficOrder({order_id:'+'\''+order_id+'\''+'})';
    },
    traffic_order_select_truck: function(order_id){
        return 'tab.SelectCar({order_id:'+'\''+order_id+'\''+'})';
    },
    driver_processing_order: function(route_id){
        return 'tab.driverOrderDetail({route_id:'+'\''+route_id+'\''+',msg:true})';
    },
    driver_plan_order: function(){
        return 'tab.isLoding({myOrders:'+'\'true\'})';
    },
    driver_finish_order: function(order_id){
        return 'tab.driverOrderNew({id:'+'\''+order_id+'\''+'})';
    },
    store_processing_order: function(order_id){
        return 'tab.StoreOrderDetail({order_id:'+'\''+order_id+'\''+'})';
    },
    traffic_company_relation_not_verify: function(){
        return 'tab.my_company3({me:true})';
    }


    //traffic_order_delivery_over: function(order_id){
    //    return 'tab.passOrder({order_id:'+'\''+order_id+'\''+'})';
    //},
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
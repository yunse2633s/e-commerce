var a = {
    "index" : "cg-17101468367",
    "user_demand_id" : "596c80b56d756f5d5d33e2ea",
    "payment_style" : "FOB",
    "product_categories" : [
        {
            "company_id" : "5969c9b2d03e721caf919791",
            "product_name" : [
                {
                    "price" : 120,
                    "preferential" : 100,
                    "name" : "1000",
                    "amount" : 23,
                    "amount_unit" : 0,
                    "number" : 23,
                    "price_update" : 0,
                    "price_preferential" : [],
                    "image" : [],
                    "measure_unit" : [],
                    "attribute" : [
                        {
                            "value" : "1",
                            "unit" : "mm",
                            "vary" : "",
                            "name" : "厚度",
                            "_id" : "59db3170ee24078714ae7166"
                        }
                    ],
                    "__v" : 0,
                    "number_remain" : 23
                }
            ],
            "replenish" : false,
            "path_loss" : false,
            "modify_amount" : false,
            "__v" : 0,
            "user_id" : "596c1beb41f109086b455f9b",
            "unit" : "吨",
            "pass_unit" : "吨",
            "_id" : "59e1e1a8a477426f2176824b",
            "layer_3" : "TDC51D+Z  CGCC  ",
            "layer_3_chn" : "TDC51D+Z  CGCC  ",
            "layer_2" : "caitujuan",
            "layer_2_chn" : "彩涂卷",
            "layer_1" : "tudulei",
            "layer_1_chn" : "涂镀类",
            "material" : "gangtie",
            "material_chn" : "钢铁"
        }
    ],
    "amount" : 23,
    "price" : 2760,
    "order_origin" : "DJ",
    "receive_location" : [
        110.044142,
        40.575948
    ],
    "receive_phone" : "13550000001",
    "receive_name" : "沈红娟",
    "receive_addr" : "河东1号大院院内",
    "receive_district" : "东河区",
    "receive_city" : "包头市",
    "receive_province" : "内蒙古",
    "send_location" : [
        114.127022,
        31.561165
    ],
    "send_phone" : "13680000021",
    "send_name" : "刘甜甜",
    "send_addr" : "大屋村",
    "send_district" : "大悟县",
    "send_city" : "孝感市",
    "send_province" : "湖北",
    "receive_address_id" : "596c82666d756f5d5d33e2f1",
    "send_address_id" : "59c8becba1d60ba4fc41a11e",
    "percent_advance" : [],
    "delay_type" : [],
    "delay_day" : [],
    "browse_offer" : [
        "596c80b56d756f5d5d33e2ea",
        "596c1beb41f109086b455f9b"
    ],
    "price_type" : "price_weight",
    "appendix" : "",
    "trafficOrder" : true,
    "replenishCar" : [],
    "replenish" : [],
    "status" : "effective",
    "step" : 3,
    "is_assign" : false,
    "price_arrival_weight" : 98400,
    "price_pick_up_weight" : 98400,
    "price_replenish" : 0,
    "preferential" : 2300,
    "amount_arrival_weight" : 24,
    "amount_pick_up_weight" : 24,
    "amount_been_demand" : 23,
    "path_loss" : [
        null
    ],
    "att_settlement" : [
        "all_cash"
    ],
    "att_traffic" : [
        "pick_up"
    ],
    "att_payment" : [
        "cash"
    ],
    "att_quality" : [
        "demand"
    ],
    "company_supply_id" : "5969c9b2d03e721caf919791",
    "company_supply_name" : "鸡西煤矿集团",
    "company_demand_name" : "内蒙经销商",
    "company_demand_id" : "5969c424d03e721caf91977b",
    "user_supply_id" : [
        "596c1beb41f109086b455f9b"
    ],
    "offer_id" : [
        "59e1e196a477426f21768246"
    ],
    "offerAgain_id" : "",
    "demandOffer_id" : "",
    "__v" : 1
};
console.log(a.product_categories[0].product_name[0].price);
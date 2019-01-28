var mongoose = require('mongoose');
var _ = require('underscore');
// var iconv = require('iconv-lite');
// var fs = require('fs');
var config_common = require('../configs/config_common')
var traffic_Demand ={
    "status": "success",
    "data": {
        "_id": "593fa4753a2ae8a52182730d",
        "index": "wlxq-17061346113",
        "index_trade": "cg-17061369416",
        "user_id": "58ba680f293beba14de4a896",
        "company_id": "58ba680f293beba14de4a894",
        "company_trade_name": "黎晓交易一号",
        "amount": 10,
        "amount_remain": 0,
        "att_traffic": {
            "one": [
                1,
                0,
                0
            ],
                "two": [
                0
            ]
        },
        "weigh_settlement_style": "fact",
        "time_depart": "2017-06-12T16:00:00.000Z",
    "can_join": false,
    "insurance": false,
    "invoice_name": "",
    "invoice_addr": "",
    "invoice_number": "",
    "invoice_phone": "",
    "invoice_bank": "",
    "invoice_account": "",
    "payment_choice": "cash",
    "payment_method": "all_goods",
    "count_day_extension": 5,
    "send_name": "卞田刚",
    "send_phone": "15235785781",
    "verify_need": false,
    "time_creation": "2017-06-13T08:38:13.716Z",
    "time_modify": "2017-06-13T08:38:13.716Z",
    "time_arrival": "2017-06-12T16:00:00.000Z",
    "material": "steel",
    "company_sell_id": "58ba680f293beba14de4a894",
    "company_buy_id": "58ba6864293beba14de4a8a4",
    "user_partner_id": "58ba6864293beba14de4a8a6",
    "company_partner_id": "58ba6864293beba14de4a8a4",
    "send_company_name": "黎晓交易一号",
    "receive_company_name": "黎晓二号超管",
    "send_province": "江苏",
    "send_city": "连云港市",
    "send_district": "灌南县",
    "send_addr": "1122",
    "receive_province": "北京",
    "receive_city": "北京市",
    "receive_district": "东城区",
    "receive_addr": "最强王者",
    "receive_name": "王大锤",
    "receive_phone": "18880000020",
    "price_type": "fix",
    "type": "TWO",
    "source": "trade_assign",
    "time_validity": "2017-06-13T10:38:12.381Z",
    "price": 2,
    "__v": 1,
    "order_count": 1,
    "offer_count": 0,
    "sms_timeArr": [],
    "three_company": false,
    "twelve_hours": false,
    "is_sms": false,
    "status": "complete",
    "verify_company": [
        "58ba6ddc293beba14de4a908",
        "58ba6ddc293beba14de4a908"
    ],
    "unoffer_list": [],
    "offer_list": [],
    "offer_user": [],
    "unsignup_list": [],
    "signup_list": [],
    "invite_list": [],
    "receive_loc": [
        "116.416357",
        "39.928353"
    ],
    "send_loc": [
        "119.315651",
        "34.087135"
    ],
    "products_replenish": [
        {
            "category_chn": "普线",
            "category": "steel_puxian",
            "guige": "Φ10",
            "caizhi": "HPB235",
            "price": 222
        }
    ],
    "products_remain": [
        {
            "key": "steel_luowengang-HRB500-Φ16-9",
            "count": 5
        }
    ],
    "products": [
        {
            "category": "steel_luowengang", //1级目录
            "category_chn": "螺纹钢",
            "amount": "10", //总吨数
            "count": " ",  //总件数
            "type": "steel",
            "detail": [
                {
                    "caizhi": "HRB500", //2级目录
                    "amount": 10,
                    "number": [
                        {
                            "guige": "Φ16",  //3级目录
                            "amount": 10,
                            "long": [
                                {
                                    "long": 9,  //产品名称
                                    "amount": 10,
                                    "count": 5
                                }
                            ]
                        }
                    ]
                }
            ],
            shop_unit: '吨/件',//商品单位
            pass_unit: '吨', //运输单位
            "price": "2"    // 运输单价
        },
        {
            "category": "coal_penchuimei", //1级目录
            "category_chn": "喷吹煤",
            "amount": "10", //总吨数
            "type": "steel",
            "detail": [ ],  //商品单位 为件数的参数
            "product_desc": [ ], //商品单位 为吨数的参数
            shop_unit: '吨',//商品单位
            pass_unit: '吨', //运输单位
            "price": "2"    // 运输单价
        }
    ],
    "user_name": "交易一号超管",
    "user_photo": "http://192.168.3.248:18080/58ba680f293beba14de4a894_logo_kx.jpg",
    "user_role": "TRADE_ADMIN",
    "company_name": "黎晓交易一号",
    "company_logo": "http://192.168.3.248:18080/58ba680f293beba14de4a894_logo_fx.jpg",
    "verify_phase": "SUCCESS"
}
}
// var gbk = require('gbk');

//交易订单中的产品结构：

var product_categories = [
    {
    material: 'steel',      // 行业大类
    material_chn: '钢铁',   // 行业大类
    unit: '吨/件',           // 单位
    layer_1: 'steel_luowengang',        // 行业第1类
    layer_1_chn: '螺纹钢',    // 行业第1类中文
    layer_2: 'HRB400',           // 行业第2类
    layer_2_chn: 'HRB400',       // 行业第2类中文
    layer_3: 'Φ12',           // 行业第3类
    layer_3_chn: 'Φ12',       // 行业第3类中文
    product_name: [
        {  name: '9米',   attribute: [{
            name: '件重',
            unit: '吨',
            value: 12, // 1件9米的重量
            vary: 'mins'}],
            unit: '件',
            number: 123 // 9米件数
        },
        {  name: '12米',   attribute: [{name: '件重', unit: '吨',value: 12,vary: 'mins'}],  unit: '件',  number: 123 }
    ],       // 产品名称
    attribute: 'String',          // 属性
    shop_unit:'吨/件', //商品单位
    pass_unit:'吨' , //运输单位
    replenish: 'String',         // 是否允许补货
    path_loss: 'String',         // 是够计算路耗
    modify_amount: 'String',     // 指派物流时是否允许修改吨数
    amount: '',//总吨数
    price: '',//总价格
},
    {
        material: 'coal',      // 行业大类
        material_chn: '煤炭',   // 行业大类
        unit: '吨',           // 单位
        layer_1: 'coal_wuyanmei',        // 行业第1类
        layer_1_chn: '无烟煤',    // 行业第1类中文
        layer_2: '',           // 行业第2类
        layer_2_chn: '',       // 行业第2类中文
        layer_3: '',           // 行业第3类
        layer_3_chn: '',       // 行业第3类中文
        product_name: [
            {  name: '',
                attribute: [
                    {
                        name: '发热量',
                        unit: 'kcal/kg',
                        value: 4000, // 发热量标准值
                        vary: 'mins'},
                    {name: '水分', unit: '%',value: 12,vary: 'mins'}],
                unit: '吨',
                number: 100, //产品吨数
            },
        ],       // 产品名称
        attribute: 'String',          // 属性
        shop_unit:'吨/件', //商品单位
        pass_unit:'吨' , //运输单位
        replenish: 'String',         // 是否允许补货
        path_loss: 'String',         // 是够计算路耗
        modify_amount: 'String',     // 指派物流时是否允许修改吨数
        amount: '',//总吨数
        price: '',//总价格
    }
];

debugger;
   var attr_produce = [{
    amount: 62.269,
    category: "steel_luowengang",
    category_chn: "螺纹钢",
    detail: [{
        amount: 62.269,
        caizhi: "HRB500E",
        number: [{
            amount: 8.893,
            guige: "Φ20",
            long: [{
                amount: 3.557,
                count: 1,
                long: 12,
            },{

            }],
        }],
    }],
    price: 5,
    type: "steel",
}]




var transform = function(product_categories){
        var d= [];
        var layer3 = [];
        var layer1 = [];
        var common = {};
        _.each(product_categories, function (x) {
            if(x.layer_2){
                layer3.push(x);
            }else{
                layer1.push(x);
            }
        })
        _.each(layer1, function (x) {
            d.push({
                amount: x['product_name'][0]['number'],
                category: x.layer_1,
                detail: [],
                price: 10,
                product_desc: x['product_name'][0]['attribute'],
                type: x.material,
            })
            if(!common[x.layer_1]){
                common[x.layer_1] ={
                    category_chn: x['layer_1_chn'],
                    attribute: x['attribute'],          // 属性
                    shop_unit: x['shop_unit'], //商品单位
                    pass_unit: x['pass_unit'] , //运输单位
                    replenish: x['replenish'],         // 是否允许补货
                    path_loss: x['path_loss'],         // 是够计算路耗
                    modify_amount: x['modify_amount'],     // 指派物流时是否允许修改吨数
                }
            }

        });
        //若有3级目录且件数计算
        var a = {}; // 产品名称 最低层
        _.each(layer3, function(x){

            var long = [];
            _.each(x.product_name, function(y){
                long.push({
                    amount: y['number'] * y['attribute'][0]['value'],
                    count: y['number'],
                    long: y['name'],


                })
            })
            if(a[x.layer_1 + ';' + x.layer_2 + ';' + x.layer_3]){
                a[x.layer_1 + ';' + x.layer_2 + ';' + x.layer_3][long].push(long)

            }else{
                a[x.layer_1 + ';' + x.layer_2 + ';' + x.layer_3] = {
                    key: x.layer_1 + ';' + x.layer_2 + ';' + x.layer_3,
                    long : long
                }
            }
            if(!common[x.layer_1]){
                common[x.layer_1] ={
                    category_chn: x['layer_1_chn'],
                    attribute: x['attribute'],          // 属性
                    shop_unit: x['shop_unit'], //商品单位
                    pass_unit: x['pass_unit'] , //运输单位
                    replenish: x['replenish'],         // 是否允许补货
                    path_loss: x['path_loss'],         // 是够计算路耗
                    modify_amount: x['modify_amount'],     // 指派物流时是否允许修改吨数
                }
            }


        })

        //合并相同key;

        var b = {}; // 第三层
        _.each(a, function(x){
            var number = [];

            var x_split = x.key.split(';');
            number.push({
                amount: '',
                guige: x_split[2],
                long: x.long,

            })
            if(b[x_split[0] + ';' + x_split[1]]){
                b[x_split[0] + ';' + x_split[1]]['number'].push(number)
            }else{
                b[x_split[0] + ';' + x_split[1]] = {
                    key: x_split[0] + ';' + x_split[1],
                    number: number
                }
            }

        })

        //合并相同的key

        var c = {}; // 第二层
        _.each(b, function(x){
            var detail = [];
            var x_split = x.key.split(';');
            detail.push({
                amount: '',
                caizhi: x_split[1],
                number: x.number
            })
            if(c[x_split[0]]){
                c[x_split[0]]['detail'].push(detail);
            }else{
                c[x_split[0]] = {
                    key: x_split[0],
                    detail: detail
                }
            }

        })
        _.each(c, function(x){
            x.material = x.key.split('_')[0];
            d.push({
                amount: '',
                category: x.key,
                detail: x.detail,
                price:'',
                type: x.material
            })
        })
        //将最后产品的特殊属性附加
        var e = []
        _.each(d, function (x) {
            var tmp = {};
            tmp = _.extend(tmp, x);
            tmp = _.extend(tmp, common[x.category])
            e.push(tmp);
        })

        // 合并相同 key
    return e;
};
debugger;
var driverProduce = [{
    amount: 62.269,
    category: "steel_luowengang",
    category_chn: "螺纹钢",
    detail: [{
        amount: 62.269,
        caizhi: "HRB500E",
        number: [{
            amount: 8.893,
            guige: "Φ20",
            long: [{
                amount: 3.557,
                count: 2,
                long: 12,
            },{
                amount: 3.557,
                count: 5,
                long: 12,
            }],
        }],
    },{
        amount: 29.12,
        category: "steel_puxian",
        category_chn: "普线",
        detail: [{
            amount: 29.12,
            caizhi: "HPB300",
            number: [{
                amount: 4.16,
                guige: "Φ12",
                long: [{
                    amount: 4.16,
                    count: 2,
                }],
            }],
        }],
        price: 10,
        type: "steel",
    }
    ],
    price: 5,
    type: "steel",
},
    {
        $$hashKey: "object:1737",
        amount: 10,
        category: "coal_donglimei",
        category_chn: "动力煤",
        detail: [],
        price: 10,
        product_desc: {
            fareliang: {
                name: "fareliang",
                name_chn: "发热量",
                unit: "k-cal/kg",
                value: 5700,
            },
            nianjiezhishu: {
                name: "nianjiezhishu",
                name_chn: "粘结指数",
                unit: "",
                value: 27,
            },
        },
        type: "coal",
    }
];
var tranform_driverProduce = function(count, product){
    var count = count;
    _.each(product, function (a) {
        _.each(a.detail, function (b) {
            _.each(b.number, function (c) {
                _.each(c.long, function (d) {
                    //若count 为0 则 d.count=0; 若count>d.count， 则d.count=d.count; 若count<d.count,则d.count = count;
                    //指派 count_assign 多少，剩余 count_remain 多少，count为总数
                    if(count>=d.count){
                        d.count_assign = d.count;
                        d.count_remain = 0;
                    }else{
                        d.count_assign = count;
                        d.count_remain = d.count - count;

                    }
                    count = (count - d.count)<=0 ? 0 : count - d.count;
                })
            })
        })
    });
    //合计指派总件数

    _.each(product, function (a) {
        a.count = 0;
        _.each(a.detail, function (b) {
            b.count = 0;
            _.each(b.number, function (c) {
                c.count = 0;
                _.each(c.long, function (d) {
                    c.count += d.count_assign;
                })
                b.count += c.count;
            })
            a.count += b.count;
        })
    })
    return product;
};

// /**
 //用户输入结构
 var body_prices = [{category:'steel_panluo', count:10},{category:'steel_gaoxian', count:0}];
 //产品详情
 var pass_product = [
 {
     "modify_amount" : false,
     "path_loss" : false,
     "replenish" : true,
     "pass_unit" : "吨",
     "shop_unit" : "件",
     "category_chn" : "高线",
     "type" : "steel",
     "price" : 10,
     "detail" : [
         {
             "count" : 12,
             "number" : [
                 {
                     "count" : 12,
                     "long" : [
                         {
                             "long" : "",
                             "count" : 5,
                             "amount_unit" : 222,
                             "amount" : 1110
                         },
                         {
                             "long" : "",
                             "count" : 7,
                             "amount_unit" : 222,
                             "amount" : 1554
                         }
                     ],
                     "guige" : "Φ6.5",
                     "amount" : 2664
                 }
             ],
             "caizhi" : "ML08AI",
             "amount" : 2664
         }
     ],
     "category" : "steel_gaoxian",
     "count" : 12,
     "amount" : 2664
 },
 {
     "modify_amount" : false,
     "path_loss" : false,
     "replenish" : true,
     "pass_unit" : "吨",
     "shop_unit" : "件",
     "category_chn" : "盘螺",
     "type" : "steel",
     "price" : 10,
     "detail" : [
         {
             "count" : 12,
             "number" : [
                 {
                     "count" : 12,
                     "long" : [
                         {
                             "long" : "",
                             "count" : 5,
                             "amount_unit" : 222,
                             "amount" : 1110
                         }
                     ],
                     "guige" : "Φ6.5",
                     "amount" : 2664
                 }
             ],
             "caizhi" : "ML08AI",
             "amount" : 2664
         }
     ],
     "category" : "steel_panluo",
     "count" : 12,
     "amount" : 2664
 }
 ];
 //产品汇总
 var products_remain = [
 {
     "amount_unit" : 1.5,
     "count" : 100,
     "key" : "steel_panluo-ML08AI-Φ6.5-"
 },{
                    "amount_unit" : 1.5,
                    "count" : 100,
                    "key" : "steel_gaoxian-ML08AI-Φ9-"
                },{
                    "amount_unit" : 1.5,
                    "count" : 100,
                    "key" : "steel_puxian-ML08AI-Φ8-"
                }
 ];
 // **/

//用户输入件数，返回对应产品推算;
var countsToProduct = function (counts, product) {
    var body_obj = _.object(_.pluck(body_prices, 'category'), _.pluck(body_prices, 'count'));
    _.each(product, function (a) {
        a.amount = 0;
        _.each(a.detail, function (b) {
            b.amount = 0;
            _.each(b.number, function (c) {
                c.amount = 0;
                _.each(c.long, function (d) {
                    if(body_obj[a.category]){
                        //如果body_obj中存在这个分类产品，则减少对应数字
                        if(body_obj[a.category]<=0){
                            d.count = 0;
                        }
                        if(body_obj[a.category] < d.count){
                            d.count = body_obj[a.category];
                            body_obj[a.category] = 0;
                        }else{
                            body_obj[a.category] = body_obj[a.category] - d.count;
                        }
                    }else{
                        d.count = 0;
                    }
                    //计算吨数，为0 则删除;
                    d.amount = d.count * d.amount_unit;
                    c.amount = c.amount + d.amount;
                })
                b.amount = b.amount + c.amount;
            })
            a.amount = a.amount + b.amount;
        })
    })
    return product;
};
//用户输入产品，返回非零的产品
var eraser_zero = function (obj) {
    var vObj = obj;
    for(var kx=0; kx < vObj.length; kx++){
        if(vObj[kx]['amount']==0) {
            
            vObj.splice(kx,1);
            kx--;
            continue;
        }

        for(var ky=0; ky < vObj[kx]['detail'].length; ky++){
            if(vObj[kx]['detail'][ky]['amount']==0) {
                vObj[kx]['detail'].splice(ky,1);
                ky--;
                continue;
            }

            for(var kz=0; kz < vObj[kx]['detail'][ky]['number'].length; kz++){
                if(vObj[kx]['detail'][ky]['number'][kz]['amount']==0) {
                    vObj[kx]['detail'][ky]['number'].splice(kz,1);
                    kz--;
                    continue;
                }
                for(var ko=0; ko < vObj[kx]['detail'][ky]['number'][kz]['long'].length; ko++){
                    if(vObj[kx]['detail'][ky]['number'][kz]['long'][ko]['amount']==0) {
                        vObj[kx]['detail'][ky]['number'][kz]['long'].splice(ko,1);
                        ko--;
                        continue;
                    }
                }
            }
        }
    }
    return vObj;
};
//用户输入产品，返回剩余产品结构(?是否会出现其他问题？exp:负数，或超过原产品详情)
var countToProductRemain = function (counts, products_remain) {
    _.each(body_prices, function (a) {
        _.each(products_remain, function (b) {
            var pro_arr = b.key.split('-');
            if(pro_arr[0] == a.category){
                if( a.count >= b.count){
                    a.count = a.count - b.count;
                    b.count = 0;
                }else{
                    b.count = b.count-a.count;
                    a.count = 0;
                }
            }
        })
    });
    for(var i=0; i<products_remain.length; i++){
        if(products_remain[i].count<=0){
            products_remain.splice(i,1);
            i--;
        }
    }
    // return products_remain;

};
//用户输入产品，返回被选中的产品结构 ；或是由所选产品详情转为所选产品结构
var unCountToProductRemain = function (body_prices, products_remain) {
    var _tmp = []
    _.each(body_prices, function (a) {
        _.each(products_remain, function (b) {
            if(new RegExp(a.category).test(b.key)){
                if(a.count<=b.count){
                    b.count = a.count;
                    a.count = 0;
                    _tmp.push(b);
                }else{
                    a.count = a.count - b.count;
                    _tmp.push(b);
                }
            }
        })
    });

};

//补货结构
var products_replenish = [
    {
        "pass_price": 10,
        "_id": "59549805084e4204c2135f0d",
        "material_chn": "钢铁",
        "layer_1_chn": "螺纹钢",
        "material": "steel",
        "layer_1": "steel_luowengang",
        "unit": "件",
        "pass_unit": "吨",
        "offer_id": "59549805084e4204c2135f0b",
        "__v": 0,
        "modify_amount": false,
        "path_loss": false,
        "replenish": true,
        "product_name": [
            {
                "attribute": [
                    {
                        "_id": "594a12ef4e94043b9154a0e7",
                        "name": "重量",
                        "calculate": true,
                        "vary": "",
                        "unit": "吨/件",
                        "isTrue": true,
                        "value": "1"
                    }
                ],
                "name": "9米",
                "amount_unit": 1,
                "number": "10",
                "price": 10,
                "preferential": 0,
                "amount": 10
            },
            {
                "attribute": [
                    {
                        "_id": "594a12ef4e94043b9154a0e7",
                        "name": "重量",
                        "calculate": true,
                        "vary": "",
                        "unit": "吨/件",
                        "isTrue": true,
                        "value": "2"
                    }
                ],
                "name": "12米",
                "amount_unit": 2,
                "number": "20",
                "price": 10,
                "preferential": 0,
                "amount": 40
            }
        ],
        "layer_4_chn": "",
        "layer_4": "",
        "layer_3_chn": "Φ14",
        "layer_3": "Φ14",
        "layer_2_chn": "HRB500E",
        "layer_2": "HRB500E",
        "falg": true
    }
];
var get_products_amount = function(){
    return _.pluck(_.flatten(_.pluck(products_replenish, 'product_name') ), 'amount');
}
var judge_Array = [['payment_choice', 'enum'],['time_validity', 'number'], ['user_ids']]

var driverPassList = function (amount ,product, list) {

    var start = (new Date()).getTime();
    var sign_amount = Number(amount);
    var pass_list = JSON.parse(JSON.stringify(list));
    var pass_product = JSON.parse(JSON.stringify(product));
    _.each(pass_list, function (a) {
        a.amount = config_common.rscDecimal('mul', a.count, a.amount_unit);
        if(sign_amount>0){
            var count_div = Math.ceil(config_common.rscDecimal('div', sign_amount, a.amount_unit));
            a.count = count_div > a.count ? a.count : count_div;
            sign_amount = config_common.rscDecimal('sub', sign_amount, a.amount);
        }else{
            a.count = 0;
        }
    })
    for(var i=0; i<pass_list.length; i++){
        if(pass_list[i].count<=0){
            pass_list.splice(i, 1);
            i--;
        }
    }
    var pass_list_obj = _.object(_.pluck(pass_list, 'key'), _.pluck(pass_list, 'count'));
    _.each(pass_product, function (a) {
        a.amount = 0;
        a.count = 0;
        _.each(a.detail, function (b) {
            b.amount = 0;
            b.count = 0;
            _.each(b.number, function (c) {
                c.amount = 0;
                c.count = 0;
                _.each(c.long, function (d) {
                    
                    if(pass_list_obj[a.category+'-'+b.caizhi+'-'+c.guige+'-'+d.long]){
                        d.count = pass_list_obj[a.category+'-'+b.caizhi+'-'+c.guige+'-'+d.long];
                        d.amount = config_common.rscDecimal('mul', d.count, d.amount_unit);
                        
                    }else{
                        d.count = d.amount = 0;
                    }
                    c.count = config_common.rscDecimal('add', c.count, d.count);
                    c.amount = config_common.rscDecimal('add', c.amount, d.amount);
                })
                b.count = config_common.rscDecimal('add', b.count, c.count);
                b.amount = config_common.rscDecimal('add', b.amount, c.amount);
            })
            a.count = config_common.rscDecimal('add', a.count, b.count);
            a.amount = config_common.rscDecimal('add', a.amount, b.amount);
        })
    })
    eraser_zero(pass_product);
    // console.log('响应时间', (new Date()).getTime() - start , '秒');
    
}
// driverPassList(20, pass_product, products_remain)
var product_categories =  [
    {
        "_id" : "595c76a778900f983c376ee7",
        "material_chn" : "钢铁",
        "layer_1_chn" : "普线",
        "material" : "steel",
        "layer_1" : "steel_puxian",
        "unit" : "件",
        "pass_unit" : "吨",
        "pass_price" : 10,
        "offer_id" : "595c76a778900f983c376ee5",
        "__v" : 0,
        "modify_amount" : false,
        "path_loss" : false,
        "replenish" : true,
        "product_name" : [
            {
                "attribute" : [
                    {
                        "_id" : "594a12ef4e94043b9154a0e7",
                        "name" : "重量",
                        "calculate" : true,
                        "vary" : "",
                        "unit" : "吨/件",
                        "isTrue" : true,
                        "value" : "2"
                    }
                ],
                "name" : "",
                "amount_unit" : 2,
                "number" : "40",
                "amount" : 80,
                "price" : 1.5,
                "preferential" : 0
            }
        ],
        "layer_4_chn" : "",
        "layer_4" : "",
        "layer_3_chn" : "Φ6.5",
        "layer_3" : "Φ6.5",
        "layer_2_chn" : "HPB235",
        "layer_2" : "HPB235"
    },
    {
        "material_chn" : "钢铁",
        "layer_1_chn" : "螺纹钢",
        "layer_2_chn" : "HRB400E",
        "layer_3_chn" : "Φ12",
        "material" : "steel",
        "layer_1" : "steel_luowengang",
        "layer_2" : "HRB400E",
        "layer_3" : "Φ12",
        "product_name" : [
            {
                "attribute" : [
                    {
                        "_id" : "594a12ef4e94043b9154a0e7",
                        "name" : "重量",
                        "calculate" : true,
                        "vary" : "",
                        "unit" : "吨/件",
                        "isTrue" : true,
                        "value" : "1"
                    }
                ],
                "name" : "9米",
                "amount_unit" : 1,
                "number" : 9,
                "amount" : 9,
                "preferential" : 0
            },
            {
                "attribute" : [
                    {
                        "_id" : "594a12ef4e94043b9154a0e7",
                        "name" : "重量",
                        "calculate" : true,
                        "vary" : "",
                        "unit" : "吨/件",
                        "value" : "2",
                        "isTrue" : true
                    }
                ],
                "name" : "12米",
                "amount_unit" : 2,
                "number" : 7,
                "preferential" : 0,
                "amount" : 14
            }
        ],
        "unit" : "件",
        "pass_unit" : "吨",
        "pass_price" : 20,
        "offer_id" : null,
        "replenish" : true,
        "modify_amount" : false
    },
];
// ①先取出吨数，比较是否超过剩余吨数； ② 转换给物流格式的产品详情； ③ 将为空的数据删除； ④将物流产品转换为

// 指派公司
var assign_company = function () {
    var company_ids = ["5912a4f02ce1d1959bfabcd1",
        "591fadb609e134a01c02cdda",
        "5927c996ff678c554cf899fc",
        [
            "5912a4f02ce1d1959bfabcd1"
        ],
        [
            "5927c996ff678c554cf899fc"
        ]];
    _.each(company_ids, function (x) {
        if(_.isArray(x)){
            console.log('company_ids_invalid_format');
        }
    });
    // console.log('company_ids', company_ids);
}
var products_remain = [
    {
        "pass_price" : 5,
        "amount_unit" : 2,
        "count" : 9,
        "key" : "steel_luowengang-HRB500E-Φ32-9米"
    },
    {
        "pass_price" : 10,
        "amount_unit" : 3,
        "count" : 8,
        "key" : "steel_luowengang-HRB500E-Φ32-12米"
    },
    {
        "pass_price" : 13,
        "amount_unit" : 1.2,
        "count" : 7,
        "key" : "steel_luowengang-HRB400-Φ16-9米"
    },
    {
        "pass_price" : 20,
        "amount_unit" : 2.1,
        "count" : 6,
        "key" : "steel_luowengang-HRB400-Φ16-12米"
    },
    {
        "pass_price" : 25,
        "amount_unit" : 33,
        "count" : 5,
        "key" : "steel_gaoxian-BL1-Φ10"
    }
]
//通过产品 目录计算产品吨数和产品总价和最大最小值
var products_catelog = function (obj) {
    var amount = 0, price = 0, price_arr=[];
    _.each(obj, function (a) {
        amount = amount + (a.amount_unit*a.count);
        price = price + (a.amount_unit*a.count*a.pass_price);
        price_arr.push(a.pass_price);
    })
    // console.log({amount:amount, price: price, price_arr:price_arr});
};

/**
 *
 * @param body
 * @param paramArr   必传的参数
 * @param cb
 * @param chooseArr  在某种情况下 必传哪些参数
 * @param index    用于拼接param  检验config_common是否有枚举
 * @returns {*}
 */
var checkBody = function (body, paramArr, cb, chooseArr, index) {
    if (!chooseArr) chooseArr = [];
    for (var i = 0; i < paramArr.length; i++) {
        var param = paramArr[i];
        //若为0, false, '', null, 则退出循环
        if (body[param] === 0 || body[param] === false || body[param] === "" || body[param] === '') continue;
        if (!body[param] ||//检验参数是否存在
            (_.isArray(body[param]) && (body[param].length === 0) ||//当value为数组时  长度不能为0
            (_.isObject(body[param][0]) && !_.isArray(body[param][0]) && config_model[param] && !this.checkObj(body[param][0], config_model[param]))) ||//当value为数组时  检验config_model中是否有规定格式  如果有 检验value【0】是否有效
            (_['isString'](body[param]) && config_model[param] && !config_model[param][body[param]]) ||// 当value为字符串时  检验config_model中是否有枚举  如果有 是否有改value
            config_model[param] && _.isObject(body[param]) && !_.isArray(body[param]) && !this.checkObj(config_model[param], body[param]) ||// 当value为对象时  检验config_model中是否有规定格式  如果有 检验value是否有效
            (config_model[index + '_' + param] && _['isString'](body[param]) && !config_model[index + '_' + param][body[param]])// 当value为字符串时  检验config_model中是否有枚举  如果有 是否有改value
        ) {
            return cb(this.invalid_format + " : " + param);
        }
    }
    //检验规定情况下 必须传什么参数 [{payment_style:CIF},['price']]  在payment_style的值为CIF的时候  price为必传参数 否则则不用必传
    for (var j = 0; j < chooseArr.length; j++) {
        var arr = chooseArr[j];
        var is_true = false;
        if (_.isArray(arr)) {
            for (var k = 0; k < arr.length; k++) {
                var choose = arr[k];
                if (_.isObject(choose)) {
                    for (var att in choose) {
                        if (choose.hasOwnProperty(att)) {
                            if (body[att] === choose[att]) {
                                is_true = true;
                            }
                        }
                    }
                }
                if (_.isArray(choose) && is_true) {
                    for (var n = 0; n < choose.length; n++) {
                        if (!body[choose[n]]) {
                            return cb(this.invalid_format + ' : ' + choose[n]);
                        }
                    }
                }
            }
        }
    }
    cb();
};


var trade_pro  = [
    {
        "_id":"59827a22be43669e3e457753",
        "material_chn":"钢铁",
        "layer_1_chn":"螺纹钢",
        "material":"steel",
        "layer_1":"steel_luowengang",
        "unit":"件",
        "pass_unit":"吨",
        "offer_id":"59827a22be43669e3e457751",
        "__v":0,
        "modify_amount":false,
        "path_loss":false,
        "replenish":true,
        "product_name":[
            {
                "attribute":[
                    {
                        "_id":"594a12ef4e94043b9154a0e7",
                        "name":"理计",
                        "read":true,
                        "calculate":true,
                        "vary":"",
                        "unit":"吨/件",
                        "isTrue":true,
                        "value":"2"
                    }
                ],
                "name":"9米",
                "amount_unit":2,
                "number":5,
                "amount":20,
                "price":5,
                "number_remain":10
            }
        ],
        "layer_4_chn":"",
        "layer_4":"",
        "layer_3_chn":"Φ16",
        "layer_3":"Φ16",
        "layer_2_chn":"HRB400",
        "layer_2":"HRB400",
        "can_assign":true,
        "pass_price":10,
        "pass_amount":10
    },
    {
        "_id":"59827a22be43669e3e457753",
        "material_chn":"钢铁",
        "layer_1_chn":"螺纹钢",
        "material":"steel",
        "layer_1":"steel_luowengang",
        "unit":"件",
        "pass_unit":"吨",
        "offer_id":"59827a22be43669e3e457751",
        "__v":0,
        "modify_amount":false,
        "path_loss":false,
        "replenish":true,
        "product_name":[
            {
                "attribute":[
                    {
                        "_id":"594a12ef4e94043b9154a0e7",
                        "name":"理计",
                        "read":true,
                        "calculate":true,
                        "vary":"",
                        "unit":"吨/件",
                        "isTrue":true,
                        "value":"4"
                    }
                ],
                "name":"12米",
                "amount_unit":4,
                "number":10,
                "amount":40,
                "price":5,
                "number_remain":10
            }
        ],
        "layer_4_chn":"",
        "layer_4":"",
        "layer_3_chn":"Φ16",
        "layer_3":"Φ16",
        "layer_2_chn":"HRB400",
        "layer_2":"HRB400",
        "can_assign":true,
        "pass_price":12,
        "pass_amount":40
    },
    {
        "_id":"59818a068e8f45531f9c97ec",
        "material_chn":"钢铁",
        "layer_1_chn":"高线",
        "material":"steel",
        "layer_1":"steel_gaoxian",
        "unit":"件",
        "pass_unit":"吨",
        "offer_id":"59818a068e8f45531f9c97ea",
        "__v":0,
        "modify_amount":false,
        "path_loss":false,
        "replenish":true,
        "product_name":[
            {
                "attribute":[
                    {
                        "_id":"594a12ef4e94043b9154a0e7",
                        "name":"理计",
                        "read":true,
                        "calculate":true,
                        "vary":"",
                        "unit":"吨/件",
                        "isTrue":true,
                        "value":"3"
                    }
                ],
                "name":"",
                "amount_unit":3,
                "number":3,
                "amount":30,
                "price":4,
                "number_remain":10
            }
        ],
        "layer_4_chn":"",
        "layer_4":"",
        "layer_3_chn":"Φ12",
        "layer_3":"Φ12",
        "layer_2_chn":"BL1",
        "layer_2":"BL1",
        "can_assign":true,
        "pass_price":13,
        "pass_amount":9
    }
];
// console.log( '====', _.uniq(_.pluck(trade_pro, 'layer_1_chn')),  _.uniq(_.pluck(trade_pro, 'layer_1')))

var products_remain =[
        {
            "key": "steel_luowengang;HRB400;Φ16.5;9米",
            "count": 5,
            "amount_unit": 2
        },
        {
            "key": "steel_luowengang;HRB400;Φ16;12米",
            "count": 7,
            "amount_unit": 4
        }
    ];
// var c = _.reduce(trade_pro, function (x, y) {
//     console.log('x', x, '\n');
//     console.log('y', y)
// }, [])

// var times = setInterval(function(){
//     console.log('欢迎')
// }, 5000)

var checkout_fields = ['index_trade','scene','time_depart','time_arrival','payment_choice',
    'payment_method','weigh_settlement_style','att_traffic','time_validity','company_ids','product_categories'];//'price_type','appendix','prices'

var checkout_fields =[
    {field: 'index_trade', type:'string'},
    {field: 'scene', type:'string'},
    {field: 'time_depart', type:'date'},
    {field: 'time_arrival', type:'date'},
    {field: 'payment_choice', type:'enum'},
    {field: 'payment_method', type:'enum'},
    {field: 'weigh_settlement_style', type:'enum'},
    {field: 'att_traffic', type:'array'},
    {field: 'time_validity', type:'number'},
    {field: 'company_ids', type:'array'},
    {field: 'product_categories', type:'object'}
];
/**
var checkField = function(req, base, cb){
    //检查字符串、数字、数组、对象, 关联关系的检查 relate; 如果发生错误，则退出
    var checkFieldModel = function(base, obj){
        for( x of obj){
            for( y of config_common[base]){
                if(!x[y]){
                    return y;
                }
            }
        }

    };
    var checkFieldType = function(e){
        switch (e.type){
            case 'string':
                return !!req.body[e.field];
            break;
            case 'number':
                return !!( req.body[e.field] && _.isNumber(req.body[e.field]) );
                break;
            case 'array':
                return !!( req.body[e.field] && _.isArray(req.body[e.field]) );
                break;
            case 'date':
                return !!( req.body[e.field] && (new Date(req.body[e.field])) && ( new Date(req.body[e.field]) )>new Date() );
                break;
            case 'object':
                return !!( (req.body[e.field]) && !checkObj(e.field, req.body[e.field]) );                
                break;
            case 'enum':
                return !!( (req.body[e.field]) && config_common[e.field](req.body[e.field]) );
                break;
            default :
                return false;
                break;
        }
    };
    for(key of base) {
        if( !checkType(key) ){
            cb(key.field);
            break;
        }
    }
};
var req = {
    body: {
        index_trade: 'a',
        product_categories: [{'pass_price':  1,'layer_1' :'a', 'product_name': 'b'}],
        time_validity: 8
    }
}
 **/
// checkField(req, checkout_fields, function(e){
//     console.log('===', e)
// })
// config_common.checkField(req, checkout_fields, function(e){
//     console.log('===', e)
// })

// var ceshi_json = { suibian: ["alloy","coal","powder","steel"] }
// //iconv.encode(str, 'gbk')
// var tostring = JSON.stringify(ceshi_json); //将对象转成字符串
// var gbk = iconv.encode(tostring, 'utf8'); //将字符串装成utf8 或gbk 编码
// console.log('gbk', gbk)
// console.log('gbk.toString', gbk.toString())
// var gbkstring = gbk.toString();
// JSON.parse(gbkstring)

// console.log('json', JSON.toString(ceshi_json))
// fs.readFile('./gbkmodel.js', function(err, result){
//     console.log('json',  result);
//     // var gbkd = result.toString('gbk',0,result.length);
//     // gbkd = iconv.encode(gbkd, 'utf8');
//     // gdkb = iconv.decode(gbkd, 'gbk');
//     // console.log('gdkb', gdkb);
//     // console.log('gdkb', JSON.parse(gdkb))
//     // var gbk2 = gbk.toString('utf-8', result);
//     var gbk2 = result.toString('utf-8');
//     console.log('gbk2', gbk2, typeof(gbk2))
//    
//     console.log('parse', JSON.stringify(gbk2))
// });

// var getVerifyCode = function () {
//     var codebase = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z',0,1,2,3,4,5,6,7,8,9];
//
//     var random = '';
//     for(var i = 0; i< 4; i++) {
//         var s_index = Math.floor(Math.random() * codebase.length);
//         random += codebase[s_index];
//     }
//     console.log(random);
// }
// getVerifyCode()

//trade_pro to catalogue
/**
var getCatalogue = function () {
    var catalogue = [];
    _.each(trade_pro, function (a) {
        _.each(a.product_name, function (b) {
            var key = a.layer_1 + ';' + a.layer_2 + ';' + a.layer_3;
            if(b.name){
                key = key + ';'+b.name;
            }
            catalogue.push(key);
        })
    });
    return catalogue;
};
var unitList = [{
    _id: 'a',
    unit_name: 'A1-100'
},{
    _id: 'b',
    unit_name: 'A101-200'
}], storeProduct = [{
    unit_id: 'a',
    catalogue: ['a-b-c','b-a-c']
},{
    unit_id: 'a',
    catalogue: ['c-a-b', 'a-c-b']
},{
    unit_id: 'b',
    catalogue: ['a-b-c','b-a-c']
}], trafficOrder=[{
    index: 'wl0001',
    catalogue: ['a-b-c']
}, {
    index: 'wl0002',
    catalogue: ['a-c-b']
}];
_.each(unitList, function (a) {
    a['catalogue'] = [];
    a['product'] = [];
    a['order'] = [];
    _.each(storeProduct, function (b) {
        if(a._id == b.unit_id){
            a['catalogue'].push(b.catalogue);
            a['product'].push(b);
        }
    });
    a['catalogue'] = _.uniq(_.flatten(a['catalogue'])); // 二维数组转以为数组

    _.each(trafficOrder, function(c){
        if( (_.intersection(a['catalogue'], c['catalogue'])).length>0 ){
            a['order'].push(c);
        }
    });
});
console.log('unitlist', JSON.stringify(unitList))

var c = [{
    "_id":"a",//仓库柜的id
    "unit_name":"A1-100", //仓库柜编号
    "catalogue":["a-b-c","b-a-c","c-a-b","a-c-b"],
    "product":[
        {
            "unit_id":"a",//仓库柜的id
            "catalogue":["a-b-c","b-a-c"]// 仓库柜中的产品目录
        },
        {"unit_id":"a","catalogue":["c-a-b","a-c-b"]}
    ],
    "order":[
        {"index":"wl0001","catalogue":["a-b-c"]},
        {"index":"wl0002","catalogue":["a-c-b"]}
    ]
},{
    "_id":"b",
    "unit_name":"A101-200",
    "catalogue":["a-b-c","b-a-c"],
    "product":[
        {"unit_id":"b","catalogue":["a-b-c","b-a-c"]}
    ],
    "order":[{"index":"wl0001","catalogue":["a-b-c"]}]
}
]

**/
// console.log( _.flatten(req.body.platform_company || []) )
/**
var driver_push = []
_.each(['a','b','c','d'], function(a){
    console.log('a')
    driver_push.push(a);
})
_.each(['1','2','3','4'], function(a){
    console.log('ab')
    driver_push.push(a);
})
_.each(['张','王','李','赵'], function(a){
    console.log('ac')
    driver_push.push(a);
})
console.log(driver_push);
 **/

/**

product= [{
    "pass_amount" : 1.5,
    "pass_price" : 300,
    "can_assign" : true,
    "layer_2" : "Q235",
    "layer_2_chn" : "Q235",
    "layer_3" : "",
    "layer_3_chn" : "",
    "layer_4" : "",
    "layer_4_chn" : "",
    "product_name" : [
        {
            "number_remain" : 1,
            "price" : 300,
            "amount" : 1.5,
            "number" : 1,
            "amount_unit" : 1.5,
            "name" : "Φ6.5",
            "attribute" : [
                {
                    "count_remain" : null,
                    "amount" : 2,
                    "value" : "1.5",
                    "isTrue" : true,
                    "unit" : "吨/件",
                    "vary" : "",
                    "calculate" : true,
                    "read" : true,
                    "name" : "理计",
                    "_id" : "594a12ef4e94043b9154a0e7"
                }
            ]
        }
    ],
    "replenish" : true,
    "path_loss" : false,
    "modify_amount" : false,
    "__v" : 0,
    "offer_id" : "599aad8c7529cc734b958c8d",
    "pass_unit" : "吨",
    "unit" : "件",
    "layer_1" : "steel_gaoxian",
    "material" : "steel",
    "layer_1_chn" : "高线",
    "material_chn" : "钢铁",
    "_id" : "599aad8c7529cc734b958c8f"
}]
product1 = [{
    "pass_amount" : 1.5,
    "pass_price" : 300,
    "can_assign" : true,
    "layer_2" : "Q235",
    "layer_2_chn" : "Q235",
    "layer_3" : "",
    "layer_3_chn" : "",
    "layer_4" : "",
    "layer_4_chn" : "",
    "product_name" : [
        {
            "number_remain" : 1,
            "price" : 300,
            "amount" : 1.5,
            amount_final: '50',
            number_final: '20',
            "number" : 1,
            "amount_unit" : 1.5,
            "name" : "Φ6.5",
            "attribute" : [
                {
                    "count_remain" : null,
                    "amount" : 2,
                    "value" : "1.5",
                    "isTrue" : true,
                    "unit" : "吨/件",
                    "vary" : "",
                    "calculate" : true,
                    "read" : true,
                    "name" : "理计",
                    "_id" : "594a12ef4e94043b9154a0e7"
                }
            ]
        }
    ],
    "replenish" : true,
    "path_loss" : false,
    "modify_amount" : false,
    "__v" : 0,
    "offer_id" : "599aad8c7529cc734b958c8d",
    "pass_unit" : "吨",
    "unit" : "件",
    "layer_1" : "steel_gaoxian",
    "material" : "steel",
    "layer_1_chn" : "高线",
    "material_chn" : "钢铁",
    "_id" : "599aad8c7529cc734b958c8f"
}]

_.each(product1, function(a){
    _.each(a.product_name, function(b){
        _.each(product, function(a1){
            _.each(a1.product_name, function(b1){
                var key_a = a.layer_1 + a.layer_2 + (a.layer_3 || "")  + (a.layer_4 || "")  + (a.layer_5 || "") +  (b1.name || "") ;
                var key_a1 = a1.layer_1 + a1.layer_2 + (a1.layer_3 || "") + (a1.layer_4 || "") + (a.layer_5 || "")+ (b1.name || "");
                console.log('key', key_a, key_a1);
                if(key_a == key_a1 && !!b.amount_final && !!b.number_final){
                    console.log('d')
                    b1.amount_actual = b1.amount - b.amount_final;
                    b1.number_actual = b1.number - b.number_final;
                }
            })
        })
    })
})
 */
// var req = {body: {
//         product_categories : [{"display_path_loss":false,"product_name":[{"_id":"59fb11bfadeeeab308a57e13","name":"Φ8","attribute":[],"measure_unit":[{"_id":"59fb11ee474181b508c4a4b2","name":"理计","calculate":false,"vary":"","unit":"吨/件"}],"number":450,"amount_unit":"2.1","amount":450,"price":4100,"preferential":0,"number_remain":450}],"unit":"件","pass_unit":"吨","replenish":true,"modify_amount":false,"material_chn":"钢铁","material":"gangtie","layer_1_chn":"线材类","layer_1":"xiancailei","layer_2_chn":"高线","layer_2":"gaoxian","layer_3_chn":"Q235B","layer_3":"Q235B","can_assign":true,"pass_price":2,"pass_amount":450}],
//     }
// }
//
// config_common.checkField(req, [{field: 'product_categories', type:'object'}], function (err) {
//     console.log('err', err)
// })



// var ooo = [{price: '2'},{price: ''},{price: 3}]
// var avr = function (obj, str) {
//     var length = 0;
//     var sum = 0;
//     _.each(obj, function (a) {
//         length++;
//         if(!!Number(a[str])){
//             sum += Number(a[str])
//         }
//     });
//     console.log('arv', (sum/length).toFixed(2))
//     return (sum/length).toFixed(2);
// }
// avr(ooo, 'price');


// var ccc = _.map(['meijiao', 'gangtie'], function (a) {
//     return config_common.material[a]
// })

// 产品详情
/*
var product_categories = [
    {
        "pass_amount" : 0,
        "pass_price" : 90,
        "pass_unit" : "吨",

        "layer_5" : "suanxing",
        "layer_5_chn" : "酸性",
        "layer_4" : "ganji",
        "layer_4_chn" : "干基",
        "layer_3" : "tiejingfen",
        "layer_3_chn" : "铁精粉",
        "layer_2" : "guoneikuang",
        "layer_2_chn" : "国内矿",
        "layer_1" : "tiekuangshi",
        "layer_1_chn" : "铁矿石",
        "material" : "kuangshi",
        "material_chn" : "矿石",

        "product_name" : [
            {
                "amount_remain" : 0,
                "number_remain" : 0,
                "price" : 3500,
                "name" : "矿石",
                "amount" : 699,
                "amount_unit" : 1,
                "number" : 699,
                "image" : [],
                "measure_unit" : [],
                "attribute" : [
                    {
                        "value" : "30",
                        "unit" : "%",
                        "vary" : "plus",
                        "name" : "含铁量",
                        "numbering" : "112"
                    }
                ],
                "price_weight" : 3500
            }
        ]
    },
    {
        "pass_amount" : 50,
        "pass_price" : 100,
        "pass_unit" : "吨",
        "material_chn" : "钢铁",
        "material" : "gangtie",
        "layer_1_chn" : "线材类",
        "layer_1" : "xiancailei",
        "layer_2_chn" : "螺纹钢",
        "layer_2" : "luowengang",
        "layer_3_chn" : "HRB500",
        "layer_3" : "HRB500",
        "layer_4_chn" : "9米",
        "layer_4" : "9mi",
        "product_name" : [
            {
                "amount_remain" : 50,
                "number_remain" : 20,
                "attribute" : [],
                "measure_unit" : [
                    {
                        "_id" : "5a2f3780bf799b18e81d6972",
                        "name" : "理计",
                        "vary" : "",
                        "unit" : "吨/件",
                        "value" : "2.5"
                    }
                ],
                "image" : [],
                "product_price" : [
                    {
                        "name" : "理计价",
                        "value" : "100"
                    },
                    {
                        "name" : "过磅价",
                        "value" : "50"
                    }
                ],
                "number" : 20,
                "amount_unit" : 2.5,
                "amount" : 50,
                "name" : "Φ8",
                "price" : 100
            }
        ]
    }
    ];
*/

//线路区域

var start_district = [];
var start_city = ['石家庄','保定'];
var start_province = '河北';
// _.each(start_district, function(a){
//     _.each(start_city, function(b){
//         section.push(start_province + a + b)
//     })
// })
//省份是字符串， 城市是数组时 区域为空； 城市仅一个元素时，区域为空或数组
// 河北
// 河北石家庄
// 河北石家庄和平区
// var abc = function(province, city, district){
//     var section = [];
//     section.push(province);
//     if(district.length > 0 && city.length == 1){
//         _.each(district, function (a) {
//             section.push(province + city[0] + a)
//         })
//     }else{
//         if(city.length > 0){
//             _.each(city, function (b) {
//                 section.push(province + b)
//             })
//         }
//     }
//     return section;
// };
/*
var getPPP =  function(produce, storeProduct, type){
    var self = this;
    if(produce.length>0){
        var ab_key, xy_key;
        _.each(produce, function (a) {
            ab_key = a.layer_1 + ';' + a.layer_2;
            _.each(a.product_name, function (b) {
                ab_key = ab_key + ';' + b.name;
                _.each(storeProduct, function(x){
                    xy_key = x.layer_1 + ';' + x.layer_2;
                    _.each(x.product_name, function(y){
                        xy_key = xy_key + ';' + y.name;
                        console.log('a', xy_key == ab_key , !!y[type + '_number'], y[type + '_number'], type + '_number')
                        if(xy_key == ab_key && !!y[type + '_number']){
                            
                            b[type + '_number_remain'] = config_common.rscDecimal('sub', b[type + '_number_remain'], y[type + '_number']);
                            b[type + '_amount_remain'] = config_common.rscDecimal('sub', b[type + '_amount_remain'], y[type + '_amount']);
                            console.log('b',  b[type + '_number_remain'], b[type + '_amount_remain'])
                        }
                    })
                })
            })
        });
        console.log(produce[0]['product_name'])
    }
    // return produce;
    
};

var produce = [
    {
        "pass_amount" : 36.7,
        "pass_price" : 120,
        "can_assign" : true,
        "material_chn" : "钢铁",
        "material" : "gangtie",
        "layer_1_chn" : "线材类",
        "layer_1" : "xiancailei",
        "layer_2_chn" : "盘螺",
        "layer_2" : "panluo",
        "layer_3_chn" : "HRB400E",
        "layer_3" : "HRB400E",
        "_id" : "5a363c33eb3a801a0a0dafdb",
        "pass_unit" : "吨",
        "unit" : "件",
        "user_id" : "5a332c933c4eb5389c4d5442",
        "__v" : 0,
        "modify_amount" : false,
        "path_loss" : false,
        "replenish" : true,
        "product_name" : [
            {
                "amount_remain" : 36.7,
                "number_remain" : 10,
                "__v" : 0,
                "attribute" : [],
                "measure_unit" : [
                    {
                        "_id" : "5a2f3780bf799b18e81d6972",
                        "name" : "理计",
                        "calculate" : false,
                        "vary" : "",
                        "unit" : "吨/件",
                        "value" : "3.67"
                    }
                ],
                "image" : [],
                "product_price" : [
                    {
                        "name" : "理计价",
                        "value" : "4650"
                    },
                    {
                        "name" : "过磅价",
                        "value" : "4400"
                    }
                ],
                "price_preferential" : [],
                "number" : 10,
                "amount_unit" : 3.67,
                "amount" : 36.7,
                "name" : "Φ6",
                "preferential" : 0,
                "price" : 4200,
                "loading_number_remain" : 10,
                "loading_amount_remain" : 36.7,
                "unloading_number_remain" : 10,
                "unloading_amount_remain" : 36.7
            }
        ],
        "company_id" : "5a332db53c4eb5389c4d5447"
    }
];
    storeProduct = [
        {
            "pass_amount" : 36.7,
            "pass_price" : 120,
            "can_assign" : true,
            "material_chn" : "钢铁",
            "material" : "gangtie",
            "layer_1_chn" : "线材类",
            "layer_1" : "xiancailei",
            "layer_2_chn" : "盘螺",
            "layer_2" : "panluo",
            "layer_3_chn" : "HRB400E",
            "layer_3" : "HRB400E",
            "_id" : "5a363c33eb3a801a0a0dafdb",
            "pass_unit" : "吨",
            "unit" : "件",
            "user_id" : "5a332c933c4eb5389c4d5442",
            "__v" : 0,
            "modify_amount" : false,
            "path_loss" : false,
            "replenish" : true,
            "product_name" : [
                {
                    "loading_amount" : 20,
                    "loading_number" : 5,
                    "amount_final" : 20,
                    "amount_remain" : 36.7,
                    "number_remain" : 10,
                    "__v" : 0,
                    "attribute" : [],
                    "measure_unit" : [
                        {
                            "_id" : "5a2f3780bf799b18e81d6972",
                            "name" : "理计",
                            "calculate" : false,
                            "vary" : "",
                            "unit" : "吨/件",
                            "value" : "3.67"
                        }
                    ],
                    "image" : [],
                    "product_price" : [
                        {
                            "name" : "理计价",
                            "value" : "4650"
                        },
                        {
                            "name" : "过磅价",
                            "value" : "4400"
                        }
                    ],
                    "price_preferential" : [],
                    "number" : 10,
                    "amount_unit" : 3.67,
                    "amount" : 36.7,
                    "name" : "Φ6",
                    "preferential" : 0,
                    "price" : 4200
                }
            ],
            "company_id" : "5a332db53c4eb5389c4d5447"
        }
    ];

getPPP(produce,storeProduct,'loading')
*/

var eraser_zero_new = function (obj) {
    var vObj = obj;
    for(var kx=0; kx<obj.length; kx++){
        if(!obj[kx].pass_amount){
            obj.splice(kx,1);
            kx--;
            continue;
        }
        for(var ky = 0; ky < obj[kx]['product_name'].length; ky++){
            if(!obj[kx]['product_name'][ky]['unloading_number']){
                obj[kx]['product_name'].splice(ky,1);
                ky--;
                continue;
            }
        }
    }
    return vObj;
};
var pro = [
    {
        "pass_amount" : 35.682,
        "pass_price" : 55,
        "can_assign" : true,
        "layer_4" : "12mi",
        "layer_4_chn" : "12米",
        "layer_3" : "HRB500E",
        "layer_3_chn" : "HRB500E",
        "layer_2" : "luowengang",
        "layer_2_chn" : "螺纹钢",
        "layer_1" : "xiancailei",
        "layer_1_chn" : "线材类",
        "material" : "gangtie",
        "material_chn" : "钢铁",
        "company_id" : "5a557d5f2bd02a2c31e9892e",
        "PID" : [
            "5a55d513e0bc526bb515d1b5"
        ],
        "product_name" : [
            {
                "amount_remain" : 15.63,
                "number_remain" : 10,
                "price" : 3600,
                "name" : "Φ8",
                "amount" : 15.63,
                "amount_unit" : 1.563,
                "number" : 10,
                "price_update" : 0,
                "price_preferential" : [],
                "image" : [],
                "measure_unit" : [
                    {
                        "value" : "1.563",
                        "unit" : "吨/件",
                        "vary" : "",
                        "calculate" : false,
                        "name" : "理计",
                        "_id" : "5a4dfaabc10a751f548d5f69"
                    }
                ],
                "attribute" : [],
                "__v" : 0,
                "price_remember" : 3600,
                "price_weight" : 4800,
                "_id" : "5a55d514e0bc526bb515d1b8",
                "unloading_number_remain" : 7,
                "loading_number_remain" : 10,
                "unloading_amount_remain" : 10.63,
                "loading_amount_remain" : 15.63,
                "amount_final" : 10,
                "unloading_number" : 6,
                "unloading_amount" : 10
            },
            {
                "amount_remain" : 16.98,
                "number_remain" : 10,
                "price" : 3600,
                "name" : "Φ10",
                "amount" : 16.98,
                "amount_unit" : 1.698,
                "number" : 10,
                "price_update" : 0,
                "price_preferential" : [],
                "image" : [],
                "measure_unit" : [
                    {
                        "value" : "1.698",
                        "unit" : "吨/件",
                        "vary" : "",
                        "calculate" : false,
                        "name" : "理计",
                        "_id" : "5a4dfaabc10a751f548d5f69"
                    }
                ],
                "attribute" : [],
                "__v" : 0,
                "price_remember" : 3600,
                "price_weight" : 4800,
                "_id" : "5a55d514e0bc526bb515d1ba",
                "unloading_number_remain" : 7,
                "loading_number_remain" : 10,
                "unloading_amount_remain" : 11.98,
                "loading_amount_remain" : 16.98,
                "amount_final" : 10,
                "unloading_number" : 6,
                "unloading_amount" : 10
            },
            {
                "amount_remain" : 3.072,
                "number_remain" : 2,
                "price" : 3600,
                "name" : "Φ12",
                "amount" : 3.072,
                "amount_unit" : 1.536,
                "number" : 2,
                "price_update" : 0,
                "price_preferential" : [],
                "image" : [],
                "measure_unit" : [
                    {
                        "value" : "1.536",
                        "unit" : "吨/件",
                        "vary" : "",
                        "calculate" : false,
                        "name" : "理计",
                        "_id" : "5a4dfaabc10a751f548d5f69"
                    }
                ],
                "attribute" : [],
                "__v" : 0,
                "price_remember" : 3600,
                "price_weight" : 4800,
                "_id" : "5a55d514e0bc526bb515d1bc",
                "unloading_number_remain" : 2,
                "loading_number_remain" : 2,
                "unloading_amount_remain" : 3.072,
                "loading_amount_remain" : 3.072,
                "amount_final" : 3,
                "unloading_number" : 2,
                "unloading_amount" : 3
            }
        ],
        "replenish" : true,
        "path_loss" : false,
        "modify_amount" : false,
        "__v" : 0,
        "user_id" : "5a5576452bd02a2c31e9892b",
        "pass_unit" : "吨",
        "unit" : "件",
        "_id" : "5a55d514e0bc526bb515d1bd"
    }
];
//
var  产品列表= {
    key: '产品分类',
        count: '数量'
};
var 产品详情= [{}]; //范围大于等于产品列表
//若产品详情中与产品类别相同，则数量、吨数改变， 清零处理
debugger;
var hebing = function (argument1, argument2) {
    _.each(argument1,function(data1){
        _.each(argument2, function(data2){
            if(data1.material==data2.material &&
                data1.layer_1==data2.layer_1 &&
                data1.layer_2==data2.layer_2 &&
                data1.layer_3==data2.layer_3 &&
                data1.layer_4==data2.layer_4){
                _.each(data1.product_name, function(data3){
                    _.each(data2.product_name, function(data4){
                        if(data3.name==data4.name){
                            data3.number+=data4.number;
                        }else {
                            data1.product_name.push(data4);
                        }
                    })
                })
            }else{
                argument1.push(data2);
            }
        })
    })
}


var duck = {
    duckSinging: function(){
        console.log( '嘎嘎嘎' );
    }
};

var chicken = {
    duckSinging: function(){
        console.log( '嘎嘎嘎' );
    }
};

var choir = []; // 合唱团
var joinChoir = function( animal ){
    if ( animal && typeof animal.duckSinging === 'function' ){
        choir.push( animal );
        console.log( '恭喜加入合唱团' );
        console.log( '合唱团已有成员数量:' + choir.length );
    }
};

joinChoir( duck );
joinChoir( chicken );

for(var i=1; i<=5; i++){
    var c = '';
    for (var j = 1; j <= 5; j++){

    // for(var j= 1; j <= 5-i; j++){
    //     for(var j= 1; j <= i; j++){
        c = c + String(i);
    }
    console.log(c)
}
// console.log(config_common.rscDecimal('sub', 1.0, 0.7))
// console.log((1.0-0.7))
// console.log((0.1+0.2))

var x = config_common.getYearMonth(new Date('2018-3-3'), true)
var y = config_common.getYearMonth(new Date('2018-3-4'), true)
// console.log(x.ymd == y.ymd)
//
var str = ['_id','s'] //'12345678901234567890123E'
var judgeObjectId = function(str){
    var reg = /[a-fA-F0-9]{24}/;
    if(typeof(str) == 'string'){
        return reg.test(str) && str.length==24;
    }
    if(typeof(str) == 'object' && (Object.keys(str)).indexOf('_id') > -1){
       return reg.test(str) && str.length==24;
    }else{
        return true
    }
}


var penultCategory = function (obj) {
    var c=[];
    _.each([1,2,3,4,5,6,7],function(a){
        console.log('layer_'+a, obj[0]['layer_'+a])
        if(obj[0]['layer_'+a]){
            c.push(obj[0]['layer_'+a])
        }
    });
    return c[c.length-2]
};
var waitprice = Math.abs(config_common.rscDecimal('sub', 14.9, 10.4))

var pro =[
    {
        "company_id" : "5a2f3fb3e6267150d948b634",
        "product_name" : [
            {
                "price" : 400,
                "preferential" : 0,
                "name" : "HRB500",
                "amount" : "60.000",
                "amount_unit" : 1.2,
                "number" : 50,
                "price_update" : 0,
                "price_preferential" : [],
                "product_price" : [
                    {
                        "value" : 300,
                        "name" : "理计价"
                    },
                    {
                        "value" : 400,
                        "name" : "过磅价"
                    }
                ],
                "image" : [],
                "measure_unit" : [
                    {
                        "set" : "no",
                        "value" : 1.2,
                        "unit" : "吨/件",
                        "vary" : "",
                        "calculate" : false,
                        "name" : "理计",
                        "_id" : "5ab99dffe4bdab0c182095df"
                    }
                ],
                "attribute" : [
                    {
                        "value" : "4",
                        "unit" : "mm",
                        "vary" : "",
                        "double" : false,
                        "name" : "Φ",
                        "numbering" : "419",
                        "_id" : "5ab99df8e482591834c63fb8"
                    }
                ],
                "__v" : 0,
                "short_id" : "174oWSCDmCa",
                "number_remain" : 47,
                "randomNum" : "059838",
                "amount_remain" : "56.400"
            }
        ],
        "replenish" : true,
        "path_loss" : false,
        "modify_amount" : false,
        "__v" : 0,
        "user_id" : "5a2f3edce6267150d948b630",
        "pass_unit" : "吨",
        "unit" : "件",
        "_id" : "5ad075883b63711329d2a44d",
        "layer_2" : "luowengang",
        "layer_2_chn" : "螺纹钢",
        "layer_1" : "xiancailei",
        "layer_1_chn" : "线材类",
        "material" : "gangtie",
        "material_chn" : "钢铁",
        "can_assign" : true,
        "pass_price" : 2,
        "pass_amount" : "56.400",
        "pass_number" : 50,
        "pass_amount_allot" : 0,
        "pass_amount_remain" : "60.000",
        "pass_number_allot" : 0,
        "pass_number_remain" : 50
    }
];
var xxx =  [
    {
        "pass_number_remain" : 3,
        "pass_number_allot" : 0,
        "pass_amount_remain" : "6.670",
        "pass_amount_allot" : 0,
        "pass_number" : 3,
        "pass_amount" : "6.670",
        "pass_price" : 1,
        "can_assign" : true,
        "layer_2" : "gaoxian",
        "layer_2_chn" : "高线",
        "layer_1" : "xiancailei",
        "layer_1_chn" : "线材类",
        "material" : "gangtie",
        "material_chn" : "钢铁",
        "company_id" : "5a42fd874addf7b5c4c25141",
        "PID" : [
            "5ae3ecf2b56a38795a03785f"
        ],
        "product_name" : [
            {
                "loading_amount_remain" : "2.890",
                "unloading_amount_remain" : "2.890",
                "loading_number_remain" : 1,
                "unloading_number_remain" : 1,
                "amount_remain" : "2.890",
                "randomNum" : "479575",
                "number_remain" : 1,
                "price" : 3900,
                "name" : "Q235",
                "amount" : "2.890",
                "amount_unit" : 2.89,
                "number" : 1,
                "price_update" : 0,
                "price_preferential" : [],
                "image" : [],
                "measure_unit" : [
                    {
                        "set" : "no",
                        "value" : 2.89,
                        "unit" : "吨/件",
                        "vary" : "",
                        "calculate" : false,
                        "name" : "理计",
                        "_id" : "5ad8623627139612b8dc5bfb"
                    }
                ],
                "attribute" : [],
                "__v" : 0,
                "short_id" : "18sJSAj41LC",
                "price_remember" : 3900,
                "price_weight" : 3990,
                "_id" : "5ae3ecf2b56a38795a037861"
            },
            {
                "loading_amount_remain" : "3.780",
                "unloading_amount_remain" : "3.780",
                "loading_number_remain" : 2,
                "unloading_number_remain" : 2,
                "amount_remain" : "3.780",
                "randomNum" : "913464",
                "number_remain" : 2,
                "price" : 3900,
                "name" : "Q195",
                "amount" : "3.780",
                "amount_unit" : 1.89,
                "number" : 2,
                "price_update" : 0,
                "price_preferential" : [],
                "image" : [],
                "measure_unit" : [
                    {
                        "set" : "no",
                        "value" : 1.89,
                        "unit" : "吨/件",
                        "vary" : "",
                        "calculate" : false,
                        "name" : "理计",
                        "_id" : "5ad8623627139612b8dc5bfb"
                    }
                ],
                "attribute" : [],
                "__v" : 0,
                "short_id" : "18sJSAwUatb",
                "price_remember" : 3900,
                "price_weight" : 3990,
                "_id" : "5ae3ecf2b56a38795a037862"
            }
        ],
        "replenish" : true,
        "path_loss" : false,
        "modify_amount" : false,
        "__v" : 0,
        "user_id" : "5a966b50a13b14b7b67d916f",
        "pass_unit" : "吨",
        "unit" : "件",
        "_id" : "5ae3ecf2b56a38795a037863"
    }
]

// var c={$or: [{'s': 1}, {'b':2}]}
// _.each(c.$or, function (a) {
//     a=_.extend(a, {'v': 3})
// })
// console.log(c)
req={body:{}}
req.body.start_province=['河北'], req.body.start_city=['石家庄'], req.body.start_district=['和平区','铁西区'],
req.body.end_province=['北京'], req.body.end_city=['北京'], req.body.end_district=[]
// section= config_common.lineSearch(req);
// console.log('section', JSON.stringify(section))

// obj= config_common.relevanceArea(req.body.end_province, req.body.end_city, req.body.end_district);
// console.log('obj', obj)
var c_arr = ['material_chn','layer_1_chn', 'layer_2_chn', 'layer_3_chn', 'layer_4_chn', 'layer_5_chn', 'layer_6_chn', 'layer_7_chn'];
var c_arr_eng = ['material','layer_1', 'layer_2', 'layer_3', 'layer_4', 'layer_5', 'layer_6', 'layer_7']

var product_categories = [
  {
    "can_assign" : true,
    "pass_number_remain" : 20,
    "pass_number_allot" : 0,
    "pass_amount_remain" : "30.000",
    "pass_amount_allot" : 0,
    "pass_number" : 20,
    "pass_amount" : "4.000",
    "pass_price" : 1001,
    "pass_unit" : "吨",
    "unit" : "件",
    "product_name" : [
      {
        "loading_amount_remain" : "2.000",
        "unloading_amount_remain" : "2.000",
        "loading_number_remain" : 1,
        "unloading_number_remain" : 1,
        "amount_remain" : "2.000",
        "number_remain" : "1",
        "randomNum" : "239850",
        "amount" : "2.000",
        "amount_unit" : 2,
        "number" : "1",
        "image" : [],
        "measure_unit" : [
          {
            "value" : 2,
            "unit" : "吨/件",
            "vary" : "",
            "calculate" : false,
            "name" : "理计",
            "_id" : "5b286ca8f9c7701be0062d10"
          }
        ],
        "attribute" : [
          {
            "value" : "3",
            "unit" : "米",
            "vary" : "",
            "double" : false,
            "name" : "长度",
            "numbering" : "405",
            "_id" : "5b286ca2bef9db0818d5ad69"
          },
          {
            "value" : "4",
            "unit" : "mm",
            "vary" : "",
            "double" : false,
            "name" : "Φ",
            "numbering" : "419",
            "_id" : "5b286ca2bef9db0818d5ad77"
          }
        ],
        "isAdd" : true,
        "isHasName" : true,
        "name" : "HRB500E"
      },
      {
        "loading_amount_remain" : "2.000",
        "unloading_amount_remain" : "2.000",
        "loading_number_remain" : 2,
        "unloading_number_remain" : 2,
        "amount_remain" : "2.000",
        "number_remain" : "2",
        "randomNum" : "736623",
        "amount" : "2.000",
        "amount_unit" : 1,
        "number" : "2",
        "image" : [],
        "measure_unit" : [
          {
            "value" : 1,
            "unit" : "吨/件",
            "vary" : "",
            "calculate" : false,
            "name" : "理计",
            "_id" : "5b286ca8f9c7701be0062d10"
          }
        ],
        "attribute" : [
          {
            "value" : "2",
            "unit" : "米",
            "vary" : "",
            "double" : false,
            "name" : "长度",
            "numbering" : "405",
            "_id" : "5b286ca2bef9db0818d5ad69"
          },
          {
            "value" : "3",
            "unit" : "mm",
            "vary" : "",
            "double" : false,
            "name" : "Φ",
            "numbering" : "419",
            "_id" : "5b286ca2bef9db0818d5ad77"
          }
        ],
        "isAdd" : true,
        "isHasName" : true,
        "name" : "HRB500"
      }
    ],
    "layer_2_chn" : "螺纹钢",
    "layer_2" : "luowengang",
    "layer_1_chn" : "线材类",
    "layer_1" : "xiancailei",
    "material_chn" : "钢铁",
    "material" : "gangtie",
    "display_path_loss" : false
  }
]


// _.each(product_categories, function (x) {
//   if(x.product_name && x.product_name.length>0){
//     _.each(x.products_name, function (y) {
//       console.log('==>', x.randomNum, y.randomNum)
//     })
//   }
// })
// console.log( '小数点', config_common.rscDecimal('div', '2.432', '1.21', 3))
var ock={
  body: {
    start_province: ['河北'],
    start_city: ['石家庄', '唐山'],
    start_district: [],
    end_province: ['山东'],
    end_city: ['东营','济南'],
    end_district: [],
  }
}
console.log('aaa', JSON.stringify(config_common.lineSearch(ock) ) )
// console.log('aaa', config_common.relevanceArea(['河北'], ['石家庄'], ['大兴区']))
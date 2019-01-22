/**
 * Created by Administrator on 17/5/14.
 */
module.exports = {
    /**
     * 公用
     */
    price_type: {
        price_remember: '理计价',
        price_weight: '过磅价'
    },
    price_type_eng: {
        price_remember: 'price_remember',
        price_weight: 'price_weight'
    },
    order_origin: {
        'demand': 'demand',
        'DJ': 'DJ',
        'JJ': 'JJ'
    },
    payment_style: {
        'CIF': 'CIF',                             // 到岸价
        'FOB': 'FOB',                             // 出厂价
        'CIF_PROXY':'CIF_PROXY'                   //代发物流
    },
    att_quality: {//质检归属
        'demand': 'demand',
        'supply': 'supply',
        'other': 'other'
    },
    att_payment: {//付款类型
        cash: 'cash',                             // 使用现金
        bill_bank: 'bill_bank',                   // 银行承兑
        bill_com: 'bill_com'                      // 商业承兑
    },
    att_settlement: {//结算方式
        'all_cash': 'all_cash',                   // 全款-款到发货
        'all_goods': 'all_goods',                 // 全款-货到付款
        'partition': 'partition',                 // 分期，有预付款尾款
        'credit': 'credit'                        // 信用额度
    },
    att_traffic: {//物流细则
        pick_up: 'pick_up',                       // 提货
        arrival: 'arrival',                       // 到货
        path_loss: 'path_loss'                    // 路耗
    },

    delay_type: {//延期计算标准
        'order': 'order',                         // 从确认订单开始计时付款时间
        'goods': 'goods'                          // 从货物到货开始计时付款时间
    },

    relationship_type: {
        trade_offer: 'trade_offer',               // 报价
        trade_demand: 'trade_demand',             // 抢单
        trade_supply_ineffective: 'trade_supply_ineffective',                 // 销售订单
        trade_supply_effective: 'trade_supply_effective',                 // 销售订单
        trade_supply_complete: 'trade_supply_complete',                 // 销售订单
        trade_supply_cancelled: 'trade_supply_cancelled',                 // 销售订单
        trade_demand_ineffective: 'trade_demand_ineffective',                 // 销售订单
        trade_demand_effective: 'trade_demand_effective',                 // 销售订单
        trade_demand_complete: 'trade_demand_complete',                 // 销售订单
        trade_demand_cancelled: 'trade_demand_cancelled',         // 采购订单
        plan: 'plan'                              // 计划
    },
    /**
     * status
     */
    shop_status: {
        'ineffective': 'ineffective',             // 未生效
        'effective': 'effective',                 // 已生效
        'complete': 'complete',                   // 完成
        'cancelled': 'cancelled'                  // 取消
    },
    offer_status: {
        'published': 'published',                 // 已发布
        'expired': 'expired',                     // 已过期
        'history': 'history',                     // 成为历史状态（加入新公司后以前公司发过的单据变成这种状态）
        'to_be_announced': 'to_be_announced'      // 待发布
    },
    demand_status: {
        'published': 'published',                 // 已发布
        'history': 'history',                     // 成为历史状态（加入新公司后以前公司发过的单据变成这种状态）
        'expired': 'expired'                      // 已过期
    },
    order_status: {
        'ineffective': 'ineffective',             // 待确认
        'effective': 'effective',                 // 运输中
        'complete': 'complete',                   // 完成
        'cancelled': 'cancelled'                  // 取消
    },
    config_status: {
        attribute: 'attribute',                   // 属性
        product_price: 'product_price',           // 产品价格类型
        measure_unit: "measure_unit",             // 计量单位
        product_name: 'product_name',             // 产品名称
        unit: 'unit',                             // 产品单位
        unit_traffic: 'unit_traffic',             // 运输单位
        other: 'other'                            // 其他
    },
    /**
     * type
     */
    shop_type: {
        weight: 'weight',           // 过磅              // 过磅
        remember: 'remember',       // 理记
        tax_weight: 'tax_weight',   // 过磅含税                    // 过磅
        tax_remember: 'tax_remember'// 理记含税
    },
    passPrice_type: {
        amount: 'amount',                         // 按吨数运输
        stere: 'stere',                           // 按立方米运输
        number: 'number'                          // 按个数运输

    },
    offerAgain_type: {},
    company_type: {//公司类型
        SALE: 'SALE',                             // 销售
        PURCHASE: 'PURCHASE',                     // 采购
        TRAFFIC: 'TRAFFIC'                        // 物流
    },
    offer_type: {
        'DJ': 'DJ',                               // 定价
        'DjJJ': 'DjJJ',                           // 定价竞价
        'JJ': 'JJ'                                // 区间竞价
    },
    demand_type: {
        'QjJJ': 'QjJJ',                           // 区间
        'DjJJ': 'DjJJ'                            // 固定价格
    },
    offer_ownType: {
        pricing: 'pricing',                       // 报价
        bidding: 'bidding',                       // 竞价
        demand: 'demand'                          // 采购
    },
    statistical_type: {
        sale_pricing: 'sale_pricing',//定价
        sale_pricing_order: 'sale_pricing_order', //定价订单
        sale_bidding: 'sale_bidding',//竞价
        sale_bidding_order: 'sale_bidding_order',//竞价订单
        sale_demandOffer: 'sale_demandOffer',//销售方抢采购的需求单
        sale_demandOffer_order: 'sale_demandOffer_order', //销售方抢采购需求单生成的订单数量
        purchase_pricing_order: 'purchase_pricing_order',//定价订单
        purchase_offerAgain: 'purchase_offerAgain',//竞价
        purchase_offerAgain_order: 'purchase_offerAgain_order',//竞价订单
        purchase_demand: 'purchase_demand',//抢单
        purchase_demand_order: 'purchase_demand_order',//抢单订单
        assign: 'assign',//指派数量
        assign_order: 'assign_order', //指派生成的订单
        purchase_plan: 'purchase_plan',   //生成采购计划
        sale_demand: 'sale_demand',   //
        purchase_bidding: 'purchase_bidding',   //
        purchase_pricing: 'purchase_pricing',   //
        pricing_browse: 'pricing_browse',   //
        bidding_browse: 'bidding_browse',   //
        demand_browse: 'demand_browse',   //
        bidding_bid: 'bidding_bid',
        demand_bid: 'demand_bid'
    },
    /**
     * server用
     */
    getsObj: {
        method: 1,
        models: [
            {
                model: 1,
                cond: 1
            }
        ]
    },
    method: {
        getOne: 'getOne',
        getCount: 'getCount',
        getList: 'getList',
        add: 'add'
    }


};
/**
 * Created by Administrator on 2015/12/11 0011.
 */
module.exports =
    {
        msg_templates: {
            'welcome': {
                content: '欢迎来到日升昌安家，为了更好更充分的使用平台功能，快快邀请企业成员来到平台吧。',
                theme: 'common',
                count_elements: 0
            },
            // ------ ZHR ------ //
            'trade_price_ask_new':      // 采购新发布询价单，通知报价方
                {
                    content: '#发布#的采购询价，快来报价！',
                    theme: 'trade_price_ask_offer',
                    count_elements: 2
                },
            'trade_price_ask_new_self':      // 采购新发布询价单，通知自己
                {
                    content: '恭喜您发布采购#询价成功，请尽快分享给您的供应商吧。',
                    theme: 'trade_price_ask',
                    count_elements: 1
                },
            'trade_price_ask_new_self_no_comp': {
                content: '恭喜您已发布#询价，您现在还没有认证企业，快去邀请吧，系统将自动推送给您的认证企业！',
                theme: 'trade_price_ask',
                count_elements: 1
            },
            'trade_price_ask_cancel_demand':	// 取消询价，给采购自己发消息
                {
                    content: '您于#取消了采购#的询价！',
                    theme: 'trade_price_ask',
                    count_elements: 2
                },
            'trade_price_ask_cancel_supply':	// 取消询价，给报价放发消息
                {
                    content: '#于#取消了采购#的询价！',
                    theme: 'trade_price_ask_offer',
                    count_elements: 3
                },
            'trade_price_ask_offer_new':    // 销售发布询价报价，通知对方。
                {
                    content: '#对您的询价进行了报价，立即查看最新排名！最终交易以采购下单为准。',
                    theme: 'trade_price_ask',
                    count_elements: 1
                },
            'trade_price_ask_offer_new_self':    // 销售发布询价报价，通知自己。
                {
                    content: '恭喜您已报价成功，每日修改最新报价会实时推送给采购方，同时也会提升您的报价排名。',
                    theme: 'trade_price_ask_offer',
                    count_elements: 0
                },
            'trade_price_ask_offer_edit':         // 修改报价，通知采购方。
                {
                    content: '#修改了报价内容，请查看最新报价排名。',
                    theme: 'trade_price_ask',
                    count_elements: 1
                },
            'trade_price_ask_offer_cancel_demand':		// 删除询价报价，通知采购方
                {
                    content: '#已取消了对您采购#的报价！',
                    theme: 'trade_price_ask',
                    count_elements: 2
                },
            'trade_price_offer_new_self':       // 销售发布主动报价，通知自己。
                {
                    content: '恭喜您发布销售#报价成功，共覆盖#条线路。',
                    theme: 'trade_price_offer',
                    count_elements: 2
                },
            'trade_price_ask_offer_order_new_demand':    // 采购方根据询价报价下订单，自己接收消息。
                {
                    content: '您已选择#作为供应商，该订单已生成，等待对方确认。',
                    theme: 'trade_order_demand',
                    count_elements: 1
                },
            'trade_price_ask_offer_order_new_supply':    // 采购方根据询价报价下订单，销售接收消息。
                {
                    content: '恭喜您，#已确认您的报价，该订单已生成，请尽快点击确认。',
                    theme: 'trade_order_supply',
                    count_elements: 1
                },
            'trade_price_offer_order_new_demand':    // 采购方根据主动报价下订单，自己接收消息。
                {
                    content: '您已选择#作为供应商，该订单已生成，等待对方确认。',
                    theme: 'trade_order_demand',
                    count_elements: 1
                },
            'trade_price_offer_order_new_supply':    // 采购方根据主动报价下订单，销售接收消息。
                {
                    content: '恭喜您，#已对您的报价下单，该订单已生成，请尽快点击确认。',
                    theme: 'trade_order_supply',
                    // theme:'trade_order_demand',
                    count_elements: 1
                },
            'trade_demand_new':           // 采购需求生成，通知抢单方。
                {
                    content: '#采购#共#吨，有效期至#，快来抢单！',
                    theme: 'trade_offer',
                    count_elements: 4
                },
            'trade_demand_new_self':           // 采购需求生成，通知自己。
                {
                    content: '恭喜您已发布##吨的采购抢单，系统会自动推送给您的认证企业。',
                    theme: 'trade_demand',
                    count_elements: 2
                },
            'trade_demand_new_self_no_comp':           // 采购需求生成，此时无任何认证企业，通知自己。
                {
                    content: '恭喜您已发布#共#吨的采购抢单。您现在还没有认证企业，快去邀请吧，系统将自动推送给您的认证企业！',
                    theme: 'trade_demand',
                    count_elements: 2
                },
            'trade_demand_invalid':       // 采购需求过期，通知自己。
                {
                    content: '采购[#]已停止抢单，截止目前共有#家企业报价，请尽快选择报价达成交易。',
                    theme: 'trade_demand',
                    count_elements: 2
                },
            'trade_demand_cannot_generate':       // 采购需求过期，不可下单，通知自己。
                {
                    content: '采购[#]已失效。',
                    theme: 'trade_demand',
                    count_elements: 1
                },
            'trade_demand_cancel_self':					// 取消需求单，给自己
                {
                    content: '您于#取消了#吨#的采购抢单。',
                    theme: 'trade_demand',
                    count_elements: 3
                },
            'trade_demand_cancel_offer':				// 取消需求单，给所有抢单方
                {
                    content: '#于#取消了#吨#的采购抢单!取消后无法恢复!',
                    theme: 'trade_offer',
                    count_elements: 4
                },
            'trade_demand_has_2_offers':                // 已经有了2个抢单，给认证企业推送
                {
                    content: '#发布的采购##吨，已有#家报价，价格区间（#元/吨－#元/吨），快来报价或者修改您的抢单，更快达成交易合作！',
                    theme: 'trade_offer',
                    count_elements: 6
                },
            'trade_demand_going_invalid':               // 需求单还有12小时失效
                {
                    content: '#发布的采购##吨的抢单于12小时后停止抢单，请未抢单的企业尽快参与报价！',
                    theme: 'trade_offer',
                    count_elements: 3
                },
            'trade_offer_new_self':         // 抢单形成，通知自己
                {
                    content: '恭喜您已抢单成功：#采购##吨，你有3次修改报价和付款方式的机会，修改后可提升您的排名。最终交易以采购下单为准。',
                    theme: 'trade_offer',
                    count_elements: 3
                },
            'trade_offer_new':          // 抢单形成，通知采购方。
                {
                    content: '#对您的采购进行报价，请查看最新抢单排名。',
                    theme: 'trade_demand',
                    count_elements: 1
                },
            'trade_offer_edit':         // 修改抢单，通知采购方。
                {
                    content: '#修改了抢单内容，请查看最新抢单排名。',
                    theme: 'trade_demand',
                    count_elements: 1
                },
            'trade_offer_cancel':		// 取消抢单，给采购方发消息
                {
                    content: '#已取消#共#吨的采购抢单报价。',
                    theme: 'trade_demand',
                    count_elements: 3
                },
            'trade_order_new':          // 订单生成后，采购方收到
                {
                    content: '您已选择#为您供应##吨，该订单已形成，请尽快确认。',
                    theme: 'trade_order_demand',
                    count_elements: 3
                },
            'trade_order_cancelled_demand':	// 订单取消，采购方收到
                {
                    content: '#已取消您的订单[#共#吨]，具体情况请与对方联系。',
                    theme: 'trade_order_demand',
                    count_elements: 3
                },
            'trade_order_cancelled_demand_self':	// 订单被采购方取消，采购方自己收到
                {
                    content: '您已取消与#的订单[#共#吨]，取消后无法在该订单下对该企业下单！',
                    theme: 'trade_order_demand',
                    count_elements: 3
                },
            'trade_order_cancelled_offer':	// 订单取消，销售方收到
                {
                    content: '#已取消您的订单[#共#吨]，具体情况请与对方联系。',
                    theme: 'trade_order_demand',
                    count_elements: 3
                },
            'trade_order_supply_to_confirm':    // 订单生成，采购方确认后，销售方收到。
                {
                    content: '恭喜您，#已向您下单采购#共#吨，该订单已生成，请尽快确认。',
                    theme: 'trade_order_supply',
                    count_elements: 3
                },
            // 'trade_order_advance_to_pay_partition':       // 预付款阶段，分期，采购方收到
            // {
            //     content:'#已确认您的订单，#共#吨，请尽快支付预付款。',
            //     theme:'trade_pay',
            //     count_elements:3
            // },
            // 'trade_order_advance_to_pay_all_cash':      // 预付款阶段，款到发货，采购方收到
            // {
            //     content:'#已确认您的订单，#共#吨，请尽快支付货款。',
            //     theme:'trade_pay',
            //     count_elements:3
            // },
            // 'trade_order_advance_to_pay_credit':        // 预付款阶段，申请信用，采购方收到
            // {
            //     content:'#已确认您的订单，#共#吨，请尽快申请信用付款。',
            //     theme:'trade_pay',
            //     count_elements:3
            // },
            'trade_order_advanced_paid_partition':      // 预付款阶段，已支付预付款，销售方收到
                {
                    content: '#已支付预付款，点击确认收款。',
                    theme: 'trade_pay',
                    count_elements: 1
                },
            'trade_order_advanced_paid_all_cash':      // 预付款阶段，已支付全部货款，款到发货，销售方收到
                {
                    content: '#已支付全额货款，点击确认收款。',
                    theme: 'trade_pay',
                    count_elements: 1
                },
            'trade_order_advanced_paid_credit':      // 预付款阶段，已申请信用，销售方的财务收到
                {
                    content: '#向您申请应付信用#元，点击审批。',
                    theme: 'finance',
                    count_elements: 2
                },
            'trade_order_traffic_start_paid':       // 开始物流，通过支付了预付款或者全款后，采购方收到。
                {
                    content: '#已确认收款，请实时关注物流信息，等待收货。',
                    theme: 'trade_pay',
                    count_elements: 1
                },
            'trade_order_credit_denied':			// 信用被拒绝，采购方收到
                {
                    content: '您申请的信用被#拒绝，请尽快与对方联系。',
                    theme: 'trade_pay',
                    count_elements: 1
                },
            'trade_order_traffic_start_credit_supply':     // 开始物流，信用审批通过，销售方收到。
                {
                    content: '#申请的信用已经授出，请尽快发货。',
                    theme: 'trade_pay',
                    count_elements: 1
                },
            'trade_order_traffic_start_credit_demand':     // 开始物流，信用审批通过，采购方收到。
                {
                    content: '您已获得#授予的信用额度#元，有效期#天。',
                    theme: 'trade_pay',
                    count_elements: 3
                },
            'trade_order_traffic_start_confirm':        // 没有预付款环节，直接跳转到物流，采购方收到。
                {
                    content: '#已确认您的订单，请实时关注物流信息，等待收货。',
                    theme: 'trade_order_demand',
                    count_elements: 1
                },
            'trade_order_supply_start_traffic_no_pay':         // 销售方确认订单后，没有预付款环节，提醒发物流需求
                {
                    content: '您已确认与#订单，#共#吨，请点击发布物流需求信息。',
                    theme: 'trade_order_supply',
                    count_element: 3
                },
            'trade_order_supply_start_traffic':         // 销售方确认收款后，提醒可以发出物流需求
                {
                    content: '您已完成收款，请点击发布物流需求信息。',
                    theme: 'trade_order_supply',
                    count_element: 0
                },
            'trade_order_traffic_over':                 // 销售方确认提货完毕后，采购方收到消息
                {
                    content: '#已确认#共#吨发货完毕，请确认收货。',
                    theme: 'trade_order_demand',
                    count_elements: 3
                },
            'trade_order_product_check_wait':           // 开始质检，销售方收到
                {
                    content: '#已确认#共#吨收货完毕，请等待质量检验。',
                    theme: 'trade_order_supply',
                    count_elements: 3
                },
            'trade_order_produce_check_self':           // 开始质检，采购方自己收到
                {
                    content: '您已确认#共#吨收货完毕，请填写质检报告。',
                    theme: 'trade_order_demand',
                    count_elements: 2
                },
            'trade_order_forgiven_start':           // 质检完毕，是否需要申诉，销售方收到
                {
                    content: '#质检完毕，请查看结果并选择是否需要申诉。',
                    theme: 'trade_order_supply',
                    count_elements: 1
                },
            'trade_order_forgiven_start_supply_check':  // 运输完毕，如果是已销售方质检为准，销售方收到
                {
                    content: '#已确认#共#吨收货完毕，请查看结果并选择是否需要申诉。',
                    theme: 'trade_forgiven',
                    count_elements: 3
                },
            'trade_order_forgiven_check':           // 已申请申诉，需要审批，采购方收到
                {
                    content: '#已请求申诉，请尽快审批。',
                    theme: 'trade_forgiven',
                    count_elements: 1
                },
            'trade_order_no_forgiven_to_pay_partition':     // 没有谅解申请，分期付款，采购方收到
                {
                    content: '#已确认交割，请尽快支付尾款。',
                    theme: 'trade_order_demand',
                    count_elements: 1
                },
            'trade_order_no_forgiven_to_pay_all_goods':     // 没有谅解申请，货到付款，采购方收到
                {
                    content: '#已确认交割，请尽快支付货款。',
                    theme: 'trade_order_demand',
                    count_elements: 1
                },
            'trade_order_no_forgiven_credit':     // 没有谅解申请，信用付款，采购方收到
                {
                    content: '#已确认交割，请于#前支付货款。',
                    theme: 'trade_order_demand',
                    count_elements: 2
                },
            'trade_order_no_forgiven_over':             // 没有申请谅解，订单结束
                {
                    content: '#已确认交割，订单完成。欢迎继续使用日升昌交易平台。',
                    theme: 'trade_forgiven',
                    count_elements: 1
                },
            'trade_order_forgiven_agreed_to_pay':   // 谅解通过，等待付款，销售收到。
                {
                    content: '#已接受了您的申诉请求，请等待对方付款。',
                    theme: 'trade_forgiven',
                    count_elements: 1
                },
            'trade_order_forgiven_denied_to_pay':   // 谅解拒绝，等待付款，销售收到。
                {
                    content: '#不接受您的申诉请求，请等待对方付款。具体原因请与对方联系。',
                    theme: 'trade_forgiven',
                    count_elements: 1
                },
            'trade_order_forgiven_agreed_credit':   // 谅解通过，信用付款，等待付款，销售收到。
                {
                    content: '#已接受了您的申诉请求，请等待对方于#前付款。',
                    theme: 'trade_forgiven',
                    count_elements: 2
                },
            'trade_order_forgiven_denied_credit':   // 谅解拒绝，信用付款，等待付款，销售收到。
                {
                    content: '#不接受您的申诉请求，请等待对方于#前付款。具体原因请与对方联系。',
                    theme: 'trade_forgiven',
                    count_elements: 2
                },
            'trade_order_forgiven_agreed_over':   // 谅解通过，订单结束，销售收到。
                {
                    content: '#已接受了您的申诉请求，订单完成。欢迎继续使用日升昌交易平台。',
                    theme: 'trade_forgiven',
                    count_elements: 1
                },
            'trade_order_forgiven_denied_over':   // 谅解拒绝，订单结束，销售收到。
                {
                    content: '#不接受您的申诉请求，订单完成。具体原因请与对方联系，欢迎继续使用日升昌交易平台。',
                    theme: 'trade_forgiven',
                    count_elements: 1
                },
            'trade_order_final_paid_partition':         // 支付了尾款，分期，销售收到
                {
                    content: '#已支付尾款，请确认收款完成交割。',
                    theme: 'trade_pay',
                    count_elements: 1
                },
            'trade_order_final_paid_all_goods':         // 支付了尾款，货到付款，销售收到
                {
                    content: '#已支付货款，请确认收款完成交割。',
                    theme: 'trade_pay',
                    count_elements: 1
                },
            'trade_order_over':                         // 确认支付货款，订单完成，采购收到
                {
                    content: '#已确认收到货款，订单完成，欢迎继续使用日升昌交易平台。',
                    theme: 'trade_pay',
                    count_elements: 1
                },
            'trade_order_over_no_pay_demand':			// 订单不经过最后付款步骤结束，订单完成，采购方收到
                {
                    content: '恭喜您，订单已完成！欢迎继续使用日升昌交易平台。',
                    theme: 'trade_order_demand',
                    count_elements: 1
                },
            'trade_order_over_no_pay_supply':			// 订单不经过最后付款步骤结束，订单完成，销售方收到
                {
                    content: '恭喜您，订单已完成！欢迎继续使用日升昌交易平台。',
                    theme: 'trade_order_supply',
                    count_elements: 1
                },
            'trade_order_payment_3':                    // 通知采购方付款时间3天
                {
                    content: '订单[#]距离最终支付还有3天。',
                    theme: 'trade_pay',
                    count_elements: 1
                },
            'trade_order_payment_5':                    // 通知采购方付款时间5天
                {
                    content: '订单[#]距离最终支付还有5天。',
                    theme: 'trade_pay',
                    count_elements: 1
                },
            'company_frozen':               // 公司被冻结
                {
                    content: '因#，您的公司帐号现被冻结。',
                    theme: 'company',
                    count_elements: 1
                },
            'company_defrozen':             // 公司被解冻
                {
                    content: '您的公司账号现被解冻，可正常使用。',
                    theme: 'company',
                    count_elements: 0
                },
            'company_verify_success':       // 公司认证成功
                {
                    content: '恭喜您，您的公司已经通过平台认证。',
                    theme: 'company',
                    count_elements: 0
                },
            'company_verify_fail':          // 公司认证失败
                {
                    content: '因#，您的公司未能通过平台认证。',
                    theme: 'company',
                    count_elements: 1
                },
            // ^^^^^^ ZHR ^^^^^^ //

//&&&&&&&&&&&&&&&&&&--CC--&&&&&&&&&&&&&&&&&&&&&&&&&&&----都是出厂价，以采购质检为准的
            'trade_demand_failure': {        // 抢单有效期结束前
                content: '#公司发布的采购##吨，已有#家报价，价格区间（#元/吨－#元/吨）,快来报价或者修改您的抢单，更快达成交易合作！',
                theme: 'company',
                count_elements: 4
            },
            'trade_order_upload_inspection_report': {        // 抢单有效期结束前
                content: '#您已确认订单，请及时上传质检报告等待采购方派车提货！',
                theme: 'trade_order_supply',
                count_elements: 1
            },
            'trade_order_to_supply': {        // 销售确认订单
                content: '#已确认您##吨的订单，请在指定时间指派物流车辆提货！',
                theme: 'trade_order_demand',
                count_elements: 3
            },
            'trade_order_traffic_start_time':       // 指定时间指派物流车辆提货，通过支付了预付款或者全款后，采购方收到。
                {
                    content: '#已确认收款，请在指定时间指派物流车辆提货！',
                    theme: 'trade_pay',
                    count_elements: 1
                },
            'trade_order_traffic_start_credit_traffic':     // 交易信用付款（现金）
                {
                    content: '您已获得#授予的信用额度#元,有效期#天!请在指定时间指派物流车辆提货！',
                    theme: 'trade_pay',
                    count_elements: 3
                },
            'trade_order_price_upload_inspection_report':     // 交易信用付款（现金）
                {
                    content: '您已完成收款，请及时上传质检报告等待采购方派车提货！',
                    theme: 'trade_order_supply',
                    count_elements: 0
                },
            'trade_price_offer_new_owner':       // 销售发布主动报价，通知自己。
                {
                    content: '恭喜您发布销售#报价成功，共覆盖#个提货区域!',
                    theme: 'trade_price_offer',
                    count_elements: 2
                },
            'trade_order_steel_not_forgiven':           // 质检完毕，钢铁直接确认交割
                {
                    content: '#质检完毕，请查看质检结果确认交割！',
                    theme: 'trade_order_supply',
                    count_elements: 1
                },
            'trade_order_no_forgiven_to_pay_by_supply':     // 出厂价并且以销售质检为准的确认交割
                {
                    content: '#已确认##吨收货完毕，请等待支付货款！',
                    theme: 'trade_order_supply',
                    count_elements: 3
                },
            'trade_order_inspection_report_credit_supply':     // 开始质检，信用审批通过，销售方收到。
                {
                    content: '#申请的信用已经授出，请及时上传质检报告等待采购方派车提货！',
                    theme: 'trade_pay',
                    count_elements: 1
                },
            'trade_order_no_forgiven_to_pay_by_partition':     //分期付款
                {
                    content: '您已确认##吨收货完毕，请尽快支付尾款!',
                    theme: 'trade_order_demand',
                    count_elements: 2
                },
            'trade_order_no_forgiven_to_pay_by_all_goods':     //货到付款
                {
                    content: '您已确认##吨收货完毕，请尽快支付货款！',
                    theme: 'trade_order_demand',
                    count_elements: 2
                },
            'trade_order_no_forgiven_to_pay_by_credit':     //信用付款
                {
                    content: '您已确认##吨收货完毕，请于#年#月#日前支付货款！',
                    theme: 'trade_order_demand',
                    count_elements: 5
                },
            invite_unlock_driver: {
                content: '您的车辆关键信息已被解锁，所有认证过您的物流企业已取消对您的认证关系，请重新锁定车辆关键信息，再次申请认证获得合作资格！',
                theme: 'verify',
                count_elements: 0
            },
            trade_order_advance_paid_credit: {//采购的财务收到
                content: '#向#申请信用付款#元，具体事项请与#联系!',
                theme: 'finance',
                count_elements: 4
            },
            trade_order_advance_paid_credit_supply: {
                content: '您的##向您申请#应付信用#元货款，点击www.e-wto.com审批,具体事项请与#联系！',
                theme: 'finance',
                count_elements: 5
            },
            trade_order_advance_paid_credit_supply2: {//销售财务收到
                content: '您的##向您申请#应付信用#元货款，已审核通过请查看,www.e-wto.com，具体事项请与#联系!',
                theme: 'finance',
                count_elements: 5
            },
            trade_order_advance_paid_credit_supply4: {//销售超管收到
                content: '#向您申请应付信用#元货款，已审核通过请查看!',
                theme: 'finance',
                count_elements: 2
            },
            trade_order_advance_paid_credit_demand1: {
                content: '#已授予贵公司信用额度#元，有效期#天!',
                theme: 'finance',
                count_elements: 3
            },
            trade_order_advance_paid_credit_demand2: {
                content: '#已审核通过您的信用申请，请实时关注物流信息，等待收货！',
                theme: 'finance',
                count_elements: 1
            },
            trade_order_advance_paid_credit_supply3: {
                content: '#的信用申请已审核通过，请点击发布物流需求信息！www.e-wto.com',
                theme: 'finance',
                count_elements: 1
            },
            trade_supply_cancel_order_msg_to_demand: {
                content: '#已取消##吨的订单，具体原因请于销售方联系，请查看！www.e-wto.com',
                theme: 'trade_order_demand',
                count_elements: 2
            },

//&&&&&&&&&&&&&&&&&&--CC--&&&&&&&&&&&&&&&&&&&&&&&&&&&


            // ------ CY ------ //
            signup: {
                content: '欢迎###加入日升昌交易平台！快快邀请企业成员进行交易吧！',
                theme: 'company',
                count_elements: 3
            },
            signup_share: {
                content: '#公司邀请您成为认证企业，快来申请',
                theme: 'verify',
                count_elements: 1
            },
            invite_signup: {
                content: '您邀请的##已成功注册日升昌交易平台！',
                theme: 'company',
                count_elements: 2
            },
            invite_signup_private_driver: {
                content: '#邀请您成为认证挂靠车辆，快来申请！',
                theme: 'verify',
                count_elements: 1
            },
            invite_signup_notice: {
                content: '欢迎###已成功注册日升昌交易平台！',
                theme: 'company',
                count_elements: 3
            },
            old_public_dirver_trans: {
                content: '物流负责人#将#指派给了#，#车下的已接单及进行中的订单将由司机#完成运输！',
                theme: 'company',
                count_elements: 5
            },
            new_public_dirver_trans: {
                content: '物流负责人#将#指派给您，#车下的已接单及进行中的订单将由您完成运输！',
                theme: 'company',
                count_elements: 3
            },
            traffic_admin_dirver_trans: {
                content: '#车下的物流订单将继续由司机#完成运输！',
                theme: 'truck_public',
                count_elements: 2
            },
            traffic_private_dirver_note: {
                content: '#（#）#，请知悉！',
                theme: 'truck_private',
                count_elements: 3
            },
            traffic_public_dirver_note: {
                content: '#（#）#，请知悉！',
                theme: 'truck_public',
                count_elements: 3
            },
            traffic_admin_price_offer: {
                content: '恭喜您成功发布从#到#的线路报价！',
                theme: 'traffic_price_offer',
                count_elements: 2
            },
            traffic_price_ask_add_trade: {
                content: '恭喜您成功发布从#到#运输#的询价！',
                theme: 'traffic_price_ask',
                count_elements: 3
            },
            traffic_price_ask_add_trade_one: {
                content: '恭喜您成功发布从#到#运输#的询价，您现在还没有认证企业，快去邀请吧，系统将自动推送给您的认证企业！',
                theme: 'traffic_price_ask',
                count_elements: 3
            },
            traffic_price_ask_dec_trade: {
                content: '您于#年#月#日取消从#到#运输#的询价！',
                theme: 'traffic_price_ask',
                count_elements: 6
            },
            traffic_price_ask_dec_traffic: {
                content: '##年#月#日取消了从#到#运输#的询价！',
                theme: 'traffic_price_ask',
                count_elements: 7
            },
            traffic_price_ask_offer_add: {
                content: '恭喜您已报价成功，请等待对方确认报价。及时修改您的报价可以提升您的排名！',
                theme: 'traffic_price_ask',
                count_elements: 0
            },
            traffic_price_ask_offer_add_trade: {
                content: '#对您的询价单进行了报价，点击查最新报价排名！',
                theme: 'traffic_price_ask',
                count_elements: 1
            },
            traffic_price_ask_offer_select_trade: {
                content: '您已选择#为您运输##吨从#到#,该订单已生成，请尽快确认！',
                theme: 'traffic_order',
                count_elements: 5
            },
            traffic_price_ask_offer_select_traffic: {
                content: '恭喜您，#已确认您的报价，该订单已生成，请尽快点击确认！',
                theme: 'traffic_order',
                count_elements: 1
            },
            traffic_price_ask_push_msg: {
                content: '#将从#到#运输#向您询价，快来报价吧。',
                theme: 'traffic_price_ask',
                count_elements: 4
            },
            traffic_price_ask_offer_edit: {
                content: '#修改了报价内容，请查看最新报价排名！www.e-wto.com',
                theme: 'traffic_price_ask',
                count_elements: 1
            },
            traffic_price_ask_offer_dec: {
                content: '#已取消了对您从#到#运输#的报价！',
                theme: 'traffic_price_ask',
                count_elements: 4
            },
            traffic_driver_offer_add: {
                content: '挂靠车车辆#对您的发布的车辆抢单进行了抢单，请点击查看！www.e-wto.com',
                theme: 'traffic_order',
                count_elements: 1
            },
            traffic_driver_demand_add_one: {
                content: '恭喜您成功发布挂靠车辆抢单！尽快邀请您的挂靠车辆进行抢单！',
                theme: 'driver_demand',
                count_elements: 0
            },
            traffic_driver_demand_add: {
                content: '恭喜您成功发布挂靠车辆抢单！尽快邀请您的挂靠车辆进行抢单！',
                theme: 'traffic_order',
                count_elements: 0
            },
            traffic_driver_demand_dec: {
                content: '#已取消#-#的物流订单！',
                theme: 'traffic_order',
                count_elements: 3
            },
            traffic_driver_plan_10m_timeout: {
                content: '#指派您运输#从#到#，该指派任务还有10分钟将要逾期，请尽快接单！',
                theme: 'traffic_order',
                count_elements: 4
            },
            traffic_driver_demand_add_driver: {
                content: '#发布了#至#的车辆抢单，快去抢单吧！',
                theme: 'traffic_demand',
                count_elements: 3
            },
            traffic_demand_timeout_validity: {
                content: '您的抢单时效已结束，请选单！该笔订单已报价#家，未报价#家。',
                theme: 'traffic_demand',
                count_elements: 2
            },
            traffic_demand_timeout_select: {
                content: '您发布的物流抢单选单时效已结束，若未达成交易请继续发布物流抢单！',
                theme: 'traffic_demand',
                count_elements: 0
            },
            traffic_demand_close: {
                content: '您于#年#月#日取消了由#至###吨的运输需求！',
                theme: 'traffic_demand',
                count_elements: 7
            },
            traffic_demand_12_hours_tip: {
                content: '#发布由#至#运输##吨的抢单于12小时后停止抢单，请未抢单的企业尽快参与报价！',
                theme: 'traffic_demand',
                count_elements: 5
            },
            traffic_demand_close_to_traffic: {
                content: '#于#年#月#日取消了由#至###吨的运输需求！',
                theme: 'traffic_demand',
                count_elements: 8
            },
            traffic_demand_add_to_self_1: {
                content: '恭喜您已发布由#至# # #吨的运输需求，系统将自动推送给您的认证企业！',
                theme: 'traffic_demand',
                count_elements: 4
            },
            traffic_demand_add_to_self_2: {
                content: '恭喜您已发布由#至# # #吨的运输需求，您现在还没有认证企业，快去认证吧，系统将自动推送给您的认证企业！',
                theme: 'traffic_demand',
                count_elements: 4
            },
            traffic_demand_push_msg: {
                content: '#由#至#运输##吨，有效期至#年#月#日快来抢单！',
                theme: 'traffic_demand',
                count_elements: 8
            },
            traffic_driver_demand_push_msg: {
                content: '#运输#共#吨，快来抢单！',
                theme: 'driver_demand',
                count_elements: 3
            },
            traffic_add_offer_to_trade: {
                content: '#已向您发起的物流抢单报价，请查看！www.e-wto.com',
                theme: 'traffic_demand',
                count_elements: 1
            },
            traffic_add_offer_to_traffic: {
                content: '恭喜您已抢单成功，请等待发单方确认订单！及时修改您的报价和付款方式可以提升您的排名！',
                theme: 'traffic_demand',
                count_elements: 0
            },
            traffic_add_offer_to_traffic_one: {
                content: '#发布的由#至#运输##吨，已有#家报价，价格区间（#元/吨－#元/吨），快来报价或者修改您的抢单，更快达成交易合作！',
                theme: 'traffic_demand',
                count_elements: 8
            },
            traffic_edit_offer_to_trade: {
                content: '#修改了抢单内容，请查看最新抢单排名！www.e-wto.com',
                theme: 'traffic_demand',
                count_elements: 1
            },
            traffic_offer_close: {
                content: '#已取消由#至###吨抢单报价！',
                theme: 'traffic_demand',
                count_elements: 5
            },
            traffic_order_add_by_line_id_trade: {
                content: '您已选择#作为承运商，该订单已生成，等待对方确认！',
                theme: 'traffic_price_offer',
                count_elements: 1
            },
            traffic_order_close_trade: {
                content: '您已取消#由#至#运输##吨的订单，取消后无法在该需求下对该企业下单！',
                theme: 'traffic_order',
                count_elements: 5
            },
            traffic_order_close_traffic: {
                content: '#已取消由#至#运输##吨的订单，具体原因请与对方联系，请查看！www.e-wto.com',
                theme: 'traffic_order',
                count_elements: 5
            },
            //traffic_order_1_confirm_trade: {
            //    content: '您已选择#作为承运商，该订单已生成，等待对方确认！',
            //    theme:'traffic_order',
            //    count_elements: 1
            //},
            traffic_order_generated_by_demand: {
                content: '您已选择#作为承运商，该订单已生成，请尽快确认！',
                theme: 'traffic_order',
                count_elements: 1
            },
            traffic_order_1_confirm_traffic: {
                content: '恭喜您，#已确认您的抢单，该订单已生成，请尽快点击确认！',
                theme: 'traffic_order',
                count_elements: 1
            },
            traffic_order_1_traffic_confirm_trade: {
                content: '您与#的物流订单已生成，点击支付运费！',
                theme: 'traffic_pay',
                count_elements: 1
            },
            traffic_order_1_traffic_confirm_trade_partition: {
                content: '您与#的物流订单已生成，点击支付预付款！',
                theme: 'traffic_pay',
                count_elements: 1
            },
            traffic_order_1_traffic_confirm_trade_credit: {
                content: '您与#的物流订单已生成，点击申请信用付款！等待对方信用审核！',
                theme: 'traffic_pay',
                count_elements: 1
            },
            traffic_order_1_traffic_confirm_trade_all_goods: {
                content: '您已确定了#由#至#运输##吨的订单，请尽快申请发车！',
                theme: 'traffic_order',
                count_elements: 5
            },
            traffic_order_1_traffic_confirm_trade_all_goods_trade: {
                content: '#已确认您##吨的运输订单，请实时关注物流动态！',
                theme: 'traffic_order',
                count_elements: 3
            },
            traffic_order_2_upload_payment_traffic: {
                content: '#已支付运费，点击确认收款！',
                theme: 'traffic_pay',
                count_elements: 1
            },
            traffic_order_2_upload_payment_traffic_partition: {
                content: '#已支付预付款，点击确认收款！',
                theme: 'traffic_pay',
                count_elements: 1
            },
            traffic_order_2_apply_add_traffic_time_three_partition: {
                content: '#已向您申请发车，请确认发车时间，通知仓库管理员等待提货！',
                theme: 'traffic_order',
                count_elements: 1
            },
            traffic_order_2_apply_add_traffic_time_three_all_goods: {
                content: '#已申请发车，请确认发车时间，通知仓库管理员等待提货！',
                theme: 'traffic_order',
                count_elements: 1
            },
            traffic_order_2_apply_add_traffic_time_two_partition: {
                content: '#已向您申请发车，请确认发车时间！',
                theme: 'traffic_order',
                count_elements: 1
            },
            traffic_order_2_apply_add_traffic_time_two_all_goods: {
                content: '#已申请发车，请确认发车时间！',
                theme: 'traffic_order',
                count_elements: 1
            },
            traffic_order_2_traffic_confirm_traffic: {
                content: '您已完成收款，请选发车时间！',
                theme: 'traffic_pay',
                count_elements: 0
            },
            traffic_order_2_traffic_confirm_trade: {
                content: '#已确认收款，请等待对方申请发车！',
                theme: 'traffic_pay',
                count_elements: 1
            },
            traffic_order_2_deal_add_traffic_time_traffic: {
                content: '#已确认发车时间，请派车或发布挂靠车辆抢单！',
                theme: 'traffic_order',
                count_elements: 1
            },
            traffic_order_2_add_traffic_driver: {
                content: '恭喜您已被#选为运输车辆，请在指定时间发车！',
                theme: 'traffic_demand',
                count_elements: 1
            },
            traffic_order_2_add_traffic_driver_order: {
                content: '您已被#指定派车，运输从#至#，请查看！',
                theme: 'traffic_order',
                count_elements: 3
            },
            traffic_order_2_driver_agree: {
                content: '#车辆#发车！',
                theme: 'traffic_order',
                count_elements: 2
            },
            traffic_order_2_driver_disagree: {
                content: '您的#车辆#拒绝发车！',
                theme: 'traffic_order',
                count_elements: 2
            },
            traffic_order_2_driver_not_ready: {
                content: '您的#车辆#拒绝接单！',
                theme: 'traffic_order',
                count_elements: 2
            },
            //traffic_order_2_add_traffic_trade: {
            //    content: '#选择车辆完毕，请通知仓管同意提货！',
            //    theme:'traffic_order',
            //    count_elements: 1
            //},
            // traffic_order_3_driver_trade_one: {
            //     content: '#已派车辆，请通知仓管准备提货！',
            //     theme:'traffic_order',
            //     count_elements: 1
            // },
            // traffic_order_3_driver_trade_two: {
            //     content: '#已开始发车，请通知仓管准备收货！',
            //     theme:'traffic_order',
            //     count_elements: 1
            // },
            traffic_order_3_application_get: {
                content: '已申请提货等待发货方仓管过磅！',
                theme: 'traffic_order',
                count_elements: 0
            },
            traffic_order_3_application_get_store: {
                content: '物流车辆#向您申请提货，准备过磅！',
                theme: 'traffic_order',
                count_elements: 1
            },
            traffic_order_3_sell_weigh: {
                content: '#提货仓管#核定提货#吨，请准备交货！',
                theme: 'traffic_order',
                count_elements: 3
            },
            traffic_order_3_buy_weigh: {
                content: '#交货仓管#核定交货#吨，本次运输完成！',
                theme: 'traffic_order',
                count_elements: 3
            },
            traffic_order_3_application_give_trade: {
                content: '#已运输完毕，请通知仓管同意收货！',
                theme: 'traffic_order',
                count_elements: 1
            },
            traffic_order_3_application_give_store: {
                content: '物流车辆#向您申请交货，准备过磅！',
                theme: 'traffic_order',
                count_elements: 1
            },
            traffic_order_3_buy_weigh_traffic_one: {
                content: '您交货吨数已超过合同约定吨数，具体原因请与对方联系并及时确认运输完毕！',
                theme: 'traffic_order',
                count_elements: 0
            },
            traffic_order_3_buy_weigh_traffic_two: {
                content: '请继续派车!',
                theme: 'traffic_order',
                count_elements: 0
            },
            traffic_order_3_confirm_trade_one: {
                content: '#已确认运输完毕，请确认交货完毕并支付货款！',
                theme: 'traffic_order',
                count_elements: 1
            },
            traffic_order_3_confirm_trade_two: {
                content: '#已确认运输完毕，请与收货方核实后确认交货！',
                theme: 'traffic_order',
                count_elements: 1
            },
            traffic_order_3_confirm_trade_three: {
                content: '#已确认运输完毕，请与收货方核实后确认交货！',
                theme: 'traffic_order',
                count_elements: 1
            },
            traffic_order_3_confirm_trade_four: {
                content: '#已运输完毕，点击支付尾款！',
                theme: 'traffic_pay',
                count_elements: 1
            },
            traffic_order_4_buy_confirm: {
                content: '#已确认交货完毕，请选择是否需要申诉！',
                theme: 'traffic_order',
                count_elements: 1
            },
            traffic_order_4_traffic_confirm: {
                content: '#已确认交割，请确支付尾款！',
                theme: 'traffic_pay',
                count_elements: 1
            },
            traffic_order_4_req_forgiven_partition: {
                content: '#已申请申诉，请尽快审批！',
                theme: 'traffic_order',
                count_elements: 1
            },
            traffic_order_4_req_forgiven_credit: {
                content: '#已申请申诉，请审核后请于#年#月#日前支付运费！',
                theme: 'traffic_pay',
                count_elements: 4
            },
            traffic_order_4_req_forgiven_all_goods: {
                content: '#已申请申诉，请审核后支付运费！',
                theme: 'traffic_pay',
                count_elements: 1
            },
            traffic_order_4_agree_forgiven_all_goods: {
                content: '#已同意了您的申诉请求，请等待对方付款！',
                theme: 'traffic_pay',
                count_elements: 1
            },
            traffic_order_4_agree_forgiven_trade: {
                content: '您已同意#的申诉请求，请支付运费！',
                theme: 'traffic_pay',
                count_elements: 1
            },
            traffic_order_4_disagree_forgiven_trade: {
                content: '您已拒绝#的申诉请求，请支付运费！',
                theme: 'traffic_pay',
                count_elements: 1
            },
            traffic_order_4_disagree_forgiven_all_goods: {
                content: '#已拒绝了您的申诉请求，请等待对方付款！具体原因请与对方联系！',
                theme: 'traffic_pay',
                count_elements: 1
            },
            traffic_order_4_agree_forgiven_credit: {
                content: '#已同意了您的申诉请求，请等待#年#月#日前付款！',
                theme: 'traffic_pay',
                count_elements: 4
            },
            traffic_order_4_disagree_forgiven_credit: {
                content: '#已拒绝了您的申诉请求，请等待#年#月#日前付款！具体原因请与对方联系！',
                theme: 'traffic_pay',
                count_elements: 4
            },
            traffic_order_4_agree_forgiven_partition: {
                content: '#同意您申请的申诉，请等待收尾款！',
                theme: 'traffic_pay',
                count_elements: 1
            },
            traffic_order_4_disagree_forgiven_partition: {
                content: '#不接受您申请的申诉，请等待收尾款！具体原因请与对方联系！',
                theme: 'traffic_pay',
                count_elements: 1
            },
            traffic_order_4_traffic_confirm_credit: {
                content: '#已确认交割，请于#年#月#日前支付运费！',
                theme: 'traffic_pay',
                count_elements: 4
            },
            traffic_order_4_buy_reconfirm_trade: {
                content: '#已确认运输完毕，请支付运费款！',
                theme: 'traffic_pay',
                count_elements: 1
            },
            traffic_order_5_upload_payment_traffic: {
                content: '#已支付运费，请确认收款！',
                theme: 'traffic_pay',
                count_elements: 1
            },
            traffic_order_5_upload_payment_traffic_partition: {
                content: '#已支付尾款，请确认收款！',
                theme: 'traffic_pay',
                count_elements: 1
            },
            traffic_order_finish: {
                content: '恭喜您！订单已完成！欢迎继续使用日升昌交易平台！',
                theme: 'traffic_order',
                count_elements: 0
            },
            traffic_order_payment_remainder_day: {
                content: '物流订单#，据还款日还有#天！',
                theme: 'traffic_pay',
                count_elements: 2
            },
            credit_notice: {
                content: '#向您申请应付信用#元，点击审批！',
                theme: 'finance',
                count_elements: 2
            },
            credit_notice_self: {
                content: '#向#申请信用付款#元，具体事项请与#联系！',
                theme: 'finance',
                count_elements: 4
            },
            credit_ok: {
                content: '恭喜您获得#授予的信用额度#元，有效期#天！',
                theme: 'trade_pay',
                count_elements: 3
            },
            credit_ok_traffic: {
                content: '恭喜您获得#授予的信用额度#元，有效期#天！',
                theme: 'traffic_pay',
                count_elements: 3
            },
            credit_ok_trade: {
                content: '您已审核通过#的信用申请，请选择发车时间！',
                theme: 'traffic_pay',
                count_elements: 1
            },
            credit_ok_trade_one: {
                content: '#已审核通过信用付款，请确认发车时间，通知仓库管理员等待提货！',
                theme: 'traffic_pay',
                count_elements: 1
            },
            credit_ok_trade_notice: {
                content: '#已授予贵公司信用额度#元，有效期#天!',
                theme: 'traffic_pay',
                count_elements: 3
            },
            credit_ok_chu_chang: {
                content: '恭喜您获得#授予的信用额度#元，有效期#天！请在指定时间指派物流车辆提货！',
                theme: 'trade_pay',
                count_elements: 3
            },
            credit_payment_remainder_day: {
                content: '信用单号#，据还款日还有#天！',
                theme: 'finance',
                count_elements: 2
            },
            company_verify_direct: {
                content: '您已成为#的认证合作伙伴，请查看！',
                theme: 'verify',
                count_elements: 1
            },
            apply_verify: {
                content: '#向您申请企业认证，请查看！',
                theme: 'verify',
                count_elements: 1
            },
            apply_verify_self: {
                content: '您已向#申请认证请耐心等待或再次申请！',
                theme: 'verify',
                count_elements: 1
            },
            driver_apply_verify_self: {
                content: '您已向#申请认证成为该公司挂靠车辆请耐心等待或再次申请！',
                theme: 'verify',
                count_elements: 1
            },
            driver_apply_verify_traffic: {
                content: '物流车辆#向您申请认证成为挂靠车辆，请点击traffic.e-wto.com查看！',
                theme: 'verify',
                count_elements: 1
            },
            driver_apply_verify_agree: {
                content: '#已通过您的认证申请，快来抢单或等待接单！',
                theme: 'verify',
                count_elements: 1
            },
            driver_apply_verify_disagree: {
                content: '#已拒绝您的认证申请！',
                theme: 'verify',
                count_elements: 1
            },
            approve_verify: {
                content: '#已同意您的认证申请，快来抢单报价吧！',
                theme: 'verify',
                count_elements: 1
            }
            // ^^^^^^ CY ^^^^^^ //
        },
        sms_templates: {
          get_verify_code_cppcc: {
            //  content: '验证码：#，^，打造互联网产业新时代!',
            content: '您正在登录政协中心，验证码：#，有效期1分钟',
            count_elements: 1,
            // link: 9,
          },
            replace_driver_agree: {
                content: '【中钢云】##已替您承接#至#的###等产品的运输，提货码为#，请点击logistics.e-wto.com查看，退订回T',//发布司机抢单
                theme: 'verify',
                count_elements: 9
            },
            driver_order: {
                content: '【中钢云】##已为您指派#至#的###等产品的运输，提货码为#,请点击logistics.e-wto.com查看，退订回T',//发布司机抢单
                theme: 'verify',
                count_elements: 9
            },
            get_verify_code: {
                content: '验证码：#，中钢云携手运输中心、仓储中心、司机中心，打造互联网产业新时代!',
                count_elements: 1
            },
            invite_college: {
                content: '【中钢云】#已全面升级互联网+，#邀请您成为#，立即登录www.sinosteel.cc，退订回T',
                count_elements: 3
            },
            invite_friend_company_sell: {
                content: '尊敬的#总：#集团已经升级互联网+，#已添加您为认证合作企业，请点击查看最新发布的22个#报价：www.sinosteel.cc,退订回T',
                count_elements: 2
            },
            invite_friend_company_buy: {
                content: '尊敬的#总：#集团已经升级互联网+，#已添加您为认证合作企业，刚刚发布的5个#需求，已有多家企业参与报价，快来报价：www.sinosteel.cc,退订回T',
                count_elements: 2
            },
            invite_friend_company_all: {
                content: '【中钢云】#已升级互联网+正在线销售#采购#，并发布物流货源请登录www.sinosteel.cc，立即查看,退订回T',
                count_elements: 3
            },
            invite_friend_company_traffic: {
                content: '【中钢云】#已升级互联网+正在线运输#,并发布物流线路,交易请登录www.sinosteel.cc,仓储请登录warehouse.e-wto.com,物流请登录logistics.e-wto.com,司机请登录vehicles.e-wto.com,立即查看,退订回T',
                count_elements: 2
            },
            invite_friend_sell: {
                content: '【中钢云】#正在发布#报价，请登录www.sinosteel.cc，立即查看,退订回T',
                count_elements: 2
            },
            invite_friend_buy: {
                content: '【中钢云】#正在发布#采购，请登录www.sinosteel.cc，立即查看,退订回T',
                count_elements: 2
            },
            invite_friend_all: {
                content: '【中钢云】#正在发布#报价#采购，请登录www.sinosteel.cc，立即查看,退订回T',
                count_elements: 3
            },
            invite_friend_traffic: {
                content: '【中钢云】#正在从事#运输,交易请登录www.sinosteel.cc,仓储请登录warehouse.e-wto.com,物流请登录logistics.e-wto.com,司机请登录vehicles.e-wto.com,立即查看,退订回T',
                count_elements: 2
            },
            invite_friend: {
                content: '【中钢云】#已升级互联网+,邀请您成为好友,交易请登录www.sinosteel.cc,仓储请登录warehouse.e-wto.com,物流请登录logistics.e-wto.com,司机请登录vehicles.e-wto.com,立即查看,退订回T',
                count_elements: 1
            },
            //主动报价短信
            pricing: {
                content: '【中钢云】##发布#等产品报价，最低价#元／吨，赶快查看属于你的优惠价！#，www.sinosteel.cc，退订回T',
                count_elements: 5
            },
            bidding: {
                content: '【中钢云】##发布#产品竞拍，尽早参与可能获得更优惠的采购价格！#,www.sinosteel.cc，退订回T',
                count_elements: 4
            },
            //抢单
            demand: {
                content: '【中钢云】##发布#产品采购，尽早参与可能达成更大量的采购订单！#，www.sinosteel.cc，退订回T', //主动报价发送短信
                count_elements: 4
            },
            //报价订单确认
            pricing_order_confirm: {
                content: '【中钢云】尊敬的#总：您选择的#吨#，#已确认订单，请点击www.sinosteel.cc查看:#，退订回T',
                count_elements: 5
            },
            //报价订单生成
            pricing_order_add: {
                content: '【中钢云】尊敬的#总您好，#给您的#报价下单#吨，请立即登录www.sinosteel.cc查看:#，退订回T',
                count_elements: 5
            },
            //竞价订单生成
            bidding_order_add: {
                content: '【中钢云】尊敬的#总：恭喜您参与的#竞拍出价，已被#下单#吨，立即登录www.sinosteel.cc确认订单:#，退订回T',
                count_elements: 5
            },
            //报价查看5次
            pricing_detail_5: {
                content: '【中钢云】尊敬的#总你好，您发布的#报价被5家新的企业查看未下单，请立即登录www.sinosteel.cc查看:#，退订回T',
                count_elements: 3
            },
            //报价查看5次
            bidding_detail_5: {
                content: '【中钢云】尊敬的#总：您发布的#竞拍，已被#等5家采购商查看未出价，请点www.sinosteel.cc击查看:#，退订回T',
                count_elements: 4
            },
            //竞价出价
            bidding_offer_add: {
                content: '【中钢云】尊敬的#总：您发布的#竞拍，#出价采购#吨，请点www.sinosteel.cc击查看#竞拍出价:#，退订回T',
                count_elements: 6
            },
            //需求单抢单
            demand_offer_add: {
                content: '【中钢云】尊敬的#总：您发布的#采购，已有#家报价，#家查看未下单，请点击www.sinosteel.cc查看:#，退订回T',
                count_elements: 5
            },
            unline_driver:{
                content: '【中钢云】派车单:请您驾驶 # 于#去#提货：#。现场协调##。海量货源->#，退订回复T',
                count_elements: 7,
                link: 10
            },
            //物流-------------
            //发布物流
            traffic_add_new: {
                content: '【中钢云】##发布#-##吨#的运输需求，立即抢单#，logistics.e-wto.com，退订回T',//发布物流
                count_elements: 7
            },
            traffic_add_new_12h: {
                content: '【中钢云】##发布#-#的#吨#的物流抢单，还有12h过期，点击logistics.e-wto.com查看#，退订回T',//还有12小时过期
                count_elements: 7
            },
            traffic_add_new_3_company: {
                content: '【中钢云】##发布#-#的#吨#的物流抢单，已有3家企业抢单，点击logistics.e-wto.com查看#，退订回T',//有三家企业抢单
                count_elements: 7
            },
            //指派物流公司
            traffic_assigned_company: {
                content: '【中钢云】##已指派贵公司运输#吨#等产品，app查看#，logistics.e-wto.com，退订回T',//指派物流公司
                count_elements: 5
            },
            //邀请物流公司
            traffic_invitation_company: {
                content: '【中钢云】##邀请上线天下物流平台，点击logistics.e-wto.com下载#，退订回T',//指派物流公司
                count_elements: 3
            },
            //发布司机抢单
            driver_add_offer: {
                content: '【中钢云】##发布#-##吨#等的运输需求，立即抢单#，logistics.e-wto.com退订回T',//发布司机抢单
                count_elements: 7
            },
            driver_add_offer_3_driver: {
                content: '【中钢云】##发布#-#的#吨#的物流抢单，已有3位司机抢单,点击logistics.e-wto.com查看#，退订回T',//有三个司机抢单
                count_elements: 7
            },
            driver_add_offer_one_hours: {
                content: '【中钢云】##发布#-#的#吨#的物流抢单，已有5位司机抢单,点击logistics.e-wto.com查看#，退订回T',//一小时后
                count_elements: 7
            },
            driver_add_traffic_force_new: {
                content: '【中钢云】##发布#-#的#吨#的物流抢单，已有3位司机抢单,点击logistics.e-wto.com查看#，退订回T',//强制指派司机
                count_elements: 7
            },
            traffic_add_truck: {
                content: '【中钢云】##邀请您成为挂靠车辆，账号：#、密码：#，点击logistics.e-wto.com查看#，退订回T',//添加挂靠司机
                count_elements: 5
            },
            traffic_add_truck_new: {
                content: '【中钢云】##将您添加为挂靠车辆，请回电确认：#或app查看#，退订回T',
                count_elements: 4
            },
            traffic_add_driver_offer_new: {
                content: '【中钢云】##已确认您运输#-#的#的产品#吨，已为您代替接单，app查看#，退订回T',
                count_elements: 7
            },
            traffic_Immediately_assigned_to_the_vehicle: {
                content: '【中钢云】##指派您运输#-#的#等产品运输，请回电接单：#或登录app接单，点击logistics.e-wto.com查看#，退订回T',//强制指派司机
                count_elements: 7
            },
            //邀请
            Invite_logistics_user: {
                content: '【中钢云】##邀请您成为#，邀请码#，请下载www.sinosteel.cc，退订回T',
                count_elements: 4
            },
            custom: {
                content: '【互联网+】#，退订回T',
                count_elements: 1
            },
            custom_driver: {
                content: '【司机中心】#，退订回T',
                count_elements: 1
            },
        },
        sms_templates_new: {
            replace_driver_agree: {
                content: '【&】##已替您承接#至#的###等产品的运输，提货码为#，请点击^查看，退订回T',//发布司机抢单
                theme: 'verify',
                count_elements: 9,
                link: 2
            },
            driver_order: {
                content: '【&】##已为您指派#至#的###等产品的运输，提货码为#,请点击^查看，退订回T',//发布司机抢单
                theme: 'verify',
                count_elements: 9,
                link: 2
            },
            get_verify_code: {
                //  content: '验证码：#，^，打造互联网产业新时代!',
                content: '验证码：#，登录^',
                count_elements: 1,
                // link: 9,
                link: 6,
            },
            invite_college: {
                content: '【&】#已全面升级互联网+，#邀请您成为#，立即登录^，退订回T',
                count_elements: 3,
                link: 1
            },
            invite_friend_company_sell: {
                content: '尊敬的#总：#集团已经升级互联网+，#已添加您为认证合作企业，请点击查看最新发布的22个#报价：^,退订回T',
                count_elements: 2,
                link: 1
            },
            invite_friend_company_buy: {
                content: '尊敬的#总：#集团已经升级互联网+，#已添加您为认证合作企业，刚刚发布的5个#需求，已有多家企业参与报价，快来报价：^,退订回T',
                count_elements: 2,
                link: 1
            },
            invite_friend_company_all: {
                content: '【&】#已升级互联网+正在线销售#采购#，并发布物流货源请登录^，立即查看,退订回T',
                count_elements: 3,
                link: 1
            },
            invite_friend_company_traffic: {
                content: '【&】#已升级互联网+正在线运输#,并发布物流线路,^,立即查看,退订回T',
                count_elements: 2,
                link: 5
            },
            invite_friend_sell: {
                content: '【&】#正在发布#报价，请登录^，立即查看,退订回T',
                count_elements: 2,
                link: 1
            },
            invite_friend_buy: {
                content: '【&】#正在发布#采购，请登录^，立即查看,退订回T',
                count_elements: 2,
                link: 1
            },
            invite_friend_all: {
                content: '【&】#正在发布#报价#采购，请登录^，立即查看,退订回T',
                count_elements: 3,
                link: 1
            },
            invite_friend_traffic: {
                content: '【&】#正在从事#运输,^,立即查看,退订回T',
                count_elements: 2,
                link: 5
            },
            invite_friend: {
                content: '【&】#已升级互联网+,邀请您成为好友,^,立即查看,退订回T',
                count_elements: 1,
                link: 5
            },
            //主动报价短信
            pricing: {
                content: '【&】##发布#等产品报价，最低价#元／吨，赶快查看属于你的优惠价！#，^，退订回T',
                count_elements: 5,
                link: 1
            },
            bidding: {
                content: '【&】##发布#产品竞拍，尽早参与可能获得更优惠的采购价格！#,^，退订回T',
                count_elements: 4,
                link: 1
            },
            //抢单
            demand: {
                content: '【&】##发布#产品采购，尽早参与可能达成更大量的采购订单！#，^，退订回T', //主动报价发送短信
                count_elements: 4,
                link: 1
            },
            //报价订单确认
            pricing_order_confirm: {
                content: '【&】尊敬的#总：您选择的#吨#，#已确认订单，请点击^查看:#，退订回T',
                count_elements: 5,
                link: 1
            },
            //报价订单生成
            pricing_order_add: {
                content: '【&】尊敬的#总您好，#给您的#报价下单#吨，请立即登录^查看:#，退订回T',
                count_elements: 5,
                link: 1
            },
            //竞价订单生成
            bidding_order_add: {
                content: '【&】尊敬的#总：恭喜您参与的#竞拍出价，已被#下单#吨，立即登录^确认订单:#，退订回T',
                count_elements: 5,
                link: 1
            },
            //报价查看5次
            pricing_detail_5: {
                content: '【&】尊敬的#总你好，您发布的#报价被5家新的企业查看未下单，请立即登录^查看:#，退订回T',
                count_elements: 3,
                link: 1
            },
            //报价查看5次
            bidding_detail_5: {
                content: '【&】尊敬的#总：您发布的#竞拍，已被#等5家采购商查看未出价，请点^击查看:#，退订回T',
                count_elements: 4,
                link: 1
            },
            //竞价出价
            bidding_offer_add: {
                content: '【&】尊敬的#总：您发布的#竞拍，#出价采购#吨，请点^击查看#竞拍出价:#，退订回T',
                count_elements: 6,
                link: 1
            },
            //需求单抢单
            demand_offer_add: {
                content: '【&】尊敬的#总：您发布的#采购，已有#家报价，#家查看未下单，请点击^查看:#，退订回T',
                count_elements: 5,
                link: 1
            },
            //发布线下找车
            unline_driver:{
                content: '【&】派车单:请您驾驶 # 于#去#提货：#。现场协调##。海量货源->#，退订回复T',
                //【鑫汇云】派车单：请您驾驶 冀U88393 于3月19日去鑫汇钢铁提货：[Q235，25件]钢铁，50吨。现场协调请联系陈源15399008899，详情查看 driver.e-wto.com 退订回T
                count_elements: 7,
                link: 10
            },
            //物流-------------
            //发布物流
            traffic_add_new: {
                content: '【&】##发布#-##吨#的运输需求，立即抢单#，^，退订回T',//发布物流
                count_elements: 7,
                link: 2
            },
            traffic_add_new_12h: {
                content: '【&】##发布#-#的#吨#的物流抢单，还有12h过期，点击^查看#，退订回T',//还有12小时过期
                count_elements: 7,
                link: 2
            },
            traffic_add_new_3_company: {
                content: '【&】##发布#-#的#吨#的物流抢单，已有3家企业抢单，点击^查看#，退订回T',//有三家企业抢单
                count_elements: 7,
                link: 2
            },
            //指派物流公司
            traffic_assigned_company: {
                content: '【&】##已指派贵公司运输#吨#等产品，app查看#，^，退订回T',//指派物流公司
                count_elements: 5,
                link: 2
            },
            //邀请物流公司
            traffic_invitation_company: {
                content: '【&】##邀请上线天下物流平台，点击^下载#，退订回T',//指派物流公司
                count_elements: 3,
                link: 2
            },
            //发布司机抢单
            driver_add_offer: {
                content: '【&】##发布#-##吨#等的运输需求，立即抢单#，^退订回T',//发布司机抢单
                count_elements: 7,
                link: 2
            },
            driver_add_offer_3_driver: {
                content: '【&】##发布#-#的#吨#的物流抢单，已有3位司机抢单,点击^查看#，退订回T',//有三个司机抢单
                count_elements: 7,
                link: 2
            },
            driver_add_offer_one_hours: {
                content: '【&】##发布#-#的#吨#的物流抢单，已有5位司机抢单,点击^查看#，退订回T',//一小时后
                count_elements: 7,
                link: 2
            },
            driver_add_traffic_force_new: {
                content: '【&】##发布#-#的#吨#的物流抢单，已有3位司机抢单,点击^查看#，退订回T',//强制指派司机
                count_elements: 7,
                link: 2
            },
            traffic_add_truck: {
                content: '【&】##邀请您成为挂靠车辆，账号：#、密码：#，点击^查看#，退订回T',//添加挂靠司机
                count_elements: 5,
                link: 2
            },
            traffic_add_truck_new: {
                content: '【&】##将您添加为挂靠车辆，请回电确认：#或app查看#，退订回T',
                count_elements: 4
            },
            traffic_add_driver_offer_new: {
                content: '【&】##已确认您运输#-#的#的产品#吨，已为您代替接单，app查看#，退订回T',
                count_elements: 7
            },
            traffic_Immediately_assigned_to_the_vehicle: {
                content: '【&】##指派您运输#-#的#等产品运输，请回电接单：#或登录app接单，点击^查看#，退订回T',//强制指派司机
                count_elements: 7,
                link: 2
            },
            //邀请
            Invite_logistics_user: {
                content: '【&】##邀请您成为#，邀请码#，请下载^，退订回T',
                count_elements: 4,
                link: 1
            },
            custom: {
                content: '【&】#，退订回T',
                count_elements: 1,
                link: 1
            }
        }
    };
/**
 * Created by Administrator on 2017/3/14.
 */

module.exports =
    {
        offer: {
            content: '##发布#产品报价，赶快查看属于你的优惠价',
            element_count: 3
        },
        edit_offer: {
            content: '##修改了产品报价，赶快查看属于你的优惠价',
            element_count: 2
        },
        preferential: {
            content: '##设置了区域优惠，赶快查看最新区域优惠价',
            element_count: 2
        },
        preferential_user: {
            content: '##针对您设置了专属优惠，赶快查看属于你的专属优惠价',
            element_count: 2
        },
        readjust: {
            content: '##调整了产品价格，赶快查看最新产品价格',
            element_count: 2
        },
        JJ_offer: {
            content: '##发布#产品竞价，尽早参与可能获得更优惠的采购价格',
            element_count: 3
        },
        //尊敬的尤总：您发布的螺纹钢竞拍，亚鑫集团出价采购3200吨，请点击查看亚鑫集团竞拍出价：链接；
        add_JJ: {
            content: '尊敬的#总：您发布的#竞拍，#出价采购#吨，请点击查看#竞拍出价',
            element_count: 3
        },
        add_JJ_dai: {
            content: '尊敬的#总：您好，代您发布的#吨#竞拍，已被#等#家采购商争相出价，请点击查看',
            element_count: 3
        },
        no_offer: {
            content: '##提醒您发布产品报价',
            element_count: 2
        },
        demand: {
            content: '##发布#产品抢单，尽早参与可能达成更大量的采购订单',
            element_count: 3
        },
        //尊敬的尤总：您发布的螺纹钢采购，已有3家报价，4家查看未下单，请点击查看：链接
        add_demandOffer: {
            content: '尊敬的#总：您发布的#采购，已有#家报价，#家查看未下单，请点击查看',
            element_count: 3
        },
        //尊敬的尤总：您发布的螺纹钢采购需求，亚鑫集团报价3200元/吨，请点击查看报价排名：链接；
        add_demandOffer_QjJJ: {
            content: '尊敬的#总：您发布的#采购需求，#报价#元/吨，请点击查看报价排名',
            element_count: 3
        },
        //尊敬的尤总：您选择的3400吨螺纹钢，金港集团已确认订单，请点击查看
        demandOffer_order: {
            content: '尊敬的#总：您选择的#吨#，#已确认单，请点击查看',
            element_count: 2
        },
        //尊敬的xx总你好，xx集团给您的螺纹钢报价下单3200吨，请立即登录查看（链接：）；
        shop_order: {
            content: '尊敬的#总您好，#集团给您的#报价下单##，请立即登录查看',
            element_count: 5
        },
        FOB_shop_order: {
            content: '##已下单#吨#等，请点击查看',
            element_count: 4
        },
        CIF_shop_order: {
            content: '##已下单#吨#等，请尽快通过平台找车，完成运输!',
            element_count: 4
        },
        //尊敬的尤总：恭喜您参与的螺纹钢竞拍出价，已被金港集团下单2800吨，立即登录确认订单：链接；
        JJ_order: {
            content: '尊敬的#总：恭喜您参与的#竞拍出价，已被#下单#吨，立即登录确认订单',
            element_count: 2
        },
        SALE_order: {
            content: '##已确认###产品订单，请尽快组织运输',
            element_count: 5
        },
        //尊敬的尤总：您选择的3400螺纹钢，金港集团已确认订单，请点击查看：链接
        PURCHASE_order: {
            content: '尊敬的#总：您选择的###，#已确认订单，请点击查看',
            element_count: 5
        },
        order_car: {
            content: '您与##达成的#等产品的交易订单，对方已线下找车，请点击查看',
            element_count: 3
        },
        inform_SALE: {
            content: '##提醒您及时确认##产品订单，请立即查看',
            element_count: 4
        },

        browse_pricing: {
            content: '##正在浏览您的报价',
            element_count: 2
        },
        browse_bidding: {
            content: '##正在浏览您的竞价',
            element_count: 2
        },
        browse_demand: {
            content: '##正在浏览您的抢单',
            element_count: 2
        },
        encodeContent: function (template_id, content) {
            var result = '';
            var msg_array = this[template_id]['content'].split('#');
            for (var i = 0; i < msg_array.length - 1; i++) {
                result += msg_array[i];
                result += content[i];
            }
            result += msg_array.pop();

            return result;
        },
        offer_sms: {
            content: '##发布#产品报价，赶快查看属于你的优惠价!#',
            element_count: 4
        }
    };
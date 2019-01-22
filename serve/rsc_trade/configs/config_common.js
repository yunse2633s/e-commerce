/**
 * Created by Administrator on 2015/11/16 0016.
 */

module.exports =
    {
        status: 'dev',
        amountArr: [32, 33, 34, 35, 36],
        token_server_timeout: 100000000,           //服务器间通讯秘钥超时时间
        entry_per_page: 5,
        offer_per_page: 3,
        list_per_page: 10,
        twenty_per_page:20,
        entry_insert_page: 3,
        total_number: 30,
        sms_templates: {
            trade_new_demand: 'trade_new_demand',      //发布需求单主动和30分钟后自动发短信
            trade_new_demand_12h: 'trade_new_demand_12h',     //需求单还有12小时失效
            trade_new_demand_3_company: 'trade_new_demand_3_company',   //需求单有三家公司报价
            trade_offer_new: 'trade_offer_new',        //发布报价主动或30分钟自动发短信
            trade_offer_update_price: 'trade_offer_update_price',   //调价
            trade_update_preferential: 'trade_update_preferential',  //优惠
            trade_update_quality_origin: 'trade_update_quality_origin',  //质检
            trade_update_inventory: 'trade_update_inventory',//库存
            trade_Invite_logistics_company: 'trade_Invite_logistics_company'//邀请成为物流伙伴
        },
        sendData: function (req, data, next) {
            req.result = data;
            next('success');
        },
        sort: {
            new: 'new',
            old: 'old',
            max: 'max',
            min: 'min'
        },
        VIP: {
            province: 1,
            city: 1,
            verify_phase: 1,
            url_logo: 1
        },
        user: {
            real_name: 'real_name',
            photo_url: 'photo_url',
            role: 'role'
        },
        storage: {
            name: 'name'
        },
        push_url: {
            demand: 'rsc.grab_detail_offer',  //交易抢单 params: {id: result._id}
            demandOffer: 'rsc.demand_detail', //交易抢单报价 params: {id: result.demand_id, type: 'sell'}
            offer: 'rsc.offerDetails',        //交易报价 params: {id: entry._id(订单的id), deal: 'buy', type: 'quan'}
            offerAgain: 'rsc.bidding_details',//交易竞价 params: {id: result.offer_id}
            bidding: "rsc.didding_left",      //交易竞价 params: {id: entry._id(订单的id), deal: 'buy', type: 'quan'}
            order: 'rsc.order_all'    //交易订单 params: {id: req.body.id, source: 'sale_confirmed'}  {id: result._id, source: type}
        },
        secret_keys: {
            user: 'user',
            invite: 'invite',
            trade: 'trade',
            traffic: 'traffic',
            admin: 'admin',
            dynamic: 'dynamic',
            store: 'store',
            credit: 'credit',
            statistical: 'statistical'
        },
        user_roles: {
            'TRADE_ADMIN': 'TRADE_ADMIN',
            'TRADE_PURCHASE': 'TRADE_PURCHASE',
            'TRADE_SALE': 'TRADE_SALE',
            'TRADE_MANUFACTURE': 'TRADE_MANUFACTURE',
            'TRADE_FINANCE': 'TRADE_FINANCE',
            'TRADE_STORAGE': 'TRADE_STORAGE',
            'TRAFFIC_ADMIN': 'TRAFFIC_ADMIN',
            'TRAFFIC_DRIVER': 'TRAFFIC_DRIVER'
        },
        user_roles_for_certification_company: {
            'SALE': 'SALE',
            'PURCHASE': 'PURCHASE'
        },

        free_package_name: {
            'com.rsc.tradecenter': 'com.rsc.tradecenter',
            'com.rsc.dispatcenter': 'com.rsc.dispatcenter',
            'com.rsc.drivercenter': 'com.rsc.drivercenter',
            'com.zgy365.zgy': 'com.zgy365.zgy'
        },
        push_type: {
            OFFER: 'OFFER',     //报价
            AUCTION: 'AUCTION', //竞价
            DEMAND: 'DEMAND'    //采购
        },
        push_status: {
            effective: 'effective',         //有效
            ineffective: 'ineffective'      //过期
        },
        url_share: {
            demand: '/html/rushDetail.html?',
            offer: '/html/myOfferPriceList.html?',
            download: '/html/downLoad.html'
        },

        OSS: {
            access_id: 'wZ2NKdo8zRXchXpr',
            access_key: 'T9ebkKOgyLSqsZx7SnhwViNHnZjAUo',
            bucket_img_url: 'rsc-img.oss-cn-beijing.aliyuncs.com',
            bucket_img: 'rsc-img'
        },

        VIDEO_OSS: {
            access_id: 'wZ2NKdo8zRXchXpr',
            access_key: 'T9ebkKOgyLSqsZx7SnhwViNHnZjAUo',
            bucket_video_url: 'rsc-video.oss-cn-beijing.aliyuncs.com',
            bucket_video: 'rsc-video'
        },

        OSS_DEV:        // 内网测试时候使用
            {
                bucket_img_url: 'rsc-dev.oss-cn-beijing.aliyuncs.com',
                bucket_img: 'rsc-dev'
            },

        company_category: {
            'TRADE': 'TRADE',
            'TRAFFIC': 'TRAFFIC'
        },

        index_collection: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'm', 'n', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
            '2', '3', '4', '5', '6', '7', '8', '9'],

        index_number: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],

        file_path: '/temp/',


        file_format: {
            'jpg': 'jpg',
            'jpeg': 'jpeg',
            'png': 'png'
        },
        file_size: 5 * 1024 * 1024,

        video_format: {
            'mp4': 'mp4'
        },
        video_size: 50 * 1024 * 1024,

        typeCode: {
            company_des: 'company_des',                          //编辑公司简介
            traffic_line: 'traffic_line',                       //物流线路报价
            traffic_demand: 'traffic_demand',                  //物流需求单
            traffic_driver_demand: 'traffic_driver_demand',  //司机需求单
            traffic_order_confirm: 'traffic_order_confirm', //物流确认接单
            trade_order_confirm_sale: 'trade_order_confirm_sale',     //销售确认交易订单
            trade_order_confirm_purchase: 'trade_order_confirm_purchase',     //采购确认交易订单
            trade_pricing: 'trade_pricing',                   //交易报价
            trade_demand: 'trade_demand'                      //交易需求单
        },

        listType: {
            'dj': 'dj',                               // 报价行情
            'jj': 'jj',                               // 竞价行情
            'demand': 'demand',                       // 采购行情
            'published':'published',                  // 已发布
            'shop':'shop',                            // 购物车
            'ineffective': 'ineffective',             // 待确认
            'effective': 'effective',                 // 运输中
            'complete': 'complete',                   // 完成
            'cancelled': 'cancelled',                 // 取消
            'cy':'cy',                                // 参与
            'expired':'expired'                       // 已结束
        },

        getAve: function (array) {
            var ave = 0;
            for (var i = 0; i < array.length; i++) {
                ave += array[i];
            }
            ave = ave / array.length;
            return ave;
        },


        //将毫秒数转化成x小时x分钟
        MillisecondToDate: function (msd) {
            var time = parseFloat(msd) / 1000;
            if (null != time && "" != time) {
                if (time > 60 && time < 60 * 60) {
                    time = parseInt(time / 60.0) + "分钟" + parseInt((parseFloat(time / 60.0) -
                            parseInt(time / 60.0)) * 60) + "秒";
                }
                else if (time >= 60 * 60 && time < 60 * 60 * 24) {
                    time = parseInt(time / 3600.0) + "小时" + parseInt((parseFloat(time / 3600.0) -
                            parseInt(time / 3600.0)) * 60) + "分钟" +
                        parseInt((parseFloat((parseFloat(time / 3600.0) - parseInt(time / 3600.0)) * 60) -
                            parseInt((parseFloat(time / 3600.0) - parseInt(time / 3600.0)) * 60)) * 60) + "秒";
                }
                else {
                    time = parseInt(time) + "秒";
                }
            }
            return time;
        },
        buy:{
            gangtie:'钢铁',
            kuangshi:'矿石',
            meijiao:'煤焦',
            zaishengziyuan:'再生资源'
        }
    };
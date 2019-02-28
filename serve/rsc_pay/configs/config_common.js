/**
 * Created by Administrator on 2015/11/6 0006.
 */
var _ = require('underscore');
var jwt = require('jsonwebtoken');
var decimal = require('decimal');

module.exports = {
    entry_per_page: 10,
    token_server_timeout: 10,
    secret_keys: {
        user: 'user',
        trade: 'trade',
        traffic: 'traffic',
        invite: 'invite',
        dynamic: 'dynamic',
        admin: 'admin',
        phone: 'phone',
        credit:'credit',
        pay:'pay'
    },

    sendData: function (req, data, next) {
        req.result = data;
        next('success');
    },
    sms_templates: {
        invite_colleague: 'invite_colleague',
        //invite_driver: 'invite_driver',
        invite_driver_publish: 'invite_driver_publish',
        invite_driver_private: 'invite_driver_private',

        //store_addr_change: 'store_addr_change',
        //trade_purchase_invite: 'trade_purchase_invite',
        // company_verify_complete: 'company_verify_complete',
        get_verify_code: 'get_verify_code'
    },
    // 自定义 加减乘除,add,sub,mul,div
    // 自定义 加减乘除,add,sub,mul,div
    rscDecimal: function(type, a, b, point){
        var c = 0, p = point || 3;

        switch (type){
            case 'add':
                a = !!a ? a.toString(): 0, b = !!b ? b.toString() : 0;
                c =  decimal(a.toString()).add(b.toString()).toNumber();
                break;
            case 'sub':
                a = !!a ? a.toString(): 0, b = !!b ? b.toString() : 0;
                c = decimal(a.toString()).sub(b.toString()).toNumber() || 0;
                break;
            case 'mul':
                if(a==0 || b==0){
                    c = 0
                }else{
                    a = !!a ? a.toString(): 1, b = !!b ? b.toString() : 1;
                    c =  decimal(a.toString()).mul(b.toString()).toNumber();
                }

                break;
            case "div":
                a = !!a ? a.toString(): 1, b = !!b ? b.toString() : 1;
                c =  decimal(a.toString()).div(b.toString()).toNumber();
                break;
            default:
                return c;
        }
        return point == 0 ? c :  !c ? '0' : c.toFixed(p);//parseFloat(c.toFixed(p));
    }
};
/**
 * Created by Administrator on 2017/6/30.
 */
var async = require('async');
var express = require('express');
module.exports = function() {
    var api = express.Router();

    api.use(require('../../middlewares/mid_verify_user')());

    api.post('/notice_create_company',function(req, res, next) {
        if(!req.body.user_id){
            return next('invalid_format');
        }
        async.waterfall([
            function(cb){
                global.lib_user.getOne({find: {_id: req.body.user_id}}, cb);
            },
            function (user, cb) {
                if(global.config_common.checkUserCompany(user)){
                    return cb();
                }else{
                    global.lib_http.sendMsgServerNoToken({
                        send_id: req.decoded.id,
                        receive_id: req.body.user_id,
                        content: JSON.stringify([req.decoded.user_name]),
                        template_id: global.config_common.msg_templates.create_company
                    }, global.config_api_url.msg_server_add_message);
                    cb();
                }
            }
        ], function (err) {
            if(err){
                return next(err);
            }
            global.config_common.sendData(req, {}, next);
        });
    });

    return api;
};
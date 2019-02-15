/**
 * Created by Administrator on 2018\3\24 0024.
 */
var async = require('async');
var lib_im_err = require('../libs/lib_im_err');
var lib_user = require('../libs/lib_user');
var sdk_im_wangyiyunxin = require('../sdks/im_wangyiyunxin/sdk_im_wangyiyunxin');
var config_common = require('../configs/config_common');

exports.checkIm = function () {
    async.waterfall([
        function (cb) {
            lib_im_err.getList({find: {}}, cb);
        },
        function (data, cb) {
            async.eachSeries(data, function (oneData, callback) {
                async.waterfall([
                    function (cbk) {
                        lib_user.getOne({find: {_id: oneData.user_id}}, cbk);
                    },
                    function (user, cbk) {
                        if (user) {
                            sdk_im_wangyiyunxin.createUser({
                                accid: user._id.toString(),
                                name: user.real_name,
                                icon: user.photo_url,
                                token: config_common.yunXin_token
                            }, function (err, imData) {
                                if (err) {
                                    lib_im_err.add({user_id: user._id.toString(), err: err}, function () {
                                    });
                                }
                                oneData.remove(cb);
                            });
                        } else {
                            cb();
                        }

                    }
                ], callback)
            }, cb)
        }
    ], function (err) {
        if (err) return err;
        // console.log('checkIm' + new Date().toDateString());
    })
};
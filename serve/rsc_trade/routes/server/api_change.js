/**
 * Created by Administrator on 2018/3/10/010.
 */
var async = require('async');
var config_common = global.config_common;
var config_error = global.config_error;

module.exports = function (app, express) {

    var api = express.Router();
    // 拦截非授权请求
    api.use(require('../../middlewares/mid_verify_server')());

    api.post('/change', function (req, res, next) {
        if (!req.body.user_id) {
            return next('invalid_format');
        }
        async.waterfall([
            function(cb){
                global.lib_PriceOffer.onlyList({find: {user_id: req.body.user_id}}, cb);
            },
            function(PriceOffer,cb){
                if(PriceOffer){
                    for(var i=0;i<PriceOffer.length;i++){
                        PriceOffer[i].status='expired';
                        PriceOffer[i].save();
                    }
                }
                global.lib_Demand.getList({find: {user_id: req.body.user_id}}, cb);
            }
        ],function(err,result){
            if (err) {
                return next(err);
            }
            if(result){
                for (var j=0;j<result.length;j++){
                    console.log('0000000000');
                    result[j].status='expired';
                    result[j].save();
                }

            }
            config_common.sendData(req, result, next);
        });
    });


    api.post('/get_layer', function (req, res, next) {
        async.waterfall([
            function(cbk1){
                global.lib_PriceOffer.getOne({
                    find:{_id:req.body.id}
                },cbk1);
            },
            function(data,cbk1){
                var layer=data.product_categories[0].layer;
                var str = '';
                var arr = [];
                for (var i = 0; i < _.keys(layer).length; i++) {
                    var index = _.keys(layer)[i];
                    index = index.replace('_chn', '').toString();
                    arr[index.split('_')[1] - 1] = layer[index+'_chn'] + ';';
                }
                //keys顺序会变，从一级分类开始整理
                for (var j = 0; j < arr.length; j++) {
                    str += arr[j];
                }
                str = str.substr(0, str.length - 1);
                var last_layer=str.split(';')[str.split(';').length-1];
                var last_layer_new=last_layer+'-'+data.product_categories[0].product_name[0].name+'等';
                cbk1(null,last_layer_new);
            }
        ],function(err,result){
            config_common.sendData(req, result, next);
        });
    });

    return api;
};

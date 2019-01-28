/**
 * Created by Administrator on 2015/11/16.
 */
var config_server = require('../configs/config_server');
module.exports = function(){
    return function(req, res, next){
        if(req.body && req.body.serverTransData){
            req.body = JSON.parse(req.body.serverTransData);
        }
        if(config_server.env == 'dev'){
            next();
        }else{
            next();
        }
    }
};

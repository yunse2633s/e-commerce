/**
 * Created by Administrator on 2015/11/16.
 */
var _ = require('underscore');
var config_server = require('../configs/config_server');
var config_error = require('../configs/config_error');
module.exports = function(){
    return function (err, req, res, next){
        var data;
        if(err == 'success'){
            data = ({status: 'success', data: req.result});
        }else if(err == 'wait_for_approval'){
            data = ({status: err});
        } else{
            // data = process.env.node_env == 'pro' ?  _.extend({status: 'err'}, config_error[err['pro']])  : {status: 'err', msg: err['dev']} ;
            data = {status: 'err', msg: err['dev']};
        }
        data.share = !req.headers['x-access-token'];
        if(process.env.node_env != 'pro'){
            console.log(
                '==========================receive==========================',new Date().toLocaleString(),'\n',
                JSON.stringify(req.body),
                '\n===========================token===========================\n',
                req.decoded,
                '\n===========================send============================\n',
                JSON.stringify(data)
            );
        }
        res.send(data);
    }
};

/**
 * Created by Administrator on 2015/11/16.
 */
var config_error = require('../configs/config_error');
var config_server = require('../configs/config_server');

module.exports = function(){
    return function (err, req, res, next){
        var data;
        if(err == 'success'){
            data = ({status: 'success', data: req.result});
        }else if(err.stack){
            console.error(err.stack);
            data = ({status: 'err', msg: '服务器报错'});
        }else{
            data = ({status: 'err', msg: config_error[err] || err});
        }
        if(config_server.env != 'pro'){
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
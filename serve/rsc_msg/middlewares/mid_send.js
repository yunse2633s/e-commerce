/**
 * Created by Administrator on 2015/11/16.
 */
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
            data = ({status: 'err', msg: err});
        }
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
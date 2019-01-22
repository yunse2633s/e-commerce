/**
 * Created by Administrator on 2015/11/16.
 */
var config_server = require('../configs/config_server');
var config_error = require('../configs/config_error');
module.exports = function () {
    return function (err, req, res, next) {
        var data;
        if (err === 'success') {
            data = ({status: 'success', data: req.result});
        } else if (err.stack) {
            console.log(err.stack);
            data = ({status: 'err', msg: {content: err, code: config_error.unknown_err}});
        } else {
            data = ({status: 'err', msg: err});
        }
        //判断是否真正登录
        data.share = !req.headers['x-access-token'];
        if (process.env.node_env !== 'pro') {
            console.log(
                '==========================receive==========================', new Date().toLocaleString(), '\n',
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
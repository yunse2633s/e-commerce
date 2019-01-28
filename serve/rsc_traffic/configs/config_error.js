/**
 * 错误编码 6位 000000
 * 前2位：与表或api文件相关; 单据：目前6个，公用:00
 *  demand:10,offer:11,order:12, plan: 13,
    driverDemand:20, driverOffer:21, driverOrder:22, driverPlan: 23
    line: 30

    中间2位：增删改查:  增加:01, 删: 02, 改: 03, 查: 04 ,非这4种可以特殊定义，也可依据接口的顺序

    后2位：单个方法中的错误. 序号采用递增排序;
    统一错误码之后，如何纠错;

 */
var server_error = {
    //公共错误
    '000000': {msg: 'no_token', desc:'没有登陆', code: '000000'},
    '000001': {msg: 'auth_failed', desc:'登陆超时', code: '000001'},
    '000002': {msg: 'not_allow', desc:'权限不足', code: '000002'},
    '000003': {msg: 'invalid_format', desc:'参数错误', code: '000003'},
    '000004': {msg: 'not_found', desc:'没找到相关数据', code: '000004'},
    '000005':{msg: 'create_failed', desc: '操作失败',  code: '000005'},
    '000006': {msg:'not_enough', desc: '货源不足',  code: '000006'},
    '000007': {msg:'repeat_handle', desc: '重复操作',  code: '000007'},
    //私有错误  增加:01, 删: 02, 改: 03, 查: 04
    '100401': {msg: '', desc: '没有认证关系', code: '100401'},
    '100402': {msg: '', desc: '', code: '100402'},
};

module.exports = server_error;
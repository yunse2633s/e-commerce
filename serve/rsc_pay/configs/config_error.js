/**
 * Created by Administrator on 2017/4/10.
 */
module.exports = {
    no_token:           '无秘钥',
    jwt_expired:        '登录超时',
    auth_failed_user:   '用户认证失败',
    auth_failed_server: '服务器认证失败',
    invalid_format:     '无效参数',
    not_allow:          '不允许',
    unknown:            '未知错误',


    EXCEED_LIMIT_SM_MIN_AMOUNT:'单笔最低转账金额0.1元',
    INVALID_PARAMETER:         '参数有误',
    SYSTEM_ERROR:              '系统繁忙',
    PERMIT_CHECK_PERM_LIMITED: '根据监管部门的要求，请补全您的身份信息解除限制',
    PAYCARD_UNABLE_PAYMENT:    '付款账户余额支付功能不可用',
    PAYEE_NOT_EXIST:           '收款账号不存在',
    PAYER_DATA_INCOMPLETE:     '根据监管部门的要求，需要付款用户补充身份信息才能继续操作',
    PERM_AML_NOT_REALNAME_REV: '根据监管部门的要求，需要收款用户补充身份信息才能继续操作',
    PAYER_STATUS_ERROR:        '付款账号状态异常',
    PAYEE_USER_INFO_ERROR:     '支付宝账号和姓名不匹配，请确认姓名是否正确',
    PAYER_USER_INFO_ERROR:     '付款用户姓名或其它信息不一致',
    PAYER_BALANCE_NOT_ENOUGH:  '系统维护中，请稍后再试',//'付款方余额不足',
    PAYMENT_INFO_INCONSISTENCY:'两次请求商户单号一样，但是参数不一致',
    CERT_MISS_TRANS_LIMIT:     '您的付款金额已达单笔1万元或月累计5万元，根据监管部门的要求，需要付款用户补充身份信息才能继续操作',
    CERT_MISS_ACC_LIMIT:       '您连续10天余额账户的资金都超过5000元，根据监管部门的要求，需要付款用户补充身份信息才能继续操作',
    PAYEE_ACC_OCUPIED:         '该手机号对应多个支付宝账户，请传入收款方姓名确定正确的收款账号',
    MEMO_REQUIRED_IN_TRANSFER_ERROR: '根据监管部门的要求，单笔转账金额达到50000元时，需要填写付款理由',
    PERMIT_NON_BANK_LIMIT_PAYEE:'根据监管部门的要求，对方未完善身份信息或未开立余额账户，无法收款',
    PERMIT_PAYER_LOWEST_FORBIDDEN:'根据监管部门要求，付款方身份信息完整程度较低，余额支付额度受限',
    PERMIT_PAYER_FORBIDDEN:     '根据监管部门要求，付款方余额支付额度受限',
    PERMIT_CHECK_PERM_IDENTITY_THEFT:'您的账户存在身份冒用风险，请进行身份核实解除限制',
    REMARK_HAS_SENSITIVE_WORD:  '转账备注包含敏感词，请修改备注文案后重试',
    ACCOUNT_NOT_EXIST:          '根据监管部门的要求，请补全你的身份信息，开立余额账户',
    PAYER_CERT_EXPIRED:         '根据监管部门的要求，需要付款用户更新身份信息才能继续操作',
    EXCEED_LIMIT_PERSONAL_SM_AMOUNT:'转账给个人支付宝账户单笔最多5万元',
    EXCEED_LIMIT_ENT_SM_AMOUNT:  '转账给企业支付宝账户单笔最多10万元',
    EXCEED_LIMIT_DM_MAX_AMOUNT:  '单日最多可转100万元',
    EXCEED_LIMIT_UNRN_DM_AMOUNT: '收款账户未实名，单日最多可收款1000元',

    NOT_ENOUGH:                  '余额不足'

    // call_customer_service:       '系统维护中，请稍后再试'
};
/**
 * Created by Administrator on 2017/5/19.
 */
var sdk_im_huanxin = require('../sdks/im_huanxin/sdk_im_huanxin');
//查询的时间格式为10位数字形式(YYYYMMDDHH),例如要查询2016年12月10号7点到8点的历史记录，则需要输入2016121007,7:00:00的信息也会包含在这个文件里
sdk_im_huanxin.getChatMessages('2017051815');
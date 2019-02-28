var client = require('./../client');
function ChatHistory() {
    //Get chat history
    // this.getChatMessages = function (ql, limit, cursor, callback) {
    //     client.client({
    //         path: 'chatmessages',
    //         method: 'GET',
    //         query: {'ql':ql, 'limit':limit, 'cursor':cursor},
    //         headers: {},
    //         callback: function (data) {
    //             console.log(data);
    //             typeof callback == 'function' && callback(data);
    //         }
    //     });
    // };

    //查询的时间格式为10位数字形式(YYYYMMDDHH),例如要查询2016年12月10号7点到8点的历史记录，则需要输入2016121007,7:00:00的信息也会包含在这个文件里
    this.getChatMessages = function (time, callback) {
        client.client({
            path: 'chatmessages/'+time,
            method: 'GET',
            // query: {'ql':ql, 'limit':limit, 'cursor':cursor},
            // headers: {},
            callback: function (data) {
                console.log(data);
                typeof callback == 'function' && callback(data);
            }
        });
    };
}
module.exports = ChatHistory;

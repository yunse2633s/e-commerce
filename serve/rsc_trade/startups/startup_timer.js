/**
 * Created by Administrator on 2017/4/9.
 */
var fs = require('fs');


module.exports = function () {

    var fileArr = fs.readdirSync(__dirname.replace('startups', 'timers'));
    for (var k = 0; k < fileArr.length; k++) {
        var fileName = fileArr[k];
        fileName = fileName.split('.')[0];
        if (fileName) require('../timers/' + fileName).timer();
    }
    console.log(new Date().toString() + ' ok! ' + __filename.split('/').pop());
};
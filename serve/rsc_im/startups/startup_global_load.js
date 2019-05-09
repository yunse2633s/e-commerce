/**
 * Created by Administrator on 2017/4/17.
 */
var fs = require('fs');

module.exports = function () {
    var fileArr = fs.readdirSync(__dirname.replace('startups', 'configs'));
    for (var j = 0; j < fileArr.length; j++) {
        fileName = fileArr[j];
        fileName = fileName.split('.')[0];
        if (fileName) global[fileName] = require('../configs/' + fileName);
    }
    fileArr = fs.readdirSync(__dirname.replace('startups', 'libs'));
    for (var i = 0; i < fileArr.length; i++) {
        var fileName = fileArr[i];
        fileName = fileName.split('.')[0];
        if (fileName) global[fileName] = require('../libs/' + fileName);
    }

    console.log(new Date().toString() + ' ok! ' + __filename.split('/').pop());
};

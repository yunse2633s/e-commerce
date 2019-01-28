/**
 * Created by Administrator on 2018/1/2.
 */
var fs = require('fs');
var _ = require('underscore');
module.exports = function () {
    var fileArr = fs.readdirSync(__dirname.replace('startups', 'configs'));
    var fileName;
    //config配置文件
    for(var j = 0; j < fileArr.length; j++){
        fileName = fileArr[j];
        fileName = fileName.split('.')[0];
        if(fileName){
            global[fileName] = require('../configs/' + fileName);
        }

    }
    //lib 文件
    fileArr = fs.readdirSync(__dirname.replace('startups', 'lib'));
    for(var i = 0; i < fileArr.length; i++){
        fileName = fileArr[i];
        fileName = fileName.split('.')[0];
        if(fileName){
            global[fileName] = require('../lib/' + fileName);
        }
    }
    //定时执行
    // fileArr = fs.readdirSync(__dirname.replace('startups', 'timers'));
    // for(var k = 0; k < fileArr.length; k++){
    //     fileName = fileArr[k];
    //     fileName = fileName.split('.')[0];
    //     if(fileName){
    //         global[fileName] = require('../timers/' + fileName);
    //     }
    // }

};
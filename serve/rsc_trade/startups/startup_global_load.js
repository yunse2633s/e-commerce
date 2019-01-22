/**
 * Created by Administrator on 2017/4/13.
 */
var fs = require('fs');
var _ = require('underscore');

module.exports = function(){

    var fileArr = fs.readdirSync(__dirname.replace('startups', 'configs'));
    var fileName;
    for(var j = 0; j < fileArr.length; j++){
        fileName = fileArr[j];
        fileName = fileName.split('.')[0];
        if(fileName) global[fileName] = require('../configs/'+fileName);
    }
    fileArr = fs.readdirSync(__dirname.replace('startups', 'libs'));
    for(var i = 0; i < fileArr.length; i++){
        fileName = fileArr[i];
        fileName = fileName.split('.')[0];
        if(fileName) global[fileName] = require('../libs/'+fileName);
    }
    fileArr = fs.readdirSync(__dirname.replace('startups', 'timers'));
    for(var k = 0; k < fileArr.length; k++){
        fileName = fileArr[k];
        fileName = fileName.split('.')[0];
        if(fileName) global[fileName] = require('../timers/'+fileName);
    }
    console.log(new Date().toString() + ' ok! ' + __filename.split('/').pop());
};

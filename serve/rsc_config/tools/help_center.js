var fs = require('fs');

var urlBase = 'http://60.205.146.53:4000/help_center';

function getPictureUrlTradeAdmin(dirPath, data){
    if(!data){
        data = {};
    }
    var arr = fs.readdirSync(dirPath);
    for(var i = 0; i < arr.length; i++){
        var stat = fs.lstatSync(dirPath+'/'+arr[i]);
        if(stat.isDirectory()){
            getPictureUrlTradeAdmin(dirPath+'/'+arr[i], data);
        }else{
            var newKey = dirPath.split('/')[dirPath.split('/').length-1];
            if(!data[newKey]){
                data[newKey] = {};
            }
            if(!data[newKey].title){
                if(arr[i].lastIndexOf('sell-pro') >= 0){
                    data[newKey].title = '抢单流程';
                }else if(arr[i].lastIndexOf('rob-pro') >= 0){
                    data[newKey].title = '抢单流程';
                }else if(arr[i].lastIndexOf('ask-pro') >= 0){
                    data[newKey].title = '报价流程';
                }else if(arr[i].lastIndexOf('pro') >= 0){
                    data[newKey].title = '发布流程';
                }else if(arr[i].lastIndexOf('exp') >= 0){
                    data[newKey].title = '填写说明';
                }else if(dirPath.lastIndexOf('ask-price') >= 0){
                    data[newKey].title = '询价报价';
                }else if(dirPath.lastIndexOf('cmp-share') >= 0){
                    data[newKey].title = '企业名片分享';
                }else if(dirPath.lastIndexOf('use-share') >= 0){
                    data[newKey].title = '个人名片分享';
                }
            }
            if(!data[newKey].arr){
                data[newKey].arr = [];
            }
            data[newKey].arr.push({url:urlBase + dirPath.substr(1) + '/' + arr[i]});
        }
    }
    return data;
}

function getPictureUrlTrafficAdmin(dirPath, data){
    if(!data){
        data = {};
    }
    var arr = fs.readdirSync(dirPath);
    for(var i = 0; i < arr.length; i++){
        var stat = fs.lstatSync(dirPath+'/'+arr[i]);
        if(stat.isDirectory()){
            getPictureUrlTrafficAdmin(dirPath+'/'+arr[i], data);
        }else{
            var newKey = dirPath.split('/')[dirPath.split('/').length-1];
            if(!data[newKey]){
                data[newKey] = {};
            }
            if(!data[newKey].title){
                if(arr[i].lastIndexOf('ask-pro') >= 0){
                    data[newKey].title = '报价流程';
                }else if(arr[i].lastIndexOf('grab-pro') >= 0){
                    data[newKey].title = '抢单流程';
                }else if(arr[i].lastIndexOf('pro') >= 0){
                    data[newKey].title = '发布流程';
                }else if(arr[i].lastIndexOf('exp') >= 0){
                    data[newKey].title = '填写说明';
                }else if(dirPath.lastIndexOf('cmp-share') >= 0){
                    data[newKey].title = '企业名片分享';
                }else if(dirPath.lastIndexOf('use-share') >= 0){
                    data[newKey].title = '个人名片分享';
                }
            }
            if(!data[newKey].arr){
                data[newKey].arr = [];
            }
            data[newKey].arr.push({url:urlBase + dirPath.substr(1) + '/' + arr[i]});
        }
    }
    return data;
}

function getPictureUrlTrafficPrivateDriver(dirPath, data){
    if(!data){
        data = {};
    }
    var arr = fs.readdirSync(dirPath);
    for(var i = 0; i < arr.length; i++){
        var stat = fs.lstatSync(dirPath+'/'+arr[i]);
        if(stat.isDirectory()){
            getPictureUrlTrafficPrivateDriver(dirPath+'/'+arr[i], data);
        }else{
            var newKey = dirPath.split('/')[dirPath.split('/').length-1];
            if(!data[newKey]){
                data[newKey] = {};
            }
            if(!data[newKey].title){
                if(arr[i].lastIndexOf('goods-grab') >= 0){
                    data[newKey].title = '货源推荐抢单';
                }else if(arr[i].lastIndexOf('use-share') >= 0){
                    data[newKey].title = '名片分享';
                }else if(arr[i].lastIndexOf('how-grab') >= 0){
                    data[newKey].title = '如何抢单';
                }else if(arr[i].lastIndexOf('how-cer-grab') >= 0){
                    data[newKey].title = '如何认证抢单';
                }else if(arr[i].lastIndexOf('get-money') >= 0){
                    data[newKey].title = '如何收款';
                }
            }
            if(!data[newKey].arr){
                data[newKey].arr = [];
            }
            data[newKey].arr.push({url:urlBase + dirPath.substr(1) + '/' + arr[i]});
        }
    }
    return data;
}

function getPictureUrlTrafficPublicDriver(dirPath, data){
    if(!data){
        data = {};
    }
    var arr = fs.readdirSync(dirPath);
    for(var i = 0; i < arr.length; i++){
        var stat = fs.lstatSync(dirPath+'/'+arr[i]);
        if(stat.isDirectory()){
            getPictureUrlTrafficPublicDriver(dirPath+'/'+arr[i], data);
        }else{
            var newKey = dirPath.split('/')[dirPath.split('/').length-1];
            if(!data[newKey]){
                data[newKey] = {};
            }
            if(!data[newKey].title){
                if(dirPath.lastIndexOf('list-order') >= 0){
                    data[newKey].title = '订单列表接单';
                }else if(dirPath.lastIndexOf('systerm-order') >= 0){
                    data[newKey].title = '系统消息接单';
                }else if(dirPath.lastIndexOf('cmp-share') >= 0){
                    data[newKey].title = '企业名片分享';
                }else if(dirPath.lastIndexOf('use-share') >= 0){
                    data[newKey].title = '个人名片分享';
                }
            }
            if(!data[newKey].arr){
                data[newKey].arr = [];
            }
            data[newKey].arr.push({url:urlBase + dirPath.substr(1) + '/' + arr[i]});
        }
    }
    return data;
}

//交易管理员
console.log(JSON.stringify(getPictureUrlTradeAdmin('./trade_admin')));
console.log((getPictureUrlTradeAdmin('./trade_admin')));

//物流管理员
//console.log(JSON.stringify(getPictureUrlTrafficAdmin('./traffic_admin')));
//console.log((getPictureUrlTrafficAdmin('./traffic_admin')));

//挂靠司机
//console.log(JSON.stringify(getPictureUrlTrafficPrivateDriver('./traffic_private_driver')));
//console.log((getPictureUrlTrafficPrivateDriver('./traffic_private_driver')));

//自有司机
//console.log(JSON.stringify(getPictureUrlTrafficPublicDriver('./traffic_public_driver')));
//console.log((getPictureUrlTrafficPublicDriver('./traffic_public_driver')));

//采购
//console.log(JSON.stringify(getPictureUrlTradeAdmin('./trade_purchase')));
//console.log((getPictureUrlTradeAdmin('./trade_purchase')));

//销售
//console.log(JSON.stringify(getPictureUrlTradeAdmin('./trade_sale')));
//console.log((getPictureUrlTradeAdmin('./trade_sale')));
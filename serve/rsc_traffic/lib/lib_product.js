/**
 * Created by Administrator on 2018/2/7/007.
 */
var async = require('async');

exports.product=function(argument1,argument2,callback){
    async.eachSeries(argument1,function(data1,cb1){
        async.eachSeries(argument2,function(data2,cb2){
            if(data1.material==data2.material &&
                data1.layer_1==data2.layer_1 &&
                data1.layer_2==data2.layer_2 &&
                data1.layer_3==data2.layer_3 &&
                data1.layer_4==data2.layer_4){
                async.eachSeries(data1.product_name,function(data3,cb3){
                    async.eachSeries(data2.product_name,function(data4,cb4){
                        if(data3.name==data4.name){
                            data3.number+=data4.number;
                            cb4();
                        }else {
                            data1.product_name.push(data4);
                            cb4();
                        }
                    },function(err){
                        if(err){
                            console.log(err);
                        }
                        cb3();
                    });
                },function(err){
                    if(err){
                        console.log(err);
                    }
                    cb2();
                });
            }else{
                argument1.push(data2);
                cb1();
            }
        },function(err){
            if(err){
                console.log(err);
            }
            cb1();
        });
    },function(err){
        if(err){
            console.log(err);
        }
        callback(null,argument1);
    });
};
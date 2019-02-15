/**
 * Created by Administrator on 17/5/5.
 */
var async = require('async');

exports.get = function (req, callback) {
    var result = {};
    var query = {types: req.body.types};
    var cond = {type: global.config_common.relation_type.ACCEPT};
    var con = {type: global.config_common.relation_type.ACCEPT};
    if (req.body.user_ids) {
        query.user_ids = req.body.user_ids;
    } else {
        query.company_ids = req.body.company_ids;
    }
    async.waterfall([
        function (cb) {
            global.lib_http.sendTradeServer(query, global.config_api_url.trade_server_get_count, cb);
        },
        function (data, cb) {
            for (var index in data) {
                if (data.hasOwnProperty(index)) {
                    result[index] = data[index];
                }
            }
            global.lib_http.sendTrafficServer(query, global.config_api_url.traffic_server_get_count, cb);
        },
        function (data, cb) {
            for (var index in data) {
                for (var index1 in result) {
                    if (data.hasOwnProperty(index) && index1 === index) {
                        for (var index2 in data[index]) {
                            if (data[index].hasOwnProperty(index2)) {
                                result[index1][index2] = data[index][index2];
                            }
                        }
                    }
                }
            }
            async.eachSeries(req.body.company_ids ? req.body.company_ids : req.body.user_ids, function (id, callback) {
                if (req.body.user_ids) {
                    cond.self_user_id = id;
                    con.other_user_id = id;
                } else {
                    cond.self_id = id;
                    con.other_id = id;
                }
                var obj = {};
                async.eachSeries(req.body.types, function (type, cbk) {
                    switch (type) {
                        case 'company_sale' : {
                            async.waterfall([
                                function (callback) {
                                    global.lib_company_relation.getCount(cond, callback);
                                },
                                function (count, callback) {
                                    obj[type] = count;
                                    callback();
                                }
                            ], cbk);

                            break;
                        }
                        case 'company_purchase' : {
                            async.waterfall([
                                function (callback) {
                                    global.lib_company_relation.getCount(con, callback);
                                },
                                function (count, callback) {
                                    obj[type] = count;
                                    callback();
                                }
                            ], cbk);
                            break;
                        }
                        default:
                            cbk();
                            break;
                    }
                }, function (err) {
                    if (err) return cb(err);
                    for (var index in result) {
                        if (index === id) {
                            for (var index1 in obj) {
                                if (obj.hasOwnProperty(index1)) {
                                    result[index][index1] = obj[index1];
                                }
                            }
                        }
                    }
                    callback();
                });
            }, cb);
        }
    ], function (err) {
        if (err) {
            return callback(err);
        }
        callback(null, result);
    });
};
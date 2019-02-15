/**
 * Created by Administrator on 17/4/24.
 */

var async = require('async');
var _ = require('underscore');
var express = require('express');
var request = require('request');

var http = require('../../libs/lib_http');
var util = require('../../libs/lib_util');

var User_trade = require('../../models/User_trade');
var Company_trade = require('../../models/Company_trade');

var lib_user = global.lib_user;
// var lib_user_invitation_phone = global.lib_user_invitation_phone;
var config_common = global.config_common;
var config_api_url = global.config_api_url;
var config_server = global.config_server;
var lib_company_relation = global.lib_company_relation;
var lib_company = global.lib_company;
var lib_invitation_user = global.lib_invitation_user;


module.exports = function () {

    var api = express.Router();

    api.use(require('../../middlewares/mid_verify_user')());

    //除司机角色外的联系人界面
    api.post('/get_linkman', function (req, res, next) {
        if (req.decoded.role === global.config_common.user_roles.TRAFFIC_DRIVER_PRIVATE) {
            return next('not_allow');
        }
        async.parallel({
            COLLEAGUE: function (cb) {
                var list = [];
                var count = 0;
                var userData1;
                var hanZi;
                async.waterfall([
                    function (cbk) {
                        global.lib_user.getOne({find: {_id: req.decoded.id}}, cbk);
                    },
                    function (user_w, cbk) {
                        req.decoded.company_id = user_w.company_id;
                        cbk();
                    },
                    function (cbk) {
                        global.lib_http.sendTradeServer({
                            method: 'getList',
                            cond: {find: {lev: 0}},
                            model: 'Classify'
                        }, global.config_api_url.trade_server_get_hanzi, cbk);
                    },
                    function (pei_zhi, cbk) {
                        hanZi = _.indexBy(pei_zhi, 'eng');
                        var cond = {};
                        if (req.decoded.role === global.config_common.user_roles.TRAFFIC_ADMIN || req.decoded.role === global.config_common.user_roles.TRADE_STORAGE) {
                            cond.find = {};
                            cond.find['$or'] = [];
                            if (req.decoded.role === global.config_common.user_roles.TRADE_STORAGE) {
                                cond.find['$or'].push({
                                    company_id: req.decoded.company_id
                                });
                            } else {
                                cond.find['$or'].push({
                                    company_id: req.decoded.company_id[0],
                                    role: {$in: [global.config_common.user_roles.TRAFFIC_ADMIN, global.config_common.user_roles.TRADE_STORAGE]}
                                });
                            }
                            //同事屏蔽司机
                            // global.lib_driver_verify.getList({
                            //     find: {
                            //         approve_id: req.decoded.id,
                            //         status: global.config_common.verification_phase.SUCCESS
                            //     },
                            //     select: 'user_id'
                            // }, function (err, verifies) {
                            //     if (err) {
                            //         return cb(err);
                            //     }
                            //     var user_ids = _.pluck(verifies, 'user_id');
                            //     cond.find['$or'].push({_id: {$in: user_ids}});
                            if (req.decoded.role === global.config_common.user_roles.TRADE_STORAGE) {
                                if (req.decoded.company_id) {
                                    lib_user.getListAll(cond, cbk);
                                } else {
                                    cbk(null, []);
                                }
                            } else {

                                lib_user.getListAll(cond, cbk);
                            }
                        } else {
                            if (req.decoded.company_id) {
                                cond = {find: {company_id: req.decoded.company_id}};
                                lib_user.getListAll(cond, cbk);
                            } else {
                                cbk(null, []);
                            }
                        }
                    },
                    function (data, cbk) {
                        count = data.length;
                        userData1 = data;
                        lib_company.getList({
                            find: {_id: {$in: _.compact(_.flatten(_.pluck(data, 'company_id')))}},
                            select: 'verify_phase'
                        }, cbk)
                    },
                    function (company, cbk) {
                        var companyObj = global.lib_util.transObjArrToObj(company, '_id');
                        for (var i = 0; i < userData1.length; i++) {
                            if (_.isArray(userData1[i])) {
                                userData1[i].verify_phase = companyObj[userData1[i].company_id[0]].verify_phase || "";
                            } else {
                                if (companyObj[userData1[i].company_id]) {
                                    userData1[i].verify_phase = companyObj[userData1[i].company_id].verify_phase || "";
                                } else {
                                    userData1[i].verify_phase = "";
                                }
                            }
                        }
                        async.eachSeries(userData1, function (user, callback) {
                            (function (user) {
                                // if (user.role != global.config_common.user_roles.TRADE_STORAGE) {
                                var obj = {
                                    _id: user._id.toString(),
                                    status: true,
                                    name: user.real_name,
                                    role: user.role,
                                    img: user.photo_url,
                                    phone: user.phone,
                                    verify_phase: user.verify_phase,
                                    post: user.post,
                                    sell: _.map(user.sell, function (num) {
                                        return hanZi[num].chn;
                                    }),
                                    buy: _.map(user.buy, function (num) {
                                        return hanZi[num].chn;
                                    }),
                                    transport: _.map(user.transport, function (num) {
                                        return hanZi[num].chn;
                                    })
                                };
                                list.push(obj);
                                // }
                            })(user);
                            callback();
                        }, cbk);
                    },
                    function (cbk) {
                        // if(req.decoded.role == global.config_common.user_roles.TRAFFIC_ADMIN ||
                        //     req.decoded.role == global.config_common.user_roles.TRADE_ADMIN){
                        lib_invitation_user.getList({
                            find: {
                                company_id: req.decoded.company_id,
                                user_id: req.decoded.id,
                                type: global.config_common.relation_style.COMPANY_INVITE,
                                status: 'PROCESSING'
                            }
                        }, cbk);
                        // }else{
                        //     cbk(null, []);
                        // }
                    },
                    function (result, cbk) {

                        count += result.length;
                        async.eachSeries(result, function (user, callback) {
                            (function (user) {
                                // if (user.role != global.config_common.user_roles.TRADE_STORAGE) {
                                var obj = {
                                    _id: user._id.toString(),
                                    status: false,
                                    name: user.real_name,
                                    role: user.role,
                                    phone: user.phone,
                                    post: user.post,
                                    sell: user.sell,
                                    buy: user.buy,
                                    transport: user.transport
                                };
                                list.push(obj);
                                // }
                            })(user);
                            callback();
                        }, cbk);
                    },
                    function (cbk) {
                        cbk(null, {
                            list: list,
                            count: count
                        });
                    }
                ], cb);
            },
            DRIVER: function (cb) {
                var list = [];
                var count = 0;
                var userData1;
                var hanZi;
                async.waterfall([
                    function (cbk) {
                        global.lib_user.getOne({find: {_id: req.decoded.id}}, cbk);
                    },
                    function (user_w, cbk) {
                        req.decoded.company_id = user_w.company_id;
                        cbk();
                    },
                    function (cbk) {
                        global.lib_http.sendTradeServer({
                            method: 'getList',
                            cond: {find: {lev: 0}},
                            model: 'Classify'
                        }, global.config_api_url.trade_server_get_hanzi, cbk);
                    },
                    function (pei_zhi, cbk) {
                        hanZi = _.indexBy(pei_zhi, 'eng');
                        cbk();
                    },
                    function (cbk) {
                        if (req.decoded.role === global.config_common.user_roles.TRAFFIC_ADMIN) {
                            //先查询自己的挂靠司机的关系，然后再查询到挂靠司机
                            global.lib_driver_verify.getList({
                                find: {
                                    company_id: req.decoded.company_id[0],
                                    approve_id: req.decoded.id
                                },
                                select: 'user_id transport'
                            }, function (err, verifies) {
                                if (err) {
                                    return cb(err);
                                }
                                var cond = {find: {}};
                                var user_ids = _.pluck(verifies, 'user_id');
                                cond.find = {_id: {$in: user_ids}};
                                lib_user.getList(cond, cbk);
                            });
                        } else {
                            cbk(null, []);
                        }
                    },
                    function (data, cbk) {
                        count = data.length;
                        userData1 = data;
                        async.eachSeries(userData1, function (user, callback) {
                            (function (user) {
                                var obj = {
                                    _id: user._id.toString(),
                                    status: true,
                                    name: user.real_name,
                                    role: user.role,
                                    img: user.photo_url,
                                    phone: user.phone,
                                    transport: _.map(user.transport, function (num) {
                                        return hanZi[num] ? hanZi[num].chn : '';
                                    })
                                };
                                list.push(obj);
                            })(user);
                            callback();
                        }, cbk);
                    },
                    function (cbk) {
                        cbk(null, {
                            list: list,
                            count: count
                        });
                    }
                ], cb);
            },
            // STORAGE: function (cb) {
            //     var list = [];
            //     var count = 0;
            //     var userData1;
            //     async.waterfall([
            //         function (cbk) {
            //             var cond = {};
            //             if (req.decoded.role == global.config_common.user_roles.TRAFFIC_ADMIN) {
            //                 cond.find = {};
            //                 cond.find['$or'] = [];
            //                 cond.find['$or'].push({
            //                     company_id: req.decoded.company_id[0],
            //                     role: global.config_common.user_roles.TRAFFIC_ADMIN
            //                 });
            //                 global.lib_driver_verify.getList({
            //                     find: {
            //                         approve_id: req.decoded.id,
            //                         status: global.config_common.verification_phase.SUCCESS
            //                     },
            //                     select: 'user_id'
            //                 }, function (err, verifies) {
            //                     if (err) {
            //                         return cb(err);
            //                     }
            //                     var user_ids = _.pluck(verifies, 'user_id');
            //                     cond.find['$or'].push({_id: {$in: user_ids}});
            //                     lib_user.getList(cond, cbk);
            //                 });
            //             } else {
            //                 if (req.decoded.company_id) {
            //                     cond = {find: {company_id: req.decoded.company_id}};
            //                     lib_user.getList(cond, cbk);
            //                 } else {
            //                     cb(null, {list: [], count: 0});
            //                 }
            //             }
            //         },
            //         function (data, cbk) {
            //             count = data.length;
            //             userData1 = data;
            //             lib_company.getList({
            //                 find: {_id: {$in: _.compact(_.flatten(_.pluck(data, 'company_id')))}},
            //                 select: 'verify_phase'
            //             }, cbk)
            //         },
            //         function (company, cbk) {
            //             //count = data.length;
            //             var companyObj = global.lib_util.transObjArrToObj(company, '_id');
            //             for (var i = 0; i < userData1.length; i++) {
            //                 if (_.isArray(userData1[i])) {
            //                     userData1[i].verify_phase = companyObj[userData1[i].company_id[0]].verify_phase || "";
            //                 } else {
            //                     userData1[i].verify_phase = companyObj[userData1[i].company_id].verify_phase || "";
            //                 }
            //             }
            //             async.eachSeries(userData1, function (user, callback) {
            //                 (function (user) {
            //                     if (user.role == global.config_common.user_roles.TRADE_STORAGE) {
            //                         var obj = {
            //                             _id: user._id.toString(),
            //                             status: true,
            //                             name: user.real_name,
            //                             role: user.role,
            //                             img: user.photo_url,
            //                             phone: user.phone,
            //                             verify_phase: user.verify_phase,
            //                             post: user.post,
            //                             sell: user.sell,
            //                             buy: user.buy,
            //                             transport: user.transport
            //                         };
            //                         list.push(obj);
            //                     }
            //                 })(user);
            //                 callback();
            //             }, cbk);
            //         },
            //         function (cbk) {
            //             // if(req.decoded.role == global.config_common.user_roles.TRAFFIC_ADMIN ||
            //             //     req.decoded.role == global.config_common.user_roles.TRADE_ADMIN){
            //             lib_invitation_user.getList({
            //                 find: {
            //                     company_id: req.decoded.company_id,
            //                     user_id: req.decoded.id,
            //                     type: global.config_common.relation_style.COMPANY_INVITE,
            //                     status: 'PROCESSING'
            //                 }
            //             }, cbk);
            //             // }else{
            //             //     cbk(null, []);
            //             // }
            //         },
            //         function (result, cbk) {
            //             count += result.length;
            //             async.eachSeries(result, function (user, callback) {
            //                 (function (user) {
            //                     if (user.role == global.config_common.user_roles.TRADE_STORAGE) {
            //                         var obj = {
            //                             status: false,
            //                             name: user.real_name,
            //                             role: user.role,
            //                             phone: user.phone,
            //                             post: user.post,
            //                             sell: user.sell,
            //                             buy: user.buy,
            //                             transport: user.transport
            //                         };
            //                         list.push(obj);
            //                     }
            //                 })(user);
            //                 callback();
            //             }, cbk);
            //         },
            //         function (cbk) {
            //             cbk(null, {
            //                 list: list,
            //                 count: count
            //             });
            //         }
            //     ], cb);
            // },
            FRIEND: function (cb) {
                var list = [];
                var count = 0;
                var userData2;
                var hanZi;
                async.waterfall([
                    function (cbk) {
                        global.lib_user.getOne({find: {_id: req.decoded.id}}, cbk);
                    },
                    function (user_w, cbk) {
                        req.decoded.company_id = user_w.company_id;
                        cbk();
                    },
                    function (cbk) {
                        global.lib_http.sendTradeServer({
                            method: 'getList',
                            cond: {find: {lev: 0}},
                            model: 'Classify'
                        }, global.config_api_url.trade_server_get_hanzi, cbk);
                    },
                    function (pei_zhi, cbk) {
                        hanZi = _.indexBy(pei_zhi, 'eng');
                        global.lib_user_relation.getList({
                            find: {user_id: req.decoded.id, type: global.config_common.relation_style.FRIEND},
                            select: 'other_id'
                        }, cbk);
                    },
                    function (relations, cbk) {
                        var user_ids = global.lib_util.transObjArrToSigArr(relations, 'other_id');
                        var cond = {find: {_id: {$in: user_ids}}};
                        lib_user.getListAll(cond, cbk);
                    },
                    function (data, cbk) {
                        count = data.length;
                        userData2 = data;
                        lib_company.getList({
                            find: {_id: {$in: _.compact(_.flatten(_.pluck(data, 'company_id')))}},
                            select: 'verify_phase'
                        }, cbk)
                    },
                    function (company, cbk) {
                        //count = data.length;
                        async.eachSeries(userData2, function (user, callback) {
                            (function (user) {
                                var obj = {
                                    _id: user._id.toString(),
                                    status: true,
                                    name: user.real_name,
                                    role: user.role,
                                    img: user.photo_url,
                                    phone: user.phone,
                                    verify_phase: user.verify_phase,
                                    post: user.post,
                                    sell: _.map(user.sell, function (num) {
                                        return hanZi[num] ? hanZi[num].chn : '';
                                    }),
                                    buy: _.map(user.buy, function (num) {
                                        return hanZi[num] ? hanZi[num].chn : '';
                                    }),
                                    transport: _.map(user.transport, function (num) {
                                        return hanZi[num] ? hanZi[num].chn : '';
                                    })
                                };
                                list.push(obj);
                            })(user);
                            callback();
                        }, cbk);
                    },
                    function (cbk) {
                        // if(req.decoded.role == global.config_common.user_roles.TRAFFIC_ADMIN ||
                        //     req.decoded.role == global.config_common.user_roles.TRADE_ADMIN){
                        lib_invitation_user.getList({
                            find: {
                                user_id: req.decoded.id,
                                type: global.config_common.relation_style.FRIEND,
                                status: 'PROCESSING'
                            }
                        }, cbk);
                        // }else{
                        //     cbk(null, []);
                        // }
                    },
                    function (result, cbk) {
                        count += result.length;
                        async.eachSeries(result, function (user, callback) {
                            (function (user) {
                                var obj = {
                                    _id: user._id.toString(),
                                    status: false,
                                    name: user.real_name,
                                    role: user.role,
                                    phone: user.phone,
                                    post: user.post,
                                    sell: _.map(user.sell, function (num) {
                                        return hanZi[num].chn;
                                    }),
                                    buy: _.map(user.buy, function (num) {
                                        return hanZi[num].chn;
                                    }),
                                    transport: _.map(user.transport, function (num) {
                                        return hanZi[num].chn;
                                    })
                                };
                                list.push(obj);
                            })(user);
                            callback();
                        }, cbk);
                    },
                    function (cbk) {
                        cbk(null, {
                            list: list,
                            count: count
                        });
                    }
                ], cb);
            },
            PURCHASE: function (cb) {
                var result = [];
                var count = 0;
                var hanZi;
                async.waterfall([
                    function (cbk) {
                        global.lib_user.getOne({find: {_id: req.decoded.id}}, cbk);
                    },
                    function (user_w, cbk) {
                        req.decoded.company_id = user_w.company_id;
                        cbk();
                    },
                    function (cbk) {
                        global.lib_http.sendTradeServer({
                            method: 'getList',
                            cond: {find: {lev: 0}},
                            model: 'Classify'
                        }, global.config_api_url.trade_server_get_hanzi, cbk);
                    },
                    function (pei_zhi, cbk) {
                        hanZi = _.indexBy(pei_zhi, 'eng');
                        global.lib_work_relation.getList({
                            find: {user_id: req.decoded.id, type: global.config_common.company_type.PURCHASE}
                        }, cbk);
                    },
                    function (data, cbk) {
                        count += data.length;
                        async.eachSeries(data, function (user_invitation, callback) {
                            (function (user_invitation) {
                                var obj = {};
                                obj.status = true;
                                async.waterfall([
                                    function (cback) {
                                        lib_user.getOne({
                                            find: {_id: user_invitation.other_user_id}
                                        }, cback);
                                    },
                                    function (user, cback) {
                                        if (user) {
                                            obj._id = user._id.toString();
                                            obj.status = true;
                                            obj.name = user.real_name;
                                            obj.role = user.role;
                                            obj.img = user.photo_url;
                                            obj.phone = user.phone;
                                            obj.post = user.post;
                                            obj.sell = _.map(user.sell, function (num) {
                                                return hanZi[num].chn;
                                            });
                                            obj.buy = _.map(user.buy, function (num) {
                                                return hanZi[num].chn;
                                            });
                                            obj.transport = _.map(user.transport, function (num) {
                                                return hanZi[num].chn;
                                            });
                                            lib_company.getOne({
                                                find: {_id: user_invitation.other_company_id}
                                            }, cback);
                                        } else {
                                            cback(null, null);
                                        }
                                    },
                                    function (company, cback) {
                                        if (company) {
                                            obj.company_name = company.nick_name ? company.nick_name : company.full_name;
                                            obj.verify_phase = company.verify_phase ? company.verify_phase : company.verify_phase;
                                            obj.sell = _.map(company.sell, function (num) {
                                                return hanZi[num].chn;
                                            });
                                            obj.buy = _.map(company.buy, function (num) {
                                                return hanZi[num].chn;
                                            });
                                            obj.transport = _.map(company.transport, function (num) {
                                                return hanZi[num].chn;
                                            });
                                            result.push(obj);
                                        }
                                        cback();
                                    }
                                ], callback);
                            })(user_invitation);
                        }, cbk);
                    },
                    function (cbk) {
                        cbk(null, {
                            list: result,
                            count: count
                        });
                    }
                ], cb);
            },
            SALE: function (cb) {
                var result = [];
                var count = 0;
                var hanZi;
                async.waterfall([
                    function (cbk) {
                        global.lib_user.getOne({find: {_id: req.decoded.id}}, cbk);
                    },
                    function (user_w, cbk) {
                        req.decoded.company_id = user_w.company_id;
                        cbk();
                    },
                    function (cbk) {
                        global.lib_http.sendTradeServer({
                            method: 'getList',
                            cond: {find: {lev: 0}},
                            model: 'Classify'
                        }, global.config_api_url.trade_server_get_hanzi, cbk);
                    },
                    function (pei_zhi, cbk) {
                        hanZi = _.indexBy(pei_zhi, 'eng');
                        global.lib_work_relation.getList({
                            find: {user_id: req.decoded.id, type: global.config_common.company_type.SALE}
                        }, cbk);
                    },
                    function (data, cbk) {
                        count += data.length;
                        async.eachSeries(data, function (user_invitation, callback) {
                            (function (user_invitation) {
                                var obj = {};
                                obj.status = true;
                                async.waterfall([
                                    function (cback) {
                                        lib_user.getOne({
                                            find: {_id: user_invitation.other_user_id}
                                        }, cback);
                                    },
                                    function (user, cback) {
                                        if (user) {
                                            obj._id = user._id.toString();
                                            obj.status = true;
                                            obj.name = user.real_name;
                                            obj.role = user.role;
                                            obj.img = user.photo_url;
                                            obj.phone = user.phone;
                                            obj.post = user.post;
                                            obj.sell = _.map(user.sell, function (num) {
                                                return hanZi[num].chn;
                                            });
                                            obj.buy = _.map(user.buy, function (num) {
                                                return hanZi[num].chn;
                                            });
                                            obj.transport = _.map(user.transport, function (num) {
                                                return hanZi[num].chn;
                                            });
                                        }
                                        lib_company.getOne({
                                            find: {_id: user_invitation.other_company_id}
                                        }, cback);
                                    },
                                    function (company, cback) {
                                        obj.company_name = company.nick_name ? company.nick_name : company.full_name;
                                        obj.verify_phase = company.verify_phase ? company.verify_phase : company.verify_phase;
                                        obj.sell = _.map(company.sell, function (num) {
                                            return hanZi[num].chn;
                                        });
                                        obj.buy = _.map(company.buy, function (num) {
                                            return hanZi[num].chn;
                                        });
                                        obj.transport = _.map(company.transport, function (num) {
                                            return hanZi[num].chn;
                                        });
                                        result.push(obj);
                                        cback();
                                    }
                                ], callback);
                            })(user_invitation);
                        }, cbk);
                    },
                    function (cbk) {
                        cbk(null, {
                            list: result,
                            count: count
                        });
                    }
                ], cb);
            },
            TRAFFIC: function (cb) {
                var result = [];
                var count = 0;
                var hanZi;
                async.waterfall([
                    function (cbk) {
                        global.lib_user.getOne({find: {_id: req.decoded.id}}, cbk);
                    },
                    function (user_w, cbk) {
                        req.decoded.company_id = user_w.company_id;
                        cbk();
                    },
                    function (cbk) {
                        global.lib_http.sendTradeServer({
                            method: 'getList',
                            cond: {find: {lev: 0}},
                            model: 'Classify'
                        }, global.config_api_url.trade_server_get_hanzi, cbk);
                    },
                    function (pei_zhi, cbk) {
                        hanZi = _.indexBy(pei_zhi, 'eng');
                        global.lib_work_relation.getList({
                            find: {user_id: req.decoded.id, type: global.config_common.company_type.TRAFFIC}
                        }, cbk);
                    },
                    function (data, cbk) {
                        count += data.length;
                        async.eachSeries(data, function (user_invitation, callback) {
                            (function (user_invitation) {
                                var obj = {};
                                obj.status = true;
                                async.waterfall([
                                    function (cback) {
                                        lib_user.getOne({
                                            find: {_id: user_invitation.other_user_id}
                                        }, cback);
                                    },
                                    function (user, cback) {
                                        if (user) {
                                            obj._id = user._id.toString();
                                            obj.status = true;
                                            obj.name = user.real_name;
                                            obj.role = user.role;
                                            obj.img = user.photo_url;
                                            obj.phone = user.phone;
                                            obj.post = user.post;
                                            obj.sell = _.map(user.sell, function (num) {
                                                return hanZi[num].chn;
                                            });
                                            obj.buy = _.map(user.buy, function (num) {
                                                return hanZi[num].chn;
                                            });
                                            obj.transport = _.map(user.transport, function (num) {
                                                return hanZi[num].chn;
                                            });
                                            lib_company.getOne({
                                                find: {_id: user_invitation.other_company_id}
                                            }, cback);
                                        } else {
                                            cb(null, null)
                                        }
                                    },
                                    function (company, cback) {
                                        obj.company_name = company.nick_name ? company.nick_name : company.full_name;
                                        obj.verify_phase = company.verify_phase ? company.verify_phase : company.verify_phase;
                                        obj.sell = _.map(company.sell, function (num) {
                                            return hanZi[num].chn;
                                        });
                                        obj.buy = _.map(company.buy, function (num) {
                                            return hanZi[num].chn;
                                        });
                                        obj.transport = _.map(company.transport, function (num) {
                                            return hanZi[num].chn;
                                        });
                                        result.push(obj);
                                        cback();
                                    }
                                ], callback);
                            })(user_invitation);
                        }, cbk);
                    },
                    function (cbk) {
                        cbk(null, {
                            list: result,
                            count: count
                        });
                    }
                ], cb);
            },
            STORAGE: function (cb) {
                var result = [];
                var count = 0;
                var hanZi;
                async.waterfall([
                    function (cbk) {
                        global.lib_user.getOne({find: {_id: req.decoded.id}}, cbk);
                    },
                    function (user_w, cbk) {
                        req.decoded.company_id = user_w.company_id;
                        cbk();
                    },
                    function (cbk) {
                        global.lib_http.sendTradeServer({
                            method: 'getList',
                            cond: {find: {lev: 0}},
                            model: 'Classify'
                        }, global.config_api_url.trade_server_get_hanzi, cbk);
                    },
                    function (pei_zhi, cbk) {
                        hanZi = _.indexBy(pei_zhi, 'eng');
                        if (req.decoded.role === global.config_common.user_roles.TRADE_STORAGE) {
                            global.lib_work_relation.getList({
                                find: {user_id: req.decoded.id, type: global.config_common.company_type.PURCHASE}
                            }, cbk);
                        } else {
                            global.lib_work_relation.getList({
                                find: {user_id: req.decoded.id, type: global.config_common.company_type.STORE}
                            }, cbk);
                        }
                    },
                    function (data, cbk) {
                        count += data.length;
                        async.eachSeries(data, function (user_invitation, callback) {
                            (function (user_invitation) {
                                var obj = {};
                                obj.status = true;
                                async.waterfall([
                                    function (cback) {
                                        lib_user.getOne({
                                            find: {_id: user_invitation.other_user_id}
                                        }, cback);
                                    },
                                    function (user, cback) {
                                        obj._id = user._id.toString();
                                        obj.status = true;
                                        obj.name = user.real_name;
                                        obj.role = user.role;
                                        obj.img = user.photo_url;
                                        obj.phone = user.phone;
                                        obj.post = user.post;
                                        obj.sell = _.map(user.sell, function (num) {
                                            return hanZi[num].chn;
                                        });
                                        obj.buy = _.map(user.buy, function (num) {
                                            return hanZi[num].chn;
                                        });
                                        obj.transport = _.map(user.transport, function (num) {
                                            return hanZi[num].chn;
                                        });
                                        lib_company.getOne({
                                            find: {_id: user_invitation.other_company_id}
                                        }, cback);
                                    },
                                    function (company, cback) {
                                        obj.company_name = company.nick_name ? company.nick_name : company.full_name;
                                        obj.verify_phase = company.verify_phase ? company.verify_phase : company.verify_phase;
                                        obj.sell = _.map(company.sell, function (num) {
                                            return hanZi[num].chn;
                                        });
                                        obj.buy = _.map(company.buy, function (num) {
                                            return hanZi[num].chn;
                                        });
                                        obj.transport = _.map(company.transport, function (num) {
                                            return hanZi[num].chn;
                                        });
                                        result.push(obj);
                                        cback();
                                    }
                                ], callback);
                            })(user_invitation);
                        }, cbk);
                    },
                    function (cbk) {
                        cbk(null, {
                            list: result,
                            count: count
                        });
                    }
                ], cb);
            },
            SERVICE: function (cb) {
                var result = [];
                var list;
                var count = 0;
                async.waterfall([
                    function (cbk) {
                        global.lib_user.getOne({find: {_id: req.decoded.id}}, cbk);
                    },
                    function (user_w, cbk) {
                        req.decoded.company_id = user_w.company_id;
                        cbk();
                    },
                    function (cbk) {
                        if (req.decoded.role == global.config_common.user_roles.TRAFFIC_ADMIN || req.decoded.role == global.config_common.user_roles.TRAFFIC_DRIVER_PRIVATE) {
                            if (req.decoded.company_id.length) {
                                global.lib_http.sendAdminServer({
                                    method: 'getList',
                                    cond: {
                                        find: {
                                            role: {$in: ['majordomo', 'manager', 'charge', 'service']},
                                            company_id: {$in: _.flatten([req.decoded.company_id])}
                                        },
                                        select: 'user_name role phone company_id photo_url'
                                    },
                                    model: 'SuperAdmin'
                                }, global.config_api_url.admin_server_get, cbk);
                            } else {
                                cbk(null, null);
                            }
                        } else {
                            if (req.decoded.company_id) {
                                global.lib_http.sendAdminServer({
                                    method: 'getList',
                                    cond: {
                                        find: {
                                            role: {$in: ['majordomo', 'manager', 'charge', 'service']},
                                            company_id: {$in: [req.decoded.company_id]}
                                        },
                                        select: 'user_name role phone company_id photo_url'
                                    },
                                    model: 'SuperAdmin'
                                }, global.config_api_url.admin_server_get, cbk);
                            } else {
                                cbk(null, null)
                            }
                        }
                    },
                    function (data, cbk) {
                        if (data) {
                            cbk(null, {list: data, count: data.length});
                        } else {
                            cbk(null, {list: [], count: 0});
                        }
                    }
                ], cb)
            }
        }, function (err, result) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, result, next);
        });
    });

    api.post('/get_linkman_new', function (req, res, next) {
        if (req.decoded.role === global.config_common.user_roles.TRAFFIC_DRIVER_PRIVATE) {
            return next('not_allow');
        }
        if (!_.isNumber(req.body.page)) {
            req.body.page = 1;
        }
        if (!req.body.type) {
            return next('not_allow');
        }
        var list = [];
        var count = 0;
        var userData1;
        var userData2;
        var hanZi;
        var result = [];
        var cond = {};
        var exist;
        switch (req.body.type) {
            case 'COLLEAGUE': {
                async.waterfall([
                    function (cbk) {
                        global.lib_user.getOne({find: {_id: req.decoded.id}}, cbk);
                    },
                    function (user_w, cbk) {
                        req.decoded.company_id = user_w.company_id;
                        cbk();
                    },
                    function (cbk) {
                        global.lib_http.sendTradeServer({
                            method: 'getList',
                            cond: {find: {lev: 0}},
                            model: 'Classify'
                        }, global.config_api_url.trade_server_get_hanzi, cbk);
                    },
                    function (pei_zhi, cbk) {
                        hanZi = _.indexBy(pei_zhi, 'eng');
                        //var cond = {};
                        if (req.decoded.role === global.config_common.user_roles.TRAFFIC_ADMIN || req.decoded.role === global.config_common.user_roles.TRADE_STORAGE) {
                            cond.find = {};
                            cond.find['$or'] = [];
                            if (req.decoded.role === global.config_common.user_roles.TRADE_STORAGE) {
                                cond.find['$or'].push({
                                    company_id: req.decoded.company_id
                                });
                            } else {
                                cond.find['$or'].push({
                                    company_id: req.decoded.company_id[0],
                                    role: {$in: [global.config_common.user_roles.TRAFFIC_ADMIN, global.config_common.user_roles.TRADE_STORAGE]}
                                });
                            }
                            //同事屏蔽司机
                            // global.lib_driver_verify.getList({
                            //     find: {
                            //         approve_id: req.decoded.id,
                            //         status: global.config_common.verification_phase.SUCCESS
                            //     },
                            //     select: 'user_id'
                            // }, function (err, verifies) {
                            //     if (err) {
                            //         return cb(err);
                            //     }
                            //     var user_ids = _.pluck(verifies, 'user_id');
                            //     cond.find['$or'].push({_id: {$in: user_ids}});
                            if (req.decoded.role === global.config_common.user_roles.TRADE_STORAGE) {
                                if (req.decoded.company_id) {
                                    lib_user.getCountAll(cond.find, cbk);
                                } else {
                                    cbk(null, []);
                                }
                            } else {
                                lib_user.getCountAll(cond.find, cbk);
                            }
                        } else {
                            if (req.decoded.company_id) {
                                cond = {find: {company_id: req.decoded.company_id}};
                                lib_user.getCountAll(cond.find, cbk);
                            } else {
                                cbk(null, []);
                            }
                        }
                    },
                    function (data, cbk) {
                        count = data;
                        exist = data > req.body.page * config_common.entry_per_page;
                        lib_user.getList_new({
                            find: cond.find,
                            skip: (req.body.page - 1) * config_common.entry_per_page,
                            limit: config_common.entry_per_page
                        }, cbk);
                    },
                    function (data, cbk) {
                        userData1 = data;
                        lib_company.getListAll({
                            find: {_id: {$in: _.compact(_.flatten(_.pluck(data, 'company_id')))}},
                            select: 'verify_phase'
                        }, cbk)
                    },
                    function (company, cbk) {
                        var companyObj = global.lib_util.transObjArrToObj(company, '_id');
                        for (var i = 0; i < userData1.length; i++) {
                            if (_.isArray(userData1[i])) {
                                userData1[i].verify_phase = companyObj[userData1[i].company_id[0]].verify_phase || "";
                            } else {
                                if (companyObj[userData1[i].company_id]) {
                                    userData1[i].verify_phase = companyObj[userData1[i].company_id].verify_phase || "";
                                } else {
                                    userData1[i].verify_phase = "";
                                }
                            }
                        }
                        async.eachSeries(userData1, function (user, callback) {
                            (function (user) {
                                // if (user.role != global.config_common.user_roles.TRADE_STORAGE) {
                                var obj = {
                                    _id: user._id.toString(),
                                    status: true,
                                    name: user.real_name,
                                    role: user.role,
                                    img: user.photo_url,
                                    phone: user.phone,
                                    verify_phase: user.verify_phase,
                                    post: user.post,
                                    sell: _.map(user.sell, function (num) {
                                        return hanZi[num].chn;
                                    }),
                                    buy: _.map(user.buy, function (num) {
                                        return hanZi[num].chn;
                                    }),
                                    transport: _.map(user.transport, function (num) {
                                        if (hanZi[num]) {
                                            return hanZi[num].chn;
                                        } else {
                                            return '';
                                        }
                                    })
                                };
                                list.push(obj);
                                // }
                            })(user);
                            callback();
                        }, cbk);
                    },
                    function (cbk) {
                        if (userData1.length < config_common.entry_per_page) {
                            lib_invitation_user.getList({
                                find: {
                                    company_id: req.decoded.company_id,
                                    user_id: req.decoded.id,
                                    type: global.config_common.relation_style.COMPANY_INVITE,
                                    status: 'PROCESSING'
                                }
                            }, cbk);
                        } else {
                            cbk(null, null);
                        }
                    },
                    function (result, cbk) {
                        if (result != null) {
                            async.eachSeries(result, function (user, callback) {
                                (function (user) {
                                    // if (user.role != global.config_common.user_roles.TRADE_STORAGE) {
                                    var obj = {
                                        _id: user._id.toString(),
                                        status: false,
                                        name: user.real_name,
                                        role: user.role,
                                        phone: user.phone,
                                        post: user.post,
                                        sell: user.sell,
                                        buy: user.buy,
                                        transport: user.transport
                                    };
                                    list.push(obj);
                                    // }
                                })(user);
                                callback();
                            }, cbk);
                        } else {
                            cbk();
                        }
                    },
                    function (cbk) {
                        cbk(null, {
                            list: list,
                            count: count,
                            exist: exist
                        });
                    }
                ], function (err, result) {
                    if (err) {
                        return next(err);
                    }
                    config_common.sendData(req, result, next);
                });
            }
                break;
            case 'NO_TEAM_DRIVER': {
                async.waterfall([
                    function (cbk) {
                        global.lib_user.getOne({find: {_id: req.decoded.id}}, cbk);
                    },
                    function (user_w, cbk) {
                        req.decoded.company_id = user_w.company_id;
                        cbk();
                    },
                    function (cbk) {
                        global.lib_http.sendTradeServer({
                            method: 'getList',
                            cond: {find: {lev: 0}},
                            model: 'Classify'
                        }, global.config_api_url.trade_server_get_hanzi, cbk);
                    },
                    function (pei_zhi, cbk) {
                        hanZi = _.indexBy(pei_zhi, 'eng');
                        cbk();
                    },
                    function (cbk) {
                        global.lib_relation_group.getListGroup({
                            find: {
                                user_id: req.decoded.id,
                                type: "DRIVER"
                            },
                            select: 'name',
                        }, cbk);
                    },
                    function (groupList, cbk) {
                        global.lib_relation_group.getListGroupUser({
                            find: {"group_id": {$in: _.pluck(groupList, '_id')}},
                            select: 'member_id',
                        }, cbk);
                    },
                    function (groupUsers, cbk) {
                        if (req.decoded.role === global.config_common.user_roles.TRAFFIC_ADMIN) {
                            //先查询自己的挂靠司机的关系，然后再查询到挂靠司机
                            global.lib_driver_verify.getList({
                                find: {
                                    company_id: req.decoded.company_id[0],
                                    approve_id: req.decoded.id
                                },
                                select: 'user_id transport'
                            }, function (err, verifies) {
                                if (err) {
                                    return cb(err);
                                }
                                var user_ids = _.difference(_.pluck(verifies, 'user_id'), _.pluck(groupUsers, 'member_id'));
                                cond.find = {_id: {$in: user_ids}};
                                lib_user.getCountAll(cond.find, cbk);
                            });
                        } else {
                            cbk(null, []);
                        }
                    },
                    function (data, cbk) {
                        count = data;
                        exist = data > req.body.page * config_common.entry_per_page;
                        lib_user.getList({
                            find: cond.find,
                            skip: (req.body.page - 1) * config_common.entry_per_page,
                            limit: config_common.entry_per_page
                        }, cbk);
                    },
                    function (data, cbk) {
                        userData1 = data;
                        async.eachSeries(userData1, function (user, callback) {
                            (function (user) {
                                var obj = {
                                    _id: user._id.toString(),
                                    status: true,
                                    name: user.real_name,
                                    role: user.role,
                                    img: user.photo_url,
                                    phone: user.phone,
                                    transport: _.map(user.transport, function (num) {
                                        return hanZi[num] ? hanZi[num].chn : '';
                                    })
                                };
                                list.push(obj);
                            })(user);
                            callback();
                        }, cbk);
                    },
                    function (cbk) {
                        cbk(null, {
                            list: list,
                            count: count,
                            exist: exist
                        });
                    }
                ], function (err, result) {
                    if (err) {
                        return next(err);
                    }
                    config_common.sendData(req, result, next);
                });
            }
                break;
            case 'DRIVER': {
                async.waterfall([
                    function (cbk) {
                        global.lib_user.getOne({find: {_id: req.decoded.id}}, cbk);
                    },
                    function (user_w, cbk) {
                        req.decoded.company_id = user_w.company_id;
                        cbk();
                    },
                    function (cbk) {
                        global.lib_http.sendTradeServer({
                            method: 'getList',
                            cond: {find: {lev: 0}},
                            model: 'Classify'
                        }, global.config_api_url.trade_server_get_hanzi, cbk);
                    },
                    function (pei_zhi, cbk) {
                        hanZi = _.indexBy(pei_zhi, 'eng');
                        cbk();
                    },
                    function (cbk) {
                        if (req.decoded.role === global.config_common.user_roles.TRAFFIC_ADMIN) {
                            //先查询自己的挂靠司机的关系，然后再查询到挂靠司机
                            global.lib_driver_verify.getList({
                                find: {
                                    company_id: req.decoded.company_id[0],
                                    approve_id: req.decoded.id
                                },
                                select: 'user_id transport'
                            }, function (err, verifies) {
                                if (err) {
                                    return cb(err);
                                }
                                var user_ids = _.pluck(verifies, 'user_id');
                                cond.find = {_id: {$in: user_ids}};
                                lib_user.getCountAll(cond.find, cbk);
                            });
                        } else {
                            cbk(null, []);
                        }
                    },
                    function (data, cbk) {
                        count = data;
                        exist = data > req.body.page * config_common.entry_per_page;
                        lib_user.getList({
                            find: cond.find,
                            skip: (req.body.page - 1) * config_common.entry_per_page,
                            limit: config_common.entry_per_page
                        }, cbk);
                    },
                    function (data, cbk) {
                        userData1 = data;
                        async.eachSeries(userData1, function (user, callback) {
                            (function (user) {
                                var obj = {
                                    _id: user._id.toString(),
                                    status: true,
                                    name: user.real_name,
                                    role: user.role,
                                    img: user.photo_url,
                                    phone: user.phone,
                                    transport: _.map(user.transport, function (num) {
                                        return hanZi[num] ? hanZi[num].chn : '';
                                    })
                                };
                                list.push(obj);
                            })(user);
                            callback();
                        }, cbk);
                    },
                    function (cbk) {
                        cbk(null, {
                            list: list,
                            count: count,
                            exist: exist
                        });
                    }
                ], function (err, result) {
                    if (err) {
                        return next(err);
                    }
                    config_common.sendData(req, result, next);
                });
            }
                break;
            case 'FRIEND': {
                async.waterfall([
                    function (cbk) {
                        global.lib_user.getOne({find: {_id: req.decoded.id}}, cbk);
                    },
                    function (user_w, cbk) {
                        req.decoded.company_id = user_w.company_id;
                        cbk();
                    },
                    function (cbk) {
                        global.lib_http.sendTradeServer({
                            method: 'getList',
                            cond: {find: {lev: 0}},
                            model: 'Classify'
                        }, global.config_api_url.trade_server_get_hanzi, cbk);
                    },
                    function (pei_zhi, cbk) {
                        hanZi = _.indexBy(pei_zhi, 'eng');
                        global.lib_user_relation.getList({
                            find: {user_id: req.decoded.id, type: global.config_common.relation_style.FRIEND},
                            select: 'other_id'
                        }, cbk);
                    },
                    function (relations, cbk) {
                        var user_ids = global.lib_util.transObjArrToSigArr(relations, 'other_id');
                        cond = {find: {_id: {$in: user_ids}}};
                        lib_user.getCountAll(cond.find, cbk);
                    },
                    function (data, cbk) {
                        count = data;
                        exist = data > req.body.page * config_common.entry_per_page;
                        lib_user.getList_new({
                            find: cond.find,
                            skip: (req.body.page - 1) * config_common.entry_per_page,
                            limit: config_common.entry_per_page
                        }, cbk);
                    },
                    function (data, cbk) {
                        userData2 = data;
                        lib_company.getList({
                            // _.compact去除数组中的所有false值   _.flatten将一个田涛多层的数组转换为只有一层
                            //_.pluck萃取数组对象中的某属性值，返回一个数组
                            find: {_id: {$in: _.compact(_.flatten(_.pluck(data, 'company_id')))}},
                            select: 'verify_phase'
                        }, cbk)
                    },
                    function (company, cbk) {
                        async.eachSeries(userData2, function (user, callback) {
                            (function (user) {
                                var obj = {
                                    _id: user._id.toString(),
                                    status: true,
                                    name: user.real_name,
                                    role: user.role,
                                    img: user.photo_url,
                                    phone: user.phone,
                                    verify_phase: user.verify_phase,
                                    post: user.post,
                                    sell: _.map(user.sell, function (num) {
                                        return hanZi[num] ? hanZi[num].chn : '';
                                    }),
                                    buy: _.map(user.buy, function (num) {
                                        return hanZi[num] ? hanZi[num].chn : '';
                                    }),
                                    transport: _.map(user.transport, function (num) {
                                        return hanZi[num] ? hanZi[num].chn : '';
                                    })
                                };
                                list.push(obj);
                            })(user);
                            callback();
                        }, cbk);
                    },
                    function (cbk) {
                        //如果每页返回的在线好友个数少于10个，则返回全部邀请未上线的好友
                        if (userData2.length < config_common.entry_per_page) {
                            lib_invitation_user.getList({
                                find: {
                                    user_id: req.decoded.id,
                                    type: global.config_common.relation_style.FRIEND,
                                    status: 'PROCESSING'
                                }
                            }, cbk);
                        } else {
                            cbk(null, null);
                        }
                    },
                    function (result, cbk) {
                        if (result != null) {
                            async.eachSeries(result, function (user, callback) {
                                (function (user) {
                                    var obj = {
                                        _id: user._id.toString(),
                                        status: false,
                                        name: user.real_name,
                                        role: user.role,
                                        phone: user.phone,
                                        post: user.post,
                                        sell: _.map(user.sell, function (num) {
                                            return hanZi[num].chn;
                                        }),
                                        buy: _.map(user.buy, function (num) {
                                            return hanZi[num].chn;
                                        }),
                                        transport: _.map(user.transport, function (num) {
                                            return hanZi[num].chn;
                                        })
                                    };
                                    list.push(obj);
                                })(user);
                                callback();
                            }, cbk);
                        } else {
                            cbk();
                        }
                    },
                    function (cbk) {
                        cbk(null, {
                            list: list,
                            count: count,
                            exist: exist
                        });
                    }
                ], function (err, result) {
                    if (err) {
                        return next(err);
                    }
                    config_common.sendData(req, result, next);
                });
            }
                break;
            case 'PURCHASE': {
                async.waterfall([
                    function (cbk) {
                        global.lib_user.getOne({find: {_id: req.decoded.id}}, cbk);
                    },
                    function (user_w, cbk) {
                        req.decoded.company_id = user_w.company_id;
                        cbk();
                    },
                    function (cbk) {
                        global.lib_http.sendTradeServer({
                            method: 'getList',
                            cond: {find: {lev: 0}},
                            model: 'Classify'
                        }, global.config_api_url.trade_server_get_hanzi, cbk);
                    },
                    function (pei_zhi, cbk) {
                        hanZi = _.indexBy(pei_zhi, 'eng');
                        global.lib_work_relation.getCount({
                            user_id: req.decoded.id,
                            type: global.config_common.company_type.PURCHASE
                        }, cbk);
                    },
                    function (data, cbk) {
                        count += data;
                        exist = data > req.body.page * config_common.entry_per_page;
                        global.lib_work_relation.getList({
                            find: {user_id: req.decoded.id, type: global.config_common.company_type.PURCHASE},
                            skip: (req.body.page - 1) * config_common.entry_per_page,
                            limit: config_common.entry_per_page
                        }, cbk);
                    },
                    function (data, cbk) {
                        async.eachSeries(data, function (user_invitation, callback) {
                            (function (user_invitation) {
                                var obj = {};
                                obj.status = true;
                                async.waterfall([
                                    function (cback) {
                                        lib_user.getOne({
                                            find: {_id: user_invitation.other_user_id}
                                        }, cback);
                                    },
                                    function (user, cback) {
                                        if (user) {
                                            obj._id = user._id.toString();
                                            obj.status = true;
                                            obj.name = user.real_name;
                                            obj.role = user.role;
                                            obj.img = user.photo_url;
                                            obj.phone = user.phone;
                                            obj.post = user.post;
                                            obj.sell = _.map(user.sell, function (num) {
                                                return hanZi[num].chn;
                                            });
                                            obj.buy = _.map(user.buy, function (num) {
                                                return hanZi[num].chn;
                                            });
                                            obj.transport = _.map(user.transport, function (num) {
                                                return hanZi[num].chn;
                                            });
                                            lib_company.getOne({
                                                find: {_id: user_invitation.other_company_id}
                                            }, cback);
                                        } else {
                                            cback(null, null);
                                        }
                                    },
                                    function (company, cback) {
                                        if (company) {
                                            obj.company_name = company.nick_name ? company.nick_name : company.full_name;
                                            obj.verify_phase = company.verify_phase ? company.verify_phase : company.verify_phase;
                                            obj.sell = _.map(company.sell, function (num) {
                                                return hanZi[num].chn;
                                            });
                                            obj.buy = _.map(company.buy, function (num) {
                                                return hanZi[num].chn;
                                            });
                                            obj.transport = _.map(company.transport, function (num) {
                                                return hanZi[num].chn;
                                            });
                                            result.push(obj);
                                        }
                                        cback();
                                    }
                                ], callback);
                            })(user_invitation);
                        }, cbk);
                    },
                    function (cbk) {
                        cbk(null, {
                            list: result,
                            count: count,
                            exist: exist
                        });
                    }
                ], function (err, result) {
                    if (err) {
                        return next(err);
                    }
                    config_common.sendData(req, result, next);
                });
            }
                break;
            case 'SALE': {
                async.waterfall([
                    function (cbk) {
                        global.lib_user.getOne({find: {_id: req.decoded.id}}, cbk);
                    },
                    function (user_w, cbk) {
                        req.decoded.company_id = user_w.company_id;
                        cbk();
                    },
                    function (cbk) {
                        global.lib_http.sendTradeServer({
                            method: 'getList',
                            cond: {find: {lev: 0}},
                            model: 'Classify'
                        }, global.config_api_url.trade_server_get_hanzi, cbk);
                    },
                    function (pei_zhi, cbk) {
                        hanZi = _.indexBy(pei_zhi, 'eng');
                        global.lib_work_relation.getCount({
                            user_id: req.decoded.id,
                            type: global.config_common.company_type.SALE
                        }, cbk);
                    },
                    function (data, cbk) {
                        count += data;
                        exist = data > req.body.page * config_common.entry_per_page;
                        global.lib_work_relation.getList({
                            find: {user_id: req.decoded.id, type: global.config_common.company_type.SALE},
                            skip: (req.body.page - 1) * config_common.entry_per_page,
                            limit: config_common.entry_per_page
                        }, cbk);
                    },
                    function (data, cbk) {
                        async.eachSeries(data, function (user_invitation, callback) {
                            (function (user_invitation) {
                                var obj = {};
                                obj.status = true;
                                async.waterfall([
                                    function (cback) {
                                        lib_user.getOne({
                                            find: {_id: user_invitation.other_user_id}
                                        }, cback);
                                    },
                                    function (user, cback) {
                                        if (user) {
                                            obj._id = user._id.toString();
                                            obj.status = true;
                                            obj.name = user.real_name;
                                            obj.role = user.role;
                                            obj.img = user.photo_url;
                                            obj.phone = user.phone;
                                            obj.post = user.post;
                                            obj.sell = _.map(user.sell, function (num) {
                                                return hanZi[num].chn;
                                            });
                                            obj.buy = _.map(user.buy, function (num) {
                                                return hanZi[num].chn;
                                            });
                                            obj.transport = _.map(user.transport, function (num) {
                                                return hanZi[num].chn;
                                            });
                                        }
                                        lib_company.getOne({
                                            find: {_id: user_invitation.other_company_id}
                                        }, cback);
                                    },
                                    function (company, cback) {
                                        obj.company_name = company.nick_name ? company.nick_name : company.full_name;
                                        obj.verify_phase = company.verify_phase ? company.verify_phase : company.verify_phase;
                                        obj.sell = _.map(company.sell, function (num) {
                                            return hanZi[num].chn;
                                        });
                                        obj.buy = _.map(company.buy, function (num) {
                                            return hanZi[num].chn;
                                        });
                                        obj.transport = _.map(company.transport, function (num) {
                                            return hanZi[num].chn;
                                        });
                                        result.push(obj);
                                        cback();
                                    }
                                ], callback);
                            })(user_invitation);
                        }, cbk);
                    },
                    function (cbk) {
                        cbk(null, {
                            list: result,
                            count: count,
                            exist: exist
                        });
                    }
                ], function (err, result) {
                    if (err) {
                        return next(err);
                    }
                    config_common.sendData(req, result, next);
                });
            }
                break;
            case 'TRAFFIC': {
                async.waterfall([
                    function (cbk) {
                        global.lib_user.getOne({find: {_id: req.decoded.id}}, cbk);
                    },
                    function (user_w, cbk) {
                        req.decoded.company_id = user_w.company_id;
                        cbk();
                    },
                    function (cbk) {
                        global.lib_http.sendTradeServer({
                            method: 'getList',
                            cond: {find: {lev: 0}},
                            model: 'Classify'
                        }, global.config_api_url.trade_server_get_hanzi, cbk);
                    },
                    function (pei_zhi, cbk) {
                        hanZi = _.indexBy(pei_zhi, 'eng');
                        global.lib_work_relation.getCount({
                            user_id: req.decoded.id,
                            type: global.config_common.company_type.TRAFFIC
                        }, cbk);
                    },
                    function (data, cbk) {
                        count += data;
                        exist = data > req.body.page * config_common.entry_per_page;
                        global.lib_work_relation.getList({
                            find: {user_id: req.decoded.id, type: global.config_common.company_type.TRAFFIC},
                            skip: (req.body.page - 1) * config_common.entry_per_page,
                            limit: config_common.entry_per_page
                        }, cbk);
                    },
                    function (data, cbk) {
                        async.eachSeries(data, function (user_invitation, callback) {
                            (function (user_invitation) {
                                var obj = {};
                                obj.status = true;
                                async.waterfall([
                                    function (cback) {
                                        lib_user.getOne({
                                            find: {_id: user_invitation.other_user_id}
                                        }, cback);
                                    },
                                    function (user, cback) {
                                        obj._id = user._id.toString();
                                        obj.status = true;
                                        obj.name = user.real_name;
                                        obj.role = user.role;
                                        obj.img = user.photo_url;
                                        obj.phone = user.phone;
                                        obj.post = user.post;
                                        obj.sell = _.map(user.sell, function (num) {
                                            return hanZi[num].chn;
                                        });
                                        obj.buy = _.map(user.buy, function (num) {
                                            return hanZi[num].chn;
                                        });
                                        obj.transport = _.map(user.transport, function (num) {
                                            return hanZi[num].chn;
                                        });
                                        lib_company.getOne({
                                            find: {_id: user_invitation.other_company_id}
                                        }, cback);
                                    },
                                    function (company, cback) {
                                        obj.company_name = company.nick_name ? company.nick_name : company.full_name;
                                        obj.verify_phase = company.verify_phase ? company.verify_phase : company.verify_phase;
                                        obj.sell = _.map(company.sell, function (num) {
                                            return hanZi[num].chn;
                                        });
                                        obj.buy = _.map(company.buy, function (num) {
                                            return hanZi[num].chn;
                                        });
                                        obj.transport = _.map(company.transport, function (num) {
                                            return hanZi[num].chn;
                                        });
                                        result.push(obj);
                                        cback();
                                    }
                                ], callback);
                            })(user_invitation);
                        }, cbk);
                    },
                    function (cbk) {
                        cbk(null, {
                            list: result,
                            count: count,
                            exist: exist
                        });
                    }
                ], function (err, result) {
                    if (err) {
                        return next(err);
                    }
                    config_common.sendData(req, result, next);
                });
            }
                break;
            case 'STORAGE': {
                async.waterfall([
                    function (cbk) {
                        global.lib_user.getOne({find: {_id: req.decoded.id}}, cbk);
                    },
                    function (user_w, cbk) {
                        req.decoded.company_id = user_w.company_id;
                        cbk();
                    },
                    function (cbk) {
                        global.lib_http.sendTradeServer({
                            method: 'getList',
                            cond: {find: {lev: 0}},
                            model: 'Classify'
                        }, global.config_api_url.trade_server_get_hanzi, cbk);
                    },
                    function (pei_zhi, cbk) {
                        hanZi = _.indexBy(pei_zhi, 'eng');
                        global.lib_work_relation.getCount({
                            user_id: req.decoded.id,
                            type: global.config_common.company_type.STORE
                        }, cbk);
                    },
                    function (data, cbk) {
                        count += data;
                        exist = data > req.body.page * config_common.entry_per_page;
                        if (req.decoded.role === global.config_common.user_roles.TRADE_STORAGE) {
                            global.lib_work_relation.getList({
                                find: {user_id: req.decoded.id, type: global.config_common.company_type.PURCHASE},
                                skip: (req.body.page - 1) * config_common.entry_per_page,
                                limit: config_common.entry_per_page
                            }, cbk);
                        } else {
                            global.lib_work_relation.getList({
                                find: {user_id: req.decoded.id, type: global.config_common.company_type.STORE},
                                skip: (req.body.page - 1) * config_common.entry_per_page,
                                limit: config_common.entry_per_page
                            }, cbk);
                        }
                    },
                    function (data, cbk) {
                        async.eachSeries(data, function (user_invitation, callback) {
                            (function (user_invitation) {
                                var obj = {};
                                obj.status = true;
                                async.waterfall([
                                    function (cback) {
                                        lib_user.getOne({
                                            find: {_id: user_invitation.other_user_id}
                                        }, cback);
                                    },
                                    function (user, cback) {
                                        obj._id = user._id.toString();
                                        obj.status = true;
                                        obj.name = user.real_name;
                                        obj.role = user.role;
                                        obj.img = user.photo_url;
                                        obj.phone = user.phone;
                                        obj.post = user.post;
                                        obj.sell = _.map(user.sell, function (num) {
                                            return hanZi[num].chn;
                                        });
                                        obj.buy = _.map(user.buy, function (num) {
                                            return hanZi[num].chn;
                                        });
                                        obj.transport = _.map(user.transport, function (num) {
                                            return hanZi[num].chn;
                                        });
                                        lib_company.getOne({
                                            find: {_id: user_invitation.other_company_id}
                                        }, cback);
                                    },
                                    function (company, cback) {
                                        obj.company_name = company.nick_name ? company.nick_name : company.full_name;
                                        obj.verify_phase = company.verify_phase ? company.verify_phase : company.verify_phase;
                                        obj.sell = _.map(company.sell, function (num) {
                                            return hanZi[num].chn;
                                        });
                                        obj.buy = _.map(company.buy, function (num) {
                                            return hanZi[num].chn;
                                        });
                                        obj.transport = _.map(company.transport, function (num) {
                                            return hanZi[num].chn;
                                        });
                                        result.push(obj);
                                        cback();
                                    }
                                ], callback);
                            })(user_invitation);
                        }, cbk);
                    },
                    function (cbk) {
                        cbk(null, {
                            list: result,
                            count: count,
                            exist: exist
                        });
                    }
                ], function (err, result) {
                    if (err) {
                        return next(err);
                    }
                    config_common.sendData(req, result, next);
                });
            }
                break;
        }

    });
    //获取好友了分类
    api.post('/get_type', function (req, res, next) {
        async.parallel({
            COLLEAGUE: function (cb) {
                var count = 0;
                var hanZi;
                async.waterfall([
                    function (cbk) {
                        global.lib_user.getOne({find: {_id: req.decoded.id}}, cbk);
                    },
                    function (user_w, cbk) {
                        req.decoded.company_id = user_w.company_id;
                        cbk();
                    },
                    function (cbk) {
                        global.lib_http.sendTradeServer({
                            method: 'getList',
                            cond: {find: {lev: 0}},
                            model: 'Classify'
                        }, global.config_api_url.trade_server_get_hanzi, cbk);
                    },
                    function (pei_zhi, cbk) {
                        hanZi = _.indexBy(pei_zhi, 'eng');
                        var cond = {};
                        if (req.decoded.role === global.config_common.user_roles.TRAFFIC_ADMIN || req.decoded.role === global.config_common.user_roles.TRADE_STORAGE) {
                            cond.find = {};
                            cond.find['$or'] = [];
                            if (req.decoded.role === global.config_common.user_roles.TRADE_STORAGE) {
                                cond.find['$or'].push({
                                    company_id: req.decoded.company_id
                                });
                            } else {
                                cond.find['$or'].push({
                                    company_id: req.decoded.company_id[0],
                                    role: {$in: [global.config_common.user_roles.TRAFFIC_ADMIN, global.config_common.user_roles.TRADE_STORAGE]}
                                });
                            }
                            if (req.decoded.role === global.config_common.user_roles.TRADE_STORAGE) {
                                if (req.decoded.company_id) {
                                    lib_user.getListAll(cond, cbk);
                                } else {
                                    cbk(null, []);
                                }
                            } else {

                                lib_user.getListAll(cond, cbk);
                            }
                        } else {
                            if (req.decoded.company_id) {
                                cond = {find: {company_id: req.decoded.company_id}};
                                lib_user.getListAll(cond, cbk);
                            } else {
                                cbk(null, []);
                            }
                        }
                    },
                    function (data, cbk) {
                        count = data.length;
                        cbk(null, {
                            count: count
                        });
                    }
                ], cb);
            },
            DRIVER: function (cb) {
                var count = 0;
                var hanZi;
                async.waterfall([
                    function (cbk) {
                        global.lib_user.getOne({find: {_id: req.decoded.id}}, cbk);
                    },
                    function (user_w, cbk) {
                        req.decoded.company_id = user_w.company_id;
                        cbk();
                    },
                    function (cbk) {
                        global.lib_http.sendTradeServer({
                            method: 'getList',
                            cond: {find: {lev: 0}},
                            model: 'Classify'
                        }, global.config_api_url.trade_server_get_hanzi, cbk);
                    },
                    function (pei_zhi, cbk) {
                        hanZi = _.indexBy(pei_zhi, 'eng');
                        cbk();
                    },
                    function (cbk) {
                        if (req.decoded.role === global.config_common.user_roles.TRAFFIC_ADMIN) {
                            //先查询自己的挂靠司机的关系，然后再查询到挂靠司机
                            global.lib_driver_verify.getList({
                                find: {
                                    company_id: req.decoded.company_id[0],
                                    approve_id: req.decoded.id
                                },
                                select: 'user_id transport'
                            }, function (err, verifies) {
                                if (err) {
                                    return cb(err);
                                }
                                var cond = {find: {}};
                                var user_ids = _.pluck(verifies, 'user_id');
                                cond.find = {_id: {$in: user_ids}};
                                lib_user.getList(cond, cbk);
                            });
                        } else {
                            cbk(null, []);
                        }
                    },
                    function (data, cbk) {
                        count = data.length;
                        cbk(null, {
                            count: count
                        });
                    }
                ], cb);
            },
            NO_TEAM_DRIVER: function (cb) {
                var count = 0;
                var hanZi;
                async.waterfall([
                    function (cbk) {
                        global.lib_user.getOne({find: {_id: req.decoded.id}}, cbk);
                    },
                    function (user_w, cbk) {
                        req.decoded.company_id = user_w.company_id;
                        cbk();
                    },
                    function (cbk) {
                        global.lib_http.sendTradeServer({
                            method: 'getList',
                            cond: {find: {lev: 0}},
                            model: 'Classify'
                        }, global.config_api_url.trade_server_get_hanzi, cbk);
                    },
                    function (pei_zhi, cbk) {
                        hanZi = _.indexBy(pei_zhi, 'eng');
                        cbk();
                    },
                    function (cbk) {
                        global.lib_relation_group.getListGroup({
                            find: {
                                user_id: req.decoded.id,
                                type: "DRIVER"
                            },
                            select: 'name',
                        }, cbk);
                    },
                    function (groupList, cbk) {
                        global.lib_relation_group.getListGroupUser({
                            find: {"group_id": {$in: _.pluck(groupList, '_id')}},
                            select: 'member_id',
                        }, cbk);
                    },
                    function (groupUsers, cbk) {
                        if (req.decoded.role === global.config_common.user_roles.TRAFFIC_ADMIN) {
                            //先查询自己的挂靠司机的关系，然后再查询到挂靠司机
                            global.lib_driver_verify.getList({
                                find: {
                                    company_id: req.decoded.company_id[0],
                                    approve_id: req.decoded.id
                                },
                                select: 'user_id transport'
                            }, function (err, verifies) {
                                if (err) {
                                    return cb(err);
                                }
                                var cond = {find: {}};
                                var user_ids = _.difference(_.pluck(verifies, 'user_id'), _.pluck(groupUsers, 'member_id'));
                                cond.find = {_id: {$in: user_ids}};
                                lib_user.getList(cond, cbk);
                            });
                        } else {
                            cbk(null, []);
                        }
                    },
                    function (data, cbk) {
                        count = data.length;
                        cbk(null, {
                            count: count
                        });
                    }
                ], cb);
            },
            FRIEND: function (cb) {
                var count = 0;
                var userData2;
                var hanZi;
                async.waterfall([
                    function (cbk) {
                        global.lib_user.getOne({find: {_id: req.decoded.id}}, cbk);
                    },
                    function (user_w, cbk) {
                        req.decoded.company_id = user_w.company_id;
                        cbk();
                    },
                    function (cbk) {
                        global.lib_http.sendTradeServer({
                            method: 'getList',
                            cond: {find: {lev: 0}},
                            model: 'Classify'
                        }, global.config_api_url.trade_server_get_hanzi, cbk);
                    },
                    function (pei_zhi, cbk) {
                        hanZi = _.indexBy(pei_zhi, 'eng');
                        global.lib_user_relation.getList({
                            find: {user_id: req.decoded.id, type: global.config_common.relation_style.FRIEND},
                            select: 'other_id'
                        }, cbk);
                    },
                    function (relations, cbk) {
                        var user_ids = global.lib_util.transObjArrToSigArr(relations, 'other_id');
                        var cond = {find: {_id: {$in: user_ids}}};
                        lib_user.getListAll(cond, cbk);
                    },
                    function (data, cbk) {
                        count = data.length;
                        userData2 = data;
                        cbk(null, {
                            count: count
                        });
                    }
                ], cb);
            },
            PURCHASE: function (cb) {
                var count = 0;
                var hanZi;
                async.waterfall([
                    function (cbk) {
                        global.lib_user.getOne({find: {_id: req.decoded.id}}, cbk);
                    },
                    function (user_w, cbk) {
                        req.decoded.company_id = user_w.company_id;
                        cbk();
                    },
                    function (cbk) {
                        global.lib_http.sendTradeServer({
                            method: 'getList',
                            cond: {find: {lev: 0}},
                            model: 'Classify'
                        }, global.config_api_url.trade_server_get_hanzi, cbk);
                    },
                    function (pei_zhi, cbk) {
                        hanZi = _.indexBy(pei_zhi, 'eng');
                        global.lib_work_relation.getList({
                            find: {user_id: req.decoded.id, type: global.config_common.company_type.PURCHASE}
                        }, cbk);
                    },
                    function (data, cbk) {
                        count += data.length;
                        cbk(null, {
                            count: count
                        });
                    },
                ], cb);
            },
            SALE: function (cb) {
                var result = [];
                var count = 0;
                var hanZi;
                async.waterfall([
                    function (cbk) {
                        global.lib_user.getOne({find: {_id: req.decoded.id}}, cbk);
                    },
                    function (user_w, cbk) {
                        req.decoded.company_id = user_w.company_id;
                        cbk();
                    },
                    function (cbk) {
                        global.lib_http.sendTradeServer({
                            method: 'getList',
                            cond: {find: {lev: 0}},
                            model: 'Classify'
                        }, global.config_api_url.trade_server_get_hanzi, cbk);
                    },
                    function (pei_zhi, cbk) {
                        hanZi = _.indexBy(pei_zhi, 'eng');
                        global.lib_work_relation.getList({
                            find: {user_id: req.decoded.id, type: global.config_common.company_type.SALE}
                        }, cbk);
                    },
                    function (data, cbk) {
                        count += data.length;
                        cbk(null, {
                            count: count
                        });
                    }
                ], cb);
            },
            TRAFFIC: function (cb) {
                var count = 0;
                var hanZi;
                async.waterfall([
                    function (cbk) {
                        global.lib_user.getOne({find: {_id: req.decoded.id}}, cbk);
                    },
                    function (user_w, cbk) {
                        req.decoded.company_id = user_w.company_id;
                        cbk();
                    },
                    function (cbk) {
                        global.lib_http.sendTradeServer({
                            method: 'getList',
                            cond: {find: {lev: 0}},
                            model: 'Classify'
                        }, global.config_api_url.trade_server_get_hanzi, cbk);
                    },
                    function (pei_zhi, cbk) {
                        hanZi = _.indexBy(pei_zhi, 'eng');
                        global.lib_work_relation.getList({
                            find: {user_id: req.decoded.id, type: global.config_common.company_type.TRAFFIC}
                        }, cbk);
                    },
                    function (data, cbk) {
                        count += data.length;
                        cbk(null, {
                            count: count
                        });
                    }
                ], cb);
            },
            STORAGE: function (cb) {
                var count = 0;
                var hanZi;
                async.waterfall([
                    function (cbk) {
                        global.lib_user.getOne({find: {_id: req.decoded.id}}, cbk);
                    },
                    function (user_w, cbk) {
                        req.decoded.company_id = user_w.company_id;
                        cbk();
                    },
                    function (cbk) {
                        global.lib_http.sendTradeServer({
                            method: 'getList',
                            cond: {find: {lev: 0}},
                            model: 'Classify'
                        }, global.config_api_url.trade_server_get_hanzi, cbk);
                    },
                    function (pei_zhi, cbk) {
                        hanZi = _.indexBy(pei_zhi, 'eng');
                        if (req.decoded.role === global.config_common.user_roles.TRADE_STORAGE) {
                            global.lib_work_relation.getList({
                                find: {user_id: req.decoded.id, type: global.config_common.company_type.PURCHASE}
                            }, cbk);
                        } else {
                            global.lib_work_relation.getList({
                                find: {user_id: req.decoded.id, type: global.config_common.company_type.STORE}
                            }, cbk);
                        }
                    },
                    function (data, cbk) {
                        count += data.length;
                        cbk(null, {
                            count: count
                        });
                    },
                ], cb);
            },
            SERVICE: function (cb) {
                var result = [];
                var list;
                var count = 0;
                async.waterfall([
                    function (cbk) {
                        global.lib_user.getOne({find: {_id: req.decoded.id}}, cbk);
                    },
                    function (user_w, cbk) {
                        req.decoded.company_id = user_w.company_id;
                        cbk();
                    },
                    function (cbk) {
                        if (req.decoded.role == global.config_common.user_roles.TRAFFIC_ADMIN || req.decoded.role == global.config_common.user_roles.TRAFFIC_DRIVER_PRIVATE) {
                            if (req.decoded.company_id.length) {
                                global.lib_http.sendAdminServer({
                                    method: 'getList',
                                    cond: {
                                        find: {
                                            role: {$in: ['majordomo', 'manager', 'charge', 'service']},
                                            company_id: {$in: _.flatten([req.decoded.company_id])}
                                        },
                                        select: 'user_name role phone company_id photo_url'
                                    },
                                    model: 'SuperAdmin'
                                }, global.config_api_url.admin_server_get, cbk);
                            } else {
                                cbk(null, null);
                            }
                        } else {
                            if (req.decoded.company_id) {
                                global.lib_http.sendAdminServer({
                                    method: 'getList',
                                    cond: {
                                        find: {
                                            role: {$in: ['majordomo', 'manager', 'charge', 'service']},
                                            company_id: {$in: [req.decoded.company_id]}
                                        },
                                        select: 'user_name role phone company_id photo_url'
                                    },
                                    model: 'SuperAdmin'
                                }, global.config_api_url.admin_server_get, cbk);
                            } else {
                                cbk(null, null)
                            }
                        }
                    },
                    function (data, cbk) {
                        if (data) {
                            cbk(null, {count: data.length});
                        } else {
                            cbk(null, {count: 0});
                        }
                    }
                ], cb)
            }
        }, function (err, result) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, result, next);
        });
    });

    /**
     * ！！！--6.1.4新功能--->待优化，需要简单封装简化重复性代码
     * 功能：获取好友了分类
     * 参数：无
     */
    api.post('/get_type2', function (req, res, next) {
        async.parallel({
            COLLEAGUE: function (cb) {
                var countAll = 0;
                async.waterfall([
                    function (cbk) {
                        //查询自己公司的同事的个数
                        if (req.decoded.company_id) {
                            if (_.isArray(req.decoded.company_id)) {
                                if (req.decoded.company_id.length) {
                                    lib_user.getCountAll({company_id: req.decoded.company_id}, cbk);
                                } else {
                                    cb(null, 0);
                                }
                            } else {
                                lib_user.getCountAll({company_id: req.decoded.company_id}, cbk);
                            }

                        } else {
                            cb(null, 0);
                        }
                    },
                    function (count, cbk) {
                        countAll = countAll + count;
                        lib_invitation_user.getCount({
                            company_id: req.decoded.company_id,
                            user_id: req.decoded.id.toString(),
                            type: global.config_common.relation_style.COMPANY_INVITE,
                            status: 'PROCESSING'
                        }, cbk);
                    },
                    function (count, cbk) {
                        countAll = countAll + count;
                        cbk(null, countAll);
                    }
                ], cb);
            },
            DRIVER: function (cb) {
                var countAll = 0;
                var ids;
                async.waterfall([
                    function (cbk) {
                        //查询到已邀请未上线的司机
                        lib_invitation_user.getCount({
                            user_id: req.decoded.id,
                            type: global.config_common.relation_style.FRIEND,
                            extend: {$in: 'driver'},
                            status: 'PROCESSING'
                        }, cbk);
                    },
                    function (count, cbk) {
                        countAll = countAll + count;
                        global.lib_driver_verify.getList({
                            find: {
                                company_id: req.decoded.company_id[0],
                                approve_id: req.decoded.id
                            },
                            select: 'user_id transport'
                        }, cbk);
                    },
                    function (verifies, cbk) {
                        var user_ids = _.pluck(verifies, 'user_id');
                        lib_user.getCountAll({_id: {$in: user_ids}}, cbk);
                    },
                    function (count, cbk) {
                        countAll = countAll + count;
                        //查询到好友关系中的
                        global.lib_user_relation.getList({
                            find: {
                                user_id: req.decoded.id,
                                type: global.config_common.relation_style.FRIEND,
                                extend: 'driver'
                            },
                            select: 'other_id'
                        }, cbk);
                    },
                    function (relations, cbk) {
                        ids = _.pluck(relations, 'other_id');
                        global.lib_driver_verify.getList({
                            find: {
                                company_id: req.decoded.company_id[0],
                                approve_id: req.decoded.id
                            },
                            select: 'user_id transport'
                        }, cbk);
                    },
                    function (verifies, cbk) {
                        ids = _.difference(ids, _.pluck(verifies, 'user_id'));
                        lib_user.getCountAll({_id: {$in: ids}}, cbk);
                    },
                    function (count, cbk) {
                        countAll = countAll + count;
                        cbk(null, countAll);
                    }
                ], cb);
            },
            // NO_TEAM_DRIVER: function (cb) {
            //     cb(null, 0)
            // },
            PURCHASE: function (cb) {
                var countAll = 0;
                var list;
                async.waterfall([
                    function (cbk) {
                        //查询合作关系的采购商-->
                        global.lib_work_relation.getCount({
                            user_id: req.decoded.id,
                            type: global.config_common.company_type.PURCHASE
                        }, cbk);
                    },
                    function (count, cbk) {
                        countAll = countAll + count;
                        //查询到申请中的采购商
                        global.lib_apply_relation.getCount({
                            extend: 'SALE',
                            status: 'WAIT',
                            type: 'WORK',
                            other_user_id: req.decoded.id
                        }, cbk);
                    },
                    function (count, cbk) {
                        countAll = countAll + count;
                        //查询到已邀请未上线的采购商
                        lib_invitation_user.getCount({
                            user_id: req.decoded.id,
                            type: global.config_common.relation_style.FRIEND,
                            extend: {$in: ['purchase', 'trade']},
                            status: 'PROCESSING'
                        }, cbk);
                    },
                    function (count, cbk) {
                        countAll = countAll + count;
                        //查询到好友关系中的
                        global.lib_user_relation.getList({
                            find: {
                                user_id: req.decoded.id,
                                type: global.config_common.relation_style.FRIEND,
                                extend: {$nin: ['sale', 'traffic', 'driver']}
                            },
                            select: 'other_id'
                        }, cbk);
                    },
                    function (friendList, cbk) {
                        list = _.pluck(friendList, 'other_id');
                        global.lib_work_relation.getList({
                            find: {user_id: req.decoded.id, type: global.config_common.company_type.PURCHASE},
                            select: 'other_user_id'
                        }, cbk);
                    },
                    function (workList, cbk) {
                        list = _.difference(list, _.pluck(workList, 'other_user_id'));
                        lib_user.getCountAll({
                            _id: {$in: list},
                            role: {$ne: 'TRAFFIC_DRIVER_PRIVATE'}
                        }, cbk);
                    },
                    function (count, cbk) {
                        countAll = countAll + count;
                        cbk(null, countAll);
                    }
                ], cb);
            },
            SALE: function (cb) {
                var countAll = 0;
                var list;
                async.waterfall([
                    function (cbk) {
                        //查询合作关系的采购商-->
                        global.lib_work_relation.getCount({
                            user_id: req.decoded.id,
                            type: global.config_common.company_type.SALE
                        }, cbk);
                    },
                    function (count, cbk) {
                        countAll = countAll + count;
                        //查询到申请中的销售商
                        global.lib_apply_relation.getCount({
                            extend: 'PURCHASE',
                            status: 'WAIT',
                            type: 'WORK',
                            other_user_id: req.decoded.id
                        }, cbk);
                    },
                    function (count, cbk) {
                        countAll = countAll + count;
                        //查询到已邀请未上线的销售商
                        lib_invitation_user.getCount({
                            user_id: req.decoded.id,
                            type: global.config_common.relation_style.FRIEND,
                            extend: 'sale',
                            status: 'PROCESSING'
                        }, cbk);
                    },
                    function (count, cbk) {
                        countAll = countAll + count;
                        //查询到好友关系中的
                        global.lib_user_relation.getList({
                            find: {
                                user_id: req.decoded.id,
                                type: global.config_common.relation_style.FRIEND,
                                extend: 'sale'
                            },
                            select: 'other_id'
                        }, cbk);
                    },
                    function (friendList, cbk) {
                        list = _.pluck(friendList, 'other_id');
                        global.lib_work_relation.getList({
                            find: {user_id: req.decoded.id, type: global.config_common.company_type.SALE},
                            select: 'other_user_id'
                        }, cbk);
                    },
                    function (workList, cbk) {
                        list = _.difference(list, _.pluck(workList, 'other_user_id'));
                        countAll = countAll + list.length;
                        cbk(null, countAll);
                    }
                ], cb);
            },
            TRAFFIC: function (cb) {
                var countAll = 0;
                var list;
                async.waterfall([
                    function (cbk) {
                        //查询合作关系的物流方-->
                        global.lib_work_relation.getCount({
                            user_id: req.decoded.id,
                            type: global.config_common.company_type.TRAFFIC
                        }, cbk);
                    },
                    function (count, cbk) {
                        countAll = countAll + count;
                        //查询到申请中的采购商
                        global.lib_apply_relation.getCount({
                            extend: 'TRAFFIC',
                            status: 'WAIT',
                            type: 'work',
                            other_user_id: req.decoded.id
                        }, cbk);
                    },
                    function (count, cbk) {
                        countAll = countAll + count;
                        //查询到已邀请未上线的采购商
                        lib_invitation_user.getCount({
                            user_id: req.decoded.id,
                            type: global.config_common.relation_style.FRIEND,
                            status: 'PROCESSING',
                            extend: 'traffic'
                        }, cbk);
                    },
                    function (count, cbk) {
                        countAll = countAll + count;
                        //查询到好友关系中的
                        global.lib_user_relation.getList({
                            find: {
                                user_id: req.decoded.id,
                                type: global.config_common.relation_style.FRIEND,
                                extend: 'traffic'
                            },
                            select: 'other_id'
                        }, cbk);
                    },
                    function (friendList, cbk) {
                        list = _.pluck(friendList, 'other_id');
                        global.lib_work_relation.getList({
                            find: {user_id: req.decoded.id, type: global.config_common.company_type.TRAFFIC},
                            select: 'other_user_id'
                        }, cbk);
                    },
                    function (workList, cbk) {
                        list = _.difference(list, _.pluck(workList, 'other_user_id'));
                        countAll = countAll + list.length;
                        cbk(null, countAll);
                    }
                ], cb);
            }
        }, function (err, result) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, result, next);
        });
    });
    /**
     * ！！！--6.1.4新功能--->待优化，需要简单封装简化重复性代码
     * 功能：除司机角色外的联系人界面6.1.13版本更新
     * 参数:page，type
     */
    api.post('/get_linkman2', function (req, res, next) {
        if (req.decoded.role === global.config_common.user_roles.TRAFFIC_DRIVER_PRIVATE) {
            return next('not_allow');
        }
        if (!_.isNumber(req.body.page)) {
            req.body.page = 1;
        }
        if (!req.body.type) {
            return next('not_allow');
        }
        var selfData; //自己的个人数据
        var result = {};//最后传出去的数据
        // tag状态总结：(1)合作:work;(2)申请合作中:working;(3)未合作:NO
        // 补充:已邀请未上线status:false;
        // friend状态 true/false
        async.waterfall([
            function (cb) {
                //查询到自己的个人数据，用于之后的操作
                global.lib_user.getOne({find: {_id: req.decoded.id}}, cb);
            },
            function (user, cb) {
                if (!user) {
                    return cb('user_not_found');
                }
                selfData = user;
                switch (req.body.type) {
                    //采购合作:已合作
                    case 'PURCHASE_1':
                        //采购由四种列表构成
                        // (1)合作关系的采购商PURCHASE1
                        // (2)合作关系申请中的采购商PURCHASE2
                        // (3)已邀请未上线的采购商PURCHASE3
                        // (4)好友采购商PURCHASE4
                        // ！注意：(1)(2)两种状态添加是否是好友标签
                        result.list = [];
                        async.waterfall([
                            function (cbk) {
                                //查询合作关系的采购商-->
                                global.lib_work_relation.getCount({
                                    user_id: req.decoded.id,
                                    type: global.config_common.company_type.PURCHASE
                                }, cbk);
                            },
                            function (count, cbk) {
                                result.count = count;
                                result.exist = count > req.body.page * config_common.entry_per_page;
                                global.lib_work_relation.getList({
                                    find: {user_id: req.decoded.id, type: global.config_common.company_type.PURCHASE},
                                    skip: (req.body.page - 1) * config_common.entry_per_page,
                                    limit: config_common.entry_per_page
                                }, cbk);
                            },
                            function (list, cbk) {
                                //根据count将数据修改成功
                                global.lib_common.editUserData(req, list, 'work', cbk);
                            },
                            function (list, cbk) {
                                result.list = list;
                                cbk();
                            }
                        ], cb)
                        break;
                    //采购合作:申请中
                    case 'PURCHASE_2':
                        result.list = [];
                        async.waterfall([
                            function (cbk) {
                                //查询到申请中的采购商
                                global.lib_apply_relation.getCount({
                                    extend: 'SALE',
                                    status: 'WAIT',
                                    type: 'WORK',
                                    other_user_id: req.decoded.id
                                }, cbk);
                            },
                            function (count, cbk) {
                                result.count = count;
                                result.exist = count > req.body.page * config_common.entry_per_page;
                                global.lib_apply_relation.getList({
                                    find: {
                                        extend: 'SALE',
                                        status: 'WAIT',
                                        type: 'WORK',
                                        other_user_id: req.decoded.id
                                    },
                                    skip: (req.body.page - 1) * config_common.entry_per_page,
                                    limit: config_common.entry_per_page
                                }, cbk);
                            },
                            function (list, cbk) {
                                global.lib_common.editUserData(req, list, 'working', cbk);
                            },
                            function (list, cbk) {
                                result.list = list;
                                cbk();
                            }
                        ], cb);
                        break;
                    //采购合作:已邀请未上线(已邀请未上线的采购商类型好友)
                    case 'PURCHASE_3':
                        result.list = [];
                        async.waterfall([
                            function (cbk) {
                                //查询到已邀请未上线的类型为采购商的好友
                                lib_invitation_user.getCount({
                                    user_id: req.decoded.id,
                                    type: global.config_common.relation_style.FRIEND,
                                    extend: {$in: ['purchase', 'trade']},
                                    status: 'PROCESSING'
                                }, cbk);
                            },
                            function (count, cbk) {
                                result.count = count;
                                result.exist = count > req.body.page * config_common.entry_per_page;
                                //需要修改邀请接口
                                lib_invitation_user.getList({
                                    find: {
                                        user_id: req.decoded.id,
                                        type: global.config_common.relation_style.FRIEND,
                                        extend: {$in: ['purchase', 'trade']},
                                        status: 'PROCESSING'
                                    },
                                    skip: (req.body.page - 1) * config_common.entry_per_page,
                                    limit: config_common.entry_per_page
                                }, cbk);
                            },
                            function (list, cbk) {
                                result.list = _.map(list, function (num) {
                                    return {
                                        real_name: num.real_name,
                                        phone: num.phone,
                                        status: false,
                                        photo_url: '',
                                        post: ''
                                    };
                                });
                                cbk();
                            }
                        ], cb);
                        break;
                    //采购合作:单纯的好友关系(好友的关系类型为采购)
                    case 'PURCHASE_4':
                        result.list = [];
                        var ids;
                        async.waterfall([
                            function (cbk) {
                                //查询到好友关系中的
                                global.lib_user_relation.getList({
                                    find: {
                                        user_id: req.decoded.id,
                                        type: global.config_common.relation_style.FRIEND,
                                        extend: {$nin: ['sale', 'traffic', 'driver']}
                                    },
                                    select: 'other_id'
                                }, cbk);
                            },
                            function (relations, cbk) {
                                ids = _.pluck(relations, 'other_id');
                                global.lib_work_relation.getList({
                                    find: {user_id: req.decoded.id, type: global.config_common.company_type.PURCHASE},
                                    select: 'other_user_id'
                                }, cbk);
                            },
                            function (workList, cbk) {
                                ids = _.difference(ids, _.pluck(workList, 'other_user_id'));
                                ids = _.uniq(ids);
                                lib_user.getCountAll({
                                    _id: {$in: ids},
                                    role: {$ne: 'TRAFFIC_DRIVER_PRIVATE'}
                                }, cbk);
                            },
                            function (count, cbk) {
                                result.count = count;
                                result.exist = count > req.body.page * config_common.entry_per_page;
                                lib_user.getListAll({
                                    find: {
                                        _id: {$in: ids},
                                        role: {$ne: 'TRAFFIC_DRIVER_PRIVATE'}
                                    },
                                    skip: (req.body.page - 1) * config_common.entry_per_page,
                                    limit: config_common.entry_per_page,
                                    select: 'real_name role post photo_url'
                                }, cbk);
                            },
                            function (list, cbk) {
                                list = JSON.parse(JSON.stringify(list));
                                result.list = _.map(list, function (num) {
                                    num.status = true;
                                    num.friend = true;
                                    return num;
                                });
                                result.list = list;
                                cbk();
                            }
                        ], cb);
                        break;

                    //销售合作:已合作
                    case 'SALE_1':
                        result.list = [];
                        var cond = {//确定查询条件
                            user_id: req.decoded.id,
                            type: global.config_common.company_type.SALE
                        };
                        async.waterfall([
                            function (cbk) {
                                //查询合作关系的采购商-->
                                global.lib_work_relation.getCount(cond, cbk);
                            },
                            function (count, cbk) {
                                result.count = count;
                                result.exist = count > req.body.page * config_common.entry_per_page;
                                global.lib_work_relation.getList({
                                    find: cond,
                                    skip: (req.body.page - 1) * config_common.entry_per_page,
                                    limit: config_common.entry_per_page
                                }, cbk);
                            },
                            function (list, cbk) {
                                //根据count将数据修改成功
                                global.lib_common.editUserData(req, list, 'work', cbk);
                            },
                            function (list, cbk) {
                                result.list = list;
                                cbk();
                            }
                        ], cb)
                        break;
                    //销售合作:申请中
                    case 'SALE_2':
                        result.list = [];
                        var cond = {
                            extend: 'PURCHASE',
                            status: 'WAIT',
                            type: 'WORK',
                            other_user_id: req.decoded.id
                        };
                        async.waterfall([
                            function (cbk) {
                                //查询到申请中的采购商
                                global.lib_apply_relation.getCount(cond, cbk);
                            },
                            function (count, cbk) {
                                result.count = count;
                                result.exist = count > req.body.page * config_common.entry_per_page;
                                global.lib_apply_relation.getList({
                                    find: cond,
                                    skip: (req.body.page - 1) * config_common.entry_per_page,
                                    limit: config_common.entry_per_page
                                }, cbk);
                            },
                            function (list, cbk) {
                                //根据count将数据修改成功
                                global.lib_common.editUserData(req, list, 'working', cbk);
                            },
                            function (list, cbk) {
                                result.list = list;
                                cbk();
                            }
                        ], cb);
                        break;
                    //销售合作:已邀请未上线(已邀请未上线的销售商类型好友)
                    case 'SALE_3':
                        result.list = [];
                        async.waterfall([
                            function (cbk) {
                                //查询到已邀请未上线的类型为采购商的好友
                                lib_invitation_user.getCount({
                                    user_id: req.decoded.id,
                                    type: global.config_common.relation_style.FRIEND,
                                    extend: 'sale',
                                    status: 'PROCESSING'
                                }, cbk);
                            },
                            function (count, cbk) {
                                result.count = count;
                                result.exist = count > req.body.page * config_common.entry_per_page;
                                //需要修改邀请接口
                                lib_invitation_user.getList({
                                    find: {
                                        user_id: req.decoded.id,
                                        type: global.config_common.relation_style.FRIEND,
                                        extend: 'sale',
                                        status: 'PROCESSING'
                                    },
                                    skip: (req.body.page - 1) * config_common.entry_per_page,
                                    limit: config_common.entry_per_page
                                }, cbk);
                            },
                            function (list, cbk) {
                                result.list = _.map(list, function (num) {
                                    return {
                                        real_name: num.real_name,
                                        phone: num.phone,
                                        status: false,
                                        photo_url: '',
                                        post: ''
                                    };
                                });
                                cbk();
                            }
                        ], cb);
                        break;
                    //销售合作:单纯的好友关系(好友的关系类型为销售)
                    case 'SALE_4':
                        result.list = [];
                        var ids;
                        async.waterfall([
                            function (cbk) {
                                //查询到好友关系中的
                                global.lib_user_relation.getList({
                                    find: {
                                        user_id: req.decoded.id,
                                        type: global.config_common.relation_style.FRIEND,
                                        extend: 'sale'
                                    },
                                    select: 'other_id'
                                }, cbk);
                            },
                            function (relations, cbk) {
                                ids = _.pluck(relations, 'other_id');
                                global.lib_work_relation.getList({
                                    find: {user_id: req.decoded.id, type: global.config_common.company_type.SALE},
                                    select: 'other_user_id'
                                }, cbk);
                            },
                            function (workList, cbk) {
                                ids = _.difference(ids, _.pluck(workList, 'other_user_id'));
                                lib_user.getCountAll({_id: {$in: ids}}, cbk);
                            },
                            function (count, cbk) {
                                result.count = count;
                                result.exist = count > req.body.page * config_common.entry_per_page;
                                lib_user.getList_new({
                                    find: {_id: {$in: ids}},
                                    skip: (req.body.page - 1) * config_common.entry_per_page,
                                    limit: config_common.entry_per_page,
                                    select: 'real_name role post photo_url'
                                }, cbk);
                            },
                            function (list, cbk) {
                                list = JSON.parse(JSON.stringify(list));
                                result.list = _.map(list, function (num) {
                                    num.status = true;
                                    num.friend = true;
                                    return num;
                                });
                                result.list = list;
                                cbk();
                            }
                        ], cb);
                        break;

                    //物流合作:已合作
                    case 'TRAFFIC_1':
                        result.list = [];
                        var cond = {//确定查询条件
                            user_id: req.decoded.id,
                            type: global.config_common.company_type.TRAFFIC
                        };
                        async.waterfall([
                            function (cbk) {
                                //查询合作关系的采购商-->
                                global.lib_work_relation.getCount(cond, cbk);
                            },
                            function (count, cbk) {
                                result.count = count;
                                result.exist = count > req.body.page * config_common.entry_per_page;
                                global.lib_work_relation.getList({
                                    find: cond,
                                    skip: (req.body.page - 1) * config_common.entry_per_page,
                                    limit: config_common.entry_per_page
                                }, cbk);
                            },
                            function (list, cbk) {
                                //根据count将数据修改成功
                                global.lib_common.editUserData(req, list, 'work', cbk);
                            },
                            function (list, cbk) {
                                result.list = list;
                                cbk();
                            }
                        ], cb)
                        break;
                    //物流合作:申请中
                    case 'TRAFFIC_2':
                        result.list = [];
                        var cond = {
                            extend: 'TRAFFIC',
                            status: 'WAIT',
                            type: 'work',
                            other_user_id: req.decoded.id
                        };
                        async.waterfall([
                            function (cbk) {
                                //查询到申请中的采购商
                                global.lib_apply_relation.getCount(cond, cbk);
                            },
                            function (count, cbk) {
                                result.count = count;
                                result.exist = count > req.body.page * config_common.entry_per_page;
                                global.lib_apply_relation.getList({
                                    find: cond,
                                    skip: (req.body.page - 1) * config_common.entry_per_page,
                                    limit: config_common.entry_per_page
                                }, cbk);
                            },
                            function (list, cbk) {
                                //根据count将数据修改成功
                                global.lib_common.editUserData(req, list, 'working', cbk);
                            },
                            function (list, cbk) {
                                result.list = list;
                                cbk();
                            }
                        ], cb);
                        break;
                    //物流合作:已邀请未上线(已邀请未上线的物流商类型好友)
                    case 'TRAFFIC_3':
                        result.list = [];
                        async.waterfall([
                            function (cbk) {
                                //查询到已邀请未上线的类型为采购商的好友
                                lib_invitation_user.getCount({
                                    user_id: req.decoded.id,
                                    type: global.config_common.relation_style.FRIEND,
                                    extend: 'traffic',
                                    status: 'PROCESSING'
                                }, cbk);
                            },
                            function (count, cbk) {
                                result.count = count;
                                result.exist = count > req.body.page * config_common.entry_per_page;
                                //需要修改邀请接口
                                lib_invitation_user.getList({
                                    find: {
                                        user_id: req.decoded.id,
                                        type: global.config_common.relation_style.FRIEND,
                                        extend: 'traffic',
                                        status: 'PROCESSING'
                                    },
                                    skip: (req.body.page - 1) * config_common.entry_per_page,
                                    limit: config_common.entry_per_page
                                }, cbk);
                            },
                            function (list, cbk) {
                                result.list = _.map(list, function (num) {
                                    return {
                                        real_name: num.real_name,
                                        phone: num.phone,
                                        status: false,
                                        photo_url: '',
                                        post: ''
                                    };
                                });
                                cbk();
                            }
                        ], cb);
                        break;
                    //物流合作:单纯的好友关系(好友的关系类型为物流)
                    case 'TRAFFIC_4':
                        result.list = [];
                        var ids;
                        async.waterfall([
                            function (cbk) {
                                //查询到好友关系中的
                                global.lib_user_relation.getList({
                                    find: {
                                        user_id: req.decoded.id,
                                        type: global.config_common.relation_style.FRIEND,
                                        extend: 'traffic'
                                    },
                                    select: 'other_id'
                                }, cbk);
                            },
                            function (relations, cbk) {
                                ids = _.pluck(relations, 'other_id');
                                global.lib_work_relation.getList({
                                    find: {user_id: req.decoded.id, type: global.config_common.company_type.PURCHASE},
                                    select: 'other_user_id'
                                }, cbk);
                            },
                            function (workList, cbk) {
                                ids = _.difference(ids, _.pluck(workList, 'other_user_id'));
                                lib_user.getCountAll({_id: {$in: ids}}, cbk);
                            },
                            function (count, cbk) {
                                result.count = count;
                                result.exist = count > req.body.page * config_common.entry_per_page;
                                lib_user.getList_new({
                                    find: {_id: {$in: ids}},
                                    skip: (req.body.page - 1) * config_common.entry_per_page,
                                    limit: config_common.entry_per_page,
                                    select: 'real_name role post photo_url'
                                }, cbk);
                            },
                            function (list, cbk) {
                                list = JSON.parse(JSON.stringify(list));
                                result.list = _.map(list, function (num) {
                                    num.status = true;
                                    num.friend = true;
                                    return num;
                                });
                                result.list = list;
                                cbk();
                            }
                        ], cb);
                        break;

                    //司机挂靠:已挂靠
                    case 'DRIVER_1':
                        result.list = [];
                        var cond;
                        async.waterfall([
                            function (cbk) {
                                global.lib_driver_verify.getList({
                                    find: {
                                        company_id: req.decoded.company_id[0],
                                        approve_id: req.decoded.id
                                    },
                                    select: 'user_id transport'
                                }, cbk);
                            },
                            function (verifies, cbk) {
                                cond = {_id: {$in: _.pluck(verifies, 'user_id')}}
                                lib_user.getCountAll(cond, cbk);
                            },
                            function (count, cbk) {
                                result.count = count;
                                result.exist = count > req.body.page * config_common.entry_per_page;
                                global.lib_user.getList({
                                    find: cond,
                                    skip: (req.body.page - 1) * config_common.entry_per_page,
                                    limit: config_common.entry_per_page
                                }, cbk);
                            },
                            function (list, cbk) {
                                //根据count将数据修改成功
                                async.eachSeries(list, function (oneData, callback) {
                                    var obj = {tag: 'work'};//挂靠关系；affiliation:n. 友好关系；加入；联盟；从属关系
                                    async.waterfall([
                                        function (callback2) {
                                            obj._id = oneData._id.toString();
                                            obj.status = true;
                                            obj.real_name = oneData.real_name;
                                            obj.role = oneData.role;
                                            obj.photo_url = oneData.photo_url;
                                            obj.phone = oneData.phone;
                                            obj.post = oneData.post;
                                            global.lib_user_relation.getOne({
                                                find: {
                                                    user_id: req.decoded.id,
                                                    other_id: obj._id
                                                }
                                            }, callback2);
                                        },
                                        function (relation, callback2) {
                                            if (relation) {
                                                obj.friend = true;
                                            } else {
                                                obj.friend = false;
                                            }
                                            result.list.push(obj);
                                            callback2();
                                        }
                                    ], callback);
                                }, cbk);
                            }
                        ], cb)
                        break;
                    //司机挂靠:挂靠申请中
                    case 'DRIVER_2':
                        result.count = 0;
                        result.exist = false;
                        result.list = [];
                        cb();
                        break;
                    //司机挂靠:已邀请未上线(已邀请未上线的司机类型好友)
                    case 'DRIVER_3':
                        result.list = [];
                        async.waterfall([
                            function (cbk) {
                                //查询到已邀请未上线的类型为采购商的好友
                                lib_invitation_user.getCount({
                                    user_id: req.decoded.id,
                                    type: global.config_common.relation_style.FRIEND,
                                    extend: 'driver',
                                    status: 'PROCESSING'
                                }, cbk);
                            },
                            function (count, cbk) {
                                result.count = count;
                                result.exist = count > req.body.page * config_common.entry_per_page;
                                //需要修改邀请接口
                                lib_invitation_user.getList({
                                    find: {
                                        user_id: req.decoded.id,
                                        type: global.config_common.relation_style.FRIEND,
                                        extend: 'driver',
                                        status: 'PROCESSING'
                                    },
                                    skip: (req.body.page - 1) * config_common.entry_per_page,
                                    limit: config_common.entry_per_page
                                }, cbk);
                            },
                            function (list, cbk) {
                                result.list = _.map(list, function (num) {
                                    return {
                                        real_name: num.real_name,
                                        phone: num.phone,
                                        status: false,
                                        photo_url: '',
                                        post: ''
                                    };
                                });
                                cbk();
                            }
                        ], cb);
                        break;
                    //司机挂靠:单纯的好友关系(好友的关系类型为司机driver)
                    case 'DRIVER_4':
                        result.list = [];
                        var ids;
                        async.waterfall([
                            function (cbk) {
                                //查询到好友关系中的
                                global.lib_user_relation.getList({
                                    find: {
                                        user_id: req.decoded.id,
                                        type: global.config_common.relation_style.FRIEND,
                                        extend: 'driver'
                                    },
                                    select: 'other_id'
                                }, cbk);
                            },
                            function (relations, cbk) {
                                ids = _.pluck(relations, 'other_id');
                                global.lib_driver_verify.getList({
                                    find: {
                                        company_id: req.decoded.company_id[0],
                                        approve_id: req.decoded.id
                                    },
                                    select: 'user_id transport'
                                }, cbk);
                            },
                            function (verifies, cbk) {
                                ids = _.difference(ids, _.pluck(verifies, 'user_id'));
                                lib_user.getCountAll({_id: {$in: ids}}, cbk);
                            },
                            function (count, cbk) {
                                result.count = count;
                                result.exist = count > req.body.page * config_common.entry_per_page;
                                lib_user.getList_new({
                                    find: {_id: {$in: ids}},
                                    skip: (req.body.page - 1) * config_common.entry_per_page,
                                    limit: config_common.entry_per_page,
                                    select: 'real_name role post photo_url'
                                }, cbk);
                            },
                            function (list, cbk) {
                                list = JSON.parse(JSON.stringify(list));
                                result.list = _.map(list, function (num) {
                                    num.status = true;
                                    num.friend = true;
                                    return num;
                                });
                                result.list = list;
                                cbk();
                            }
                        ], cb);
                        break;
                    default :
                        return cb('type_is_err')
                        break;
                }
            },
        ], function (err) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, result, next);
        })
    });
    /**
     * ！！！--6.1.4新功能--->待优化，需要简单封装简化重复性代码
     * 功能：获取同事列表
     */
    api.post('/get_colleague', function (req, res, next) {
        var result = {list: []};
        async.waterfall([
            function (cb) {
                lib_user.getOneEasy({find: {_id: req.decoded.id}}, cb);
            },
            function (user, cb) {
                if (_.isArray(user.company_id)) {
                    req.decoded.company_id = user.company_id[0];
                }
                //查询自己公司的同事的个数
                if (req.decoded.company_id) {
                    lib_user.getCountAll({
                        company_id: req.decoded.company_id,
                        role: {$ne: global.config_common.user_roles.TRAFFIC_DRIVER_PRIVATE}
                    }, cb);
                } else {
                    cb(null, 0);
                }
            },
            function (count, cb) {
                //查询自己公司的同事的对应页数列表数据
                result.count = count;
                result.exist = count > req.body.page * config_common.entry_per_page;
                lib_user.getList_new({
                    find: {
                        company_id: req.decoded.company_id,
                        role: {$ne: global.config_common.user_roles.TRAFFIC_DRIVER_PRIVATE}
                    },
                    skip: (req.body.page - 1) * config_common.entry_per_page,
                    limit: config_common.entry_per_page,
                    select: 'real_name role post photo_url'
                }, cb);
            },
            function (list, cb) {
                list = JSON.parse(JSON.stringify(list));
                list = _.map(list, function (num) {
                    num.status = true;
                    return num;
                });
                async.eachSeries(list, function (oneData, callback) {
                    global.lib_user_relation.getOne({
                        find: {
                            user_id: req.decoded.id,
                            other_id: oneData._id
                        }
                    }, function (err, relation) {
                        if (relation) {
                            oneData.friend = true;
                        } else {
                            oneData.friend = false;
                        }
                        result.list.push(oneData);
                        callback();
                    });
                }, cb);
            },
            function (cb) {
                //判断是否需要添加已邀请未上线的同事
                if (!result.exist) {
                    lib_invitation_user.getList({
                        find: {
                            company_id: req.decoded.company_id,
                            user_id: req.decoded.id.toString(),
                            type: global.config_common.relation_style.COMPANY_INVITE,
                            status: 'PROCESSING'
                        }
                    }, cb);
                } else {
                    cb(null, null);
                }
            },
            function (list, cb) {
                if (list !== null) {
                    async.mapSeries(list, function (user, callback) {
                        callback(null, {
                            _id: user._id.toString(),
                            status: false,
                            real_name: user.real_name,
                            role: user.role,
                            phone: user.phone
                        })
                    }, cb);
                } else {
                    cb(null, null)
                }
            },
            function (list, cb) {
                if (list) {
                    result.list = result.list.concat(list);
                }
                cb();
            }
        ], function (err) {
            if (err) {
                return next(err);
            }
            global.config_common.sendData(req, result, next);
        })
    });
    /**
     * 功能：查询到物流角色的未分组司机
     */
    api.post('/get_no_team_driver', function (req, res, next) {
        var ids;
        var result = {};
        async.waterfall([
            function (cb) {
                global.lib_relation_group.getListGroup({
                    find: {
                        user_id: req.decoded.id,
                        type: "DRIVER"
                    },
                    select: 'name',
                }, cb);
            },
            function (groupList, cb) {
                global.lib_relation_group.getListGroupUser({
                    find: {"group_id": {$in: _.pluck(groupList, '_id')}},
                    select: 'member_id',
                }, cb);
            },
            function (groupUsers, cb) {
                ids = _.pluck(groupUsers, 'member_id')
                global.lib_driver_verify.getList({
                    find: {
                        company_id: req.decoded.company_id[0],
                        approve_id: req.decoded.id
                    },
                    select: 'user_id transport'
                }, cb);
            },
            function (verifies, cb) {
                ids = _.difference(_.pluck(verifies, 'user_id'), ids);
                lib_user.getCountAll({_id: {$in: ids}}, cb);
            },
            function (count, cb) {
                result.count = count;
                result.exist = count > req.body.page * config_common.entry_per_page;
                lib_user.getList({
                    find: {_id: {$in: ids},},
                    skip: (req.body.page - 1) * config_common.entry_per_page,
                    limit: config_common.entry_per_page,
                    select: 'real_name role post photo_url'
                }, cb);
            },
            function (list, cb) {
                list = JSON.parse(JSON.stringify(list));
                list = _.map(list, function (num) {
                    num.status = true;
                    return num;
                });
                result.list = list;
                cb();
            }
        ], function (err) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, result, next);
        })
    });
    /**
     * ！！！--6.1.4新功能--->待优化，需要简单封装简化重复性代码
     * 功能：除司机角色外的联系人界面6.1.13版本更新
     * 参数:page，type
     */
    api.post('/search_linkman2', function (req, res, next) {
        if (req.decoded.role === global.config_common.user_roles.TRAFFIC_DRIVER_PRIVATE) {
            return next('not_allow');
        }
        if (!_.isNumber(req.body.page)) {
            req.body.page = 1;
        }
        if (!req.body.type || !req.body.name) {
            return next('not_allow');
        }
        var selfData; //自己的个人数据
        var result = {};//最后传出去的数据
        // tag状态总结：(1)合作:work;(2)申请合作中:working;(3)未合作:NO
        // 补充:已邀请未上线status:false;
        // friend状态 true/false
        async.waterfall([
            function (cb) {
                //查询到自己的个人数据，用于之后的操作
                global.lib_user.getOne({find: {_id: req.decoded.id}}, cb);
            },
            function (user, cb) {
                if (!user) {
                    return cb('user_not_found');
                }
                selfData = user;
                switch (req.body.type) {
                    //采购合作:已合作
                    case 'PURCHASE_1':
                        //采购由四种列表构成
                        // (1)合作关系的采购商PURCHASE1
                        // (2)合作关系申请中的采购商PURCHASE2
                        // (3)已邀请未上线的采购商PURCHASE3
                        // (4)好友采购商PURCHASE4
                        // ！注意：(1)(2)两种状态添加是否是好友标签
                        result.list = [];
                        async.waterfall([
                            function (cbk) {
                                //查询合作关系的采购商-->
                                global.lib_work_relation.getList({
                                    find: {user_id: req.decoded.id, type: global.config_common.company_type.PURCHASE},
                                }, cbk);
                            },
                            function (list, cbk) {
                                global.lib_user.getListAll({
                                    find: {
                                        _id: {$in: _.pluck(list, 'other_user_id')},
                                        real_name: {$regex: req.body.name}
                                    }
                                }, cbk);
                            },
                            function (list, cbk) {
                                //根据count将数据修改成功
                                async.eachSeries(list, function (oneData, callback) {
                                    var obj = {tag: 'work'};
                                    async.waterfall([
                                        function (callback2) {
                                            obj._id = oneData._id.toString();
                                            obj.status = true;
                                            obj.real_name = oneData.real_name;
                                            obj.role = oneData.role;
                                            obj.photo_url = oneData.photo_url;
                                            obj.phone = oneData.phone;
                                            obj.post = oneData.post;
                                            lib_company.getOne({
                                                find: {_id: oneData.company_id}
                                            }, callback2);
                                        },
                                        function (company, callback2) {
                                            if (company) {
                                                obj.company_name = company.nick_name ? company.nick_name : company.full_name;
                                                obj.verify_phase = company.verify_phase ? company.verify_phase : company.verify_phase;
                                            }
                                            global.lib_user_relation.getOne({
                                                find: {
                                                    user_id: req.decoded.id,
                                                    other_id: obj._id
                                                }
                                            }, callback2);
                                        },
                                        function (relation, callback2) {
                                            if (relation) {
                                                obj.friend = true;
                                            } else {
                                                obj.friend = false;
                                            }
                                            result.list.push(obj);
                                            callback2();
                                        }
                                    ], callback);
                                }, cbk);
                            }
                        ], cb)
                        break;
                    //采购合作:申请中
                    case 'PURCHASE_2':
                        result.list = [];
                        async.waterfall([
                            function (cbk) {
                                global.lib_apply_relation.getList({
                                    find: {
                                        extend: 'SALE',
                                        status: 'WAIT',
                                        type: 'WORK',
                                        other_user_id: req.decoded.id
                                    },
                                }, cbk);
                            },
                            function (list, cbk) {
                                global.lib_user.getListAll({
                                    find: {
                                        _id: {$in: _.pluck(list, 'user_id')},
                                        real_name: {$regex: req.body.name}
                                    }
                                }, cbk);
                            },
                            function (list, cbk) {
                                async.eachSeries(list, function (oneData, callback) {
                                    var obj = {tag: 'working'};
                                    async.waterfall([
                                        function (callback2) {
                                            obj._id = oneData._id.toString();
                                            obj.status = true;
                                            obj.real_name = oneData.real_name;
                                            obj.role = oneData.role;
                                            obj.photo_url = oneData.photo_url;
                                            obj.phone = oneData.phone;
                                            obj.post = oneData.post;
                                            lib_company.getOne({
                                                find: {_id: oneData.company_id.toString()}
                                            }, callback2);
                                        },
                                        function (company, callback2) {
                                            obj.company_name = company.nick_name;
                                            obj.verify_phase = company.verify_phase ? company.verify_phase : company.verify_phase;
                                            global.lib_user_relation.getOne({
                                                find: {
                                                    user_id: req.decoded.id,
                                                    other_id: obj._id
                                                }
                                            }, callback2);
                                        },
                                        function (relation, callback2) {
                                            if (relation) {
                                                obj.friend = true;
                                            } else {
                                                obj.friend = false;
                                            }
                                            result.list.push(obj);
                                            callback2();
                                        }
                                    ], callback);
                                }, cbk);
                            }
                        ], cb);
                        break;
                    //采购合作:已邀请未上线(已邀请未上线的采购商类型好友)
                    case 'PURCHASE_3':
                        result.list = [];
                        async.waterfall([
                            function (cbk) {
                                lib_invitation_user.getList({
                                    find: {
                                        user_id: req.decoded.id,
                                        type: global.config_common.relation_style.FRIEND,
                                        extend: 'purchase',
                                        status: 'PROCESSING',
                                        real_name: {$regex: req.body.name}
                                    }
                                }, cbk);
                            },
                            function (list, cbk) {
                                result.list = _.map(list, function (num) {
                                    return {
                                        real_name: num.real_name,
                                        phone: num.phone,
                                        status: false,
                                        photo_url: '',
                                        post: ''
                                    };
                                });
                                cbk();
                            }
                        ], cb);
                        break;
                    //采购合作:单纯的好友关系(好友的关系类型为采购)
                    case 'PURCHASE_4':
                        result.list = [];
                        var ids;
                        async.waterfall([
                            function (cbk) {
                                //查询到好友关系中的
                                global.lib_user_relation.getList({
                                    find: {
                                        user_id: req.decoded.id,
                                        type: global.config_common.relation_style.FRIEND,
                                        extend: 'purchase'
                                    },
                                    select: 'other_id'
                                }, cbk);
                            },
                            function (relations, cbk) {
                                ids = _.pluck(relations, 'other_id');
                                global.lib_work_relation.getList({
                                    find: {user_id: req.decoded.id, type: global.config_common.company_type.PURCHASE},
                                    select: 'other_user_id'
                                }, cbk);
                            },
                            function (workList, cbk) {
                                ids = _.difference(ids, _.pluck(workList, 'other_user_id'));
                                global.lib_user.getListAll({
                                    find: {
                                        _id: {$in: ids},
                                        real_name: {$regex: req.body.name}
                                    },
                                    select: 'real_name role post photo_url'
                                }, cbk);
                            },
                            function (list, cbk) {
                                list = JSON.parse(JSON.stringify(list));
                                result.list = _.map(list, function (num) {
                                    num.status = true;
                                    num.friend = true
                                    return num;
                                });
                                result.list = list;
                                cbk();
                            }
                        ], cb);
                        break;

                    //销售合作:已合作
                    case 'SALE_1':
                        result.list = [];
                        var cond = {//确定查询条件
                            user_id: req.decoded.id,
                            type: global.config_common.company_type.SALE
                        };
                        async.waterfall([
                            function (cbk) {
                                global.lib_work_relation.getList({
                                    find: cond
                                }, cbk);
                            },
                            function (list, cbk) {
                                global.lib_user.getListAll({
                                    find: {
                                        _id: {$in: _.pluck(list, 'other_user_id')},
                                        real_name: {$regex: req.body.name}
                                    }
                                }, cbk);
                            },
                            function (list, cbk) {
                                //根据count将数据修改成功
                                async.eachSeries(list, function (oneData, callback) {
                                    var obj = {tag: 'work'};
                                    async.waterfall([
                                        function (callback2) {
                                            obj._id = oneData._id.toString();
                                            obj.status = true;
                                            obj.real_name = oneData.real_name;
                                            obj.role = oneData.role;
                                            obj.photo_url = oneData.photo_url;
                                            obj.phone = oneData.phone;
                                            obj.post = oneData.post;
                                            lib_company.getOne({
                                                find: {_id: oneData.company_id}
                                            }, callback2);
                                        },
                                        function (company, callback2) {
                                            if (company) {
                                                obj.company_name = company.nick_name ? company.nick_name : company.full_name;
                                                obj.verify_phase = company.verify_phase ? company.verify_phase : company.verify_phase;
                                            }
                                            global.lib_user_relation.getOne({
                                                find: {
                                                    user_id: req.decoded.id,
                                                    other_id: obj._id
                                                }
                                            }, callback2);
                                        },
                                        function (relation, callback2) {
                                            if (relation) {
                                                obj.friend = true;
                                            } else {
                                                obj.friend = false;
                                            }
                                            result.list.push(obj);
                                            callback2();
                                        }
                                    ], callback);
                                }, cbk);
                            }
                        ], cb)
                        break;
                    //销售合作:申请中
                    case 'SALE_2':
                        result.list = [];
                        var cond = {
                            extend: 'SALE',
                            status: 'WAIT',
                            type: 'work',
                            other_user_id: req.decoded.id
                        };
                        async.waterfall([
                            function (cbk) {
                                global.lib_apply_relation.getList({
                                    find: cond,
                                }, cbk);
                            },
                            function (list, cbk) {
                                global.lib_user.getListAll({
                                    find: {
                                        _id: {$in: _.pluck(list, 'user_id')},
                                        real_name: {$regex: req.body.name}
                                    }
                                }, cbk);
                            },
                            function (list, cbk) {
                                async.eachSeries(list, function (oneData, callback) {
                                    var obj = {tag: 'working'};
                                    async.waterfall([
                                        function (callback2) {
                                            obj._id = oneData._id.toString();
                                            obj.status = true;
                                            obj.real_name = oneData.real_name;
                                            obj.role = oneData.role;
                                            obj.photo_url = oneData.photo_url;
                                            obj.phone = oneData.phone;
                                            obj.post = oneData.post;
                                            lib_company.getOne({
                                                find: {_id: oneData.company_id.toString()}
                                            }, callback2);
                                        },
                                        function (company, callback2) {
                                            obj.company_name = company.nick_name;
                                            obj.verify_phase = company.verify_phase ? company.verify_phase : company.verify_phase;
                                            global.lib_user_relation.getOne({
                                                find: {
                                                    user_id: req.decoded.id,
                                                    other_id: obj._id
                                                }
                                            }, callback2);
                                        },
                                        function (relation, callback2) {
                                            if (relation) {
                                                obj.friend = true;
                                            } else {
                                                obj.friend = false;
                                            }
                                            result.list.push(obj);
                                            callback2();
                                        }
                                    ], callback);
                                }, cbk);
                            }
                        ], cb);
                        break;
                    //销售合作:已邀请未上线(已邀请未上线的销售商类型好友)
                    case 'SALE_3':
                        result.list = [];
                        async.waterfall([
                            function (cbk) {
                                //查询到已邀请未上线的类型为采购商的好友
                                lib_invitation_user.getList({
                                    find: {
                                        user_id: req.decoded.id,
                                        type: global.config_common.relation_style.FRIEND,
                                        extend: 'sale',
                                        status: 'PROCESSING'
                                    },
                                }, cbk);
                            },
                            function (list, cbk) {
                                result.list = _.map(list, function (num) {
                                    return {
                                        real_name: num.real_name,
                                        phone: num.phone,
                                        status: false,
                                        photo_url: '',
                                        post: ''
                                    };
                                });
                                cbk();
                            }
                        ], cb);
                        break;
                    //销售合作:单纯的好友关系(好友的关系类型为销售)
                    case 'SALE_4':
                        result.list = [];
                        var ids;
                        async.waterfall([
                            function (cbk) {
                                //查询到好友关系中的
                                global.lib_user_relation.getList({
                                    find: {
                                        user_id: req.decoded.id,
                                        type: global.config_common.relation_style.FRIEND,
                                        extend: 'sale'
                                    },
                                    select: 'other_id'
                                }, cbk);
                            },
                            function (relations, cbk) {
                                ids = _.pluck(relations, 'other_id');
                                global.lib_work_relation.getList({
                                    find: {user_id: req.decoded.id, type: global.config_common.company_type.SALE},
                                    select: 'other_user_id'
                                }, cbk);
                            },
                            function (workList, cbk) {
                                ids = _.difference(ids, _.pluck(workList, 'other_user_id'));
                                global.lib_user.getListAll({
                                    find: {
                                        _id: {$in: ids},
                                        real_name: {$regex: req.body.name}
                                    },
                                    select: 'real_name role post photo_url'
                                }, cbk);
                            },
                            function (list, cbk) {
                                list = JSON.parse(JSON.stringify(list));
                                result.list = _.map(list, function (num) {
                                    num.status = true;
                                    num.friend = true;
                                    return num;
                                });
                                result.list = list;
                                cbk();
                            }
                        ], cb);
                        break;

                    //物流合作:已合作
                    case 'TRAFFIC_1':
                        result.list = [];
                        var cond = {//确定查询条件
                            user_id: req.decoded.id,
                            type: global.config_common.company_type.SALE
                        };
                        async.waterfall([
                            function (cbk) {
                                //查询合作关系的采购商-->
                                global.lib_work_relation.getList({
                                    find: cond,
                                }, cbk);
                            },
                            function (list, cbk) {
                                global.lib_user.getListAll({
                                    find: {
                                        _id: {$in: _.pluck(list, 'other_user_id')},
                                        real_name: {$regex: req.body.name}
                                    }
                                }, cbk);
                            },
                            function (list, cbk) {
                                //根据count将数据修改成功
                                async.eachSeries(list, function (oneData, callback) {
                                    var obj = {tag: 'work'};
                                    async.waterfall([
                                        function (callback2) {
                                            obj._id = oneData._id.toString();
                                            obj.status = true;
                                            obj.real_name = oneData.real_name;
                                            obj.role = oneData.role;
                                            obj.photo_url = oneData.photo_url;
                                            obj.phone = oneData.phone;
                                            obj.post = oneData.post;
                                            lib_company.getOne({
                                                find: {_id: oneData.company_id}
                                            }, callback2);
                                        },
                                        function (company, callback2) {
                                            obj.company_name = company.nick_name ? company.nick_name : company.full_name;
                                            obj.verify_phase = company.verify_phase ? company.verify_phase : company.verify_phase;
                                            global.lib_user_relation.getOne({
                                                find: {
                                                    user_id: req.decoded.id,
                                                    other_id: obj._id
                                                }
                                            }, callback2);
                                        },
                                        function (relation, callback2) {
                                            if (relation) {
                                                obj.friend = true;
                                            } else {
                                                obj.friend = false;
                                            }
                                            result.list.push(obj);
                                            callback2();
                                        }
                                    ], callback);
                                }, cbk);
                            }
                        ], cb)
                        break;
                    //物流合作:申请中
                    case 'TRAFFIC_2':
                        result.list = [];
                        var cond = {
                            extend: 'SALE',
                            status: 'WAIT',
                            type: 'work',
                            other_user_id: req.decoded.id
                        };
                        async.waterfall([
                            function (cbk) {
                                //查询到申请中的采购商
                                global.lib_apply_relation.getList({
                                    find: cond,
                                    skip: (req.body.page - 1) * config_common.entry_per_page,
                                    limit: config_common.entry_per_page
                                }, cbk);
                            },
                            function (list, cbk) {
                                global.lib_user.getListAll({
                                    find: {
                                        _id: {$in: _.pluck(list, 'user_id')},
                                        real_name: {$regex: req.body.name}
                                    }
                                }, cbk);
                            },
                            function (list, cbk) {
                                async.eachSeries(list, function (oneData, callback) {
                                    var obj = {tag: 'working'};
                                    async.waterfall([
                                        function (callback2) {
                                            obj._id = oneData._id.toString();
                                            obj.status = true;
                                            obj.real_name = oneData.real_name;
                                            obj.role = oneData.role;
                                            obj.photo_url = oneData.photo_url;
                                            obj.phone = oneData.phone;
                                            obj.post = oneData.post;
                                            lib_company.getOne({
                                                find: {_id: oneData.company_id.toString()}
                                            }, callback2);
                                        },
                                        function (company, callback2) {
                                            obj.company_name = company.nick_name;
                                            obj.verify_phase = company.verify_phase ? company.verify_phase : company.verify_phase;
                                            global.lib_user_relation.getOne({
                                                find: {
                                                    user_id: req.decoded.id,
                                                    other_id: obj._id
                                                }
                                            }, callback2);
                                        },
                                        function (relation, callback2) {
                                            if (relation) {
                                                obj.friend = true;
                                            } else {
                                                obj.friend = false;
                                            }
                                            result.list.push(obj);
                                            callback2();
                                        }
                                    ], callback);
                                }, cbk);
                            }
                        ], cb);
                        break;
                    //物流合作:已邀请未上线(已邀请未上线的物流商类型好友)
                    case 'TRAFFIC_3':
                        result.list = [];
                        async.waterfall([
                            function (cbk) {
                                //查询到已邀请未上线的类型为采购商的好友
                                lib_invitation_user.getList({
                                    find: {
                                        user_id: req.decoded.id,
                                        type: global.config_common.relation_style.FRIEND,
                                        extend: 'traffic',
                                        status: 'PROCESSING',
                                        real_name: {$regex: req.body.name}
                                    },
                                    skip: (req.body.page - 1) * config_common.entry_per_page,
                                    limit: config_common.entry_per_page
                                }, cbk);
                            },
                            function (list, cbk) {
                                result.list = _.map(list, function (num) {
                                    return {
                                        real_name: num.real_name,
                                        phone: num.phone,
                                        status: false,
                                        photo_url: '',
                                        post: ''
                                    };
                                });
                                cbk();
                            }
                        ], cb);
                        break;
                    //物流合作:单纯的好友关系(好友的关系类型为物流)
                    case 'TRAFFIC_4':
                        result.list = [];
                        var ids;
                        async.waterfall([
                            function (cbk) {
                                //查询到好友关系中的
                                global.lib_user_relation.getList({
                                    find: {
                                        user_id: req.decoded.id,
                                        type: global.config_common.relation_style.FRIEND,
                                        extend: 'purchase'
                                    },
                                    select: 'other_id'
                                }, cbk);
                            },
                            function (relations, cbk) {
                                ids = _.pluck(relations, 'other_id');
                                global.lib_work_relation.getList({
                                    find: {user_id: req.decoded.id, type: global.config_common.company_type.PURCHASE},
                                    select: 'other_user_id'
                                }, cbk);
                            },
                            function (workList, cbk) {
                                ids = _.difference(ids, _.pluck(workList, 'other_user_id'));
                                global.lib_work_relation.getList({
                                    find: {user_id: req.decoded.id, type: global.config_common.company_type.PURCHASE},
                                    select: 'other_user_id'
                                }, cbk);
                            },
                            function (list, cbk) {
                                list = JSON.parse(JSON.stringify(list));
                                result.list = _.map(list, function (num) {
                                    num.status = true;
                                    num.friend = true;
                                    return num;
                                });
                                result.list = list;
                                cbk();
                            }
                        ], cb);
                        break;

                    //司机挂靠:已挂靠
                    case 'DRIVER_1':
                        result.list = [];
                        var cond;
                        async.waterfall([
                            function (cbk) {
                                if (req.decoded.role === global.config_common.user_roles.TRAFFIC_ADMIN) {
                                    //先查询自己的挂靠司机的关系，然后再查询到挂靠司机
                                    global.lib_driver_verify.getList({
                                        find: {
                                            company_id: req.decoded.company_id[0],
                                            approve_id: req.decoded.id
                                        },
                                        select: 'user_id transport'
                                    }, function (err, verifies) {
                                        if (err) {
                                            return cb(err);
                                        }
                                        var user_ids = _.pluck(verifies, 'user_id');
                                        cond = {_id: {$in: user_ids}};
                                        lib_user.getCountAll(cond.find, cbk);
                                    });
                                } else {
                                    cbk(null, 0);
                                }
                            },
                            function (count, cbk) {
                                result.count = count;
                                result.exist = count > req.body.page * config_common.entry_per_page;
                                global.lib_work_relation.getList({
                                    find: cond,
                                    skip: (req.body.page - 1) * config_common.entry_per_page,
                                    limit: config_common.entry_per_page
                                }, cbk);
                            },
                            function (list, cbk) {
                                //根据count将数据修改成功
                                async.eachSeries(list, function (oneData, callback) {
                                    var obj = {tag: 'affiliation'};//挂靠关系；affiliation:n. 友好关系；加入；联盟；从属关系
                                    async.waterfall([
                                        function (callback2) {
                                            lib_user.getOne({
                                                find: {_id: oneData.other_user_id}
                                            }, callback2);
                                        },
                                        function (user, callback2) {
                                            if (user) {
                                                obj._id = user._id.toString();
                                                obj.status = true;
                                                obj.real_name = user.real_name;
                                                obj.role = user.role;
                                                obj.photo_url = user.photo_url;
                                                obj.phone = user.phone;
                                                obj.post = user.post;
                                                global.lib_user_relation.getOne({
                                                    find: {
                                                        user_id: req.decoded.id,
                                                        other_id: obj._id
                                                    }
                                                }, callback2);
                                            } else {
                                                //没有这个人直接 出去
                                                callback();
                                            }
                                        },
                                        function (relation, callback2) {
                                            if (relation) {
                                                obj.friend = true;
                                            } else {
                                                obj.friend = false;
                                            }
                                            result.list.push(obj);
                                            callback2();
                                        }
                                    ], callback);
                                }, cbk);
                            }
                        ], cb)
                        break;
                    //司机挂靠:挂靠申请中
                    case 'DRIVER_2':
                        cb();
                        break;
                    //司机挂靠:已邀请未上线(已邀请未上线的司机类型好友)
                    case 'DRIVER_3':
                        cb();
                        break;
                    //司机挂靠:单纯的好友关系(好友的关系类型为司机driver)
                    case 'DRIVER_4':
                        result.list = [];
                        var cond;
                        async.waterfall([
                            function (cbk) {
                                //查询到好友关系中的
                                global.lib_user_relation.getList({
                                    find: {
                                        user_id: req.decoded.id,
                                        type: global.config_common.relation_style.FRIEND,
                                        //extend:'PURCHASE'
                                    },
                                    select: 'other_id'
                                }, cbk);
                            },
                            function (relations, cbk) {
                                var user_ids = global.lib_util.transObjArrToSigArr(relations, 'other_id');
                                cond = {find: {_id: {$in: user_ids}}};
                                lib_user.getCountAll(cond.find, cbk);
                            },
                            function (count, cbk) {
                                result.count = count;
                                result.exist = count > req.body.page * config_common.entry_per_page;
                                lib_user.getList_new({
                                    find: cond.find,
                                    skip: (req.body.page - 1) * config_common.entry_per_page,
                                    limit: config_common.entry_per_page,
                                    select: 'real_name role post photo_url'
                                }, cbk);
                            },
                            function (list, cbk) {
                                list = JSON.parse(JSON.stringify(list));
                                result.list = _.map(list, function (num) {
                                    num.status = true;
                                    num.friend = true;
                                    return num;
                                });
                                result.list = list;
                                cbk();
                            }
                        ], cb);
                        break;

                    default :
                        return cb('type_is_err')
                        break;
                }
            },
        ], function (err) {
            if (err) {
                return next(err);
            }
            config_common.sendData(req, result, next);
        })
    });

    /**
     * ！！！--6.1.4新功能--->待优化，需要简单封装简化重复性代码
     * 功能：获取同事列表
     */
    api.post('/search_colleague', function (req, res, next) {
        if (!req.body.name) {
            return next('not_allow');
        }
        var result = {};
        async.waterfall([
            function (cb) {
                //查询自己公司的同事的对应页数列表数据
                lib_user.getListAll({
                    find: {
                        company_id: req.decoded.company_id,
                        real_name: {$regex: req.body.name}
                    },
                    select: 'real_name role post photo_url'
                }, cb);
            },
            function (list, cb) {
                list = JSON.parse(JSON.stringify(list));
                result.list = _.map(list, function (num) {
                    num.status = true;
                    return num;
                });
                //判断是否需要添加已邀请未上线的同事
                if (!result.exist) {
                    lib_invitation_user.getList({
                        find: {
                            company_id: req.decoded.company_id,
                            user_id: req.decoded.id.toString(),
                            type: global.config_common.relation_style.COMPANY_INVITE,
                            status: 'PROCESSING',
                            real_name: {$regex: req.body.name}
                        }
                    }, cb);
                } else {
                    cb(null, null);
                }
            },
            function (list, cb) {
                if (list != null) {
                    async.mapSeries(list, function (user, callback) {
                        callback(null, {
                            _id: user._id.toString(),
                            status: false,
                            real_name: user.real_name,
                            role: user.role,
                            phone: user.phone
                        })
                    }, cb);
                } else {
                    cb(null, null)
                }
            },
            function (list, cb) {
                if (list) {
                    result.list = result.list.concat(list);
                }
                cb();
            }
        ], function (err) {
            if (err) {
                return next(err);
            }
            global.config_common.sendData(req, result, next);
        })
    });
    //搜索好友功能
    api.post('/search', function (req, res, next) {
        if (req.decoded.role === global.config_common.user_roles.TRAFFIC_DRIVER_PRIVATE) {
            return next('not_allow');
        }
        if (!_.isNumber(req.body.page)) {
            req.body.page = 1;
        }
        if (!req.body.type) {
            return next('not_allow');
        }
        var list = [];
        var count = 0;
        var userData1;
        var userData2;
        var hanZi;
        var result = [];
        var cond = {};
        var exist;
        var arr;
        var arr02;
        switch (req.body.type) {
            case 'COLLEAGUE': {
                async.waterfall([
                    function (cbk) {
                        global.lib_user.getOne({find: {_id: req.decoded.id}}, cbk);
                    },
                    function (user_w, cbk) {
                        req.decoded.company_id = user_w.company_id;
                        cbk();
                    },
                    function (cbk) {
                        global.lib_http.sendTradeServer({
                            method: 'getList',
                            cond: {find: {lev: 0}},
                            model: 'Classify'
                        }, global.config_api_url.trade_server_get_hanzi, cbk);
                    },
                    function (pei_zhi, cbk) {
                        hanZi = _.indexBy(pei_zhi, 'eng');
                        //var cond = {};
                        if (req.decoded.role === global.config_common.user_roles.TRAFFIC_ADMIN || req.decoded.role === global.config_common.user_roles.TRADE_STORAGE) {
                            cond.find = {real_name: {$regex: req.body.name}};
                            cond.find['$or'] = [];
                            if (req.decoded.role === global.config_common.user_roles.TRADE_STORAGE) {
                                cond.find['$or'].push({
                                    company_id: req.decoded.company_id
                                });
                            } else {
                                cond.find['$or'].push({
                                    company_id: req.decoded.company_id[0],
                                    role: {$in: [global.config_common.user_roles.TRAFFIC_ADMIN, global.config_common.user_roles.TRADE_STORAGE]}
                                });
                            }
                            //同事屏蔽司机
                            // global.lib_driver_verify.getList({
                            //     find: {
                            //         approve_id: req.decoded.id,
                            //         status: global.config_common.verification_phase.SUCCESS
                            //     },
                            //     select: 'user_id'
                            // }, function (err, verifies) {
                            //     if (err) {
                            //         return cb(err);
                            //     }
                            //     var user_ids = _.pluck(verifies, 'user_id');
                            //     cond.find['$or'].push({_id: {$in: user_ids}});
                            if (req.decoded.role === global.config_common.user_roles.TRADE_STORAGE) {
                                if (req.decoded.company_id) {
                                    lib_user.getCountAll(cond.find, cbk);
                                } else {
                                    cbk(null, []);
                                }
                            } else {
                                lib_user.getCountAll(cond.find, cbk);
                            }
                        } else {
                            if (req.decoded.company_id) {
                                cond = {find: {company_id: req.decoded.company_id}};
                                lib_user.getCountAll(cond.find, cbk);
                            } else {
                                cbk(null, []);
                            }
                        }
                    },
                    function (data, cbk) {
                        count = data;
                        exist = data > req.body.page * config_common.entry_per_page;
                        lib_user.getList_new({
                            find: {company_id: req.decoded.company_id, real_name: {$regex: req.body.name}},
                            skip: (req.body.page - 1) * config_common.entry_per_page,
                            limit: config_common.entry_per_page
                        }, cbk);
                    },
                    function (data, cbk) {
                        userData1 = data;
                        lib_company.getListAll({
                            find: {_id: {$in: _.compact(_.flatten(_.pluck(data, 'company_id')))}},
                            select: 'verify_phase'
                        }, cbk)
                    },
                    function (company, cbk) {
                        var companyObj = global.lib_util.transObjArrToObj(company, '_id');
                        for (var i = 0; i < userData1.length; i++) {
                            if (_.isArray(userData1[i])) {
                                userData1[i].verify_phase = companyObj[userData1[i].company_id[0]].verify_phase || "";
                            } else {
                                if (companyObj[userData1[i].company_id]) {
                                    userData1[i].verify_phase = companyObj[userData1[i].company_id].verify_phase || "";
                                } else {
                                    userData1[i].verify_phase = "";
                                }
                            }
                        }
                        async.eachSeries(userData1, function (user, callback) {
                            (function (user) {
                                // if (user.role != global.config_common.user_roles.TRADE_STORAGE) {
                                var obj = {
                                    _id: user._id.toString(),
                                    status: true,
                                    name: user.real_name,
                                    role: user.role,
                                    img: user.photo_url,
                                    phone: user.phone,
                                    verify_phase: user.verify_phase,
                                    post: user.post,
                                    sell: _.map(user.sell, function (num) {
                                        return hanZi[num].chn;
                                    }),
                                    buy: _.map(user.buy, function (num) {
                                        return hanZi[num].chn;
                                    }),
                                    transport: _.map(user.transport, function (num) {
                                        return hanZi[num].chn;
                                    })
                                };
                                list.push(obj);
                                // }
                            })(user);
                            callback();
                        }, cbk);
                    },
                    function (cbk) {
                        // if(req.decoded.role == global.config_common.user_roles.TRAFFIC_ADMIN ||
                        //     req.decoded.role == global.config_common.user_roles.TRADE_ADMIN){
                        lib_invitation_user.getList({
                            find: {
                                real_name: {$regex: req.body.name},
                                company_id: req.decoded.company_id,
                                user_id: req.decoded.id,
                                type: global.config_common.relation_style.COMPANY_INVITE,
                                status: 'PROCESSING'
                            }
                        }, cbk);
                        // }else{
                        //     cbk(null, []);
                        // }
                    },
                    function (result, cbk) {
                        async.eachSeries(result, function (user, callback) {
                            (function (user) {
                                // if (user.role != global.config_common.user_roles.TRADE_STORAGE) {
                                var obj = {
                                    _id: user._id.toString(),
                                    status: false,
                                    name: user.real_name,
                                    role: user.role,
                                    phone: user.phone,
                                    post: user.post,
                                    sell: user.sell,
                                    buy: user.buy,
                                    transport: user.transport
                                };
                                list.push(obj);
                                // }
                            })(user);
                            callback();
                        }, cbk);
                    },
                    function (cbk) {
                        cbk(null, {
                            list: list,
                            count: count,
                            exist: exist
                        });
                    }
                ], function (err, result) {
                    if (err) {
                        return next(err);
                    }
                    config_common.sendData(req, result, next);
                });
            }
                break;
            case 'DRIVER': {
                async.waterfall([
                    function (cbk) {
                        global.lib_user.getOne({find: {_id: req.decoded.id}}, cbk);
                    },
                    function (user_w, cbk) {
                        req.decoded.company_id = user_w.company_id;
                        cbk();
                    },
                    function (cbk) {
                        global.lib_http.sendTradeServer({
                            method: 'getList',
                            cond: {find: {lev: 0}},
                            model: 'Classify'
                        }, global.config_api_url.trade_server_get_hanzi, cbk);
                    },
                    function (pei_zhi, cbk) {
                        hanZi = _.indexBy(pei_zhi, 'eng');
                        cbk();
                    },
                    function (cbk) {
                        if (req.decoded.role === global.config_common.user_roles.TRAFFIC_ADMIN) {
                            //先查询自己的挂靠司机的关系，然后再查询到挂靠司机
                            global.lib_driver_verify.getList({
                                find: {
                                    company_id: req.decoded.company_id[0],
                                    approve_id: req.decoded.id
                                },
                                select: 'user_id transport'
                            }, function (err, verifies) {
                                if (err) {
                                    return cb(err);
                                }
                                var user_ids = _.pluck(verifies, 'user_id');
                                cond.find = {_id: {$in: user_ids}};
                                lib_user.getCount(cond, cbk);
                            });
                        } else {
                            cbk(null, []);
                        }
                    },
                    function (data, cbk) {
                        count = data;
                        result.exist = data > req.body.page * config_common.entry_per_page;
                        lib_user.getList({
                            find: cond.find,
                            skip: (req.body.page - 1) * config_common.entry_per_page,
                            limit: config_common.entry_per_page
                        }, cbk);
                    },
                    function (data, cbk) {
                        userData1 = data;
                        async.eachSeries(userData1, function (user, callback) {
                            (function (user) {
                                var obj = {
                                    _id: user._id.toString(),
                                    status: true,
                                    name: user.real_name,
                                    role: user.role,
                                    img: user.photo_url,
                                    phone: user.phone,
                                    transport: _.map(user.transport, function (num) {
                                        return hanZi[num] ? hanZi[num].chn : '';
                                    })
                                };
                                list.push(obj);
                            })(user);
                            callback();
                        }, cbk);
                    },
                    function (cbk) {
                        cbk(null, {
                            list: list,
                            count: count
                        });
                    }
                ], function (err, result) {
                    if (err) {
                        return next(err);
                    }
                    config_common.sendData(req, result, next);
                });
            }
                break;
            case 'FRIEND': {
                async.waterfall([
                    function (cbk) {
                        global.lib_user.getOne({find: {_id: req.decoded.id}}, cbk);
                    },
                    function (user_w, cbk) {
                        req.decoded.company_id = user_w.company_id;
                        cbk();
                    },
                    function (cbk) {
                        global.lib_http.sendTradeServer({
                            method: 'getList',
                            cond: {find: {lev: 0}},
                            model: 'Classify'
                        }, global.config_api_url.trade_server_get_hanzi, cbk);
                    },
                    function (pei_zhi, cbk) {
                        hanZi = _.indexBy(pei_zhi, 'eng');
                        global.lib_user_relation.getList({
                            find: {user_id: req.decoded.id, type: global.config_common.relation_style.FRIEND},
                            select: 'other_id'
                        }, cbk);
                    },
                    function (relations, cbk) {
                        var user_ids = global.lib_util.transObjArrToSigArr(relations, 'other_id');
                        cond = {find: {_id: {$in: user_ids}, real_name: {$regex: req.body.name}}};
                        lib_user.getCountAll(cond.find, cbk);
                    },
                    function (data, cbk) {
                        count = data;
                        exist = data > req.body.page * config_common.entry_per_page;
                        lib_user.getListAll({
                            find: cond.find,
                            skip: (req.body.page - 1) * config_common.entry_per_page,
                            limit: config_common.entry_per_page
                        }, cbk);
                    },
                    function (data, cbk) {
                        userData2 = data;
                        lib_company.getList({
                            find: {_id: {$in: _.compact(_.flatten(_.pluck(data, 'company_id')))}},
                            select: 'verify_phase'
                        }, cbk)
                    },
                    function (company, cbk) {
                        //count = data.length;
                        async.eachSeries(userData2, function (user, callback) {
                            (function (user) {
                                var obj = {
                                    _id: user._id.toString(),
                                    status: true,
                                    name: user.real_name,
                                    role: user.role,
                                    img: user.photo_url,
                                    phone: user.phone,
                                    verify_phase: user.verify_phase,
                                    post: user.post,
                                    sell: _.map(user.sell, function (num) {
                                        return hanZi[num] ? hanZi[num].chn : '';
                                    }),
                                    buy: _.map(user.buy, function (num) {
                                        return hanZi[num] ? hanZi[num].chn : '';
                                    }),
                                    transport: _.map(user.transport, function (num) {
                                        return hanZi[num] ? hanZi[num].chn : '';
                                    })
                                };
                                list.push(obj);
                            })(user);
                            callback();
                        }, cbk);
                    },
                    function (cbk) {
                        // if(req.decoded.role == global.config_common.user_roles.TRAFFIC_ADMIN ||
                        //     req.decoded.role == global.config_common.user_roles.TRADE_ADMIN){
                        lib_invitation_user.getList({
                            find: {
                                user_id: req.decoded.id,
                                type: global.config_common.relation_style.FRIEND,
                                status: 'PROCESSING'
                            }
                        }, cbk);
                        // }else{
                        //     cbk(null, []);
                        // }
                    },
                    function (result, cbk) {
                        count += result.length;
                        async.eachSeries(result, function (user, callback) {
                            (function (user) {
                                var obj = {
                                    _id: user._id.toString(),
                                    status: false,
                                    name: user.real_name,
                                    role: user.role,
                                    phone: user.phone,
                                    post: user.post,
                                    sell: _.map(user.sell, function (num) {
                                        return hanZi[num].chn;
                                    }),
                                    buy: _.map(user.buy, function (num) {
                                        return hanZi[num].chn;
                                    }),
                                    transport: _.map(user.transport, function (num) {
                                        return hanZi[num].chn;
                                    })
                                };
                                list.push(obj);
                            })(user);
                            callback();
                        }, cbk);
                    },
                    function (cbk) {
                        cbk(null, {
                            list: list,
                            count: count,
                            exist: exist
                        });
                    }
                ], function (err, result) {
                    if (err) {
                        return next(err);
                    }
                    config_common.sendData(req, result, next);
                });
            }
                break;
            case 'PURCHASE': {
                async.waterfall([
                    function (cbk) {
                        global.lib_user.getOne({find: {_id: req.decoded.id}}, cbk);
                    },
                    function (user_w, cbk) {
                        req.decoded.company_id = user_w.company_id;
                        cbk();
                    },
                    function (cbk) {
                        global.lib_http.sendTradeServer({
                            method: 'getList',
                            cond: {find: {lev: 0}},
                            model: 'Classify'
                        }, global.config_api_url.trade_server_get_hanzi, cbk);
                    },
                    function (pei_zhi, cbk) {
                        hanZi = _.indexBy(pei_zhi, 'eng');
                        global.lib_work_relation.getCount({
                            user_id: req.decoded.id,
                            type: global.config_common.company_type.PURCHASE,
                            real_name: {$regex: req.body.name}
                        }, cbk);
                    },
                    function (data, cbk) {
                        count += data;
                        result.exist = data > req.body.page * config_common.entry_per_page;
                        global.lib_work_relation.getList({
                            find: {
                                user_id: req.decoded.id,
                                type: global.config_common.company_type.PURCHASE,
                                real_name: {$regex: req.body.name}
                            },
                            skip: (req.body.page - 1) * config_common.entry_per_page,
                            limit: config_common.entry_per_page
                        }, cbk);
                    },
                    function (data, cbk) {
                        async.eachSeries(data, function (user_invitation, callback) {
                            (function (user_invitation) {
                                var obj = {};
                                obj.status = true;
                                async.waterfall([
                                    function (cback) {
                                        lib_user.getOne({
                                            find: {_id: user_invitation.other_user_id}
                                        }, cback);
                                    },
                                    function (user, cback) {
                                        if (user) {
                                            obj._id = user._id.toString();
                                            obj.status = true;
                                            obj.name = user.real_name;
                                            obj.role = user.role;
                                            obj.img = user.photo_url;
                                            obj.phone = user.phone;
                                            obj.post = user.post;
                                            obj.sell = _.map(user.sell, function (num) {
                                                return hanZi[num].chn;
                                            });
                                            obj.buy = _.map(user.buy, function (num) {
                                                return hanZi[num].chn;
                                            });
                                            obj.transport = _.map(user.transport, function (num) {
                                                return hanZi[num].chn;
                                            });
                                            lib_company.getOne({
                                                find: {_id: user_invitation.other_company_id}
                                            }, cback);
                                        } else {
                                            cback(null, null);
                                        }
                                    },
                                    function (company, cback) {
                                        if (company) {
                                            obj.company_name = company.nick_name ? company.nick_name : company.full_name;
                                            obj.verify_phase = company.verify_phase ? company.verify_phase : company.verify_phase;
                                            obj.sell = _.map(company.sell, function (num) {
                                                return hanZi[num].chn;
                                            });
                                            obj.buy = _.map(company.buy, function (num) {
                                                return hanZi[num].chn;
                                            });
                                            obj.transport = _.map(company.transport, function (num) {
                                                return hanZi[num].chn;
                                            });
                                            result.push(obj);
                                        }
                                        cback();
                                    }
                                ], callback);
                            })(user_invitation);
                        }, cbk);
                    },
                    function (cbk) {
                        cbk(null, {
                            list: result,
                            count: count
                        });
                    }
                ], function (err, result) {
                    if (err) {
                        return next(err);
                    }
                    config_common.sendData(req, result, next);
                });
            }
                break;
            case 'SALE': {
                async.waterfall([
                    function (cbk) {
                        global.lib_user.getOne({find: {_id: req.decoded.id}}, cbk);
                    },
                    function (user_w, cbk) {
                        req.decoded.company_id = user_w.company_id;
                        cbk();
                    },
                    function (cbk) {
                        global.lib_http.sendTradeServer({
                            method: 'getList',
                            cond: {find: {lev: 0}},
                            model: 'Classify'
                        }, global.config_api_url.trade_server_get_hanzi, cbk);
                    },
                    function (pei_zhi, cbk) {
                        hanZi = _.indexBy(pei_zhi, 'eng');
                        global.lib_work_relation.getCount({
                            user_id: req.decoded.id,
                            type: global.config_common.company_type.SALE
                        }, cbk);
                    },
                    function (data, cbk) {
                        global.lib_work_relation.getList({
                            find: {user_id: req.decoded.id, type: global.config_common.company_type.SALE},
                            select: 'other_company_id'
                        }, cbk);
                    },
                    function (data, cbk) {
                        arr02 = _.pluck(data, 'other_company_id');
                        global.lib_work_relation.getList({
                            find: {user_id: req.decoded.id, type: global.config_common.company_type.SALE},
                            select: 'other_user_id'
                        }, cbk);
                    },
                    function (data, cbk) {
                        arr = _.pluck(data, 'other_user_id');
                        lib_user.getCountAll({_id: {$in: arr}, real_name: {$regex: req.body.name}}, cbk);
                    },
                    function (data, cbk) {
                        count = data;
                        result.exist = data > req.body.page * config_common.entry_per_page;
                        lib_user.getList({
                            find: {_id: {$in: arr}, real_name: {$regex: req.body.name}},
                            skip: (req.body.page - 1) * config_common.entry_per_page,
                            limit: config_common.entry_per_page
                        }, cbk);
                    },
                    function (data, cbk) {
                        async.eachSeries(data, function (user, callback) {
                            (function (user) {
                                var obj = {};
                                obj.status = true;
                                async.waterfall([
                                    function (cback) {
                                        if (user) {
                                            obj._id = user._id.toString();
                                            obj.status = true;
                                            obj.name = user.real_name;
                                            obj.role = user.role;
                                            obj.img = user.photo_url;
                                            obj.phone = user.phone;
                                            obj.post = user.post;
                                            obj.sell = _.map(user.sell, function (num) {
                                                return hanZi[num].chn;
                                            });
                                            obj.buy = _.map(user.buy, function (num) {
                                                return hanZi[num].chn;
                                            });
                                            obj.transport = _.map(user.transport, function (num) {
                                                return hanZi[num].chn;
                                            });
                                        }
                                        lib_company.getOne({
                                            find: {_id: {$in: arr02}}
                                        }, cback);
                                    },
                                    function (company, cback) {
                                        obj.company_name = company.nick_name ? company.nick_name : company.full_name;
                                        obj.verify_phase = company.verify_phase ? company.verify_phase : company.verify_phase;
                                        obj.sell = _.map(company.sell, function (num) {
                                            return hanZi[num].chn;
                                        });
                                        obj.buy = _.map(company.buy, function (num) {
                                            return hanZi[num].chn;
                                        });
                                        obj.transport = _.map(company.transport, function (num) {
                                            return hanZi[num].chn;
                                        });
                                        result.push(obj);
                                        cback();
                                    }
                                ], callback);
                            })(user);
                        }, cbk);
                    },
                    function (cbk) {
                        cbk(null, {
                            list: result,
                            count: count
                        });
                    }
                ], function (err, result) {
                    if (err) {
                        return next(err);
                    }
                    config_common.sendData(req, result, next);
                });
            }
                break;
            case 'TRAFFIC': {
                async.waterfall([
                    function (cbk) {
                        global.lib_user.getOne({find: {_id: req.decoded.id}}, cbk);
                    },
                    function (user_w, cbk) {
                        req.decoded.company_id = user_w.company_id;
                        cbk();
                    },
                    function (cbk) {
                        global.lib_http.sendTradeServer({
                            method: 'getList',
                            cond: {find: {lev: 0}},
                            model: 'Classify'
                        }, global.config_api_url.trade_server_get_hanzi, cbk);
                    },
                    function (pei_zhi, cbk) {
                        hanZi = _.indexBy(pei_zhi, 'eng');
                        global.lib_work_relation.getCount({
                            user_id: req.decoded.id,
                            type: global.config_common.company_type.TRAFFIC
                        }, cbk);
                    },
                    function (data, cbk) {
                        global.lib_work_relation.getList({
                            find: {user_id: req.decoded.id, type: global.config_common.company_type.TRAFFIC},
                            select: 'other_company_id'
                        }, cbk);
                    },
                    function (data, cbk) {
                        arr02 = _.pluck(data, 'other_company_id');
                        global.lib_work_relation.getList({
                            find: {user_id: req.decoded.id, type: global.config_common.company_type.TRAFFIC},
                            select: 'other_user_id'
                        }, cbk);
                    },
                    function (data, cbk) {
                        arr = _.pluck(data, 'other_user_id');
                        lib_user.getCountAll({_id: {$in: arr}, real_name: {$regex: req.body.name}}, cbk);
                    },
                    function (data, cbk) {
                        count = data;
                        result.exist = data > req.body.page * config_common.entry_per_page;
                        lib_user.getList({
                            find: {_id: {$in: arr}, real_name: {$regex: req.body.name}},
                            skip: (req.body.page - 1) * config_common.entry_per_page,
                            limit: config_common.entry_per_page
                        }, cbk);
                    },
                    function (data, cbk) {
                        async.eachSeries(data, function (user, callback) {
                            (function (user) {
                                var obj = {};
                                obj.status = true;
                                async.waterfall([
                                    function (cback) {
                                        obj._id = user._id.toString();
                                        obj.status = true;
                                        obj.name = user.real_name;
                                        obj.role = user.role;
                                        obj.img = user.photo_url;
                                        obj.phone = user.phone;
                                        obj.post = user.post;
                                        obj.sell = _.map(user.sell, function (num) {
                                            return hanZi[num].chn;
                                        });
                                        obj.buy = _.map(user.buy, function (num) {
                                            return hanZi[num].chn;
                                        });
                                        obj.transport = _.map(user.transport, function (num) {
                                            return hanZi[num].chn;
                                        });
                                        lib_company.getOne({
                                            find: {_id: {$in: arr02}}
                                        }, cback);
                                    },
                                    function (company, cback) {
                                        obj.company_name = company.nick_name ? company.nick_name : company.full_name;
                                        obj.verify_phase = company.verify_phase ? company.verify_phase : company.verify_phase;
                                        obj.sell = _.map(company.sell, function (num) {
                                            return hanZi[num].chn;
                                        });
                                        obj.buy = _.map(company.buy, function (num) {
                                            return hanZi[num].chn;
                                        });
                                        obj.transport = _.map(company.transport, function (num) {
                                            return hanZi[num].chn;
                                        });
                                        result.push(obj);
                                        cback();
                                    }
                                ], callback);
                            })(user);
                        }, cbk);
                    },
                    function (cbk) {
                        cbk(null, {
                            list: result,
                            count: count
                        });
                    }
                ], function (err, result) {
                    if (err) {
                        return next(err);
                    }
                    config_common.sendData(req, result, next);
                });
            }
                break;
            case 'STORAGE': {
                async.waterfall([
                    function (cbk) {
                        global.lib_user.getOne({find: {_id: req.decoded.id}}, cbk);
                    },
                    function (user_w, cbk) {
                        req.decoded.company_id = user_w.company_id;
                        cbk();
                    },
                    function (cbk) {
                        global.lib_http.sendTradeServer({
                            method: 'getList',
                            cond: {find: {lev: 0}},
                            model: 'Classify'
                        }, global.config_api_url.trade_server_get_hanzi, cbk);
                    },
                    function (pei_zhi, cbk) {
                        hanZi = _.indexBy(pei_zhi, 'eng');
                        global.lib_work_relation.getCount({
                            user_id: req.decoded.id,
                            type: global.config_common.company_type.STORE
                        }, cbk);
                    },
                    function (data, cbk) {
                        global.lib_work_relation.getList({
                            find: {user_id: req.decoded.id, type: global.config_common.company_type.STORE},
                            select: 'other_company_id'
                        }, cbk);
                    },
                    function (data, cbk) {
                        arr02 = _.pluck(data, 'other_company_id');
                        global.lib_work_relation.getList({
                            find: {user_id: req.decoded.id, type: global.config_common.company_type.STORE},
                            select: 'other_user_id'
                        }, cbk);
                    },
                    function (data, cbk) {
                        arr = _.pluck(data, 'other_user_id');
                        lib_user.getCountAll({_id: {$in: arr}, real_name: {$regex: req.body.name}}, cbk);
                    },
                    function (data, cbk) {
                        count = data;
                        result.exist = data > req.body.page * config_common.entry_per_page;
                        lib_user.getList({
                            find: {_id: {$in: arr}, real_name: {$regex: req.body.name}},
                            skip: (req.body.page - 1) * config_common.entry_per_page,
                            limit: config_common.entry_per_page
                        }, cbk);
                    },
                    function (data, cbk) {
                        async.eachSeries(data, function (user_invitation, callback) {
                            (function (user_invitation) {
                                var obj = {};
                                obj.status = true;
                                async.waterfall([
                                    function (cback) {
                                        obj._id = user_invitation._id.toString();
                                        obj.status = true;
                                        obj.name = user.real_name;
                                        obj.role = user.role;
                                        obj.img = user.photo_url;
                                        obj.phone = user.phone;
                                        obj.post = user.post;
                                        obj.sell = _.map(user.sell, function (num) {
                                            return hanZi[num].chn;
                                        });
                                        obj.buy = _.map(user.buy, function (num) {
                                            return hanZi[num].chn;
                                        });
                                        obj.transport = _.map(user.transport, function (num) {
                                            return hanZi[num].chn;
                                        });
                                        lib_company.getOne({
                                            find: {_id: {$in: arr02}}
                                        }, cback);
                                    },
                                    function (company, cback) {
                                        obj.company_name = company.nick_name ? company.nick_name : company.full_name;
                                        obj.verify_phase = company.verify_phase ? company.verify_phase : company.verify_phase;
                                        obj.sell = _.map(company.sell, function (num) {
                                            return hanZi[num].chn;
                                        });
                                        obj.buy = _.map(company.buy, function (num) {
                                            return hanZi[num].chn;
                                        });
                                        obj.transport = _.map(company.transport, function (num) {
                                            return hanZi[num].chn;
                                        });
                                        result.push(obj);
                                        cback();
                                    }
                                ], callback);
                            })(user_invitation);
                        }, cbk);
                    },
                    function (cbk) {
                        cbk(null, {
                            list: result,
                            count: count
                        });
                    }
                ], function (err, result) {
                    if (err) {
                        return next(err);
                    }
                    config_common.sendData(req, result, next);
                });
            }
                break;
        }
    });

    //司机获取联系人
    api.post('/driver_get_linkman', function (req, res, next) {
        if (req.decoded.role !== global.config_common.user_roles.TRAFFIC_DRIVER_PRIVATE) {
            return next('not_allow');
        }
        async.parallel({
            company: function (callback) {
                var verifyDatas = [];
                async.waterfall([
                    function (cb) {
                        global.lib_driver_verify.getList({
                            find: {user_id: req.decoded.id},
                            select: 'company_id approve_id'
                        }, cb);
                    },
                    function (verifies, cb) {
                        verifyDatas = verifies;
                        var company_ids = global.lib_util.transObjArrToSigArr(verifies, 'company_id');
                        global.lib_company.getList({
                            find: {_id: {$in: company_ids}},
                            select: 'nick_name full_name verify_phase'
                        }, cb);
                    },
                    function (companies, cb) {
                        var user_ids = global.lib_util.transObjArrToSigArr(verifyDatas, 'approve_id');
                        global.lib_user.getList({
                            find: {_id: {$in: user_ids}},
                            select: 'real_name photo_url'
                        }, function (err, users) {
                            if (err) {
                                return cb(err);
                            }
                            var arr = [];
                            var userObj = global.lib_util.transObjArrToObj(users, '_id');
                            var companyObj = global.lib_util.transObjArrToObj(companies, '_id');
                            for (var i = 0; i < verifyDatas.length; i++) {
                                var verify = verifyDatas[i];
                                arr.push({
                                    user: userObj[verify.approve_id],
                                    company: companyObj[verify.company_id]
                                });
                            }
                            cb(null, arr);
                        });
                    }
                ], callback);
            },
            friends: function (callback) {
                var list = [];
                var userDatas = [];
                async.waterfall([
                    function (cbk) {
                        global.lib_user_relation.getList({
                            find: {user_id: req.decoded.id, type: global.config_common.relation_style.FRIEND},
                            select: 'other_id'
                        }, cbk);
                    },
                    function (relations, cbk) {
                        var user_ids = global.lib_util.transObjArrToSigArr(relations, 'other_id');
                        var cond = {find: {_id: {$in: user_ids}}};
                        global.lib_user.getListAll(cond, cbk);
                    },
                    function (data, cbk) {
                        userDatas = data;
                        async.eachSeries(data, function (oneData, cbk2) {
                            async.waterfall([
                                function (cbk3) {
                                    global.lib_http.sendTradeServer({
                                        method: 'getList',
                                        cond: {find: {eng: {$in: oneData.transport}, lev: 0}},
                                        model: 'Classify'
                                    }, global.config_api_url.trade_server_get_hanzi, cbk3);
                                },
                                function (pei_zhi, cbk3) {
                                    oneData.transport = _.pluck(pei_zhi, 'chn');
                                    cbk3();
                                }
                            ], cbk2)
                        }, cbk)
                    },
                    function (cbk) {
                        async.eachSeries(userDatas, function (oneData, cbk2) {
                            async.waterfall([
                                function (cbk3) {
                                    global.lib_http.sendTradeServer({
                                        method: 'getList',
                                        cond: {find: {eng: {$in: oneData.sell}, lev: 0}},
                                        model: 'Classify'
                                    }, global.config_api_url.trade_server_get_hanzi, cbk3);
                                },
                                function (pei_zhi, cbk3) {
                                    oneData.sell = _.pluck(pei_zhi, 'chn');
                                    cbk3();
                                }
                            ], cbk2);
                        }, cbk);
                    },
                    function (cbk) {
                        async.eachSeries(userDatas, function (oneData, cbk2) {
                            async.waterfall([
                                function (cbk3) {
                                    global.lib_http.sendTradeServer({
                                        method: 'getList',
                                        cond: {find: {eng: {$in: oneData.buy}, lev: 0}},
                                        model: 'Classify'
                                    }, global.config_api_url.trade_server_get_hanzi, cbk3);
                                },
                                function (pei_zhi, cbk3) {
                                    oneData.buy = _.pluck(pei_zhi, 'chn');
                                    cbk3();
                                }
                            ], cbk2);
                        }, cbk);
                    },
                    function (cbk) {
                        var company_ids = global.lib_util.transObjArrToSigArr(userDatas, 'company_id');
                        global.lib_company.getList({
                            find: {_id: {$in: company_ids}},
                            select: 'nick_name full_name verify_phase'
                        }, cbk);
                    },
                    function (companies, cbk) {
                        var companyObj = global.lib_util.transObjArrToObj(companies, '_id');
                        for (var i = 0; i < userDatas.length; i++) {
                            var user = userDatas[i];
                            var data = {user: user, online: true};
                            if (user.company_id) {
                                data.company = companyObj[user.company_id];
                            }
                            list.push(data);
                        }
                        cbk();
                    },
                    function (cbk) {
                        global.lib_invitation_user.getList({
                            find: {
                                user_id: req.decoded.id,
                                type: global.config_common.relation_style.FRIEND,
                                status: 'PROCESSING'
                            }
                        }, cbk);
                    },
                    function (result, cbk) {
                        for (var i = 0; i < result.length; i++) {
                            list.push({
                                user: result[i],
                                online: false
                            });
                        }
                        cbk(null, list);
                    }
                ], callback);
            },
            self: function (callback) {
                var userData;
                async.waterfall([
                    function (cb) {
                        global.lib_user.getOne({find: {_id: req.decoded.id}}, cb);
                    },
                    function (user, cb) {
                        userData = JSON.parse(JSON.stringify(user));
                        global.lib_http.sendTradeServer({
                            method: 'getList',
                            cond: {find: {eng: {$in: userData.transport}, lev: 0}},
                            model: 'Classify'
                        }, global.config_api_url.trade_server_get_hanzi, cb);
                    },
                    function (classify, cb) {
                        userData.transport = _.pluck(classify, 'chn');
                        cb(null, userData);
                    }
                ], callback)
            }
        }, function (err, result) {
            if (err) {
                return next(err);
            }
            global.config_common.sendData(req, result, next);
        });
    });

    return api;

};
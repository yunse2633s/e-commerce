/**
 * Created by Administrator on 2017\8\15 0015.
 */
var async = require('async');
var db_model = require('../dbs/db_base')('Team');
var sdk_im_wangyiyunxin = require('../sdks/im_wangyiyunxin/sdk_im_wangyiyunxin');
var lib_user = require('./lib_user');
var _ = require('underscore');

exports.getOne = function (data, callback) {
    db_model.getOne(data, callback);
};

exports.getList = function (data, callback) {
    db_model.getList(data, callback);
};

exports.add = function (data, callback) {
    db_model.add(data, callback);
};

exports.del = function (data, callback) {
    db_model.del(data, callback);
};

exports.delGroup = function (req, ids, callback) {
    var tid = [];
    async.eachSeries(ids, function (id, cb) {
        async.waterfall([
            function (cbk) {
                global.lib_team.getOne({find: {group_id: id}}, cbk);
            },
            function (team, cbk) {
                if (team) {
                    tid.push(team.team_id.toString());
                    sdk_im_wangyiyunxin.removeTeam({
                        tid: team.team_id.toString(),
                        owner: req.decoded.id.toString()
                    }, function (err, data) {
                        cbk(null, null);
                    });
                } else {
                    cbk(null, null);
                }
            },
            function (data, cbk) {
                db_model.del({group_id: id});
                cbk();
            }
        ], cb)
    }, function (err) {
        if (err) {
            console.log('lib_team-err:', err);
        }
        callback(null, tid);
    });
};

/**
 * 功能：检查群组是否正确
 * @param data
 * @param list
 * @param callback
 */
exports.checkTeam = function (data, list, callback) {
    var arr;
    var userData;
    async.waterfall([
        function (cb) {
            lib_user.getOne({find: {_id: data.user_id}}, cb);
        },
        function (user, cb) {
            userData = user;
            sdk_im_wangyiyunxin.joinTeams({
                accid: user._id.toString()
            }, cb);
        },
        function (teams, cb) {
            //（1）从云信得到所有的群信息
            teams = JSON.parse(teams);
            arr = _.map(_.pluck(teams.infos, 'tid'), function (num) {
                return num.toString();
            });
            //去除没有删除干净的公司
            // async.eachSeries(arr, function (oneTeam, cbk) {
            //
            //     console.log('33333333333333333')
            //
            //     if (_.indexOf(list, oneTeam) === -1) {
            //         sdk_im_wangyiyunxin.leaveTeam({
            //             accid: userData._id.toString(),
            //             tid: oneTeam
            //         }, cbk);
            //     }
            //
            //
            // }, cb)
            cb();
        },
        function (cb) {
            async.eachSeries(list, function (oneTeam, cbk) {
                if (_.indexOf(arr, oneTeam.team_id) === -1) {
                    async.waterfall([
                        function (cbk2) {
                            sdk_im_wangyiyunxin.teamQuery({
                                tids: JSON.stringify([oneTeam.team_id]),
                                ope: 1
                            }, cbk2);
                        },
                        function (teamData, cbk2) {
                            teamData = JSON.parse(teamData)
                            if (teamData.tinfos && teamData.tinfos.length) {
                                teamData = teamData.tinfos[0];
                                var arr = [];
                                arr.push(userData._id.toString());
                                var arr2 = JSON.stringify(arr);
                                sdk_im_wangyiyunxin.teamAdd({
                                    tid: teamData.tid,
                                    owner: teamData.owner,
                                    members: arr2,
                                    magree: 0,
                                    msg: '您已成功加入公司群'
                                }, function (err, data) {
                                    cbk2();
                                });
                            } else {
                                cbk2();
                            }
                        }
                    ], cbk)
                } else {
                    cbk()
                }
            }, cb)
        }
    ], callback);
};

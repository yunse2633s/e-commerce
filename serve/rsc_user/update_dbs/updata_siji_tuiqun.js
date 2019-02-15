/**
 * Created by Administrator on 2018\3\21 0021.
 */

//刷库->司机退群操作
api.post('/shua_siji_tuiqun', function (req, res, next) {
    async.waterfall([
        function (cb) {
            //查询到所有有公司的司机
            global.lib_user.getList({
                find: {
                    role: global.config_common.user_roles.TRAFFIC_DRIVER_PRIVATE,
                    "company_id.0": {$exists: true}
                }
            }, cb);
        },
        function (users, cb) {
            async.eachSeries(users, function (user, callback) {
                async.waterfall([
                    function (cbk) {
                        //(1)查询到这个司机的所有的公司群
                        global.lib_team.getList({
                            find: {company_id: {$in: user.company_id}}
                        }, cbk);
                    },
                    function (teams, cbk) {
                        for (var i = 0; i < teams.length; i++) {
                            sdk_im_wangyiyunxin.leaveTeam({
                                accid: user._id.toString(),
                                tid: teams[i].team_id
                            }, function (err, data) {
                                if (err) {
                                    return next(err);
                                }
                                console.log('data', data);
                            });
                        }
                        cbk();
                    }
                ], callback)
            }, cb)
        }
    ], function (err, result) {
        if (err) {
            return next(err);
        }
        config_common.sendData(req, result, next);
    })
});

api.post('/get_team', function (req, res, next) {
  sdk_im_wangyiyunxin.joinTeams({
    'accid': '5a94f11b7e08b444de94c00b'
  },function (err, data) {
    config_common.sendData(req, data, next);
  });
});

api.post('/shua', function (req, res, next) {
  var count = 0;
  async.waterfall([
    function (cb) {
      global.lib_relation_group.getListGroup({find: {type: global.config_common.relation_group_type.COLLEAGUE}}, cb);
    },
    function (data, cb) {
      async.eachSeries(data, function (oneData, callback) {
        //收集要用的信息
        var obj = {
          type: oneData.type,  //群类型
          name: oneData.name,  //群名称
          group_id: oneData._id.toString(), //群所属的同事组id
        };
        async.waterfall([
          function (cbk) {
            global.lib_relation_group.getListGroupUser({find: {group_id: oneData._id.toString()}}, cbk);
          },
          function (list, cbk) {
            //组员的id
            obj.memberUser = _.compact(_.pluck(list, 'member_id'));
            console.log('组员', obj.memberUser);
            lib_user.getOne({
              find: {_id: {$in: obj.memberUser}},
              role: global.config_common.user_roles.TRADE_ADMIN
            }, cbk);
          },
          function (one, cbk) {
            if (one) {
              //群组id
              obj.owner = one._id.toString();
              //群所属的公司id
              obj.company_id = one.company_id;
              var arr = JSON.stringify(obj.memberUser);
              sdk_im_wangyiyunxin.createTeam({
                tname: obj.name,
                owner: obj.owner,
                members: arr,
                msg: '您已加入' + obj.name + "群组",
                magree: 0,
                joinmode: 0,
                icon: '',
                intro: '同事群',
                beinvitemode: 1
              }, cbk);
            } else {
              cbk(null, null);
            }
          },
          function (tids, cbk) {
            if (tids) {
              count = count + 1;
              var tid = JSON.parse(tids)
              global.lib_team.add({
                team_id: tid.tid,
                user_id: obj.owner,
                user_ids: obj.memberUser,
                type: obj.type,
                group_id: obj.group_id
              }, cbk);
            } else {
              cbk()
            }
          }
        ], callback)
      }, cb);
    }
  ], function (err) {
    if (err) {
      return next(err);
    }
    config_common.sendData(req, count, next);
  })
});

//6.0.2上线时刷库使用
//刷默认是否开通字段
api.post('/shua_user_recommend', function (req, res, next) {
    async.waterfall([
        function (cb) {
            global.lib_user.getListAll({find: {}}, cb);
        },
        function (users, cb) {
            async.eachSeries(users, function (user, callback) {
                user.recommend = true;
                user.save();
                callback();
            }, cb);
        }
    ], function (err) {
        config_common.sendData(req, {}, next);
    })
});

//刷新公司_id
api.post('/shua_company_id', function (req, res, next) {
    async.waterfall([
        function (cb) {
            global.lib_company.getListAll({find: {company_id: {$exists: false}, "source": {$ne: "remark"}}}, cb);
        },
        function (companys, cb) {
            async.eachSeries(companys, function (company, callback) {
                async.waterfall([
                    function (cbk) {
                        global.lib_company_new.getOne({find: {nick_name: company.nick_name}}, cbk);
                    },
                    function (data, cbk) {
                        if (data) {
                            company.company_id = data._id.toString();
                            company.save(cbk);
                        } else {
                            global.lib_company_new.add({
                                full_name: company.full_name,
                                nick_name: company.nick_name,
                                url_logo: company.url_logo,
                                province: company.province,
                                city: company.city,
                                district: company.district,
                                addr: company.addr,
                                url_company_bg_img: company.url_company_bg_img,
                                phone_creator: company.phone_creator
                            }, function (err, content, count) {
                                company.company_id = content._id.toString();
                                company.save(cbk);
                            })
                        }
                    }
                ], callback);
            }, cb);
        }
    ], function (err) {
        if (err) {
            console.log('err:', err);
        }
        config_common.sendData(req, {}, next);
    });
});
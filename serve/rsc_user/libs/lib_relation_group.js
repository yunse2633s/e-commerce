/**
 * Created by Administrator on 2017/12/5.
 */
var db_model = require('../dbs/db_base')('Relation_group');
var relationGroupUserDB = require('../dbs/db_base')('Relation_group_user');

exports.addGroup = function (data, cb) {
    db_model.add(data, cb);
};

exports.addGroupUser = function (data, cb) {
    relationGroupUserDB.add(data, cb);
};

exports.addGroupUsers = function (data, cb) {
    relationGroupUserDB.addList(data, cb);
};

exports.getCountUser = function (data, cb) {
    relationGroupUserDB.getCount(data, cb);
};

exports.getCountGroup = function (data, cb) {
    db_model.getCount(data, cb);
};

exports.getListGroup = function (data, cb) {
    db_model.getList(data, cb);
};

exports.getListGroupUser = function (data, cb) {
    relationGroupUserDB.getList(data, cb);
};

exports.getOneGroup = function (data, cb) {
    db_model.getOne(data, cb);
};

exports.getOneGroupUser = function (data, cb) {
    relationGroupUserDB.getOne(data, cb);
};

exports.delGroup = function (data, cb) {
    db_model.del(data, cb);
};

exports.delGroupUser = function (data, cb) {
    relationGroupUserDB.del(data, cb);
};

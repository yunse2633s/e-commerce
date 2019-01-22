/**
 * Created by Administrator on 17/4/16.
 */
var async = require('async');
var _ = require('underscore');

var config_error = global.config_error;
var config_common = global.config_common;

var lib_ProductConfig = global.lib_ProductConfig;
// var lib_ProductClassify = global.lib_ProductClassify;
var lib_Classify = global.lib_Classify;
var lib_Tonnage = global.lib_Tonnage;
var lib_Config = global.lib_Config;
var lib_attGroup = global.lib_attGroup;

module.exports = function (app, express) {

  var api = express.Router();

  // 拦截非授权请求
  api.use(require('../../middlewares/mid_verify_user')());

  /**
   * 获取配置
   * PID  父类id
   */
  api.post('/get', function (req, res, next) {
    var query = {PID: req.body.PID || 0};
    async.waterfall([
      function (cb) {
        if (req.decoded.company_id) {
          global.lib_User.getCompanyOne({
            find: {_id: req.decoded.company_id, package_name: req.headers['package_name']}
          }, cb);
        } else {
          cb(null, null);
        }
      },
      function (result, cb) {
        if (!req.headers['package_name']) {
          if (req.body.material) query.eng = {$in: req.body.material};
        } else if (config_common.free_package_name[req.headers['package_name']]) {
          if (req.body.material) query.eng = {$in: req.body.material};
        } else if (result && result.VIP && result['package_name'] === req.headers['package_name']) {
          if (req.body.material) query.eng = {$in: req.body.material};
        } else if (result) {
          if (req.body.material) {
            query.eng = {$in: _.intersection(result['bug'].concat(result['sell'], req.body.material))};
          } else {
            query.eng = {$in: result['bug'].concat(result['sell'])};
          }
        }
        lib_Classify.getList({
          find: query,
          //sort: {_id: 1}
        }, cb);
      },
      function (list, cb) {
        if (list.length !== 0) {
          if (req.body.type === 'registered') {
            list = JSON.parse(JSON.stringify(list));
            list = _.map(list, function (num) {
              if (num.eng === 'buxianzhi') {
                num.chn = '不限制';
              }
              return num;
            });
          }
          cb(null, list);
        } else {
          if (req.body.material) {
            cb(null, []);
          } else {
            async.waterfall([
              function (back) {
                lib_Classify.getOne({
                  find: {_id: req.body.PID}
                }, back);
              },
              function (result, back) {
                if (!result) return back(config_error.invalid_id);
                result = JSON.parse(JSON.stringify(result));
                async.parallel({
                  attribute: function (cbk) {
                    lib_attGroup.getOne({
                      find: {numbering: result.attribute}
                    }, cbk);
                  },
                  product_name: function (cbk) {
                    lib_Config.getList({
                      find: {
                        PID: req.body.PID,
                        status: global.config_model.config_status.product_name
                      },
                      sort: {number: 1, name: 1},
                      select: 'name'
                    }, cbk);
                  },
                  unit: function (cbk) {
                    lib_Config.getList({
                      find: {numbering: result['unit_product']},
                      select: 'unit'
                    }, cbk);
                  },
                  unit_pass: function (cbk) {
                    lib_Config.getList({
                      find: {numbering: result['unit_pass']},
                      select: 'unit'
                    }, cbk);
                  },
                  other: function (cbk) {
                    lib_Config.getList({
                      find: {PID: req.body.PID, status: global.config_model.config_status.other},
                      select: 'name unit vary'
                    }, cbk);
                  },
                  calculate: function (cbk) {
                    lib_Tonnage.getList({
                      find: {PID: req.body.PID, company_id: req.decoded.company_id}
                    }, function (err, ton) {
                      cbk(null, _.map(ton, function (num) {
                        num.value = Number(num.value);
                        return num;
                      }))
                    });
                  },
                  demand: function (cbk) {
                    lib_Config.getList({
                      find: {PID: req.body.PID, status: 'otherLiJi'},
                      select: 'status'
                    }, cbk);
                  },
                  measure_unit: function (cbk) {
                    if (result['unit_metering']) {
                      lib_Config.getList({
                        find: {numbering: result['unit_metering']},
                        select: 'name unit vary calculate read'
                      }, cbk);
                    } else {
                      cbk(null, []);
                    }
                  },
                  product_price: function (cbk) {
                    cbk(null, _.reduce(result.price_type.split('-'), function (arr, string) {
                      arr.push({
                        name: string + '价'
                      });
                      return arr;
                    }, []));
                  },
                  display_path_loss: function (cbk) {
                    cbk(null, result.path_loss === true);
                  }
                }, function (err, result) {
                  if (err) return next(err);
                  result.unit[0].name = '产品单位';
                  result.unit_pass[0].name = '运输单位';
                  result.unit = result.unit.concat(result.unit_pass);
                  delete result.unit_pass;
                  back(null, result);
                });
              }
            ], cb);
          }
        }
      }
    ], function (err, result) {
      if (err) return next(err);
      config_common.sendData(req, result, next);
    });
  });

  /**
   * 根据产品获取最后一层分类配置
   * PID  父类id
   */
  api.post('/get_by_product_categories', function (req, res, next) {
    var result;
    var product_category;
    async.waterfall([
      function (cb) {
        config_error.checkBody(req.body, ['product_categories'], cb);
      },
      function (cb) {
        product_category = req.body.product_categories[0];
        if (product_category.material) {
          var material = product_category.material;
        } else {
          var material = product_category.layer.material;
        }
        lib_Classify.getOne({find: {eng: material, PID: '0'}}, cb);
      },
      function (classify, cb) {
        if (!classify) {
          return cb('not_found');
        }
        var layers = [];
        if (product_category.material) {
          for (var key in product_category) {
            var arr = key.split('_');
            if (arr[0] === 'layer' && arr.length === 2) {
              layers[arr[1] - 1] = (product_category[key]);
            }
          }
        } else {
          for (var key in product_category.layer) {
            var arr = key.split('_');
            if (arr[0] === 'layer' && arr.length === 2) {
              layers[arr[1] - 1] = (product_category.layer[key]);
            }

          }
        }

        var PID = classify._id.toString();
        async.eachSeries(layers, function (layer, cbk) {
          lib_Classify.getOne({find: {PID: PID, eng: layer}}, function (err, data) {
            if (err || !data) {
              return cbk(err || 'not_found');
            }
            PID = data._id.toString();
            result = data;
            cbk();
          });
        }, cb);
      },
      function (cb) {
        // if (product_category.material) {
        //
        //
        //     cb(null,null);
        // } else {
        async.waterfall([
          function (back) {
            result = JSON.parse(JSON.stringify(result));
            async.parallel({
              attribute: function (cbk) {
                lib_attGroup.getOne({
                  find: {numbering: result.attribute}
                }, cbk);
              },
              product_name: function (cbk) {
                lib_Config.getList({
                  find: {
                    PID: result._id.toString(),
                    status: global.config_model.config_status.product_name
                  },
                  sort: {number: 1, name: 1},
                  select: 'name'
                }, cbk);
              },
              unit: function (cbk) {
                lib_Config.getList({
                  find: {numbering: result['unit_product']},
                  select: 'unit'
                }, cbk);
              },
              unit_pass: function (cbk) {
                lib_Config.getList({
                  find: {numbering: result['unit_pass']},
                  select: 'unit'
                }, cbk);
              },
              other: function (cbk) {
                lib_Config.getList({
                  find: {PID: result._id.toString(), status: global.config_model.config_status.other},
                  select: 'name unit vary'
                }, cbk);
              },
              calculate: function (cbk) {
                lib_Tonnage.getList({
                  find: {PID: result._id.toString(), company_id: req.decoded.company_id}
                }, cbk);
              },
              demand: function (cbk) {
                lib_Config.getList({
                  find: {PID: result._id.toString(), status: 'otherLiJi'},
                  select: 'status'
                }, cbk);
              },
              measure_unit: function (cbk) {
                if (result['unit_metering']) {
                  lib_Config.getList({
                    find: {numbering: result['unit_metering']},
                    select: 'name unit vary calculate read'
                  }, cbk);
                } else {
                  cbk(null, []);
                }
              },
              product_price: function (cbk) {
                cbk(null, _.reduce(result.price_type.split('-'), function (arr, string) {
                  arr.push({
                    name: string + '价'
                  });
                  return arr;
                }, []));
              },
              display_path_loss: function (cbk) {
                cbk(null, result.path_loss === true);
              }
            }, function (err, result) {
              if (err) return next(err);
              result.unit[0].name = '产品单位';
              result.unit_pass[0].name = '运输单位';
              result.unit = result.unit.concat(result.unit_pass);
              delete result.unit_pass;
              back(null, result);
            });
          }
        ], cb);
        // }
      }
    ], function (err, data) {
      if (err) return next(err);
      if (data) {
        config_common.sendData(req, data, next);
      } else {
        config_common.sendData(req, result, next);
      }
    });
  });

  /**
   * 功能：设置公司自己的配置
   * 参数：sell:[],卖什么
   *      buy:[],买什么
   */
  api.post('/save_company_config', function (req, res, next) {
    if (!req.body.sell && !req.body.sell) {
      return next('invalid_format');
    }
    async.waterfall([
      function (cb) {
        global.lib_CompanyConfig.getOne({find: {company_id: req.decoded.company_id}}, cb);
      },
      function (data, cb) {
        if (data) {
          if (req.body.buy) {
            data.buy = req.body.buy;
          }
          if (req.body.sell) {
            data.sell = req.body.sell;
          }
          data.save(cb);
        } else {
          global.lib_CompanyConfig.add({
            company_id: req.decoded.company_id,
            buy: req.body.buy,
            sell: req.body.sell
          }, cb);
        }
      }
    ], function (err, content, count) {
      if (err) {
        return next(err);
      }
      config_common.sendData(req, content, next);
    })
  });

  /**
   * 功能：查询公司自己的配置
   */
  api.post('/get_company_config', function (req, res, next) {
    async.waterfall([
      function (cb) {
        global.lib_CompanyConfig.getOne({find: {company_id: req.decoded.company_id}}, cb);
      }
    ], function (err, data) {
      if (err) {
        return next(err);
      }
      config_common.sendData(req, data, next);
    })
  });

  return api;
};
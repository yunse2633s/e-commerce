var async = require('async')
var model = require('../dbs/db_base')
model = model('Pressure')

exports.save = function (req, time) {
  time = Number(time.toFixed(3))
  async.waterfall([
    function (cb) {
      model.getOne({
        find: {url: req.url}
      }, cb)
    },
    function (request, cb) {
      if (!request) {
        var arr = __dirname.split('/')
        request = {
          server: arr[arr.length - 2],
          count: 1,
          url: req.url,
          time_update: new Date(),
          res_time_max: time,
          res_time_min: time,
          res_time_average: time
        }
        model.add(request, cb);
      }else {
        request.count++            //请求次数
        request.time_update = new Date()
        if (time > request.res_time_max) {
          request.res_time_max = time
        }
        if (time < request.res_time_min) {
          request.res_time_min = time
        }
        request.res_time_average = ((time+request.res_time_average)/2).toFixed(3)
        request.save(cb);
      }
    }
  ], function (err) {
    if(err){
      console.log(err)
    }
  })
}

exports.add = function (data, callback) {
  model.add(data, callback)
}

exports.update = function (data, callback) {
  model.update(data, callback)
}

exports.getOne = function (data, callback) {
  model.getOne(data, callback)
}

exports.getList = function (data, callback) {
  model.getList(data, callback)
}

exports.del = function (data, callback) {
  model.del(data, callback)
}
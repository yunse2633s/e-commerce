/**
 * Created by Administrator on 2017\8\15 0015.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var TeamSchema = new Schema({
    team_id: {type: String},                        //群id
    company_id: {type: String},                     //公司id
    user_id: {type: String},                        //创建人的id
    user_ids: {type: Array},                        //用户id组
    type: {type: String},                           //确定群组的类型
    group_id:{type: String},                        //确定群组另一个id
    time_creation: {                                //创建时间
        type: Date, default: function () {
            return new Date()
        }
    }
});

module.exports = mongoose.model('Team', TeamSchema);
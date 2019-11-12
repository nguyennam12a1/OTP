const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
var OtpSchema = mongoose.Schema({
    otp_code:{
        type:String,
        maxlength:7,
        required:true,
        unique:true
    },
    date_created:{
        type:Date,
        required:true,
        default:Date.now()
    }
})
OtpSchema.plugin(uniqueValidator);

var otpModel = mongoose.model('otp_list', OtpSchema);

exports.otpModel = otpModel;
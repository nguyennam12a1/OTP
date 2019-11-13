const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
var OtpSchema = mongoose.Schema({
    otp_code: {
        type: String,
        maxlength: 7,
        required: true
    },
    date_created:{
        type:Date,
        default:Date.now
    }
});

OtpSchema.plugin(uniqueValidator);
//OtpSchema.createIndex({"expireAt":1},{expireAfterSeconds:1});// Hết hạn sau 10 giây



var otpModel = mongoose.model('otp_list', OtpSchema);

exports.otpModel = otpModel;
const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
var OtpSchema = mongoose.Schema({
    otp_code: {
        type: String,
        maxlength: 7,
        required: true,
        unique: true,
    },
    date_created: {
        type: Date,
        required: true,
        default: Date.now,
    },
    expireAt: {
        type: Date,
        default: Date.now,
        index: { expires: 10 }
    },
})
OtpSchema.plugin(uniqueValidator);
//OtpSchema.index({expireAt:1},{expireAfterSeconds:10});// Hết hạn sau 10 giây


var otpModel = mongoose.model('otp_list', OtpSchema);

exports.otpModel = otpModel;
const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

var invalidSchema=mongoose.Schema({
    email: {
        unique: true,
        type: String,
        required: true,
        maxlength:30,
        min:8
    },
    status:{
        type:Number,
        default:1,
        max:1
    }

});

var UserSchema = mongoose.Schema({
    name: {
        type:String,
        max:30,
        min:4,
        required:true
    },
    email: {
        unique: true,
        type: String,
        required: true,
        maxlength:30,
        min:8
    },
    password: {
        type: String,
        required: true,
        maxlength: 64,
        min:4
    },
    age: {
        type: Number,
        max: 999,
        min: 6
    },
    phone:{
        type:Number,
        maxlength:10,
        required:true
    },
    status:{
        type:Number,
        default:0,
        max:1
    },
    secret:{
        type:String,
        required:true,
        maxlength:64
    }
})
UserSchema.plugin(uniqueValidator);

var userModel = mongoose.model('user', UserSchema);
var invalidModel=mongoose.model('invalid_user',invalidSchema);

exports.userModel = userModel;
exports.invalidModel=invalidModel;

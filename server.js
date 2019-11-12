const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const express = require('express');
const app = express();
const session = require('express-session');
const bcrypt = require('bcrypt');
const Nexmo = require('nexmo');
const otplib = require('otplib');
const otp_secret = 'khanh9517';
const invalid_count = 0;
const nexmo = new Nexmo({
    apiKey: '8f69d5f9',
    apiSecret: 'hPdA2OlKBHIFuhfI',
});

let userSchema = require('./model/user');
let otp_schema=require('./model/otp');
const error_login = "Thông tin không hợp lệ";
let userModel = userSchema.userModel;
let invalidModel = userModel.invalidModel;
let otpModel = otp_schema.otpModel;


//Bcrypt setup
const saltRounds = 10;
app.use(session({
    secret: 'lmao',
    resave: false,
    saveUninitialized: false
}))

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'ejs');

//Connect MongoDB
mongoose.connect('mongodb://localhost:27017/users_db', { useNewUrlParser: true });
mongoose.connection.once('open', function (err) {
    if (err) console.log(err);
    else console.log('MongoDB Connected!');
});


//Routing
app.get('/', function (req, res) {
    res.render('index.ejs', { message: undefined });
});


//Authentication Login page
app.get('/auth', function (req, res) {

    res.render('lmao.ejs');
});

app.post('/auth', function (req, res) {
    let { email, password } = req.body;
    console.log(`Email:${email}\nPassword:${password}`);
    let temp = bcrypt.hash(password, saltRounds);
    userModel.findOne({ email: email }, function (err, data) {
        if (data === 'undefined' || data === null) {
            res.render('index.ejs', { message: "Sai thông tin đăng nhập" });
        }
        else if (data) {
            if (data.status == 1) {
                res.render('index.ejs', { message: 'This account has been locked due to OTP verification failed!' });
            }
            else {
                let hash_password = data.password;
                console.log(data.password);
                bcrypt.compare(password, hash_password, function (err, result) {
                    console.log(result);
                    if (result) {

                        console.log('User found');
                        //Session setup
                        let sess = req.session;
                        sess.email = email;
                        sess.password = password;
                        sess.invalid_count = 0;
                        let receive_number = 84912432665; //Change this to client number,
                        //Generate Token OTP
                        const otp_code = otplib.authenticator.generate(otp_secret);
                        let new_otp_code = new otpModel({ otp_code: otp_code });
                        new_otp_code.save((err) => {
                            if (err) console.log(`Error in saving new otp code:${otp_code}`);
                        });

                        console.log(`OTP Code is :${otp_code}`);
                        //Send to client using SMS Nexmo
                        nexmo.message.sendSms('Nexmo', receive_number, otp_code, { type: 'unicode' }, (err, data) => {
                            if (err) {
                                console.log(err);
                                res.render('error.ejs');
                            }
                            else {
                                console.dir(data);
                                res.render('otp.ejs', { message: 'Please enter your OTP code from sms', invalid_count: sess.invalid_count });
                            }
                        })
                    }
                    else {
                        console.log('Sai thong tin đăng nhập');
                        res.render('index.ejs', { message: "Sai thông tin đăng nhập" });
                    }

                });
            }

        }
        else res.render('error.ejs');
    });
})


//OTP stage
app.route('/otp_auth')
    .get(function (req, res) {
        let sess = req.session;
        if (sess.email) {
            res.render('otp.ejs', { message: 'Please input your OTP code from sms' });
        }
        else {
            res.render('session_check');
        }
    })
    .post(function (req, res) {
        let { token_otp, current_time } = req.body;
        console.log(`OTP is :${token_otp}`);
        let sess = req.session;
        if (sess.email) {
            try {
                //Find OTP in database
                otpModel.findOne({ otp_code: token_otp }, function (err, data) {
                    if (err) console.log(`Error in finding OTP in database: ${err}`);
                    if (data === null || data === 'undefined') { // No OTP Found
                        console.log("OPT not found");
                        sess.invalid_count++;
                        if (sess.invalid_count == 4) {
                            userModel.findOne({ email: sess.email }, function (err, doc) {
                                doc.status = 1;
                                doc.save();
                                let temp = new invalidModel({ email: doc.email });
                                temp.save((err) => {
                                    if (err) console.log(`Error in save invalid :${err}`);
                                });
                            });
                            console.log(`Invalid count locked: ${sess.invalid_count}`);
                            console.log('OTP verification failed');
                            res.render('otp.ejs', { message: 'You have been locked!', invalid_count: sess.invalid_count });
                        }
                        else {
                            console.log(sess.invalid_count);
                            console.log('OTP verification failed');
                            res.render('otp.ejs', { message: 'Wrong OTP code', invalid_count: sess.invalid_count });
                        }

                    } else { // OTP found
                        console.log("OTP is found");
                        let time_temp = Date.now();
                        if (time_temp - data.date_created > 100000) {//Check time expiration
                            res.render('otp.ejs', { message: 'OTP Expired', invalid_count: sess.invalid_count });
                        }
                        else {// Check if otp code is valid
                            const isValid = otplib.authenticator.check(token_otp, otp_secret);
                            console.log(`Result compare:${isValid}`);
                            if (isValid) { // IF OTP CORRECT
                                console.log('OTP success');
                                res.render('dashboard.ejs');
                            }
                        
                        else {
                            res.render('otp.ejs', { message: 'Wrong OTP code', invalid_count: sess.invalid_count });
                        }
                    }
                }
                })
            }
            catch (err) {
                console.log(`Error in post OTP:${err}`);
            }

        }
        else {
            res.render('session_check.ejs');
        }
    })


//If login ,OTP verified success -->go to dashboard
app.get('/dashboard', function (req, res) {
    let sess = req.session;
    if (sess.email) {
        res.render('dashboard.ejs');
    }
    else {
        res.render('session_check.ejs');
    }
})

//Signup
app.route('/signup')
    .get(function (req, res) {
        res.render('signup', { message: undefined });
    })
    .post(function (req, res) {
        let { email, password, name, age } = req.body;
        console.log(`Email:${email}\nPassword:${password}\nName:${name}\nAge:${age}`);
        //Generate bcrypt password
        bcrypt.hash(password, saltRounds, function (err, hash) {
            if (err) {
                console.log(`Error in signup:${err}`);
                res.render('signup.ejs', { message: err });
            }
            else { //Save user into database
                let new_user = new userModel({ email: email, password: hash, name: name, age: age });
                new_user.save((err) => {
                    if (err) {
                        console.log(err);
                        res.render('signup.ejs', { message: "Email đã tồn tại" })
                    }
                    else {
                        console.log('Save new signup user success!');
                        res.redirect('/');
                    }
                })
            } // End of Signup success
        })

    })

//Log out
app.get('/logout', function (req, res) {
    req.session.destroy((err) => {
        if (err) { return console.log(err); }
        res.redirect('/');
    })
});
//Server 

app.listen(3000, function (err) {
    if (err) console.log(err);
    else console.log('Server start at 3000');
})





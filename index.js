const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const express = require('express');
const app = express();
const session = require('express-session');
const bcrypt = require('bcrypt');
const otplib = require('otplib');
const speakeasy = require('speakeasy');
const QRcode = require('qrcode');
const otp_string = "otpauth://totp/SecretKey?secret=";
let userSchema = require('./model/user');
let userModel = userSchema.userModel;



//Prevent back button from Browser
app.use(function (req, res, next) {
    res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
    next();
});

//Setting otplib
otplib.authenticator.options = {
    step: 10, //expire after 10
    window: 1
};

//Bcrypt setup
const saltRounds = 10;
app.use(session({
    secret: 'nguyennam12a1',
    resave: false,
    saveUninitialized: false
}))
//Express setup
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
//View engine setup
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
                res.render('index.ejs', { message: 'This account has been locked due to OTP verification failed!\nPLease go back to login page' });
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
                        sess.secret = data.secret;  //Save base32 secret to session
                        //Get secret
                        let temp_user_secret = data.secret;
                        console.log(`User secret in login is : ${temp_user_secret}`);
                        //Generate QR Code 
                        let url_qr = otp_string + temp_user_secret;
                        console.log(url_qr);
                        QRcode.toDataURL(url_qr, function (err, data_url) {
                            if (err) console.log(`Error in QRCode login:${err}`);
                            sess.data_url=data_url;
                            res.render('qr.ejs', { img_qr: data_url ,message:''});
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
});

//2FA authentication
app.post('/2factor', function (req, res) {
    let { token } = req.body;

    let user_secret = req.session.secret;
    console.log("Verify token session");
    console.log(`User secret:${user_secret}`);
    console.log(`Token :${token}`);

    //Verify Token
    var verified = speakeasy.totp.verify({
        secret: user_secret,
        encoding: 'base32',
        token: req.body.token
    });
    console.log(`Verify:${verified}`);
    if (verified) {
        res.render('dashboard.ejs');
    }
    else {
        res.render('qr.ejs',{message:'Wrong OTP code',img_qr:req.session.data_url});
    }
});



//Signup
app.route('/signup')
    .get(function (req, res) {
        res.render('signup', { message: undefined });
    })
    .post(function (req, res) {
        let { email, password, name, age, phone } = req.body;
        console.log(`Email:${email}\nPassword:${password}\nName:${name}\nAge:${age}`);
        //Generate bcrypt password
        bcrypt.hash(password, saltRounds, function (err, hash) {
            if (err) {
                console.log(`Error in signup:${err}`);
                res.render('signup.ejs', { message: err });
            }
            else { //Save user into database
                //Generate Secret
                let user_secret = speakeasy.generateSecret();
                let user_secret_base32 = user_secret.base32;
                console.log(`User secret in signup with base 32 is :${user_secret_base32}`);
                console.log(`User secret in signup with url is :${user_secret.otpauth_url}`);
                //console.log(`User secret in base 32 :${user_secret.base32}`);
                //console.log(`User secret in plain text: ${user_secret.ascii}`);
                let new_user = new userModel({ email: email, password: hash, name: name, age: age, phone: phone, secret: user_secret_base32 });//secret saved in base32 encoding
                new_user.save((err) => {
                    if (err) {
                        console.log(err);
                        res.render('signup.ejs', { message: "Email đã tồn tại" })
                    }
                    else {
                        console.log('Save new signup user success!');
                        res.redirect('/');
                    }
                });
            } // End of Signup success
        })

    })

app.get('/dashboard', function (req, res) {
    let sess = req.session;
    if (sess.email ) {
        res.render('dashboard.ejs');
    }
    else {
        res.render('session_check.ejs');
    }
})

//Log out
app.get('/logout', function (req, res) {
    req.session.destroy((err) => {
        if (err) { return console.log(err); }
        res.redirect('/');
    })
});
app.post('/')
//Server 

app.listen(3000, function (err) {
    if (err) console.log(err);
    else console.log('Server start at 3000');
})





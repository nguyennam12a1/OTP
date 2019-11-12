const session=require('express-session');
const express=require('express');
const app=express();
app.use(session({
    secret:'lmao',
    resave:false,
    saveUninitialized:false
}))
const auth_ware=function(req,res,next){
     if(req.session.email === ''|| req.session.email === 'undefined'){
         res.render('error.ejs');
     }
     else {
         console.log('Authenticated!');
         next();
     }
}

exports.auth_ware=auth_ware;
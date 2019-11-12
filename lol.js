const otplib=require('otplib');

let secret="nguyennam";
let token=otplib.authenticator.generate(secret);
const isValid=otplib.authenticator.check(token,secret);
console.log(isValid);

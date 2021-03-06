const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const jwtSeret = require('../config/jwtconfig');
var users = require('../source/user-api');
var sendmail = require('../source/sendmail');
const { auth: checkAuth } = require('../middlewares/is-me');
var jsonparser = bodyParser.json();
const rateLimit = require("express-rate-limit");
// add rate limiting
const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 2

});

router.post('/login/forgetpassword', jsonparser, limiter, async function(req, res) {
    let email = req.body.email;
    let user = await users.checkmail(email);

    if (!user) {
        res.status(404).send('THERE IS NO SUCH USER');
    } else {
        var token = jwt.sign({ _id: user._id, product: user.product, userType: user.userType }, jwtSeret.secret, {
            expiresIn: '874024h'
        });
        await sendmail(email, token, "password");
        res.status(200).send("PLEASE CHECK YOUR MAIL");

    }

});
router.post('/login/reset_password', checkAuth, limiter, async(req, res) => {
    let user = await users.getUserById(req.user._id);

    let newPass = await users.updateforgottenpassword(user, req.body.password);
    if (newPass) {
        return res.status(200).send("PASSWORD IS UPDATED");
    } else {
        return res.status(400).send("PASSWORD CAN'T BE UPDATED");
    }



});
module.exports = router;
const spotifySchema = require('../models/db');
const jwtSeret = require('../config/jwtconfig');
const jwt = require('jsonwebtoken');
const Users = require('../source/user-api');
const Notifications = require('../source/notification-api');
var express = require('express');
const validateLoginInput = require("../validation/login");
const bcrypt = require("bcrypt");
const router = express.Router();
const { auth: checkAuth } = require('../middlewares/is-me');
User = spotifySchema.User
const rateLimit = require("express-rate-limit");
// add rate limiting
const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 2

});
//request to log in the user
router.post("/login", limiter, (req, res) => {
    // Form validation

    const { errors, isValid } = validateLoginInput(req.body);

    // Check validation
    if (!isValid) {
        return res.status(400).json(errors);
    }
    // get element and password from body of the request
    const email = req.body.email;
    const password = req.body.password;

    // Find user by email
    spotifySchema.user.findOne({ email: email }).exec().then(user => {
        // Check if user exists
        if (!user) {
            return res.status(404).json({ emailnotfound: "Email not found" });
        }
        if (!user.confirm || user.confirm == false) { return res.status(403).json({ emailnotconfirmed: "Please Confirm your account first" }); }
        // Check password
        bcrypt.compare(password, user.password).then(isMatch => {
            if (isMatch) {
                // User matched
                // Create JWT Payload
                var token = jwt.sign({ _id: user._id, product: user.product, userType: user.userType }, jwtSeret.secret, {
                    expiresIn: '874024687898921h'
                });

                // return the information including token as JSON
                res.send({ token });
            } else {
                res.status(401).send({ success: false, msg: 'Authentication failed. Wrong password.' });
            }
        });
    });
});

//Notification Token Set
router.post("/notification/token", checkAuth, limiter, async(req, res) => {

    if (!req.body.fcmToken || req.body.fcmToken == "") { return res.status(404).send({ error: "FCM TOKEN IS NOT PROVIDED" }) }
    let userId = req.user._id;
    let user = await Users.getUserById(userId);
    if (!user) { return res.status(404).send({ error: "User IS NOT FOUND" }) }
    if (!user.fcmToken) {
        user.fcmToken = "none";
        await user.save();
    }
    user.fcmToken = req.body.fcmToken;
    await user.save();
    if (user.offlineNotifications && user.offlineNotifications.length > 0) {
        console.log(user.fcmToken);
        await Notifications.sendOfflineNotifications(user.offlineNotifications, user);

    }
    return res.status(200).send({ Success: "Token is set successfully" })

});


module.exports = router;
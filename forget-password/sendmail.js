var nodemailer = require('nodemailer');
/**
 * send email
 * @param {string} email - user email
 * @param {string} password -email password
 */
function sendEmail(email, password) {
    var transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
            user: 'appspotify646@gmail.com',
            pass: 'Helloworld55'
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    var mailOptions = {
        from: '"Spotify Contact" <appspotify646@gmail.com>',
        to: email,
        subject: 'SPOTIFY SAMA has A Message FOR YOU ^^',
        text: password
    };

    transporter.sendMail(mailOptions, function(error, info) {

    });
};
module.exports = sendEmail;
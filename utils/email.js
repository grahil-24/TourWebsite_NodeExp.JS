const nodemailer = require('nodemailer'); //eslint-disable-line
const postmarkTransport = require('nodemailer-postmark-transport');
const pug = require('pug');
const htmlToText = require('html-to-text');

module.exports = class Email {
    constructor(user, url) {
        this.to = user.email;
        //only want first name
        this.firstName = user.name.split(' ')[0];
        this.url = url;
        console.log(url);
        this.from = `Rahil Ganatra <${process.env.EMAIL_FROM}>`;
    }

    //when we are in different environment, we will send different emails, in production we will send real emails
    newTransport() {
        if (process.env.NODE_ENV === 'production') {
            //Sendgrid
            return nodemailer.createTransport(
                postmarkTransport({
                    auth: {
                        apiKey: process.env.POSTMARK_API,
                    },
                })
            );
        }

        // in development env, we will use mailtrapper
        return nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD,
            },
        });
    }

    // Send the actual email
    async send(template, subject) {
        // 1) Render HTML based on pug template
        const html = pug.renderFile(`{__dirname}/../views/email/${template}.pug`, {
            firstName: this.firstName,
            url: this.url,
            subject,
        });

        // 2) Define email options
        const mailOptions = {
            from: this.from,
            to: this.to,
            subject,
            html,
            text: htmlToText.fromString(html),
        };

        // 3) create a transport and send email
        await this.newTransport().sendMail(mailOptions);
    }

    async sendWelcome() {
        await this.send('welcome', 'Welcome to the Natours Family');
    }

    async sendPasswordReset() {
        await this.send('passwordReset', 'Your password reset token (valid for only 10 mins');
    }
};

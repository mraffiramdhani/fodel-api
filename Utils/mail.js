require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_SMTP_EMAIL,
    pass: process.env.GMAIL_SMTP_PASS
  }
});

const mailOption = {
  from: 'fodel@gmail.com',
  to: '',
  subject: '',
  html: '<p>Placeholder</p>'
};

const sendEmail = (data) => {
  const { to, subject, html } = data;
  return new Promise((resolve, reject) => {
    const payload = {
      ...mailOption,
      to,
      subject,
      html
    };
    transporter.sendMail(payload, (err, info) => {
      if (err) reject(err);
      // eslint-disable-next-line no-console
      resolve(info);
    });
  });
};

module.exports = {
  sendEmail
};

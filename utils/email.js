const nodemailer = require('nodemailer');
const { Resend } = require('resend');
const pug = require('pug');
const { convert } = require('html-to-text');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Egor Kolokolnikov <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async send(template, subject) {
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject,
    });
    const text = convert(html);

    if (process.env.NODE_ENV === 'production') {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: this.from,
        to: this.to,
        subject,
        html,
        text,
      });
      return;
    }

    await this.newTransport().sendMail({
      from: this.from,
      to: this.to,
      subject,
      html,
      text,
    });
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to the Natours family!');
  }

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your password reset token (valid for 10 min)',
    );
  }
};

const smtpTransport = require("nodemailer-smtp-transport");
const nodemailer = require("nodemailer");
const keys = require("../config/keys");

const sendMail = async (email, subject, text) => {
  let response = null;
   console.log("email, text", email, text)
  const transport = nodemailer.createTransport(
    smtpTransport({
    //  service: 'gmail',
      host: keys.senderHost,
      port: 465,
      auth: {
        user: keys.senderUsername,
        pass: keys.senderPassword,
      },
      tls: {
        rejectUnauthorized: false,
      },
      debug: true,
    })
  );
  const mailobj = {
    from: keys.senderEmail,
    to: email,
    subject,
    text,
  };
  transport.sendMail(mailobj, (error, info) => {
    if (error) {
        console.log(error);
    } else {
        console.log('Email sent: ' + info.response);
        return info.response;
    }
});
  // response = await transport.sendMail(mailobj);
  // console.log("response--", response)
  // return response;
};
module.exports = sendMail;

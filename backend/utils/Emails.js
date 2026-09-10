const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  },
});

exports.sendMail = async(receiverEmail,subject,body) => {
    try{
    await transporter.sendMail({
    from: process.env.EMAIL,
    to: receiverEmail,
    subject: subject,
    html: body
  })}catch(e){console.log(`[MAIL MOCK] to:${receiverEmail} subject:${subject} body:${body} | error:${e.message}`)}
};

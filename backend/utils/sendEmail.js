const nodemailer = require("nodemailer");
const config = require("config");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: config.get("emailUser"),
    pass: config.get("emailPass"),
  },
});

const sendEmail = async ({ to, subject, html }) => {
  try {
    await transporter.sendMail({
      from: `"devapp Support" <${config.get("emailUser")}>`,
      to,
      subject,
      html,
    });
    console.log(`✅ Email envoyé à ${to}`);
  } catch (err) {
    console.error("❌ Erreur envoi email :", err.message);
  }
};

module.exports = sendEmail;
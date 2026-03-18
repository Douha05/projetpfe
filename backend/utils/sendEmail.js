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
  // Afficher dans le terminal pour debug
  console.log("=============================");
  console.log("📧 Email à envoyer :");
  console.log("À :", to);
  console.log("Sujet :", subject);
  
  // Extraire le code du HTML
  const codeMatch = html.match(/font-size:36px[^>]*>[\s]*(\d{6})/);
  if (codeMatch) console.log("🔑 CODE :", codeMatch[1]);
  console.log("=============================");

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
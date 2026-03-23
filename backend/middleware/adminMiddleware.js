const jwt = require("jsonwebtoken");
const config = require("config");

module.exports = (req, res, next) => {
  const authHeader = req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ status: "notok", msg: "Accès refusé. Token manquant." });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, config.get("jwtSecret"));
    if (decoded.role !== "admin") {
      return res.status(403).json({ status: "notok", msg: "Accès refusé. Réservé aux administrateurs." });
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ status: "notok", msg: "Token invalide ou expiré" });
  }
};
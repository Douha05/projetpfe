const router = require("express").Router();
const bcrypt = require("bcryptjs");
const config = require("config");
const jwt = require("jsonwebtoken");
const User = require("../../models/User");

router.post("/register", (req, res) => {
  const { prenom, nom, email, telephone, departement, password } = req.body;

  if (!prenom || !nom || !email || !telephone || !password) {
    return res.status(400).json({
      status: "notok",
      msg: "Tous les champs obligatoires doivent être remplis",
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      status: "notok",
      msg: "Le mot de passe doit contenir au moins 8 caractères",
    });
  }

  User.findOne({ email: email.toLowerCase() })
    .then((user) => {
      if (user) {
        return res.status(400).json({
          status: "notokmail",
          msg: "Un compte avec cet email existe déjà",
        });
      }

      const newUser = new User({
        nom,
        prenom,
        email: email.toLowerCase(),
        telephone,
        departement: departement || "",
        password,
        role: "support",
      });

      bcrypt.genSalt(10, (err, salt) => {
        if (err) return res.status(500).json({ status: "error", msg: "Erreur serveur" });

        bcrypt.hash(newUser.password, salt, (err, hash) => {
          if (err) return res.status(500).json({ status: "error", msg: "Erreur serveur" });

          newUser.password = hash;

          newUser.save()
            .then((savedUser) => {
              jwt.sign(
                { id: savedUser._id, role: savedUser.role },
                config.get("jwtSecret"),
                { expiresIn: config.get("tokenExpire") },
                (err, token) => {
                  if (err) return res.status(500).json({ status: "error", msg: "Erreur serveur" });

                  return res.status(200).json({
                    status: "ok",
                    msg: "Compte personnel créé avec succès",
                    token,
                    user: {
                      id: savedUser._id,
                      prenom: savedUser.prenom,
                      nom: savedUser.nom,
                      email: savedUser.email,
                      telephone: savedUser.telephone,
                      departement: savedUser.departement,
                      role: savedUser.role,
                    },
                  });
                }
              );
            })
            .catch((err) => {
              console.error(err);
              return res.status(500).json({ status: "error", msg: "Erreur serveur" });
            });
        });
      });
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ status: "error", msg: "Erreur serveur" });
    });
});

module.exports = router;
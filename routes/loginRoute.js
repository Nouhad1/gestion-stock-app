const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../backend/db');

// Route de connexion
router.post('/', (req, res) => {
  const { login, mot_de_passe } = req.body;
  console.log("Tentative de connexion :", login);

  if (!login || !mot_de_passe) {
    return res.status(400).json({ message: 'Login et mot de passe requis.' });
  }

  const sql = 'SELECT * FROM employes WHERE login = ?';
  db.query(sql, [login], async (err, results) => {
    if (err) {
      console.error("Erreur SQL :", err);
      return res.status(500).json({ message: 'Erreur serveur.' });
    }

    if (results.length === 0) {
      return res.status(401).json({ message: 'Utilisateur non trouvé.' });
    }

    const utilisateur = results[0];

    // Comparer le mot de passe haché
    const isMatch = await bcrypt.compare(mot_de_passe, utilisateur.mot_de_passe);

    if (!isMatch) {
      return res.status(401).json({ message: 'Mot de passe incorrect.' });
    }

    // Connexion réussie
    res.status(200).json({
      message: 'Connexion réussie',
      user: {
        id: utilisateur.id,
        nom: utilisateur.nom,
        login: utilisateur.login,
        role: utilisateur.role
      }
    });
  });
});

module.exports = router;

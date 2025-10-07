const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../backend/db');

// Route de connexion
router.post('/', async (req, res) => {
  const { login, mot_de_passe } = req.body;
  console.log("Tentative de connexion :", login);

  if (!login || !mot_de_passe) {
    return res.status(400).json({ message: 'Login et mot de passe requis.' });
  }

  try {
    // Vérifier si l'utilisateur existe
    const [results] = await db.query('SELECT * FROM employes WHERE login = ?', [login]);

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

  } catch (err) {
    console.error("Erreur serveur lors de la connexion :", err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

/*router.get('/', async (req, res) => {
  try {
    const [employes] = await db.query('SELECT * FROM employes');
    res.json(employes);
  } catch (error) {
    console.error('Erreur récupération employes:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});*/
module.exports = router;

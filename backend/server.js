// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middlewares ---
app.use(cors());
app.use(express.json());

// --- Debug ---
app.use((req, res, next) => {
  console.log(`🟢 ${req.method} ${req.path}`);
  next();
});

// --- Routes personnalisées ---
const produitsRoutes = require('../routes/produitsPM');
const commandesRoutes = require('../routes/cmdRoute');
const achatsRoutes = require('../routes/achatsRoute');
const clientsRoutes = require('../routes/clientsRoute');
const homeRoute = require('../routes/HomeRoutes');

app.use('/api/produits', produitsRoutes);
app.use('/api/commandes', commandesRoutes);
app.use('/api/achats', achatsRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/dashboard', homeRoute);

// --- Route de login ---
app.post('/api/login', (req, res) => {
  const { login, mot_de_passe } = req.body;

  if (!login || !mot_de_passe) {
    return res.status(400).json({ success: false, message: 'Champs requis manquants.' });
  }

  const sql = 'SELECT * FROM employes WHERE login = ?';
  db.query(sql, [login], async (err, rows) => {
    if (err) {
      console.error('❌ Erreur SQL:', err.message);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Utilisateur non trouvé.' });
    }

    const user = rows[0];
    const passwordMatch = await bcrypt.compare(mot_de_passe, user.mot_de_passe);

    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'Mot de passe incorrect.' });
    }

    res.json({
      success: true,
      message: 'Connexion réussie',
      user: {
        id: user.id,
        login: user.login,
        nom: user.nom,
        role: user.role,
      },
    });
  });
});

// --- Route test login ---
app.get('/api/test-login', (req, res) => {
  const { login, mot_de_passe } = req.query;

  if (!login || !mot_de_passe) {
    return res.status(400).json({ success: false, message: 'Login et mot de passe requis' });
  }

  const sql = 'SELECT password FROM employes WHERE login = ?';
  db.query(sql, [login], (err, results) => {
    if (err) {
      console.error('Erreur SQL:', err);
      return res.status(500).json({ success: false, message: 'Erreur serveur', error: err.message });
    }

    if (results.length === 0) {
      // utilisateur non trouvé
      return res.json({ success: true, valide: false });
    }

    const hash = results[0].mot_de_passe;

    bcrypt.compare(mot_de_passe, hash, (err, isMatch) => {
      if (err) {
        console.error('Erreur bcrypt:', err);
        return res.status(500).json({ success: false, message: 'Erreur serveur' });
      }

      res.json({ success: true, valide: isMatch });
    });
  });
});

// --- Lancement du serveur ---
app.listen(PORT, () => {
  console.log(`🚀 Serveur Express lancé sur le port ${PORT}`);
});

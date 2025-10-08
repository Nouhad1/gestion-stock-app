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

// --- Utilisation des routes ---
app.use('/api/produits', produitsRoutes);
app.use('/api/commandes', commandesRoutes);
app.use('/api/achats', achatsRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/dashboard', homeRoute);

// --- Route de login ---
app.post('/api/login', async (req, res) => {
  const { login, mot_de_passe } = req.body;

  if (!login || !mot_de_passe) {
    return res.status(400).json({ success: false, message: 'Champs requis manquants.' });
  }

  try {
    const [rows] = await db.query('SELECT * FROM employes WHERE login = ?', [login]);

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
  } catch (err) {
    console.error('❌ Erreur SQL:', err.message);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// --- Route test DB ---
app.get('/api/test-db', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT 1 AS test');
    res.json({ success: true, message: 'Connexion MySQL OK', result: rows });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Erreur connexion MySQL',
      error: err.message,
    });
  }
});

// --- Démarrage du serveur ---
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Serveur lancé sur le port ${PORT}`);
});

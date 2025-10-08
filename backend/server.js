// backend/server.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const db = require('./db'); // ✅ connexion via mysql2/promise

const app = express();

// --- Middlewares ---
app.use(cors());
app.use(express.json());

// Middleware debug
app.use((req, res, next) => {
  console.log('🟢 Requête reçue pour :', req.method, req.path);
  next();
});

// --- Import des routes ---
const produitsRoutes = require('../routes/produitsPM');
const commandesRoutes = require('../routes/cmdRoute');
const achatsRoutes = require('../routes/achatsRoute');
const homeRoute = require('../routes/HomeRoutes');
const clientsRoutes = require('../routes/clientsRoute');

// --- Utilisation des routes ---
app.use('/api/produits', produitsRoutes);
app.use('/api/commandes', commandesRoutes);
app.use('/api/achats', achatsRoutes);
app.use('/api/dashboard', homeRoute);
app.use('/api/clients', clientsRoutes);

// --- Route de connexion intégrée ---
app.post('/api/login', async (req, res) => {
  const { login, mot_de_passe } = req.body;

  if (!login || !mot_de_passe) {
    return res.status(400).json({ success: false, message: 'Champs requis manquants.' });
  }

  try {
    // ✅ Pas besoin de .promise()
    const [results] = await db.query('SELECT * FROM employes WHERE login = ?', [login]);

    if (results.length === 0) {
      return res.status(401).json({ success: false, message: 'Utilisateur non trouvé.' });
    }

    const user = results[0];
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
    console.error('❌ Erreur lors de la connexion :', err);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// --- Route test pour vérifier la connexion à MySQL ---
app.get('/api/test-db', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT 1 AS test');
    res.json({ success: true, message: 'Connexion MySQL OK', result: rows });
  } catch (err) {
    console.error('❌ Erreur test MySQL :', err);
    res.status(500).json({ success: false, message: 'Erreur connexion MySQL', error: err.message });
  }
});

// --- Lancement du serveur ---
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Serveur Express lancé sur le port ${PORT}`);
});

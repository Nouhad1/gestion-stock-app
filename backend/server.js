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
const statutRoutes = require("../routes/statutPaiement");
const transfertsRoutes = require('./routes/transferts');


app.use('/api/produits', produitsRoutes);
app.use('/api/commandes', commandesRoutes);
app.use('/api/achats', achatsRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/dashboard', homeRoute);
app.use("/api/statut", statutRoutes);
app.use('/api/transferts',transfertsRoutes);


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

    const passwordMatch = await bcrypt.compare(mot_de_passe, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'Mot de passe incorrect.' });
    }

    res.json({
      success: true,
      message: 'Connexion réussie',
      user: {
        matricule: user.matricule,
        login: user.login,
      },
    });
  });
});

// --- Lancement serveur ---
app.listen(PORT, () => {
  console.log(`🚀 Serveur Express lancé sur le port ${PORT}`);
});
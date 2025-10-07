require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Middleware debug pour voir toutes les requêtes
app.use((req, res, next) => {
  console.log('Request reçue pour :', req.path);
  next();
});

// Connexion à la base de données
const db = require('./db'); 

/// Routes personnalisées
const produitsRoutes = require('../routes/produitsPM');
const commandesRoutes = require('../routes/cmdRoute');
const achatsRoutes = require('../routes/achatsRoute');
const homeRoute = require('../routes/HomeRoutes');
const clientsRoutes = require('../routes/clientsRoute');
const loginRoutes = require('../routes/loginRoute');

// Utilisation des routes
app.use('/api/produits', produitsRoutes);
app.use('/api/commandes', commandesRoutes);
app.use('/api/achats', achatsRoutes);
app.use('/api/dashboard',homeRoute);
app.use('/api/clients', clientsRoutes);
app.use('/api/login',loginRoutes);



// Lancement du serveur
const PORT = process.env.PORT || 3306;
app.listen(PORT, () => {
  console.log(`🚀 Serveur Express lancé sur le port ${PORT}`);
});

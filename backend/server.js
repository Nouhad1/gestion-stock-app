require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');

const app = express();
app.use(express.json());

// Connexion MySQL
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

// Tester la connexion
db.connect(err => {
  if (err) {
    console.error('❌ Erreur de connexion MySQL:', err.message);
    process.exit(1); // Stoppe le serveur si la connexion échoue
  }
  console.log('✅ Connecté à MySQL Railway');
});

// Exemple de route API
app.get('/api/produits', (req, res) => {
  db.query('SELECT * FROM produits', (err, results) => {
    if (err) {
      console.error('❌ Erreur lors de la récupération des produits:', err.message);
      return res.status(500).json({ error: 'Erreur serveur' });
    }
    res.json(results);
  });
});

// Démarrage serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur Express lancé sur http://localhost:${PORT}`);
});

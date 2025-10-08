const express = require('express');
const router = express.Router();
const db = require('../backend/db');

router.get('/', (req, res) => {
  db.query('SELECT id, nom FROM clients', (err, clients) => {
    if (err) {
      console.error('Erreur récupération clients:', err);
      return res.status(500).json({ error: 'Erreur serveur' });
    }
    res.json(clients);
  });
});

module.exports = router;

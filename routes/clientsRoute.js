const express = require('express');
const router = express.Router();
const db = require('../backend/db');

router.get('/', async (req, res) => {
  try {
    const [clients] = await db.query('SELECT id, nom FROM clients');
    res.json(clients);
  } catch (error) {
    console.error('Erreur récupération clients:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const db = require('../backend/db');

const employesAutorises = [
  'ADMP001',
  'EMP001',
  'EMP002',
  'EMP003',
];

/* ================= TRANSFERT ================= */
router.post('/', async (req, res) => {
  try {

    const {
      matricule,
      produit_reference,
      depot_source,
      depot_destination,
      quantite,
    } = req.body;

    if (!produit_reference || !depot_source || !depot_destination || !quantite) {
      return res.status(400).json({ message: 'Champs manquants' });
    }

    const [rows] = await db.promise().query(
      `SELECT * FROM produits WHERE reference = ?`,
      [produit_reference]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Produit introuvable' });
    }

    const produit = rows[0];

    let stock1 = Number(produit.quantite_stock || 0);
    let stock2 = Number(produit.quantite_stock_2 || 0);

    const stockSource =
      depot_source === 'depot1' ? stock1 : stock2;

    if (Number(quantite) > stockSource) {
      return res.status(400).json({ message: 'Stock insuffisant' });
    }

    // sortie
    if (depot_source === 'depot1') stock1 -= Number(quantite);
    else stock2 -= Number(quantite);

    // entrée
    if (depot_destination === 'depot1') stock1 += Number(quantite);
    else stock2 += Number(quantite);

    await db.promise().query(
      `UPDATE produits SET quantite_stock=?, quantite_stock_2=? WHERE reference=?`,
      [stock1, stock2, produit_reference]
    );

    // HISTORIQUE
    if (employesAutorises.includes(matricule)) {
      await db.promise().query(
        `INSERT INTO historique_transferts
        (matricule, produit_reference, depot_source, depot_destination, quantite, date_transfert)
        VALUES (?, ?, ?, ?, ?, NOW())`,
        [
          matricule,
          produit_reference,
          depot_source,
          depot_destination,
          quantite,
        ]
      );
    }

    return res.json({
      success: true,
      message: 'Transfert effectué',
    });

  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
});

/* ================= HISTORIQUE ================= */
router.get('/historique', async (req, res) => {
  try {
    const [rows] = await db.promise().query(
      `SELECT * FROM historique_transferts ORDER BY id DESC`
    );

    res.json(rows);

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
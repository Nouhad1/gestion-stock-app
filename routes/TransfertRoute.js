const express = require('express');

const router = express.Router();

const db = require('../backend/db');

/* =========================
   EMPLOYÉS AUTORISÉS
========================= */

const employesAutorises = [
  'ADMP001',
  'EMP001',
  'EMP002',
  'EMP003',
];

/* =========================
   TRANSFERT STOCK
========================= */

router.post('/', async (req, res) => {

  try {

    const {
      matricule,
      produit_reference,
      depot_source,
      depot_destination,
      quantite,
    } = req.body;

    /* ================= VALIDATION ================= */

    if (
      !produit_reference ||
      !depot_source ||
      !depot_destination ||
      !quantite
    ) {
      return res.status(400).json({
        message: 'Champs manquants',
      });
    }

    /* ================= PRODUIT ================= */

    const [rows] = await db.promise().query(
      `
      SELECT *
      FROM produits
      WHERE reference = ?
      `,
      [produit_reference]
    );

    if (rows.length === 0) {

      return res.status(404).json({
        message: 'Produit introuvable',
      });
    }

    const produit = rows[0];

    /* ================= STOCK SOURCE ================= */

    let stock1 =
      Number(produit.quantite_stock || 0);

    let stock2 =
      Number(produit.quantite_stock_2 || 0);

    const stockSource =
      depot_source === 'depot1'
        ? stock1
        : stock2;

    if (Number(quantite) > stockSource) {

      return res.status(400).json({
        message: 'Stock insuffisant',
      });
    }

    /* ================= SORTIE ================= */

    if (depot_source === 'depot1') {
      stock1 -= Number(quantite);
    } else {
      stock2 -= Number(quantite);
    }

    /* ================= ENTRÉE ================= */

    if (depot_destination === 'depot1') {
      stock1 += Number(quantite);
    } else {
      stock2 += Number(quantite);
    }

    /* ================= UPDATE PRODUIT ================= */

    await db.promise().query(
      `
      UPDATE produits
      SET
        quantite_stock = ?,
        quantite_stock_2 = ?
      WHERE reference = ?
      `,
      [
        stock1,
        stock2,
        produit_reference,
      ]
    );

    /* ================= HISTORIQUE ================= */

    if (
      employesAutorises.includes(
        matricule
      )
    ) {

      await db.promise().query(
        `
        INSERT INTO transferts_stock (
          produit_reference,
          depot_source,
          depot_destination,
          quantite
        )
        VALUES (?, ?, ?, ?)
        `,
        [
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

    console.log(
      'Erreur transfert:',
      err
    );

    return res.status(500).json({
      message: 'Erreur serveur',
    });
  }
});

/* =========================
   HISTORIQUE
========================= */

router.get('/historique', async (req, res) => {

  try {

    const [rows] = await db.promise().query(
      `
      SELECT *
      FROM transferts_stock
      ORDER BY id DESC
      `
    );

    res.json(rows);

  } catch (err) {

    console.log(err);

    res.status(500).json({
      message: 'Erreur serveur',
    });
  }
});

module.exports = router;
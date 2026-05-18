const express = require('express');

const router = express.Router();

const db = require('../backend/db');

/* =========================
   TRANSFERT STOCK
========================= */

router.post('/', async (req, res) => {

  try {

    const {
      produit_reference,
      depot_source,
      depot_destination,
      quantite,
    } = req.body;

    // validation
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

    // récupération produit
    const [produits] =
      await db.promise().query(
        `
        SELECT *
        FROM produits
        WHERE reference = ?
      `,
        [produit_reference]
      );

    if (produits.length === 0) {

      return res.status(404).json({
        message: 'Produit introuvable',
      });
    }

    const produit = produits[0];

    // stock source
    const stockSource =
      depot_source === 'depot1'
        ? Number(produit.quantite_stock || 0)
        : Number(produit.quantite_stock_2 || 0);

    // vérification stock
    if (Number(quantite) > stockSource) {

      return res.status(400).json({
        message: 'Stock insuffisant',
      });
    }

    /* =========================
       CALCUL STOCKS
    ========================= */

    let nouveauStock1 =
      Number(produit.quantite_stock || 0);

    let nouveauStock2 =
      Number(produit.quantite_stock_2 || 0);

    // sortie source
    if (depot_source === 'depot1') {
      nouveauStock1 -= Number(quantite);
    } else {
      nouveauStock2 -= Number(quantite);
    }

    // entrée destination
    if (depot_destination === 'depot1') {
      nouveauStock1 += Number(quantite);
    } else {
      nouveauStock2 += Number(quantite);
    }

    /* =========================
       UPDATE PRODUITS
    ========================= */

    await db.promise().query(
      `
      UPDATE produits
      SET
        quantite_stock = ?,
        quantite_stock_2 = ?
      WHERE reference = ?
    `,
      [
        nouveauStock1,
        nouveauStock2,
        produit_reference,
      ]
    );

    /* =========================
       HISTORIQUE
    ========================= */

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

    res.json({
      success: true,
      message: 'Transfert effectué',
    });

  } catch (err) {

    console.log(
      'Erreur transfert:',
      err
    );

    res.status(500).json({
      message: 'Erreur serveur',
    });
  }
});

/* =========================
   AJOUT HISTORIQUE
========================= */

router.post('/historique-transferts', async (req, res) => {

    try {

      const {
        matricule,
        produit_reference,
        depot_source,
        depot_destination,
        quantite,
      } = req.body;

      await db.promise().query(
        `
        INSERT INTO historique_transferts (
          matricule,
          produit_reference,
          depot_source,
          depot_destination,
          quantite
        )
        VALUES (?, ?, ?, ?, ?)
      `,
        [
          matricule,
          produit_reference,
          depot_source,
          depot_destination,
          quantite,
        ]
      );

      res.json({
        success: true,
      });

    } catch (err) {

      console.log(err);

      res.status(500).json({
        message: 'Erreur historique',
      });
    }
  }
);

module.exports = router;
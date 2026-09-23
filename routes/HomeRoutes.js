const express = require('express');
const router = express.Router();
const db = require('../backend/db');

// ==================== ROUTES DASHBOARD ====================


// ==========================================================
// 🔹 GET /api/dashboard/years
// Récupérer les années disponibles
// ==========================================================
router.get('/years', (req, res) => {
  const sql = `
    SELECT DISTINCT YEAR(date_commande) AS year
    FROM commandes
    WHERE date_commande IS NOT NULL
    ORDER BY year DESC
  `;

  db.query(sql, (err, rows) => {
    if (err) {
      console.error("Erreur /years :", err);
      return res.status(500).json({
        error: 'Erreur serveur'
      });
    }

    const years = rows.map(r => r.year);

    res.json(years);
  });
});


// ==========================================================
// 🔹 GET /api/dashboard/cards?year=2025
//
// Retourne :
// - valeur des achats
// - valeur des sorties
// - chiffre annuel client 209
// - chiffre annuel client 221
//
// Les deux chiffres clients sont calculés sur l'année sélectionnée.
// ==========================================================
router.get('/cards', (req, res) => {
  const { year } = req.query;

  if (!year) {
    return res.status(400).json({
      error: "Année requise"
    });
  }

  const sqlEntrees = `
    SELECT 
      COALESCE(SUM(quantite_achat), 0) AS totalEntrees,
      COALESCE(SUM(prix_achat * quantite_achat), 0) AS valeurAchats
    FROM achats
    WHERE YEAR(date_achat) = ?
  `;

  const sqlSorties = `
    SELECT 
      COALESCE(SUM(quantite_commande), 0) AS totalSorties,
      COALESCE(SUM(montant), 0) AS valeurSorties
    FROM commandes
    WHERE YEAR(date_commande) = ?
  `;

  // Chiffre annuel client 209
  const sqlClient209 = `
    SELECT 
      COALESCE(SUM(montant), 0) AS chiffreClient209
    FROM commandes
    WHERE client_id = 209
      AND YEAR(date_commande) = ?
  `;

  // Chiffre annuel client 221
  const sqlClient221 = `
    SELECT 
      COALESCE(SUM(montant), 0) AS chiffreClient221
    FROM commandes
    WHERE client_id = 221
      AND YEAR(date_commande) = ?
  `;


  // ==================== ENTRÉES ====================
  db.query(sqlEntrees, [year], (err, entreesRows) => {
    if (err) {
      console.error("Erreur /cards (entrees) :", err);

      return res.status(500).json({
        error: 'Erreur serveur'
      });
    }


    // ==================== SORTIES ====================
    db.query(sqlSorties, [year], (err2, sortiesRows) => {
      if (err2) {
        console.error("Erreur /cards (sorties) :", err2);

        return res.status(500).json({
          error: 'Erreur serveur'
        });
      }


      // ==================== CLIENT 209 ====================
      db.query(sqlClient209, [year], (err3, client209Rows) => {
        if (err3) {
          console.error("Erreur /cards (client 209) :", err3);

          return res.status(500).json({
            error: 'Erreur serveur'
          });
        }


        // ==================== CLIENT 221 ====================
        db.query(sqlClient221, [year], (err4, client221Rows) => {
          if (err4) {
            console.error("Erreur /cards (client 221) :", err4);

            return res.status(500).json({
              error: 'Erreur serveur'
            });
          }


          const entrees = entreesRows[0] || {};
          const sorties = sortiesRows[0] || {};
          const client209 = client209Rows[0] || {};
          const client221 = client221Rows[0] || {};


          // ==================== RÉPONSE ====================
          res.json({
            // Anciennes données
            totalEntrees: Number(entrees.totalEntrees) || 0,
            valeurAchats: Number(entrees.valeurAchats) || 0,

            totalSorties: Number(sorties.totalSorties) || 0,
            valeurSorties: Number(sorties.valeurSorties) || 0,

            // Nouvelles données
            chiffreClient209: Number(client209.chiffreClient209) || 0,
            chiffreClient221: Number(client221.chiffreClient221) || 0
          });
        });
      });
    });
  });
});


// ==========================================================
// 🔹 GET /api/dashboard/chart?year=2025
// Chiffre d'affaires par mois
// ==========================================================
router.get('/chart', (req, res) => {
  const { year } = req.query;

  if (!year) {
    return res.status(400).json({
      error: "Année requise"
    });
  }

  const sql = `
    SELECT 
      MONTH(date_commande) AS month,
      COALESCE(SUM(montant), 0) AS ca
    FROM commandes
    WHERE YEAR(date_commande) = ?
    GROUP BY MONTH(date_commande)
    ORDER BY month
  `;

  db.query(sql, [year], (err, rows) => {
    if (err) {
      console.error("Erreur /chart :", err);

      return res.status(500).json({
        error: 'Erreur serveur'
      });
    }

    const monthLabels = [
      "Jan",
      "Fév",
      "Mar",
      "Avr",
      "Mai",
      "Juin",
      "Juil",
      "Août",
      "Sep",
      "Oct",
      "Nov",
      "Déc"
    ];

    const result = rows.map(r => ({
      month: monthLabels[Number(r.month) - 1],
      ca: Number(r.ca) || 0
    }));

    res.json(result);
  });
});


// ==========================================================
// 🔹 GET /api/dashboard/products?year=2025
// Produits les plus sortis
// ==========================================================
router.get('/products', (req, res) => {
  const { year } = req.query;

  if (!year) {
    return res.status(400).json({
      error: "Année requise"
    });
  }

  const sql = `
    SELECT 
      p.designation,
      COALESCE(SUM(c.quantite_commande), 0) AS totalQuantity
    FROM produits p
    LEFT JOIN commandes c 
      ON c.produit_reference = p.reference
      AND YEAR(c.date_commande) = ?
    GROUP BY p.reference, p.designation
    ORDER BY totalQuantity DESC
  `;

  db.query(sql, [year], (err, rows) => {
    if (err) {
      console.error(
        "Erreur /products :",
        err.sqlMessage || err
      );

      return res.status(500).json({
        error: 'Erreur serveur'
      });
    }

    res.json(rows);
  });
});


module.exports = router;
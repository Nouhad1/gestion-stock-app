const express = require('express');
const router = express.Router();
const db = require('../backend/db');

// ==================== ROUTES DASHBOARD ====================

// GET /api/dashboard/years
router.get('/years', (req, res) => {
  const sql = `
    SELECT DISTINCT YEAR(date_commande) as year
    FROM commandes
    ORDER BY year DESC
  `;
  db.query(sql, (err, rows) => {
    if (err) {
      console.error("Erreur /years :", err);
      return res.status(500).json({ error: 'Erreur serveur' });
    }
    const years = rows.map(r => r.year);
    res.json(years);
  });
});

// GET /api/dashboard/cards?year=2025
router.get('/cards', (req, res) => {
  const { year } = req.query;
  if (!year) return res.status(400).json({ error: "Année requise" });

  const sqlEntrees = `
    SELECT 
      SUM(quantite_achat) AS totalEntrees,
      SUM(prix_achat * quantite_achat) AS valeurAchats
    FROM achats
    WHERE YEAR(date_achat) = ?
  `;
  const sqlSorties = `
    SELECT 
      SUM(quantite_commande) AS totalSorties,
      SUM(montant) AS valeurSorties
    FROM commandes
    WHERE YEAR(date_commande) = ?
  `;

  db.query(sqlEntrees, [year], (err, entreesRows) => {
    if (err) {
      console.error("Erreur /cards (entrees) :", err);
      return res.status(500).json({ error: 'Erreur serveur' });
    }

    db.query(sqlSorties, [year], (err2, sortiesRows) => {
      if (err2) {
        console.error("Erreur /cards (sorties) :", err2);
        return res.status(500).json({ error: 'Erreur serveur' });
      }

      const entrees = entreesRows[0] || {};
      const sorties = sortiesRows[0] || {};

      res.json({
        totalEntrees: entrees.totalEntrees || 0,
        valeurAchats: entrees.valeurAchats || 0,
        totalSorties: sorties.totalSorties || 0,
        valeurSorties: sorties.valeurSorties || 0,
      });
    });
  });
});

// GET /api/dashboard/chart?year=2025
router.get('/chart', (req, res) => {
  const { year } = req.query;
  if (!year) return res.status(400).json({ error: "Année requise" });

  const sql = `
    SELECT MONTH(date_commande) AS month, SUM(montant) AS ca
    FROM commandes
    WHERE YEAR(date_commande) = ?
    GROUP BY MONTH(date_commande)
    ORDER BY month
  `;

  db.query(sql, [year], (err, rows) => {
    if (err) {
      console.error("Erreur /chart :", err);
      return res.status(500).json({ error: 'Erreur serveur' });
    }

    const monthLabels = [
      "Jan", "Fév", "Mar", "Avr", "Mai", "Juin",
      "Juil", "Août", "Sep", "Oct", "Nov", "Déc"
    ];

    const result = rows.map(r => ({
      month: monthLabels[r.month - 1],
      ca: r.ca
    }));

    res.json(result);
  });
});

// GET /api/dashboard/products?year=2025
router.get('/products', (req, res) => {
  const { year } = req.query;
  if (!year) return res.status(400).json({ error: "Année requise" });

  const sql = `
    SELECT p.designation, SUM(c.quantite_commande) AS totalQuantity
    FROM produits p
    LEFT JOIN commandes c ON c.produit_reference = p.reference
    WHERE YEAR(c.date_commande) = ?
    GROUP BY p.reference
    ORDER BY totalQuantity DESC
  `;

  db.query(sql, [year], (err, rows) => {
    if (err) {
      console.error("Erreur /products :", err);
      return res.status(500).json({ error: 'Erreur serveur' });
    }
    res.json(rows);
  });
});

module.exports = router;

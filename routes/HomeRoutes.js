const express = require('express');
const router = express.Router();
const db = require('../backend/db');

// ==================== ROUTES DASHBOARD ====================

// GET /api/dashboard/years
router.get('/years', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT DISTINCT YEAR(date_commande) as year
      FROM commandes
      ORDER BY year DESC
    `);
    const years = rows.map(r => r.year);
    res.json(years);
  } catch (err) {
    console.error("Erreur /years :", err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/dashboard/cards?year=2025
router.get('/cards', async (req, res) => {
  const { year } = req.query;

  if (!year) {
    return res.status(400).json({ error: "Année requise" });
  }

  try {
    const [[entrees]] = await db.query(`
      SELECT 
        SUM(quantite_achat) AS totalEntrees,
        SUM(prix_achat * quantite_achat) AS valeurAchats
      FROM achats
      WHERE YEAR(date_achat) = ?
    `, [year]);

    const [[sorties]] = await db.query(`
      SELECT 
        SUM(quantite_commande) AS totalSorties,
        SUM(montant) AS valeurSorties
      FROM commandes
      WHERE YEAR(date_commande) = ?
    `, [year]);

    res.json({
      totalEntrees: entrees?.totalEntrees || 0,
      valeurAchats: entrees?.valeurAchats || 0,
      totalSorties: sorties?.totalSorties || 0,
      valeurSorties: sorties?.valeurSorties || 0,
    });
  } catch (err) {
    console.error("Erreur /cards :", err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/dashboard/chart?year=2025
router.get('/chart', async (req, res) => {
  const { year } = req.query;

  if (!year) {
    return res.status(400).json({ error: "Année requise" });
  }

  try {
    const [rows] = await db.query(`
      SELECT MONTH(date_commande) AS month, SUM(montant) AS ca
      FROM commandes
      WHERE YEAR(date_commande) = ?
      GROUP BY MONTH(date_commande)
      ORDER BY month
    `, [year]);

    const monthLabels = [
      "Jan", "Fév", "Mar", "Avr", "Mai", "Juin",
      "Juil", "Août", "Sep", "Oct", "Nov", "Déc"
    ];

    const result = rows.map(r => ({
      month: monthLabels[r.month - 1],
      ca: r.ca
    }));

    res.json(result);
  } catch (err) {
    console.error("Erreur /chart :", err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/dashboard/products?year=2025
router.get('/products', async (req, res) => {
  const { year } = req.query;

  if (!year) {
    return res.status(400).json({ error: "Année requise" });
  }

  try {
    const [rows] = await db.query(`
      SELECT p.designation, SUM(c.quantite_commande) AS totalQuantity
      FROM produits p
      LEFT JOIN commandes c ON c.produit_reference = p.reference
      WHERE YEAR(c.date_commande) = ?
      GROUP BY p.reference
      ORDER BY totalQuantity DESC
    `, [year]);

    res.json(rows);
  } catch (err) {
    console.error("Erreur /products :", err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;

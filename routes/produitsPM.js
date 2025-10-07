const express = require('express'); 
const router = express.Router();
const db = require('../backend/db'); 

// Fonction pour formater le stock (rouleaux et mètres)
function formatStockDecimal(stockFloat, longueurParRouleau) {
  if (!longueurParRouleau || longueurParRouleau <= 0) return stockFloat.toString();
  const rouleaux = Math.floor(stockFloat);
  const resteDecimal = stockFloat - rouleaux;
  const metresRestants = Math.round(resteDecimal * longueurParRouleau);
  return `${rouleaux},${metresRestants}`;
}

// GET tous les produits
router.get('/', async (req, res) => {
  try {
    const sql = `
      SELECT 
        p.reference, 
        p.designation, 
        p.prix_unitaire, 
        COALESCE(AVG(a.prix_achat), 0) AS prix_moyen_achat,
        COALESCE(p.quantite_stock, 0) AS quantite_stock,
        COALESCE(p.quantite_stock_2, 0) AS quantite_stock_2,
        COALESCE(p.longueur_par_rouleau, 0) AS longueur_par_rouleau
      FROM produits p
      LEFT JOIN achats a ON a.produit_reference = p.reference
      GROUP BY p.reference, p.designation, p.prix_unitaire, p.quantite_stock, p.quantite_stock_2, p.longueur_par_rouleau
      ORDER BY p.reference
    `;
    const [rows] = await db.query(sql);

    const produits = rows.map(p => ({
      ...p,
      stockAfficheDepot1: formatStockDecimal(p.quantite_stock, p.longueur_par_rouleau),
      stockAfficheDepot2: formatStockDecimal(p.quantite_stock_2, p.longueur_par_rouleau)
    }));

    res.json(produits);
  } catch (err) {
    console.error('Erreur serveur produits :', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// GET produit par référence avec historique
router.get('/:reference', async (req, res) => {
  const { reference } = req.params;
  try {
    const sql = `
      SELECT p.*,
        (SELECT GROUP_CONCAT(prix_achat) FROM achats WHERE produit_reference = p.reference) AS historique_achats
      FROM produits p
      WHERE p.reference = ?
    `;
    const [results] = await db.query(sql, [reference]);
    if (results.length === 0) return res.status(404).json({ message: 'Produit non trouvé' });

    const produit = results[0];
    produit.historique_achats = produit.historique_achats
      ? produit.historique_achats.split(',').map(Number)
      : [];

    res.json(produit);
  } catch (err) {
    console.error('Erreur serveur produit :', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// POST ajouter un produit
router.post('/', async (req, res) => {
  const { reference, designation, quantite_stock = 0 } = req.body;

  if (!reference || !designation) {
    return res.status(400).json({ error: 'Champs manquants : reference, designation' });
  }

  const qs = Number(quantite_stock) || 0;
  const sql = `
    INSERT INTO produits (reference, designation, quantite_stock, quantite_stock_2)
    VALUES (?, ?, ?, ?)
  `;

  try {
    await db.query(sql, [reference, designation, qs, 0]);
    res.status(201).json({
      message: 'Produit ajouté avec succès',
      produit: { reference, designation, quantite_stock: qs, quantite_stock_2: 0 }
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Référence déjà existante' });
    }
    console.error('Erreur ajout produit :', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT modifier un produit
router.put('/:reference', async (req, res) => {
  const { reference } = req.params;
  const { designation, prix_unitaire, quantite_stock, quantite_stock_2 } = req.body;

  if (!designation || prix_unitaire == null || quantite_stock == null || quantite_stock_2 == null) {
    return res.status(400).json({ message: 'Champs manquants pour la mise à jour' });
  }

  const sql = `
    UPDATE produits
    SET designation = ?, prix_unitaire = ?, quantite_stock = ?, quantite_stock_2 = ?
    WHERE reference = ?
  `;

  try {
    const [result] = await db.query(sql, [designation, prix_unitaire, quantite_stock, quantite_stock_2, reference]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Produit non trouvé' });
    res.json({ message: 'Produit mis à jour avec succès' });
  } catch (err) {
    console.error('Erreur mise à jour produit :', err);
    res.status(500).json({ message: 'Erreur lors de la mise à jour du produit' });
  }
});

module.exports = router;

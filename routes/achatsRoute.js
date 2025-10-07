const express = require('express');
const router = express.Router();
const db = require('../backend/db'); // ⚠️ Assure-toi que ce fichier exporte bien une connexion MySQL2 (pool ou promise)

// ==================== RÉCUPÉRER TOUS LES ACHATS ====================
router.get('/', async (req, res) => {
  try {
    const [result] = await db.query(`
      SELECT 
        a.id,
        a.produit_reference AS reference,
        p.designation,
        a.quantite_achat,
        a.quantite_depot1,
        a.quantite_depot2,
        a.prix_achat,
        DATE_FORMAT(a.date_achat, '%Y-%m-%d %H:%i:%s') AS date_achat
      FROM achats a
      JOIN produits p ON a.produit_reference = p.reference
      ORDER BY a.date_achat DESC
    `);
    res.json(result);
  } catch (err) {
    console.error('Erreur /api/achats :', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ==================== AJOUTER UN NOUVEL ACHAT ====================
router.post('/', async (req, res) => {
  try {
    let { produit_reference, quantite_depot1, quantite_depot2, prix_achat } = req.body;

    if (!produit_reference)
      return res.status(400).json({ error: 'Référence obligatoire' });

    quantite_depot1 = Number(quantite_depot1) || 0;
    quantite_depot2 = Number(quantite_depot2) || 0;

    if (quantite_depot1 <= 0 && quantite_depot2 <= 0)
      return res.status(400).json({ error: 'Remplir au moins une quantité' });

    prix_achat = prix_achat != null ? Number(prix_achat) : null;

    // Vérifier si le produit existe
    const [rows] = await db.query('SELECT * FROM produits WHERE reference = ?', [produit_reference]);

    const quantiteAchat = quantite_depot1 + quantite_depot2;

    const insertAchatSql = `
      INSERT INTO achats (produit_reference, quantite_depot1, quantite_depot2, quantite_achat, prix_achat, date_achat)
      VALUES (?, ?, ?, ?, ?, NOW())
    `;

    const updateStockSql = `
      UPDATE produits
      SET quantite_stock = COALESCE(quantite_stock, 0) + ?,
          quantite_stock_2 = COALESCE(quantite_stock_2, 0) + ?
      WHERE reference = ?
    `;

    // Si le produit n'existe pas encore → on le crée d'abord
    if (rows.length === 0) {
      await db.query(
        `INSERT INTO produits (reference, designation, quantite_stock, quantite_stock_2)
         VALUES (?, ?, ?, ?)`,
        [produit_reference, produit_reference, quantite_depot1, quantite_depot2]
      );
    }

    await db.query(insertAchatSql, [produit_reference, quantite_depot1, quantite_depot2, quantiteAchat, prix_achat]);
    await db.query(updateStockSql, [quantite_depot1, quantite_depot2, produit_reference]);

    res.status(201).json({ message: 'Achat ajouté et stock mis à jour' });
  } catch (err) {
    console.error('Erreur POST /api/achats :', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ==================== METTRE À JOUR UN ACHAT EXISTANT ====================
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  let { quantite_depot1, quantite_depot2, prix_achat } = req.body;

  if (quantite_depot1 == null && quantite_depot2 == null && prix_achat == null)
    return res.status(400).json({ error: 'Aucune valeur à mettre à jour' });

  try {
    const [rows] = await db.query(
      'SELECT quantite_depot1, quantite_depot2, produit_reference FROM achats WHERE id = ?',
      [id]
    );

    if (rows.length === 0)
      return res.status(404).json({ error: 'Achat non trouvé' });

    const oldQ1 = Number(rows[0].quantite_depot1) || 0;
    const oldQ2 = Number(rows[0].quantite_depot2) || 0;
    const produitRef = rows[0].produit_reference;

    quantite_depot1 = quantite_depot1 != null ? Number(quantite_depot1) : oldQ1;
    quantite_depot2 = quantite_depot2 != null ? Number(quantite_depot2) : oldQ2;
    prix_achat = prix_achat != null ? Number(prix_achat) : null;

    const diffQ1 = quantite_depot1 - oldQ1;
    const diffQ2 = quantite_depot2 - oldQ2;
    const quantiteAchat = quantite_depot1 + quantite_depot2;

    // Mettre à jour l’achat
    await db.query(
      `UPDATE achats
       SET quantite_depot1 = ?, quantite_depot2 = ?, quantite_achat = ?, prix_achat = COALESCE(?, prix_achat)
       WHERE id = ?`,
      [quantite_depot1, quantite_depot2, quantiteAchat, prix_achat, id]
    );

    // Ajuster le stock
    await db.query(
      `UPDATE produits
       SET quantite_stock = GREATEST(COALESCE(quantite_stock, 0) + ?, 0),
           quantite_stock_2 = GREATEST(COALESCE(quantite_stock_2, 0) + ?, 0)
       WHERE reference = ?`,
      [diffQ1, diffQ2, produitRef]
    );

    res.json({ message: 'Achat et stock mis à jour' });
  } catch (err) {
    console.error('Erreur PUT /api/achats/:id :', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;

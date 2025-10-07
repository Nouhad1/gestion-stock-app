const express = require('express');  
const router = express.Router();
const db = require('../backend/db');

// ==================== AJOUTER UNE COMMANDE ====================
router.post('/', (req, res) => {
  let { client_id, produit_reference, quantite_commande, metres_commandees, bl_num, montant } = req.body;

  if (!client_id || !produit_reference || (quantite_commande === undefined && metres_commandees === undefined)) {
    return res.status(400).json({ message: 'Champs manquants' });
  }

  quantite_commande = quantite_commande !== undefined ? parseFloat(quantite_commande) : 0;
  metres_commandees = metres_commandees !== undefined ? parseFloat(metres_commandees) : 0;
  if (isNaN(quantite_commande)) quantite_commande = 0;
  if (isNaN(metres_commandees)) metres_commandees = 0;

  if (quantite_commande <= 0 && metres_commandees <= 0) {
    return res.status(400).json({ message: 'Quantité ou mètres requis' });
  }

  db.query(
    `SELECT designation, COALESCE(quantite_stock, 0) AS quantite_stock, 
            COALESCE(longueur_par_rouleau, 0) AS longueur_par_rouleau 
     FROM produits 
     WHERE reference = ?`,
    [produit_reference],
    (err, produitRows) => {
      if (err) return res.status(500).json({ message: 'Erreur serveur' });
      if (produitRows.length === 0) return res.status(404).json({ message: 'Produit introuvable' });

      const produit = produitRows[0];
      const designation = produit.designation || '';
      let quantite_stock = parseFloat(produit.quantite_stock) || 0;
      const longueur_par_rouleau = parseFloat(produit.longueur_par_rouleau) || 0;

      const isLaniere = designation.toLowerCase().includes('roul');

      if (isLaniere) {
        const qteMaxMetres = quantite_stock * longueur_par_rouleau;
        if (metres_commandees > qteMaxMetres) {
          return res.status(400).json({ message: `La quantité demandée (${metres_commandees} m) dépasse le stock disponible (${qteMaxMetres} m).` });
        }
        const rouleauxUtilises = metres_commandees / longueur_par_rouleau;
        const nouveauStock = quantite_stock - rouleauxUtilises;

        db.query(
          `INSERT INTO commandes 
           (client_id, produit_reference, quantite_commande, metres_commandees, bl_num, montant, date_commande) 
           VALUES (?, ?, ?, ?, ?, ?, NOW())`,
          [client_id, produit_reference, quantite_commande, metres_commandees, bl_num || null, montant || null],
          (err) => {
            if (err) return res.status(500).json({ message: 'Erreur serveur' });

            db.query(
              `UPDATE produits SET quantite_stock = ? WHERE reference = ?`,
              [parseFloat(nouveauStock.toFixed(2)), produit_reference],
              (err) => {
                if (err) return res.status(500).json({ message: 'Erreur serveur' });
                res.status(201).json({ message: 'Commande enregistrée avec succès' });
              }
            );
          }
        );

      } else {
        if (quantite_commande > quantite_stock) return res.status(400).json({ message: 'Stock insuffisant' });
        const nouveauStock = quantite_stock - quantite_commande;

        db.query(
          `INSERT INTO commandes 
           (client_id, produit_reference, quantite_commande, bl_num, montant, date_commande) 
           VALUES (?, ?, ?, ?, ?, NOW())`,
          [client_id, produit_reference, quantite_commande, bl_num || null, montant || null],
          (err) => {
            if (err) return res.status(500).json({ message: 'Erreur serveur' });

            db.query(
              `UPDATE produits SET quantite_stock = ? WHERE reference = ?`,
              [parseFloat(nouveauStock.toFixed(2)), produit_reference],
              (err) => {
                if (err) return res.status(500).json({ message: 'Erreur serveur' });
                res.status(201).json({ message: 'Commande enregistrée avec succès' });
              }
            );
          }
        );
      }
    }
  );
});

// ==================== RECUPERER TOUTES LES COMMANDES ====================
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.promise().query(`
      SELECT 
        c.numCmd, 
        cl.nom AS nom_client, 
        p.designation AS designation_produit, 
        c.quantite_commande, 
        c.metres_commandees,
        DATE_FORMAT(c.date_commande, '%Y-%m-%d') AS date_commande,
        c.bl_num,
        c.montant
      FROM commandes c
      JOIN clients cl ON c.client_id = cl.id
      JOIN produits p ON c.produit_reference = p.reference
      ORDER BY c.date_commande DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error('Erreur lors de la récupération des commandes :', err);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération' });
  }
});

// ==================== STATISTIQUES ====================

// Stats journalier
router.get('/stats/journalier', async (req, res) => {
  const moisNum = Number(req.query.mois);
  const anneeNum = Number(req.query.annee);

  if (!moisNum || !anneeNum) {
    return res.status(400).json({ message: 'Mois et année requis et doivent être des nombres' });
  }

  try {
    const [rows] = await db.promise().query(
      `SELECT DATE(date_commande) AS jour, COUNT(numCmd) AS nb_commandes, SUM(montant) AS total
       FROM commandes
       WHERE MONTH(date_commande) = ? AND YEAR(date_commande) = ?
       GROUP BY jour
       ORDER BY jour`,
      [moisNum, anneeNum]
    );
    res.json(Array.isArray(rows) ? rows : []);
  } catch (err) {
    console.error('Erreur /stats/journalier:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.get('/stats/produits', async (req, res) => {
  const moisNum = Number(req.query.mois);
  const anneeNum = Number(req.query.annee);

  if (!moisNum || !anneeNum) {
    return res.status(400).json({ message: 'Mois et année requis et doivent être des nombres' });
  }

  try {
    const [rows] = await db.promise().query(
      `SELECT c.produit_reference AS reference_produit, p.designation, 
              SUM(c.quantite_commande) AS nb_sorties, SUM(c.montant) AS chiffre_affaires
       FROM commandes c
       JOIN produits p ON c.produit_reference = p.reference
       WHERE MONTH(c.date_commande) = ? 
         AND YEAR(c.date_commande) = ?
       GROUP BY c.produit_reference, p.designation`,
      [moisNum, anneeNum]
    );
    res.json(Array.isArray(rows) ? rows : []);
  } catch (err) {
    console.error('Erreur /stats/produits:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const db = require('../backend/db');

// ==================== AJOUTER UNE COMMANDE ====================
router.post('/', (req, res) => {
  let { client_id, produit_reference, quantite_commande, metres_commandees, bl_num, prix_unitaire } = req.body;

  if (!produit_reference || (quantite_commande === undefined && metres_commandees === undefined)) {
    return res.status(400).json({ message: 'Produit et quantité requis' });
  }

  quantite_commande = parseFloat(quantite_commande) || 0;
  metres_commandees = parseFloat(metres_commandees) || 0;
  prix_unitaire = parseFloat(prix_unitaire) || 0;

  if (quantite_commande <= 0 && metres_commandees <= 0) {
    return res.status(400).json({ message: 'Quantité ou mètres requis' });
  }

  db.query(
    `SELECT designation, COALESCE(quantite_stock,0) AS quantite_stock, COALESCE(longueur_par_rouleau,0) AS longueur_par_rouleau 
     FROM produits WHERE reference = ?`,
    [produit_reference],
    (err, produitRows) => {
      if (err) return res.status(500).json({ message: 'Erreur serveur' });
      if (produitRows.length === 0) return res.status(404).json({ message: 'Produit introuvable' });

      const produit = produitRows[0];
      const designation = produit.designation || '';
      let stock = parseFloat(produit.quantite_stock) || 0;
      const longueurParRouleau = parseFloat(produit.longueur_par_rouleau) || 0;
      const isLaniere = designation.toLowerCase().includes('roul');

      let montant = 0;

      if (isLaniere) {
        const qMetres = metres_commandees;
        const qRouleaux = quantite_commande;

        const qteMaxMetres = stock * longueurParRouleau;
        if (qMetres > qteMaxMetres) {
          return res.status(400).json({ message: `La quantité demandée (${qMetres} m) dépasse le stock disponible (${qteMaxMetres} m).` });
        }
        if (qRouleaux > stock) {
          return res.status(400).json({ message: `Stock max ${stock} rouleaux.` });
        }

        const rouleauxUtilises = qMetres / longueurParRouleau;
        stock -= rouleauxUtilises;

        montant = ((qRouleaux > 0 ? qRouleaux : qMetres) * prix_unitaire).toFixed(2);

        db.query(
          `INSERT INTO commandes (client_id, produit_reference, quantite_commande, metres_commandees, bl_num, prix_unitaire, montant, date_commande)
           VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
          [client_id || null, produit_reference, qRouleaux || 0, qMetres || 0, bl_num || null, prix_unitaire, montant],
          (err2) => {
            if (err2) return res.status(500).json({ message: 'Erreur lors de l\'ajout de la commande' });
            db.query(
              `UPDATE produits SET quantite_stock = ? WHERE reference = ?`,
              [parseFloat(stock.toFixed(2)), produit_reference],
              (err3) => {
                if (err3) return res.status(500).json({ message: 'Erreur lors de la mise à jour du stock' });
                res.status(201).json({ message: 'Commande enregistrée avec succès' });
              }
            );
          }
        );

      } else {
        if (quantite_commande > stock) return res.status(400).json({ message: 'Stock insuffisant' });
        stock -= quantite_commande;
        montant = (quantite_commande * prix_unitaire).toFixed(2);

        db.query(
          `INSERT INTO commandes (client_id, produit_reference, quantite_commande, bl_num, prix_unitaire, montant, date_commande)
           VALUES (?, ?, ?, ?, ?, ?, NOW())`,
          [client_id || null, produit_reference, quantite_commande, bl_num || null, prix_unitaire, montant],
          (err2) => {
            if (err2) return res.status(500).json({ message: 'Erreur lors de l\'ajout de la commande' });
            db.query(
              `UPDATE produits SET quantite_stock = ? WHERE reference = ?`,
              [parseFloat(stock.toFixed(2)), produit_reference],
              (err3) => {
                if (err3) return res.status(500).json({ message: 'Erreur lors de la mise à jour du stock' });
                res.status(201).json({ message: 'Commande enregistrée avec succès' });
              }
            );
          }
        );
      }
    }
  );
});

// ==================== AJOUTER PLUSIEURS COMMANDES ====================
router.post('/multiples', async (req, res) => {
  const { commandes } = req.body;

  if (!Array.isArray(commandes) || commandes.length === 0) {
    return res.status(400).json({ message: 'Aucune commande reçue.' });
  }

  const connection = await db.promise().getConnection();
  await connection.beginTransaction();

  try {
    for (const cmd of commandes) {
      const { client_id, produit_reference, quantite_commande, metres_commandees, bl_num, prix_unitaire } = cmd;

      if (!produit_reference || (!quantite_commande && !metres_commandees)) {
        throw new Error(`Champs manquants pour la commande du produit ${produit_reference}`);
      }

      // Récupération du produit
      const [produitRows] = await connection.query(
        `SELECT designation, COALESCE(quantite_stock,0) AS quantite_stock, COALESCE(longueur_par_rouleau,0) AS longueur_par_rouleau
         FROM produits WHERE reference = ?`,
        [produit_reference]
      );

      if (produitRows.length === 0) throw new Error(`Produit introuvable : ${produit_reference}`);

      const produit = produitRows[0];
      const designation = produit.designation || '';
      let stock = parseFloat(produit.quantite_stock) || 0;
      const longueurParRouleau = parseFloat(produit.longueur_par_rouleau) || 0;
      const isLaniere = designation.toLowerCase().includes('roul');

      let montant = 0;

      if (isLaniere) {
        const qMetres = parseFloat(metres_commandees) || 0;
        const qRouleaux = parseFloat(quantite_commande) || 0;

        const qteMaxMetres = stock * longueurParRouleau;
        if (qMetres > qteMaxMetres) throw new Error(`Stock insuffisant pour ${produit_reference}: ${qMetres}m > ${qteMaxMetres}m`);
        if (qRouleaux > stock) throw new Error(`Stock insuffisant pour ${produit_reference}: ${qRouleaux} rouleaux > ${stock}`);

        const rouleauxUtilises = qMetres / longueurParRouleau;
        stock -= rouleauxUtilises;

        montant = ((qRouleaux > 0 ? qRouleaux : qMetres) * parseFloat(prix_unitaire)).toFixed(2);

        await connection.query(
          `INSERT INTO commandes (client_id, produit_reference, quantite_commande, metres_commandees, bl_num, prix_unitaire, montant, date_commande)
           VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
          [client_id || null, produit_reference, qRouleaux || 0, qMetres || 0, bl_num || null, prix_unitaire || 0, montant]
        );
      } else {
        const q = parseFloat(quantite_commande) || 0;
        if (q > stock) throw new Error(`Stock insuffisant pour ${produit_reference}: ${q} > ${stock}`);
        stock -= q;

        montant = (q * parseFloat(prix_unitaire)).toFixed(2);

        await connection.query(
          `INSERT INTO commandes (client_id, produit_reference, quantite_commande, bl_num, prix_unitaire, montant, date_commande)
           VALUES (?, ?, ?, ?, ?, ?, NOW())`,
          [client_id || null, produit_reference, q, bl_num || null, prix_unitaire || 0, montant]
        );
      }

      // Mise à jour du stock
      await connection.query(
        `UPDATE produits SET quantite_stock = ? WHERE reference = ?`,
        [parseFloat(stock.toFixed(2)), produit_reference]
      );
    }

    await connection.commit();
    res.status(201).json({ message: 'Toutes les commandes ont été enregistrées avec succès.' });
  } catch (error) {
    await connection.rollback();
    console.error('Erreur insertion multiple :', error);
    res.status(500).json({ message: error.message || 'Erreur serveur lors de l\'ajout multiple' });
  } finally {
    connection.release();
  }
});

// ==================== RECUPERER TOUTES LES COMMANDES ====================
router.get('/', (req, res) => {
  const sql = `
    SELECT 
      c.numCmd, 
      COALESCE(cl.nom, '—') AS nom_client, 
      p.designation AS designation_produit, 
      c.quantite_commande, 
      c.metres_commandees,
      DATE_FORMAT(c.date_commande, '%Y-%m-%d') AS date_commande,
      c.bl_num,
      c.prix_unitaire,
      c.montant
    FROM commandes c
    LEFT JOIN clients cl ON c.client_id = cl.id
    JOIN produits p ON c.produit_reference = p.reference
    ORDER BY c.date_commande DESC
  `;
  db.query(sql, (err, rows) => {
    if (err) {
      console.error('Erreur GET /commandes:', err);
      return res.status(500).json({ message: 'Erreur serveur lors de la récupération' });
    }
    res.json(rows);
  });
});

// ==================== STATISTIQUES ====================
router.get('/stats/journalier', (req, res) => {
  const moisNum = Number(req.query.mois);
  const anneeNum = Number(req.query.annee);

  if (!moisNum || !anneeNum) {
    return res.status(400).json({ message: 'Mois et année requis et doivent être des nombres' });
  }

  const sql = `
    SELECT DATE(date_commande) AS jour, COUNT(numCmd) AS nb_commandes, SUM(montant) AS total
    FROM commandes
    WHERE MONTH(date_commande) = ? AND YEAR(date_commande) = ?
    GROUP BY jour
    ORDER BY jour
  `;
  db.query(sql, [moisNum, anneeNum], (err, rows) => {
    if (err) {
      console.error('Erreur /stats/journalier:', err);
      return res.status(500).json({ message: 'Erreur serveur' });
    }
    res.json(rows || []);
  });
});

router.get('/stats/produits', (req, res) => {
  const moisNum = Number(req.query.mois);
  const anneeNum = Number(req.query.annee);

  if (!moisNum || !anneeNum) {
    return res.status(400).json({ message: 'Mois et année requis et doivent être des nombres' });
  }

  const sql = `
    SELECT c.produit_reference AS reference_produit, p.designation, 
           SUM(c.quantite_commande) AS nb_sorties, SUM(c.montant) AS chiffre_affaires
    FROM commandes c
    JOIN produits p ON c.produit_reference = p.reference
    WHERE MONTH(c.date_commande) = ? AND YEAR(c.date_commande) = ?
    GROUP BY c.produit_reference, p.designation
  `;

  db.query(sql, [moisNum, anneeNum], (err, rows) => {
    if (err) {
      console.error('Erreur /stats/produits:', err);
      return res.status(500).json({ message: 'Erreur serveur' });
    }
    res.json(rows || []);
  });
});

module.exports = router;

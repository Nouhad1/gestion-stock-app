const express = require('express');
const router = express.Router();
const db = require('../backend/db');

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
      const {
        client_id,
        produit_reference,
        quantite_commande,
        metres_commandees,
        bl_num,
        prix_unitaire,
      } = cmd;

      if (!produit_reference || (!quantite_commande && !metres_commandees)) {
        throw new Error(`Champs manquants pour le produit ${produit_reference}`);
      }

      // 🔍 récupérer produit
      const [produitRows] = await connection.query(
        `SELECT designation, COALESCE(quantite_stock,0) AS quantite_stock, COALESCE(longueur_par_rouleau,0) AS longueur_par_rouleau
         FROM produits WHERE reference = ?`,
        [produit_reference]
      );

      if (produitRows.length === 0) {
        throw new Error(`Produit introuvable : ${produit_reference}`);
      }

      const produit = produitRows[0];
      const designation = produit.designation || '';
      let stock = parseFloat(produit.quantite_stock) || 0;
      const longueurParRouleau = parseFloat(produit.longueur_par_rouleau) || 0;
      const isLaniere = designation.toLowerCase().includes('roul');

      let montant = 0;

      if (isLaniere) {
        const qRouleaux = parseFloat(quantite_commande) || 0;
        const qMetres = parseFloat(metres_commandees) || 0;

        const qteMaxMetres = stock * longueurParRouleau;

        if (qMetres > qteMaxMetres) {
          throw new Error(`Stock insuffisant: ${qMetres}m > ${qteMaxMetres}m`);
        }

        if (qRouleaux > stock) {
          throw new Error(`Stock insuffisant: ${qRouleaux} rouleaux > ${stock}`);
        }

        // ✅ correction ici
        const rouleauxUtilises = qRouleaux + (qMetres / longueurParRouleau);
        stock -= rouleauxUtilises;

        // 💰 calcul montant
        const totalMetres = qRouleaux * longueurParRouleau + qMetres;
        montant = (totalMetres * parseFloat(prix_unitaire)).toFixed(2);

        await connection.query(
          `INSERT INTO commandes 
          (client_id, produit_reference, quantite_commande, metres_commandees, bl_num, prix_unitaire, montant, date_commande)
          VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            client_id || null,
            produit_reference,
            qRouleaux,
            qMetres,
            bl_num || null,
            prix_unitaire || 0,
            montant,
          ]
        );

      } else {
        const q = parseFloat(quantite_commande) || 0;

        if (q > stock) {
          throw new Error(`Stock insuffisant: ${q} > ${stock}`);
        }

        stock -= q;
        montant = (q * parseFloat(prix_unitaire)).toFixed(2);

        await connection.query(
          `INSERT INTO commandes 
          (client_id, produit_reference, quantite_commande, bl_num, prix_unitaire, montant, date_commande)
          VALUES (?, ?, ?, ?, ?, ?, NOW())`,
          [
            client_id || null,
            produit_reference,
            q,
            bl_num || null,
            prix_unitaire || 0,
            montant,
          ]
        );
      }

      // 🔄 mise à jour stock
      await connection.query(
        `UPDATE produits SET quantite_stock = ? WHERE reference = ?`,
        [parseFloat(stock.toFixed(2)), produit_reference]
      );
    }

    await connection.commit();
    res.status(201).json({ message: 'Commandes enregistrées avec succès' });

  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ message: error.message });
  } finally {
    connection.release();
  }
});

module.exports = router;
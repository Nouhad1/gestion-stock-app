const express = require('express');
const router = express.Router();
const db = require('../backend/db');

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
        transport,
        payement
      } = cmd;

      // ================= VALIDATIONS =================
      if (!client_id) throw new Error("client_id manquant !");
      if (!produit_reference) throw new Error("produit_reference manquant !");

      const prix = parseFloat(prix_unitaire) || 0;

      // ================= PRODUIT =================
      const [produitRows] = await connection.query(
        `SELECT designation, 
                COALESCE(quantite_stock,0) AS quantite_stock, 
                COALESCE(longueur_par_rouleau,0) AS longueur_par_rouleau
         FROM produits 
         WHERE reference = ?`,
        [produit_reference]
      );

      if (!produitRows.length) {
        throw new Error(`Produit introuvable : ${produit_reference}`);
      }

      const produit = produitRows[0];
      let stock = parseFloat(produit.quantite_stock) || 0;
      const longueur = parseFloat(produit.longueur_par_rouleau) || 0;
      const isLaniere = produit.designation.toLowerCase().includes('roul');

      let montant = 0;
      let insertResult;

      // ================= LANIERE =================
      if (isLaniere) {
        const qRouleaux = parseFloat(quantite_commande) || 0;
        const qMetres = parseFloat(metres_commandees) || 0;

        if (!qRouleaux && !qMetres) {
          throw new Error("Quantité lanière invalide");
        }

        const max = stock * longueur;

        if (qMetres > max) throw new Error("Stock insuffisant (mètres)");
        if (qRouleaux > stock) throw new Error("Stock insuffisant (rouleaux)");

        const utilise = qRouleaux + (qMetres / longueur);
        stock -= utilise;

        const totalMetres = qRouleaux * longueur + qMetres;
        montant = (totalMetres * prix).toFixed(2);

        const [result] = await connection.query(
          `INSERT INTO commandes 
          (client_id, produit_reference, quantite_commande, metres_commandees, bl_num, prix_unitaire, montant, date_commande)
          VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            client_id,
            produit_reference,
            qRouleaux,
            qMetres,
            bl_num || null,
            prix,
            montant,
          ]
        );

        insertResult = result;

      } else {
        // ================= NORMAL =================
        const q = parseFloat(quantite_commande) || 0;

        if (!q) throw new Error("Quantité invalide");
        if (q > stock) throw new Error("Stock insuffisant");

        stock -= q;
        montant = (q * prix).toFixed(2);

        const [result] = await connection.query(
          `INSERT INTO commandes 
          (client_id, produit_reference, quantite_commande, bl_num, prix_unitaire, montant, date_commande)
          VALUES (?, ?, ?, ?, ?, ?, NOW())`,
          [
            client_id,
            produit_reference,
            q,
            bl_num || null,
            prix,
            montant,
          ]
        );

        insertResult = result;
      }

      // ================= VALIDATION FK =================
      const id_commande = insertResult.insertId;

      if (!id_commande) {
        throw new Error("ID commande invalide (insertId null)");
      }

      const [check] = await connection.query(
        "SELECT numCmd FROM commandes WHERE numCmd = ?",
        [id_commande]
      );

      if (!check.length) {
        throw new Error("Commande non trouvée avant paiement (FK issue)");
      }

      // ================= PAIEMENT =================
      const transportSafe =
        transport === "Honda" ? "Honda" : "Messagerie";

      const payementSafe =
        payement === "paye" ? "paye" : "non_paye";

      console.log("👉 PAIEMENT INSERT:", {
        id_commande,
        client_id,
        transportSafe,
        payementSafe,
      });

      try {
        await connection.query(
          `INSERT INTO paiements 
          (id_commande, id_client, transport, statut_paiement)
          VALUES (?, ?, ?, ?)`,
          [
            id_commande,
            client_id,
            transportSafe,
            payementSafe,
          ]
        );
      } catch (err) {
        console.error("❌ ERREUR INSERT PAIEMENT:", err.sqlMessage || err.message);
        throw err;
      }

      // ================= STOCK =================
      await connection.query(
        `UPDATE produits 
         SET quantite_stock = ? 
         WHERE reference = ?`,
        [parseFloat(stock.toFixed(2)), produit_reference]
      );
    }

    await connection.commit();

    return res.status(201).json({
      message: 'Commandes + paiements enregistrés avec succès',
    });

  } catch (error) {
    await connection.rollback();
    console.error("❌ ERREUR BACKEND:", error.message);
    return res.status(500).json({ message: error.message });
  } finally {
    connection.release();
  }
});

module.exports = router;
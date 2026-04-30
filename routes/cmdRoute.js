const express = require("express");
const router = express.Router();
const db = require("../backend/db");

router.post("/multiples", async (req, res) => {
  const { commandes } = req.body;

  if (!Array.isArray(commandes) || commandes.length === 0) {
    return res.status(400).json({ message: "Aucune commande reçue." });
  }

  const connection = await db.promise().getConnection();
  await connection.beginTransaction();

  try {
    for (const cmd of commandes) {
      console.log("📦 CMD REÇUE:", cmd);

      const {
        client_id,
        produit_reference,
        quantite_commande,
        metres_commandees,
        bl_num,
        prix_unitaire,
        transport,
        payement,
      } = cmd;

      if (!client_id || !produit_reference) {
        throw new Error("Client ou produit manquant");
      }

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
        throw new Error("Produit introuvable");
      }

      const produit = produitRows[0];
      let stock = parseFloat(produit.quantite_stock);
      const longueur = parseFloat(produit.longueur_par_rouleau);
      const isLaniere = produit.designation.toLowerCase().includes("roul");

      let montant = 0;
      let insertResult;

      // ================= LANIERE =================
      if (isLaniere) {
        const qRouleaux = parseFloat(quantite_commande) || 0;
        const qMetres = parseFloat(metres_commandees) || 0;

        if (!qRouleaux && !qMetres) {
          throw new Error("Quantité invalide lanière");
        }

        const max = stock * longueur;

        if (qMetres > max) throw new Error("Stock insuffisant mètres");
        if (qRouleaux > stock) throw new Error("Stock insuffisant rouleaux");

        const totalMetres = qRouleaux * longueur + qMetres;
        stock -= qRouleaux + qMetres / longueur;

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
      }

      // ================= NORMAL =================
      else {
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

      // ================= ID COMMANDE =================
      const id_commande = insertResult.insertId;

      if (!id_commande) {
        throw new Error("Insert commande échoué (ID null)");
      }

      console.log("🧾 ID COMMANDE:", id_commande);

      // ================= PAIEMENT =================
      const transportSafe = transport === "Honda" ? "Honda" : "Messagerie";
      const payementSafe = payement === "paye" ? "paye" : "non_paye";

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

      console.log("💰 Paiement OK");

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
      message: "Commandes + paiements enregistrés avec succès",
    });

  } catch (error) {
    await connection.rollback();

    console.error("❌ ERREUR BACKEND COMPLET:", error);

    return res.status(500).json({
      message: error.message,
    });

  } finally {
    connection.release();
  }
});

module.exports = router;
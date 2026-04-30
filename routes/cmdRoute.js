const express = require("express");
const router = express.Router();
const db = require("../backend/db");

router.post("/multiples", async (req, res) => {
  const { commandes } = req.body;

  console.log("🚀 REQUÊTE REÇUE:", JSON.stringify(commandes));

  if (!Array.isArray(commandes) || commandes.length === 0) {
    return res.status(400).json({ message: "Aucune commande reçue." });
  }

  const connection = await db.promise().getConnection();
  await connection.beginTransaction();

  try {
    for (const cmd of commandes) {
      console.log("📦 CMD:", cmd);

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

      const prix = Number(prix_unitaire) || 0;

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
      let stock = Number(produit.quantite_stock);
      const longueur = Number(produit.longueur_par_rouleau);
      const isLaniere = produit.designation.toLowerCase().includes("roul");

      let montant = 0;

      // ================= INSERT COMMANDE =================
      let insertResult;

      if (isLaniere) {
        const qRouleaux = Number(quantite_commande) || 0;
        const qMetres = Number(metres_commandees) || 0;

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
        const q = Number(quantite_commande) || 0;

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

      // ================= DEBUG INSERT COMMANDE =================
      console.log("🧾 INSERT RESULT:", insertResult);

      const id_commande = insertResult.insertId;

      if (!id_commande) {
        throw new Error("insertId NULL → commande non créée");
      }

      console.log("🧾 ID COMMANDE:", id_commande);

      // ================= PAIEMENT =================
      const transportSafe = transport === "Honda" ? "Honda" : "Messagerie";
      const payementSafe = payement === "paye" ? "paye" : "non_paye";

      console.log("💰 INSERT PAIEMENT:", {
        id_commande,
        client_id,
        transportSafe,
        payementSafe,
      });

      try {
        const [paiementResult] = await connection.query(
          `INSERT INTO paiements
          (id_commande, id_client, transport, statut_paiement)
          VALUES (?, ?, ?, ?)`,
          [
            Number(id_commande),
            Number(client_id),
            transportSafe,
            payementSafe,
          ]
        );

        console.log("✅ PAIEMENT OK:", paiementResult.insertId);
      } catch (err) {
        console.log("❌ ERREUR PAIEMENT SQL:");
        console.log(err.sqlMessage || err.message);
        throw err;
      }
    }

    await connection.commit();

    return res.status(201).json({
      message: "OK - commandes + paiements enregistrés",
    });

  } catch (error) {
    await connection.rollback();

    console.log("❌ FULL ERROR:");
    console.log(error.sqlMessage || error.message);
    console.log(error);

    return res.status(500).json({
      message: error.sqlMessage || error.message,
    });

  } finally {
    connection.release();
  }
});

module.exports = router;
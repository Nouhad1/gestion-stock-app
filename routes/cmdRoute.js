const express = require("express");
const router = express.Router();
const db = require("../backend/db");

router.post("/multiples", async (req, res) => {
  const { commandes } = req.body;

  console.log("🚀 REQUÊTE REÇUE:", JSON.stringify(commandes, null, 2));

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
      console.log("🔍 FETCH PRODUIT...");
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
      console.log("📦 PRODUIT:", produit);

      let stock = Number(produit.quantite_stock || 0);
      const longueur = Number(produit.longueur_par_rouleau || 0);

      const designation = (produit.designation || "").toLowerCase();
      const isLaniere = designation.includes("roul");

      let montant = 0;
      let insertResult;

      // ================= INSERT COMMANDE =================
      console.log("🧾 AVANT INSERT COMMANDE");

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

      console.log("🧾 APRES INSERT COMMANDE:", insertResult);

      const id_commande = insertResult.insertId;

      if (!id_commande) {
        throw new Error("insertId NULL → commande non créée");
      }

      console.log("🧾 ID COMMANDE:", id_commande);

      // ================= PAIEMENT =================
      const transportSafe =
        transport === "Honda" ? "Honda" : "Messagerie";

      const payementSafe =
        payement === "paye" ? "paye" : "non_paye";

      console.log("💰 AVANT INSERT PAIEMENT:", {
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
        console.log("MESSAGE:", err.message);
        console.log("SQL:", err.sqlMessage);
        console.log("CODE:", err.code);

        // ⚠️ IMPORTANT : NE PAS BLOQUER TOUTE LA COMMANDE
        // throw err;

        console.log("⚠️ Paiement ignoré pour cette commande");
      }
    }

    await connection.commit();

    return res.status(201).json({
      message: "✅ Commandes enregistrées (paiements inclus si OK)",
    });

  } catch (error) {
    await connection.rollback();

    console.log("❌ FULL ERROR:");
    console.log(error.message);
    console.log(error);

    return res.status(500).json({
      message: error.message,
    });

  } finally {
    connection.release();
  }
});

module.exports = router;
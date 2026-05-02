const express = require("express");
const router = express.Router();
const db = require("../backend/db");

router.post("/multiples", async (req, res) => {
  const { commandes } = req.body;

  if (!Array.isArray(commandes) || commandes.length === 0) {
    return res.status(400).json({ message: "Aucune commande reçue." });
  }

  const connection = await db.promise().getConnection();

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
        payement,
      } = cmd;

      const prix = Number(prix_unitaire) || 0;

      const [produitRows] = await connection.query(
        `SELECT designation, COALESCE(longueur_par_rouleau,0) AS longueur
         FROM produits
         WHERE reference = ?`,
        [produit_reference]
      );

      if (!produitRows.length) {
        throw new Error("Produit introuvable");
      }

      const produit = produitRows[0];

      const isLaniere = (produit.designation || "")
        .toLowerCase()
        .includes("roul");

      let montant = 0;

      // ✅ FIX TRANSPORT ULTRA IMPORTANT
      let transportSafe = null;

      if (typeof transport === "string" && transport.trim() !== "") {
        const t = transport.trim().toLowerCase();

        if (t === "honda") {
          transportSafe = "Honda";
        } else if (t === "messagerie") {
          transportSafe = "Messagerie";
        }
      }

      // si rien envoyé → on laisse NULL (important)
      if (!transportSafe) {
        transportSafe = null;
      }

      // PAYEMENT SAFE
      let paiementSafe = null;

      if (typeof payement === "string" && payement.trim() !== "") {
        const p = payement.trim().toLowerCase();

        if (p === "paye") {
          paiementSafe = "paye";
        } else if (p === "non_paye") {
          paiementSafe = "non_paye";
        }
      }

      if (!paiementSafe) {
        paiementSafe = null;
      }

      console.log("🚚 FINAL transport:", transportSafe);
      console.log("💰 FINAL paiement:", paiementSafe);

      if (isLaniere) {
        const qRouleaux = Number(quantite_commande) || 0;
        const qMetres = Number(metres_commandees) || 0;

        const totalMetres =
          qRouleaux * produit.longueur + qMetres;

        montant = (totalMetres * prix).toFixed(2);

        await connection.query(
          `INSERT INTO commandes
          (client_id, produit_reference, quantite_commande, metres_commandees, bl_num, prix_unitaire, montant, transport, statut_paiement, date_commande)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            client_id,
            produit_reference,
            qRouleaux,
            qMetres,
            bl_num || null,
            prix,
            montant,
            transportSafe,
            paiementSafe,
          ]
        );
      } else {
        const q = Number(quantite_commande) || 0;

        montant = (q * prix).toFixed(2);

        await connection.query(
          `INSERT INTO commandes
          (client_id, produit_reference, quantite_commande, bl_num, prix_unitaire, montant, transport, statut_paiement, date_commande)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            client_id,
            produit_reference,
            q,
            bl_num || null,
            prix,
            montant,
            transportSafe,
            paiementSafe,
          ]
        );
      }
    }

    return res.status(201).json({
      message: "✅ Commandes enregistrées avec succès",
    });

  } catch (error) {
    console.log("❌ ERREUR BACKEND:", error.message);

    return res.status(500).json({
      message: error.message,
    });

  } finally {
    connection.release();
  }
});

module.exports = router;
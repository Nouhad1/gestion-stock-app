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
    await connection.beginTransaction();

    for (const cmd of commandes) {
      console.log("📥 CMD REÇU:", cmd);

      let {
        client_id,
        produit_reference,
        quantite_commande,
        metres_commandees,
        bl_num,
        prix_unitaire,
        transport_id,
        paiement_id,
        //date_echeance,
      } = cmd;

      // 🔥 sécurisation numérique
      quantite_commande = Number(quantite_commande || 0);
      metres_commandees = Number(metres_commandees || 0);
      prix_unitaire = Number(prix_unitaire || 0);

      // 🔎 produit
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

      // ======================
      // CAS LANIERE
      // ======================
      if (isLaniere) {
        const totalMetres =
          quantite_commande * produit.longueur + metres_commandees;

        montant = totalMetres * prix_unitaire;

        await connection.query(
          `INSERT INTO commandes
          (client_id, produit_reference, quantite_commande, metres_commandees, bl_num, montant, prix_unitaire, transport_id, paiement_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            client_id,
            produit_reference,
            quantite_commande,
            metres_commandees,
            bl_num,
            montant,
            prix_unitaire,
            transport_id,
            paiement_id,
            //date_echeance || null,
          ]
        );
      }

      // ======================
      // CAS NORMAL
      // ======================
      else {
        montant = quantite_commande * prix_unitaire;

        await connection.query(
          `INSERT INTO commandes
          (client_id, produit_reference, quantite_commande, bl_num, montant, prix_unitaire,transport_id, paiement_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [ 
            client_id,
            produit_reference,
            quantite_commande,
            bl_num,
            montant,
            prix_unitaire,
            transport_id,
            paiement_id,
            //date_echeance || null,
          ]
        );
      }
    }

    await connection.commit();

    res.status(201).json({
      message: "Commandes enregistrées avec succès",
    });

  } catch (err) {
    await connection.rollback();
    console.log("❌ ERROR:", err.message);

    res.status(500).json({
      message: err.message,
    });

  } finally {
    connection.release();
  }
});

module.exports = router;
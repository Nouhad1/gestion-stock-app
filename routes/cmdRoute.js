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
        transport,
        statut_paiement,
        date_echeance,
      } = cmd;

      // 🔥 sécurisation des champs texte
      const transportFinal =
        transport && transport.trim() !== ""
          ? transport.trim()
          : "Messagerie";

      const paiementFinal =
        statut_paiement && statut_paiement.trim() !== ""
          ? statut_paiement.trim()
          : "non_paye";

      console.log("🚚 transport FINAL:", transportFinal);
      console.log("💰 paiement FINAL:", paiementFinal);

      // 🔎 récupérer produit
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

      if (isLaniere) {
        const totalMetres =
          Number(quantite_commande || 0) * produit.longueur +
          Number(metres_commandees || 0);

        montant = totalMetres * Number(prix_unitaire || 0);

        await connection.query(
          `INSERT INTO commandes
          (client_id, produit_reference, quantite_commande, metres_commandees, bl_num, montant, prix_unitaire, transport, statut_paiement, date_echeance)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            client_id,
            produit_reference,
            Number(quantite_commande || 0),
            Number(metres_commandees || 0),
            bl_num,
            montant,
            Number(prix_unitaire || 0),
            transportFinal,
            paiementFinal,
            date_echeance || null,
          ]
        );
      } else {
        montant =
          Number(quantite_commande || 0) * Number(prix_unitaire || 0);

        await connection.query(
          `INSERT INTO commandes
          (client_id, produit_reference, quantite_commande, bl_num, montant, prix_unitaire, transport, statut_paiement, date_echeance)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            client_id,
            produit_reference,
            Number(quantite_commande || 0),
            bl_num,
            montant,
            Number(prix_unitaire || 0),
            transportFinal,
            paiementFinal,
            date_echeance || null,
          ]
        );
      }
    }

    await connection.commit();

    res.status(201).json({ message: "Commandes enregistrées avec succès" });

  } catch (err) {
    await connection.rollback();
    console.log("❌ ERROR:", err.message);
    res.status(500).json({ message: err.message });

  } finally {
    connection.release();
  }
});

module.exports = router;
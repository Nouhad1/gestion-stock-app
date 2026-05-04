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

      console.log("📥 CMD REÇU:", cmd);

      // =========================
      // SAFE EXTRACTION
      // =========================
      const client_id = cmd.client_id ?? null;
      const produit_reference = cmd.produit_reference ?? null;
      const quantite_commande = Number(cmd.quantite_commande) || 0;
      const metres_commandees = Number(cmd.metres_commandees) || 0;
      const bl_num = cmd.bl_num ?? null;
      const prix_unitaire = Number(cmd.prix_unitaire) || 0;

      // =========================
      // TRANSPORT CLEAN
      // =========================
      const transportRaw = String(cmd.transport ?? "").trim().toLowerCase();

      const transport =
        transportRaw === "honda"
          ? "Honda"
          : "Messagerie";

      // =========================
      // PAIEMENT CLEAN
      // =========================
      const statut_paiement = String(cmd.statut_paiement ?? "non_paye")
        .trim()
        .toLowerCase();

      // =========================
      // DATE ÉCHÉANCE
      // =========================
      const date_echeance = cmd.date_echeance ?? null;

      console.log("📦 FINAL VALUES:", {
        transport,
        statut_paiement,
        date_echeance,
      });

      // =========================
      // PRODUIT
      // =========================
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

      // =========================
      // INSERT LANIÈRE
      // =========================
      if (isLaniere) {
        const totalMetres =
          quantite_commande * produit.longueur + metres_commandees;

        montant = totalMetres * prix_unitaire;

        await connection.query(
          `INSERT INTO commandes
          (client_id, produit_reference, quantite_commande, metres_commandees, bl_num, montant, prix_unitaire, transport, statut_paiement, date_echeance)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            client_id,
            produit_reference,
            quantite_commande,
            metres_commandees,
            bl_num,
            montant,
            prix_unitaire,
            transport,
            statut_paiement,
            date_echeance,
          ]
        );
      }

      // =========================
      // INSERT NORMAL
      // =========================
      else {
        montant = quantite_commande * prix_unitaire;

        await connection.query(
          `INSERT INTO commandes
          (client_id, produit_reference, quantite_commande, bl_num, montant, prix_unitaire, transport, statut_paiement, date_echeance)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            client_id,
            produit_reference,
            quantite_commande,
            bl_num,
            montant,
            prix_unitaire,
            transport,
            statut_paiement,
            date_echeance,
          ]
        );
      }
    }

    res.status(201).json({ message: "Commande enregistrée avec succès" });

  } catch (err) {
    console.log("❌ ERROR:", err.message);
    res.status(500).json({ message: err.message });

  } finally {
    connection.release();
  }
});

module.exports = router;
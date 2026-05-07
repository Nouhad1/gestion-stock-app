const express = require("express");
const router = express.Router();
const db = require("../backend/db");

router.post("/multiples", async (req, res) => {
  const { commandes } = req.body;

  if (!Array.isArray(commandes) || commandes.length === 0) {
    return res.status(400).json({
      message: "Aucune commande reçue.",
    });
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
      } = cmd;

      // =========================
      // 🔒 sécurisation
      // =========================
      quantite_commande = Number(quantite_commande || 0);
      metres_commandees = Number(metres_commandees || 0);
      prix_unitaire = Number(prix_unitaire || 0);

      // =========================
      // 🚚 DATE ÉCHÉANCE AUTO
      // =========================
      let delai = 0;

      if (transport_id == 1) {
        delai = 7;
      } else if (transport_id == 2) {
        delai = 30;
      }

      const dateEcheance = new Date();
      dateEcheance.setDate(dateEcheance.getDate() + delai);

      const dateEcheanceSQL = dateEcheance
        .toISOString()
        .slice(0, 10);

      // =========================
      // 🔎 PRODUIT
      // =========================
      const [produitRows] = await connection.query(
        `
        SELECT 
          designation,
          quantite_stock,
          COALESCE(longueur_par_rouleau,0) AS longueur
        FROM produits
        WHERE reference = ?
        `,
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
      // 📦 CAS LANIERE
      // =========================
      if (isLaniere) {

        // total mètres sortis
        const totalMetres =
          (quantite_commande * produit.longueur) +
          metres_commandees;

        // ✅ montant ×100
        montant = totalMetres * prix_unitaire ;

        // insertion commande
        await connection.query(
          `
          INSERT INTO commandes
          (
            client_id,
            produit_reference,
            quantite_commande,
            metres_commandees,
            bl_num,
            montant,
            prix_unitaire,
            Date_echeance,
            transport_id,
            paiement_id
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            client_id,
            produit_reference,
            quantite_commande,
            metres_commandees,
            bl_num,
            montant,
            prix_unitaire,
            dateEcheanceSQL,
            transport_id,
            paiement_id,
          ]
        );

        // =========================
        // 🔻 MISE À JOUR STOCK
        // =========================

        // rouleaux utilisés
        let rouleauxUtilises = 0;

        if (produit.longueur > 0) {
          rouleauxUtilises =
            totalMetres / produit.longueur;
        }

        const nouveauStock =
          Number(produit.quantite_stock) -
          rouleauxUtilises;

        await connection.query(
          `
          UPDATE produits
          SET quantite_stock = ?
          WHERE reference = ?
          `,
          [nouveauStock, produit_reference]
        );
      }

      // =========================
      // 📦 CAS NORMAL
      // =========================
      else {

        montant = quantite_commande * prix_unitaire;

        // insertion commande
        await connection.query(
          `
          INSERT INTO commandes
          (
            client_id,
            produit_reference,
            quantite_commande,
            bl_num,
            montant,
            prix_unitaire,
            Date_echeance,
            transport_id,
            paiement_id
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            client_id,
            produit_reference,
            quantite_commande,
            bl_num,
            montant,
            prix_unitaire,
            dateEcheanceSQL,
            transport_id,
            paiement_id,
          ]
        );

        // =========================
        // 🔻 MISE À JOUR STOCK
        // =========================
        await connection.query(
          `
          UPDATE produits
          SET quantite_stock = quantite_stock - ?
          WHERE reference = ?
          `,
          [quantite_commande, produit_reference]
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

// ======================
// GET COMMANDES
// ======================
router.get("/", async (req, res) => {
  try {

    const [rows] = await db.promise().query(`
      SELECT 
        c.*,
        cl.nom AS nom_client,
        p.designation AS designation_produit
      FROM commandes c
      LEFT JOIN clients cl 
        ON c.client_id = cl.id
      LEFT JOIN produits p 
        ON c.produit_reference = p.reference
      ORDER BY c.date_commande DESC
    `);

    res.json(rows);

  } catch (err) {

    console.log("❌ ERROR commandes:", err.message);

    res.status(500).json({
      message: "Erreur serveur commandes",
    });
  }
});

module.exports = router;
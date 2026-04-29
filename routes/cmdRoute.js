const express = require('express');
const router = express.Router();
const db = require('../backend/db');

router.post('/', (req, res) => {
  let {
    client_id,
    produit_reference,
    quantite_commande,
    metres_commandees,
    bl_num,
    prix_unitaire,
    transport
  } = req.body;

  if (!produit_reference || (quantite_commande === undefined && metres_commandees === undefined)) {
    return res.status(400).json({ message: 'Produit et quantité requis' });
  }

  quantite_commande = parseFloat(quantite_commande) || 0;
  metres_commandees = parseFloat(metres_commandees) || 0;
  prix_unitaire = parseFloat(prix_unitaire) || 0;

  db.query(
    `SELECT designation, COALESCE(quantite_stock,0) AS quantite_stock, 
            COALESCE(longueur_par_rouleau,0) AS longueur_par_rouleau 
     FROM produits WHERE reference = ?`,
    [produit_reference],
    (err, produitRows) => {
      if (err) return res.status(500).json({ message: 'Erreur serveur' });
      if (produitRows.length === 0) return res.status(404).json({ message: 'Produit introuvable' });

      const produit = produitRows[0];
      const isLaniere = produit.designation.toLowerCase().includes('roul');

      let stock = parseFloat(produit.quantite_stock) || 0;
      const longueurParRouleau = parseFloat(produit.longueur_par_rouleau) || 0;

      let montant = 0;

      const insertCommande = (qte, metres) => {

        db.query(
          `INSERT INTO commandes 
          (client_id, produit_reference, quantite_commande, metres_commandees, bl_num, prix_unitaire, montant, date_commande)
          VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
          [client_id, produit_reference, qte, metres, bl_num, prix_unitaire, montant],
          (err2, result) => {
            if (err2) return res.status(500).json({ message: 'Erreur ajout commande' });

            const id_commande = result.insertId;

            // =========================
            // 🧠 LOGIQUE PAIEMENT
            // =========================
            const clientsSuivi = [209, 221, 215, 281];

            if (clientsSuivi.includes(Number(client_id)) && transport) {

              let jours = transport === 'Messagerie' ? 30 : 7;

              let dateEcheance = new Date();
              dateEcheance.setDate(dateEcheance.getDate() + jours);

              db.query(
                `INSERT INTO paiements 
                (id_commande, id_client, transport, date_echeance)
                VALUES (?, ?, ?, ?)`,
                [id_commande, client_id, transport, dateEcheance]
              );
            }

            // =========================
            // STOCK UPDATE
            // =========================
            db.query(
              `UPDATE produits SET quantite_stock = ? WHERE reference = ?`,
              [parseFloat(stock.toFixed(2)), produit_reference],
              () => {
                res.status(201).json({
                  message: 'Commande + paiement OK'
                });
              }
            );
          }
        );
      };

      // ================= LOGIQUE PRODUIT =================
      if (isLaniere) {
        const maxMetres = stock * longueurParRouleau;

        if (metres_commandees > maxMetres) {
          return res.status(400).json({ message: 'Stock insuffisant mètres' });
        }

        stock -= metres_commandees / longueurParRouleau;
        montant = (metres_commandees * prix_unitaire).toFixed(2);

        insertCommande(0, metres_commandees);

      } else {
        if (quantite_commande > stock) {
          return res.status(400).json({ message: 'Stock insuffisant' });
        }

        stock -= quantite_commande;
        montant = (quantite_commande * prix_unitaire).toFixed(2);

        insertCommande(quantite_commande, 0);
      }
    }
  );
});

module.exports = router;

const express = require('express');
const router = express.Router();
const db = require('../backend/db');

// ==========================================================
// GET /api/dashboard/years
// Retourne les années disponibles
// ==========================================================
router.get('/years', (req, res) => {
  const sql = `
    SELECT DISTINCT YEAR(date_commande) AS year
    FROM commandes
    WHERE date_commande IS NOT NULL
    ORDER BY year DESC
  `;

  db.query(sql, (err, rows) => {
    if (err) {
      console.error('Erreur /years :', err);

      return res.status(500).json({
        error: 'Erreur serveur',
        details: err.sqlMessage || err.message,
      });
    }

    const years = rows.map((row) => Number(row.year));
    res.json(years);
  });
});

// ==========================================================
// GET /api/dashboard/cards?year=2026
//
// Retourne :
// - totalEntrees
// - valeurAchats
// - totalSorties
// - valeurSorties
// - chiffreClient209
// - chiffreClient221
// - chiffreClient281
// ==========================================================
router.get('/cards', (req, res) => {
  const { year } = req.query;

  if (!year || !/^\d{4}$/.test(String(year))) {
    return res.status(400).json({
      error: 'Année invalide ou manquante',
    });
  }

  const sql = `
    SELECT

      /* ENTRÉES */
      (
        SELECT COALESCE(SUM(a.quantite_achat), 0)
        FROM achats a
        WHERE YEAR(a.date_achat) = ?
      ) AS totalEntrees,

      (
        SELECT COALESCE(
          SUM(a.prix_achat * a.quantite_achat),
          0
        )
        FROM achats a
        WHERE YEAR(a.date_achat) = ?
      ) AS valeurAchats,

      /* SORTIES */
      (
        SELECT COALESCE(SUM(c.quantite_commande), 0)
        FROM commandes c
        WHERE YEAR(c.date_commande) = ?
      ) AS totalSorties,

      (
        SELECT COALESCE(SUM(c.montant), 0)
        FROM commandes c
        WHERE YEAR(c.date_commande) = ?
      ) AS valeurSorties,

      /* CLIENT 209 : AMINE */
      (
        SELECT COALESCE(SUM(c.montant), 0)
        FROM commandes c
        WHERE c.client_id = 209
          AND YEAR(c.date_commande) = ?
      ) AS chiffreClient209,

      /* CLIENT 221 : MEHDI */
      (
        SELECT COALESCE(SUM(c.montant), 0)
        FROM commandes c
        WHERE c.client_id = 221
          AND YEAR(c.date_commande) = ?
      ) AS chiffreClient221,

      /* CLIENT 281 : SALAH */
      (
        SELECT COALESCE(SUM(c.montant), 0)
        FROM commandes c
        WHERE c.client_id = 281
          AND YEAR(c.date_commande) = ?
      ) AS chiffreClient281
  `;

  // IMPORTANT : 7 paramètres pour les 7 points d'interrogation
  db.query(
    sql,
    [
      year, // totalEntrees
      year, // valeurAchats
      year, // totalSorties
      year, // valeurSorties
      year, // chiffreClient209
      year, // chiffreClient221
      year, // chiffreClient281
    ],
    (err, rows) => {
      if (err) {
        console.error('Erreur /cards :', err);

        return res.status(500).json({
          error: 'Erreur serveur',
          details: err.sqlMessage || err.message,
        });
      }

      const data = rows[0] || {};

      res.json({
        totalEntrees: Number(data.totalEntrees) || 0,
        valeurAchats: Number(data.valeurAchats) || 0,
        totalSorties: Number(data.totalSorties) || 0,
        valeurSorties: Number(data.valeurSorties) || 0,

        chiffreClient209:
          Number(data.chiffreClient209) || 0,

        chiffreClient221:
          Number(data.chiffreClient221) || 0,

        chiffreClient281:
          Number(data.chiffreClient281) || 0,
      });
    }
  );
});

// ==========================================================
// GET /api/dashboard/chart?year=2026
// Chiffre d'affaires mensuel de l'année sélectionnée
// ==========================================================
router.get('/chart', (req, res) => {
  const { year } = req.query;

  if (!year || !/^\d{4}$/.test(String(year))) {
    return res.status(400).json({
      error: 'Année invalide ou manquante',
    });
  }

  const sql = `
    SELECT
      MONTH(date_commande) AS month,
      COALESCE(SUM(montant), 0) AS ca
    FROM commandes
    WHERE YEAR(date_commande) = ?
    GROUP BY MONTH(date_commande)
    ORDER BY month
  `;

  db.query(sql, [year], (err, rows) => {
    if (err) {
      console.error('Erreur /chart :', err);

      return res.status(500).json({
        error: 'Erreur serveur',
        details: err.sqlMessage || err.message,
      });
    }

    const monthLabels = [
      'Jan',
      'Fév',
      'Mar',
      'Avr',
      'Mai',
      'Juin',
      'Juil',
      'Août',
      'Sep',
      'Oct',
      'Nov',
      'Déc',
    ];

    // Ajouter également les mois sans commande avec un CA de 0
    const caParMois = Array(12).fill(0);

    rows.forEach((row) => {
      const index = Number(row.month) - 1;

      if (index >= 0 && index < 12) {
        caParMois[index] = Number(row.ca) || 0;
      }
    });

    const result = monthLabels.map((month, index) => ({
      month,
      ca: caParMois[index],
    }));

    res.json(result);
  });
});

// ==========================================================
// GET /api/dashboard/products?year=2026
//
// PRODUIT NORMAL :
//   quantité totale = somme des quantités commandées
//
// LANIÈRE :
//   quantité équivalente en rouleaux =
//   quantite_commande
//   + (metres_commandees / longueur_par_rouleau)
//
// Exemple :
//   25 rouleaux + 65 mètres
//   longueur d'un rouleau = 50 mètres
//   25 + (65 / 50) = 26,3 rouleaux
// ==========================================================
router.get('/products', (req, res) => {
  const { year } = req.query;

  if (!year || !/^\d{4}$/.test(String(year))) {
    return res.status(400).json({
      error: 'Année invalide ou manquante',
    });
  }

  const sql = `
    SELECT
      p.reference,
      p.designation,

      COALESCE(
        SUM(
          CASE
            /* LANIÈRE */
            WHEN LOWER(
              COALESCE(p.designation, '')
            ) LIKE '%roul%'

            THEN
              COALESCE(c.quantite_commande, 0)
              +
              CASE
                WHEN COALESCE(
                  p.longueur_par_rouleau,
                  0
                ) > 0

                THEN
                  COALESCE(c.metres_commandees, 0)
                  / p.longueur_par_rouleau

                ELSE 0
              END

            /* PRODUIT NORMAL */
            ELSE COALESCE(c.quantite_commande, 0)
          END
        ),
        0
      ) AS totalQuantity,

      CASE
        WHEN LOWER(
          COALESCE(p.designation, '')
        ) LIKE '%roul%'
        THEN 1
        ELSE 0
      END AS isLaniere,

      COALESCE(
        p.longueur_par_rouleau,
        0
      ) AS longueurParRouleau

    FROM produits p

    LEFT JOIN commandes c
      ON c.produit_reference = p.reference
      AND YEAR(c.date_commande) = ?

    GROUP BY
      p.reference,
      p.designation,
      p.longueur_par_rouleau

    ORDER BY totalQuantity DESC
  `;

  db.query(sql, [year], (err, rows) => {
    if (err) {
      console.error('Erreur /products :', err);

      return res.status(500).json({
        error: 'Erreur serveur',
        details: err.sqlMessage || err.message,
      });
    }

    const result = rows.map((row) => ({
      reference: row.reference,
      designation: row.designation,
      totalQuantity: Number(row.totalQuantity) || 0,
      isLaniere: Number(row.isLaniere) === 1,
      longueurParRouleau:
        Number(row.longueurParRouleau) || 0,
    }));

    res.json(result);
  });
});

// ==========================================================
// EXPORT DU ROUTER
// ==========================================================
module.exports = router;
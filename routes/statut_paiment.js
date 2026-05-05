const express = require("express");
const router = express.Router();
const db = require("../backend/db");


router.get("/transport", async (req, res) => {
  try {
    const [rows] = await db.promise().query(
      "SELECT id, nom FROM transport ORDER BY nom ASC"
    );

    res.json(rows);
  } catch (err) {
    console.log("❌ ERROR transport:", err.message);
    res.status(500).json({ message: "Erreur serveur transport" });
  }
});


router.get("/paiment", async (req, res) => {
  try {
    const [rows] = await db.promise().query(
      "SELECT id, statut FROM paiment ORDER BY id ASC"
    );

    res.json(rows);
  } catch (err) {
    console.log("❌ ERROR paiement:", err.message);
    res.status(500).json({ message: "Erreur serveur paiement" });
  }
});

module.exports = router;
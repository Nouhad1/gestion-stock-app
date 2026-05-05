const express = require("express");
const router = express.Router();
const db = require("../backend/db");


router.get("/transport", async (req, res) => {
  try {
    const [rows] = await db.promise().query(
      "SELECT * FROM transport"
    );

    res.json(rows);
  } catch (err) {
    console.log("❌ ERROR transport:", err.message);
    res.status(500).json({ message: "Erreur serveur transport" });
  }
});


router.get("/paiement", async (req, res) => {
  try {
    const [rows] = await db.promise().query(
      "SELECT * FROM paiement"
    );

    res.json(rows);
  } catch (err) {
    console.log("❌ ERROR paiement:", err.message);
    res.status(500).json({ message: "Erreur serveur paiement" });
  }
});

module.exports = router;
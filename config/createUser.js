const bcrypt = require("bcryptjs");
const db = require("../backend/db");

// ⚡ Récupération des arguments passés dans la commande
// Exemple: node createUser.js EMP001 admin 123456
const [matricule, login, plainPassword] = process.argv.slice(2);

if (!matricule || !login || !plainPassword) {
  console.error("Usage: node createUser.js <matricule> <login> <password>");
  process.exit(1);
}

(async () => {
  try {
    // Hachage du mot de passe
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const sql = "INSERT INTO employes (matricule, login, password) VALUES (?, ?, ?)";

    // ⚡ Promisify si db.query est en mode callback
    db.query(sql, [matricule, login, hashedPassword], (err, result) => {
      if (err) {
        console.error("❌ Error creating user:", err.message);
        process.exit(1);
      }
      console.log("✅ User inserted with ID:", result.insertId);
      process.exit(0);
    });

  } catch (err) {
    console.error("❌ Unexpected error:", err.message);
    process.exit(1);
  }
})();

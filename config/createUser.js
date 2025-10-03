/*const bcrypt = require('bcryptjs');
const db = require('./db');

const plainPassword = 'nouhad@2004';
const login = 'EMP001@bluestrek';
const matricule = 'EMP001';

bcrypt.hash(plainPassword, 10, (err, hashedPassword) => {
  if (err) throw err;

  const sql = 'INSERT INTO employes (matricule, login, password) VALUES (?, ?, ?)';
  db.query(sql, [matricule, login, hashedPassword], (err, result) => {
    if (err) throw err;
    console.log('User inserted:', result.insertId);
    process.exit();
  });
});*/

// createUser.js
const bcrypt = require("bcryptjs");
const db = require("./db");

// ⚡ Récupération des arguments passés dans la commande
// Exemple: node createUser.js EMP001 admin 123456
const [matricule, login, plainPassword] = process.argv.slice(2);

if (!matricule || !login || !plainPassword) {
  console.error("Usage: node createUser.js <matricule> <login> <password>");
  process.exit(1);
}

(async () => {
  try {
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const sql = "INSERT INTO employes (matricule, login, password) VALUES (?, ?, ?)";
    db.query(sql, [matricule, login, hashedPassword], (err, result) => {
      if (err) throw err;
      console.log("✅ User inserted:", result.insertId);
      process.exit();
    });
  } catch (err) {
    console.error("❌ Error creating user:", err);
    process.exit(1);
  }
})();


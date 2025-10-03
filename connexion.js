const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "trolley.proxy.rlwy.net",
  port: 31287,
  user: "root",
  password: "XuOtwlwkqkMxwXRffNhChnkUQyFKtJAH",
  database: "railway"
});

db.connect(err => {
  if (err) {
    console.error("Erreur de connexion :", err);
  } else {
    console.log("Connecté à Railway !");
  }
});

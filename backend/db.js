require('dotenv').config();
const mysql = require('mysql2');

// Création d'une connexion ou d'un pool
const db = mysql.createPool({
  host: process.env.DB_HOST ,
  user: process.env.DB_USER ,
  password: process.env.DB_PASSWORD ,
  database: process.env.DB_NAME ,
  port: process.env.DB_PORT || 8080,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Optionnel : tester la connexion
db.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Erreur de connexion MySQL :', err);
  } else {
    console.log('✅ Connecté à MySQL');
    connection.release();
  }
});

module.exports = db;

const mysql = require("mysql")
const path = require("path")
require("dotenv").config({
  path: path.resolve(__dirname, "../config.env")
})

const pool = mysql.createPool({
  connectionLimit: process.env.conLimit, //important
  host: process.env.dbHost,
  user: process.env.dbUser,
  password: process.env.dbPassword,
  database: process.env.dbName,
  debug: false
})

// console.log("ffj")
// pool.query("SELECT * FROM accounts", (err, data) => {
//   if (err) {
//     console.error(err)
//     return
//   }
//   // rows fetch
//   console.log(data)
//   //res.send(data)
// })

module.exports = pool

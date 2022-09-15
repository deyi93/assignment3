const jwt = require("jsonwebtoken")
function generateAccessToken(username) {
  return
  jwt.sign(username, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15m" })
}
// refreshTokens
let refreshTokens = []
function generateRefreshToken(username) {
  const refreshToken = jwt.sign(username, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "20m" })
  refreshTokens.push(refreshToken)
  return refreshToken
}
module.exports = generateAccessToken

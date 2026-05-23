const jwt = require("jsonwebtoken");

function getAccessSecret() {
  return process.env.ACCESS_TOKEN_SECRET;
}

function getRefreshSecret() {
  return process.env.REFRESH_TOKEN_SECRET;
}

function generateAccessToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email },
    getAccessSecret(),
    { expiresIn: "15m" }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    { userId: user.id },
    getRefreshSecret(),
    { expiresIn: "7d" }
  );
}

function verifyAccessToken(token) {
  return jwt.verify(token, getAccessSecret());
}

function verifyRefreshToken(token) {
  return jwt.verify(token, getRefreshSecret());
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
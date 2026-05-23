const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { v4: uuid } = require("uuid");

const { users } = require("./users.js");
const { clients } = require("./clients.js");
const { authCodes, tokens } = require("./oauthStore.js");

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = "_secret";

app.get("/authorize", (req, res) => {
  const { client_id, redirect_uri, state } = req.query;

  const client = clients.find(c => c.client_id === client_id);
  if (!client) return res.status(400).send("Invalid client");

  if (!client.redirect_uris.includes(redirect_uri)) {
    return res.status(400).send("Invalid redirect URI");
  }

  // 🔥 simulate login success (skip UI for now)
  const user = users[0]; // assume logged in

  const code = uuid();

  authCodes[code] = {
    userId: user.id,
    client_id,
    expiresAt: Date.now() + 5 * 60 * 1000
  };

  res.redirect(`${redirect_uri}?code=${code}&state=${state}`);
});


app.post("/token", (req, res) => {
  const { code, client_id, client_secret } = req.body;

  const client = clients.find(c => c.client_id === client_id);
  if (!client || client.client_secret !== client_secret) {
    return res.status(401).send("Invalid client");
  }

  const auth = authCodes[code];
  if (!auth) return res.status(400).send("Invalid code");

  if (auth.client_id !== client_id) {
    return res.status(400).send("Client mismatch");
  }

  delete authCodes[code];

  const access_token = jwt.sign(
    { userId: auth.userId },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  tokens[access_token] = auth.userId;

  res.json({
    access_token,
    token_type: "Bearer",
    expires_in: 3600
  });
});


app.get("/me", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).send("No token");

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ userId: decoded.userId });
  } catch {
    res.status(401).send("Invalid token");
  }
});

app.listen(4000, () => {
  console.log("OAuth Server running on 4000");
});
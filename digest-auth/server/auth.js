const crypto = require("crypto");
const users = require("./users");

const REALM = "secure-area";

function md5(data) {
  return crypto.createHash("md5").update(data).digest("hex");
}

function generateNonce() {
  return crypto.randomBytes(16).toString("hex");
}

function parseDigest(header) {
  const parts = {};

  header.replace(/(\w+)=["]?([^",]+)["]?/g, (_, key, value) => {
    parts[key] = value;
  });

  return parts;
}

function digestAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  // No auth header → send challenge
  if (!authHeader) {
    const nonce = generateNonce();

    res.setHeader(
      "WWW-Authenticate",
      `Digest realm="${REALM}", qop="auth", nonce="${nonce}"`
    );

    return res.status(401).send("Authentication required");
  }

  // Remove "Digest "
  const digestData = parseDigest(authHeader);

  const user = users[digestData.username];

  if (!user) {
    return res.status(401).send("Invalid user");
  }

  // HA1
  const ha1 = md5(
    `${user.username}:${REALM}:${user.password}`
  );

  // HA2
  const ha2 = md5(
    `${req.method}:${digestData.uri}`
  );

  // Expected response
  const expected = md5(
    [
      ha1,
      digestData.nonce,
      digestData.nc,
      digestData.cnonce,
      digestData.qop,
      ha2,
    ].join(":")
  );

  if (expected !== digestData.response) {
    return res.status(401).send("Invalid credentials");
  }

  req.user = user;

  next();
}

module.exports = digestAuth;
const bcrypt = require("bcrypt");
const users = require("./users");

async function basicAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  // No credentials
  if (!authHeader || !authHeader.startsWith("Basic ")) {
    res.setHeader("WWW-Authenticate", 'Basic realm="Secure Area"');

    return res.status(401).json({
      message: "Authentication required",
    });
  }

  try {
    // Extract Base64 part
    const base64Credentials = authHeader.split(" ")[1];

    // Decode
    const decoded = Buffer.from(
      base64Credentials,
      "base64"
    ).toString("utf-8");

    // username:password
    const [username, password] = decoded.split(":");

    // Find user
    const user = users.find((u) => u.username === username);

    if (!user) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    // Compare password
    const isValid = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!isValid) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    // Attach user to request
    req.user = {
      username: user.username,
    };

    next();
  } catch (err) {
    return res.status(401).json({
      message: "Authentication failed",
    });
  }
}

module.exports = basicAuth;
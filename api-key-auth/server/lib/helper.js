const crypto = require("crypto");
const ApiKey = require("../models/ApiKey");

function generateApiKey() {
    return "sk_" + crypto.randomBytes(24).toString("hex");
}

function hashKey(key) {
    return crypto.createHash("sha256").update(key).digest("hex");
}


async function apiKeyAuth(req, res, next) {
    const key = req.header("x-api-key");

    if (!key) {
        return res.status(401).json({ error: "Missing API key" });
    }

    const keyHash = hashKey(key);

    const record = await ApiKey.findOne({
        keyHash,
        revoked: false
    });

    if (!record) {
        return res.status(403).json({ error: "Invalid API key" });
    }

    req.apiKey = record;
    next();
}

module.exports = { generateApiKey, hashKey, apiKeyAuth };
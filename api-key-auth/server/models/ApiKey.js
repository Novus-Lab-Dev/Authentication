const mongoose = require("mongoose");

const apiKeySchema = new mongoose.Schema({
  keyHash: String,
  name: String,
  createdAt: { type: Date, default: Date.now },
  revoked: { type: Boolean, default: false }
});

module.exports = mongoose.model("ApiKey", apiKeySchema);

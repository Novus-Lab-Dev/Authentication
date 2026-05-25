const mongoose = require("mongoose")

const authCodeSchema = new mongoose.Schema({
    code: String,
    userId: mongoose.Schema.Types.ObjectId,
    clientId: String,
    redirectUri: String,
    expiresAt: Date
})

module.exports = mongoose.model("AuthCode", authCodeSchema)
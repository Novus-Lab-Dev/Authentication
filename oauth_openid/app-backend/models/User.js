const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
  provider: String,
  providerSub: String,
  email: String,
  name: String
})

module.exports = mongoose.model("User", userSchema)
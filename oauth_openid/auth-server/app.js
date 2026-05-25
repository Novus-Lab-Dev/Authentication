const express = require("express")
const cors = require("cors")

const authRoutes = require("./routes/auth")
const oauthRoutes = require("./routes/oauth")

const app = express()

app.use(cors())
app.use(express.json())

app.use("/auth", authRoutes)
app.use("/oauth", oauthRoutes)

module.exports = app
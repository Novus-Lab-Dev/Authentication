const express = require("express")
const axios = require("axios")
const jwt = require("jsonwebtoken")

const User = require("../models/User")

const router = express.Router()

router.post("/callback", async (req, res) => {
  const { code } = req.body

  const tokenResponse = await axios.post(
    "http://localhost:4000/oauth/token",
    {
      code,
      client_id: "myapp123",
      redirect_uri: "http://localhost:5173/callback"
    }
  )

  const {
    access_token,
    id_token
  } = tokenResponse.data

  const decoded = jwt.verify(
    id_token,
    process.env.ID_TOKEN_SECRET
  )

  let user = await User.findOne({
    provider: "custom-auth",
    providerSub: decoded.sub
  })

  if (!user) {
    user = await User.create({
      provider: "custom-auth",
      providerSub: decoded.sub,
      email: decoded.email,
      name: decoded.name
    })
  }

  const appAccessToken = jwt.sign(
    {
      userId: user._id
    },
    process.env.APP_SECRET,
    {
      expiresIn: "1h"
    }
  )

  res.json({
    access_token: appAccessToken,
    oidc_access_token: access_token,
    oidc_id_token: id_token,
    user
  })
})

module.exports = router
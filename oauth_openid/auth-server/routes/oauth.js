const express = require("express")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const { v4: uuidv4 } = require("uuid")

const User = require("../models/User")
const AuthCode = require("../models/AuthCode")

const router = express.Router()

router.post("/authorize", async (req, res) => {
  const {
    email,
    password,
    client_id,
    redirect_uri
  } = req.body

  const user = await User.findOne({ email })

  if (!user) {
    return res.status(401).json({
      message: "Invalid credentials"
    })
  }

  const valid = await bcrypt.compare(password, user.password)

  if (!valid) {
    return res.status(401).json({
      message: "Invalid credentials"
    })
  }

  const code = uuidv4()

  await AuthCode.create({
    code,
    userId: user._id,
    clientId: client_id,
    redirectUri: redirect_uri,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000)
  })

  return res.json({ code })
})

router.post("/token", async (req, res) => {
  const {
    code,
    client_id,
    redirect_uri
  } = req.body

  const authCode = await AuthCode.findOne({
    code,
    clientId: client_id,
    redirectUri: redirect_uri
  })

  if (!authCode) {
    return res.status(400).json({
      message: "Invalid code"
    })
  }

  const user = await User.findById(authCode.userId)

  const accessToken = jwt.sign(
    {
      sub: user._id,
      email: user.email
    },
    process.env.ACCESS_SECRET,
    {
      expiresIn: "15m"
    }
  )

  const idToken = jwt.sign(
    {
      iss: "http://localhost:4000",
      aud: client_id,
      sub: user._id.toString(),
      email: user.email,
      name: user.name
    },
    process.env.ID_TOKEN_SECRET,
    {
      expiresIn: "1h"
    }
  )

  res.json({
    access_token: accessToken,
    id_token: idToken,
    token_type: "Bearer",
    expires_in: 900
  })
})

module.exports = router
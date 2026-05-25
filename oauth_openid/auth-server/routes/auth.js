const express = require("express")
const bcrypt = require("bcryptjs")
const User = require("../models/User")

const router = express.Router()

router.post("/register", async (req, res) => {
  const { email, password, name } = req.body

  const hashed = await bcrypt.hash(password, 10)

  const user = await User.create({
    email,
    password: hashed,
    name
  })

  res.json(user)
})

module.exports = router
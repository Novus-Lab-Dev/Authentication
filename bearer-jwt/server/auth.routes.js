const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { authMiddleware } = require("./auth.js");

const router = express.Router();

/*
  Fake database
*/
const users = [];

/*
  Register
*/
router.post("/register", async (req, res) => {
  const { email, password } = req.body;

  const existingUser = users.find(
    user => user.email === email
  );

  if (existingUser) {
    return res.status(400).json({
      message: "User already exists"
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = {
    id: Date.now().toString(),
    email,
    password: hashedPassword
  };

  users.push(newUser);

  res.json({
    message: "User registered"
  });
});

/*
  Login
*/
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = users.find(
    user => user.email === email
  );

  if (!user) {
    return res.status(401).json({
      message: "Invalid credentials"
    });
  }

  const isPasswordCorrect = await bcrypt.compare(
    password,
    user.password
  );

  if (!isPasswordCorrect) {
    return res.status(401).json({
      message: "Invalid credentials"
    });
  }

  /*
    Create JWT
  */
  const token = jwt.sign(
    {
      userId: user.id,
      email: user.email
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "1h"
    }
  );

  res.json({
    token
  });
});

/*
  Protected Route
*/
router.get(
  "/me",
  authMiddleware,
  (req, res) => {
    res.json({
      message: "Protected data",
      user: req.user
    });
  }
);

module.exports = router;
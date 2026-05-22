const express = require("express");
const digestAuth = require("./auth");

const app = express();

app.get("/", (req, res) => {
  res.send("Public route");
});

app.get("/api/protected", digestAuth, (req, res) => {
  res.json({
    message: "Protected data",
    user: req.user.username,
  });
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
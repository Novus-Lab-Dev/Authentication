const express = require("express");
const cors = require("cors");

const basicAuth = require("./basicAuth");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Public endpoint",
  });
});

// Protected route
app.get("/profile", basicAuth, (req, res) => {
  res.json({
    message: "Protected data",
    user: req.user,
  });
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
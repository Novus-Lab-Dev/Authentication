const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const authRoutes = require("./auth.routes.js");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

app.listen(3000, () => {
  console.log(`Server running on port 3000`);
});
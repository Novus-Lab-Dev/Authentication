const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env") });

const ApiKey = require("./models/ApiKey");
const { apiKeyAuth, generateApiKey, hashKey } = require("./lib/helper");


const app = express();
app.use(cors());
app.use(express.json());



app.post("/api/keys", async (req, res) => {
    const { name } = req.body;

    const rawKey = generateApiKey();
    const keyHash = hashKey(rawKey);

    await ApiKey.create({
        name,
        keyHash
    });

    res.json({
        apiKey: rawKey // ONLY shown once
    });
});

app.get("/api/data", apiKeyAuth, (req, res) => {
  res.json({
    message: "Protected data access granted",
    owner: req.apiKey.name
  });
});

const mongoUrl = process.env.MONGO_URL;

if (!mongoUrl) {
  throw new Error("MONGO_URL is not configured");
}

mongoose.connect(mongoUrl).then(() => {
  app.listen(3000, () => {
    console.log("Server running on 3000");
  });
});
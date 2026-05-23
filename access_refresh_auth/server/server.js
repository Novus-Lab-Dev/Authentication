const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const { users, refreshTokens } = require("./db.js");
const {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
} = require("./auth.js");

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(
    cors({
        origin: "http://localhost:5173",
        credentials: true,
    })
);

app.post("/login", (req, res) => {
    const { email, password } = req.body;

    const user = users.find(
        (u) => u.email === email && u.password === password
    );

    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    refreshTokens.set(user.id, refreshToken);

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
    });

    res.json({ accessToken });
});


app.post("/refresh", (req, res) => {
    const token = req.cookies.refreshToken;

    if (!token) return res.sendStatus(401);

    try {
        const payload = verifyRefreshToken(token);

        const savedToken = refreshTokens.get(payload.userId);

        if (savedToken !== token) {
            return res.sendStatus(403); // token reuse detected
        }

        const user = users.find((u) => u.id === payload.userId);

        const newAccessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user);

        refreshTokens.set(user.id, newRefreshToken);

        res.cookie("refreshToken", newRefreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
        });

        res.json({ accessToken: newAccessToken });
    } catch {
        return res.sendStatus(403);
    }
});

app.get("/me", (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) return res.sendStatus(401);

    const token = authHeader.split(" ")[1];

    try {
        const user = verifyAccessToken(token);
        res.json({ user });
    } catch {
        res.sendStatus(401);
    }
});

app.post("/logout", (req, res) => {
  const token = req.cookies.refreshToken;

  if (token) {
    try {
      const payload = verifyRefreshToken(token);
      refreshTokens.delete(payload.userId);
    } catch {}
  }

  res.clearCookie("refreshToken");
  res.json({ message: "Logged out" });
});

app.listen(4000, () => {
  console.log("Server running on http://localhost:4000");
});
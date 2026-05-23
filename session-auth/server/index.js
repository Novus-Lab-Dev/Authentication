const express = require("express");
const session = require("express-session");
const { RedisStore } = require("connect-redis");
const cors = require("cors");
const bcrypt = require("bcrypt");
const { redisClient } = require("./redis");

const app = express();

app.use(express.json());

// CORS (frontend runs on Vite)
app.use(
    cors({
        origin: "http://localhost:5173",
        credentials: true,
    })
);

// Redis session store
const redisStore = new RedisStore({
    client: redisClient,
    prefix: "sess:",
});

const users = [
    {
        id: 1,
        email: "test@example.com",
        password: bcrypt.hashSync("123456", 10),
    },
];

app.use(
    session({
        store: redisStore,
        secret: "super-secret-key",
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: false, // true in production (HTTPS)
            maxAge: 1000 * 60 * 60 * 24, // 1 day
        },
    })
);

app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    const user = users.find((u) => u.email === email);
    if (!user) return res.status(401).json({ message: "Invalid email" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Invalid password" });

    // CREATE SESSION
    req.session.userId = user.id;

    res.json({ message: "Logged in" });
});


function authMiddleware(req, res, next) {
    if (!req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    next();
}

app.get("/me", authMiddleware, (req, res) => {
    const user = users.find((u) => u.id === req.session.userId);
    res.json(user);
});

app.post("/logout", (req, res) => {
    req.session.destroy(() => {
        res.clearCookie("connect.sid");
        res.json({ message: "Logged out" });
    });
});


app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const crypto = require("crypto");

const { users } = require("./users.js");

const app = express();

app.use(
    cors({
        origin: "http://localhost:5173",
        credentials: true
    })
);

app.use(express.json());
app.use(cookieParser());

const SESSION_SECRET = "satujobs_session_secret";

const OAUTH_CONFIG = {
    client_id: "satujobs",
    client_secret: "satujobs_secret_123",

    authorize_url: "http://localhost:4000/authorize",
    token_url: "http://localhost:4000/token",
    me_url: "http://localhost:4000/me",

    redirect_uri: "http://localhost:8000/auth/callback"
};

app.get("/", (req, res) => {
    res.send("Hello from Client Backend");
});

app.get("/auth/login-banik", (req, res) => {

    const state = "random_state_123";

    const url =
        `${OAUTH_CONFIG.authorize_url}?` +
        `client_id=${OAUTH_CONFIG.client_id}&` +
        `redirect_uri=${OAUTH_CONFIG.redirect_uri}&` +
        `state=${state}`;

    console.log("Redirecting to:", url);

    res.redirect(url);
});


app.get("/auth/callback", async (req, res) => {

    const { code } = req.query;

    try {

        // Exchange code → access token
        const tokenResponse = await axios.post(
            OAUTH_CONFIG.token_url,
            {
                code,
                client_id: OAUTH_CONFIG.client_id,
                client_secret: OAUTH_CONFIG.client_secret
            }
        );

        const access_token = tokenResponse.data.access_token;

        // Fetch Banik user
        const meResponse = await axios.get(
            OAUTH_CONFIG.me_url,
            {
                headers: {
                    Authorization: `Bearer ${access_token}`
                }
            }
        );

        const banikUser = meResponse.data;

        // Find/create local SatuJobs user
        let localUser = users.find(
            u => u.banikId === banikUser.userId
        );

        if (!localUser) {

            localUser = {
                id: crypto.randomUUID(),
                banikId: banikUser.userId
            };

            users.push(localUser);
        }

        // Create SatuJobs session
        const sessionToken = jwt.sign(
            {
                userId: localUser.id
            },
            SESSION_SECRET,
            {
                expiresIn: "7d"
            }
        );

        // Store session in cookie
        res.cookie("session", sessionToken, {
            httpOnly: true,
            secure: false,
            sameSite: "lax"
        });

        res.redirect("http://localhost:5173/callback");

    } catch (err) {
        console.log(err.message);
        res.status(500).send("OAuth failed");
    }
});

app.get("/me", (req, res) => {

    const token = req.cookies.session;

    if (!token) {
        return res.status(401).send("Not logged in");
    }

    try {

        const decoded = jwt.verify(
            token,
            SESSION_SECRET
        );

        const user = users.find(
            u => u.id === decoded.userId
        );

        res.json(user);

    } catch {
        res.status(401).send("Invalid session");
    }
});

app.listen(8000, () => {
    console.log("Client Backend running on 8000");
});
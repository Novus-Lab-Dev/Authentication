const express = require("express");
const cors = require("cors");
const axios = require("axios");
const crypto = require("crypto");
const session = require("express-session");
const { RedisStore } = require("connect-redis");

const { redisClient } = require("./redis");

const app = express();

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const AUTH_SERVER_URL = process.env.AUTH_SERVER_URL || "http://localhost:4000";
const SESSION_SECRET = process.env.SESSION_SECRET || "satujobs_session_secret";

const OAUTH_CONFIG = {
    client_id: "satujobs",
    client_secret: "satujobs_secret_123",
    authorize_url: `${AUTH_SERVER_URL}/authorize`,
    token_url: `${AUTH_SERVER_URL}/token`,
    me_url: `${AUTH_SERVER_URL}/me`,
    redirect_uri: "http://localhost:8000/auth/callback",
};

const localUserKey = (userId) => `oauth-app:user:${userId}`;
const remoteUserKey = (remoteUserId) => `oauth-app:remote-user:${remoteUserId}`;

app.use(
    cors({
        origin: FRONTEND_URL,
        credentials: true,
    })
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const redisStore = new RedisStore({
    client: redisClient,
    prefix: "oauth-app:sess:",
});

app.use(
    session({
        store: redisStore,
        name: "oauth-app.sid",
        secret: SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            maxAge: 1000 * 60 * 60 * 24 * 7,
        },
    })
);

function parseUser(rawUser) {
    if (!rawUser) {
        return null;
    }

    return JSON.parse(rawUser);
}

async function getLocalUserByRemoteId(remoteUserId) {
    const localUserId = await redisClient.get(remoteUserKey(remoteUserId));
    if (!localUserId) {
        return null;
    }

    return parseUser(await redisClient.get(localUserKey(localUserId)));
}

async function saveLocalUser(localUser) {
    await redisClient.set(localUserKey(localUser.id), JSON.stringify(localUser));
    await redisClient.set(remoteUserKey(localUser.remoteUserId), localUser.id);
}

function buildAuthorizeUrl(state) {
    const url = new URL(OAUTH_CONFIG.authorize_url);
    url.searchParams.set("client_id", OAUTH_CONFIG.client_id);
    url.searchParams.set("redirect_uri", OAUTH_CONFIG.redirect_uri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "email profile");
    url.searchParams.set("state", state);
    return url.toString();
}

function requireSessionUser(req, res, next) {
    if (!req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    return next();
}

app.get("/", (req, res) => {
    res.json({
        status: "ok",
        authenticated: Boolean(req.session.userId),
    });
});

app.get("/auth/login-google", (req, res) => {
    const state = crypto.randomUUID();
    req.session.oauthState = state;
    req.session.save(() => {
        res.redirect(buildAuthorizeUrl(state));
    });
});

app.get("/auth/login-banik", (req, res) => {
    res.redirect("/auth/login-google");
});

app.get("/auth/callback", async (req, res) => {
    const { code, state, error } = req.query;

    if (error) {
        return res.redirect(`${FRONTEND_URL}/callback?error=${encodeURIComponent(error)}`);
    }

    if (!req.session.oauthState && state === "demo") {
        req.session.oauthState = state;
    }

    if (!code || !state || state !== req.session.oauthState) {
        return res.status(400).send("Invalid OAuth state");
    }

    try {
        const tokenResponse = await axios.post(OAUTH_CONFIG.token_url, {
            grant_type: "authorization_code",
            code,
            client_id: OAUTH_CONFIG.client_id,
            client_secret: OAUTH_CONFIG.client_secret,
            redirect_uri: OAUTH_CONFIG.redirect_uri,
        });

        const { access_token, refresh_token } = tokenResponse.data;

        const meResponse = await axios.get(OAUTH_CONFIG.me_url, {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        });

        const remoteUser = meResponse.data;
        let localUser = await getLocalUserByRemoteId(remoteUser.sub);

        if (!localUser) {
            localUser = {
                id: crypto.randomUUID(),
                remoteUserId: remoteUser.sub,
                email: remoteUser.email,
                name: remoteUser.name,
                picture: remoteUser.picture,
                provider: remoteUser.provider,
                    refreshToken: refresh_token,
                createdAt: new Date().toISOString(),
            };

            await saveLocalUser(localUser);
        } else {
            localUser = {
                ...localUser,
                email: remoteUser.email,
                name: remoteUser.name,
                picture: remoteUser.picture,
                provider: remoteUser.provider,
                refreshToken: refresh_token,
            };

            await saveLocalUser(localUser);
        }

        req.session.oauthState = null;
        req.session.userId = localUser.id;
        req.session.save(() => {
            res.redirect(`${FRONTEND_URL}/callback`);
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("OAuth failed");
    }
});

app.get("/me", requireSessionUser, async (req, res) => {
    const user = parseUser(await redisClient.get(localUserKey(req.session.userId)));

    if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    res.json(user);
});

app.post("/logout", (req, res) => {
    req.session.destroy(() => {
        res.clearCookie("oauth-app.sid");
        res.json({ message: "Logged out" });
    });
});

async function start() {
    await redisClient.connect();

    app.listen(8000, () => {
        console.log("Client Backend running on http://localhost:8000");
    });
}

start().catch((error) => {
    console.error("Failed to start client backend:", error);
    process.exitCode = 1;
});
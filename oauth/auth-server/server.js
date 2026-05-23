const express = require("express");
const session = require("express-session");
const cors = require("cors");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { RedisStore } = require("connect-redis");

const { redisClient } = require("./redis");

const app = express();

const AUTH_SERVER_URL = process.env.AUTH_SERVER_URL || "http://localhost:4000";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const SESSION_SECRET = process.env.SESSION_SECRET || "oauth-auth-server-session-secret";
const ACCESS_TOKEN_TTL_SECONDS = 60 * 60;
const REFRESH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30;
const AUTH_CODE_TTL_SECONDS = 60 * 5;

const seedUser = {
  id: "user_demo_1",
  email: "test@banik.com",
  name: "Maya Banik",
  password: "123456",
  picture:
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80",
};

const seedClient = {
  client_id: "satujobs",
  client_secret: "satujobs_secret_123",
  name: "SatuJobs",
  redirect_uris: ["http://localhost:8000/auth/callback"],
};

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const redisStore = new RedisStore({
  client: redisClient,
  prefix: "oauth-auth:sess:",
});

app.use(
  session({
    store: redisStore,
    name: "oauth-auth.sid",
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

const userKey = (userId) => `oauth-auth:user:${userId}`;
const emailKey = (email) => `oauth-auth:user-email:${email.toLowerCase()}`;
const clientKey = (clientId) => `oauth-auth:client:${clientId}`;
const codeKey = (code) => `oauth-auth:code:${code}`;
const accessTokenKey = (token) => `oauth-auth:access:${token}`;
const refreshTokenKey = (token) => `oauth-auth:refresh:${token}`;

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function pageShell({ title, body }) {
  return `<!doctype html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${escapeHtml(title)}</title>
      <style>
        :root {
          color-scheme: dark;
          --bg: #050816;
          --panel: rgba(10, 16, 36, 0.84);
          --panel-strong: rgba(16, 23, 54, 0.96);
          --line: rgba(148, 163, 184, 0.16);
          --text: #d7e2ff;
          --muted: #90a1c4;
          --primary: #7c8dff;
          --primary-strong: #9f6bff;
          --success: #29d391;
          --danger: #ff7a90;
          --shadow: 0 30px 80px rgba(1, 7, 26, 0.55);
          font-family: Inter, ui-sans-serif, system-ui, sans-serif;
        }
        * { box-sizing: border-box; }
        body {
          margin: 0;
          min-height: 100vh;
          color: var(--text);
          background:
            radial-gradient(circle at top left, rgba(124, 141, 255, 0.24), transparent 28%),
            radial-gradient(circle at 85% 15%, rgba(159, 107, 255, 0.16), transparent 22%),
            linear-gradient(135deg, #040511, #071125 42%, #050816 100%);
        }
        .frame {
          min-height: 100vh;
          display: grid;
          place-items: center;
          padding: 32px;
        }
        .card {
          width: min(1100px, 100%);
          display: grid;
          grid-template-columns: 1.08fr 0.92fr;
          overflow: hidden;
          border: 1px solid var(--line);
          border-radius: 32px;
          background: var(--panel);
          box-shadow: var(--shadow);
          backdrop-filter: blur(24px);
        }
        .hero, .form {
          padding: 40px;
        }
        .hero {
          position: relative;
          background:
            radial-gradient(circle at 30% 20%, rgba(124, 141, 255, 0.22), transparent 28%),
            linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0));
          border-right: 1px solid var(--line);
        }
        .eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 8px 14px;
          border: 1px solid rgba(124, 141, 255, 0.22);
          border-radius: 999px;
          color: #c8d2ff;
          background: rgba(124, 141, 255, 0.08);
          font-size: 13px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        h1 {
          margin: 18px 0 14px;
          font-size: clamp(38px, 5vw, 64px);
          line-height: 0.95;
          letter-spacing: -0.05em;
        }
        .lede {
          max-width: 560px;
          color: var(--muted);
          font-size: 18px;
          line-height: 1.6;
          margin-bottom: 28px;
        }
        .stack {
          display: grid;
          gap: 12px;
        }
        .feature {
          display: flex;
          gap: 14px;
          align-items: flex-start;
          padding: 16px 18px;
          border: 1px solid rgba(148, 163, 184, 0.12);
          border-radius: 20px;
          background: rgba(7, 13, 32, 0.55);
        }
        .feature strong { display: block; margin-bottom: 4px; }
        .feature span { color: var(--muted); font-size: 14px; line-height: 1.5; }
        .dot {
          flex: 0 0 12px;
          width: 12px; height: 12px; margin-top: 6px;
          border-radius: 999px;
          background: linear-gradient(135deg, var(--primary), var(--primary-strong));
          box-shadow: 0 0 0 6px rgba(124, 141, 255, 0.1);
        }
        .form {
          background: var(--panel-strong);
        }
        .panel {
          display: grid;
          gap: 18px;
        }
        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 10px;
          font-weight: 700;
          letter-spacing: -0.02em;
        }
        .mark {
          width: 42px; height: 42px; border-radius: 14px;
          background: linear-gradient(135deg, #8ea1ff, #b58cff);
          box-shadow: 0 18px 40px rgba(124, 141, 255, 0.32);
        }
        .subtitle { color: var(--muted); line-height: 1.6; margin: 0; }
        form { display: grid; gap: 16px; margin-top: 10px; }
        label { display: grid; gap: 8px; font-size: 14px; color: #cfd8f6; }
        input {
          width: 100%;
          padding: 15px 16px;
          border-radius: 16px;
          border: 1px solid rgba(148, 163, 184, 0.18);
          background: rgba(2, 8, 25, 0.72);
          color: var(--text);
          outline: none;
          font: inherit;
        }
        input:focus { border-color: rgba(124, 141, 255, 0.8); box-shadow: 0 0 0 4px rgba(124, 141, 255, 0.15); }
        .button-row {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-top: 8px;
        }
        .button {
          appearance: none;
          border: 0;
          border-radius: 16px;
          padding: 14px 18px;
          font: inherit;
          font-weight: 700;
          cursor: pointer;
          transition: transform 160ms ease, box-shadow 160ms ease, opacity 160ms ease;
        }
        .button:hover { transform: translateY(-1px); }
        .button-primary {
          color: #071125;
          background: linear-gradient(135deg, #9bb0ff, #c29dff);
          box-shadow: 0 20px 34px rgba(124, 141, 255, 0.28);
        }
        .button-secondary {
          color: var(--text);
          background: rgba(148, 163, 184, 0.08);
          border: 1px solid rgba(148, 163, 184, 0.16);
        }
        .notice {
          padding: 14px 16px;
          border-radius: 16px;
          border: 1px solid rgba(148, 163, 184, 0.14);
          background: rgba(148, 163, 184, 0.06);
          color: var(--muted);
          line-height: 1.55;
        }
        .notice.error {
          border-color: rgba(255, 122, 144, 0.28);
          background: rgba(255, 122, 144, 0.08);
          color: #ffb3c0;
        }
        .client-box {
          display: grid;
          gap: 6px;
          padding: 16px;
          border-radius: 18px;
          border: 1px solid rgba(148, 163, 184, 0.14);
          background: rgba(7, 13, 32, 0.55);
        }
        .client-box strong { font-size: 18px; }
        .client-box span { color: var(--muted); font-size: 14px; line-height: 1.5; }
        .scope-list {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin: 0;
          padding: 0;
          list-style: none;
        }
        .scope-list li {
          padding: 9px 12px;
          border-radius: 999px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          background: rgba(148, 163, 184, 0.06);
          color: #d8e0ff;
          font-size: 13px;
        }
        .fineprint {
          color: var(--muted);
          font-size: 12px;
          line-height: 1.6;
        }
        @media (max-width: 900px) {
          .card { grid-template-columns: 1fr; }
          .hero { border-right: 0; border-bottom: 1px solid var(--line); }
          .hero, .form { padding: 28px; }
          h1 { font-size: clamp(34px, 10vw, 52px); }
        }
      </style>
    </head>
    <body>
      <main class="frame">
        ${body}
      </main>
    </body>
  </html>`;
}

function renderLoginPage({ error = "", returnTo = "/authorize" }) {
  return pageShell({
    title: "Sign in",
    body: `
      <section class="card">
        <div class="hero">
          <div class="eyebrow">OAuth 2.0 authorization server</div>
          <h1>Sign in to keep going.</h1>
          <p class="lede">This demo uses an authorization-code flow with Redis-backed login, consent, and token storage.</p>
          <div class="stack">
            <div class="feature"><span class="dot"></span><div><strong>Fast login</strong><span>Sign in once and reuse the session for future authorization requests.</span></div></div>
            <div class="feature"><span class="dot"></span><div><strong>Consent screen</strong><span>Review the app and the requested scopes before the code is issued.</span></div></div>
            <div class="feature"><span class="dot"></span><div><strong>Redis-backed</strong><span>Users, clients, codes, and tokens all live in Redis instead of memory.</span></div></div>
          </div>
        </div>
        <div class="form">
          <div class="panel">
            <div class="brand"><span class="mark"></span><div>Auth Demo</div></div>
            <p class="subtitle">Use the seeded account to continue into the consent step.</p>
            ${error ? `<div class="notice error">${escapeHtml(error)}</div>` : `<div class="notice">Test account: <strong>test@banik.com</strong> with password <strong>123456</strong>.</div>`}
            <form method="post" action="/login">
              <input type="hidden" name="returnTo" value="${escapeHtml(returnTo)}" />
              <label>Email
                <input name="email" type="email" value="test@banik.com" required autofocus />
              </label>
              <label>Password
                <input name="password" type="password" value="123456" required />
              </label>
              <div class="button-row">
                <button class="button button-primary" type="submit">Continue</button>
              </div>
            </form>
            <p class="fineprint">This is a local demo provider. No credentials leave your machine.</p>
          </div>
        </div>
      </section>
    `,
  });
}

function renderConsentPage({ client, scope, state, redirectUri, user }) {
  const scopeItems = scope.split(/\s+/).filter(Boolean);

  return pageShell({
    title: `Continue with ${client.name}`,
    body: `
      <section class="card">
        <div class="hero">
          <div class="eyebrow">Permission request</div>
          <h1>Choose what ${escapeHtml(client.name)} can access.</h1>
          <p class="lede">You are signed in as ${escapeHtml(user.email)}. Approve the request only if you trust the app and the redirect destination.</p>
          <div class="stack">
            <div class="feature"><span class="dot"></span><div><strong>Client</strong><span>${escapeHtml(client.name)} is requesting access through the authorization server.</span></div></div>
            <div class="feature"><span class="dot"></span><div><strong>Redirect</strong><span>${escapeHtml(redirectUri)}</span></div></div>
            <div class="feature"><span class="dot"></span><div><strong>Signed in as</strong><span>${escapeHtml(user.name)} · ${escapeHtml(user.email)}</span></div></div>
          </div>
        </div>
        <div class="form">
          <div class="panel">
            <div class="brand"><span class="mark"></span><div>${escapeHtml(client.name)}</div></div>
            <p class="subtitle">The app is asking for the following scopes before it can create an authorization code.</p>
            <div class="client-box">
              <strong>${escapeHtml(client.name)}</strong>
              <span>Trusted app in this demo workspace</span>
            </div>
            <ul class="scope-list">
              ${scopeItems.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
            </ul>
            <form method="post" action="/authorize/approve">
              <input type="hidden" name="client_id" value="${escapeHtml(client.client_id)}" />
              <input type="hidden" name="redirect_uri" value="${escapeHtml(redirectUri)}" />
              <input type="hidden" name="state" value="${escapeHtml(state)}" />
              <input type="hidden" name="scope" value="${escapeHtml(scope)}" />
              <div class="button-row">
                <button class="button button-secondary" type="submit" name="approve" value="deny">Cancel</button>
                <button class="button button-primary" type="submit" name="approve" value="allow">Allow</button>
              </div>
            </form>
            <p class="fineprint">Approving will send an authorization code back to the redirect URI. Tokens remain stored in Redis with expiry.</p>
          </div>
        </div>
      </section>
    `,
  });
}

function renderNoticePage({ title, heading, message, tone = "neutral" }) {
  return pageShell({
    title,
    body: `
      <section class="card" style="grid-template-columns:1fr; width:min(760px,100%);">
        <div class="hero" style="border-right:0; border-bottom:0; text-align:center;">
          <div class="eyebrow">Authorization server</div>
          <h1>${escapeHtml(heading)}</h1>
          <p class="lede" style="margin-inline:auto;">${escapeHtml(message)}</p>
          <div class="notice ${tone === "danger" ? "error" : ""}" style="max-width:560px; margin:0 auto;">${escapeHtml(message)}</div>
        </div>
      </section>
    `,
  });
}

async function seedRedis() {
  const user = {
    id: seedUser.id,
    email: seedUser.email,
    name: seedUser.name,
    picture: seedUser.picture,
    passwordHash: await bcrypt.hash(seedUser.password, 10),
    createdAt: new Date().toISOString(),
  };

  const client = {
    ...seedClient,
    createdAt: new Date().toISOString(),
  };

  if (!(await redisClient.exists(userKey(user.id)))) {
    await redisClient.set(userKey(user.id), JSON.stringify(user));
  }

  if (!(await redisClient.exists(emailKey(user.email)))) {
    await redisClient.set(emailKey(user.email), user.id);
  }

  if (!(await redisClient.exists(clientKey(client.client_id)))) {
    await redisClient.set(clientKey(client.client_id), JSON.stringify(client));
  }
}

async function getUserById(userId) {
  const raw = await redisClient.get(userKey(userId));
  return raw ? JSON.parse(raw) : null;
}

async function getUserByEmail(email) {
  const userId = await redisClient.get(emailKey(email));
  if (!userId) {
    return null;
  }

  return getUserById(userId);
}

async function getClient(clientId) {
  const raw = await redisClient.get(clientKey(clientId));
  return raw ? JSON.parse(raw) : null;
}

function defaultReturnTo() {
  return `/authorize?${new URLSearchParams({
    client_id: seedClient.client_id,
    redirect_uri: seedClient.redirect_uris[0],
    response_type: "code",
    state: "demo",
    scope: "email profile",
  }).toString()}`;
}

function parseReturnTo(value) {
  if (typeof value !== "string" || !value.startsWith("/")) {
    return defaultReturnTo();
  }

  return value;
}

app.get("/", async (req, res) => {
  const user = req.session.userId ? await getUserById(req.session.userId) : null;
  res.send(
    renderNoticePage({
      title: "Auth Demo",
      heading: user ? `Hello, ${user.name}` : "OAuth authorization server",
      message: user
        ? "You are signed in and can continue to the consent screen from the client app."
        : "Open the client backend to start an authorization-code flow.",
    })
  );
});

app.get("/login", (req, res) => {
  res.send(renderLoginPage({ returnTo: parseReturnTo(req.query.returnTo) }));
});

app.post("/login", async (req, res) => {
  const { email = "", password = "", returnTo = "/authorize" } = req.body;
  const user = await getUserByEmail(email.trim().toLowerCase());

  if (!user) {
    return res.status(401).send(renderLoginPage({ error: "Invalid email or password.", returnTo: parseReturnTo(returnTo) }));
  }

  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) {
    return res.status(401).send(renderLoginPage({ error: "Invalid email or password.", returnTo: parseReturnTo(returnTo) }));
  }

  req.session.userId = user.id;
  req.session.save(() => res.redirect(parseReturnTo(returnTo)));
});

app.get("/authorize", async (req, res) => {
  const {
    client_id,
    redirect_uri,
    state = "",
    scope = "email profile",
    response_type = "code",
  } = req.query;

  if (response_type !== "code") {
    return res.status(400).send(renderNoticePage({ title: "Unsupported response type", heading: "Unsupported response type", message: "Only the authorization-code flow is implemented.", tone: "danger" }));
  }

  const client = await getClient(client_id);
  if (!client) {
    return res.status(400).send(renderNoticePage({ title: "Invalid client", heading: "Invalid client", message: "The client_id does not match a registered application.", tone: "danger" }));
  }

  if (!client.redirect_uris.includes(redirect_uri)) {
    return res.status(400).send(renderNoticePage({ title: "Invalid redirect URI", heading: "Invalid redirect URI", message: "The requested redirect URI is not allowed for this client.", tone: "danger" }));
  }

  if (!req.session.userId) {
    const returnTo = `/authorize?${new URLSearchParams({
      client_id,
      redirect_uri,
      state,
      scope,
      response_type,
    }).toString()}`;

    return res.redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  }

  const user = await getUserById(req.session.userId);
  if (!user) {
    req.session.destroy(() => {});
    return res.redirect(`/login?returnTo=${encodeURIComponent(req.originalUrl)}`);
  }

  res.send(renderConsentPage({ client, scope, state, redirectUri: redirect_uri, user }));
});

app.post("/authorize/approve", async (req, res) => {
  const { approve, client_id, redirect_uri, state = "", scope = "email profile" } = req.body;

  if (!req.session.userId) {
    return res.status(401).send(renderNoticePage({ title: "Not signed in", heading: "Sign in required", message: "You need an active session before granting consent.", tone: "danger" }));
  }

  const client = await getClient(client_id);
  if (!client || !client.redirect_uris.includes(redirect_uri)) {
    return res.status(400).send(renderNoticePage({ title: "Invalid request", heading: "Invalid request", message: "The client or redirect URI is no longer valid.", tone: "danger" }));
  }

  if (approve !== "allow") {
    const deniedUrl = new URL(redirect_uri);
    deniedUrl.searchParams.set("error", "access_denied");
    if (state) {
      deniedUrl.searchParams.set("state", state);
    }
    return res.redirect(deniedUrl.toString());
  }

  const code = crypto.randomUUID().replaceAll("-", "");
  await redisClient.set(
    codeKey(code),
    JSON.stringify({
      userId: req.session.userId,
      client_id,
      redirect_uri,
      scope,
      issuedAt: Date.now(),
    }),
    { EX: AUTH_CODE_TTL_SECONDS }
  );

  const redirectUrl = new URL(redirect_uri);
  redirectUrl.searchParams.set("code", code);
  if (state) {
    redirectUrl.searchParams.set("state", state);
  }

  res.redirect(redirectUrl.toString());
});

app.post("/token", async (req, res) => {
  const {
    grant_type = "authorization_code",
    code,
    refresh_token,
    client_id,
    client_secret,
    redirect_uri,
  } = req.body;

  const client = await getClient(client_id);
  if (!client || client.client_secret !== client_secret) {
    return res.status(401).json({ error: "invalid_client" });
  }

  if (grant_type === "authorization_code") {
    const rawCode = await redisClient.get(codeKey(code));
    if (!rawCode) {
      return res.status(400).json({ error: "invalid_grant" });
    }

    const authCode = JSON.parse(rawCode);
    if (authCode.client_id !== client_id || authCode.redirect_uri !== redirect_uri) {
      return res.status(400).json({ error: "invalid_grant" });
    }

    await redisClient.del(codeKey(code));

    const accessToken = crypto.randomUUID().replaceAll("-", "");
    const issuedAt = Date.now();
    const refreshToken = crypto.randomUUID().replaceAll("-", "");

    await redisClient.set(
      accessTokenKey(accessToken),
      JSON.stringify({
        userId: authCode.userId,
        client_id,
        scope: authCode.scope,
        issuedAt,
      }),
      { EX: ACCESS_TOKEN_TTL_SECONDS }
    );

    await redisClient.set(
      refreshTokenKey(refreshToken),
      JSON.stringify({
        userId: authCode.userId,
        client_id,
        scope: authCode.scope,
      }),
      { EX: REFRESH_TOKEN_TTL_SECONDS }
    );

    return res.json({
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: "Bearer",
      expires_in: ACCESS_TOKEN_TTL_SECONDS,
      scope: authCode.scope,
    });
  }

  if (grant_type === "refresh_token") {
    const rawRefreshToken = await redisClient.get(refreshTokenKey(refresh_token));
    if (!rawRefreshToken) {
      return res.status(400).json({ error: "invalid_grant" });
    }

    const storedRefreshToken = JSON.parse(rawRefreshToken);
    if (storedRefreshToken.client_id !== client_id) {
      return res.status(400).json({ error: "invalid_grant" });
    }

    const accessToken = crypto.randomUUID().replaceAll("-", "");
    await redisClient.set(
      accessTokenKey(accessToken),
      JSON.stringify({
        userId: storedRefreshToken.userId,
        client_id,
        scope: storedRefreshToken.scope,
        issuedAt: Date.now(),
      }),
      { EX: ACCESS_TOKEN_TTL_SECONDS }
    );

    return res.json({
      access_token: accessToken,
      token_type: "Bearer",
      expires_in: ACCESS_TOKEN_TTL_SECONDS,
      scope: storedRefreshToken.scope,
    });
  }

  return res.status(400).json({ error: "unsupported_grant_type" });
});

async function userInfoHandler(req, res) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!token) {
    return res.status(401).json({ error: "missing_token" });
  }

  const rawToken = await redisClient.get(accessTokenKey(token));
  if (!rawToken) {
    return res.status(401).json({ error: "invalid_token" });
  }

  const accessToken = JSON.parse(rawToken);
  const user = await getUserById(accessToken.userId);

  if (!user) {
    return res.status(401).json({ error: "invalid_token" });
  }

  res.json({
    sub: user.id,
    email: user.email,
    name: user.name,
    picture: user.picture,
    provider: "redis-oauth-demo",
  });
}

app.get("/me", userInfoHandler);
app.get("/userinfo", userInfoHandler);

app.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("oauth-auth.sid");
    res.json({ message: "Logged out" });
  });
});

async function start() {
  await redisClient.connect();
  await seedRedis();

  app.listen(4000, () => {
    console.log("OAuth server running on http://localhost:4000");
  });
}

start().catch((error) => {
  console.error("Failed to start OAuth server:", error);
  process.exitCode = 1;
});
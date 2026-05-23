import axios from "axios";
import { useEffect, useState } from "react";

const API_BASE = "http://localhost:8000";

const featureCards = [
  {
    title: "Authorization code flow",
    text: "A dedicated auth server issues codes after login and consent.",
  },
  {
    title: "Redis-backed sessions",
    text: "The app backend stores sessions and local users in Redis.",
  },
  {
    title: "Code and token only",
    text: "The demo issues an authorization code, then exchanges it for an access token.",
  },
];

export default function Home() {

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check logged-in user
  const fetchUser = async () => {
    setLoading(true);

    try {

      const res = await axios.get(
        `${API_BASE}/me`,
        {
          withCredentials: true
        }
      );

      setUser(res.data);

    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  // Start OAuth flow
  const loginWithBanik = () => {

    window.location.href = `${API_BASE}/auth/login-google`;
  };

  const logout = async () => {
    try {
      await axios.post(`${API_BASE}/logout`, {}, { withCredentials: true });
    } finally {
      setUser(null);
    }
  };

  return (
    <main className="app-shell">
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">OAuth demo · Redis-backed</span>
          <h1>Sign in with a clean OAuth code flow.</h1>
          <p className="lede">
            The app sends you through login, consent, code exchange, and a Redis-powered session so the whole path behaves like a real OAuth experience.
          </p>

          <div className="hero-actions">
            {user ? (
              <button className="button button-secondary" onClick={logout} type="button">
                Sign out
              </button>
            ) : (
              <button className="button button-primary" onClick={loginWithBanik} type="button">
                Continue with OAuth
              </button>
            )}
            <button className="button button-ghost" onClick={fetchUser} type="button">
              Refresh status
            </button>
          </div>
        </div>

        <div className="status-card">
          <div className="status-card-header">
            <span className="status-dot" />
            <span>{loading ? "Checking session" : user ? "Signed in" : "Signed out"}</span>
          </div>

          {user ? (
            <div className="profile-card">
              <img className="avatar" src={user.picture} alt={user.name} />
              <div>
                <h2>{user.name}</h2>
                <p>{user.email}</p>
              </div>
              <div className="stat-grid">
                <div>
                  <span>Local user</span>
                  <strong>{user.id}</strong>
                </div>
                <div>
                  <span>Remote account</span>
                  <strong>{user.remoteUserId}</strong>
                </div>
                <div>
                  <span>Provider</span>
                  <strong>{user.provider}</strong>
                </div>
              </div>
            </div>
          ) : (
            <div className="profile-card empty-card">
              <h2>{loading ? "Loading session..." : "Not signed in"}</h2>
              <p>
                {loading
                  ? "Checking whether the Redis session already exists."
                  : "Use the button to launch the OAuth redirect chain."}
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="feature-grid">
        {featureCards.map((card) => (
          <article className="feature-card" key={card.title}>
            <span className="feature-kicker" />
            <h3>{card.title}</h3>
            <p>{card.text}</p>
          </article>
        ))}
      </section>

      <section className="flow-panel">
        <div>
          <span className="eyebrow eyebrow-muted">Flow</span>
          <h2>What happens when you click continue?</h2>
        </div>

        <ol className="flow-list">
          <li>Client backend generates a state value and redirects to the auth server.</li>
          <li>Auth server shows login, stores the session in Redis, then renders consent.</li>
          <li>Approved consent returns an authorization code to the callback URL.</li>
          <li>The app backend exchanges the code for an access token, fetches the profile, and stores the session in Redis.</li>
        </ol>
      </section>
    </main>
  );
}
import { useState } from "react";
import { useNavigate } from "react-router";

import { api } from "../lib/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const login = async () => {
    setError("");
    setLoading(true);

    try {
      await api.post("/login", { email, password });
      alert("Logged in");
      navigate("/profile", { replace: true });
    } catch {
      setError("Login failed. Check your credentials and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <p className="eyebrow">Welcome back</p>
        <h2>Login</h2>
        <p className="lede">Sign in to create a session with the server.</p>

        <div className="field-stack">
          <input
            autoComplete="email"
            className="auth-input"
            placeholder="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            autoComplete="current-password"
            className="auth-input"
            placeholder="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error ? <p className="form-error">{error}</p> : null}

        <button className="button button--primary" onClick={login} disabled={loading} type="button">
          {loading ? "Logging in..." : "Login"}
        </button>
      </section>
    </main>
  );
}
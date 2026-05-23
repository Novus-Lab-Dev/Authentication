import { Link } from "react-router";

import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Session Auth" },
    { name: "description", content: "Session auth demo with login and profile pages." },
  ];
}

export default function Home() {
  return (
    <main className="auth-shell">
      <section className="auth-card auth-card--hero">
        <p className="eyebrow">Session auth demo</p>
        <h1>Login, profile, and logout flow</h1>
        <p className="lede">
          Open the login page to create a session, then visit the protected profile page to
          read the current user from the server.
        </p>
        <div className="button-row">
          <Link className="button button--primary" to="/login">
            Login
          </Link>
          <Link className="button" to="/profile">
            Profile
          </Link>
        </div>
      </section>
    </main>
  );
}

import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

import { Logout } from "../components/logout-button";
import { api } from "../lib/api";

type User = {
  id: string;
  email: string;
};

export default function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    api
      .get("/me")
      .then((res) => {
        if (active) setUser(res.data);
      })
      .catch(() => {
        navigate("/login", { replace: true });
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [navigate]);

  if (loading) {
    return (
      <main className="auth-shell">
        <section className="auth-card">
          <p>Loading...</p>
        </section>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <p className="eyebrow">Protected area</p>
        <h2>Profile</h2>
        <p className="lede">The current session is attached to this profile data.</p>

        <div className="profile-grid">
          <p>
            <strong>ID:</strong> {user.id}
          </p>
          <p>
            <strong>Email:</strong> {user.email}
          </p>
        </div>

        <Logout />
      </section>
    </main>
  );
}
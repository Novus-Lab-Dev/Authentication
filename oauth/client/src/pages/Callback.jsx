import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Callback() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      navigate("/", { replace: true });
    }, 900);

    return () => window.clearTimeout(timer);

  }, [navigate]);

  return (
    <main className="callback-screen">
      <div className="callback-card">
        <span className="eyebrow">Signing you in</span>
        <h1>Completing the OAuth callback.</h1>
        <p>
          The backend has already stored the session. This screen gives the redirect a moment to settle before returning home.
        </p>
        <div className="spinner-row">
          <span className="spinner" />
          <span>Finalizing profile and session state</span>
        </div>
      </div>
    </main>
  );
}
import { useNavigate } from "react-router";

import { api } from "../lib/api";

export function Logout() {
  const navigate = useNavigate();

  const logout = async () => {
    await api.post("/logout");
    alert("Logged out");
    navigate("/login", { replace: true });
  };

  return (
    <button className="button button--ghost" onClick={logout} type="button">
      Logout
    </button>
  );
}
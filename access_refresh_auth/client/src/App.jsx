import { useState } from "react";
import { api } from "./helper/api";
import { login } from "./helper/login";

export default function App() {
  const [email, setEmail] = useState("test@example.com");
  const [password, setPassword] = useState("123456");
  const [user, setUser] = useState(null);

  const handleLogin = async () => {
    await login(email, password);
  };

  const fetchMe = async () => {
    const res = await api.get("/me");
    setUser(res.data.user);
  };

  const logout = async () => {
    await api.post("/logout");
    setUser(null);
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Auth Demo</h2>

      <input value={email} onChange={(e) => setEmail(e.target.value)} />
      <input value={password} onChange={(e) => setPassword(e.target.value)} />

      <button onClick={handleLogin}>Login</button>
      <button onClick={fetchMe}>Get Profile</button>
      <button onClick={logout}>Logout</button>

      <pre>{JSON.stringify(user, null, 2)}</pre>
    </div>
  );
}
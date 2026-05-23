import { useState } from "react";

const API = "http://localhost:3000";

export default function App() {
  const [name, setName] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [response, setResponse] = useState("");

  async function createKey() {
    const res = await fetch(`${API}/api/keys`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name })
    });

    const data = await res.json();
    setApiKey(data.apiKey);
  }

  async function testApi() {
    const res = await fetch(`${API}/api/data`, {
      headers: {
        "x-api-key": apiKey
      }
    });

    const data = await res.json();
    setResponse(JSON.stringify(data, null, 2));
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>API Key Auth Demo</h1>

      <input
        placeholder="App name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <button onClick={createKey}>Create API Key</button>

      {apiKey && (
        <>
          <p><b>Your API Key:</b> {apiKey}</p>

          <button onClick={testApi}>
            Test Protected API
          </button>
        </>
      )}

      <pre>{response}</pre>
    </div>
  );
}
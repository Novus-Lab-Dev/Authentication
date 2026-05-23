import { useState } from "react";

function App() {
  const [result, setResult] = useState("");

  async function login() {
    const username = "admin";
    const password = "1234";

    // Base64 encode
    const credentials = btoa(`${username}:${password}`);

    const response = await fetch(
      "http://localhost:3000/profile",
      {
        headers: {
          Authorization: `Basic ${credentials}`,
        },
      }
    );

    const data = await response.json();

    setResult(JSON.stringify(data, null, 2));
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Basic Auth Demo</h1>

      <button onClick={login}>
        Access Protected Route
      </button>

      <pre>{result}</pre>
    </div>
  );
}

export default App;
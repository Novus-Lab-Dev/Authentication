import axios from "axios";
import { useEffect, useState } from "react";

export default function Home() {

  const [user, setUser] = useState(null);

  // Check logged-in user
  const fetchUser = async () => {

    try {

      const res = await axios.get(
        "http://localhost:8000/me",
        {
          withCredentials: true
        }
      );

      setUser(res.data);

    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  // Start OAuth flow
  const loginWithBanik = () => {

    window.location.href =
      "http://localhost:8000/auth/login-banik";
  };

  return (
    <div style={{ padding: 40 }}>

      <h1>Client</h1>

      {
        user ? (
          <>
            <h2>Logged In</h2>

            <pre>
              {JSON.stringify(user, null, 2)}
            </pre>
          </>
        ) : (
          <>
            <h2>Not Logged In</h2>

            <button onClick={loginWithBanik}>
              Login with Auth Server
            </button>
          </>
        )
      }

    </div>
  );
}
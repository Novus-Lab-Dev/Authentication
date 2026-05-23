const API_URL = "http://localhost:3000/api/auth";

export async function register(
  email,
  password
) {
  const response = await fetch(
    `${API_URL}/register`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        password
      })
    }
  );

  return response.json();
}

export async function login(
  email,
  password
) {
  const response = await fetch(
    `${API_URL}/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        password
      })
    }
  );

  return response.json();
}

export async function getProfile() {
  const token =
    localStorage.getItem("token");

  const response = await fetch(
    `${API_URL}/me`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  return response.json();
}
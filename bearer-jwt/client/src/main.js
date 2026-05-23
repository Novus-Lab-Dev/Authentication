import "./style.css";

import {
  register,
  login,
  getProfile
} from "./api";

import {
  saveToken,
  logout,
  getToken
} from "./auth";

document.querySelector("#app").innerHTML =
`
<div class="container">
  <h1>JWT Auth Demo</h1>

  <input id="email" placeholder="Email" />
  <input
    id="password"
    type="password"
    placeholder="Password"
  />

  <div class="buttons">
    <button id="registerBtn">
      Register
    </button>

    <button id="loginBtn">
      Login
    </button>

    <button id="profileBtn">
      Get Profile
    </button>

    <button id="logoutBtn">
      Logout
    </button>
  </div>

  <pre id="output"></pre>
</div>
`;

const output =
  document.getElementById("output");

function getInputs() {
  return {
    email:
      document.getElementById("email").value,

    password:
      document.getElementById("password").value
  };
}

/*
  Register
*/
document
  .getElementById("registerBtn")
  .addEventListener("click", async () => {

    const { email, password } =
      getInputs();

    const data = await register(
      email,
      password
    );

    output.textContent =
      JSON.stringify(data, null, 2);
});

/*
  Login
*/
document
  .getElementById("loginBtn")
  .addEventListener("click", async () => {

    const { email, password } =
      getInputs();

    const data = await login(
      email,
      password
    );

    if (data.token) {
      saveToken(data.token);
    }

    output.textContent =
      JSON.stringify(data, null, 2);
});

/*
  Protected API
*/
document
  .getElementById("profileBtn")
  .addEventListener("click", async () => {

    const data = await getProfile();

    output.textContent =
      JSON.stringify(data, null, 2);
});

/*
  Logout
*/
document
  .getElementById("logoutBtn")
  .addEventListener("click", () => {

    logout();

    output.textContent =
      "Logged out";
});

/*
  Auto status
*/
if (getToken()) {
  output.textContent =
    "Already logged in";
}
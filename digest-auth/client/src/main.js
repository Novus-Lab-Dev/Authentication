const app = document.querySelector("#app");

async function loadProtected() {
  try {
    const response = await fetch(
      "http://localhost:3000/api/protected",
      {
        credentials: "include",
      }
    );

    const text = await response.text();

    app.innerHTML = `
      <pre>${text}</pre>
    `;
  } catch (err) {
    console.error(err);
  }
}

loadProtected();
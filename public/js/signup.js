const form = document.getElementById("signup-form");
const banner = document.getElementById("banner");

function showBanner(message, type = "error") {
  banner.textContent = message;
  banner.className = `banner show banner-${type}`;
}

// Already signed in? Go to the dashboard.
Auth.me().then((user) => {
  if (user) location.href = "/";
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  banner.className = "banner";

  const payload = {
    email: document.getElementById("email").value.trim(),
    username: document.getElementById("username").value.trim(),
    displayName: document.getElementById("displayName").value.trim(),
    password: document.getElementById("password").value,
  };

  try {
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) return showBanner(data.error || "Could not create account.");

    Auth.setToken(data.token);
    location.href = "/";
  } catch {
    showBanner("Network error. Is the server running?");
  }
});

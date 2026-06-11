const form = document.getElementById("login-form");
const banner = document.getElementById("banner");

function showBanner(message, type = "error") {
  banner.textContent = message;
  banner.className = `banner show banner-${type}`;
}

Auth.me().then((user) => {
  if (user) location.href = "/";
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  banner.className = "banner";

  const payload = {
    identifier: document.getElementById("identifier").value.trim(),
    password: document.getElementById("password").value,
  };

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) return showBanner(data.error || "Could not log in.");

    Auth.setToken(data.token);
    location.href = "/";
  } catch {
    showBanner("Network error. Is the server running?");
  }
});

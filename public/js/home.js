const banner = document.getElementById("banner");
const myPollsEl = document.getElementById("my-polls");
const currentUserEl = document.getElementById("current-user");
const logoutBtn = document.getElementById("logout-btn");
const greetingEl = document.getElementById("greeting");
const joinForm = document.getElementById("join-form");
const joinInput = document.getElementById("join-input");

function showBanner(message, type = "error") {
  banner.textContent = message;
  banner.className = `banner show banner-${type}`;
}

function clearBanner() {
  banner.className = "banner";
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// Accepts a raw poll code/UUID or a full poll/results link and
// returns the id-or-code part, e.g. "https://…/poll.html?id=7KQ2MX" -> "7KQ2MX".
function parsePollInput(raw) {
  const value = String(raw || "").trim();
  if (!value) return "";
  try {
    const url = new URL(value);
    return url.searchParams.get("id") || "";
  } catch {
    return value;
  }
}

joinForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearBanner();

  const idOrCode = parsePollInput(joinInput.value);
  if (!idOrCode) return showBanner("Please enter a poll ID or link.");

  try {
    const res = await fetch(`/api/polls/${encodeURIComponent(idOrCode)}`);
    if (!res.ok) {
      return showBanner("No poll found with that ID. Double-check and try again.");
    }
    const poll = await res.json();
    location.href = `/poll.html?id=${encodeURIComponent(poll.code || poll.id)}`;
  } catch {
    showBanner("Network error. Is the server running?");
  }
});

async function copyText(text, button) {
  try {
    await navigator.clipboard.writeText(text);
    const original = button.textContent;
    button.textContent = "Copied!";
    setTimeout(() => (button.textContent = original), 1200);
  } catch {
    showBanner("Could not copy. Copy it manually: " + text);
  }
}

async function renderMyPolls() {
  try {
    const res = await Auth.fetch("/api/polls");
    if (!res.ok) {
      myPollsEl.innerHTML =
        '<div class="empty-state">Could not load your polls.</div>';
      return;
    }
    const { polls } = await res.json();
    if (!polls || polls.length === 0) {
      myPollsEl.innerHTML =
        '<div class="empty-state">No polls yet. Create one to get started.</div>';
      return;
    }
    myPollsEl.innerHTML = polls
      .map(
        (p) => `
        <div class="poll-list-item">
          <div>
            <h3 style="margin:0">${escapeHtml(p.title)}</h3>
            <span class="muted">${new Date(p.createdAt + "Z").toLocaleString()}</span>
          </div>
          <div class="btn-row">
            ${
              p.code
                ? `<span class="code-chip">${escapeHtml(p.code)}</span>
                   <button type="button" class="btn btn-ghost copy-code" data-code="${escapeHtml(p.code)}">Copy ID</button>`
                : ""
            }
            <a class="btn btn-secondary" href="/poll.html?id=${p.code || p.id}">Open</a>
            <a class="btn btn-ghost" href="/results.html?id=${p.code || p.id}">Results</a>
          </div>
        </div>`
      )
      .join("");

    myPollsEl.querySelectorAll(".copy-code").forEach((btn) => {
      btn.addEventListener("click", () => copyText(btn.dataset.code, btn));
    });
  } catch {
    myPollsEl.innerHTML =
      '<div class="empty-state">Network error loading polls.</div>';
  }
}

logoutBtn.addEventListener("click", () => Auth.logout());

(async function init() {
  const user = await Auth.requireUser();
  if (!user) return;
  currentUserEl.textContent = `${user.displayName} (@${user.username})`;
  greetingEl.textContent = `Welcome back, ${user.displayName}`;
  renderMyPolls();
})();

const form = document.getElementById("poll-form");
const optionsEl = document.getElementById("options");
const addOptionBtn = document.getElementById("add-option");
const banner = document.getElementById("banner");
const currentUserEl = document.getElementById("current-user");
const logoutBtn = document.getElementById("logout-btn");
const shareCard = document.getElementById("share-card");
const shareCodeInput = document.getElementById("share-code");
const shareLinkInput = document.getElementById("share-link");
const copyCodeBtn = document.getElementById("copy-code");
const copyLinkBtn = document.getElementById("copy-link");
const openPollLink = document.getElementById("open-poll");

let optionCount = 2;

function showBanner(message, type = "error") {
  banner.textContent = message;
  banner.className = `banner show banner-${type}`;
}

function clearBanner() {
  banner.className = "banner";
}

addOptionBtn.addEventListener("click", () => {
  optionCount += 1;
  const row = document.createElement("div");
  row.className = "option-row";
  row.innerHTML = `
    <input type="text" class="option-input" placeholder="Option ${optionCount}" />
    <button type="button" class="btn btn-danger remove-option">Remove</button>
  `;
  optionsEl.appendChild(row);
  row.querySelector(".remove-option").addEventListener("click", () => {
    row.remove();
  });
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

copyCodeBtn.addEventListener("click", () =>
  copyText(shareCodeInput.value, copyCodeBtn)
);
copyLinkBtn.addEventListener("click", () =>
  copyText(shareLinkInput.value, copyLinkBtn)
);

function showShareCard(poll) {
  const idOrCode = poll.code || poll.id;
  shareCodeInput.value = idOrCode;
  shareLinkInput.value = `${location.origin}/poll.html?id=${idOrCode}`;
  openPollLink.href = `/poll.html?id=${idOrCode}`;
  shareCard.style.display = "block";
  shareCard.scrollIntoView({ behavior: "smooth", block: "start" });
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearBanner();

  const title = document.getElementById("title").value.trim();
  const description = document.getElementById("description").value.trim();
  const allowMultiple = document.getElementById("allow-multiple").checked;
  const resultsVisibility = document.getElementById("visibility").value;
  const options = [...document.querySelectorAll(".option-input")]
    .map((el) => el.value.trim())
    .filter(Boolean);

  if (!title) return showBanner("Please enter a poll title.");
  if (options.length < 2)
    return showBanner("Please provide at least two options.");

  try {
    const res = await Auth.fetch("/api/polls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        options,
        allowMultiple,
        resultsVisibility,
      }),
    });
    const data = await res.json();
    if (!res.ok) return showBanner(data.error || "Failed to create poll.");

    form.reset();
    showShareCard(data);
  } catch {
    showBanner("Network error. Is the server running?");
  }
});

logoutBtn.addEventListener("click", () => Auth.logout());

(async function init() {
  const user = await Auth.requireUser();
  if (!user) return;
  currentUserEl.textContent = `${user.displayName} (@${user.username})`;
})();

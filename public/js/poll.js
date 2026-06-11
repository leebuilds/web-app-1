const banner = document.getElementById("banner");
const titleEl = document.getElementById("poll-title");
const descEl = document.getElementById("poll-description");
const optionsEl = document.getElementById("options");
const form = document.getElementById("vote-form");
const submitBtn = document.getElementById("submit-vote");
const resultsLink = document.getElementById("results-link");

const pollId = new URLSearchParams(location.search).get("id");
let poll = null;

function showBanner(message, type = "error") {
  banner.textContent = message;
  banner.className = `banner show banner-${type}`;
}

function getVoterToken() {
  let token = localStorage.getItem("voterToken");
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem("voterToken", token);
  }
  return token;
}

function hasVotedLocally(id) {
  try {
    const voted = JSON.parse(localStorage.getItem("votedPolls") || "[]");
    return voted.includes(id);
  } catch {
    return false;
  }
}

function markVotedLocally(id) {
  const voted = JSON.parse(localStorage.getItem("votedPolls") || "[]");
  if (!voted.includes(id)) {
    voted.push(id);
    localStorage.setItem("votedPolls", JSON.stringify(voted));
  }
}

async function loadPoll() {
  if (!pollId) {
    showBanner("No poll specified.");
    titleEl.textContent = "Poll not found";
    form.style.display = "none";
    return;
  }

  resultsLink.href = `/results.html?id=${pollId}`;

  try {
    const res = await fetch(`/api/polls/${pollId}`);
    const data = await res.json();
    if (!res.ok) {
      titleEl.textContent = "Poll not found";
      form.style.display = "none";
      return showBanner(data.error || "Poll not found.");
    }
    poll = data;
    render();
  } catch {
    showBanner("Network error. Is the server running?");
  }
}

function render() {
  titleEl.textContent = poll.title;
  descEl.textContent = poll.description || "";

  const inputType = poll.allowMultiple ? "checkbox" : "radio";
  optionsEl.innerHTML = poll.options
    .map(
      (o) => `
      <label class="vote-option">
        <input type="${inputType}" name="option" value="${o.id}" />
        <span>${escapeHtml(o.text)}</span>
      </label>`
    )
    .join("");

  optionsEl.querySelectorAll(".vote-option").forEach((el) => {
    const input = el.querySelector("input");
    input.addEventListener("change", () => {
      optionsEl
        .querySelectorAll(".vote-option")
        .forEach((o) => o.classList.toggle("selected", o.querySelector("input").checked));
    });
  });

  if (hasVotedLocally(poll.id)) {
    disableVoting("You have already voted in this poll.");
  }
}

function disableVoting(message) {
  form.querySelectorAll("input").forEach((i) => (i.disabled = true));
  submitBtn.disabled = true;
  submitBtn.textContent = "Vote submitted";
  if (message) showBanner(message, "success");
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const selected = [...optionsEl.querySelectorAll("input:checked")].map(
    (i) => i.value
  );
  if (selected.length === 0) return showBanner("Please select an option.");

  try {
    const res = await fetch(`/api/polls/${poll.id}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ optionIds: selected, voterToken: getVoterToken() }),
    });
    const data = await res.json();
    if (!res.ok) return showBanner(data.error || "Failed to submit vote.");

    markVotedLocally(poll.id);
    disableVoting();
    showBanner("Thanks! Your vote was recorded.", "success");

    if (poll.resultsVisibility === "after_vote" || poll.resultsVisibility === "always") {
      setTimeout(() => {
        location.href = `/results.html?id=${poll.id}`;
      }, 900);
    }
  } catch {
    showBanner("Network error. Is the server running?");
  }
});

loadPoll();

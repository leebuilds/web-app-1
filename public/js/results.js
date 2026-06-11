const banner = document.getElementById("banner");
const titleEl = document.getElementById("poll-title");
const descEl = document.getElementById("poll-description");
const totalEl = document.getElementById("total-votes");
const resultsEl = document.getElementById("results");
const voteLink = document.getElementById("vote-link");
const refreshBtn = document.getElementById("refresh");

const pollId = new URLSearchParams(location.search).get("id");

function showBanner(message, type = "error") {
  banner.textContent = message;
  banner.className = `banner show banner-${type}`;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

async function loadResults() {
  if (!pollId) {
    titleEl.textContent = "Poll not found";
    return showBanner("No poll specified.");
  }
  voteLink.href = `/poll.html?id=${pollId}`;

  try {
    const res = await fetch(`/api/polls/${pollId}/results`);
    const data = await res.json();
    if (!res.ok) {
      titleEl.textContent = "Poll not found";
      return showBanner(data.error || "Poll not found.");
    }
    render(data);
  } catch {
    showBanner("Network error. Is the server running?");
  }
}

function render(data) {
  titleEl.textContent = data.title;
  descEl.textContent = data.description || "";
  totalEl.textContent = `${data.totalVotes} total vote${data.totalVotes === 1 ? "" : "s"}`;

  if (data.results.length === 0) {
    resultsEl.innerHTML = '<div class="empty-state">No options found.</div>';
    return;
  }

  resultsEl.innerHTML = data.results
    .map(
      (r) => `
      <div class="results-bar">
        <div class="results-bar-head">
          <strong>${escapeHtml(r.text)}</strong>
          <span class="muted">${r.percentage}% (${r.votes})</span>
        </div>
        <div class="results-bar-track">
          <div class="results-bar-fill" style="width: ${r.percentage}%"></div>
        </div>
      </div>`
    )
    .join("");
}

refreshBtn.addEventListener("click", loadResults);
loadResults();

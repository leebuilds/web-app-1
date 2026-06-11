import express from "express";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import db, { generatePollCode } from "./db.js";
import {
  hashPassword,
  verifyPassword,
  createSession,
  destroySession,
  publicUser,
  attachUser,
  requireAuth,
} from "./auth.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(attachUser);
app.use(express.static(join(__dirname, "..", "public")));

// --- Prepared statements ---
const insertUser = db.prepare(
  `INSERT INTO users (id, email, username, display_name, password_hash)
   VALUES (?, ?, ?, ?, ?)`
);
const getUserByEmail = db.prepare(`SELECT * FROM users WHERE email = ?`);
const getUserByUsername = db.prepare(`SELECT * FROM users WHERE username = ?`);
const getUserByLogin = db.prepare(
  `SELECT * FROM users WHERE email = ? OR username = ?`
);
const insertPoll = db.prepare(
  `INSERT INTO polls (id, code, owner_id, title, description, allow_multiple, results_visibility)
   VALUES (?, ?, ?, ?, ?, ?, ?)`
);
const listPollsByOwner = db.prepare(
  `SELECT id, code, title, status, created_at FROM polls
   WHERE owner_id = ? ORDER BY created_at DESC`
);
const insertOption = db.prepare(
  `INSERT INTO poll_options (id, poll_id, option_text, sort_order) VALUES (?, ?, ?, ?)`
);
const getPoll = db.prepare(`SELECT * FROM polls WHERE id = ?`);
const getPollByCode = db.prepare(`SELECT * FROM polls WHERE code = ?`);
const getOptions = db.prepare(
  `SELECT id, option_text, sort_order FROM poll_options WHERE poll_id = ? ORDER BY sort_order ASC`
);
const countVotesByToken = db.prepare(
  `SELECT COUNT(*) AS n FROM votes WHERE poll_id = ? AND voter_token = ?`
);
const insertVote = db.prepare(
  `INSERT INTO votes (id, poll_id, option_id, voter_token) VALUES (?, ?, ?, ?)`
);
const getResults = db.prepare(
  `SELECT o.id AS option_id, o.option_text, o.sort_order,
          COUNT(v.id) AS votes
   FROM poll_options o
   LEFT JOIN votes v ON v.option_id = o.id
   WHERE o.poll_id = ?
   GROUP BY o.id
   ORDER BY o.sort_order ASC`
);
const optionBelongsToPoll = db.prepare(
  `SELECT COUNT(*) AS n FROM poll_options WHERE poll_id = ? AND id = ?`
);

// --- Helpers ---

// Resolve a poll by its internal UUID or its short share code.
function findPoll(idOrCode) {
  const raw = String(idOrCode || "").trim();
  if (!raw) return null;
  return getPoll.get(raw) || getPollByCode.get(raw.toUpperCase()) || null;
}

function uniquePollCode() {
  let code;
  do {
    code = generatePollCode();
  } while (getPollByCode.get(code));
  return code;
}

function pollPayload(poll) {
  const options = getOptions.all(poll.id);
  return {
    id: poll.id,
    code: poll.code,
    title: poll.title,
    description: poll.description,
    allowMultiple: !!poll.allow_multiple,
    resultsVisibility: poll.results_visibility,
    status: poll.status,
    createdAt: poll.created_at,
    options: options.map((o) => ({ id: o.id, text: o.option_text })),
  };
}

// --- Auth routes ---

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-zA-Z0-9_]{3,30}$/;

app.post("/api/auth/signup", (req, res) => {
  const { email, username, displayName, password } = req.body || {};

  const cleanEmail = String(email || "").trim().toLowerCase();
  const cleanUsername = String(username || "").trim();
  const cleanDisplay = String(displayName || "").trim();

  if (!EMAIL_RE.test(cleanEmail)) {
    return res.status(400).json({ error: "A valid email is required." });
  }
  if (!USERNAME_RE.test(cleanUsername)) {
    return res.status(400).json({
      error:
        "Username must be 3-30 characters: letters, numbers, or underscores.",
    });
  }
  if (!cleanDisplay) {
    return res.status(400).json({ error: "Display name is required." });
  }
  if (typeof password !== "string" || password.length < 8) {
    return res
      .status(400)
      .json({ error: "Password must be at least 8 characters." });
  }

  if (getUserByEmail.get(cleanEmail)) {
    return res.status(409).json({ error: "Email is already registered." });
  }
  if (getUserByUsername.get(cleanUsername)) {
    return res.status(409).json({ error: "Username is already taken." });
  }

  const userId = randomUUID();
  insertUser.run(
    userId,
    cleanEmail,
    cleanUsername,
    cleanDisplay,
    hashPassword(password)
  );
  const token = createSession(userId);
  const user = { id: userId, email: cleanEmail, username: cleanUsername, display_name: cleanDisplay };
  res.status(201).json({ token, user: publicUser(user) });
});

app.post("/api/auth/login", (req, res) => {
  const { identifier, password } = req.body || {};
  const id = String(identifier || "").trim().toLowerCase();
  if (!id || typeof password !== "string") {
    return res
      .status(400)
      .json({ error: "Enter your email/username and password." });
  }

  const user = getUserByLogin.get(id, String(identifier || "").trim());
  if (!user || !verifyPassword(password, user.password_hash)) {
    return res.status(401).json({ error: "Invalid credentials." });
  }

  const token = createSession(user.id);
  res.json({ token, user: publicUser(user) });
});

app.post("/api/auth/logout", attachUser, (req, res) => {
  destroySession(req.token);
  res.json({ ok: true });
});

app.get("/api/auth/me", (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Not signed in." });
  res.json({ user: publicUser(req.user) });
});

// --- Poll routes ---

// List polls created by the signed-in user
app.get("/api/polls", requireAuth, (req, res) => {
  const rows = listPollsByOwner.all(req.user.id);
  res.json({
    polls: rows.map((p) => ({
      id: p.id,
      code: p.code,
      title: p.title,
      status: p.status,
      createdAt: p.created_at,
    })),
  });
});

// Create a poll
app.post("/api/polls", requireAuth, (req, res) => {
  const { title, description, options, allowMultiple, resultsVisibility } =
    req.body || {};

  if (!title || typeof title !== "string" || !title.trim()) {
    return res.status(400).json({ error: "Poll title is required." });
  }

  const cleanOptions = Array.isArray(options)
    ? options.map((o) => String(o ?? "").trim()).filter(Boolean)
    : [];

  if (cleanOptions.length < 2) {
    return res
      .status(400)
      .json({ error: "Please provide at least two options." });
  }

  const allowedVisibility = ["after_vote", "always", "closed_only"];
  const visibility = allowedVisibility.includes(resultsVisibility)
    ? resultsVisibility
    : "after_vote";

  const pollId = randomUUID();
  insertPoll.run(
    pollId,
    uniquePollCode(),
    req.user.id,
    title.trim(),
    (description || "").trim(),
    allowMultiple ? 1 : 0,
    visibility
  );

  cleanOptions.forEach((text, i) => {
    insertOption.run(randomUUID(), pollId, text, i);
  });

  const poll = getPoll.get(pollId);
  res.status(201).json(pollPayload(poll));
});

// Get a poll (for voting) — accepts the poll UUID or its short share code
app.get("/api/polls/:id", (req, res) => {
  const poll = findPoll(req.params.id);
  if (!poll) return res.status(404).json({ error: "Poll not found." });
  res.json(pollPayload(poll));
});

// Submit a vote
app.post("/api/polls/:id/vote", (req, res) => {
  const poll = findPoll(req.params.id);
  if (!poll) return res.status(404).json({ error: "Poll not found." });

  const { optionIds, voterToken } = req.body || {};
  if (!voterToken || typeof voterToken !== "string") {
    return res.status(400).json({ error: "Missing voter token." });
  }

  let selected = Array.isArray(optionIds) ? optionIds : [optionIds];
  selected = selected.filter((id) => typeof id === "string" && id);

  if (selected.length === 0) {
    return res.status(400).json({ error: "Please select an option." });
  }
  if (!poll.allow_multiple && selected.length > 1) {
    return res
      .status(400)
      .json({ error: "This poll only allows a single choice." });
  }

  // Validate options belong to this poll
  for (const optId of selected) {
    if (optionBelongsToPoll.get(poll.id, optId).n === 0) {
      return res.status(400).json({ error: "Invalid option selected." });
    }
  }

  // Duplicate vote prevention (per voter token)
  if (countVotesByToken.get(poll.id, voterToken).n > 0) {
    return res
      .status(409)
      .json({ error: "You have already voted in this poll." });
  }

  for (const optId of selected) {
    insertVote.run(randomUUID(), poll.id, optId, voterToken);
  }

  res.status(201).json({ ok: true });
});

// Get results
app.get("/api/polls/:id/results", (req, res) => {
  const poll = findPoll(req.params.id);
  if (!poll) return res.status(404).json({ error: "Poll not found." });

  const rows = getResults.all(poll.id);
  const total = rows.reduce((sum, r) => sum + r.votes, 0);

  res.json({
    id: poll.id,
    title: poll.title,
    description: poll.description,
    totalVotes: total,
    results: rows.map((r) => ({
      optionId: r.option_id,
      text: r.option_text,
      votes: r.votes,
      percentage: total > 0 ? Math.round((r.votes / total) * 1000) / 10 : 0,
    })),
  });
});

app.listen(PORT, () => {
  console.log(`Poll MVP running at http://localhost:${PORT}`);
});

import { scryptSync, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import db from "./db.js";

const getUserByToken = db.prepare(
  `SELECT u.id, u.email, u.username, u.display_name, u.created_at
   FROM sessions s
   JOIN users u ON u.id = s.user_id
   WHERE s.token = ?`
);
const insertSession = db.prepare(
  `INSERT INTO sessions (token, user_id) VALUES (?, ?)`
);
const deleteSession = db.prepare(`DELETE FROM sessions WHERE token = ?`);

export function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(password, stored) {
  const [salt, key] = String(stored).split(":");
  if (!salt || !key) return false;
  const keyBuffer = Buffer.from(key, "hex");
  const derived = scryptSync(password, salt, 64);
  return keyBuffer.length === derived.length && timingSafeEqual(keyBuffer, derived);
}

export function createSession(userId) {
  const token = randomUUID();
  insertSession.run(token, userId);
  return token;
}

export function destroySession(token) {
  if (token) deleteSession.run(token);
}

export function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.display_name,
    createdAt: user.created_at,
  };
}

function readToken(req) {
  const header = req.headers.authorization || "";
  if (header.startsWith("Bearer ")) return header.slice(7).trim();
  return null;
}

// Attaches req.user when a valid session token is present (no error otherwise).
export function attachUser(req, _res, next) {
  const token = readToken(req);
  if (token) {
    const user = getUserByToken.get(token);
    if (user) {
      req.user = user;
      req.token = token;
    }
  }
  next();
}

// Blocks the request with 401 when no valid session is present.
export function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required." });
  }
  next();
}

const TOKEN_KEY = "authToken";

const Auth = {
  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },
  setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
  },
  clearToken() {
    localStorage.removeItem(TOKEN_KEY);
  },
  // fetch wrapper that attaches the Bearer token
  async fetch(url, options = {}) {
    const headers = { ...(options.headers || {}) };
    const token = Auth.getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    return fetch(url, { ...options, headers });
  },
  async me() {
    const token = Auth.getToken();
    if (!token) return null;
    try {
      const res = await Auth.fetch("/api/auth/me");
      if (!res.ok) return null;
      const data = await res.json();
      return data.user;
    } catch {
      return null;
    }
  },
  async logout() {
    try {
      await Auth.fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore network errors on logout
    }
    Auth.clearToken();
    location.href = "/login.html";
  },
  // Redirect to login if not authenticated; returns the user otherwise.
  async requireUser() {
    const user = await Auth.me();
    if (!user) {
      location.href = "/login.html";
      return null;
    }
    return user;
  },
};

window.Auth = Auth;

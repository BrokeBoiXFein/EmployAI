// ============================================================
// API wrapper — centralizes base URL + auth header injection
// ============================================================
// Why this exists: without a wrapper, EVERY component would have
// to (a) know the API URL, (b) remember to add the auth header,
// (c) handle 401s consistently. Wrapping once = those concerns
// live in one file.
// ============================================================

const API_URL = import.meta.env.VITE_API_URL || 'https://employai-backend-v2.onrender.com';

// We store the JWT in localStorage. Trade-off:
//   ✓ survives page reloads (vs. in-memory only)
//   ✗ vulnerable to XSS if our site had a script injection vuln
// For now this is fine — we're not handling banking data. Could
// upgrade to httpOnly cookies later if we add a session backend.
const TOKEN_KEY = 'employai_token';

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY)
};

// Build standard headers, optionally adding Authorization if we have a token
function buildHeaders(extra = {}) {
  const headers = { 'Content-Type': 'application/json', ...extra };
  const token = tokenStorage.get();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

// Core request function. All HTTP verbs go through this.
// Throws on non-2xx so callers can `try/catch` cleanly.
async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: buildHeaders(options.headers)
  });

  // Try to parse JSON, but don't crash on empty bodies
  let data = null;
  const text = await res.text();
  if (text) {
    try { data = JSON.parse(text); } catch { /* non-JSON response */ }
  }

  if (!res.ok) {
    // If the server says our token is bad, clear it so the user
    // gets bounced to login on the next protected fetch.
    if (res.status === 401) tokenStorage.clear();
    const err = new Error((data && data.error) || `Request failed: ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

// Public API methods — readable helpers built on top of `request`
export const api = {
  get:   (path)       => request(path),
  post:  (path, body) => request(path, { method: 'POST',  body: body !== undefined ? JSON.stringify(body) : undefined }),
  put:   (path, body) => request(path, { method: 'PUT',   body: JSON.stringify(body) }),
  patch: (path, body) => request(path, { method: 'PATCH', body: JSON.stringify(body) }),
  del:   (path)       => request(path, { method: 'DELETE' }),

  // Special-case: file upload (FormData, no Content-Type — browser sets it)
  postFormData: async (path, formData) => {
    const token = tokenStorage.get();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await fetch(`${API_URL}${path}`, { method: 'POST', body: formData, headers });
    const data = await res.json();
    if (!res.ok) {
      if (res.status === 401) tokenStorage.clear();
      throw new Error(data.error || `Upload failed: ${res.status}`);
    }
    return data;
  }
};

export { API_URL };

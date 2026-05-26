// ============================================================
// Auth store — Zustand
// ============================================================
// Zustand is a tiny state-management library (~1KB). Why use it
// instead of plain useState + prop drilling?
//   - The user object needs to be available in MANY components:
//     Navbar, ProtectedRoute, Analyzer, Dashboard, etc.
//   - Passing it through every layer of props is painful.
//   - React Context works but causes re-renders everywhere.
//   - Zustand: define state in one file, any component subscribes
//     to just the slices it needs.
//
// Robotics analogy: it's like a shared sensor reading on the
// bot. Any subsystem can read "current heading" without HAVING to
// pass it down through the command tree.
// ============================================================

import { create } from 'zustand';
import { api, tokenStorage } from '../services/api';

export const useAuth = create((set, get) => ({
  // --- State ---
  user: null,        // null = not logged in
  loading: true,     // true on first app load while we check the token
  error: null,

  // --- Actions ---

  // Called once at app mount. If a token exists in localStorage,
  // try to fetch the user. If the token is invalid (401), api.js
  // already cleared it; we just end up with user: null.
  init: async () => {
    if (!tokenStorage.get()) {
      set({ loading: false });
      return;
    }
    try {
      const { user } = await api.get('/api/auth/me');
      set({ user, loading: false });
    } catch (err) {
      set({ user: null, loading: false });
    }
  },

  signup: async ({ email, password, name, preferredLanguage }) => {
    set({ error: null });
    try {
      const { token, user } = await api.post('/api/auth/signup', {
        email, password, name, preferredLanguage
      });
      tokenStorage.set(token);
      set({ user });
      return user;
    } catch (err) {
      set({ error: err.message });
      throw err; // re-throw so the form can react
    }
  },

  login: async ({ email, password }) => {
    set({ error: null });
    try {
      const { token, user } = await api.post('/api/auth/login', { email, password });
      tokenStorage.set(token);
      set({ user });
      return user;
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  logout: () => {
    tokenStorage.clear();
    set({ user: null, error: null });
  },

  clearError: () => set({ error: null })
}));

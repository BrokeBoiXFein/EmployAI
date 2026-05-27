// ============================================================
// Theme store — light / dark with persistence
// ============================================================
// Mirrors the FOUC-prevention script in index.html — when those
// two diverge, the page flashes the wrong theme on first paint.
//
// Behavior:
//   - First visit: follow OS preference (prefers-color-scheme)
//   - User clicks toggle: set explicit choice, persist to localStorage
//   - Subsequent visits: use stored choice
//
// We toggle by adding/removing a `.dark` class on <html>. Tailwind's
// `dark:` variants then activate (configured in src/index.css via
// @custom-variant dark).
// ============================================================

import { create } from 'zustand';

const STORAGE_KEY = 'employai_theme';

function applyToDom(theme) {
  const root = document.documentElement;
  if (theme === 'dark') root.classList.add('dark');
  else root.classList.remove('dark');
}

function readInitial() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch (_) { /* ignore */ }
  // No stored choice — match the OS so first-time visitors get the
  // theme they're used to elsewhere
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}

export const useTheme = create((set, get) => ({
  theme: readInitial(),

  // Apply current theme to the DOM. Call once at app mount.
  init: () => {
    applyToDom(get().theme);
  },

  // Explicit user choice — persists.
  setTheme: (theme) => {
    if (theme !== 'light' && theme !== 'dark') return;
    try { localStorage.setItem(STORAGE_KEY, theme); } catch (_) { /* ignore */ }
    set({ theme });
    applyToDom(theme);
  },

  // Convenience: flip current theme.
  toggle: () => {
    get().setTheme(get().theme === 'dark' ? 'light' : 'dark');
  }
}));

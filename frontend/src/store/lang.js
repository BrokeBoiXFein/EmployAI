// ============================================================
// Language store — current UI language + translations
// ============================================================
// Mirrors the theme store pattern: persists to localStorage, defaults
// to the user's stored choice or "en". Any component can read the
// current translations bundle without prop drilling.
//
// Usage:
//   const t = useLang(s => s.t);
//   t.navHome  -> 'Home' / 'Inicio' / 'Accueil' / ...
//
//   const setLang = useLang(s => s.setLang);
//   setLang('es');
// ============================================================

import { create } from 'zustand';
import { translations } from '../constants';

const STORAGE_KEY = 'employai_lang';

function readInitial() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored && translations[stored]) return stored;
    } catch (_) { /* ignore */ }
    // Fall back to browser language if we support it
    if (typeof navigator !== 'undefined' && navigator.language) {
        const code = navigator.language.slice(0, 2).toLowerCase();
        if (translations[code]) return code;
    }
    return 'en';
}

export const useLang = create((set, get) => ({
    lang: readInitial(),
    t: translations[readInitial()] || translations.en,

    setLang: (code) => {
        if (!translations[code]) return;
        try { localStorage.setItem(STORAGE_KEY, code); } catch (_) { /* ignore */ }
        set({ lang: code, t: translations[code] });
    }
}));

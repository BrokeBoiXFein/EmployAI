import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { translations } from './constants';
import { useAuth } from './store/auth';
import { useTheme } from './store/theme';

// Component Imports
import Navbar from './components/Navbar';
import Home from './components/Home';
import Analyzer from './components/Analyzer';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Resumes from './pages/Resumes';
import Jobs from './pages/Jobs';
import Editor from './pages/Editor';

export default function App() {
  const [language, setLanguage] = useState('en');
  const t = translations[language];
  const init = useAuth(s => s.init);
  const initTheme = useTheme(s => s.init);

  // On first mount: hydrate user from token + apply theme to DOM.
  // The theme class is already set by the inline script in index.html
  // (no-flash); this call just keeps the Zustand store in sync.
  useEffect(() => { init(); initTheme(); }, [init, initTheme]);

  return (
    <Router basename={import.meta.env.BASE_URL}>
      <div className={`app-container min-h-screen pb-20`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <Navbar
          language={language}
          setLanguage={setLanguage}
          translations={translations}
        />

        {/* The shared layout: just top-padding to clear the fixed Navbar.
            Each page sets its own max-width and horizontal padding — Home
            uses full-width sections, app pages use a centered container. */}
        <main className="pt-16">
          <Routes>
            <Route path="/" element={<Home t={t} />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup language={language} />} />
            <Route
              path="/analyze"
              element={
                <ProtectedRoute>
                  <Analyzer
                    language={language}
                    t={t}
                    translations={translations}
                    setLanguage={setLanguage}
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/resumes"
              element={
                <ProtectedRoute>
                  <Resumes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/jobs"
              element={
                <ProtectedRoute>
                  <Jobs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/editor"
              element={
                <ProtectedRoute>
                  <Editor />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
